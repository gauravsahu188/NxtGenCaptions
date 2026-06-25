"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemotionRenderService = void 0;
const bundler_1 = require("@remotion/bundler");
const renderer_1 = require("@remotion/renderer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
// ─────────────────────────────────────────────────────────────────────────────
const ENGINE_ENTRY = path_1.default.resolve(__dirname, "../../..", "video-engine", "src", "index.ts");
const OUTPUT_DIR = path_1.default.resolve(process.cwd(), "temp", "renders");
class RemotionRenderService {
    /**
     * Bundles the Remotion project and renders a final .mp4 to disk.
     * Returns the absolute path to the rendered file.
     */
    async render(props) {
        if (!fs_1.default.existsSync(OUTPUT_DIR)) {
            fs_1.default.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        const outputFilename = `render-${Date.now()}.mp4`;
        const outputPath = path_1.default.join(OUTPUT_DIR, outputFilename);
        console.log("[RemotionRender] Bundling composition from:", ENGINE_ENTRY);
        // 1. Bundle the Remotion project
        const bundled = await (0, bundler_1.bundle)({
            entryPoint: ENGINE_ENTRY,
            webpackOverride: (config) => config,
        });
        console.log("[RemotionRender] Bundle complete. Selecting composition...");
        const fps = props.fps ?? 30;
        const width = props.width ?? 1280;
        const height = props.height ?? 720;
        const durationInFrames = Math.ceil(props.durationInSeconds * fps);
        // 2. Resolve the composition
        const composition = await (0, renderer_1.selectComposition)({
            serveUrl: bundled,
            id: "CaptionVideo",
            inputProps: props,
        });
        console.log(`[RemotionRender] Rendering ${durationInFrames} frames @ ${fps}fps → ${outputPath}`);
        // 3. Render MP4
        await (0, renderer_1.renderMedia)({
            composition: { ...composition, durationInFrames, fps, width, height },
            serveUrl: bundled,
            codec: "h264",
            outputLocation: outputPath,
            inputProps: props,
            concurrency: Math.max(1, (os_1.default.cpus().length ?? 4) - 1),
            onProgress: ({ progress }) => {
                const pct = Math.round(progress * 100);
                if (pct % 10 === 0)
                    console.log(`[RemotionRender] ${pct}%`);
            },
        });
        console.log(`[RemotionRender] Render complete → ${outputPath}`);
        return outputPath;
    }
    cleanup(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`[RemotionRender] Cleaned up: ${filePath}`);
            }
        }
        catch (e) {
            console.warn(`[RemotionRender] Could not clean up ${filePath}:`, e);
        }
    }
}
exports.RemotionRenderService = RemotionRenderService;
