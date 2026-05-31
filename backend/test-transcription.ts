import { TranscriptionService } from "./src/services/transcription.service";
import fs from "fs";
import path from "path";

const transcriptionService = new TranscriptionService();

// Test with a simple audio file
const testAudioPath = path.join(process.cwd(), "temp", "video-1777750361379-949295355.mp3");

console.log("Testing transcription service...");
console.log("Audio file exists:", fs.existsSync(testAudioPath));

if (fs.existsSync(testAudioPath)) {
  const stats = fs.statSync(testAudioPath);
  console.log("Audio file size:", stats.size, "bytes");

  transcriptionService.transcribeAudio(testAudioPath, (segment) => {
    console.log("Received segment:", segment);
  }).then(captions => {
    console.log("Final captions count:", captions.length);
    console.log("Sample caption:", captions[0]);
  }).catch(error => {
    console.error("Transcription error:", error);
  });
} else {
  console.error("Test audio file not found");
}