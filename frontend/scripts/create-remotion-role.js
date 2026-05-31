#!/usr/bin/env node
/**
 * Create the Remotion Lambda execution role
 * Required for deploying and running Remotion Lambda functions
 */

const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, PutRolePolicyCommand } = require("@aws-sdk/client-iam");

// Load env
require("dotenv").config({ path: "../.env.local" });

const REGION = process.env.AWS_REGION || "ap-south-1";
const ROLE_NAME = "remotion-lambda-role";

const iamClient = new IAMClient({ region: REGION });

const trustPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { Service: "lambda.amazonaws.com" },
      Action: "sts:AssumeRole"
    }
  ]
};

const permissionsPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: [
        "s3:GetObject",
        "s3:PutObject"
      ],
      Resource: "*"
    }
  ]
};

async function createRemotionRole() {
  console.log("🔧 Creating Remotion Lambda execution role...\n");

  try {
    // Create role with trust policy
    console.log("Creating IAM role...");
    const createRoleResult = await iamClient.send(new CreateRoleCommand({
      RoleName: ROLE_NAME,
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: "Execution role for Remotion Lambda functions",
      MaxSessionDuration: 3600
    }));

    console.log(`✅ Role created: ${createRoleResult.Role?.Arn}`);

    // Attach basic Lambda permissions
    console.log("\nAttaching AWSLambdaBasicExecutionRole policy...");
    try {
      await iamClient.send(new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      }));
      console.log("✅ AWSLambdaBasicExecutionRole attached");
    } catch (e) {
      console.log("⚠️  Could not attach AWSLambdaBasicExecutionRole:", e.message);
    }

    // Add custom policy for S3 access
    console.log("\nAdding custom S3 permissions policy...");
    await iamClient.send(new PutRolePolicyCommand({
      RoleName: ROLE_NAME,
      PolicyName: "RemotionS3Access",
      PolicyDocument: JSON.stringify(permissionsPolicy)
    }));
    console.log("✅ S3 access policy attached");

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ Role setup complete!");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`\nRole ARN: ${createRoleResult.Role?.Arn}`);
    console.log("\nNow try deploying Remotion Lambda again!");

  } catch (error) {
    if (error.name === "EntityAlreadyExists") {
      console.log(`⚠️  Role "${ROLE_NAME}" already exists.`);
      console.log("   The role may already be set up. Try deploying again.");
    } else {
      console.error("❌ Error:", error.message);
      console.log("\n📋 Manual steps:");
      console.log(`1. Go to: https://console.aws.amazon.com/iam/home#/roles/${ROLE_NAME}`);
      console.log("2. Ensure the role exists with trust policy for lambda.amazonaws.com");
    }
  }
}

createRemotionRole().catch(console.error);