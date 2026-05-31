import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendUploadNotification } from "@/lib/sqs";
import { generateDownloadUrl } from "@/lib/s3";
import path from "path";
import fs from "fs";
import os from "os";
import https from "https";
import http from "http";

const MAX_FREE_DURATION_SECONDS = 300; // 5 minutes
const TEMP_DOWNLOAD_DIR = path.join(os.tmpdir(), "nxtgen-uploads");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DOWNLOAD_DIR)) {
  fs.mkdirSync(TEMP_DOWNLOAD_DIR, { recursive: true });
}

interface UploadCompleteRequest {
  key: string; // S3 key of the uploaded file
  userId: string;
  planType: string;
  fileSize?: number; // Optional: actual file size for storage update
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
}

/**
 * Download video from S3 to temp location for ffprobe analysis
 */
async function downloadFromS3(key: string, destPath: string): Promise<void> {
  const url = await generateDownloadUrl(key, 3600);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith("https") ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          const redirectProtocol = redirectUrl.startsWith("https") ? https : http;
          redirectProtocol.get(redirectUrl, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve();
            });
          }).on("error", reject);
          return;
        }
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    file.on("error", reject);
  });
}

/**
 * Get video metadata using ffprobe (server-side check)
 * Note: In production, this would be handled by a separate worker or Lambda
 */
async function getVideoMetadataFromUrl(url: string): Promise<VideoMetadata | null> {
  // For now, return null - duration check happens in backend
  // This would be implemented with a Lambda or worker in production
  console.log("[UploadComplete] Would check duration for:", url);
  return null;
}

/**
 * Delete temp file
 */
function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn(`[UploadComplete] Failed to cleanup temp file: ${filePath}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: UploadCompleteRequest = await request.json();
    const { key, userId, planType, fileSize } = body;

    if (!key || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: key, userId" },
        { status: 400 }
      );
    }

    // Verify user owns this upload
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch user for storage update
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update storage usage if fileSize is provided
    if (fileSize && fileSize > 0) {
      const fileSizeBytes = BigInt(fileSize);

      if (user.subscription) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            storageUsedBytes: { increment: fileSizeBytes },
          },
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: { increment: fileSizeBytes },
        },
      });

      console.log(`[UploadComplete] Storage updated: +${fileSize} bytes for user ${userId}`);
    }

    // Send SQS notification for async video processing
    let sqsMessageId: string | null = null;
    try {
      sqsMessageId = await sendUploadNotification(key, userId, planType);
      console.log(`[UploadComplete] SQS notification sent: ${sqsMessageId}`);
    } catch (sqsError) {
      console.error("[UploadComplete] SQS notification failed:", sqsError);
      // Don't fail the request - SQS notification is secondary
    }

    return NextResponse.json({
      success: true,
      message: "Upload completed and processed",
      metadata: {
        sqsMessageId,
      },
    });
  } catch (error) {
    console.error("[UploadComplete] Error:", error);
    return NextResponse.json(
      { error: "Failed to process upload completion" },
      { status: 500 }
    );
  }
}