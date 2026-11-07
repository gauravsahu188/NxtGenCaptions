/**
 * POST /api/mcp/style
 *
 * Update the caption style and/or export settings for an MCP session.
 * Called by MCP tools: set_caption_style, set_export_settings.
 * Returns the updated session summary.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMcpKey, logToolCall } from "@/lib/mcp-auth";

// Valid resolutions per plan
const PLAN_MAX_RES: Record<string, number> = {
  FREE: 720,
  EDITOR: 1080,
  CREATOR: 2160,
  BUSINESS: 2160,
  TRIAL_1_INR: 720,
  TRIAL_9_INR: 720,
};

// Valid bitrate values
const VALID_BITRATES = ["auto", "1M", "2M", "4M", "6M", "8M", "12M", "16M"];

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const auth = await validateMcpKey(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { sessionId, style, requestedRes, bitrate, captions } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await prisma.mcpSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== auth.userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Validate resolution against plan
    if (requestedRes !== undefined) {
      const maxRes = PLAN_MAX_RES[auth.planType] ?? 720;
      if (requestedRes > maxRes) {
        return NextResponse.json(
          {
            error: `Your ${auth.planType} plan supports up to ${maxRes}p. Requested: ${requestedRes}p.`,
            maxAllowed: maxRes,
          },
          { status: 403 }
        );
      }
      if (![480, 720, 1080, 1440, 2160].includes(requestedRes)) {
        return NextResponse.json(
          { error: "requestedRes must be one of: 480, 720, 1080, 1440, 2160" },
          { status: 400 }
        );
      }
    }

    // Validate bitrate
    if (bitrate !== undefined && !VALID_BITRATES.includes(bitrate)) {
      return NextResponse.json(
        { error: `bitrate must be one of: ${VALID_BITRATES.join(", ")}` },
        { status: 400 }
      );
    }

    // Merge style with existing session style
    const existingStyle = (session.style as Record<string, any>) ?? {};
    const mergedStyle = style ? { ...existingStyle, ...style } : existingStyle;

    // Enforce caption width safety — cap at 95% of video width representation
    if (mergedStyle.width !== undefined) {
      mergedStyle.width = Math.min(Number(mergedStyle.width), 95);
    }

    // Clamp font size to reasonable bounds (prevents captions overflowing)
    if (mergedStyle.fontSize !== undefined) {
      mergedStyle.fontSize = Math.max(16, Math.min(Number(mergedStyle.fontSize), 120));
    }

    const updateData: any = { style: mergedStyle };
    if (requestedRes !== undefined) updateData.requestedRes = requestedRes;
    if (bitrate !== undefined) updateData.bitrate = bitrate;
    if (captions !== undefined) updateData.captions = captions;

    const updated = await prisma.mcpSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    await logToolCall(auth.apiKeyId, "set_style", "success", Date.now() - t0);

    return NextResponse.json({
      sessionId,
      style: updated.style,
      requestedRes: updated.requestedRes,
      bitrate: updated.bitrate,
      previewUrl: `${process.env.NEXTAUTH_URL}/editor?session=${sessionId}`,
    });
  } catch (err: any) {
    await logToolCall(auth.apiKeyId, "set_style", "error", Date.now() - t0);
    console.error("[MCP/style] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
