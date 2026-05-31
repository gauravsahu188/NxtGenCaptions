import "dotenv/config";
import { TranscriptionService } from "./src/services/transcription.service";
import fs from "fs";
import path from "path";

console.log("Environment check:");
console.log("HF_TOKEN exists:", !!process.env.HF_TOKEN);
console.log("HF_TOKEN value:", process.env.HF_TOKEN ? process.env.HF_TOKEN.substring(0, 10) + "..." : "NOT SET");
console.log("HF_TOKEN length:", process.env.HF_TOKEN?.length || 0);

const transcriptionService = new TranscriptionService();

// Test with a simple audio file
const testAudioPath = path.join(process.cwd(), "temp", "video-1777750361379-949295355.mp3");

console.log("\nTesting transcription service...");
console.log("Audio file exists:", fs.existsSync(testAudioPath));

if (fs.existsSync(testAudioPath)) {
  const stats = fs.statSync(testAudioPath);
  console.log("Audio file size:", stats.size, "bytes");

  transcriptionService.transcribeAudio(testAudioPath, (segment) => {
    console.log("Received segment:", segment.text);
  }).then(captions => {
    console.log("\nFinal captions count:", captions.length);
    if (captions.length > 0) {
      console.log("Sample caption:", captions[0]);
    }
  }).catch(error => {
    console.error("Transcription error:", error);
  });
} else {
  console.error("Test audio file not found");
}