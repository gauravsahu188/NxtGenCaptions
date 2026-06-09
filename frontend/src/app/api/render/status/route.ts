import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRenderProgress } from "@remotion/lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

const AWS_REGION = process.env.AWS_REGION ?? "ap-south-1";
const EXPORTS_BUCKET = process.env.AWS_EXPORTS_BUCKET ?? "nxtgen-completed-exports";

// Valid regions
const VALID_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-central-1",
  "ap-northeast-1", "ap-southeast-1", "ap-southeast-2", "ap-south-1"
] as const;

const REMOTION_REGION = (VALID_REGIONS.includes(process.env.REMOTION_REGION as typeof VALID_REGIONS[number])
  ? process.env.REMOTION_REGION
  : "ap-south-1") as typeof VALID_REGIONS[number];

const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME ?? "remotion-render";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const renderId = searchParams.get("renderId");

    if (!renderId) {
      return NextResponse.json(
        { error: "Missing renderId parameter" },
        { status: 400 }
      );
    }

    // Get render progress from Remotion Lambda
    const progress = await getRenderProgress({
      region: REMOTION_REGION,
      functionName: REMOTION_FUNCTION_NAME,
      bucketName: EXPORTS_BUCKET,
      renderId,
    });

    // Check if render is complete
    if (progress.done) {
      // Generate presigned URL for the output file
      let downloadUrl: string | null = null;

      if (progress.outputFile) {
        try {
          // Parse bucket and key from the output file path
          const bucketMatch = progress.outputFile.match(/s3:\/\/([^/]+)\/(.+)/);
          if (bucketMatch) {
            const [, bucket, key] = bucketMatch;
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 });
          }
        } catch (s3Error) {
          console.warn("[RenderStatus] Failed to generate presigned URL:", s3Error);
        }
      }

      return NextResponse.json({
        status: "complete",
        renderId,
        downloadUrl: downloadUrl ?? progress.outputFile,
        timeToFinish: progress.timeToFinish,
      });
    }

    // Render in progress - return progress info
    return NextResponse.json({
      status: "in_progress",
      renderId,
      overallProgress: progress.overallProgress,
      bucket: progress.bucket,
    });
  } catch (error) {
    console.error("[RenderStatus] Error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Render not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get render status" },
      { status: 500 }
    );
  }
}