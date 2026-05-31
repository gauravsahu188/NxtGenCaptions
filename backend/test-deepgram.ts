import "dotenv/config";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

async function testDeepgramAPI() {
  console.log("Testing Deepgram API...");
  console.log("DEEPGRAM_API_KEY:", DEEPGRAM_API_KEY ? DEEPGRAM_API_KEY.substring(0, 10) + "..." : "NOT SET");

  // Test 1: Check if Deepgram API is accessible
  console.log("\n=== Test 1: Check Deepgram API health ===");
  try {
    const response = await fetch("https://api.deepgram.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Token ${DEEPGRAM_API_KEY}`
      }
    });

    console.log("Status:", response.status);
    if (response.ok) {
      const json = await response.json();
      console.log("✓ Deepgram API is accessible!");
      console.log("Available models:", json);
    } else {
      const text = await response.text();
      console.log("❌ Deepgram API error:", text);
    }
  } catch (error) {
    console.error("Error:", error);
  }

  // Test 2: Try a simple transcription with dummy audio
  console.log("\n=== Test 2: Test transcription endpoint ===");
  try {
    // Create a small dummy audio buffer
    const dummyAudio = new Uint8Array([0, 1, 2, 3, 4, 5]);

    const response = await fetch("https://api.deepgram.com/v1/listen?model=whisper-medium&smart_format=true", {
      method: "POST",
      headers: {
        "Authorization": `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "audio/wav"
      },
      body: dummyAudio
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response:", text.substring(0, 300));

    if (response.status === 200 || response.status === 400) {
      console.log("✓ Deepgram transcription endpoint is accessible!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testDeepgramAPI();