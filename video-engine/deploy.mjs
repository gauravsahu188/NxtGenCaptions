#!/usr/bin/env node
/**
 * deploy.mjs — Deploy Remotion Lambda function + site to AWS
 *
 * This script:
 *   1. Deploys (or updates) the Remotion Lambda function
 *   2. Bundles and uploads the video-engine site to S3
 *   3. Prints the env vars you need in .env.local
 *
 * Prerequisites:
 *   - AWS credentials configured (via env vars or ~/.aws/credentials)
 *   - @remotion/lambda installed
 *
 * Usage:
 *   node deploy.mjs
 */

import { deployFunction, deploySite, getOrCreateBucket } from "@remotion/lambda";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ───────────────────────────────────────────────────────────
const REGION = process.env.REMOTION_REGION || "ap-south-1";
const MEMORY_MB = 2048;       // Lambda memory
const TIMEOUT_SEC = 120;      // Lambda timeout
const DISK_MB = 2048;         // Lambda ephemeral storage

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║        NxtGen Captions — Remotion Lambda Deploy         ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  // Verify AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in environment.");
    console.error("   Set them in .env.local or export them before running this script.");
    process.exit(1);
  }

  console.log(`📍 Region: ${REGION}`);
  console.log(`💾 Memory: ${MEMORY_MB} MB | Timeout: ${TIMEOUT_SEC}s | Disk: ${DISK_MB} MB`);
  console.log();

  // ── Step 1: Get or Create S3 Bucket ─────────────────────────────────────
  console.log("📦 Step 1/3 — Ensuring Remotion S3 bucket exists...");
  const { bucketName } = await getOrCreateBucket({ region: REGION });
  console.log(`   ✅ Bucket: ${bucketName}`);
  console.log();

  // ── Step 2: Deploy Lambda Function ──────────────────────────────────────
  console.log("⚡ Step 2/3 — Deploying Remotion Lambda function...");
  const { functionName, alreadyExisted } = await deployFunction({
    region: REGION,
    memorySizeInMb: MEMORY_MB,
    timeoutInSeconds: TIMEOUT_SEC,
    createCloudWatchLogGroup: true,
    cloudWatchLogRetentionPeriodInDays: 7,
    diskSizeInMb: DISK_MB,
    logLevel: "info",
  });
  console.log(`   ✅ Function: ${functionName} (${alreadyExisted ? "already existed" : "newly created"})`);
  console.log();

  // ── Step 3: Deploy Site Bundle ──────────────────────────────────────────
  console.log("🌐 Step 3/3 — Bundling & deploying Remotion site to S3...");
  const entryPoint = path.resolve(__dirname, "src/index.ts");
  console.log(`   Entry point: ${entryPoint}`);

  const { serveUrl, siteName } = await deploySite({
    entryPoint,
    bucketName,
    region: REGION,
    siteName: "nxtgen-captions",
    logLevel: "info",
  });
  console.log(`   ✅ Site: ${siteName}`);
  console.log(`   ✅ Serve URL: ${serveUrl}`);
  console.log();

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                   ✅ Deploy Complete!                    ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();
  console.log("Add these to your .env.local:");
  console.log("─────────────────────────────────────────────────────────");
  console.log(`REMOTION_REGION=${REGION}`);
  console.log(`REMOTION_FUNCTION_NAME=${functionName}`);
  console.log(`REMOTION_SITE_URL=${serveUrl}`);
  console.log("─────────────────────────────────────────────────────────");
}

main().catch((err) => {
  console.error("❌ Deploy failed:", err.message || err);
  process.exit(1);
});
