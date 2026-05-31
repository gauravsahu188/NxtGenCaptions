import "dotenv/config";

const HF_TOKEN = process.env.HF_TOKEN;
const model = "openai/whisper-large-v3-turbo";

async function testHuggingFaceAPI() {
  console.log("Testing Hugging Face API directly...");
  console.log("HF_TOKEN:", HF_TOKEN ? HF_TOKEN.substring(0, 10) + "..." : "NOT SET");

  // Test 1: Simple API call without audio
  console.log("\n=== Test 1: Simple API status check ===");
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`
      }
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    const text = await response.text();
    console.log("Response length:", text.length);
    console.log("Response preview:", text.substring(0, 200));

    if (response.ok) {
      const json = JSON.parse(text);
      console.log("Model info:", json);
    }
  } catch (error) {
    console.error("Test 1 failed:", error);
  }

  // Test 2: API call with minimal payload
  console.log("\n=== Test 2: API call with minimal payload ===");
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: "test"
      })
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    const text = await response.text();
    console.log("Response length:", text.length);
    console.log("Response preview:", text.substring(0, 200));
  } catch (error) {
    console.error("Test 2 failed:", error);
  }
}

testHuggingFaceAPI();