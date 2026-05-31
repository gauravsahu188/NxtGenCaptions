import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const REGION = process.env.AWS_REGION ?? "ap-south-1";
const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL ?? "";

let sqsClient: SQSClient | null = null;

function getSqsClient(): SQSClient {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return sqsClient;
}

export interface VideoUploadMessage {
  fileKey: string;
  userId: string;
  planType: string;
  bucket: string;
  uploadedAt: string;
}

/**
 * Send a notification to SQS after successful video upload.
 * Used by backend for async video processing.
 */
export async function sendUploadNotification(
  fileKey: string,
  userId: string,
  planType: string
): Promise<string | null> {
  if (!QUEUE_URL) {
    console.warn("[SQS] Queue URL not configured, skipping notification");
    return null;
  }

  const message: VideoUploadMessage = {
    fileKey,
    userId,
    planType,
    bucket: process.env.AWS_S3_BUCKET ?? "nxtgencaption-export",
    uploadedAt: new Date().toISOString(),
  };

  try {
    const client = getSqsClient();
    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        planType: {
          DataType: "String",
          StringValue: planType,
        },
      },
    });

    const result = await client.send(command);
    console.log(`[SQS] Message sent. MessageId: ${result.MessageId}`);
    return result.MessageId ?? null;
  } catch (error) {
    console.error("[SQS] Failed to send message:", error);
    throw error;
  }
}

export function isSqsConfigured(): boolean {
  return Boolean(QUEUE_URL && process.env.AWS_ACCESS_KEY_ID);
}