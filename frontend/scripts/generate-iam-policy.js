#!/usr/bin/env node
/**
 * Script to generate IAM policy JSON for Remotion Lambda
 * Run this in AWS Console or use AWS CLI to create the policy manually
 */

const POLICY_NAME = "NxtGenRemotionLambdaPolicy";

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

console.log("═══════════════════════════════════════════════════════");
console.log("    NxtGen - Remotion Lambda IAM Policy");
console.log("═══════════════════════════════════════════════════════\n");

console.log("📋 Option 1: AWS Console\n");
console.log("1. Go to: https://console.aws.amazon.com/iam/home");
console.log("2. Navigate to: Policies → Create policy");
console.log("3. Select 'JSON' and paste the policy below\n");

console.log("POLICY JSON:");
console.log(JSON.stringify(lambdaPolicy, null, 2));

console.log("\n\n📋 Option 2: AWS CLI Commands\n");

// Save policy to temp file
const fs = require("fs");
const path = require("path");
const tempFile = "/tmp/nxtgen-lambda-policy.json";
fs.writeFileSync(tempFile, JSON.stringify(lambdaPolicy, null, 2));

console.log(`# Create the policy:`);
console.log(`aws iam create-policy --policy-name ${POLICY_NAME} --policy-document file://${tempFile} --description "Policy for NxtGen Remotion Lambda"\n`);

console.log(`# Attach to user (replace ACCOUNT_ID with your AWS Account ID):`);
console.log(`aws iam attach-user-policy --user-name nxtgencaption --policy-arn "arn:aws:iam::ACCOUNT_ID:policy/${POLICY_NAME}"\n`);

console.log("═══════════════════════════════════════════════════════");
console.log("\n⚠️  IMPORTANT: After adding permissions, try deploying again!");
console.log("═══════════════════════════════════════════════════════");