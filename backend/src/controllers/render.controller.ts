import { Request, Response, NextFunction } from "express";
import {
  renderMediaOnLambda,
  getFunctions,
  type FunctionInfo,
} from "@remotion/lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../lib/prisma";

const AWS_REGION = process.env.AWS_REGION ?? "ap-south-1";
const EXPORTS_BUCKET = process.env.AWS_EXPORTS_BUCKET ?? "nxtgen-completed-exports";
const SOURCE_BUCKET = process.env.AWS_S3_BUCKET ?? "nxtgencaption-export";

const REMOTION_REGION = (process.env.REMOTION_AWS_REGION || process.env.REMOTION_REGION || "ap-south-1") as any;
const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME ?? "remotion-render-4-0-457-mem2048mb-disk2048mb-120sec";
const REMOTION_SITE_URL = process.env.REMOTION_SITE_URL ?? "https://remotionlambda-useast1-4vs6zydhbr.s3.us-east-1.amazonaws.com/sites/xxiv6xm77x/index.html";

const VALID_ASPECT_RATIOS = ["16:9", "9:16"] as const;

interface RenderRequest {
  videoKey: string;
  captions: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
    words: Array<{ word: string; start: number; end: number }>;
  }>;
  // Accept the full CaptionStyleProps so no fields are dropped in transit
  style: Record<string, any>;
  aspectRatio: string;
  requestedRes: number;
  duration: number;
}

async function getUserSubscription(userId: string): Promise<{
  maxExportRes: number;
  planType: string;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) return null;

  const maxExportRes =
    user.subscription?.maxExportRes ??
    (user.planType === "EDITOR" ? 1080 : user.planType === "CREATOR" || user.planType === "BUSINESS" ? 2160 : 720);

  return {
    maxExportRes,
    planType: user.subscription?.planType ?? user.planType,
  };
}

function calculateDimensions(
  requestedRes: number,
  aspectRatio: typeof VALID_ASPECT_RATIOS[number]
): { width: number; height: number } {
  if (aspectRatio === "9:16") {
    // For vertical videos, the requested resolution (e.g., 1080) applies to the width
    return { width: requestedRes, height: Math.round(requestedRes * (16 / 9)) };
  } else {
    // For horizontal 16:9 videos, the requested resolution applies to the height
    return { width: Math.round(requestedRes * (16 / 9)), height: requestedRes };
  }
}

async function getVideoPresignedUrl(key: string): Promise<string> {
  const client = new S3Client({ region: AWS_REGION });
  const command = new GetObjectCommand({ Bucket: SOURCE_BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

async function getRemotionFunction(): Promise<FunctionInfo> {
  const functions = await getFunctions({ region: REMOTION_REGION, compatibleOnly: true });
  if (functions.length === 0) {
    throw new Error("No Remotion Lambda function found");
  }
  const fn = functions.find((f) => f.functionName === REMOTION_FUNCTION_NAME);
  return fn ?? functions[0];
}

export class RenderController {
  async renderVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { videoKey, captions, style, aspectRatio, requestedRes, duration } = req.body as RenderRequest;

      // Validate aspect ratio
      if (!VALID_ASPECT_RATIOS.includes(aspectRatio as typeof VALID_ASPECT_RATIOS[number])) {
        return res.status(400).json({
          error: "Invalid aspect ratio",
          details: `Allowed: ${VALID_ASPECT_RATIOS.join(", ")}`,
        });
      }

      // Get user subscription
      const subscription = await getUserSubscription(userId);
      if (!subscription) {
        return res.status(404).json({ error: "User not found" });
      }

      const { maxExportRes, planType } = subscription;
      console.log(`[Render] User ${userId} (${planType}) - maxRes: ${maxExportRes}, requested: ${requestedRes}`);

      // Clamp resolution
      let finalRes = Math.min(requestedRes, maxExportRes);
      if (requestedRes > maxExportRes) {
        console.log(`[Render] Clamping resolution from ${requestedRes}p to ${finalRes}p`);
      }

      // Calculate dimensions
      const dimensions = calculateDimensions(finalRes, aspectRatio as typeof VALID_ASPECT_RATIOS[number]);
      console.log(`[Render] Final dimensions: ${dimensions.width}x${dimensions.height} (${aspectRatio})`);

      // Get video URL
      const videoUrl = await getVideoPresignedUrl(videoKey);

      // Get Lambda function
      const functionInfo = await getRemotionFunction();

      // Prepare composition props — pass style through unchanged so the
      // Remotion overlay renders identically to the editor preview.
      const compositionInputProps = {
        src: videoUrl,
        durationInSeconds: duration,
        captions,
        style,
        width: dimensions.width,
        height: dimensions.height,
        fps: 30,
        showWatermark: planType === "FREE",
      };

      // Trigger render
      const fps = 30;
      const totalFrames = duration * fps;
      
      // AWS new account concurrency limit is often 10.
      // We reserve 1 for orchestrator and maybe 1 for safety, leaving ~8 for rendering chunks.
      const MAX_CONCURRENT_LAMBDAS = 8;
      const calculatedFramesPerLambda = Math.max(30, Math.ceil(totalFrames / MAX_CONCURRENT_LAMBDAS));
      
      console.log(`[Render] Starting Lambda render for user ${userId}`);
      console.log(`[Render] Using site: ${REMOTION_SITE_URL}`);
      console.log(`[Render] totalFrames: ${totalFrames}, framesPerLambda: ${calculatedFramesPerLambda}`);

      const timestamp = Date.now();
      const renderResult = await renderMediaOnLambda({
        region: REMOTION_REGION,
        functionName: functionInfo.functionName,
        serveUrl: REMOTION_SITE_URL,
        composition: "CaptionVideo",
        inputProps: compositionInputProps,
        codec: "h264",
        framesPerLambda: calculatedFramesPerLambda,
        logLevel: "info",
        outName: {
          bucketName: EXPORTS_BUCKET,
          key: `${userId}/exports/${timestamp}-rendered.mp4`,
        },
      });

      console.log(`[Render] Lambda render started: ${renderResult.renderId}`);

      return res.json({
        success: true,
        renderId: renderResult.renderId,
        outputUrl: `s3://${EXPORTS_BUCKET}/${userId}/exports/${timestamp}-rendered.mp4`,
        dimensions,
        message: "Render started. Poll the render status for completion.",
      });
    } catch (error: any) {
      console.error("[Render] Error:", error);

      if (
        error.name === "TooManyRequestsException" ||
        error.code === "TooManyRequestsException" ||
        error.$metadata?.httpStatusCode === 429 ||
        (error.message && error.message.includes("TooManyRequestsException")) ||
        (error.message && error.message.includes("Rate exceeded"))
      ) {
        console.warn("[Render] Lambda concurrency limit reached (TooManyRequestsException). Requesting frontend to Queue render.");
        return res.status(429).json({
          error: "AWS Lambda concurrency limit reached. Please Queue the render.",
          code: "TooManyRequestsException",
          shouldQueue: true
        });
      }

      return res.status(500).json({ error: "Failed to start render" });
    }
  }

  async getRenderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { renderId } = req.query;

      if (!renderId) {
        return res.status(400).json({ error: "Missing renderId parameter" });
      }

      const { getRenderProgress } = await import("@remotion/lambda");

      const progress = await getRenderProgress({
        region: REMOTION_REGION,
        functionName: REMOTION_FUNCTION_NAME,
        bucketName: EXPORTS_BUCKET,
        renderId: renderId as string,
      });

      if (progress.done) {
        let downloadUrl: string | null = null;
        if (progress.outputFile) {
          try {
            const client = new S3Client({ region: AWS_REGION });
            const bucketMatch = progress.outputFile.match(/s3:\/\/([^/]+)\/(.+)/);
            if (bucketMatch) {
              const [, bucket, key] = bucketMatch;
              const command = new GetObjectCommand({ Bucket: bucket, Key: key });
              downloadUrl = await getSignedUrl(client, command, { expiresIn: 86400 });
            }
          } catch (e) {
            console.warn("[RenderStatus] Failed to generate URL:", e);
          }
        }

        return res.json({
          status: "complete",
          renderId,
          downloadUrl: downloadUrl ?? progress.outputFile,
          timeToFinish: progress.timeToFinish,
        });
      }

      return res.json({
        status: "in_progress",
        renderId,
        overallProgress: progress.overallProgress,
        bucket: progress.bucket,
      });
    } catch (error) {
      console.error("[RenderStatus] Error:", error);
      return res.status(500).json({ error: "Failed to get render status" });
    }
  }
}

export const renderController = new RenderController();