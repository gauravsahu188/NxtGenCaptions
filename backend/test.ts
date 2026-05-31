import { FFmpegService } from "./src/services/ffmpeg.service";
import fs from "fs";

const s = new FFmpegService();
const dummyVideo = "temp/dummy.mp4";
// Create a dummy video file using ffmpeg
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

if (!fs.existsSync("temp")) fs.mkdirSync("temp");

ffmpeg()
  .input('color=c=black:s=128x128')
  .inputFormat('lavfi')
  .outputOptions(['-t 1'])
  .save(dummyVideo)
  .on('end', async () => {
    try {
      console.log("Dummy video created. Extracting audio...");
      await s.extractAudio(dummyVideo, "dummy.mp3");
      console.log("Audio extracted!");
    } catch (e) {
      console.error("Extraction error:", e);
    }
  });
