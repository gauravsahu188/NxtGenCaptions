import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function run() {
  const filePath = "sample.mp3";
  if (!fs.existsSync(filePath)) {
    // create a dummy mp3
    fs.writeFileSync(filePath, Buffer.from("ID3 dummy content", "utf-8"));
  }

  const fileBuffer = await fs.promises.readFile(filePath);
  
  // Node 20+ has global File
  const file = new File([fileBuffer], path.basename(filePath), { type: "audio/mpeg" });
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language_code", "hi-IN");
  formData.append("model", "saaras:v3");

  const apiKey = process.env.SARVAM_API_KEY || "";
  console.log("Using API Key:", apiKey ? "Set" : "Not Set");

  try {
    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey
      },
      body: formData,
    });
    
    if (!response.ok) {
      console.log("Error:", response.status, await response.text());
    } else {
      console.log("Success:", await response.json());
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
run();
