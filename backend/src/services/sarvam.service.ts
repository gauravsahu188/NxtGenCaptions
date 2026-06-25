import fs from "fs";
import path from "path";

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

/** Maximum words per caption chunk (Kallakar/Captik style: 1–6 words) */
const MAX_WORDS_PER_CHUNK = 6;

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
 * Logic mirrors popular tools (Kallakar, Captik, Captions.ai):
 *  - Break after MAX_WORDS_PER_CHUNK words
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

    // Flush if adding this word exceeds limits (only if chunk already has words)
    const hitWords = chunk.length >= MAX_WORDS_PER_CHUNK;
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
  totalDuration: number
): { word: string; start: number; end: number }[] {
  const durationPerWord = totalDuration / Math.max(words.length, 1);
  return words.map((word, i) => ({
    word,
    start: parseFloat((i * durationPerWord).toFixed(3)),
    end: parseFloat(((i + 1) * durationPerWord).toFixed(3)),
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
    options?: { language?: string; script?: string }
  ): Promise<CaptionSegment[]> {
    const { language = "hi", script = "native" } = options || {};

    // Choose endpoint based on script
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

      // Prefer translated_text for speech-to-text-translate endpoint
      const rawTranscript = data.translated_text || data.transcript || "";
      if (!rawTranscript.trim()) {
        console.warn("[SarvamService] Empty transcript received");
        return [];
      }

      let wordTimings: { word: string; start: number; end: number }[] = [];

      // ── Case 1: Real word-level timestamps from Sarvam ────────────────────
      if (
        data.timestamps &&
        Array.isArray(data.timestamps.words) &&
        data.timestamps.words.length > 0 &&
        Array.isArray(data.timestamps.start_time_seconds) &&
        Array.isArray(data.timestamps.end_time_seconds)
      ) {
        wordTimings = data.timestamps.words.map((word, i) => ({
          word: word.trim(),
          start: parseFloat((data.timestamps!.start_time_seconds[i] ?? 0).toFixed(3)),
          end: parseFloat((data.timestamps!.end_time_seconds[i] ?? 0).toFixed(3)),
        })).filter((w) => w.word.length > 0);

        console.log(`[SarvamService] Using real timestamps for ${wordTimings.length} words`);
      }
      // ── Case 2: Fallback — interpolate from raw transcript ────────────────
      else {
        console.warn("[SarvamService] No timestamps in response — interpolating timings");
        const rawWords = rawTranscript.trim().split(/\s+/).filter(Boolean);

        // Try to get audio duration from file size as a rough estimate
        // (default to 30s if we can't determine it)
        let estimatedDuration = 30;
        try {
          const stat = await fs.promises.stat(audioPath);
          // Rough estimate: 128kbps MP3 = ~16000 bytes/second
          estimatedDuration = Math.max(5, stat.size / 16000);
        } catch {
          // ignore
        }

        wordTimings = interpolateTimings(rawWords, estimatedDuration);
        console.log(
          `[SarvamService] Interpolated ${wordTimings.length} words over ~${estimatedDuration.toFixed(1)}s`
        );
      }

      // ── Segment into natural caption chunks ───────────────────────────────
      const segments = segmentWords(wordTimings);
      console.log(`[SarvamService] Created ${segments.length} caption segments`);

      // Stream segments progressively
      if (onProgress) {
        for (const seg of segments) {
          onProgress(seg);
        }
      }

      return segments;
    } catch (error) {
      console.error("[SarvamService] Transcription failed:", error);
      throw error;
    }
  }
}
