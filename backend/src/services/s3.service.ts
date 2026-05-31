import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

export class S3Service {
  private client: S3Client;
  private bucket: string;
  private readonly BASE_DIR = "Imported Stuff NxtgenCaption";

  constructor() {
    const region = process.env.AWS_REGION ?? "us-east-1";
    this.bucket = process.env.AWS_S3_BUCKET ?? "";

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? "";
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";

    // Check if credentials are placeholders
    const isPlaceholder = 
      accessKeyId.includes("YOUR_") || 
      secretAccessKey.includes("YOUR_") || 
      this.bucket.includes("YOUR_");

    if (isPlaceholder) {
      console.warn("[S3Service] AWS credentials are placeholders. S3 features will be disabled.");
    } else {
      console.log(`[S3Service] Initialized with Access Key: ${accessKeyId.substring(0, 4)}...`);
    }

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: isPlaceholder ? "invalid" : accessKeyId,
        secretAccessKey: isPlaceholder ? "invalid" : secretAccessKey,
      },
    });
  }

  /**
   * Upload a local file to S3 and return its key.
   */
  async upload(localPath: string, userPath = "anonymous"): Promise<string> {
    if (!this.bucket) {
      throw new Error("AWS_S3_BUCKET is not set in environment variables.");
    }

    const filename = path.basename(localPath);
    // Path format: Imported Stuff NxtgenCaption/[UserId]/[Type]/[Timestamp]-[Filename]
    const key = `${this.BASE_DIR}/${userPath}/${Date.now()}-${filename}`;
    const fileBuffer = fs.readFileSync(localPath);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: "video/mp4",
        // Private by default — accessed via presigned URL
      })
    );

    console.log(`[S3Service] Uploaded to s3://${this.bucket}/${key}`);
    return key;
  }

  /**
   * Generate a pre-signed download URL valid for 1 hour.
   */
  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    console.log(`[S3Service] Signed URL generated (expires in ${expiresInSeconds}s): ${url}`);
    return url;
  }
}
