const { SESv2Client } = require("@aws-sdk/client-sesv2");
try {
  new SESv2Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: "",
      secretAccessKey: ""
    }
  });
  console.log("Success");
} catch(e) {
  console.error("Error:", e.message);
}
