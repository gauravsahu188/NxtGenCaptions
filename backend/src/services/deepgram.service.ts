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
  language?: string; // 'en', 'hi', 'hinglish', 'auto', 'bn', 'kn', 'ml', 'mr', 'od', 'pa', 'ta', 'te', 'gu', 'ur', 'ne', 'kok', 'ks', 'sd', 'sa', 'sat', 'mni', 'brx', 'mai', 'doi', 'as'
  model?: string;    // 'nova-2', 'whisper-large', etc.
}

const LANGUAGE_MODEL_MAPPING: Record<string, string> = {
  hi:       "nova-3",
  en:       "nova-3",
  bn:       "nova-3",
  kn:       "nova-3",
  ml:       "nova-3",
  mr:       "nova-3",
  pa:       "nova-3",
  ta:       "nova-3",
  te:       "nova-3",
  gu:       "nova-3",
  ur:       "nova-3",
  ne:       "nova-3",
  sd:       "nova-3",
  od:       "nova-3",
  as:       "nova-3",
  kok:      "nova-3",
  ks:       "nova-3",
  sa:       "nova-3",
  sat:      "nova-3",
  mni:      "nova-3",
  brx:      "nova-3",
  mai:      "nova-3",
  doi:      "nova-3",
  ps:       "nova-3",
  ms:       "nova-3",
  auto:     "nova-3",
  hinglish: "nova-3",
};

export class DeepgramTranscriptionService {
  private defaultModel = "nova-3";
  private defaultLanguage = "auto";

  async transcribeAudio(
    audioPath: string,
    onSegment?: (segment: CaptionSegment) => void,
    options?: TranscriptionOptions
  ): Promise<CaptionSegment[]> {
    const language = options?.language || this.defaultLanguage;
    const model = options?.model || LANGUAGE_MODEL_MAPPING[language] || this.defaultModel;
    const apiKey = process.env.DEEPGRAM_API_KEY;

    console.log("[DeepgramTranscription] Transcribe called. apiKey exists:", !!apiKey, "length:", apiKey?.length);

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

    try {
      console.log(`[DeepgramTranscription] Starting transcription for: ${audioPath}`);
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
          "Content-Type": "audio/mpeg",
        },
        body: audioBuffer,
        signal: AbortSignal.timeout(90000), // 90s timeout — prevent silent hangs
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
      console.log(`[DeepgramTranscription] Detected language: ${alternative.language || "unknown"}`);

      return this.groupWordsIntoSegments(alternative.words, onSegment);
    } catch (error: any) {
      console.error("[DeepgramTranscription] CRITICAL FAILURE:", error.message);
      return [];
    }
  }

  private buildApiUrl(model: string, language: string): string {
    const baseUrl = "https://api.deepgram.com/v1/listen";

    // "auto" and "en" use language=multi so Deepgram auto-detects.
    const resolvesToMulti = (language === "auto" || language === "en");
    const resolvedModel = model; // always nova-3

    const params = new URLSearchParams({
      model:        resolvedModel,
      smart_format: "true",
      punctuate:    "true",
      words:        "true",
      diarize:      "false",
      filler_words: "false",
    });

    if (resolvesToMulti) {
      params.append("language", "multi");
    } else {
      // hinglish → hi-Latn (romanised Hindi output directly from Deepgram)
      // hi       → hi     (native Devanagari — nova-2 handles it well)
      params.append("language", language === "hinglish" ? "hi-Latn" : language);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private groupWordsIntoSegments(
    words: any[],
    onSegment?: (segment: CaptionSegment) => void
  ): CaptionSegment[] {
    const segments: CaptionSegment[] = [];
    let currentWords: WordTiming[] = [];

    words.forEach((word: any, index: number) => {
      const wordText = word.punctuated_word || word.word || word.punct || word.text;
      if (!wordText || wordText.trim() === "") return;

      const start =
        typeof word.start === "number"
          ? word.start
          : currentWords.length > 0
          ? currentWords[currentWords.length - 1].end
          : 0;
      const end = typeof word.end === "number" ? word.end : start + 0.3;

      currentWords.push({ word: wordText.trim(), start, end });

      const hasPunctuation = /[.!?]$/.test(wordText);
      const isLastWord = index === words.length - 1;

      const segmentDuration =
        currentWords[currentWords.length - 1].end - currentWords[0].start;
      const avgDuration =
        currentWords.length > 1
          ? segmentDuration / currentWords.length
          : end - start;

      let maxWords = 2;
      if (avgDuration >= 0.4) maxWords = 3;
      else if (avgDuration <= 0.28) maxWords = 1;

      let hasLongGap = false;
      if (!isLastWord && index + 1 < words.length) {
        const nextWordStart =
          typeof words[index + 1].start === "number" ? words[index + 1].start : end;
        if (nextWordStart - end > 1.0) hasLongGap = true;
      }

      const isTooLong = currentWords.length >= maxWords;

      if (hasPunctuation || isTooLong || isLastWord || hasLongGap) {
        if (currentWords.length > 0) {
          // Filter out segments that are just noise hallucinations (e.g. repeated "haan")
          const segmentText = currentWords.map(cw => cw.word).join(" ").toLowerCase().replace(/[^a-z ]/g, '').trim();
          const isHallucination = segmentText.split(' ').every(w => w === "haan" || w === "hm" || w === "hmm");
          
          if (!isHallucination) {
            const segment: CaptionSegment = {
              id:    (segments.length + 1).toString(),
              start: currentWords[0].start,
              end:   currentWords[currentWords.length - 1].end,
              text:  currentWords.map(cw => cw.word).join(" "),
              words: [...currentWords],
            };
            segments.push(segment);
            if (onSegment) onSegment(segment);
          }
          currentWords = [];
        }
      }
    });

    return segments;
  }

  private getMockCaptions(language: string = "en"): CaptionSegment[] {
    const languageNames: Record<string, string> = {
      en: "English", hi: "Hindi", hinglish: "Hinglish",
      bn: "Bengali", kn: "Kannada", ml: "Malayalam",
      mr: "Marathi", od: "Odia", pa: "Punjabi",
      ta: "Tamil", te: "Telugu", gu: "Gujarati",
      ur: "Urdu", ne: "Nepali", kok: "Konkani",
      ks: "Kashmiri", sd: "Sindhi", sa: "Sanskrit",
      sat: "Santali", mni: "Manipuri", brx: "Bodo",
      mai: "Maithili", doi: "Dogri", as: "Assamese",
      ps: "Pushto", ms: "Malay",
      auto: "Auto Detect",
    };
    const langName = languageNames[language] || "English";

    const phrases =
      language === "hinglish" || language === "hi"
        ? [
            "Deepgram Transcription Service",
            "ab Hinglish support karta hai",
            "Please ensure DEEPGRAM_API_KEY is valid",
            "aapke backend .env file mein",
            "Once connected, hum use karenge",
            "whisper-medium model",
            "precise word-level timing ke liye",
            "Ready to enhance your video!",
          ]
        : [
            "Deepgram Transcription Service",
            `Generating captions for ${langName}.`,
            "Please ensure DEEPGRAM_API_KEY is valid",
            "in your backend .env file.",
            "Once connected, we will use the model",
            "for precise word-level timing.",
            "Ready to enhance your video!",
          ];

    const segments: CaptionSegment[] = [];
    const timePerPhrase = 2.5;

    phrases.forEach((text, i) => {
      const start = i * timePerPhrase;
      const end = start + timePerPhrase;
      const words = text.split(" ").map((w, wi) => ({
        word:  w,
        start: start + wi * 0.3,
        end:   start + (wi + 1) * 0.3,
      }));
      segments.push({ id: `mock-${i}`, start, end, text, words });
    });

    return segments;
  }
}