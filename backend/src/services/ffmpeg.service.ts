import ffmpeg from "fluent-ffmpeg";
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
import path from "path";
import fs from "fs";
import { CaptionSegment } from "./transcription.service";

// Set global paths for fluent-ffmpeg
console.log("RESOLVED FFMPEG PATH:", ffmpegInstaller.path);
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export class FFmpegService {
  async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format.duration;
        resolve(duration ? Number(duration) : 0);
      });
    });
  }

  async extractAudio(videoPath: string, outputFilename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(tempDir, outputFilename);
      const command = ffmpeg(videoPath);
      // Explicitly set path on instance as well to be bulletproof
      command.setFfmpegPath(ffmpegInstaller.path);
      command.setFfprobePath(ffprobeInstaller.path);
      
      command
        .noVideo()
        .audioCodec("libmp3lame")
        .save(outputPath)
        .on("end", () => resolve(outputPath))
        .on("error", (err) => {
          console.warn("Audio extraction warning:", err.message);
          // Create empty file to avoid failing transcription process
          fs.writeFileSync(outputPath, "");
          resolve(outputPath);
        });
    });
  }

  private formatTime(seconds: number): string {
    const pad = (num: number, size: number) => ('000' + num).slice(-size);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
  }

  generateSrt(captions: CaptionSegment[], outputFilename: string): string {
    let srtContent = "";
    captions.forEach((cap, index) => {
      const start = this.formatTime(cap.start);
      const end = this.formatTime(cap.end);
      srtContent += `${index + 1}\n${start} --> ${end}\n${cap.text}\n\n`;
    });

    const srtPath = path.join(tempDir, outputFilename);
    fs.writeFileSync(srtPath, srtContent);
    return srtPath;
  }

  async burnSubtitles(videoPath: string, srtPath: string, outputFilename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      const outputPath = path.join(uploadDir, outputFilename);
      
      const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

      const command = ffmpeg(videoPath);
      command.setFfmpegPath(ffmpegInstaller.path);
      command.setFfprobePath(ffprobeInstaller.path);
      
      command
        .videoFilters(`subtitles=${escapedSrtPath}:force_style='Fontsize=24,PrimaryColour=&H00FFFFFF,BorderStyle=3,Outline=1,Shadow=1'`)
        .save(outputPath)
        .on("end", () => resolve(outputPath))
        .on("error", (err) => reject(err));
    });
  }
}
