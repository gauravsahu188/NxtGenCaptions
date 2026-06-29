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

  async getSpeechBounds(audioPath: string, duration?: number): Promise<{start: number, end: number}> {
    if (!duration) {
      duration = await this.getVideoDuration(audioPath);
    }
    
    return new Promise((resolve, reject) => {
      let silenceBlocks: {start: number, end: number}[] = [];
      let currentStart = 0;

      const command = ffmpeg(audioPath);
      command.setFfmpegPath(ffmpegInstaller.path);
      command.setFfprobePath(ffprobeInstaller.path);
      
      command
        .audioFilters('silencedetect=noise=-30dB:d=0.5')
        .format('null')
        .on('stderr', (stderrLine) => {
          const startMatch = stderrLine.match(/silence_start:\s+([\d.]+)/);
          if (startMatch) {
            currentStart = parseFloat(startMatch[1]);
          }
          const endMatch = stderrLine.match(/silence_end:\s+([\d.]+)/);
          if (endMatch) {
            silenceBlocks.push({
              start: currentStart,
              end: parseFloat(endMatch[1])
            });
          }
        })
        .on('end', () => {
          let speechStart = 0;
          let speechEnd = duration!; // Non-null assertion is safe here

          if (silenceBlocks.length > 0 && silenceBlocks[0].start <= 0.1) {
              speechStart = silenceBlocks[0].end;
          }

          const lastBlock = silenceBlocks[silenceBlocks.length - 1];
          if (lastBlock && lastBlock.end >= duration! - 0.1) {
              speechEnd = lastBlock.start;
          }
          
          // Prevent overlap if everything is silent
          if (speechEnd < speechStart) {
             speechEnd = speechStart;
          }

          resolve({ start: speechStart, end: speechEnd });
        })
        .on('error', (err) => {
          reject(err);
        })
        .save('pipe:1');
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

  async splitAudio(
    audioPath: string,
    chunkDuration: number = 30
  ): Promise<{ path: string; offset: number; duration: number }[]> {
    const duration = await this.getVideoDuration(audioPath);
    const chunks: { path: string; offset: number; duration: number }[] = [];
    const numChunks = Math.ceil(duration / chunkDuration);
    const audioDir = path.dirname(audioPath);
    const audioExt = path.extname(audioPath);
    const audioBase = path.basename(audioPath, audioExt);

    for (let i = 0; i < numChunks; i++) {
      const offset = i * chunkDuration;
      const outputPath = path.join(audioDir, `${audioBase}_chunk_${i}${audioExt}`);
      
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg(audioPath);
        command.setFfmpegPath(ffmpegInstaller.path);
        command.setFfprobePath(ffprobeInstaller.path);
        
        command
          .seek(offset)
          .duration(chunkDuration)
          .audioCodec("libmp3lame")
          .save(outputPath)
          .on("end", () => resolve())
          .on("error", (err) => {
            console.error(`[FFmpeg] Chunking error for chunk ${i}:`, err);
            reject(err);
          });
      });
      const actualDuration = await this.getVideoDuration(outputPath);
      chunks.push({ path: outputPath, offset, duration: actualDuration });
    }
    return chunks;
  }
}
