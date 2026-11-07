/**
 * POST /api/mcp/transcribe
 *
 * Receives binary video data (forwarded from the MCP server), POSTs it
 * as multipart/form-data to the backend /api/video/upload endpoint (the
 * same endpoint the web UI uses), consumes the SSE stream, and stores
 * the resulting captions in the McpSession.
 *
 * Body: multipart/form-data with fields:
 *   - video: the binary video file
 *   - language, script, audioEnhance, userId
 *   - sessionId: the McpSession id to update
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMcpKey, logToolCall } from "@/lib/mcp-auth";

export const maxDuration = 300; // 5-minute timeout for long videos

export async function POST(request: NextRequest) {
  const t0 = Date.now();

  const auth = await validateMcpKey(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse multipart body
    const formData = await request.formData();
    const language   = (formData.get("language") as string) || "auto";
    const script     = (formData.get("script")   as string) || "native";
    const videoBlob  = formData.get("video") as File | null;

    if (!videoBlob) {
      return NextResponse.json({ error: "video file is required in multipart body" }, { status: 400 });
    }

    // Create a new McpSession (combine upload+transcribe into one step)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await prisma.mcpSession.create({
      data: {
        userId: auth.userId,
        language,
        script,
        status: "TRANSCRIBING",
        expiresAt,
      },
    });
    const sessionId = session.id;

    // Forward to backend /api/video/upload as multipart (same as web UI)
    const backendForm = new FormData();
    backendForm.append("userId", auth.userId);
    backendForm.append("language", language);
    backendForm.append("script", script);
    backendForm.append("audioEnhance", "false");
    backendForm.append("video", videoBlob, videoBlob.name || "video.mp4");

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${BACKEND_URL}/api/video/upload`, {
      method: "POST",
      headers: { "x-user-id": auth.userId },
      body: backendForm,
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend returned ${res.status}: ${text.slice(0, 200)}`);
    }

    // Consume SSE stream from backend
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalCaptions: any[] = [];
    let duration = 0;
    let s3Key = "";

    let originalVideoWidth = 0;
    let originalVideoHeight = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: !done });

      const lines = buffer.split("\n\n");
      if (!done) {
        buffer = lines.pop() || "";
      } else {
        buffer = "";
      }

      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.replace("data: ", ""));
          if (data.type === "complete") {
            finalCaptions = data.captions || [];
            duration      = data.duration || 0;
            if (data.s3Key) s3Key = data.s3Key;
            if (data.dimensions) {
              originalVideoWidth = data.dimensions.width || 0;
              originalVideoHeight = data.dimensions.height || 0;
            }
          } else if (data.type === "error") {
            // Backend sent an error event — surface it immediately
            await prisma.mcpSession.update({
              where: { id: sessionId },
              data: { status: "ERROR" },
            });
            await logToolCall(auth.apiKeyId, "transcribe", "error", Date.now() - t0);
            return NextResponse.json({ error: data.message || "Backend transcription error" }, { status: 422 });
          }
        } catch {
          // ignore malformed events
        }
      }

      if (done) break;
    }

    if (finalCaptions.length === 0) {
      // Empty captions can happen on silent videos — still mark READY so the
      // user can proceed with other steps (template selection, export, etc.)
      console.warn("[MCP/transcribe] Backend returned 0 captions — video may be silent or speech not detected");
    }

    // Infer duration from the last caption's end time if backend didn't send it
    if (!duration && finalCaptions.length > 0) {
      const last = finalCaptions[finalCaptions.length - 1];
      duration = last.end ?? last.endTime ?? 0;
    }

    // Initialize default style with dimensions
    const defaultStyle = {
      originalVideoWidth,
      originalVideoHeight,
      aspectRatio: originalVideoHeight > originalVideoWidth ? "9:16" : "16:9",
    };

    // Store captions + s3Key + defaultStyle in session (s3Key comes from backend upload)
    await prisma.mcpSession.update({
      where: { id: sessionId },
      data: {
        captions: finalCaptions,
        duration,
        s3Key: s3Key || session.s3Key || "",
        status: "READY",
        style: defaultStyle,
      },
    });

    await logToolCall(auth.apiKeyId, "transcribe", "success", Date.now() - t0);

    // Fetch updated user balance
    const dbUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { transcriptionBalance: true }
    });

    return NextResponse.json({
      sessionId,
      captions: finalCaptions,
      duration,
      captionCount: finalCaptions.length,
      s3Key,
      transcriptionBalance: dbUser?.transcriptionBalance || 0,
    });
  } catch (err: any) {
    await logToolCall(auth.apiKeyId, "transcribe", "error", Date.now() - t0);
    console.error("[MCP/transcribe] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/mcp/transcribe?sessionId=...
 * Poll the current status of a transcription session.
 */
export async function GET(request: NextRequest) {
  const auth = await validateMcpKey(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const session = await prisma.mcpSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== auth.userId) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    sessionId,
    status: session.status,
    captionCount: Array.isArray(session.captions) ? (session.captions as any[]).length : 0,
    duration: session.duration,
    captions: session.status === "READY" || session.status === "DONE" ? session.captions : null,
  });
}
