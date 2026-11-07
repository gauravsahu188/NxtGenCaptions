/**
 * POST /api/mcp/render
 *
 * Step 5 of the MCP workflow. Triggers a Remotion Lambda render
 * using the session's stored captions, style, resolution and bitrate.
 * Returns { renderId, bucketName, outKey, estimatedMinutes }.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMcpKey, logToolCall } from "@/lib/mcp-auth";
import {
  renderMediaOnLambda,
  getFunctions,
  type FunctionInfo,
} from "@remotion/lambda";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

const VALID_REGIONS = [
  "us-east-1","us-east-2","us-west-1","us-west-2",
  "eu-west-1","eu-west-2","eu-central-1",
  "ap-northeast-1","ap-southeast-1","ap-southeast-2","ap-south-1",
] as const;
type ValidRegion = (typeof VALID_REGIONS)[number];

const EXPORTS_BUCKET = process.env.AWS_EXPORTS_BUCKET ?? "nxtgen-completed-exports";
const SOURCE_BUCKET  = process.env.AWS_S3_BUCKET ?? "nxtgencaption-export";
const REMOTION_REGION = (
  VALID_REGIONS.includes(process.env.REMOTION_AWS_REGION as any)
    ? process.env.REMOTION_AWS_REGION
    : "ap-south-1"
) as ValidRegion;
const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME ?? "remotion-render";

const PLAN_MAX_RES: Record<string, number> = {
  FREE: 720, EDITOR: 1080, CREATOR: 2160, BUSINESS: 2160,
  TRIAL_1_INR: 720, TRIAL_9_INR: 720,
};

async function getRemotionFn(): Promise<FunctionInfo> {
  const fns = await getFunctions({ region: REMOTION_REGION, compatibleOnly: true });
  if (!fns.length) throw new Error("No Remotion Lambda function found.");
  return fns.find((f) => f.functionName === REMOTION_FUNCTION_NAME) ?? fns[0];
}

async function presignSource(key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: SOURCE_BUCKET, Key: key });
  return getSignedUrl(s3Client, cmd, { expiresIn: 7200 });
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const auth = await validateMcpKey(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await prisma.mcpSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== auth.userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "READY") {
      return NextResponse.json(
        { error: `Session is not ready for rendering. Current status: ${session.status}` },
        { status: 400 }
      );
    }
    if (!session.s3Key || !session.captions || !session.duration) {
      return NextResponse.json({ error: "Session is missing video, captions, or duration" }, { status: 400 });
    }

    const captions = session.captions as any[];
    const style = (session.style ?? {}) as any;
    const requestedRes = session.requestedRes ?? 720;
    const bitrate = session.bitrate ?? "auto";
    const duration = session.duration;
    const fps = 30;

    const maxRes = PLAN_MAX_RES[auth.planType] ?? 720;
    const finalRes = Math.min(requestedRes, maxRes);

    // ── Compute output dimensions ──────────────────────────────────────────
    let width: number, height: number;
    const origW = style.originalVideoWidth;
    const origH = style.originalVideoHeight;
    const isPortraitDefault = origH && origW ? origH > origW : true; // default to portrait if unknown
    const aspectRatio = style.aspectRatio || (isPortraitDefault ? "9:16" : "16:9");

    if (aspectRatio === "9:16") {
      width = finalRes;
      height = Math.round(finalRes * (16 / 9));
    } else if (aspectRatio === "1:1") {
      width = finalRes;
      height = finalRes;
    } else {
      // Default to 16:9 landscape
      width  = Math.round(finalRes * (16 / 9));
      height = finalRes;
    }

    width  = width  % 2 !== 0 ? width  + 1 : width;
    height = height % 2 !== 0 ? height + 1 : height;

    // ── Caption safety: clamp fontSize so text fits within caption box ─────
    const captionWidthPct = Math.min((style.width ?? 80), 95);
    const captionWidthPx  = (captionWidthPct / 100) * width;
    const avgCharsPerLine = 30; // conservative
    const charWidthFactor = 0.55; // fraction of fontSize
    const maxSafeFontSize = Math.floor(captionWidthPx / (avgCharsPerLine * charWidthFactor));
    const rawFontSize = style.fontSize ?? 52;
    const safeFontSize = Math.min(rawFontSize, maxSafeFontSize, 120);

    // Build merged style — spread user style, then enforce safety clamps last
    const mergedStyle = {
      layout: "bottom",
      fontFamily: "Inter",
      fontWeight: "700",
      primaryColor: "#FFFFFF",
      emphasisColor: "#FACC15",
      positionX: 50,
      positionY: 85,
      textAlignment: "center",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowOpacity: 0.8,
      transitionType: "none",
      ...style,
      // Safety clamps always win — these must be last
      fontSize: safeFontSize,
      width: captionWidthPct,
      alphaChannel: false,
    };

    // ── Presigned source URL ───────────────────────────────────────────────
    const videoUrl = await presignSource(session.s3Key);

    // ── Remotion Lambda ────────────────────────────────────────────────────
    const fn = await getRemotionFn();
    const serveUrl = process.env.REMOTION_SITE_URL;
    if (!serveUrl) throw new Error("REMOTION_SITE_URL not set");

    const timestamp = Date.now();
    const outKey = `users/${auth.userId}/mcp-exports/${timestamp}.mp4`;

    const totalFrames = Math.ceil(duration * fps);
    const MAX_CONCURRENT = 8;
    const framesPerLambda = Math.max(40, Math.ceil(totalFrames / MAX_CONCURRENT));

    const inputProps = {
      src: videoUrl,
      durationInSeconds: duration,
      captions,
      style: mergedStyle,
      width,
      height,
      fps,
      showWatermark: auth.planType === "FREE",
    };

    const renderOpts: any = {
      region: REMOTION_REGION,
      functionName: fn.functionName,
      serveUrl,
      composition: "CaptionVideo",
      inputProps,
      codec: "h264",
      framesPerLambda,
      logLevel: "warn",
      privacy: "no-acl",
      outName: { bucketName: EXPORTS_BUCKET, key: outKey },
      offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
    };

    // Apply bitrate if not auto
    if (bitrate !== "auto") {
      renderOpts.videoBitrate = bitrate;
    }

    const result = await renderMediaOnLambda(renderOpts);

    // Mark session as rendering, storing outKey and bucketName in style JSON
    const mergedStyleWithOutKey = {
      ...mergedStyle,
      outKey,
      bucketName: result.bucketName,
    };

    await prisma.mcpSession.update({
      where: { id: sessionId },
      data: {
        status: "RENDERING",
        renderId: result.renderId,
        style: mergedStyleWithOutKey,
      },
    });

    await logToolCall(auth.apiKeyId, "generate_video", "success", Date.now() - t0);

    const estimatedMinutes = Math.max(1, Math.ceil(duration / 60));

    return NextResponse.json({
      renderId: result.renderId,
      bucketName: result.bucketName ?? EXPORTS_BUCKET,
      outKey,
      finalRes,
      dimensions: { width, height },
      estimatedMinutes,
      sessionId,
    });
  } catch (err: any) {
    await logToolCall(auth.apiKeyId, "generate_video", "error", Date.now() - t0);
    console.error("[MCP/render] Error:", err);

    if (
      err.name === "TooManyRequestsException" ||
      (err.message && err.message.includes("TooManyRequests"))
    ) {
      return NextResponse.json(
        { error: "AWS Lambda concurrency limit reached. Please wait 30 seconds and try again.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: err?.message ?? "Failed to start render" }, { status: 500 });
  }
}
