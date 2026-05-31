import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUploadUrl } from "@/lib/s3";

const MAX_FREE_DURATION_SECONDS = 300; // 5 minutes for FREE plan

interface PresignedUrlRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
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

    const userId = session.user.id;

    // Parse request body
    const body: PresignedUrlRequest = await request.json();
    const { fileName, fileSize, contentType } = body;

    if (!fileName || !fileSize || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileSize, contentType" },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: mp4, mov, avi, webm" },
        { status: 400 }
      );
    }

    // Fetch user with subscription details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Determine plan type and storage limits
    const planType = user.subscription?.planType ?? user.planType ?? "FREE";
    const storageLimitGb = user.subscription?.storageLimitGb ?? 1;
    const storageLimitBytes = BigInt(storageLimitGb * 1024 * 1024 * 1024);
    const currentStorageUsed = user.storageUsed ?? BigInt(0);

    // Storage check: Ensure user has enough storage
    const projectedStorage = currentStorageUsed + BigInt(fileSize);
    if (projectedStorage > storageLimitBytes) {
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          details: {
            currentUsed: Number(currentStorageUsed),
            requested: fileSize,
            limit: Number(storageLimitBytes),
            upgradeUrl: "/dashboard?upgrade=true",
          },
        },
        { status: 403 }
      );
    }

    // Duration gate for FREE plan
    if (planType === "FREE") {
      // For duration check, we'll verify after upload using ffprobe
      // For now, we return a flag that frontend should use with their local file check
      // The actual duration verification happens in the webhook/completion handler
      console.log(`[PresignedUrl] FREE plan user - duration check deferred to post-upload`);
    }

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const s3Key = `uploads/${userId}/${timestamp}-${sanitizedFileName}`;

    // Generate presigned URL
    const { uploadUrl, key } = await generateUploadUrl(s3Key, contentType);

    // Return presigned URL and metadata
    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn: 900, // 15 minutes
      metadata: {
        userId,
        planType,
        storageCheck: {
          currentUsed: Number(currentStorageUsed),
          limit: Number(storageLimitBytes),
          projectedAfter: Number(projectedStorage),
        },
      },
    });
  } catch (error) {
    console.error("[PresignedUrl] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}