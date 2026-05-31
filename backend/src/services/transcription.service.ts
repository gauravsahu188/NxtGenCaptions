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

export class TranscriptionService {
  private model = "openai/whisper-large-v3-turbo";

  async transcribeAudio(audioPath: string, onSegment?: (segment: CaptionSegment) => void): Promise<CaptionSegment[]> {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken || hfToken === "your_huggingface_token_here") {
      console.log("[Transcription] HF_TOKEN not set, returning mock data...");
      const mock = this.getMockCaptions();
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
      console.log(`[Transcription] Starting Hugging Face transcription for: ${audioPath}`);
      
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found at path: ${audioPath}`);
      }

      const audioBuffer = fs.readFileSync(audioPath);
      const base64Audio = audioBuffer.toString("base64");

      const response = await this.callHuggingFace({
        inputs: base64Audio,
        parameters: {
          return_timestamps: "word",
          chunk_length_s: 30
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HF API Error (${response.status}): ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      console.log("[Transcription] Received response from Hugging Face.");
      if (data.text) console.log(`[Transcription] Full text preview: ${data.text.substring(0, 100)}...`);
      
      if (!data.chunks || data.chunks.length === 0) {
        console.warn("[Transcription] SUCCESS but NO CHUNKS in response. Data keys:", Object.keys(data));
        return [];
      }

      console.log(`[Transcription] SUCCESS! Extracted ${data.chunks.length} chunks/words.`);
      if (data.chunks.length > 0) console.log("[Transcription] First chunk sample:", JSON.stringify(data.chunks[0]));
      
      return this.groupWordsIntoSegments(data.chunks, onSegment);
    } catch (error: any) {
      console.error("[Transcription] CRITICAL FAILURE:", error.message);
      return [];
    }
  }

  private async callHuggingFace(payload: any, retryCount = 0): Promise<Response> {
    const hfToken = process.env.HF_TOKEN;
    const maxRetries = 5;
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true"
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 503 && retryCount < maxRetries) {
      const waitTime = 10000;
      console.log(`[Transcription] Model loading, retrying in ${waitTime/1000}s... (Attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitTime));
      return this.callHuggingFace(payload, retryCount + 1);
    }

    return response;
  }

  private groupWordsIntoSegments(chunks: any[], onSegment?: (segment: CaptionSegment) => void): CaptionSegment[] {
    const segments: CaptionSegment[] = [];
    let currentWords: WordTiming[] = [];

    chunks.forEach((chunk: any, index: number) => {
      const wordText = chunk.text.trim();
      if (!wordText) return;

      currentWords.push({
        word: wordText,
        start: chunk.timestamp[0],
        end: chunk.timestamp[1]
      });

      const hasPunctuation = /[.!?]$/.test(wordText);
      const isLastWord = index === chunks.length - 1;

      // Intelligent words per line arrangement based on pace
      // Pace is determined by the average duration of words in the current segment
      const segmentDuration = currentWords[currentWords.length - 1].end - currentWords[0].start;
      const avgDuration = currentWords.length > 1 
        ? segmentDuration / currentWords.length 
        : (chunk.timestamp[1] - chunk.timestamp[0]);

      let maxWords = 1; // Default case
      
      if (avgDuration >= 0.4) {
        maxWords = 3; // Slow pace
      } else if (avgDuration <= 0.28) {
        maxWords = 2; // Fast pace
      }

      const isTooLong = currentWords.length >= maxWords;

      if (hasPunctuation || isTooLong || isLastWord) {
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

  private getMockCaptions(): CaptionSegment[] {
    const phrases = [
      "Hugging Face Whisper Service",
      "is now handling your audio.",
      "Please ensure HF_TOKEN is valid",
      "in your backend .env file.",
      "Once connected, we will use",
      "whisper-large-v3-turbo",
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
