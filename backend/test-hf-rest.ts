import "dotenv/config";

const HF_TOKEN = process.env.HF_TOKEN;

async function testHuggingFaceRestAPI() {
  console.log("Testing Hugging Face REST API with different approaches...");
  console.log("HF_TOKEN:", HF_TOKEN ? HF_TOKEN.substring(0, 10) + "..." : "NOT SET");

  // Test 1: Try the standard inference API with proper headers
  console.log("\n=== Test 1: Standard inference API ===");
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo", {
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
    const text = await response.text();
    console.log("Response:", text.substring(0, 300));

    if (response.status === 401) {
      console.log("❌ Authentication failed - check your HF_TOKEN");
    } else if (response.status === 404) {
      console.log("❌ Model not found or endpoint incorrect");
    } else if (response.status === 503) {
      console.log("⚠️ Model is loading - this is expected for first use");
    }
  } catch (error) {
    console.error("Error:", error);
  }

  // Test 2: Try with x-wait-for-model header
  console.log("\n=== Test 2: With x-wait-for-model header ===");
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true"
      },
      body: JSON.stringify({
        inputs: "test"
      })
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response:", text.substring(0, 300));
  } catch (error) {
    console.error("Error:", error);
  }

  // Test 3: Check if the token is valid by making a simple API call
  console.log("\n=== Test 3: Validate token ===");
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/gpt2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: "Hello",
        parameters: { max_new_tokens: 5 }
      })
    });

    console.log("Status:", response.status);
    if (response.ok) {
      const json = await response.json();
      console.log("✓ Token is valid! Response:", json);
    } else {
      const text = await response.text();
      console.log("❌ Token validation failed:", text.substring(0, 200));
    }
  } catch (error) {
    console.error("Error:", error);
  }

  // Test 4: Try the dedicated inference endpoint
  console.log("\n=== Test 4: Try dedicated inference endpoint ===");
  try {
    const response = await fetch("https://api-inference.huggingface.co/pipeline/feature-extraction/openai/whisper-large-v3-turbo", {
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
    const text = await response.text();
    console.log("Response:", text.substring(0, 300));
  } catch (error) {
    console.error("Error:", error);
  }
}

testHuggingFaceRestAPI();