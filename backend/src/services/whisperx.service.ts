/**
 * WhisperX Transcription Service
 * ================================
 * Calls the local WhisperX Python microservice (port 8001) and converts
 * its phoneme-level word timestamps into CaptionSegment[] — the same
 * shape that DeepgramTranscriptionService returns.
 *
 * The service is optional. If WHISPERX_SERVICE_URL is not set or the
 * service is not reachable, the calling code falls back to Deepgram.
 */

import fs from "fs";
import FormData from "form-data";
import type { CaptionSegment, WordTiming } from "./deepgram.service";

const WHISPERX_URL = process.env.WHISPERX_SERVICE_URL ?? "http://localhost:8001";

// ─── Language code normalisation ─────────────────────────────────────────────
// WhisperX / Whisper uses ISO 639-1 codes.  Map the app's internal codes.
const LANG_MAP: Record<string, string> = {
  auto:     "auto",
  en:       "en",
  hi:       "hi",
  hinglish: "hi",   // WhisperX transcribes in Hindi; Hinglish post-process runs after
  ne:       "ne",
  ur:       "ur",
  ta:       "ta",
  ml:       "ml",
  gu:       "gu",
  bn:       "bn",
  pa:       "pa",
  te:       "te",
  sd:       "sd",
  mr:       "mr",
  kn:       "kn",
  ps:       "ps",
  ms:       "ms",
};

// ─── Types from the Python service ───────────────────────────────────────────
interface WhisperXWord {
  word:  string;
  start: number;
  end:   number;
  score: number;
}

interface WhisperXResponse {
  language:        string;
  duration:        number;
  words:           WhisperXWord[];
  elapsed_seconds: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class WhisperXService {

  /**
   * Check if the WhisperX microservice is alive.
   * Returns false instead of throwing so callers can gracefully fallback.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${WHISPERX_URL}/health`, {
        method:  "GET",
        signal:  AbortSignal.timeout(3000),   // 3-second probe
      });
      if (!res.ok) return false;
      const data = await res.json() as { status?: string };
      return data.status === "ok";
    } catch {
      return false;
    }
  }

  /**
   * Transcribe an audio file using WhisperX and return CaptionSegments
   * with phoneme-level word timestamps.
   *
   * @param audioPath  Absolute path to the audio file on disk
   * @param language   Language code (uses LANG_MAP; defaults to "auto")
   * @param onSegment  Optional streaming callback — called once per caption
   *                   segment as they are built (mirrors Deepgram behaviour)
   */
  async transcribeAudio(
    audioPath: string,
    language   = "auto",
    onSegment?: (segment: CaptionSegment) => void,
  ): Promise<CaptionSegment[]> {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`[WhisperX] Audio file not found: ${audioPath}`);
    }

    const whisperLang = LANG_MAP[language] ?? "auto";
    console.log(`[WhisperX] Sending ${audioPath} → ${WHISPERX_URL}/transcribe (lang=${whisperLang})`);

    // ── Build multipart form ──────────────────────────────────────────────
    const form = new FormData();
    form.append("audio",    fs.createReadStream(audioPath));
    form.append("language", whisperLang);

    // ── Call the Python service ───────────────────────────────────────────
    const res = await fetch(`${WHISPERX_URL}/transcribe`, {
      method:  "POST",
      body:    form as any,
      headers: form.getHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[WhisperX] Service error (${res.status}): ${errText}`);
    }

    const data = await res.json() as WhisperXResponse;

    console.log(
      `[WhisperX] Done — lang=${data.language}, ` +
      `${data.words.length} words, ${data.duration.toFixed(1)}s audio, ` +
      `took ${data.elapsed_seconds}s`
    );

    if (!data.words.length) {
      console.warn("[WhisperX] Received 0 words — audio may be silent or too short.");
      return [];
    }

    return this.groupWordsIntoSegments(data.words, onSegment);
  }

  // ─── Group flat word list into caption segments ───────────────────────────
  /**
   * Identical pacing logic to DeepgramTranscriptionService so captions
   * look and feel the same regardless of which backend generated them.
   */
  private groupWordsIntoSegments(
    words:      WhisperXWord[],
    onSegment?: (segment: CaptionSegment) => void,
  ): CaptionSegment[] {
    const segments: CaptionSegment[] = [];
    let currentWords: WordTiming[]   = [];

    words.forEach((w, index) => {
      const wordText = w.word.trim();
      if (!wordText) return;

      currentWords.push({ word: wordText, start: w.start, end: w.end });

      const hasPunctuation = /[.!?]$/.test(wordText);
      const isLastWord     = index === words.length - 1;

      // Pace-aware max words per caption line
      const segDuration = currentWords[currentWords.length - 1].end - currentWords[0].start;
      const avgDuration =
        currentWords.length > 1
          ? segDuration / currentWords.length
          : w.end - w.start;

      let maxWords = 2;
      if (avgDuration >= 0.4) maxWords = 3;       // slow speaker
      else if (avgDuration <= 0.28) maxWords = 1; // fast speaker

      // Break on long silence gap (> 1s between words)
      let hasLongGap = false;
      if (!isLastWord && index + 1 < words.length) {
        if (words[index + 1].start - w.end > 1.0) hasLongGap = true;
      }

      const isTooLong = currentWords.length >= maxWords;

      if (hasPunctuation || isTooLong || isLastWord || hasLongGap) {
        if (currentWords.length > 0) {
          const segment: CaptionSegment = {
            id:    (segments.length + 1).toString(),
            start: currentWords[0].start,
            end:   currentWords[currentWords.length - 1].end,
            text:  currentWords.map(cw => cw.word).join(" "),
            words: [...currentWords],
          };
          segments.push(segment);
          if (onSegment) onSegment(segment);
          currentWords = [];
        }
      }
    });

    return segments;
  }
}

// Singleton export
export const whisperxService = new WhisperXService();
