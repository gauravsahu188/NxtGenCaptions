#!/usr/bin/env node
/**
 * AWS SDK Script to create the nxtgen-completed-exports S3 bucket
 * with 48-hour lifecycle policy and proper permissions.
 *
 * Usage: node scripts/create-exports-bucket.js
 *
 * Prerequisites:
 * 1. AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. Install dependencies: npm install @aws-sdk/client-s3
 */

// Load environment variables
require("dotenv").config({ path: "../.env.local" });

const { S3Client, CreateBucketCommand, PutBucketLifecycleConfigurationCommand,
        PutBucketPolicyCommand, PutBucketCorsCommand, PutBucketPublicAccessBlockCommand } = require("@aws-sdk/client-s3");

// Configuration
const BUCKET_NAME = process.env.AWS_EXPORTS_BUCKET || "nxtgen-completed-exports";
const REGION = process.env.AWS_REGION || "ap-south-1";
const EXPIRATION_DAYS = 2;
const PROJECT_PREFIX = "nxtgen";

// Initialize S3 client
const s3Client = new S3Client({ region: REGION });

/**
 * Create the S3 bucket with lifecycle policy
 */
async function createExportBucket() {
  console.log(`\n🔧 Creating S3 bucket: ${BUCKET_NAME} in ${REGION}`);

  try {
    // 1. Create bucket
    console.log("  📦 Creating bucket...");
    const createBucketParams = {
      Bucket: BUCKET_NAME,
      ...(REGION !== "us-east-1" ? {
        CreateBucketConfiguration: {
          LocationConstraint: REGION,
        },
      } : {}),
    };

    await s3Client.send(new CreateBucketCommand(createBucketParams));
    console.log("  ✅ Bucket created successfully");

    // 2. Block public access
    console.log("  🔒 Blocking public access...");
    await s3Client.send(new PutBucketPublicAccessBlockCommand({
      Bucket: BUCKET_NAME,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    }));
    console.log("  ✅ Public access blocked");

    // 3. Configure CORS
    console.log("  🌐 Configuring CORS...");
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST"],
            AllowedOrigins: ["*"], // Restrict to your domain in production
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }));
    console.log("  ✅ CORS configured");

    // 4. Add lifecycle policy (48-hour expiration)
    console.log(`  ⏰ Adding lifecycle policy (${EXPIRATION_DAYS}-day expiration)...`);
    await s3Client.send(new PutBucketLifecycleConfigurationCommand({
      Bucket: BUCKET_NAME,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: "expire-old-exports",
            Status: "Enabled",
            Filter: {
              Prefix: "",
            },
            Expiration: {
              Days: EXPIRATION_DAYS,
            },
          },
        ],
      },
    }));
    console.log("  ✅ Lifecycle policy configured");

    // 5. Generate bucket policy
    console.log("  📜 Generating bucket policy...");
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "AllowRemotionLambdaPutObject",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
          Action: ["s3:PutObject", "s3:PutObjectAcl"],
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
        },
        {
          Sid: "AllowRemotionLambdaGetObject",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
          Action: ["s3:GetObject", "s3:GetObjectVersion"],
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
        },
        {
          Sid: "AllowRemotionLambdaListBucket",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
          Action: ["s3:ListBucket", "s3:ListBucketMultipartUploads"],
          Resource: `arn:aws:s3:::${BUCKET_NAME}`,
        },
      ],
    };

    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy),
    }));
    console.log("  ✅ Bucket policy attached");

    console.log("\n🎉 S3 bucket setup complete!");
    console.log(`\n📋 Bucket Details:`);
    console.log(`   Name: ${BUCKET_NAME}`);
    console.log(`   Region: ${REGION}`);
    console.log(`   Lifecycle: Objects expire after ${EXPIRATION_DAYS} days`);
    console.log(`   ARN: arn:aws:s3:::${BUCKET_NAME}`);

    return {
      bucketName: BUCKET_NAME,
      region: REGION,
      lifecycleExpirationDays: EXPIRATION_DAYS,
    };
  } catch (error) {
    if (error.name === "BucketAlreadyOwnedByYou" || error.name === "BucketAlreadyExists") {
      console.log(`\n⚠️  Bucket "${BUCKET_NAME}" already exists.`);
      console.log("   Applying lifecycle policy...");

      // Apply lifecycle policy to existing bucket
      await s3Client.send(new PutBucketLifecycleConfigurationCommand({
        Bucket: BUCKET_NAME,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: "expire-old-exports",
              Status: "Enabled",
              Filter: { Prefix: "" },
              Expiration: { Days: EXPIRATION_DAYS },
            },
          ],
        },
      }));

      // Also ensure CORS and public access block are set
      try {
        await s3Client.send(new PutBucketPublicAccessBlockCommand({
          Bucket: BUCKET_NAME,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        }));
      } catch (e) {}

      try {
        await s3Client.send(new PutBucketCorsCommand({
          Bucket: BUCKET_NAME,
          CORSConfiguration: {
            CORSRules: [{
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST"],
              AllowedOrigins: ["*"],
              MaxAgeSeconds: 3600,
            }],
          },
        }));
      } catch (e) {}

      console.log("✅ Lifecycle policy and settings applied");

      return {
        bucketName: BUCKET_NAME,
        region: REGION,
        lifecycleExpirationDays: EXPIRATION_DAYS,
      };
    } else {
      console.error("\n❌ Error creating bucket:", error.message);
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("    NxtGen Captions - S3 Exports Bucket Setup");
  console.log("═══════════════════════════════════════════════════════");

  // Check for AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("\n❌ AWS credentials not found in environment");
    console.log("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  try {
    // Create S3 bucket
    const bucketResult = await createExportBucket();

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("    ✅ Setup Complete!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n📝 Update your .env.local with:");
    console.log(`   AWS_EXPORTS_BUCKET=${bucketResult.bucketName}`);
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main();