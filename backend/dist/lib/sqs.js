"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUploadNotification = sendUploadNotification;
exports.isSqsConfigured = isSqsConfigured;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const REGION = process.env.AWS_REGION ?? "ap-south-1";
const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL ?? "";
let sqsClient = null;
function getSqsClient() {
    if (!sqsClient) {
        sqsClient = new client_sqs_1.SQSClient({
            region: REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
            },
        });
    }
    return sqsClient;
}
/**
 * Send a notification to SQS after successful video upload.
 * Used by backend for async video processing.
 */
async function sendUploadNotification(fileKey, userId, planType) {
    if (!QUEUE_URL) {
        console.warn("[SQS] Queue URL not configured, skipping notification");
        return null;
    }
    const message = {
        fileKey,
        userId,
        planType,
        bucket: process.env.AWS_S3_BUCKET ?? "nxtgencaption-export",
        uploadedAt: new Date().toISOString(),
    };
    try {
        const client = getSqsClient();
        const command = new client_sqs_1.SendMessageCommand({
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
    }
    catch (error) {
        console.error("[SQS] Failed to send message:", error);
        throw error;
    }
}
function isSqsConfigured() {
    return Boolean(QUEUE_URL && process.env.AWS_ACCESS_KEY_ID);
}
