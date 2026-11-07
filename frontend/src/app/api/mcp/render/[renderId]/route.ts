/**
 * GET /api/mcp/render/[renderId]
 *
 * Poll Remotion Lambda render progress.
 * Returns { done, overallProgress, downloadUrl? }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMcpKey } from "@/lib/mcp-auth";
import { getRenderProgress, getFunctions, type FunctionInfo } from "@remotion/lambda";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

const EXPORTS_BUCKET = process.env.AWS_EXPORTS_BUCKET ?? "nxtgen-completed-exports";
const VALID_REGIONS = [
  "us-east-1","us-east-2","us-west-1","us-west-2",
  "eu-west-1","eu-west-2","eu-central-1",
  "ap-northeast-1","ap-southeast-1","ap-southeast-2","ap-south-1",
] as const;
type ValidRegion = (typeof VALID_REGIONS)[number];

const REMOTION_REGION = (
  VALID_REGIONS.includes(process.env.REMOTION_AWS_REGION as any)
    ? process.env.REMOTION_AWS_REGION
    : "ap-south-1"
) as ValidRegion;
const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME ?? "remotion-render";

async function getDownloadUrl(outputFile: string): Promise<string | null> {
  try {
    let bucket: string | undefined;
    let key: string | undefined;

    if (outputFile.startsWith("s3://")) {
      const m = outputFile.match(/s3:\/\/([^/]+)\/(.+)/);
      if (m) { bucket = m[1]; key = m[2]; }
    } else if (outputFile.startsWith("https://s3")) {
      const m = outputFile.match(/https:\/\/s3[^/]*\.amazonaws\.com\/([^/]+)\/(.+)/);
      if (m) { bucket = m[1]; key = m[2]; }
    } else if (outputFile.startsWith("https://")) {
      const m = outputFile.match(/https:\/\/([^.]+)\.s3[^/]*\/(.+)/);
      if (m) { bucket = m[1]; key = m[2]; }
    }

    if (!bucket || !key) {
      bucket = EXPORTS_BUCKET;
      key = outputFile;
    }

    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      // @ts-ignore
      ResponseContentDisposition: `attachment; filename="NxtGen-Captions-Export.mp4"`,
    });
    return getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
  } catch {
    return null;
  }
}

async function getRemotionFn(): Promise<FunctionInfo> {
  const fns = await getFunctions({ region: REMOTION_REGION, compatibleOnly: true });
  if (!fns.length) throw new Error("No Remotion Lambda function found.");
  return fns.find((f) => f.functionName === REMOTION_FUNCTION_NAME) ?? fns[0];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ renderId: string }> }
) {
  const auth = await validateMcpKey(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { renderId } = await params;
  if (!renderId) return NextResponse.json({ error: "renderId required" }, { status: 400 });

  try {
    const session = await prisma.mcpSession.findFirst({
      where: { renderId, userId: auth.userId },
    });
    const styleObj = (session?.style ?? {}) as any;
    const bucketName = styleObj.bucketName || "remotionlambda-apsouth1-t3equw24xa";

    const fn = await getRemotionFn();
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: fn.functionName,
      region: REMOTION_REGION,
    });

    let downloadUrl: string | null = null;

    if (progress.done) {
      // Update session status to DONE
      await prisma.mcpSession
        .updateMany({
          where: { renderId, userId: auth.userId },
          data: { status: "DONE" },
        })
        .catch(() => {});

      const outputFile = progress.outputFile ?? "";
      downloadUrl = await getDownloadUrl(outputFile);
    }

    if (progress.fatalErrorEncountered) {
      await prisma.mcpSession
        .updateMany({
          where: { renderId, userId: auth.userId },
          data: { status: "ERROR" },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      renderId,
      done: progress.done,
      overallProgress: Math.round((progress.overallProgress ?? 0) * 100),
      fatalErrorEncountered: progress.fatalErrorEncountered,
      errors: progress.errors ?? [],
      downloadUrl,
      costs: progress.costs,
    });
  } catch (err: any) {
    console.warn("[MCP/render/status] getRenderProgress failed, attempting S3 self-healing check:", err.message);

    // Self-healing fallback:
    // If the AWS IAM credentials do not permit querying Lambda configuration,
    // we query S3 directly to check if the output file key has already been created.
    try {
      const session = await prisma.mcpSession.findFirst({
        where: { renderId, userId: auth.userId },
      });

      const styleObj = (session?.style ?? {}) as any;
      const outKey = styleObj.outKey;

      if (outKey) {
        // Query S3 directly to see if the outKey exists
        try {
          const headCmd = new HeadObjectCommand({ Bucket: EXPORTS_BUCKET, Key: outKey });
          await s3Client.send(headCmd);

          // If no exception, S3 file exists! The render is completed!
          await prisma.mcpSession.update({
            where: { id: session!.id },
            data: { status: "DONE" },
          });

          // Generate download URL
          const getCmd = new GetObjectCommand({
            Bucket: EXPORTS_BUCKET,
            Key: outKey,
            ResponseContentDisposition: `attachment; filename="NxtGen-Captions-Export.mp4"`,
          });
          const downloadUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });

          return NextResponse.json({
            renderId,
            done: true,
            overallProgress: 100,
            fatalErrorEncountered: false,
            errors: [],
            downloadUrl,
          });
        } catch (s3Err: any) {
          if (s3Err.name === "NotFound" || s3Err.$metadata?.httpStatusCode === 404) {
            // S3 object doesn't exist yet — assume it is still rendering
            return NextResponse.json({
              renderId,
              done: false,
              overallProgress: 50, // assume half-way
              fatalErrorEncountered: false,
              errors: [],
              downloadUrl: null,
            });
          }
          throw s3Err;
        }
      }
    } catch (dbOrS3Err: any) {
      console.error("[MCP/render/status] Self-healing failed:", dbOrS3Err.message);
    }

    console.error("[MCP/render/status] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to get render progress" }, { status: 500 });
  }
}
