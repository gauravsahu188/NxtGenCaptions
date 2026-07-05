"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SarvamTranscriptionService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ffmpeg_service_1 = require("./ffmpeg.service");
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
function isEmphasisWord(word) {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (clean.length < 2)
        return false;
    if (clean === clean.toUpperCase() && /[A-Z]/.test(clean))
        return true;
    if (/\*[^*]+\*/.test(word))
        return true;
    if (/(.)\1{2,}/.test(clean))
        return true;
    return false;
}
/**
 * Normalise a word token:
 *  - Strip surrounding asterisks
 *  - Preserve the word's actual casing (don't forcibly lower-case)
 */
function normaliseWord(word) {
    return word.replace(/^\*+/, "").replace(/\*+$/, "").trim();
}
/**
 * Build the display text for a chunk.
 * Emphasis words get wrapped in `*...*` so the frontend can colour them.
 */
function buildChunkText(chunk) {
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
function segmentWords(words) {
    if (words.length === 0)
        return [];
    const segments = [];
    let chunk = [];
    let segId = 1;
    const flush = () => {
        if (chunk.length === 0)
            return;
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
        if (avgWordDuration <= 0)
            avgWordDuration = 0.3;
        // Fast speaking -> 3 words per line
        // Slow speaking -> 1 or 2 words per line
        let dynamicMaxWords = 3;
        if (avgWordDuration >= 0.5) {
            dynamicMaxWords = 1;
        }
        else if (avgWordDuration >= 0.35) {
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
 * Count the number of syllable-like units in a word.
 * For Hindi/Devanagari: each vowel/consonant cluster is a syllable.
 * For Latin: rough approximation using character count.
 * This gives a better proxy for speaking duration than character count alone.
 */
function estimateSyllables(word) {
    // Devanagari block: each character is roughly one unit of sound
    const devanagari = word.match(/[\u0900-\u097F]/g);
    if (devanagari && devanagari.length > 0) {
        return Math.max(1, devanagari.length);
    }
    // Latin: vowel groups = syllables (min 1)
    const vowelGroups = word.toLowerCase().match(/[aeiou]+/g);
    return Math.max(1, vowelGroups ? vowelGroups.length : Math.ceil(word.length / 3));
}
/**
 * Split a multi-word timing entry into individual words, distributing the
 * duration proportionally by syllable count so that longer/heavier words
 * get more time — matching how speech actually flows.
 */
function splitByWeight(words, blockStart, blockEnd) {
    const syllables = words.map(estimateSyllables);
    const totalSyllables = syllables.reduce((a, b) => a + b, 0);
    const blockDuration = Math.max(blockEnd - blockStart, 0.05);
    let cursor = blockStart;
    return words.map((word, i) => {
        const weight = syllables[i] / totalSyllables;
        const wordDuration = blockDuration * weight;
        const start = parseFloat(cursor.toFixed(3));
        cursor += wordDuration;
        const end = parseFloat(cursor.toFixed(3));
        return { word, start, end };
    });
}
/**
 * When Sarvam returns no timestamps at all, interpolate across the speech
 * window using syllable-weighted distribution.
 */
function interpolateTimings(words, speechStart, speechEnd) {
    return splitByWeight(words, speechStart, speechEnd);
}
// ─── Service ──────────────────────────────────────────────────────────────────
class SarvamTranscriptionService {
    apiKey;
    baseUrl = "https://api.sarvam.ai";
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY || "";
        if (!this.apiKey) {
            console.warn("[SarvamService] SARVAM_API_KEY is not set");
        }
    }
    async transcribeAudio(audioPath, onProgress, options, transformSegments) {
        const { language = "hi", script = "native", duration: passedDuration } = options || {};
        const ffmpegService = new ffmpeg_service_1.FFmpegService();
        let duration = passedDuration ?? 0;
        if (!duration) {
            try {
                duration = await ffmpegService.getVideoDuration(audioPath);
            }
            catch (e) {
                console.warn("[SarvamService] Failed to get audio duration, transcribing as single:", e);
            }
        }
        if (duration <= 5) {
            const words = await this.transcribeSingleAudio(audioPath, options, 0, duration);
            let segments = segmentWords(words);
            if (transformSegments) {
                segments = await transformSegments(segments);
            }
            if (onProgress) {
                for (const seg of segments) {
                    await onProgress(seg);
                }
            }
            return segments;
        }
        console.log(`[SarvamService] Audio duration (${duration.toFixed(1)}s) > 5s. Splitting by silence/phrase boundaries...`);
        const chunks = await ffmpegService.splitAudioBySilence(audioPath);
        console.log(`[SarvamService] Split into ${chunks.length} phrase chunks.`);
        let allWords = [];
        try {
            // Transcribe all chunks in parallel using Promise.all
            // First check each chunk for speech content to avoid hallucinations on silent segments
            const ffmpegSvc = new ffmpeg_service_1.FFmpegService();
            const transcribePromises = chunks.map(async (chunk) => {
                const hasSpeech = await ffmpegSvc.hasSpeechContent(chunk.path);
                if (!hasSpeech) {
                    console.log(`[SarvamService] Skipping silent chunk at offset ${chunk.offset.toFixed(2)}s (no speech detected)`);
                    return [];
                }
                console.log(`[SarvamService] Transcribing chunk offset: ${chunk.offset.toFixed(2)}s (${chunk.duration.toFixed(2)}s)`);
                return this.transcribeSingleAudio(chunk.path, options, chunk.offset, chunk.duration);
            });
            const results = await Promise.all(transcribePromises);
            for (const chunkWords of results) {
                allWords = allWords.concat(chunkWords);
            }
        }
        finally {
            // Clean up chunk files
            for (const chunk of chunks) {
                try {
                    if (fs_1.default.existsSync(chunk.path)) {
                        fs_1.default.unlinkSync(chunk.path);
                    }
                }
                catch (e) {
                    console.warn(`[SarvamService] Failed to delete chunk file ${chunk.path}:`, e);
                }
            }
        }
        // Segment the merged words into caption segments
        let segments = segmentWords(allWords);
        if (transformSegments) {
            segments = await transformSegments(segments);
        }
        // Progressive streaming of segments to client
        if (onProgress) {
            for (const seg of segments) {
                await onProgress(seg);
            }
        }
        return segments;
    }
    async transcribeSingleAudio(audioPath, options, offsetSeconds = 0, chunkDuration) {
        const { language = "hi", script = "native" } = options || {};
        let endpoint = `${this.baseUrl}/speech-to-text`;
        if (script === "english") {
            endpoint = `${this.baseUrl}/speech-to-text-translate`;
        }
        const formData = new FormData();
        // Attach audio file
        const fileBuffer = await fs_1.default.promises.readFile(audioPath);
        const file = new File([fileBuffer], path_1.default.basename(audioPath), { type: "audio/mpeg" });
        formData.append("file", file);
        // Language code mapping
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
            kn: "kn-IN",
        };
        const mappedLang = langCodeMap[language] || language;
        formData.append("language_code", mappedLang);
        formData.append("model", "saaras:v3");
        formData.append("mode", "verbatim");
        // ✅ Request word-level timestamps from Sarvam AI
        formData.append("with_timestamps", "true");
        try {
            console.log(`[SarvamService] Calling ${endpoint} | lang=${mappedLang} script=${script} | timestamps=true`);
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "api-subscription-key": this.apiKey,
                },
                body: formData,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sarvam API error: ${response.status} ${response.statusText} — ${errorText}`);
            }
            const data = await response.json();
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
            let wordTimings = [];
            // ── Speech bounds: for phrase chunks, the whole chunk is speech ───────────
            // We use speechStart=0 and speechEnd=chunkDuration since each phrase chunk
            // was cut at natural silence boundaries — no leading silence to skip.
            const speechStart = 0;
            const speechEnd = chunkDuration ?? 30;
            console.log(`[SarvamService] Interpolating over chunk: 0 → ${speechEnd.toFixed(2)}s (offset: ${offsetSeconds.toFixed(2)}s)`);
            // ── Case 1: Real word-level timestamps from Sarvam ────────────────────
            if (data.timestamps &&
                Array.isArray(data.timestamps.words) &&
                data.timestamps.words.length > 0 &&
                Array.isArray(data.timestamps.start_time_seconds) &&
                Array.isArray(data.timestamps.end_time_seconds)) {
                const initialTimings = data.timestamps.words.map((word, i) => {
                    const start = parseFloat((data.timestamps.start_time_seconds[i] ?? 0).toFixed(3));
                    let end = parseFloat((data.timestamps.end_time_seconds[i] ?? 0).toFixed(3));
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
                        // Use syllable-weighted split instead of equal-time slices
                        const weightedSubs = splitByWeight(subWords, timing.start, timing.end);
                        for (const sub of weightedSubs) {
                            wordTimings.push(sub);
                        }
                    }
                    else {
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
                console.log(`[SarvamService] Interpolated ${wordTimings.length} words over ~${speechStart.toFixed(1)}s to ${speechEnd.toFixed(1)}s`);
            }
            // Add offset to all word timings
            const adjustedWords = wordTimings.map((w) => ({
                ...w,
                start: parseFloat((w.start + offsetSeconds).toFixed(3)),
                end: parseFloat((w.end + offsetSeconds).toFixed(3)),
            }));
            return adjustedWords;
        }
        catch (error) {
            console.error("[SarvamService] Transcription chunk failed:", error);
            throw error;
        }
    }
    async transliterateText(text, sourceLang) {
        if (!text || text.trim() === "")
            return text;
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
            kn: "kn-IN",
        };
        const mappedSource = langCodeMap[sourceLang] || "hi-IN";
        try {
            console.log(`[SarvamService] Transliterating "${text}" from ${mappedSource} to en-IN`);
            const response = await fetch(`${this.baseUrl}/transliterate`, {
                method: "POST",
                headers: {
                    "api-subscription-key": this.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    input: text,
                    source_language_code: mappedSource,
                    target_language_code: "en-IN"
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.transliterated_text) {
                    return data.transliterated_text;
                }
            }
            else {
                const errText = await response.text();
                console.warn(`[SarvamService] Transliteration API error: ${response.status} ${errText}`);
            }
        }
        catch (e) {
            console.warn(`[SarvamService] Transliterate failed: ${e}`);
        }
        return text;
    }
    async transliterateCaptions(captions, sourceLang) {
        // Extract all text and join with a unique delimiter to batch into a single API call
        const fullText = captions.map(seg => seg.text || "").join(" ||| ");
        if (!/[^\x00-\x7F]/.test(fullText)) {
            return captions;
        }
        const transliteratedFull = await this.transliterateText(fullText, sourceLang);
        const transliteratedLines = transliteratedFull.split(/\s*\|\|\|\s*/);
        const result = [];
        for (let i = 0; i < captions.length; i++) {
            const segment = captions[i];
            const text = segment.text || "";
            const containsIndic = /[^\x00-\x7F]/.test(text);
            if (containsIndic) {
                const transliteratedText = (transliteratedLines[i] || "").trim();
                if (!transliteratedText) {
                    result.push(segment); // Fallback if splitting mismatch
                    continue;
                }
                const words = transliteratedText.split(/\s+/).filter((w) => w.length > 0);
                const originalWords = segment.words || [];
                let newWords = [];
                if (words.length === originalWords.length) {
                    newWords = words.map((w, idx) => ({
                        ...originalWords[idx],
                        word: w
                    }));
                }
                else {
                    // Fallback to equal distribution
                    const start = segment.start;
                    const end = segment.end;
                    const duration = end - start;
                    const wordDuration = duration / Math.max(words.length, 1);
                    newWords = words.map((w, index) => ({
                        word: w,
                        start: start + index * wordDuration,
                        end: start + (index + 1) * wordDuration,
                    }));
                }
                result.push({
                    ...segment,
                    text: transliteratedText,
                    words: newWords
                });
            }
            else {
                result.push(segment);
            }
        }
        return result;
    }
}
exports.SarvamTranscriptionService = SarvamTranscriptionService;
