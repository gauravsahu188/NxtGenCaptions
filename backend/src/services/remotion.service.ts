import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

// ─── Types (mirrored from video-engine/src/types.ts) ─────────────────────────
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

export type CaptionTemplate =
  | "modern" | "bubble" | "delhi" | "classic" | "neon";

export type CaptionLayout = "center" | "bottom" | "top" | "splash" | "modern" | "bubble" | "hormozi" | "ali-abdaal" | "gadzhi" | "apple" | "mogrt-shimmer-stack" | "nxtgen-genz" | "nxtgen-alpha" | "nxtgen-horror" | "nxtgen-ficticvisual" | string;

export interface CaptionStyleProps {
  template: CaptionTemplate;
  layout: CaptionLayout;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  glowColor?: string;
  borderRadius?: number;
}

export interface CaptionVideoProps {
  src: string;
  durationInSeconds: number;
  captions: CaptionSegment[];
  style: CaptionStyleProps;
  width?: number;
  height?: number;
  fps?: number;
  showWatermark?: boolean;
}
// ─────────────────────────────────────────────────────────────────────────────

const ENGINE_ENTRY = path.resolve(
  __dirname,
  "../../..",
  "video-engine",
  "src",
  "index.ts"
);

const OUTPUT_DIR = path.resolve(process.cwd(), "temp", "renders");

export class RemotionRenderService {
  /**
   * Bundles the Remotion project and renders a final .mp4 to disk.
   * Returns the absolute path to the rendered file.
   */
  async render(props: CaptionVideoProps): Promise<string> {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputFilename = `render-${Date.now()}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    console.log("[RemotionRender] Bundling composition from:", ENGINE_ENTRY);

    // 1. Bundle the Remotion project
    const bundled = await bundle({
      entryPoint: ENGINE_ENTRY,
      webpackOverride: (config) => config,
    });

    console.log("[RemotionRender] Bundle complete. Selecting composition...");

    const fps              = props.fps  ?? 30;
    const width            = props.width  ?? 1280;
    const height           = props.height ?? 720;
    const durationInFrames = Math.ceil(props.durationInSeconds * fps);

    // 2. Resolve the composition
    const composition = await selectComposition({
      serveUrl:    bundled,
      id:          "CaptionVideo",
      inputProps:  props as unknown as Record<string, unknown>,
    });

    console.log(
      `[RemotionRender] Rendering ${durationInFrames} frames @ ${fps}fps → ${outputPath}`
    );

    // 3. Render MP4
    await renderMedia({
      composition: { ...composition, durationInFrames, fps, width, height },
      serveUrl:    bundled,
      codec:       "h264",
      outputLocation: outputPath,
      inputProps:  props as unknown as Record<string, unknown>,
      concurrency: Math.max(1, (os.cpus().length ?? 4) - 1),
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 10 === 0) console.log(`[RemotionRender] ${pct}%`);
      },
    });

    console.log(`[RemotionRender] Render complete → ${outputPath}`);
    return outputPath;
  }

  cleanup(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[RemotionRender] Cleaned up: ${filePath}`);
      }
    } catch (e) {
      console.warn(`[RemotionRender] Could not clean up ${filePath}:`, e);
    }
  }
}
