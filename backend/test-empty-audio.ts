import { FFmpegService } from "./src/services/ffmpeg.service";
import path from "path";
import fs from "fs";
async function run() {
  const ffmpegService = new FFmpegService();
  const audioPath = path.join(__dirname, "temp_empty_audio.mp3");
  fs.writeFileSync(audioPath, ""); // Create empty file
  console.log("Checking speech content on empty file...");
  const hasSpeech = await ffmpegService.hasSpeechContent(audioPath);
  console.log("Has speech:", hasSpeech);
}
run();
