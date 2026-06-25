"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFmpegService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Set global paths for fluent-ffmpeg
console.log("RESOLVED FFMPEG PATH:", ffmpegInstaller.path);
fluent_ffmpeg_1.default.setFfmpegPath(ffmpegInstaller.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobeInstaller.path);
const tempDir = path_1.default.join(process.cwd(), "temp");
if (!fs_1.default.existsSync(tempDir)) {
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
class FFmpegService {
    async getVideoDuration(videoPath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
                if (err)
                    return reject(err);
                const duration = metadata.format.duration;
                resolve(duration ? Number(duration) : 0);
            });
        });
    }
    async extractAudio(videoPath, outputFilename) {
        return new Promise((resolve, reject) => {
            const outputPath = path_1.default.join(tempDir, outputFilename);
            const command = (0, fluent_ffmpeg_1.default)(videoPath);
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
                fs_1.default.writeFileSync(outputPath, "");
                resolve(outputPath);
            });
        });
    }
    formatTime(seconds) {
        const pad = (num, size) => ('000' + num).slice(-size);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
    }
    generateSrt(captions, outputFilename) {
        let srtContent = "";
        captions.forEach((cap, index) => {
            const start = this.formatTime(cap.start);
            const end = this.formatTime(cap.end);
            srtContent += `${index + 1}\n${start} --> ${end}\n${cap.text}\n\n`;
        });
        const srtPath = path_1.default.join(tempDir, outputFilename);
        fs_1.default.writeFileSync(srtPath, srtContent);
        return srtPath;
    }
    async burnSubtitles(videoPath, srtPath, outputFilename) {
        return new Promise((resolve, reject) => {
            const uploadDir = path_1.default.join(process.cwd(), "uploads");
            const outputPath = path_1.default.join(uploadDir, outputFilename);
            const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
            const command = (0, fluent_ffmpeg_1.default)(videoPath);
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
exports.FFmpegService = FFmpegService;
