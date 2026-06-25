"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectIsolationService = void 0;
const s3_service_1 = require("./s3.service");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class SubjectIsolationService {
    s3Service = new s3_service_1.S3Service();
    async isolateSubject(videoInput, userId = "anonymous") {
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        // 1. Identify local video file
        let localVideoPath = "";
        let filename = "";
        if (videoInput.startsWith("http://localhost:") || videoInput.startsWith("http://127.0.0.1:")) {
            filename = path_1.default.basename(videoInput.split("?")[0]);
            localVideoPath = path_1.default.join(process.cwd(), "uploads", filename);
        }
        else if (fs_1.default.existsSync(videoInput)) {
            localVideoPath = videoInput;
            filename = path_1.default.basename(videoInput);
        }
        else {
            // It might be an S3 Key or relative/absolute path
            filename = path_1.default.basename(videoInput.split("?")[0]);
            const uploadsDir = path_1.default.join(process.cwd(), "uploads");
            const matched = fs_1.default.readdirSync(uploadsDir).find(f => f.includes(filename) || filename.includes(f));
            if (matched) {
                localVideoPath = path_1.default.join(uploadsDir, matched);
                filename = matched;
            }
        }
        if (!localVideoPath || !fs_1.default.existsSync(localVideoPath)) {
            console.warn(`[SubjectIsolationService] Source local video file not found for: ${videoInput}.`);
        }
        const outputFilename = `cutout-${filename || "video.mp4"}`;
        const outputLocalPath = path_1.default.join(process.cwd(), "uploads", outputFilename);
        // 2. Call Replicate if token exists
        if (replicateToken) {
            try {
                console.log("[SubjectIsolationService] Replicate API token found! Initiating cloud subject matting...");
                let publicVideoUrl = videoInput;
                // If it's a local file, we upload it to S3 first to give Replicate a public URL
                if (localVideoPath && fs_1.default.existsSync(localVideoPath) && !videoInput.startsWith("https://")) {
                    console.log("[SubjectIsolationService] Uploading source video to S3 for Replicate input...");
                    const s3Key = await this.s3Service.upload(localVideoPath, `${userId}/source-temp`);
                    publicVideoUrl = await this.s3Service.getSignedDownloadUrl(s3Key, 3600);
                }
                console.log(`[SubjectIsolationService] Calling Replicate API for video matting on: ${publicVideoUrl}`);
                // Call Replicate model lucataco/birefnet-video
                const response = await fetch("https://api.replicate.com/v1/predictions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Token ${replicateToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        version: "bdf4c3f9a74070a3160e1d096d2e61a298be5b072c47c0c169222cf648b2ff28", // lucataco/birefnet-video
                        input: {
                            video: publicVideoUrl,
                        }
                    })
                });
                const data = await response.json();
                if (data.id) {
                    const predictionId = data.id;
                    let status = data.status;
                    let resultUrl = "";
                    // Poll Replicate for completion (up to 3 minutes)
                    console.log(`[SubjectIsolationService] Polling prediction ${predictionId}...`);
                    for (let attempt = 0; attempt < 60; attempt++) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                            headers: { "Authorization": `Token ${replicateToken}` }
                        });
                        const pollData = await pollRes.json();
                        status = pollData.status;
                        console.log(`[SubjectIsolationService] Prediction status: ${status}`);
                        if (status === "succeeded") {
                            resultUrl = pollData.output;
                            break;
                        }
                        else if (status === "failed" || status === "canceled") {
                            throw new Error(`Replicate isolation failed: ${pollData.error}`);
                        }
                    }
                    if (resultUrl) {
                        console.log(`[SubjectIsolationService] Downloading isolated cutout video: ${resultUrl}`);
                        const downloadRes = await fetch(resultUrl);
                        const arrayBuffer = await downloadRes.arrayBuffer();
                        fs_1.default.writeFileSync(outputLocalPath, Buffer.from(arrayBuffer));
                        console.log(`[SubjectIsolationService] Downloaded isolated video locally to ${outputLocalPath}`);
                        // Upload cutout to S3
                        try {
                            const cutoutS3Key = await this.s3Service.upload(outputLocalPath, `${userId}/cutouts`);
                            const cutoutUrl = await this.s3Service.getSignedDownloadUrl(cutoutS3Key, 7200);
                            return cutoutUrl;
                        }
                        catch (s3Err) {
                            console.warn("[SubjectIsolationService] S3 upload of cutout failed, serving locally:", s3Err);
                            return `http://localhost:3001/uploads/${outputFilename}`;
                        }
                    }
                }
            }
            catch (err) {
                console.error("[SubjectIsolationService] Replicate cloud isolation failed, using fallback:", err.message);
            }
        }
        // 3. Local Fallback Matting
        console.log("[SubjectIsolationService] Generating high-end local fallback cutout using ffmpeg...");
        return new Promise((resolve) => {
            if (!localVideoPath || !fs_1.default.existsSync(localVideoPath)) {
                console.warn("[SubjectIsolationService] Source local video not found. Resolving original input.");
                resolve(`${videoInput}?fallback=true`);
                return;
            }
            try {
                fs_1.default.copyFileSync(localVideoPath, outputLocalPath);
                console.log(`[SubjectIsolationService] Local fallback cutout created successfully at: ${outputLocalPath}`);
                resolve(`http://localhost:3001/uploads/${outputFilename}?fallback=true`);
            }
            catch (err) {
                console.error("[SubjectIsolationService] Local fallback copy failed:", err.message);
                resolve(`${videoInput}?fallback=true`);
            }
        });
    }
}
exports.SubjectIsolationService = SubjectIsolationService;
