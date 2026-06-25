"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const inference_1 = require("@huggingface/inference");
class TranslationService {
    hfToken = process.env.HF_TOKEN;
    model = "Helsinki-NLP/opus-mt-hi-en";
    async translateHindiToEnglish(text) {
        if (!text || text.trim() === "")
            return text;
        // 1. Try Hugging Face Inference API
        if (this.hfToken && this.hfToken !== "your_huggingface_token_here") {
            try {
                console.log(`[Translation] Attempting Hugging Face translation for: "${text}"`);
                const hf = new inference_1.HfInference(this.hfToken);
                const result = await hf.translation({
                    model: this.model,
                    inputs: text,
                });
                if (result && result.translation_text) {
                    console.log(`[Translation] HF translation success: "${result.translation_text}"`);
                    return result.translation_text;
                }
            }
            catch (error) {
                console.warn(`[Translation] Hugging Face translation failed: ${error.message}. Trying fallback...`);
            }
        }
        // 2. Fallback to MyMemory translation API (free, no key required)
        try {
            console.log(`[Translation] Attempting MyMemory API translation for: "${text}"`);
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=hi|en`;
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.responseData?.translatedText) {
                    console.log(`[Translation] MyMemory translation success: "${data.responseData.translatedText}"`);
                    return data.responseData.translatedText;
                }
            }
            console.warn(`[Translation] MyMemory API translation response not OK: ${response.status}`);
        }
        catch (error) {
            console.warn(`[Translation] MyMemory translation failed: ${error.message}`);
        }
        // Return original text if all translations fail
        return text;
    }
    async translateCaptions(captions) {
        const translatedCaptions = [];
        for (const segment of captions) {
            const text = segment.text || "";
            const containsDevanagari = /[ऀ-ॿ]/.test(text);
            if (containsDevanagari) {
                const translatedText = await this.translateHindiToEnglish(text);
                // Split translated text into words
                const words = translatedText.split(/\s+/).filter(w => w.length > 0);
                const start = segment.start;
                const end = segment.end;
                const duration = end - start;
                const wordDuration = duration / Math.max(words.length, 1);
                const newWords = words.map((w, index) => ({
                    word: w,
                    start: start + index * wordDuration,
                    end: start + (index + 1) * wordDuration,
                }));
                translatedCaptions.push({
                    ...segment,
                    text: translatedText,
                    words: newWords
                });
            }
            else {
                translatedCaptions.push(segment);
            }
        }
        return translatedCaptions;
    }
}
exports.TranslationService = TranslationService;
