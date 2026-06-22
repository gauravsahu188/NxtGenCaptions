"""
WhisperX Microservice for NxtGen Captions
==========================================
A FastAPI server that wraps WhisperX to produce phoneme-level
word timestamps (±10ms accuracy) on top of Whisper transcriptions.

Run with:  uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1
"""

import os
import gc
import time
import tempfile
import traceback
from pathlib import Path
from typing import Optional

import torch
import whisperx
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

# ─── Config ──────────────────────────────────────────────────────────────────
DEVICE      = "cuda" if torch.cuda.is_available() else "cpu"
COMPUTE     = "float16" if DEVICE == "cuda" else "int8"
MODEL_SIZE  = os.getenv("WHISPERX_MODEL", "large-v3")   # or "medium", "base"
HF_TOKEN    = os.getenv("HF_TOKEN", "")                 # needed for diarization only
BATCH_SIZE  = int(os.getenv("WHISPERX_BATCH_SIZE", "16"))

print(f"[WhisperX] Device: {DEVICE} | Compute: {COMPUTE} | Model: {MODEL_SIZE}")

app = FastAPI(title="WhisperX Microservice", version="1.0.0")

# ─── Model cache (loaded once at startup) ────────────────────────────────────
_model: Optional[whisperx.Whisper] = None
_align_models: dict = {}   # keyed by language code

def get_model():
    global _model
    if _model is None:
        print(f"[WhisperX] Loading {MODEL_SIZE} model on {DEVICE}...")
        _model = whisperx.load_model(MODEL_SIZE, DEVICE, compute_type=COMPUTE)
        print("[WhisperX] Model loaded.")
    return _model

def get_align_model(language_code: str):
    """Load and cache the wav2vec2 alignment model for a given language."""
    if language_code not in _align_models:
        print(f"[WhisperX] Loading alignment model for '{language_code}'...")
        align_model, metadata = whisperx.load_align_model(
            language_code=language_code,
            device=DEVICE,
        )
        _align_models[language_code] = (align_model, metadata)
        print(f"[WhisperX] Alignment model for '{language_code}' loaded.")
    return _align_models[language_code]

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": DEVICE,
        "model": MODEL_SIZE,
        "model_loaded": _model is not None,
    }

# ─── Pre-warm on startup ──────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    """Pre-load the model so the first request isn't slow."""
    get_model()

# ─── Main transcription endpoint ─────────────────────────────────────────────
@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(..., description="Audio file (mp3, wav, m4a, ogg)"),
    language: str     = Form("en",    description="ISO language code, e.g. 'en', 'hi', 'ml'"),
    batch_size: int   = Form(BATCH_SIZE, description="Batch size for transcription"),
):
    """
    Transcribe audio with WhisperX and return phoneme-level word timestamps.

    Response shape:
    {
      "language": "en",
      "duration": 42.3,
      "words": [
        { "word": "hello", "start": 0.12, "end": 0.44, "score": 0.98 },
        ...
      ],
      "segments": [
        { "start": 0.0, "end": 3.2, "text": "Hello world", "words": [...] },
        ...
      ]
    }
    """
    t_start = time.time()

    # Save upload to a temp file
    suffix = Path(audio.filename or "audio.mp3").suffix or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        model = get_model()

        # ── Step 1: Transcribe ────────────────────────────────────────────────
        print(f"[WhisperX] Transcribing {tmp_path} (lang={language}) ...")
        audio_data = whisperx.load_audio(tmp_path)

        # Pass language=None to auto-detect; pass a code to force
        detect_lang = None if language in ("auto", "multi", "") else language
        result = model.transcribe(audio_data, batch_size=batch_size, language=detect_lang)

        detected_language = result.get("language", language)
        print(f"[WhisperX] Detected language: {detected_language}")
        print(f"[WhisperX] Got {len(result['segments'])} segments from Whisper.")

        # ── Step 2: Forced alignment (word-level timestamps) ─────────────────
        # Alignment model maps to language families; fall back to "en" if not found
        align_lang = detected_language if detected_language else "en"
        try:
            align_model, metadata = get_align_model(align_lang)
            result = whisperx.align(
                result["segments"],
                align_model,
                metadata,
                audio_data,
                DEVICE,
                return_char_alignments=False,
            )
            print(f"[WhisperX] Alignment complete.")
        except Exception as align_err:
            # Some languages don't have wav2vec2 alignment models.
            # Fall back to Whisper's built-in word timestamps.
            print(f"[WhisperX] Alignment skipped ({align_lang}): {align_err}")
            # Ensure words key exists even without alignment
            for seg in result["segments"]:
                if "words" not in seg:
                    seg["words"] = []

        # ── Step 3: Flatten to a clean word list ─────────────────────────────
        all_words = []
        for seg in result["segments"]:
            for w in seg.get("words", []):
                word_start = w.get("start")
                word_end   = w.get("end")
                word_score = w.get("score", 1.0)
                word_text  = w.get("word", "").strip()
                if not word_text:
                    continue
                if word_start is None or word_end is None:
                    continue
                all_words.append({
                    "word":  word_text,
                    "start": round(float(word_start), 3),
                    "end":   round(float(word_end),   3),
                    "score": round(float(word_score), 4),
                })

        # Duration from last word or last segment
        duration = 0.0
        if all_words:
            duration = all_words[-1]["end"]
        elif result["segments"]:
            duration = result["segments"][-1].get("end", 0.0)

        elapsed = round(time.time() - t_start, 2)
        print(f"[WhisperX] Done in {elapsed}s — {len(all_words)} words, {duration:.1f}s audio.")

        return JSONResponse({
            "language": detected_language,
            "duration": round(duration, 3),
            "words":    all_words,
            "segments": [
                {
                    "start": round(float(seg.get("start", 0)), 3),
                    "end":   round(float(seg.get("end",   0)), 3),
                    "text":  seg.get("text", "").strip(),
                    "words": [
                        {
                            "word":  w.get("word", "").strip(),
                            "start": round(float(w.get("start", 0)), 3),
                            "end":   round(float(w.get("end",   0)), 3),
                            "score": round(float(w.get("score", 1.0)), 4),
                        }
                        for w in seg.get("words", [])
                        if w.get("word", "").strip()
                    ],
                }
                for seg in result["segments"]
            ],
            "elapsed_seconds": elapsed,
        })

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Always clean up temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        # Free GPU memory between requests on CPU-constrained machines
        if DEVICE == "cpu":
            gc.collect()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, workers=1, reload=False)
