import { FFmpegService } from "./src/services/ffmpeg.service";
import path from "path";
async function run() {
  const ffmpegService = new FFmpegService();
  const audioPath = path.join(__dirname, "temp_test_audio.mp3");
  console.log("Checking speech content...");
  const hasSpeech = await ffmpegService.hasSpeechContent(audioPath);
  console.log("Has speech:", hasSpeech);
}
run();
