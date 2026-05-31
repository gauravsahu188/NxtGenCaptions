import { S3Client, PutObjectCommand, GetObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_S3_BUCKET ?? "nxtgencaption-export";
const REGION = process.env.AWS_REGION ?? "ap-south-1";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

/**
 * Generate a presigned URL for uploading a file to S3.
 * @param fileKey - The key (path) where the file will be stored
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration in seconds (default 15 minutes)
 */
export async function generateUploadUrl(
  fileKey: string,
  contentType: string = "video/mp4",
  expiresIn: number = 900
): Promise<{ uploadUrl: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return { uploadUrl, key: fileKey };
}

/**
 * Generate a presigned URL for downloading/viewing a file from S3.
 * @param fileKey - The key of the file
 * @param expiresIn - URL expiration in seconds (default 3600 = 1 hour)
 */
export async function generateDownloadUrl(
  fileKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Check if a file exists in S3.
 */
export async function fileExists(fileKey: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}