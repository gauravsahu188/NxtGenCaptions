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
}

export class SarvamTranscriptionService {
  private apiKey: string;
  private baseUrl: string = "https://api.sarvam.ai";

  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY || "";
    if (!this.apiKey) {
      console.warn("SARVAM_API_KEY is not set in environment variables");
    }
  }

  async transcribeAudio(
    audioPath: string,
    onProgress?: (segment: CaptionSegment) => void,
    options?: { language?: string; script?: string }
  ): Promise<CaptionSegment[]> {
    const { language = "hi", script = "native" } = options || {};

    let endpoint = `${this.baseUrl}/speech-to-text`;
    if (script === "english") {
      endpoint = `${this.baseUrl}/speech-to-text-translate`;
    }

    const formData = new FormData();
    
    // Read file and convert to native Node 20 File object
    const fileBuffer = await fs.promises.readFile(audioPath);
    const file = new File([fileBuffer], path.basename(audioPath), { type: "audio/mpeg" });
    formData.append("file", file);
    
    // Convert short codes (e.g., 'ta') to Sarvam format if needed, typically 'ta-IN'
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
      kn: "kn-IN"
    };
    const mappedLang = langCodeMap[language] || language;
    formData.append("language_code", mappedLang);

    // If Sarvam's API takes a specific parameter for script/model
    // We assume model 'saaras:v3' handles transliteration when passed a parameter, 
    // or we might need to rely on the transliteration endpoint if it exists.
    formData.append("model", "saaras:v3"); // using saaras:v3 based on API requirements

    try {
      console.log(`[SarvamService] Sending audio to Sarvam AI (${endpoint}) for lang: ${mappedLang}, script: ${script}`);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "api-subscription-key": this.apiKey
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam AI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[SarvamService] Sarvam AI response received`);

      // Mocking segment creation from bulk response since Sarvam returns full transcript
      // In a real production scenario with timestamps, we'd parse timestamps from Sarvam if available.
      // If timestamps aren't available, we create a single segment or chunk it.
      
      const transcriptText = (data.translated_text || data.transcript || "") + " [via Sarvam AI]";
      
      // Split into 5-second chunks roughly or just one big segment for now
      const segments: CaptionSegment[] = [{
        id: 1,
        start: 0,
        end: 10, // dummy duration
        text: transcriptText,
        words: transcriptText.split(" ").map((w: string, i: number) => ({
          word: w,
          start: i * 0.5,
          end: (i + 1) * 0.5
        }))
      }];

      if (onProgress && segments.length > 0) {
        onProgress(segments[0]);
      }

      return segments;
    } catch (error) {
      console.error("[SarvamService] Transcription failed:", error);
      throw error;
    }
  }
}
