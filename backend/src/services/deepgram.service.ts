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
  language?: string; // 'en', 'hi', 'hinglish', 'auto'
  model?: string; // 'whisper-medium', 'whisper-large', etc.
}

export class DeepgramTranscriptionService {
  private defaultModel = "nova-2"; // nova-2 supports detect_language; whisper does not
  private defaultLanguage = "auto"; // Auto-detect language

  async transcribeAudio(audioPath: string, onSegment?: (segment: CaptionSegment) => void, options?: TranscriptionOptions): Promise<CaptionSegment[]> {
    const language = options?.language || this.defaultLanguage;
    const model = options?.model || this.defaultModel;
    const apiKey = process.env.DEEPGRAM_API_KEY;
    console.log("[DeepgramTranscription] Transcribe called. apiKey exists:", !!apiKey, "length:", apiKey?.length);
    console.log("[DeepgramTranscription] Checking if condition:", (!apiKey || apiKey === "your_deepgram_api_key_here"));

    if (!apiKey || apiKey === "your_deepgram_api_key_here") {
      console.log("[DeepgramTranscription] DEEPGRAM_API_KEY not set, returning mock data...");
      const mock = this.getMockCaptions(language);
      if (onSegment) {
        // Simulate real-time streaming for mock data
        for (const s of mock) {
          await new Promise(r => setTimeout(r, 800)); // 800ms delay per segment
          onSegment(s);
        }
      }
      return mock;
    }

    try {
      console.log(`[DeepgramTranscription] Starting Deepgram transcription for: ${audioPath}`);
      console.log(`[DeepgramTranscription] Language: ${language}, Model: ${model}`);

      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found at path: ${audioPath}`);
      }

      const audioBuffer = fs.readFileSync(audioPath);

      // Build API URL with language and other parameters
      const apiUrl = this.buildApiUrl(model, language);
      console.log(`[DeepgramTranscription] API URL: ${apiUrl}`);

      // Call Deepgram API with word-level timestamps
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

      // Get the best alternative
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

  private buildApiUrl(model: string, language: string): string {
    const baseUrl = "https://api.deepgram.com/v1/listen";

    // whisper models do NOT support detect_language — use nova-2 for auto-detect
    const resolvedModel = (language === "auto" && model.startsWith("whisper")) ? "nova-2" : model;

    const params = new URLSearchParams({
      model: resolvedModel,
      smart_format: "true",
      punctuate: "true",
      words: "true",    // word-level timestamps (correct param name)
      diarize: "false",
    });

    if (language !== "auto") {
      // Hinglish → use Hindi language code
      params.append("language", language === "hinglish" ? "hi" : language);
    } else {
      // detect_language only works with nova-2/nova-3
      params.append("detect_language", "true");
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
      : language === "auto"
      ? [
          "Deepgram Transcription Service",
          "Detecting language automatically",
          "Please ensure DEEPGRAM_API_KEY is valid",
          "in your backend .env file.",
          "Once connected, we will use",
          "whisper-medium model",
          "for precise word-level timing.",
          "Ready to enhance your video!"
        ]
      : [
          "Deepgram Transcription Service",
          "is now handling your audio.",
          "Please ensure DEEPGRAM_API_KEY is valid",
          "in your backend .env file.",
          "Once connected, we will use",
          "whisper-medium model",
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