# WhisperX Microservice

A self-hosted Python FastAPI server that wraps WhisperX to produce **phoneme-level word timestamps (±10ms accuracy)** — the same technique used by professional caption platforms like Captions.ai.

## How It Works

```
Audio → Whisper large-v3 (transcription) → wav2vec2 (forced alignment) → Word-level timestamps
```

- **Pass 1 (Whisper)**: Gets the raw text transcript
- **Pass 2 (wav2vec2 forced alignment)**: Pinpoints each word to its exact start/end time in the audio

## Setup

### 1. Create a virtual environment

```bash
cd whisperx-service
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install dependencies

**CPU only (slower, works on any machine):**
```bash
pip install -r requirements.txt
```

**GPU (CUDA 12.1 — 5-10× faster):**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
```

### 3. Start the service

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1
```

The first startup downloads the `large-v3` model (~3GB). Subsequent starts load from cache in seconds.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `WHISPERX_MODEL` | `large-v3` | Model size: `tiny`, `base`, `small`, `medium`, `large-v3` |
| `WHISPERX_BATCH_SIZE` | `16` | Reduce to `4` or `8` if you run out of GPU memory |
| `HF_TOKEN` | _(empty)_ | HuggingFace token (only needed for speaker diarization) |

## API

### `GET /health`
Returns service status and whether the model is loaded.

### `POST /transcribe`
| Field | Type | Description |
|---|---|---|
| `audio` | File | Audio file (mp3, wav, m4a) |
| `language` | string | ISO code: `en`, `hi`, `ml`, `ta`, etc. Use `auto` to detect |

**Response:**
```json
{
  "language": "en",
  "duration": 42.3,
  "words": [
    { "word": "hello", "start": 0.120, "end": 0.440, "score": 0.98 },
    { "word": "world", "start": 0.460, "end": 0.810, "score": 0.99 }
  ],
  "segments": [...],
  "elapsed_seconds": 3.2
}
```

## Integration with NxtGen Backend

Set this in your backend `.env`:
```
WHISPERX_SERVICE_URL=http://localhost:8001
```

The backend automatically uses WhisperX when the service is reachable, and falls back to Deepgram if it's not running.

## Model Size vs Speed Trade-offs

| Model | VRAM | Speed (CPU) | Speed (GPU) | Accuracy |
|---|---|---|---|---|
| `tiny` | 1GB | ~10× RT | ~40× RT | Basic |
| `base` | 1GB | ~7× RT | ~30× RT | OK |
| `medium` | 5GB | ~2× RT | ~10× RT | Good |
| `large-v3` | 10GB | ~0.5× RT | ~5× RT | **Best** |

RT = real-time. "5× RT" means a 60-second video takes ~12 seconds.
