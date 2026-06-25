"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SarvamTranscriptionService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const form_data_1 = __importDefault(require("form-data"));
class SarvamTranscriptionService {
    apiKey;
    baseUrl = "https://api.sarvam.ai";
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY || "";
        if (!this.apiKey) {
            console.warn("SARVAM_API_KEY is not set in environment variables");
        }
    }
    async transcribeAudio(audioPath, onProgress, options) {
        const { language = "hi", script = "native" } = options || {};
        let endpoint = `${this.baseUrl}/speech-to-text`;
        if (script === "english") {
            endpoint = `${this.baseUrl}/speech-to-text-translate`;
        }
        const formData = new form_data_1.default();
        // Use form-data package to properly attach file streams with filenames
        formData.append("file", fs_1.default.createReadStream(audioPath), path_1.default.basename(audioPath));
        // Convert short codes (e.g., 'ta') to Sarvam format if needed, typically 'ta-IN'
        const langCodeMap = {
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
                    "api-subscription-key": this.apiKey,
                    ...formData.getHeaders()
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
            const segments = [{
                    id: 1,
                    start: 0,
                    end: 10, // dummy duration
                    text: transcriptText,
                    words: transcriptText.split(" ").map((w, i) => ({
                        word: w,
                        start: i * 0.5,
                        end: (i + 1) * 0.5
                    }))
                }];
            if (onProgress && segments.length > 0) {
                onProgress(segments[0]);
            }
            return segments;
        }
        catch (error) {
            console.error("[SarvamService] Transcription failed:", error);
            throw error;
        }
    }
}
exports.SarvamTranscriptionService = SarvamTranscriptionService;
