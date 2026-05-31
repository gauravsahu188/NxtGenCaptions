#!/usr/bin/env node
/**
 * Script to add specific IAM permissions needed for Lambda deployment
 * This can add individual permissions if you have some existing access
 */

const { IAMClient, AttachUserPolicyCommand, PutUserPolicyCommand } = require("@aws-sdk/client-iam");

// Load env
require("dotenv").config({ path: "../.env.local" });

const REGION = process.env.AWS_REGION || "ap-south-1";
const iamClient = new IAMClient({ region: REGION });

async function addLambdaPermissions() {
  console.log("🔧 Adding Lambda permissions to nxtgencaption user...\n");

  // Inline policy for minimal permissions needed
  const inlinePolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "lambda:ListFunctions",
          "lambda:ListVersionsByFunction",
          "lambda:GetFunction"
        ],
        Resource: "*"
      }
    ]
  };

  try {
    await iamClient.send(new PutUserPolicyCommand({
      UserName: "nxtgencaption",
      PolicyName: "NxtGenLambdaListPolicy",
      PolicyDocument: JSON.stringify(inlinePolicy)
    }));

    console.log("✅ Added lambda:ListFunctions permission!");
    console.log("\n⚠️  You still need more permissions for deployment.");
    console.log("   Please go to AWS Console and add these policies to 'nxtgencaption' user:\n");
    console.log("   1. AWSLambdaFullAccess (or custom policy with Lambda permissions)");
    console.log("   2. IAMFullAccess (for creating execution roles)");
    console.log("   3. CloudWatchLogsFullAccess (for logging)");
    console.log("\n   Or create this policy via AWS CLI:");
    console.log(`   aws iam create-policy --policy-name NxtGenLambda --policy-document '${JSON.stringify(inlinePolicy)}'\n`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\n📋 Manual Steps Required:");
    console.log("1. Go to: https://console.aws.amazon.com/iam/home#/users/nxtgencaption");
    console.log("2. Click 'Add permissions'");
    console.log("3. Search for and attach: AWSLambdaFullAccess, IAMFullAccess");
  }
}

addLambdaPermissions().catch(console.error);