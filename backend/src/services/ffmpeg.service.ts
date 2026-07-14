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

/**
 * Bandpass filter that isolates human vocal frequencies (300 Hz – 3400 Hz).
 * Applied ONLY during audio analysis (silence detection, volume checks).
 * Background music, bass, and hi-hats are outside this range and get filtered out.
 * The original full-spectrum audio is always sent to Sarvam unchanged.
 */
const VOCAL_BAND_FILTER = 'highpass=f=300,lowpass=f=3400';

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
        // Apply vocal bandpass before silencedetect so background music doesn't interfere
        .audioFilters(`${VOCAL_BAND_FILTER},silencedetect=noise=-20dB:d=0.5`)
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
          let speechEnd = duration!;

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

  /**
   * Returns true if the audio chunk has enough energy to contain real speech.
   * Uses FFmpeg volumedetect to measure mean_volume. Anything below -45 dB
   * is considered silence/noise — Sarvam would hallucinate words on these.
   * Threshold: -45 dB (adjustable — louder = more strict filtering)
   */
  async hasSpeechContent(audioPath: string, thresholdDb: number = -45): Promise<boolean> {
    return new Promise((resolve) => {
      let meanVolume: number | null = null;

      const command = ffmpeg(audioPath);
      command.setFfmpegPath(ffmpegInstaller.path);
      command.setFfprobePath(ffprobeInstaller.path);

      command
        // Apply vocal bandpass so background music volume doesn't mask silent speech gaps
        .audioFilters(`${VOCAL_BAND_FILTER},volumedetect`)
        .format('null')
        .on('stderr', (line) => {
          // volumedetect outputs: [Parsed_volumedetect_0 @ ...] mean_volume: -38.5 dB
          const match = line.match(/mean_volume:\s*([-\d.]+)\s*dB/);
          if (match) {
            meanVolume = parseFloat(match[1]);
          }
        })
        .on('end', () => {
          if (meanVolume === null) {
            // Could not detect — assume it has speech to avoid skipping
            console.warn(`[FFmpegService] volumedetect failed for ${audioPath}, assuming has speech`);
            resolve(true);
            return;
          }
          const hasSpeech = meanVolume > thresholdDb;
          console.log(`[FFmpegService] ${audioPath} mean_volume=${meanVolume}dB → ${hasSpeech ? 'HAS SPEECH' : 'SILENT – skipping'}`);
          resolve(hasSpeech);
        })
        .on('error', () => {
          // On error, assume it has speech to be safe
          resolve(true);
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

  /** Fixed-time splitting — kept as fallback. */
  async splitAudio(
    audioPath: string,
    chunkDuration: number = 30
  ): Promise<{ path: string; offset: number; duration: number }[]> {
    const totalDuration = await this.getVideoDuration(audioPath);
    const chunks: { path: string; offset: number; duration: number }[] = [];
    const numChunks = Math.ceil(totalDuration / chunkDuration);
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

  /**
   * Split audio at natural silence boundaries so each chunk covers ONE phrase/sentence.
   * This gives Sarvam a tight time window, making syllable-weighted interpolation far
   * more accurate than fixed-time chunking.
   *
   * @param maxDuration  Cap (seconds) on any single chunk — default 25 to stay within Sarvam's 30s limit.
   */
  async splitAudioBySilence(
    audioPath: string,
    maxDuration: number = 25
  ): Promise<{ path: string; offset: number; duration: number }[]> {
    const totalDuration = await this.getVideoDuration(audioPath);
    const audioDir = path.dirname(audioPath);
    const audioExt = path.extname(audioPath);
    const audioBase = path.basename(audioPath, audioExt);

    // ── Step 1: Detect all silence blocks ──────────────────────────────────────
    const silenceBlocks = await new Promise<{ start: number; end: number }[]>((resolve, reject) => {
      const blocks: { start: number; end: number }[] = [];
      let currentStart = 0;

      const command = ffmpeg(audioPath);
      command.setFfmpegPath(ffmpegInstaller.path);
      command.setFfprobePath(ffprobeInstaller.path);

      command
        // d=0.2 → detect pauses as short as 200ms; bandpass filters out background music
        .audioFilters(`${VOCAL_BAND_FILTER},silencedetect=noise=-20dB:d=0.2`)
        .format('null')
        .on('stderr', (line) => {
          const startMatch = line.match(/silence_start:\s+([\d.]+)/);
          if (startMatch) currentStart = parseFloat(startMatch[1]);

          const endMatch = line.match(/silence_end:\s+([\d.]+)/);
          if (endMatch) blocks.push({ start: currentStart, end: parseFloat(endMatch[1]) });
        })
        .on('end', () => resolve(blocks))
        .on('error', reject)
        .save('pipe:1');
    });

    console.log(`[FFmpegService] Detected ${silenceBlocks.length} silence blocks`);

    // ── Step 2: Build cut points from midpoints of silence gaps ────────────────
    const cutPoints: number[] = [0];
    for (const block of silenceBlocks) {
      const mid = parseFloat(((block.start + block.end) / 2).toFixed(3));
      // Only use meaningful pauses that aren't right at the start/end
      if (block.end - block.start >= 0.2 && mid > 0.3 && mid < totalDuration - 0.3) {
        cutPoints.push(mid);
      }
    }
    cutPoints.push(totalDuration);

    // ── Step 3: Build segments, merging tiny ones, splitting huge ones ──────────
    const segments: { start: number; end: number }[] = [];
    let segStart = cutPoints[0];

    for (let i = 1; i < cutPoints.length; i++) {
      const segEnd = cutPoints[i];
      const segDur = segEnd - segStart;

      if (segDur <= 0.1) {
        // Skip near-empty gaps
        continue;
      }

      if (segDur > maxDuration) {
        // Too long — hard-split at maxDuration boundaries
        let sub = segStart;
        while (sub < segEnd) {
          const end = Math.min(sub + maxDuration, segEnd);
          if (end - sub > 0.1) {
            segments.push({ start: sub, end });
          }
          sub = end;
        }
      } else {
        segments.push({ start: segStart, end: segEnd });
      }
      segStart = segEnd;
    }

    // Fallback: if silence detection found nothing, treat as single chunk
    if (segments.length === 0) {
      segments.push({ start: 0, end: totalDuration });
    }

    console.log(`[FFmpegService] Silence-split produced ${segments.length} phrase chunks from ${totalDuration.toFixed(1)}s audio`);
    segments.forEach((s, i) =>
      console.log(`  Chunk ${i}: ${s.start.toFixed(2)}s → ${s.end.toFixed(2)}s (${(s.end - s.start).toFixed(2)}s)`)
    );

    // ── Step 4: Extract each phrase as an audio file ───────────────────────────
    const chunks: { path: string; offset: number; duration: number }[] = [];

    for (let i = 0; i < segments.length; i++) {
      const { start, end } = segments[i];
      const segDur = end - start;
      const outputPath = path.join(audioDir, `${audioBase}_phrase_${i}${audioExt}`);

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg(audioPath);
        command.setFfmpegPath(ffmpegInstaller.path);
        command.setFfprobePath(ffprobeInstaller.path);

        command
          .seek(start)
          .duration(segDur)
          .audioCodec("libmp3lame")
          .save(outputPath)
          .on("end", () => resolve())
          .on("error", (err) => {
            console.error(`[FFmpeg] Phrase chunk error for chunk ${i}:`, err);
            reject(err);
          });
      });

      const actualDuration = await this.getVideoDuration(outputPath);
      chunks.push({ path: outputPath, offset: start, duration: actualDuration });
    }

    return chunks;
  }

  async extractFrame(videoPath: string, outputFilename: string, timeInSeconds: number = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(tempDir, outputFilename);
      const command = ffmpeg(videoPath);
      command.setFfmpegPath(ffmpegInstaller.path);
      command.setFfprobePath(ffprobeInstaller.path);
      
      command
        .seekInput(timeInSeconds)
        .frames(1)
        .output(outputPath)
        .on("end", () => {
          console.log(`[FFmpegService] Frame extracted to ${outputPath}`);
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.warn("[FFmpegService] Frame extraction failed:", err.message);
          reject(err);
        })
        .run();
    });
  }
}
