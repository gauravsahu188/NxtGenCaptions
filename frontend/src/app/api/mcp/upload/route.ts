/**
 * POST /api/mcp/upload
 *
 * Step 1 of the MCP workflow. Called by the MCP tool `upload_video`.
 * - Validates the API key
 * - Generates a presigned S3 PUT URL for the video
 * - Creates a McpSession record
 * - Returns { uploadUrl, sessionId, s3Key }
 *
 * The MCP tool then PUT's the video binary to uploadUrl,
 * then calls POST /api/mcp/transcribe with the sessionId.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUploadUrl } from "@/lib/s3";
import { validateMcpKey, logToolCall } from "@/lib/mcp-auth";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mov"];

export async function POST(request: NextRequest) {
  const t0 = Date.now();

  const auth = await validateMcpKey(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized – invalid or missing API key" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileName, fileSize, contentType, language = "auto", script = "native" } = body;

    if (!fileName || !fileSize || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileSize, contentType" },
        { status: 400 }
      );
    }

    // Normalise content type – Claude sometimes sends "video/quicktime" for .mov
    const ct = contentType.toLowerCase();
    if (!ALLOWED_TYPES.some((t) => ct.includes(t.split("/")[1]))) {
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType}. Allowed: mp4, mov, avi, webm` },
        { status: 400 }
      );
    }

    // Check user storage quota
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { subscription: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const storageLimitGb = user.subscription?.storageLimitGb ?? 1;
    const storageLimitBytes = BigInt(storageLimitGb * 1024 * 1024 * 1024);
    if ((user.storageUsed ?? BigInt(0)) + BigInt(fileSize) > storageLimitBytes) {
      return NextResponse.json(
        { error: "Storage quota exceeded. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // Generate S3 key + presigned URL
    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const s3Key = `uploads/${auth.userId}/${timestamp}-${sanitized}`;

    const { uploadUrl } = await generateUploadUrl(s3Key, contentType);

    // Create McpSession
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const session = await prisma.mcpSession.create({
      data: {
        userId: auth.userId,
        s3Key,
        language,
        script,
        status: "UPLOADING",
        expiresAt,
      },
    });

    await logToolCall(auth.apiKeyId, "upload_video", "success", Date.now() - t0);

    return NextResponse.json({
      sessionId: session.id,
      uploadUrl,
      s3Key,
      expiresIn: 900, // 15 minutes for the presigned URL
    });
  } catch (err: any) {
    await logToolCall(auth.apiKeyId, "upload_video", "error", Date.now() - t0);
    console.error("[MCP/upload] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
