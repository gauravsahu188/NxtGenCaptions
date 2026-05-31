#!/usr/bin/env node
/**
 * Script to create IAM policy for Remotion Lambda deployment
 * Run this to grant the necessary permissions to deploy Lambda functions
 */

const { IAMClient, CreatePolicyCommand, CreateRoleCommand, AttachRolePolicyCommand } = require("@aws-sdk/client-iam");

// Load env
require("dotenv").config({ path: "../.env.local" });

const REGION = process.env.AWS_REGION || "ap-south-1";
const POLICY_NAME = "NxtGenRemotionLambdaPolicy";

const iamClient = new IAMClient({ region: REGION });

const lambdaPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "lambda:ListFunctions",
        "lambda:ListVersionsByFunction",
        "lambda:GetFunction",
        "lambda:CreateFunction",
        "lambda:UpdateFunctionConfiguration",
        "lambda:PutFunctionConcurrency",
        "lambda:DeleteFunction",
        "lambda:InvokeFunction",
        "lambda:AddPermission",
        "lambda:RemovePermission"
      ],
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: [
        "iam:GetRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:PassRole"
      ],
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: [
        "cloudwatch:PutMetricData",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics"
      ],
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DeleteLogGroup",
        "logs:DeleteLogStream",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:GetLogEvents"
      ],
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: [
        "s3:GetBucketLocation",
        "s3:ListBuckets",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:DeleteBucket"
      ],
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: [
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs"
      ],
      Resource: "*"
    }
  ]
};

async function createLambdaPolicy() {
  console.log("🔧 Creating IAM policy for Remotion Lambda...");

  try {
    // Create policy
    const createPolicyResult = await iamClient.send(new CreatePolicyCommand({
      PolicyName: POLICY_NAME,
      PolicyDocument: JSON.stringify(lambdaPolicy),
      Description: "Policy for NxtGen Remotion Lambda deployment and execution"
    }));

    console.log(`✅ Policy created: ${createPolicyResult.Policy?.Arn}`);
    console.log("\n📋 Next Steps:");
    console.log("1. Go to AWS IAM Console: https://console.aws.amazon.com/iam/home");
    console.log("2. Find the user 'nxtgencaption'");
    console.log("3. Click 'Add permissions' → 'Attach policies directly'");
    console.log(`4. Search for and attach the policy: ${POLICY_NAME}`);
    console.log("\n   OR run this AWS CLI command:");
    console.log(`   aws iam attach-user-policy --user-name nxtgencaption --policy-arn "${createPolicyResult.Policy?.Arn}"`);

    return createPolicyResult.Policy?.Arn;
  } catch (error) {
    if (error.name === "EntityAlreadyExists") {
      console.log(`⚠️  Policy "${POLICY_NAME}" already exists.`);
      console.log("   Please attach it to the 'nxtgencaption' user manually.");
      return null;
    }
    throw error;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("    NxtGen - IAM Policy Setup for Lambda");
  console.log("═══════════════════════════════════════════════════════\n");

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ AWS credentials not found. Please check .env.local");
    process.exit(1);
  }

  await createLambdaPolicy();
}

main();