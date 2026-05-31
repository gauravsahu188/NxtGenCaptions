import "dotenv/config";
import { DeepgramTranscriptionService } from "./src/services/deepgram.service";
import fs from "fs";
import path from "path";

const transcriptionService = new DeepgramTranscriptionService();

// Test with a real audio file
const testAudioPath = path.join(process.cwd(), "temp", "video-1777750361379-949295355.mp3");

console.log("Testing Deepgram transcription service...");
console.log("Audio file exists:", fs.existsSync(testAudioPath));

if (fs.existsSync(testAudioPath)) {
  const stats = fs.statSync(testAudioPath);
  console.log("Audio file size:", stats.size, "bytes");

  transcriptionService.transcribeAudio(testAudioPath, (segment) => {
    console.log("Received segment:", segment.text);
  }).then(captions => {
    console.log("\n✅ SUCCESS! Final captions count:", captions.length);
    if (captions.length > 0) {
      console.log("Sample caption:", captions[0]);
      console.log("All captions:", JSON.stringify(captions, null, 2));
    }
  }).catch(error => {
    console.error("❌ Transcription error:", error);
  });
} else {
  console.error("Test audio file not found");
}