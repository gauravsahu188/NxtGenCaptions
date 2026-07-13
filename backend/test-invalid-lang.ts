import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function run() {
  const filePath = "temp/temp_test_audio.mp3";
  const fileBuffer = await fs.promises.readFile(filePath);
  const file = new File([fileBuffer], "temp_test_audio.mp3", { type: "audio/mpeg" });
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language_code", "hinglish");
  formData.append("model", "saaras:v3");

  const apiKey = process.env.SARVAM_API_KEY || "";
  try {
    console.log("Fetching...");
    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": apiKey },
      body: formData,
    });
    console.log("Status:", response.status);
    console.log("Body:", await response.text());
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
run();
