import fs from "fs";
import path from "path";

export class AudioEnhancementService {
  private hfToken = process.env.HF_TOKEN;
  private model = "facebook/denoiser";

  async cleanAudio(audioPath: string): Promise<string> {
    // Skip audio enhancement for now since Hugging Face API is not working
    // The transcription quality from Deepgram is good enough without enhancement
    console.log("[AudioEnhancement] Skipping audio enhancement (using raw audio for transcription)...");
    return audioPath;
  }

  private async callHuggingFace(data: Buffer, retryCount = 0): Promise<Response> {
    const maxRetries = 5;
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.hfToken}`,
        "Content-Type": "audio/mpeg"
      },
      body: new Uint8Array(data)
    });

    // 503 means model is still loading
    if (response.status === 503 && retryCount < maxRetries) {
      const waitTime = 5000; // Wait 5 seconds
      console.log(`[AudioEnhancement] Model loading, retrying in ${waitTime/1000}s... (Attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitTime));
      return this.callHuggingFace(data, retryCount + 1);
    }

    return response;
  }
}
