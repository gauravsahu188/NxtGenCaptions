import { HfInference } from "@huggingface/inference";
import "dotenv/config";

const HF_TOKEN = process.env.HF_TOKEN;

async function testHuggingFaceSDK() {
  console.log("Testing Hugging Face Inference SDK...");
  console.log("HF_TOKEN:", HF_TOKEN ? HF_TOKEN.substring(0, 10) + "..." : "NOT SET");

  const hf = new HfInference(HF_TOKEN);

  // Test with a simple text generation first to verify the SDK works
  console.log("\n=== Test 1: Simple text generation ===");
  try {
    const result = await hf.textGeneration({
      model: "gpt2",
      inputs: "The future of AI is",
      parameters: { max_new_tokens: 10 }
    });
    console.log("✓ Text generation works:", result.generated_text);
  } catch (error) {
    console.error("Text generation failed:", error);
  }

  // Test audio transcription with a small test
  console.log("\n=== Test 2: Audio transcription (will fail without real audio) ===");
  try {
    // This will fail because we're not providing real audio, but it will tell us if the endpoint works
    const result = await hf.automaticSpeechRecognition({
      model: "openai/whisper-large-v3-turbo",
      data: new Uint8Array([0, 1, 2, 3]) // Dummy audio data
    });
    console.log("✓ Audio transcription works:", result);
  } catch (error) {
    console.error("Audio transcription failed (expected with dummy data):", error.message);
  }

  // Try different audio models
  console.log("\n=== Test 3: Trying different audio models ===");
  const audioModels = [
    "openai/whisper-large-v3-turbo",
    "openai/whisper-large-v3",
    "openai/whisper-medium",
    "facebook/wav2vec2-base-960h"
  ];

  for (const model of audioModels) {
    try {
      console.log(`Trying model: ${model}`);
      const result = await hf.automaticSpeechRecognition({
        model: model,
        data: new Uint8Array([0, 1, 2, 3])
      });
      console.log(`✓ Model ${model} works!`);
      break;
    } catch (error) {
      console.log(`✗ Model ${model} failed:`, error.message);
    }
  }
}

testHuggingFaceSDK();