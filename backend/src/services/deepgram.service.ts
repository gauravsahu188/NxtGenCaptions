import fs from "fs";
import path from "path";

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
}

export interface TranscriptionOptions {
  language?: string; // 'en', 'hi', 'hinglish', 'auto', 'ne', 'ur', 'ta', 'ml', 'gu', 'bn', 'pa', 'te', 'sd', 'mr', 'kn', 'ps', 'ms'
  model?: string; // 'whisper-medium', 'whisper-large', etc.
  dualLanguage?: { primary: string; secondary: string }; // e.g. { primary: 'ml', secondary: 'en' }
}

// Internal word type that includes Deepgram's confidence score
interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
  confidence: number;
}

const LANGUAGE_MODEL_MAPPING: Record<string, string> = {
  hi:       "nova-2",
  en:       "nova-2",
  ne:       "whisper-large",
  ur:       "nova-2",
  ta:       "nova-2",
  // nova-2 returns proper Unicode Malayalam/Punjabi script;
  // whisper-large tends to transliterate to phonetic English characters.
  ml:       "nova-2",
  gu:       "nova-2",
  bn:       "nova-2",
  pa:       "nova-2",
  te:       "nova-2",
  sd:       "whisper-large",
  mr:       "nova-2",
  kn:       "nova-2",
  ps:       "whisper-large",
  ms:       "nova-2",
  auto:     "nova-2",
  hinglish: "nova-2"
};

export class DeepgramTranscriptionService {
  private defaultModel = "nova-2"; // nova-2 supports detect_language; whisper does not
  private defaultLanguage = "auto"; // Auto-detect language

  async transcribeAudio(audioPath: string, onSegment?: (segment: CaptionSegment) => void, options?: TranscriptionOptions): Promise<CaptionSegment[]> {
    const language = options?.language || this.defaultLanguage;
    const model = options?.model || LANGUAGE_MODEL_MAPPING[language] || this.defaultModel;
    const apiKey = process.env.DEEPGRAM_API_KEY;
    console.log("[DeepgramTranscription] Transcribe called. apiKey exists:", !!apiKey, "length:", apiKey?.length);
    console.log("[DeepgramTranscription] Checking if condition:", (!apiKey || apiKey === "your_deepgram_api_key_here"));

    if (!apiKey || apiKey === "your_deepgram_api_key_here") {
      console.log("[DeepgramTranscription] DEEPGRAM_API_KEY not set, returning mock data...");
      const mock = this.getMockCaptions(language);
      if (onSegment) {
        for (const s of mock) {
          await new Promise(r => setTimeout(r, 800));
          onSegment(s);
        }
      }
      return mock;
    }

    // ── Dual-language mode (e.g. Malayalam + English) ──────────────────────
    if (options?.dualLanguage) {
      return this.transcribeDualLanguage(audioPath, options.dualLanguage, onSegment);
    }

    try {
      console.log(`[DeepgramTranscription] Starting Deepgram transcription for: ${audioPath}`);
      console.log(`[DeepgramTranscription] Language: ${language}, Model: ${model}`);

      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found at path: ${audioPath}`);
      }

      const audioBuffer = fs.readFileSync(audioPath);

      const apiUrl = this.buildApiUrl(model, language);
      console.log(`[DeepgramTranscription] API URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "audio/mpeg"
        },
        body: audioBuffer
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Deepgram API Error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      console.log("[DeepgramTranscription] Received response from Deepgram.");

      if (!data.results?.channels?.length) {
        console.warn("[DeepgramTranscription] No results in response");
        return [];
      }

      const channel = data.results.channels[0];
      console.log(`[DeepgramTranscription] Extracted ${channel.alternatives.length} alternatives.`);

      const alternative = channel.alternatives[0];

      if (!alternative?.words?.length) {
        console.warn("[DeepgramTranscription] No words in transcription");
        return [];
      }

      console.log(`[DeepgramTranscription] SUCCESS! Extracted ${alternative.words.length} words.`);
      console.log(`[DeepgramTranscription] Detected language: ${alternative.language || 'unknown'}`);

      return this.groupWordsIntoSegments(alternative.words, onSegment);
    } catch (error: any) {
      console.error("[DeepgramTranscription] CRITICAL FAILURE:", error.message);
      return [];
    }
  }

  /**
   * Dual-language transcription:
   * Runs two Deepgram calls in parallel (primary regional + English),
   * then merges them by picking the higher-confidence language per 500ms window.
   */
  async transcribeDualLanguage(
    audioPath: string,
    langs: { primary: string; secondary: string },
    onSegment?: (segment: CaptionSegment) => void
  ): Promise<CaptionSegment[]> {
    const apiKey = process.env.DEEPGRAM_API_KEY!;
    console.log(`[DeepgramDual] Starting dual transcription: ${langs.primary} + ${langs.secondary}`);

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }
    const audioBuffer = fs.readFileSync(audioPath);

    const primaryModel = LANGUAGE_MODEL_MAPPING[langs.primary] || "nova-2";
    const secondaryModel = LANGUAGE_MODEL_MAPPING[langs.secondary] || "nova-2";

    // Bug fix: forceExact=true so secondary "en" sends language=en (not language=multi)
    const callDeepgram = async (lang: string, model: string, forceExact = false): Promise<DeepgramWord[]> => {
      const url = this.buildApiUrl(model, lang, forceExact);
      console.log(`[DeepgramDual] Calling Deepgram [${lang}] URL: ${url}`);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Authorization": `Token ${apiKey}`, "Content-Type": "audio/mpeg" },
          body: audioBuffer
        });
        if (!res.ok) {
          const err = await res.text();
          // Don't throw — a failing call should return [] so the other call
          // can still be used rather than aborting the whole transcription.
          console.error(`[DeepgramDual] [${lang}] API error (${res.status}): ${err}`);
          return [];
        }
        const data = await res.json();
        const words: DeepgramWord[] = data.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
        console.log(`[DeepgramDual] [${lang}] returned ${words.length} words. First: ${words[0]?.word ?? "(none)"}`);
        return words;
      } catch (err: any) {
        console.error(`[DeepgramDual] [${lang}] fetch error:`, err.message);
        return [];
      }
    };

    // ── Fire both calls simultaneously ──────────────────────────────────────
    //  forceExact=true on both so each call uses its exact language code,
    //  not the "language=multi" override that buildApiUrl applies to "en".
    const [primaryWords, secondaryWords] = await Promise.all([
      callDeepgram(langs.primary,   primaryModel,   true),   // e.g. language=ml
      callDeepgram(langs.secondary, secondaryModel, true),   // e.g. language=en (NOT multi)
    ]);

    console.log(`[DeepgramDual] Primary (${langs.primary}): ${primaryWords.length} words`);
    console.log(`[DeepgramDual] Secondary (${langs.secondary}): ${secondaryWords.length} words`);

    const mergedWords = this.mergeByConfidence(primaryWords, secondaryWords);
    console.log(`[DeepgramDual] Merged: ${mergedWords.length} words`);

    return this.groupWordsIntoSegments(mergedWords, onSegment);
  }

  /**
   * Merges two word arrays by splitting audio into 500ms windows
   * and picking the language with higher average confidence per window.
   *
   *  Window size: 500ms — small enough to catch fast switches,
   *  large enough to average out per-word noise.
   */
  private mergeByConfidence(primary: DeepgramWord[], secondary: DeepgramWord[]): DeepgramWord[] {
    if (!primary.length) {
      console.warn("[DeepgramDual] Primary language returned 0 words — falling back to secondary only.");
      return secondary;
    }
    if (!secondary.length) {
      console.warn("[DeepgramDual] Secondary language returned 0 words — using primary only.");
      return primary;
    }
    console.log(`[DeepgramDual] Merging ${primary.length} primary + ${secondary.length} secondary words by confidence.`);

    const WINDOW_MS = 0.5; // 500ms buckets

    // Find total audio duration
    const maxEnd = Math.max(
      primary[primary.length - 1]?.end ?? 0,
      secondary[secondary.length - 1]?.end ?? 0
    );

    const merged: DeepgramWord[] = [];

    for (let windowStart = 0; windowStart < maxEnd; windowStart += WINDOW_MS) {
      const windowEnd = windowStart + WINDOW_MS;

      // Words whose midpoint falls inside this window
      const inWindow = (words: DeepgramWord[]) =>
        words.filter(w => {
          const mid = (w.start + w.end) / 2;
          return mid >= windowStart && mid < windowEnd;
        });

      const primaryWindow = inWindow(primary);
      const secondaryWindow = inWindow(secondary);

      if (!primaryWindow.length && !secondaryWindow.length) continue;

      // Average confidence for each language in this window
      const avgConf = (words: DeepgramWord[]) =>
        words.length === 0 ? 0 : words.reduce((sum, w) => sum + w.confidence, 0) / words.length;

      const primaryConf = avgConf(primaryWindow);
      const secondaryConf = avgConf(secondaryWindow);

      // Pick the winner for this window
      const winner = primaryConf >= secondaryConf ? primaryWindow : secondaryWindow;
      merged.push(...winner);
    }

    // Sort by start time (windows may produce out-of-order words at boundaries)
    return merged.sort((a, b) => a.start - b.start);
  }

  /**
   * Build Deepgram API URL.
   * @param forceExact - When true, skip the "auto/en → multi" override.
   *   Use this for dual-language calls where each call must target its
   *   specific language (e.g. language=en, not language=multi).
   */
  private buildApiUrl(model: string, language: string, forceExact = false): string {
    const baseUrl = "https://api.deepgram.com/v1/listen";

    // In normal (single) mode: "auto" and "en" use language=multi so Deepgram
    // auto-detects. whisper doesn't support multi — swap to nova-2.
    const resolvesToMulti = !forceExact && (language === "auto" || language === "en");
    const resolvedModel = (resolvesToMulti && model.startsWith("whisper")) ? "nova-2" : model;

    const params = new URLSearchParams({
      model: resolvedModel,
      smart_format: "true",
      punctuate: "true",
      words: "true",
      diarize: "false",
    });

    if (resolvesToMulti) {
      params.append("language", "multi");
    } else {
      // Hinglish → use Hindi language code; otherwise pass the exact code
      params.append("language", language === "hinglish" ? "hi" : language);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private groupWordsIntoSegments(words: any[], onSegment?: (segment: CaptionSegment) => void): CaptionSegment[] {
    const segments: CaptionSegment[] = [];
    let currentWords: WordTiming[] = [];

    words.forEach((word: any, index: number) => {
      // Deepgram uses punctuated_word when smart_format is on
      const wordText = word.punctuated_word || word.word || word.punct || word.text;
      if (!wordText || wordText.trim() === "") return;

      // Robust fallback for timestamps
      const start = typeof word.start === 'number' ? word.start : (currentWords.length > 0 ? currentWords[currentWords.length - 1].end : 0);
      const end = typeof word.end === 'number' ? word.end : start + 0.3;

      currentWords.push({
        word: wordText.trim(),
        start,
        end
      });

      const hasPunctuation = /[.!?]$/.test(wordText);
      const isLastWord = index === words.length - 1;

      // Intelligent words per line arrangement based on pace
      const segmentDuration = currentWords[currentWords.length - 1].end - currentWords[0].start;
      const avgDuration = currentWords.length > 1
        ? segmentDuration / currentWords.length
        : (end - start);

      let maxWords = 2; // Default case

      if (avgDuration >= 0.4) {
        maxWords = 3; // Slow pace
      } else if (avgDuration <= 0.28) {
        maxWords = 1; // Fast pace - impactful 1 word per line
      }

      // If we encounter a large gap in speech (e.g. > 1 second), we should definitely break the segment
      let hasLongGap = false;
      if (!isLastWord && index + 1 < words.length) {
        const nextWordStart = typeof words[index + 1].start === 'number' ? words[index + 1].start : end;
        if (nextWordStart - end > 1.0) {
          hasLongGap = true;
        }
      }

      const isTooLong = currentWords.length >= maxWords;

      if (hasPunctuation || isTooLong || isLastWord || hasLongGap) {
        if (currentWords.length > 0) {
          const segment = {
            id: (segments.length + 1).toString(),
            start: currentWords[0].start,
            end: currentWords[currentWords.length - 1].end,
            text: currentWords.map(cw => cw.word).join(" "),
            words: [...currentWords]
          };
          segments.push(segment);
          if (onSegment) onSegment(segment);
          currentWords = [];
        }
      }
    });

    return segments;
  }

  private getMockCaptions(language: string = "en"): CaptionSegment[] {
    const languageNames: Record<string, string> = {
      en: "English", hi: "Hindi", hinglish: "Hinglish", ne: "Nepali",
      ur: "Urdu", ta: "Tamil", ml: "Malayalam", gu: "Gujarati",
      bn: "Bengali", pa: "Punjabi", te: "Telugu", sd: "Sindhi",
      mr: "Marathi", kn: "Kannada", ps: "Pushto", ms: "Malay", auto: "Auto Detect International"
    };
    const langName = languageNames[language] || "English";

    const phrases = language === "hinglish" || language === "hi"
      ? [
          "Deepgram Transcription Service",
          "ab Hinglish support karta hai",
          "Please ensure DEEPGRAM_API_KEY is valid",
          "aapke backend .env file mein",
          "Once connected, hum use karenge",
          "whisper-medium model",
          "precise word-level timing ke liye",
          "Ready to enhance your video!"
        ]
      : [
          "Deepgram Transcription Service",
          `Generating captions for ${langName}.`,
          "Please ensure DEEPGRAM_API_KEY is valid",
          "in your backend .env file.",
          "Once connected, we will use the model",
          "for precise word-level timing.",
          "Ready to enhance your video!"
        ];

    const segments: CaptionSegment[] = [];
    const timePerPhrase = 2.5;

    phrases.forEach((text, i) => {
      const start = i * timePerPhrase;
      const end = start + timePerPhrase;
      const words = text.split(" ").map((w, wi) => ({
        word: w,
        start: start + (wi * 0.3),
        end: start + ((wi + 1) * 0.3)
      }));

      segments.push({
        id: `mock-${i}`,
        start,
        end,
        text,
        words
      });
    });

    return segments;
  }
}