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
import { IAMClient, GetRoleCommand, CreateRoleCommand, PutRolePolicyCommand } from "@aws-sdk/client-iam";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try loading root .env.local first, then local .env
const rootEnvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// ── Configuration ───────────────────────────────────────────────────────────
const REGION = process.env.REMOTION_AWS_REGION || process.env.REMOTION_REGION || process.env.AWS_REGION || "ap-south-1";
const MEMORY_MB = 3008;       // Lambda memory
const TIMEOUT_SEC = 900;      // Lambda timeout
const DISK_MB = 10240;        // Lambda ephemeral storage (10 GB max allowed by AWS Lambda, prevents Chrome low-disk errors during frame extraction)

/**
 * Ensures the required 'remotion-lambda-role' exists in the AWS account.
 */
async function ensureRemotionRole() {
  console.log("🔐 Checking IAM execution role (remotion-lambda-role)...");
  
  const iamClient = new IAMClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const ROLE_NAME = "remotion-lambda-role";

  const trustPolicy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Action: "sts:AssumeRole",
      },
    ],
  });

  const permissionsPolicy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "0",
        Effect: "Allow",
        Action: ["s3:ListAllMyBuckets"],
        Resource: ["*"],
      },
      {
        Sid: "1",
        Effect: "Allow",
        Action: [
          "s3:CreateBucket",
          "s3:ListBucket",
          "s3:PutBucketAcl",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl",
          "s3:PutObject",
          "s3:GetBucketLocation",
        ],
        Resource: [
          "arn:aws:s3:::remotionlambda-*",
          "arn:aws:s3:::nxtgen-completed-exports*",
          "arn:aws:s3:::nxtgencaption-export*",
        ],
      },
      {
        Sid: "2",
        Effect: "Allow",
        Action: ["lambda:InvokeFunction"],
        Resource: ["arn:aws:lambda:*:*:function:remotion-render-*"],
      },
      {
        Sid: "3",
        Effect: "Allow",
        Action: ["logs:CreateLogGroup"],
        Resource: [
          "arn:aws:logs:*:*:log-group:/aws/lambda-insights",
          "arn:aws:logs:*:*:log-group:/aws/lambda/remotion-render-*",
        ],
      },
      {
        Sid: "4",
        Effect: "Allow",
        Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
        Resource: [
          "arn:aws:logs:*:*:log-group:/aws/lambda/remotion-render-*",
          "arn:aws:logs:*:*:log-group:/aws/lambda-insights:*",
        ],
      },
    ],
  });

  try {
    const existing = await iamClient.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    console.log(`   ✅ Role "${ROLE_NAME}" verified (${existing.Role.Arn})`);
  } catch (err) {
    if (err.name === "NoSuchEntity" || err.name === "NoSuchEntityException") {
      console.log(`   ⚡ Role "${ROLE_NAME}" not found. Creating it automatically...`);
      try {
        await iamClient.send(
          new CreateRoleCommand({
            RoleName: ROLE_NAME,
            AssumeRolePolicyDocument: trustPolicy,
            Description: "Execution role for Remotion Lambda video rendering",
          })
        );
        console.log(`   ✅ Created role: ${ROLE_NAME}`);

        console.log(`   🔒 Attaching permissions policy...`);
        await iamClient.send(
          new PutRolePolicyCommand({
            RoleName: ROLE_NAME,
            PolicyName: "remotion-lambda-policy",
            PolicyDocument: permissionsPolicy,
          })
        );
        console.log(`   ✅ Attached permissions policy`);

        console.log("   ⏳ Waiting 15 seconds for AWS IAM STS replication across regions...");
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } catch (createErr) {
        console.error(`   ❌ Failed to create role automatically: ${createErr.message}`);
        console.error(`   👉 Please create the role manually in AWS IAM Console:`);
        console.error(`      Role Name: ${ROLE_NAME}`);
        console.error(`      Trusted Entity: Lambda (lambda.amazonaws.com)`);
        throw createErr;
      }
    } else {
      console.warn(`   ⚠️ Role check notice: ${err.message}`);
    }
  }
}

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

  // ── Step 1.5: Ensure remotion-lambda-role exists ─────────────────────────
  await ensureRemotionRole();

  // ── Step 2: Deploy Lambda Function ──────────────────────────────────────
  console.log("⚡ Step 2/3 — Deploying Remotion Lambda function...");
  let functionName;
  let alreadyExisted;
  const maxRetries = 4;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await deployFunction({
        region: REGION,
        memorySizeInMb: MEMORY_MB,
        timeoutInSeconds: TIMEOUT_SEC,
        createCloudWatchLogGroup: true,
        cloudWatchLogRetentionPeriodInDays: 7,
        diskSizeInMb: DISK_MB,
        logLevel: "info",
      });
      functionName = res.functionName;
      alreadyExisted = res.alreadyExisted;
      break;
    } catch (err) {
      const isRoleIssue =
        err.message?.includes("cannot be assumed by Lambda") ||
        err.message?.includes("AccessDenied") ||
        err.message?.includes("The role defined for the function");

      if (isRoleIssue && attempt < maxRetries) {
        console.warn(`   ⏳ AWS IAM role propagation in progress (attempt ${attempt}/${maxRetries}). Retrying in 10s...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }
      throw err;
    }
  }
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

  // Automatically update .env.local if it exists
  try {
    if (fs.existsSync(rootEnvPath)) {
      let content = fs.readFileSync(rootEnvPath, "utf-8");
      if (content.includes("REMOTION_FUNCTION_NAME=")) {
        content = content.replace(/REMOTION_FUNCTION_NAME=.*/g, `REMOTION_FUNCTION_NAME=${functionName}`);
      } else {
        content += `\nREMOTION_FUNCTION_NAME=${functionName}`;
      }
      if (content.includes("REMOTION_SITE_URL=")) {
        content = content.replace(/REMOTION_SITE_URL=.*/g, `REMOTION_SITE_URL=${serveUrl}`);
      } else {
        content += `\nREMOTION_SITE_URL=${serveUrl}`;
      }
      fs.writeFileSync(rootEnvPath, content, "utf-8");
      console.log(`📝 Automatically updated ${rootEnvPath}`);
      console.log();
    }
  } catch (envErr) {
    console.warn("⚠️ Could not automatically update .env.local:", envErr.message);
  }

  console.log("Env vars for .env.local:");
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
