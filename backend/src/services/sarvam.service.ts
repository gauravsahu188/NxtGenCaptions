import fs from "fs";
import path from "path";
import { FFmpegService } from "./ffmpeg.service";

export interface CaptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: { word: string; start: number; end: number }[];
}

export interface SarvamResponse {
  transcript?: string;
  translated_text?: string;
  timestamps?: {
    words: string[];
    start_time_seconds: number[];
    end_time_seconds: number[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────



/** Maximum characters per caption chunk */
const MAX_CHARS_PER_CHUNK = 28;

/** Sentence-ending punctuation — always force a new chunk after these */
const SENTENCE_END_RE = /[.!?।]$/;

/**
 * Detect if a word should be treated as "emphasised".
 * Rules:
 *  1. ALL-CAPS word with 2+ letters (e.g. NOW, STOP, NEVER)
 *  2. Word already wrapped in asterisks: *word*
 *  3. Elongated words: "soooo", "yayyy" (3+ of same letter in a row)
 */
function isEmphasisWord(word: string): boolean {
  const clean = word.replace(/[^a-zA-Z]/g, "");
  if (clean.length < 2) return false;
  if (clean === clean.toUpperCase() && /[A-Z]/.test(clean)) return true;
  if (/\*[^*]+\*/.test(word)) return true;
  if (/(.)\1{2,}/.test(clean)) return true;
  return false;
}

/**
 * Normalise a word token:
 *  - Strip surrounding asterisks
 *  - Preserve the word's actual casing (don't forcibly lower-case)
 */
function normaliseWord(word: string): string {
  return word.replace(/^\*+/, "").replace(/\*+$/, "").trim();
}

/**
 * Build the display text for a chunk.
 * Emphasis words get wrapped in `*...*` so the frontend can colour them.
 */
function buildChunkText(
  chunk: { word: string; start: number; end: number }[]
): string {
  return chunk
    .map((w) => {
      const clean = normaliseWord(w.word);
      return isEmphasisWord(w.word) ? `*${clean}*` : clean;
    })
    .join(" ");
}

/**
 * Segment a flat list of word timings into caption chunks.
 * Logic mirrors intelligent auto mode:
 *  - Break dynamically based on speech speed (Fast: 3 words, Slow: 1-2 words)
 *  - Break when adding the next word would exceed MAX_CHARS_PER_CHUNK
 *  - Always break after sentence-ending punctuation
 */
function segmentWords(
  words: { word: string; start: number; end: number }[]
): CaptionSegment[] {
  if (words.length === 0) return [];

  const segments: CaptionSegment[] = [];
  let chunk: typeof words = [];
  let segId = 1;

  const flush = () => {
    if (chunk.length === 0) return;
    segments.push({
      id: segId++,
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
      text: buildChunkText(chunk),
      words: chunk.map((w) => ({ word: normaliseWord(w.word), start: w.start, end: w.end })),
    });
    chunk = [];
  };

  for (const w of words) {
    const prospective = [...chunk, w];
    const prospectiveText = prospective.map((x) => normaliseWord(x.word)).join(" ");

    // Intelligent auto mode based on speech speed
    // Calculate average duration per word in the prospective chunk
    const chunkDuration = prospective[prospective.length - 1].end - prospective[0].start;
    // Fallback to individual word duration if chunk duration is 0
    let avgWordDuration = chunkDuration > 0 
      ? chunkDuration / prospective.length 
      : (w.end - w.start);
      
    // Default fallback if we still don't have a valid duration
    if (avgWordDuration <= 0) avgWordDuration = 0.3;

    // Fast speaking -> 3 words per line
    // Slow speaking -> 1 or 2 words per line
    let dynamicMaxWords = 3;
    if (avgWordDuration >= 0.5) {
      dynamicMaxWords = 1;
    } else if (avgWordDuration >= 0.35) {
      dynamicMaxWords = 2;
    }

    // Flush if adding this word exceeds limits (only if chunk already has words)
    const hitWords = chunk.length >= dynamicMaxWords;
    const hitChars = prospectiveText.length > MAX_CHARS_PER_CHUNK && chunk.length > 0;

    if (hitWords || hitChars) {
      flush();
    }

    chunk.push(w);

    // Flush after sentence-ending punctuation
    if (SENTENCE_END_RE.test(normaliseWord(w.word))) {
      flush();
    }
  }

  flush(); // remaining words
  return segments;
}

/**
 * When Sarvam returns no timestamps, interpolate evenly across the word list.
 * This is a graceful fallback — not ideal, but avoids the single-tile problem.
 */
function interpolateTimings(
  words: string[],
  speechStart: number,
  speechEnd: number
): { word: string; start: number; end: number }[] {
  const duration = Math.max(speechEnd - speechStart, 0.1);
  const durationPerWord = duration / Math.max(words.length, 1);
  return words.map((word, i) => ({
    word,
    start: parseFloat((speechStart + i * durationPerWord).toFixed(3)),
    end: parseFloat((speechStart + (i + 1) * durationPerWord).toFixed(3)),
  }));
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SarvamTranscriptionService {
  private apiKey: string;
  private baseUrl: string = "https://api.sarvam.ai";

  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY || "";
    if (!this.apiKey) {
      console.warn("[SarvamService] SARVAM_API_KEY is not set");
    }
  }

  async transcribeAudio(
    audioPath: string,
    onProgress?: (segment: CaptionSegment) => void,
    options?: { language?: string; script?: string; duration?: number }
  ): Promise<CaptionSegment[]> {
    const { language = "hi", script = "native", duration: passedDuration } = options || {};

    const ffmpegService = new FFmpegService();
    let duration = passedDuration ?? 0;
    if (!duration) {
      try {
        duration = await ffmpegService.getVideoDuration(audioPath);
      } catch (e) {
        console.warn("[SarvamService] Failed to get audio duration, transcribing as single:", e);
      }
    }

    if (duration <= 12) {
      const words = await this.transcribeSingleAudio(audioPath, options, 0, duration);
      const segments = segmentWords(words);
      if (onProgress) {
        for (const seg of segments) {
          onProgress(seg);
        }
      }
      return segments;
    }

    console.log(`[SarvamService] Audio duration (${duration.toFixed(1)}s) > 12s. Chunking audio file...`);
    const chunks = await ffmpegService.splitAudio(audioPath, 12);
    console.log(`[SarvamService] Split into ${chunks.length} chunks.`);

    let allWords: { word: string; start: number; end: number }[] = [];
    
    try {
      // Transcribe all chunks in parallel using Promise.all
      const transcribePromises = chunks.map(async (chunk) => {
        console.log(`[SarvamService] Transcribing chunk offset: ${chunk.offset}s`);
        return this.transcribeSingleAudio(chunk.path, options, chunk.offset, chunk.duration);
      });
      const results = await Promise.all(transcribePromises);
      for (const chunkWords of results) {
        allWords = allWords.concat(chunkWords);
      }
    } finally {
      // Clean up chunk files
      for (const chunk of chunks) {
        try {
          if (fs.existsSync(chunk.path)) {
            fs.unlinkSync(chunk.path);
          }
        } catch (e) {
          console.warn(`[SarvamService] Failed to delete chunk file ${chunk.path}:`, e);
        }
      }
    }

    // Segment the merged words into caption segments
    const segments = segmentWords(allWords);
    
    // Progressive streaming of segments to client
    if (onProgress) {
      for (const seg of segments) {
        onProgress(seg);
      }
    }

    return segments;
  }

  private async transcribeSingleAudio(
    audioPath: string,
    options?: { language?: string; script?: string },
    offsetSeconds: number = 0,
    chunkDuration?: number
  ): Promise<{ word: string; start: number; end: number }[]> {
    const { language = "hi", script = "native" } = options || {};

    let endpoint = `${this.baseUrl}/speech-to-text`;
    if (script === "english") {
      endpoint = `${this.baseUrl}/speech-to-text-translate`;
    }

    const formData = new FormData();

    // Attach audio file
    const fileBuffer = await fs.promises.readFile(audioPath);
    const file = new File([fileBuffer], path.basename(audioPath), { type: "audio/mpeg" });
    formData.append("file", file);

    // Language code mapping
    const langCodeMap: Record<string, string> = {
      hi: "hi-IN",
      en: "en-IN",
      ta: "ta-IN",
      ml: "ml-IN",
      te: "te-IN",
      bn: "bn-IN",
      gu: "gu-IN",
      mr: "mr-IN",
      pa: "pa-IN",
      ur: "ur-IN",
      kn: "kn-IN",
    };
    const mappedLang = langCodeMap[language] || language;
    formData.append("language_code", mappedLang);
    formData.append("model", "saaras:v3");
    formData.append("mode", "verbatim");

    // ✅ Request word-level timestamps from Sarvam AI
    formData.append("with_timestamps", "true");

    try {
      console.log(
        `[SarvamService] Calling ${endpoint} | lang=${mappedLang} script=${script} | timestamps=true`
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "api-subscription-key": this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Sarvam API error: ${response.status} ${response.statusText} — ${errorText}`
        );
      }

      const data: SarvamResponse = await response.json();
      console.log(`[SarvamService] Response received. Has timestamps: ${!!data.timestamps}`);
      if (data.timestamps) {
        console.log(`[SarvamService] Timestamps lengths - words: ${data.timestamps.words?.length}, start: ${data.timestamps.start_time_seconds?.length}, end: ${data.timestamps.end_time_seconds?.length}`);
        console.log(`[SarvamService] Raw Timestamps:`, JSON.stringify(data.timestamps));
      }

      const rawTranscript = data.translated_text || data.transcript || "";
      if (!rawTranscript.trim()) {
        console.warn("[SarvamService] Empty transcript received");
        return [];
      }

      let wordTimings: { word: string; start: number; end: number }[] = [];

      // ── Get true speech bounds for this chunk ──────────────────────────────
      const ffmpegSvc = new FFmpegService();
      let estimatedDuration = chunkDuration ?? 30;
      if (!chunkDuration) {
        try {
          const stat = await fs.promises.stat(audioPath);
          estimatedDuration = Math.max(5, stat.size / 16000);
        } catch { /* ignore */ }
      }
      const bounds = await ffmpegSvc.getSpeechBounds(audioPath, estimatedDuration);
      const speechStart = bounds.start;
      const speechEnd = bounds.end;
      
      console.log(`[SarvamService] Chunk Speech Bounds - start: ${speechStart.toFixed(2)}s, end: ${speechEnd.toFixed(2)}s`);

      // ── Case 1: Real word-level timestamps from Sarvam ────────────────────
      if (
        data.timestamps &&
        Array.isArray(data.timestamps.words) &&
        data.timestamps.words.length > 0 &&
        Array.isArray(data.timestamps.start_time_seconds) &&
        Array.isArray(data.timestamps.end_time_seconds)
      ) {
        const initialTimings = data.timestamps.words.map((word, i) => {
          const start = parseFloat((data.timestamps!.start_time_seconds[i] ?? 0).toFixed(3));
          let end = parseFloat((data.timestamps!.end_time_seconds[i] ?? 0).toFixed(3));
          // Fallback to chunkDuration if end time is 0 or invalid
          if (end <= start && chunkDuration) {
            end = chunkDuration;
          }
          return { word: word.trim(), start, end };
        }).filter((w) => w.word.length > 0);

        // Check if Sarvam trimmed the leading silence
        let needsShift = false;
        if (speechStart > 0.5 && initialTimings.length > 0) {
            if (initialTimings[0].start < 0.5) {
                needsShift = true;
                console.log(`[SarvamService] Detected missing leading silence in timestamps. Shifting by ${speechStart.toFixed(2)}s`);
            }
        }

        initialTimings.forEach((timing) => {
          if (needsShift) {
             timing.start = parseFloat((timing.start + speechStart).toFixed(3));
             timing.end = parseFloat((timing.end + speechStart).toFixed(3));
          }
          const subWords = timing.word.split(/[\s\u200B-\u200D\uFEFF]+/u).filter(Boolean);
          if (subWords.length > 1) {
             const duration = timing.end - timing.start;
             const subDuration = duration / subWords.length;
             subWords.forEach((sub, idx) => {
               wordTimings.push({
                 word: sub,
                 start: parseFloat((timing.start + idx * subDuration).toFixed(3)),
                 end: parseFloat((timing.start + (idx + 1) * subDuration).toFixed(3))
               });
             });
          } else {
             wordTimings.push(timing);
          }
        });

        console.log(`[SarvamService] Using real timestamps for ${wordTimings.length} words`);
      }
      // ── Case 2: Fallback — interpolate from raw transcript ────────────────
      else {
        console.warn("[SarvamService] No timestamps in response — interpolating timings");
        const rawWords = rawTranscript.trim().split(/[\s\u200B-\u200D\uFEFF]+/u).filter(Boolean);

        wordTimings = interpolateTimings(rawWords, speechStart, speechEnd);
        console.log(
          `[SarvamService] Interpolated ${wordTimings.length} words over ~${speechStart.toFixed(1)}s to ${speechEnd.toFixed(1)}s`
        );
      }

      // Add offset to all word timings
      const adjustedWords = wordTimings.map((w) => ({
        ...w,
        start: parseFloat((w.start + offsetSeconds).toFixed(3)),
        end: parseFloat((w.end + offsetSeconds).toFixed(3)),
      }));

      return adjustedWords;
    } catch (error) {
      console.error("[SarvamService] Transcription chunk failed:", error);
      throw error;
    }
  }
}
