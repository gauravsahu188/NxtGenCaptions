import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { DeepgramTranscriptionService } from "./src/services/deepgram.service";
import { FFmpegService } from "./src/services/ffmpeg.service";
import fs from "fs";

async function run() {
  console.log("Using API Key:", process.env.DEEPGRAM_API_KEY ? "Set" : "Not Set");
  
  const videoPath = path.join(__dirname, "uploads", "video-1778788113973-761083402.mp4");
  const audioFilename = "temp_test_audio_dg.mp3";
  const audioPath = path.join(__dirname, "temp", audioFilename);
  
  const ffmpegService = new FFmpegService();
  const service = new DeepgramTranscriptionService();
  
  try {
    if (!fs.existsSync(videoPath)) {
      console.error("Video file does not exist:", videoPath);
      return;
    }
    
    console.log("Extracting audio...");
    const extractedAudio = await ffmpegService.extractAudio(videoPath, audioFilename);
    console.log("Audio extracted to:", extractedAudio);
    
    console.log("Transcribing with Deepgram...");
    const res = await service.transcribeAudio(extractedAudio, (seg) => {
      // console.log("OnProgress segment:", JSON.stringify(seg));
    }, { language: "en" });
    
    console.log("\nFinal captions output (first 5 segments):\n", JSON.stringify(res.slice(0, 5), null, 2));
    
    // Let's also print a sample of word timings to verify synchronization
    console.log("\nSample word timings (first 15 words):\n");
    const allWords = res.flatMap(r => r.words || []);
    console.log(JSON.stringify(allWords.slice(0, 15), null, 2));
    
    // Cleanup
    if (fs.existsSync(extractedAudio)) {
      fs.unlinkSync(extractedAudio);
    }
  } catch (e) {
    console.error("Error occurred:", e);
  }
}
run();
