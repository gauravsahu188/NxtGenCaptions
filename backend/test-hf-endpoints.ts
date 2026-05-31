import "dotenv/config";

const HF_TOKEN = process.env.HF_TOKEN;

async function testDifferentEndpoints() {
  console.log("Testing different Hugging Face API endpoints...");
  console.log("HF_TOKEN:", HF_TOKEN ? HF_TOKEN.substring(0, 10) + "..." : "NOT SET");

  const models = [
    "openai/whisper-large-v3-turbo",
    "openai/whisper-large-v3",
    "openai/whisper-medium"
  ];

  for (const model of models) {
    console.log(`\n=== Testing model: ${model} ===`);

    try {
      // Try the correct inference API endpoint
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: "test audio data"
        })
      });

      console.log("Status:", response.status);
      const text = await response.text();
      console.log("Response preview:", text.substring(0, 200));

      if (response.ok) {
        console.log("✓ SUCCESS with model:", model);
        break;
      }
    } catch (error) {
      console.error("Error with model", model, ":", error);
    }
  }

  // Try the dedicated inference API endpoint
  console.log("\n=== Testing dedicated inference API ===");
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
    console.log("Response:", text.substring(0, 500));
  } catch (error) {
    console.error("Error:", error);
  }
}

testDifferentEndpoints();