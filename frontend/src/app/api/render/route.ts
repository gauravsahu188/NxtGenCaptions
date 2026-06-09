import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  renderMediaOnLambda,
  getFunctions,
  type FunctionInfo,
} from "@remotion/lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Valid AWS regions for Remotion Lambda
const VALID_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-central-1",
  "ap-northeast-1", "ap-southeast-1", "ap-southeast-2", "ap-south-1"
] as const;

// S3 bucket for completed exports
const EXPORTS_BUCKET = process.env.AWS_EXPORTS_BUCKET ?? "nxtgen-completed-exports";

// Default to ap-south-1 if region not in valid list
const REMOTION_REGION = (VALID_REGIONS.includes(process.env.REMOTION_AWS_REGION as any)
  ? process.env.REMOTION_AWS_REGION
  : VALID_REGIONS.includes(process.env.REMOTION_REGION as any)
  ? process.env.REMOTION_REGION
  : "ap-south-1") as typeof VALID_REGIONS[number];

const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME ?? "remotion-render";

// Validate aspect ratios
const VALID_ASPECT_RATIOS = ["16:9", "9:16"] as const;
type AspectRatio = (typeof VALID_ASPECT_RATIOS)[number];

interface RenderRequest {
  videoKey: string;
  captions: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
    words: Array<{ word: string; start: number; end: number }>;
  }>;
  style: {
    template: string;
    fontSize: number;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    glowColor?: string;
    borderRadius?: number;
  };
  aspectRatio: string;
  requestedRes: number;
  duration: number;
}

/**
 * Get user subscription and limits
 */
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

/**
 * Calculate dimensions based on aspect ratio and resolution
 */
function calculateDimensions(
  requestedRes: number,
  aspectRatio: AspectRatio
): { width: number; height: number } {
  const aspectRatioValues = aspectRatio.split(":").map(Number);
  const ratio = aspectRatioValues[0] / aspectRatioValues[1];

  if (aspectRatio === "16:9") {
    return {
      width: Math.round(requestedRes * ratio),
      height: requestedRes,
    };
  } else {
    return {
      width: requestedRes,
      height: Math.round(requestedRes * ratio),
    };
  }
}

/**
 * Get or create the Remotion Lambda function
 */
async function getRemotionFunction(): Promise<FunctionInfo> {
  const functions = await getFunctions({
    region: REMOTION_REGION,
    compatibleOnly: true,
  });

  if (functions.length === 0) {
    throw new Error(
      "No Remotion Lambda function found. Please deploy a Remotion function first."
    );
  }

  const fn = functions.find((f) => f.functionName === REMOTION_FUNCTION_NAME);
  return fn ?? functions[0];
}

/**
 * Generate a presigned URL to GET the source video
 */
async function getVideoPresignedUrl(key: string): Promise<string> {
  const client = new S3Client({ region: process.env.AWS_REGION ?? "ap-south-1" });

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET ?? "nxtgencaption-export",
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse and validate request body
    const body: RenderRequest = await request.json();
    const { videoKey, captions, style, aspectRatio, requestedRes, duration } = body;

    // Validate required fields
    if (!videoKey || !captions || !aspectRatio || !requestedRes) {
      return NextResponse.json(
        { error: "Missing required fields: videoKey, captions, aspectRatio, requestedRes" },
        { status: 400 }
      );
    }

    // 3. Aspect ratio validation
    if (!VALID_ASPECT_RATIOS.includes(aspectRatio as AspectRatio)) {
      return NextResponse.json(
        {
          error: "Invalid aspect ratio",
          details: `Allowed: ${VALID_ASPECT_RATIOS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 4. Fetch user subscription and limits
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { maxExportRes, planType } = subscription;
    console.log(`[Render] User ${userId} (${planType}) - maxRes: ${maxExportRes}, requested: ${requestedRes}`);

    // 5. Resolution clamping
    let finalRes = requestedRes;
    if (requestedRes > maxExportRes) {
      console.log(`[Render] Clamping resolution from ${requestedRes}p to ${maxExportRes}p`);
      finalRes = maxExportRes;
    }

    // 6. Calculate final dimensions
    const dimensions = calculateDimensions(finalRes, aspectRatio as AspectRatio);
    console.log(`[Render] Final dimensions: ${dimensions.width}x${dimensions.height} (${aspectRatio})`);

    // 7. Get signed URL for the source video
    const videoUrl = await getVideoPresignedUrl(videoKey);

    // 8. Get Remotion Lambda function
    let functionInfo: FunctionInfo;
    try {
      functionInfo = await getRemotionFunction();
    } catch (fnError) {
      console.error("[Render] Failed to get Remotion function:", fnError);
      return NextResponse.json(
        { error: "Remotion Lambda not configured. Please deploy a Remotion function." },
        { status: 500 }
      );
    }

    // 9. Prepare render composition input
    const compositionInputProps = {
      src: videoUrl,
      durationInSeconds: duration,
      captions,
      style: {
        ...style,
        layout: "bottom" as const,
      },
      width: dimensions.width,
      height: dimensions.height,
      fps: 30,
      showWatermark: planType === "FREE",
    };

    // 10. Generate output filename
    const timestamp = Date.now();

    // 11. Trigger Remotion Lambda render
    console.log(`[Render] Starting Lambda render for user ${userId}`);
    console.log(`[Render] Function: ${functionInfo.functionName}`);

    // Get site URL from env
    const serveUrl = process.env.REMOTION_SITE_URL;
    if (!serveUrl) {
      throw new Error("REMOTION_SITE_URL is not set in environment variables.");
    }

    // Cast to any to handle potential API changes
    const renderOptions = {
      region: REMOTION_REGION,
      functionName: functionInfo.functionName,
      serveUrl: serveUrl,
      composition: "CaptionVideo",
      inputProps: compositionInputProps,
      codec: "h264" as const,
      framesPerLambda: 30,
      logLevel: "info" as const,
      outName: {
        bucketName: EXPORTS_BUCKET,
        key: `${userId}/exports/${timestamp}-rendered.mp4`
      },
      downloadBehavior: {
        type: "download" as const,
        fileName: "NxtGenExport.mp4"
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderResult = await renderMediaOnLambda(renderOptions as any);

    console.log(`[Render] Lambda render started: ${renderResult.renderId}`);

    // 12. Return response with render info
    return NextResponse.json({
      success: true,
      renderId: renderResult.renderId,
      outputUrl: `s3://${EXPORTS_BUCKET}/${userId}/exports/${timestamp}-rendered.mp4`,
      dimensions,
      message: "Render started. Poll the render status for completion.",
    });
  } catch (error) {
    console.error("[Render] Error:", error);

    const err = error as any;
    if (
      err.name === "TooManyRequestsException" ||
      err.code === "TooManyRequestsException" ||
      err.$metadata?.httpStatusCode === 429 ||
      (err.message && err.message.includes("TooManyRequestsException")) ||
      (err.message && err.message.includes("Rate exceeded"))
    ) {
      console.warn("[Render] Lambda concurrency limit reached (TooManyRequestsException). Requesting frontend to Queue render.");
      return NextResponse.json(
        {
          error: "AWS Lambda concurrency limit reached. Please Queue the render.",
          code: "TooManyRequestsException",
          shouldQueue: true
        },
        { status: 429 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("not configured")) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to start render" },
      { status: 500 }
    );
  }
}