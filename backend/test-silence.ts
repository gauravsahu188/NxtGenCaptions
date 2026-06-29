import ffmpeg from "fluent-ffmpeg";
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
import path from "path";

async function getSpeechBounds(audioPath: string, duration: number): Promise<{start: number, end: number}> {
  return new Promise((resolve, reject) => {
    let silenceBlocks: {start: number, end: number}[] = [];
    
    let currentStart = 0;

    const command = ffmpeg(audioPath);
    command
      .audioFilters('silencedetect=noise=-30dB:d=0.5')
      .format('null')
      .on('stderr', (stderrLine) => {
        // [silencedetect @ 0x140605ec0] silence_start: 0
        // [silencedetect @ 0x140605ec0] silence_end: 3.123 | silence_duration: 3.123
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
        console.log("Silence blocks:", silenceBlocks);
        let speechStart = 0;
        let speechEnd = duration;

        // If the first silence block starts at 0, speech starts after it
        if (silenceBlocks.length > 0 && silenceBlocks[0].start <= 0.1) {
            speechStart = silenceBlocks[0].end;
        }

        // If the last silence block ends near the end of the duration, speech ends before it
        const lastBlock = silenceBlocks[silenceBlocks.length - 1];
        if (lastBlock && lastBlock.end >= duration - 0.1) {
            speechEnd = lastBlock.start;
        }

        resolve({ start: speechStart, end: speechEnd });
      })
      .on('error', (err) => {
        reject(err);
      })
      .save('pipe:1');
  });
}

async function main() {
  const audioPath = process.argv[2] || "test.mp4";
  console.log("Detecting silence in:", audioPath);
  const bounds = await getSpeechBounds(audioPath, 1.0); // using 1.0 for test.mp4
  console.log("Speech bounds:", bounds);
}

main();
