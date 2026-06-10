import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  renderMediaOnLambda,
  getRenderProgress,
  getFunctions,
  type FunctionInfo,
} from "@remotion/lambda";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─── Constants ──────────────────────────────────────────────────────────────

const VALID_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-central-1",
  "ap-northeast-1", "ap-southeast-1", "ap-southeast-2", "ap-south-1",
] as const;
type ValidRegion = (typeof VALID_REGIONS)[number];

const EXPORTS_BUCKET = process.env.AWS_EXPORTS_BUCKET ?? "nxtgen-completed-exports";
const SOURCE_BUCKET  = process.env.AWS_S3_BUCKET ?? "nxtgencaption-export";
const AWS_REGION     = (process.env.AWS_REGION ?? "ap-south-1") as ValidRegion;

const REMOTION_REGION = (
  VALID_REGIONS.includes(process.env.REMOTION_AWS_REGION as any)
    ? process.env.REMOTION_AWS_REGION
    : VALID_REGIONS.includes(process.env.REMOTION_REGION as any)
    ? process.env.REMOTION_REGION
    : "ap-south-1"
) as ValidRegion;

const REMOTION_FUNCTION_NAME =
  process.env.REMOTION_FUNCTION_NAME ?? "remotion-render";

// Plan resolution caps
const PLAN_MAX_RES: Record<string, number> = {
  FREE:     720,
  EDITOR:   1080,
  CREATOR:  2160,
  BUSINESS: 2160,
};

import { s3Client } from "@/lib/s3";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getRemotionFunction(): Promise<FunctionInfo> {
  const fns = await getFunctions({ region: REMOTION_REGION, compatibleOnly: true });
  if (!fns.length) throw new Error("No Remotion Lambda function found. Deploy one first.");
  return fns.find((f) => f.functionName === REMOTION_FUNCTION_NAME) ?? fns[0];
}

async function getPresignedSourceUrl(key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: SOURCE_BUCKET, Key: key });
  return getSignedUrl(s3Client, cmd, { expiresIn: 7200 });
}

async function getPresignedDownloadUrl(bucket: string, key: string): Promise<string> {
  const isWebm = key.endsWith(".webm");
  const ext = isWebm ? "webm" : "mp4";
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    // Force browser download with a nice filename
    // @ts-ignore
    ResponseContentDisposition: `attachment; filename="NxtGen-Export.${ext}"`,
  });
  return getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
}

// ─── POST /api/export — start Lambda render ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const {
      videoKey,
      captions,
      style,
      projectName,
      requestedRes = 720,
      bitrate = "auto",
      showWatermark = true,
      alphaChannel = false,
      srtExport = false,
      duration,
      fps = 30,
      aspectRatio = "16:9",
      originalVideoWidth,
      originalVideoHeight,
    } = body;

    if (!videoKey || !captions || !duration) {
      return NextResponse.json(
        { error: "Missing required fields: videoKey, captions, duration" },
        { status: 400 }
      );
    }

    // Fetch user plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true },
    });
    const planType  = user?.planType ?? "FREE";
    const maxRes    = PLAN_MAX_RES[planType] ?? 720;
    const finalRes  = Math.min(requestedRes, maxRes);

    const isPremiumLocked = planType === "FREE" || planType === "EDITOR";
    const finalAlphaChannel = alphaChannel && !isPremiumLocked;

    // Dimensions
    let width: number;
    let height: number;

    console.log(`[Export] originalVideoWidth=${originalVideoWidth}, originalVideoHeight=${originalVideoHeight}, aspectRatio=${aspectRatio}, finalRes=${finalRes}`);

    if (originalVideoWidth && originalVideoHeight) {
      // Calculate scaling factor to fit within finalRes while maintaining exact aspect ratio
      const isPortrait = originalVideoHeight > originalVideoWidth;
      console.log(`[Export] isPortrait=${isPortrait}, calc: width=${finalRes}*(${originalVideoHeight}/${originalVideoWidth})`);
      if (isPortrait) {
        // For portrait, the requested resolution generally bounds the width (e.g. 1080 width)
        width = finalRes;
        height = Math.round(finalRes * (originalVideoHeight / originalVideoWidth));
      } else {
        // For landscape, the requested resolution generally bounds the height (e.g. 1080 height)
        height = finalRes;
        width = Math.round(finalRes * (originalVideoWidth / originalVideoHeight));
      }

      // Ensure even numbers for H.264
      width = width % 2 !== 0 ? width + 1 : width;
      height = height % 2 !== 0 ? height + 1 : height;
    } else if (aspectRatio === "9:16") {
      width = finalRes;
      height = Math.round(finalRes * (16 / 9));
    } else {
      width = Math.round(finalRes * (16 / 9));
      height = finalRes;
    }

    console.log(`[Export] Final dimensions: ${width}x${height}`);

    // Source video presigned URL
    const videoUrl = await getPresignedSourceUrl(videoKey);

    // Lambda function
    let fn: FunctionInfo;
    try {
      fn = await getRemotionFunction();
    } catch (e) {
      return NextResponse.json(
        { error: "Remotion Lambda not configured. Deploy a function first." },
        { status: 500 }
      );
    }

    const serveUrl = process.env.REMOTION_SITE_URL;
    if (!serveUrl) throw new Error("REMOTION_SITE_URL not set");

    const timestamp  = Date.now();
    const outKey     = `users/${userId}/exports/${timestamp}-${(projectName ?? "export").replace(/[^a-z0-9]/gi, "_")}.${finalAlphaChannel ? "webm" : "mp4"}`;

    const inputProps = {
      src: videoUrl,
      durationInSeconds: duration,
      captions,
      style: {
        ...style,
        layout: style?.layout ?? "bottom",
        alphaChannel: finalAlphaChannel,
      },
      width,
      height,
      fps,
      showWatermark: planType === "FREE" ? true : showWatermark,
    };

    console.log(`[Export] Starting Lambda render for ${userId} @ ${finalRes}p, alphaChannel=${finalAlphaChannel}`);

    // AWS new account concurrency limit is 10.
    // Calculate framesPerLambda to spawn at most 8 Lambdas to avoid TooManyRequestsException.
    const totalFrames = duration * fps;
    const MAX_CONCURRENT_LAMBDAS = 8;
    const calculatedFramesPerLambda = Math.max(40, Math.ceil(totalFrames / MAX_CONCURRENT_LAMBDAS));

    const remotionOptions: any = {
      region:        REMOTION_REGION,
      functionName:  fn.functionName,
      serveUrl,
      composition:   "CaptionVideo",
      inputProps,
      codec:         finalAlphaChannel ? "vp9" : "h264",
      framesPerLambda: calculatedFramesPerLambda,
      logLevel:      "warn",
      privacy:       "no-acl",
      outName: {
        bucketName: EXPORTS_BUCKET,
        key:        outKey,
      },
    };

    if (finalAlphaChannel) {
      remotionOptions.transparent = true;
      remotionOptions.imageFormat = "png";
      remotionOptions.pixelFormat = "yuva420p";
    }

    const result = await renderMediaOnLambda(remotionOptions);

    console.log(`[Export] Render started: ${result.renderId}`);

    return NextResponse.json({
      success:  true,
      renderId: result.renderId,
      bucketName: result.bucketName ?? EXPORTS_BUCKET,
      outKey,
      finalRes,
      planType,
    });
  } catch (err: any) {
    console.error("[Export] Error:", err);

    if (
      err.name === "TooManyRequestsException" ||
      err.code === "TooManyRequestsException" ||
      err.$metadata?.httpStatusCode === 429 ||
      (err.message && err.message.includes("TooManyRequestsException")) ||
      (err.message && err.message.includes("Rate exceeded"))
    ) {
      console.warn("[Export] Lambda concurrency limit reached (TooManyRequestsException). Requesting frontend to Queue render.");
      return NextResponse.json(
        {
          error: "AWS Lambda concurrency limit reached. Please Queue the render.",
          code: "TooManyRequestsException",
          shouldQueue: true
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err?.message ?? "Failed to start render" },
      { status: 500 }
    );
  }
}

// ─── GET /api/export?renderId=...&bucketName=... — poll progress ─────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const renderId   = searchParams.get("renderId");
    const bucketName = searchParams.get("bucketName") ?? EXPORTS_BUCKET;
    const outKey     = searchParams.get("outKey") ?? "";

    if (!renderId) {
      return NextResponse.json({ error: "renderId required" }, { status: 400 });
    }

    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: REMOTION_FUNCTION_NAME,
      region:       REMOTION_REGION,
    });

    // Build download URL when done
    let downloadUrl: string | null = null;
    let downloadError: string | null = null;
    if (progress.done) {
      console.log("[Export] Render done. Progress object:", JSON.stringify({
        outKey: (progress as any).outKey,
        outputFile: progress.outputFile,
        bucketName
      }));
      try {
        if (progress.outputFile) {
          let bucket: string | undefined;
          let key: string | undefined;

          if (progress.outputFile.startsWith("s3://")) {
            const match = progress.outputFile.match(/s3:\/\/([^/]+)\/(.+)/);
            if (match) { bucket = match[1]; key = match[2]; }
          } else if (progress.outputFile.startsWith("https://s3")) {
            // Path-style: https://s3.region.amazonaws.com/bucket/key
            const match = progress.outputFile.match(/https:\/\/s3[^/]*\.amazonaws\.com\/([^/]+)\/(.+)/);
            if (match) { bucket = match[1]; key = match[2]; }
          } else if (progress.outputFile.startsWith("https://")) {
            // Virtual-hosted style: https://bucket.s3.region.amazonaws.com/key
            const match = progress.outputFile.match(/https:\/\/([^.]+)\.s3[^/]*\/(.+)/);
            if (match) { bucket = match[1]; key = match[2]; }
          }

          if (bucket && key) {
            downloadUrl = await getPresignedDownloadUrl(bucket, key);
          } else {
            downloadError = "Could not parse bucket and key from outputFile: " + progress.outputFile;
          }
        } else {
          // Fallback if outputFile is not available
          const finalKey = (progress as any).outKey || outKey;
          downloadUrl = await getPresignedDownloadUrl(EXPORTS_BUCKET, finalKey);
        }
      } catch (e: any) {
        downloadError = e.message || "Failed to generate presigned URL";
        console.warn("[Export] Could not generate download URL:", e);
      }
    }

    return NextResponse.json({
      done:         progress.done,
      overallProgress: progress.overallProgress,
      errors:       progress.errors,
      fatalErrorEncountered: progress.fatalErrorEncountered,
      downloadUrl,
      downloadError,
      costs:        progress.costs,
    });
  } catch (err: any) {
    console.error("[Export] Progress poll error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to get progress" },
      { status: 500 }
    );
  }
}
