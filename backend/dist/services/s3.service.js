"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class S3Service {
    client;
    bucket;
    BASE_DIR = "Imported Stuff NxtgenCaption";
    constructor() {
        const region = process.env.AWS_REGION ?? "us-east-1";
        this.bucket = process.env.AWS_S3_BUCKET ?? "";
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? "";
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";
        // Check if credentials are placeholders
        const isPlaceholder = accessKeyId.includes("YOUR_") ||
            secretAccessKey.includes("YOUR_") ||
            this.bucket.includes("YOUR_");
        if (isPlaceholder) {
            console.warn("[S3Service] AWS credentials are placeholders. S3 features will be disabled.");
        }
        else {
            console.log(`[S3Service] Initialized with Access Key: ${accessKeyId.substring(0, 4)}...`);
        }
        this.client = new client_s3_1.S3Client({
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
    async upload(localPath, userPath = "anonymous") {
        if (!this.bucket) {
            throw new Error("AWS_S3_BUCKET is not set in environment variables.");
        }
        const filename = path_1.default.basename(localPath);
        // Path format: Imported Stuff NxtgenCaption/[UserId]/[Type]/[Timestamp]-[Filename]
        const key = `${this.BASE_DIR}/${userPath}/${Date.now()}-${filename}`;
        const fileBuffer = fs_1.default.readFileSync(localPath);
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: "video/mp4",
            // Private by default — accessed via presigned URL
        }));
        console.log(`[S3Service] Uploaded to s3://${this.bucket}/${key}`);
        return key;
    }
    /**
     * Generate a pre-signed download URL valid for 1 hour.
     */
    async getSignedDownloadUrl(key, expiresInSeconds = 3600) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: expiresInSeconds });
        console.log(`[S3Service] Signed URL generated (expires in ${expiresInSeconds}s): ${url}`);
        return url;
    }
}
exports.S3Service = S3Service;
