const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function run() {
  try {
    // S3Client without explicit credentials (relies on default provider chain)
    // If we clear AWS_ACCESS_KEY_ID from process.env, it will try to hit the metadata server and fail/timeout.
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SESSION_TOKEN;
    delete process.env.AWS_PROFILE;

    const s3 = new S3Client({ region: "ap-south-1" });
    const cmd = new GetObjectCommand({ Bucket: "my-bucket", Key: "my-key" });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    console.log("Success:", url);
  } catch (e) {
    console.error("Error thrown:", e.message);
  }
}
run();
