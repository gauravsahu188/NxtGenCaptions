"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Film, Lock, Unlock, Droplets, Zap,
  CheckCircle, Download, AlertCircle, Crown, Sparkles, HelpCircle
} from "lucide-react";
import Link from "next/link";
import PaymentModal from "@/components/PaymentModal";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ExportUser {
  id: string; name: string | null; email: string | null;
  image: string | null; planType: string;
}

const PLAN_MAX_RES: Record<string, number> = {
  FREE: 720, EDITOR: 1080, CREATOR: 2160, BUSINESS: 2160,
};

const RESOLUTIONS = [
  { value: 480,  label: "480p",    desc: "SD",        plans: ["FREE","EDITOR","CREATOR","BUSINESS"] },
  { value: 720,  label: "720p HD", desc: "Standard",  plans: ["FREE","EDITOR","CREATOR","BUSINESS"] },
  { value: 1080, label: "1080p",   desc: "Full HD",   plans: ["EDITOR","CREATOR","BUSINESS"] },
  { value: 2160, label: "4K",      desc: "Ultra HD",  plans: ["CREATOR","BUSINESS"] },
];

const BITRATES = [
  { value: "auto",  label: "Auto",   desc: "Optimized" },
  { value: "high",  label: "High",   desc: "~8 Mbps" },
  { value: "ultra", label: "Ultra",  desc: "~16 Mbps" },
];

const PROGRESS_STAGES = [
  { pct: 0,   label: "Loading video into memory..." },
  { pct: 10,  label: "Initializing browser hardware encoder..." },
  { pct: 20,  label: "Rendering and encoding..." },
  { pct: 95,  label: "Finalizing video container..." },
  { pct: 100, label: "Export complete!" },
];

function formatSRTTime(seconds: number): string {
  const pad = (num: number, size: number) => num.toString().padStart(size, "0");
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
}

function generateSRT(captions: any[]): string {
  if (!captions) return "";
  return captions
    .map((seg, index) => {
      const num = index + 1;
      const start = formatSRTTime(seg.start);
      const end = formatSRTTime(seg.end);
      const text = seg.text;
      return `${num}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ExportPageClient({ user }: { user: ExportUser }) {
  const router = useRouter();
  const planType = user.planType ?? "FREE";
  const maxRes   = PLAN_MAX_RES[planType] ?? 720;

  // Export state from sessionStorage
  const [ctx, setCtx]   = useState<any>(null);
  const [ready, setReady] = useState(false);

  // Editable settings
  const [projectName, setProjectName] = useState("My NxtGen Export");
  const [resolution,  setResolution]  = useState(720);
  const [bitrate,     setBitrate]     = useState("auto");
  const [watermark,   setWatermark]   = useState(planType === "FREE");
  const [alphaChannel, setAlphaChannel] = useState(false);
  const [srtExport,    setSrtExport]    = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Render state
  type Phase = "idle" | "rendering" | "done" | "error";
  const [phase,       setPhase]       = useState<Phase>("idle");
  const [progress,    setProgress]    = useState(0);
  const [stageLabel,  setStageLabel]  = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg,    setErrorMsg]    = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Warning on navigation / close during render
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === "rendering") {
        e.preventDefault();
        e.returnValue = "Render is in progress. Do not close this window or switch tabs.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);

  // Load context from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nxtgen_export");
      if (!raw) { router.replace("/editor"); return; }
      const data = JSON.parse(raw);
      setCtx(data);
      if (data.captionStyle) {
        setProjectName("My NxtGen Export");
        if (data.captionStyle.alphaChannel !== undefined) {
          setAlphaChannel(data.captionStyle.alphaChannel);
        }
        if (data.captionStyle.srtExport !== undefined) {
          setSrtExport(data.captionStyle.srtExport);
        }
      }
      setReady(true);
    } catch {
      router.replace("/editor");
    }
  }, []);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Pass entire caption style to Remotion so layout is identical
  function buildRemotionStyle(cs: any) {
    return {
      ...cs,
      template: cs?.layout ?? "modern",
      layout: cs?.layout ?? "modern",
      // Use the same default fontSize as the editor (32) to ensure consistent preview/export
      fontSize: cs?.fontSize ?? 32,
    };
  }

  // Start render client-side
  async function handleExport() {
    if (!ctx || !ctx.videoUrl) {
      setErrorMsg("Video source URL not found.");
      setPhase("error");
      return;
    }

    setPhase("rendering");
    setProgress(0);
    setStageLabel("Loading video into browser memory...");
    setErrorMsg("");

    try {
      // 1. Calculate resolution & dimensions
      let width = resolution;
      let height = 720;
      const finalRes = resolution;
      const { originalVideoWidth, originalVideoHeight, aspectRatio } = ctx;

      if (originalVideoWidth && originalVideoHeight) {
        const isPortrait = originalVideoHeight > originalVideoWidth;
        if (isPortrait) {
          width = finalRes;
          height = Math.round(finalRes * (originalVideoHeight / originalVideoWidth));
        } else {
          height = finalRes;
          width = Math.round(finalRes * (originalVideoWidth / originalVideoHeight));
        }
      } else if (aspectRatio === "9:16") {
        width = finalRes;
        height = Math.round(finalRes * (16 / 9));
      } else {
        width = Math.round(finalRes * (16 / 9));
        height = finalRes;
      }

      // Ensure dimensions are even (required for H.264 video codec encoding)
      width = width % 2 !== 0 ? width + 1 : width;
      height = height % 2 !== 0 ? height + 1 : height;

      // 2. Set up export canvas from the DOM (mounted in progress popup)
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = document.getElementById("export-canvas") as HTMLCanvasElement;
      if (!canvas) throw new Error("Render canvas not found in DOM.");
      canvas.width = width;
      canvas.height = height;
      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) throw new Error("Could not create 2D canvas context.");

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      // Force fresh cache-bypassing fetch with Origin headers to satisfy CORS
      video.src = ctx.videoUrl + (ctx.videoUrl.includes("?") ? "&" : "?") + "cors_cb=" + Date.now();
      video.muted = false; // We need to capture the audio!
      video.playsInline = true;

      // We append it to body but hide it, to make sure browser plays it
      video.style.position = "fixed";
      video.style.top = "-9999px";
      video.style.left = "-9999px";
      video.style.width = "100px";
      video.style.height = "100px";
      document.body.appendChild(video);

      setStageLabel("Preparing encoder...");

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Failed to load video source. Check S3 CORS configuration."));
      });

      // Wait for fonts to be completely ready
      setStageLabel("Loading styles and custom fonts...");
      try {
        await document.fonts.ready;
        // Introduce a small buffer for Next.js CSS rendering context
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (e) {
        console.warn("Fonts ready promise failed:", e);
      }

      // 4. Set up audio context
      setStageLabel("Setting up audio pipeline...");
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination); // Let user hear the audio during export

      // 5. Capture tracks
      const canvasStream = canvas.captureStream(30);
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }

      // 6. Set up MediaRecorder
      let mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/mp4";

      let kbps = 4000000; // default 4 Mbps
      if (bitrate === "high") kbps = 8000000;
      else if (bitrate === "ultra") kbps = 16000000;

      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: kbps,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // 7. Render & Recording Loop
      let animationFrameId: number;
      
      const renderScale = width / (ctx.captionStyle.previewWidth || 400);
      const captions = ctx.captions || [];

      // Preprocess captions: extend last word end -> segment end
      const processedCaptions = captions.map((seg: any) => {
        if (!seg.words || seg.words.length === 0) return seg;
        const words = [...seg.words];
        words[words.length - 1] = { ...words[words.length - 1], end: seg.end };
        return { ...seg, words };
      });

      const drawVideoFrame = () => {
        const iw = video.videoWidth;
        const ih = video.videoHeight;
        if (!iw || !ih) return;

        const r = Math.min(width / iw, height / ih);
        let nw = iw * r;
        let nh = ih * r;
        if (nw < width) nw = width;
        if (nh < height) nh = height;

        const cw = iw / (nw / width);
        const ch = ih / (nh / height);

        const cx = Math.max(0, (iw - cw) * 0.5);
        const cy = Math.max(0, (ih - ch) * 0.5);

        canvasCtx.drawImage(video, cx, cy, cw, ch, 0, 0, width, height);
      };

      const drawLoop = () => {
        if (video.paused || video.ended) return;

        // Draw video frame
        drawVideoFrame();

        // Draw captions
        const currentTime = video.currentTime;
        const activeCaption = processedCaptions.find((seg: any) =>
          currentTime >= seg.start && currentTime <= seg.end
        );

        if (activeCaption) {
          drawCaptionOnCanvas(
            canvasCtx,
            activeCaption,
            ctx.captionStyle,
            currentTime,
            width,
            height,
            renderScale,
            layoutTemplateMapping(ctx.captionStyle.layout || "modern")
          );
        }

        // Draw watermark
        if (watermark) {
          drawWatermarkOnCanvas(canvasCtx, width, height, renderScale);
        }

        // Update progress in UI
        const currentProgress = Math.round((video.currentTime / video.duration) * 100);
        setProgress(Math.min(95, Math.max(20, currentProgress)));
        setStageLabel(`Rendering frame: ${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s`);

        animationFrameId = requestAnimationFrame(drawLoop);
      };

      // 8. MediaRecorder callbacks
      mediaRecorder.onstop = async () => {
        try {
          cancelAnimationFrame(animationFrameId);
          video.pause();

          // Clean up elements
          try {
            document.body.removeChild(video);
          } catch {}
          audioCtx.close();

          // Compile output blob
          setStageLabel("Finalizing video container...");
          setProgress(98);
          
          const finalBlob = new Blob(chunks, { type: mimeType });
          const finalUrl = URL.createObjectURL(finalBlob);

          setDownloadUrl(finalUrl);
          setProgress(100);
          setStageLabel("Export complete!");
          setPhase("done");

          // Auto-download video using a clean click trigger (always .mp4 for compatibility)
          const a = document.createElement("a");
          a.href = finalUrl;
          a.download = `${projectName}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Auto-download SRT if enabled
          if (srtExport && ctx.captions) {
            const srtContent = generateSRT(ctx.captions);
            const blob = new Blob([srtContent], { type: "text/srt;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const aSrt = document.createElement("a");
            aSrt.href = url;
            aSrt.setAttribute("download", `${projectName}.srt`);
            document.body.appendChild(aSrt);
            aSrt.click();
            document.body.removeChild(aSrt);
            URL.revokeObjectURL(url);
          }
        } catch (err: any) {
          console.error("Error on MediaRecorder stop:", err);
          setErrorMsg(err.message || "Error compiling output video.");
          setPhase("error");
        }
      };

      // 9. Start recording
      video.onplay = () => {
        mediaRecorder.start();
        setStageLabel("Encoding video stream...");
        setProgress(20);
        drawLoop();
      };

      video.onended = () => {
        mediaRecorder.stop();
      };

      // Check for duration limit manually or handle manual end
      const checkEndTimer = setInterval(() => {
        if (video.currentTime >= video.duration || video.ended) {
          clearInterval(checkEndTimer);
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }
      }, 500);

      // Start playback
      await audioCtx.resume();
      await video.play();

    } catch (e: any) {
      console.error("Client side export error:", e);
      setErrorMsg(e.message || "Unknown rendering error. Make sure your video source supports CORS.");
      setPhase("error");
    }
  }

  function handleDownloadClick() {
    if (!downloadUrl) return;

    // Download video
    const ext = alphaChannel ? "webm" : "mp4";
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.setAttribute("download", `${projectName}.${ext}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Download SRT if enabled
    if (srtExport && ctx?.captions) {
      const srtContent = generateSRT(ctx.captions);
      const blob = new Blob([srtContent], { type: "text/srt;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const aSrt = document.createElement("a");
      aSrt.href = url;
      aSrt.setAttribute("download", `${projectName}.srt`);
      document.body.appendChild(aSrt);
      aSrt.click();
      document.body.removeChild(aSrt);
      URL.revokeObjectURL(url);
    }
  }

  if (!ready) return (
    <div className="min-h-screen bg-(--color-bg-base) flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-(--color-bg-base) text-(--color-foreground) font-sans overflow-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Roboto:wght@400;500;700;900&family=Poppins:wght@400;600;700;800;900&family=Montserrat:wght@400;600;700;800;900&family=Oswald:wght@400;600;700&family=Bebas+Neue&family=Space+Grotesk:wght@400;600;700&family=Great+Vibes&display=swap');
        @font-face {
          font-family: 'JaggyW01-Regular';
          src: url('/fonts/jaggy-w01-regular.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Chalk-y';
          src: url('/fonts/chalk-y.otf') format('opentype');
        }
        @font-face {
          font-family: 'Bastliga One';
          src: url('/fonts/bastliga/Bastliga One.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Droid 1997';
          src: url('/fonts/droid-1997.otf') format('opentype');
        }
      `}} />
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[1000px] bg-accent/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] left-[-10%] w-[600px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.01] z-0 mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_40%,transparent_100%)]" />
      </div>

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/4 bg-black/20 backdrop-blur-xl">
        <Link href="/editor" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Editor</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-bold tracking-[0.2em] text-accent uppercase">Export Studio</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          {planType !== "FREE" && <Crown className="w-3.5 h-3.5 text-accent" />}
          <span className="text-xs font-bold text-zinc-300 tracking-wider">{planType}</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-xs tracking-[0.25em] text-accent/70 uppercase mb-2 font-semibold">Final Export</p>
          <h1 className="text-4xl font-black tracking-tight">
            Ready to <span className="text-accent">Render</span>?
          </h1>
        </motion.div>

        {/* Card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — Settings card (3 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white/2 border border-white/6 rounded-3xl p-8 space-y-8 backdrop-blur-sm"
          >
            {/* Project Name */}
            <div>
              <label className="text-xs tracking-widest uppercase text-zinc-500 font-bold mb-3 block">Project Name</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={phase === "rendering"}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xl font-bold tracking-tight focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder-zinc-600 disabled:opacity-50"
                placeholder="My Cinematic Export"
              />
            </div>

            {/* Resolution */}
            <div>
              <label className="text-xs tracking-widest uppercase text-zinc-500 font-bold mb-3 block">Resolution</label>
              <div className="grid grid-cols-2 gap-3">
                {RESOLUTIONS.map((r) => {
                  const locked   = r.value > maxRes;
                  const selected = resolution === r.value && !locked;
                  return (
                    <button
                      key={r.value}
                      disabled={locked || phase === "rendering"}
                      onClick={() => !locked && setResolution(r.value)}
                      className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        selected
                          ? "border-accent/60 bg-accent/10 shadow-[0_0_20px_rgba(94,106,210,0.15)]"
                          : locked
                          ? "border-white/5 bg-white/10 opacity-50 cursor-not-allowed"
                          : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4 cursor-pointer"
                      }`}
                    >
                      <div className="text-left">
                        <p className={`font-bold text-base ${selected ? "text-accent" : locked ? "text-zinc-600" : "text-white"}`}>
                          {r.label}
                        </p>
                        <p className="text-xs text-zinc-500">{r.desc}</p>
                      </div>
                      {locked ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg">
                          <Lock className="w-3 h-3 text-zinc-600" />
                          <span className="text-[10px] text-zinc-600 font-bold">UPGRADE</span>
                        </div>
                      ) : selected ? (
                        <Unlock className="w-4 h-4 text-accent" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {planType === "FREE" && (
                <p className="mt-3 text-xs text-zinc-600 flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-accent/50" />
                  Upgrade to EDITOR+ to unlock 1080p & 4K
                </p>
              )}
            </div>

            {/* Bitrate */}
            <div>
              <label className="text-xs tracking-widest uppercase text-zinc-500 font-bold mb-3 block">Bitrate Quality</label>
              <div className="flex gap-3">
                {BITRATES.map((b) => (
                  <button
                    key={b.value}
                    disabled={phase === "rendering"}
                    onClick={() => setBitrate(b.value)}
                    className={`flex-1 p-4 rounded-2xl border transition-all text-left ${
                      bitrate === b.value
                        ? "border-accent/60 bg-accent/10"
                        : "border-white/10 bg-white/2 hover:border-white/20"
                    } disabled:opacity-50`}
                  >
                    <p className={`font-bold text-sm ${bitrate === b.value ? "text-accent" : "text-white"}`}>{b.label}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Watermark Toggle */}
            <div className="flex items-center justify-between p-5 rounded-2xl border border-white/6 bg-white/2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${watermark ? "bg-blue-500/10 border border-blue-500/20" : "bg-accent/10 border border-accent/20"}`}>
                  <Droplets className={`w-4 h-4 ${watermark ? "text-blue-400" : "text-accent"}`} />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">NxtGen Watermark</p>
                  <p className="text-xs text-zinc-500">
                    {planType === "FREE" ? "Upgrade to remove watermark" : watermark ? "Watermark visible on video" : "Watermark removed"}
                  </p>
                </div>
              </div>
              <button
                disabled={planType === "FREE" || phase === "rendering"}
                onClick={() => setWatermark((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  !watermark && planType !== "FREE"
                    ? "bg-accent"
                    : "bg-zinc-700"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                  !watermark && planType !== "FREE" ? "left-7" : "left-1"
                }`} />
              </button>
            </div>

            {/* Trial Offer Highlight */}
            {planType === "FREE" && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full relative overflow-hidden p-3 rounded-2xl border border-accent/40 bg-accent/10 hover:bg-accent/20 transition-all flex items-center justify-center gap-2 group"
              >
                <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                <span className="font-bold text-sm text-accent group-hover:text-white transition-colors">
                  1 Rupee First Video (No Watermark + 1080p)
                </span>
              </button>
            )}

            {/* Premium Render Settings */}
            <div className="pt-6 border-t border-white/6 space-y-4">
              <label className="text-xs tracking-widest uppercase text-zinc-500 font-bold mb-1 block">Advanced Render Options</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Alpha Channel Render */}
                <div className="flex items-center justify-between p-5 rounded-2xl border border-white/6 bg-white/2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${alphaChannel ? "bg-accent/10 border border-accent/20 text-accent" : "bg-zinc-800 text-zinc-500"}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-white font-sans">Alpha Channel</p>
                        <div className="relative group">
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-white cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-zinc-900 border border-white/10 rounded-lg text-[10px] text-zinc-400 font-medium leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
                            Renders captions with a transparent background, perfect for overlaying in Premiere Pro or Final Cut.
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {planType === "FREE" || planType === "EDITOR" ? "Requires Creator+" : "Transparent background"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(planType === "FREE" || planType === "EDITOR") ? (
                      <button 
                        onClick={() => router.push("/dashboard?upgrade=true")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Lock className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-bold">UPGRADE</span>
                      </button>
                    ) : (
                      <button
                        disabled={phase === "rendering"}
                        onClick={() => setAlphaChannel((v) => !v)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          alphaChannel ? "bg-accent" : "bg-zinc-700"
                        } disabled:opacity-40`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                          alphaChannel ? "left-7" : "left-1"
                        }`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* SRT Export */}
                <div className="flex items-center justify-between p-5 rounded-2xl border border-white/6 bg-white/2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${srtExport ? "bg-accent/10 border border-accent/20 text-accent" : "bg-zinc-800 text-zinc-500"}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-white font-sans">SRT Subtitles</p>
                        <div className="relative group">
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-white cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-zinc-900 border border-white/10 rounded-lg text-[10px] text-zinc-400 font-medium leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
                            Downloads a separate perfectly-timed .srt subtitle file alongside your video export.
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {planType === "FREE" || planType === "EDITOR" ? "Requires Creator+" : "Separate SRT file"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(planType === "FREE" || planType === "EDITOR") ? (
                      <button 
                        onClick={() => router.push("/dashboard?upgrade=true")}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Lock className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-bold">UPGRADE</span>
                      </button>
                    ) : (
                      <button
                        disabled={phase === "rendering"}
                        onClick={() => setSrtExport((v) => !v)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          srtExport ? "bg-accent" : "bg-zinc-700"
                        } disabled:opacity-40`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                          srtExport ? "left-7" : "left-1"
                        }`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            currentPlan={planType as any}
          />

          {/* RIGHT — Summary + Export (2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            {/* Summary card */}
            <div className="bg-white/2 border border-white/6 rounded-3xl p-6 space-y-4 flex-1 font-sans">
              <p className="text-xs tracking-widest uppercase text-zinc-500 font-bold">Export Summary</p>
 
              {[
                { label: "Resolution",  value: `${resolution}p` },
                { label: "Bitrate",     value: bitrate === "auto" ? "Optimized" : bitrate === "high" ? "~8 Mbps" : "~16 Mbps" },
                { label: "Format",      value: alphaChannel ? "WebM (Transparent)" : "H.264 MP4" },
                { label: "Frame Rate",  value: "30 fps" },
                { label: "Watermark",   value: watermark ? "On" : "Off" },
                { label: "Alpha Channel", value: alphaChannel ? "Enabled" : "Disabled" },
                { label: "SRT Subtitles", value: srtExport ? "Enabled" : "Disabled" },
                { label: "Duration",    value: ctx?.duration ? `${Math.ceil(ctx.duration)}s` : "—" },
                { label: "Captions",    value: `${ctx?.captions?.length ?? 0} segments` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                  <span className="text-xs text-zinc-500 font-medium">{row.label}</span>
                  <span className="text-sm font-bold text-white">{row.value}</span>
                </div>
              ))}

              {!ctx?.videoUrl && (
                <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-xl mt-2">
                  <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-accent-bright">
                    No video source found. Please go back and upload a video first.
                  </p>
                </div>
              )}
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={phase === "rendering" || !ctx?.videoUrl}
              className="group relative w-full py-5 rounded-3xl font-black text-lg tracking-tight overflow-hidden transition-all duration-300
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-accent hover:bg-accent-bright text-white
                shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center justify-center gap-3">
                <Zap className="w-5 h-5" />
                {phase === "rendering" ? "Rendering…" : "Export Now"}
              </div>
            </button>
          </motion.div>
        </div>

        {/* ── Progress Section ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {(phase === "rendering" || phase === "done" || phase === "error") && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-100 p-4 md:p-6 pointer-events-none flex justify-center"
            >
              <div className="w-full max-w-4xl bg-bg-elevated/95 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto relative overflow-hidden">
                {/* Animated Glow Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-accent/20 blur-[100px] pointer-events-none" />

                <div className="relative flex flex-col gap-6">
                  {phase !== "error" && (
                    <>
                      {/* Header & Disclaimer */}
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                          {phase === "done" ? (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          ) : (
                            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                          )}
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-1">
                          <div className="flex items-center justify-center md:justify-between">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                              {phase === "done" ? "Export Complete" : "Rendering your Masterpiece"}
                            </h2>
                            <span className="hidden md:block text-2xl font-black text-accent tabular-nums">{progress}%</span>
                          </div>
                          
                          <p className="text-zinc-400 font-medium">
                            {phase === "done" ? "Your video has been successfully processed." : stageLabel || "Initializing..."}
                          </p>
                          
                          {phase === "rendering" && (
                            <div className="pt-2 flex flex-col items-center md:items-start gap-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-sm font-black uppercase tracking-wider text-red-500 animate-pulse">
                                  ⚠️ Critical: Do not close this window or switch tabs!
                                </p>
                              </div>
                              <p className="text-xs text-zinc-400 ml-4">
                                Background browser rendering requires this tab to remain active.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live preview container */}
                      {phase === "rendering" && (
                        <div className="flex flex-col items-center gap-3 my-4">
                          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Live Export Preview</p>
                          <div className="relative aspect-video w-full max-w-[480px] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
                            <canvas id="export-canvas" className="w-full h-full object-contain" />
                          </div>
                        </div>
                      )}

                      {/* AI Style Progress Bar */}
                      <div className="relative h-2 bg-[#050505] rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            background: phase === "done"
                              ? "linear-gradient(90deg, #4ade80, #22c55e)"
                              : "linear-gradient(90deg, var(--color-accent), var(--color-accent-bright))",
                          }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                        {phase === "rendering" && (
                          <motion.div
                            className="absolute inset-y-0 w-24 bg-white/20 skew-x-[-20deg]"
                            animate={{ x: ["-100%", "800%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                        )}
                      </div>
                    </>
                  )}

                  {/* Error */}
                  {phase === "error" && (
                    <div className="flex items-start gap-4 p-4">
                      <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-red-400 text-lg mb-1">Render Failed</p>
                        <p className="text-sm text-zinc-400">{errorMsg}</p>
                        <button
                          onClick={() => { setPhase("idle"); setProgress(0); }}
                          className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Done — download */}
                  {phase === "done" && downloadUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2 p-5 bg-green-500/10 border border-green-500/20 rounded-2xl"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-green-400 mb-0.5">Ready to download!</p>
                        <p className="text-xs text-zinc-400">If it didn't start automatically, click the button →</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setPhase("idle");
                            setProgress(0);
                            setDownloadUrl(null);
                          }}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                          Re-render Video
                        </button>
                        <button
                          onClick={handleDownloadClick}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-black text-sm rounded-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                          <Download className="w-4 h-4" />
                          {srtExport ? "Download Video & SRT" : "Download Now"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

// ─── Client-side rendering & drawing helpers ─────────────────────────────────

const NOTO_FALLBACK_STACK = [
  "'Noto Sans Devanagari'",
  "'Noto Sans Tamil'",
  "'Noto Sans Bengali'",
  "'Noto Sans Telugu'",
  "'Noto Sans Kannada'",
  "'Noto Sans Malayalam'",
  "'Noto Sans Gujarati'",
  "'Noto Sans Gurmukhi'",
  "'Noto Sans Oriya'",
  "'Noto Sans Arabic'",
  "sans-serif",
].join(", ");

function layoutTemplateMapping(layout: string): string {
  if (layout === "ali-abdaal") return "ali-abdaal";
  if (layout === "bubble") return "bubble";
  if (layout === "hormozi") return "hormozi";
  if (layout === "gadzhi") return "gadzhi";
  if (layout === "apple") return "apple";
  return layout;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWatermarkOnCanvas(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, renderScale: number) {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  
  const w = 240 * renderScale;
  const h = 50 * renderScale;
  const x = canvasWidth / 2 - w / 2;
  const y = canvasHeight / 2 - h / 2;
  
  drawRoundedRect(ctx, x, y, w, h, 12 * renderScale);
  ctx.fill();
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = `800 ${20 * renderScale}px 'Inter', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NxtGen Captions", canvasWidth / 2, canvasHeight / 2);
  ctx.restore();
}

function drawCaptionOnCanvas(
  ctx: CanvasRenderingContext2D,
  segment: any,
  style: any,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  renderScale: number,
  layout: string
) {
  const words = segment.words || [];
  if (words.length === 0) return;

  ctx.save();

  // Setup styles
  const fontFamily = style.fontFamily || "Inter";
  const fontWeight = style.fontWeight || "700";
  const baseFontSize = (style.fontSize || 32) * renderScale;
  const primaryColor = style.primaryColor || "#ffffff";
  const emphasisColor = style.emphasisColor || "#38bdf8";
  const highlightColor = style.highlightColor || "#FACC15";

  // Calculate position
  const posX = (style.positionX !== undefined ? style.positionX : 50) * 0.01 * canvasWidth;
  const posY = (style.positionY !== undefined ? style.positionY : 80) * 0.01 * canvasHeight;
  const maxWidth = (style.width !== undefined ? style.width : 80) * 0.01 * canvasWidth;

  const fontStack = `'${fontFamily}', ${NOTO_FALLBACK_STACK}`;
  ctx.textBaseline = "middle";

  // Kinetic Multi-line styles
  if (["nxtgen-genz", "nxtgen-horror", "nxtgen-vengence", "nxtgen-alpha"].includes(layout)) {
    // Find hero word
    let heroIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen && clean.length <= 7) {
        maxLen = clean.length;
        heroIndex = i;
      }
    }

    const topWords = words.slice(0, heroIndex);
    const heroWordObj = words[heroIndex];
    const bottomWords = words.slice(heroIndex + 1);

    const SUB_FONT_SIZE = baseFontSize * 1.5;
    const HERO_FONT_SIZE = words.length <= 2 ? baseFontSize * 2.25 : baseFontSize * 3.28;

    let currentY = posY - (baseFontSize * 3) / 2;

    const drawWordLine = (wordList: any[], fontName: string, fontSize: number, alignRight = false) => {
      if (wordList.length === 0) return;
      ctx.font = `${fontWeight} ${fontSize}px ${fontName}`;
      
      let lineW = 0;
      const spW = ctx.measureText(" ").width;
      const measuredWords = wordList.map(w => {
        const isAct = currentTime >= w.start && currentTime <= w.end;
        ctx.font = `${fontWeight} ${isAct ? fontSize * 1.2 : fontSize}px ${fontName}`;
        const wd = ctx.measureText(w.word).width;
        return { ...w, width: wd, size: isAct ? fontSize * 1.2 : fontSize };
      });

      for (let i = 0; i < measuredWords.length; i++) {
        lineW += measuredWords[i].width + (i < measuredWords.length - 1 ? spW : 0);
      }

      let startX = alignRight ? (posX + maxWidth / 2 - lineW) : (posX - lineW / 2);
      if (!alignRight && wordList === topWords) {
        startX = posX - maxWidth / 2;
      }

      for (const w of measuredWords) {
        const isAct = currentTime >= w.start && currentTime <= w.end;
        ctx.font = `${fontWeight} ${w.size}px ${fontName}`;
        ctx.fillStyle = isAct ? emphasisColor : primaryColor;
        ctx.fillText(w.word, startX, currentY);
        startX += w.width + spW;
      }
    };

    const normalFont = layout === "nxtgen-alpha" ? `'Aston Script', cursive` : `'Satoshi', sans-serif`;
    const finalNormalFont = `${normalFont}, ${NOTO_FALLBACK_STACK}`;
    
    drawWordLine(topWords, finalNormalFont, SUB_FONT_SIZE, false);
    currentY += SUB_FONT_SIZE * 1.3;

    if (heroWordObj) {
      const heroFont = layout === "nxtgen-horror" ? `'Chalk-y'` : (layout === "nxtgen-alpha" ? `'Bastliga One'` : fontStack);
      const isAct = currentTime >= heroWordObj.start;
      ctx.font = `900 ${HERO_FONT_SIZE}px ${heroFont}, ${NOTO_FALLBACK_STACK}`;
      ctx.fillStyle = isAct ? (layout === "nxtgen-horror" ? "#ffffff" : emphasisColor) : primaryColor;
      
      const hw = ctx.measureText(heroWordObj.word).width;
      ctx.fillText(heroWordObj.word, posX - hw / 2, currentY);
      currentY += HERO_FONT_SIZE * 1.1;
    }

    drawWordLine(bottomWords, finalNormalFont, SUB_FONT_SIZE, true);
    ctx.restore();
    return;
  }

  // Viral & Energetic Kinetic layouts
  if (["nxtgen-viral", "nxtgen-energetic"].includes(layout)) {
    const isEnergetic = layout === "nxtgen-energetic";
    
    // Find target word (longest word in the segment)
    let targetIndex = 0;
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen) {
        maxLen = clean.length;
        targetIndex = i;
      }
    }

    // Group words into lines exactly like VideoPlayer.tsx
    const lines: { words: any[], hasTarget: boolean }[] = [];
    let i = 0;
    while (i < words.length) {
      if (i === targetIndex || i === targetIndex - 1) {
        const chunk = [];
        if (i === targetIndex - 1) {
          chunk.push(words[i]);
          i++;
        }
        if (i < words.length) {
          chunk.push(words[i]); // targetIndex
          i++;
        }
        while (i < words.length && chunk.length < 2) {
          chunk.push(words[i]);
          i++;
        }
        lines.push({ words: chunk, hasTarget: true });
      } else {
        const chunk = [];
        chunk.push(words[i]);
        i++;
        if (i < words.length && i !== targetIndex && i !== targetIndex - 1) {
          chunk.push(words[i]);
          i++;
        }
        lines.push({ words: chunk, hasTarget: false });
      }
    }

    const satoshiFont = `'Satoshi', ${fontStack}`;
    
    // Calculate total height of the block
    let totalHeight = 0;
    const lineHeights = lines.map(line => {
      let maxH = baseFontSize;
      for (const w of line.words) {
        const wordGlobalIdx = words.indexOf(w);
        const isTarget = wordGlobalIdx === targetIndex;
        if (isTarget) maxH = Math.max(maxH, baseFontSize * 2.5);
      }
      return maxH;
    });

    for (let h of lineHeights) {
      totalHeight += h + 10 * renderScale;
    }

    let currentY = posY - totalHeight / 2 + lineHeights[0] / 2;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineHeight = lineHeights[lineIdx];

      // Measure all words in this line
      const measuredWords = line.words.map(w => {
        const wordGlobalIdx = words.indexOf(w);
        const isTarget = wordGlobalIdx === targetIndex;
        const isPreceding = wordGlobalIdx === targetIndex - 1;
        const isLastInNormal = !line.hasTarget && words.indexOf(w) === words.indexOf(line.words[line.words.length - 1]);

        let fSize = baseFontSize;
        let weight = "700";
        if (isTarget) {
          fSize = baseFontSize * 2.5;
          weight = "900";
        } else if (isPreceding || isLastInNormal) {
          fSize = baseFontSize * 0.65;
          weight = "500";
        }

        ctx.font = `${weight} ${fSize}px ${satoshiFont}`;
        const wWidth = ctx.measureText(w.word).width;

        return {
          ...w,
          width: wWidth,
          fontSize: fSize,
          fontWeight: weight,
          isTarget,
          isPreceding,
          isLastInNormal
        };
      });

      const spaceW = ctx.measureText(" ").width;
      let totalLineWidth = 0;
      for (let wIdx = 0; wIdx < measuredWords.length; wIdx++) {
        totalLineWidth += measuredWords[wIdx].width + (wIdx < measuredWords.length - 1 ? spaceW : 0);
      }

      let startX = posX - totalLineWidth / 2;

      for (const w of measuredWords) {
        const isSpoken = currentTime >= w.start;

        ctx.save();

        let color = primaryColor;
        let opacity = 1;

        if (w.isTarget) {
          color = emphasisColor;
          ctx.shadowColor = `${color}90`;
          ctx.shadowBlur = 15 * renderScale;
        }

        if (isSpoken) {
          opacity = (w.isPreceding || w.isLastInNormal) ? 0.8 : 1;
          ctx.filter = "none";
        } else {
          opacity = 0;
          if (!isEnergetic) {
            ctx.filter = `blur(${10 * renderScale}px)`;
          }
        }

        ctx.globalAlpha = opacity;
        ctx.font = `${w.fontWeight} ${w.fontSize}px ${satoshiFont}`;
        ctx.fillStyle = color;

        let wordY = currentY;
        if (w.isPreceding || w.isLastInNormal) {
          wordY = currentY + lineHeight / 2 - w.fontSize / 2;
        }

        ctx.fillText(w.word, startX, wordY);
        ctx.restore();

        startX += w.width + spaceW;
      }

      currentY += lineHeight + 10 * renderScale;
    }

    ctx.restore();
    return;
  }

  // Futuristic Glitch / Monospace Holo Layout
  if (layout === "holo") {
    // Draw green/matrix border box around the text segment
    const paddingX = 24 * renderScale;
    const paddingY = 16 * renderScale;
    
    ctx.font = `${fontWeight} ${baseFontSize}px 'Space Grotesk', monospace`;
    const spaceW = ctx.measureText(" ").width;
    
    let totalTextWidth = 0;
    const wordWidths = words.map((w: any) => {
      const wWidth = ctx.measureText(w.word).width;
      return wWidth;
    });

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      totalTextWidth += wordWidths[wIdx] + (wIdx < words.length - 1 ? spaceW : 0);
    }

    const boxW = Math.min(maxWidth, totalTextWidth + paddingX * 2);
    const boxH = baseFontSize + paddingY * 2;
    const boxX = posX - boxW / 2;
    const boxY = posY - boxH / 2;

    ctx.fillStyle = "rgba(0, 255, 65, 0.08)";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1 * renderScale;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 8 * renderScale);
    ctx.fill();
    ctx.stroke();

    // Glowing shadow overlay
    ctx.shadowColor = `${primaryColor}40`;
    ctx.shadowBlur = 15 * renderScale;

    // Typewriter letters drawing
    let currentX = posX - totalTextWidth / 2;
    let charGlobalIdx = 0;
    const captionAge = currentTime - segment.start;

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const w = words[wIdx];
      const isGlitch = (wIdx + 1) % 4 === 0;

      ctx.save();
      if (isGlitch) {
        ctx.shadowColor = "red";
        ctx.shadowOffsetX = -2 * renderScale;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 1 * renderScale;
        ctx.transform(1, 0, -0.15, 1, 0, 0); // Skew slightly
      }

      ctx.font = `${fontWeight} ${baseFontSize}px 'Space Grotesk', monospace`;
      ctx.fillStyle = primaryColor;

      for (let cIdx = 0; cIdx < w.word.length; cIdx++) {
        const char = w.word[cIdx];
        const delay = charGlobalIdx * 0.03;
        
        if (captionAge >= delay) {
          ctx.fillText(char, currentX, posY);
        }
        currentX += ctx.measureText(char).width;
        charGlobalIdx++;
      }

      ctx.restore();
      currentX += spaceW;
      charGlobalIdx++; // Count space character
    }

    ctx.restore();
    return;
  }

  // Modern Fade Reveal vertical stack animation
  if (layout === "modern") {
    const spacing = 10 * renderScale;
    
    const stopWords = new Set([
      "the", "and", "is", "in", "to", "of", "a", "for", "it",
      "on", "with", "as", "at", "by", "an", "or", "be", "this",
      "that", "are",
    ]);

    const processedWords = words.map((w: any, index: number) => {
      const cleanWord = w.word.toLowerCase().replace(/[^a-z]/g, "");
      const isStopWord = stopWords.has(cleanWord);
      const isLongWord = w.word.length >= 4;
      const isRhythmicWord = index % 3 === 2;
      const isSpotlight = (isLongWord && !isStopWord) || (isRhythmicWord && !isStopWord);

      const seed = w.word.length + index + (cleanWord.charCodeAt(0) || 0);
      const pseudoRand = ((seed * 9301 + 49297) % 233280) / 233280;

      let fontSizeMultiplier;
      if (isSpotlight && style.emphasisWords) {
        fontSizeMultiplier = 1.3 + pseudoRand * 0.35;
      } else if (isLongWord && !isStopWord) {
        fontSizeMultiplier = 0.9 + pseudoRand * 0.25;
      } else {
        fontSizeMultiplier = 0.65 + pseudoRand * 0.25;
      }

      const offsetX = (((seed * 9301 + 49297) % 233280) / 233280) * 60 - 30; // -30% to +30%

      return {
        ...w,
        isSpotlight,
        fontSizeMultiplier,
        offsetX,
        index,
      };
    });

    let totalHeight = 0;
    for (const w of processedWords) {
      totalHeight += baseFontSize * w.fontSizeMultiplier + spacing;
    }

    let currentY = posY - totalHeight / 2;

    for (const w of processedWords) {
      const isSpoken = currentTime >= w.start;
      const isActive = currentTime >= w.start && currentTime <= w.end;
      const isEmphasis = w.isSpotlight && style.emphasisWords;

      let opacity = 0;
      let wordYOffset = -22 * renderScale;
      const captionAge = currentTime - segment.start;
      const wordDelay = w.index * 0.08;

      if (captionAge >= wordDelay) {
        const wordAge = captionAge - wordDelay;
        opacity = Math.min(1, Math.max(0, wordAge / 0.35));
        wordYOffset = -22 * (1 - opacity) * renderScale;
      }

      ctx.save();
      ctx.globalAlpha = opacity;

      const size = baseFontSize * w.fontSizeMultiplier;
      const weight = isEmphasis ? "800" : "400";
      ctx.font = `${weight} ${size}px ${fontStack}`;

      let color = isEmphasis ? emphasisColor : primaryColor;
      ctx.fillStyle = color;

      if (isEmphasis && style.emphasisGlow) {
        ctx.shadowColor = style.emphasisGlowColor || color;
        ctx.shadowBlur = style.emphasisGlowIntensity * 4 * renderScale;
      } else if (style.dropShadow) {
        ctx.shadowColor = style.dropShadowColor || "rgba(0,0,0,0.5)";
        ctx.shadowBlur = style.dropShadowOpacity * 10 * renderScale;
        ctx.shadowOffsetX = 2 * renderScale;
        ctx.shadowOffsetY = 2 * renderScale;
      }

      const wordX = posX + (w.offsetX * 0.01 * maxWidth);
      ctx.textAlign = "center";
      ctx.fillText(w.word, wordX, currentY + wordYOffset + size / 2);
      ctx.restore();

      currentY += size + spacing;
    }

    ctx.restore();
    return;
  }

  // Mogrt Shimmer Stack layout
  if (layout === "mogrt-shimmer-stack") {
    let focusIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, '');
      if (clean.length > maxLen) {
        maxLen = clean.length;
        focusIndex = i;
      }
    }

    const topWords = words.slice(0, focusIndex);
    const focusWord = words[focusIndex];
    const bottomWords = words.slice(focusIndex + 1);

    const isFocusActive = currentTime >= focusWord.start && currentTime <= focusWord.end;
    const FOCUS_FONT_SIZE = baseFontSize * 2.8;

    let totalHeight = 0;
    if (topWords.length > 0) totalHeight += baseFontSize + 12 * renderScale;
    if (focusWord) totalHeight += FOCUS_FONT_SIZE + 12 * renderScale;
    if (bottomWords.length > 0) totalHeight += baseFontSize;

    let currentY = posY - totalHeight / 2;

    const drawPhrase = (phraseWords: any[], isTop: boolean) => {
      if (phraseWords.length === 0) return;
      const anySpoken = phraseWords.some(w => currentTime >= w.start);
      if (!anySpoken) return;

      ctx.save();
      ctx.font = `600 ${baseFontSize}px ${fontStack}`;
      
      let lineW = 0;
      const spW = ctx.measureText(" ").width;
      const measured = phraseWords.map(w => {
        const isSp = currentTime >= w.start;
        const wd = ctx.measureText(w.word).width;
        return { ...w, width: wd, isSp };
      });

      for (let i = 0; i < measured.length; i++) {
        lineW += measured[i].width + (i < measured.length - 1 ? spW : 0);
      }

      let startX = posX - lineW / 2;
      for (const w of measured) {
        ctx.save();
        ctx.globalAlpha = w.isSp ? 1 : 0.15;
        ctx.fillStyle = primaryColor;
        
        if (style.dropShadow) {
          ctx.shadowColor = style.dropShadowColor || "rgba(0,0,0,0.5)";
          ctx.shadowBlur = style.dropShadowOpacity * 10 * renderScale;
          ctx.shadowOffsetX = 2 * renderScale;
          ctx.shadowOffsetY = 2 * renderScale;
        }

        ctx.fillText(w.word, startX, currentY);
        ctx.restore();
        startX += w.width + spW;
      }
      ctx.restore();
    };

    if (topWords.length > 0) {
      drawPhrase(topWords, true);
      currentY += baseFontSize + 12 * renderScale;
    }

    if (focusWord && currentTime >= focusWord.start) {
      ctx.save();
      let sizeMultiplier = 1;
      if (isFocusActive) {
        sizeMultiplier = 1.05;
      }

      ctx.font = `900 ${FOCUS_FONT_SIZE * sizeMultiplier}px ${fontStack}`;
      const fW = ctx.measureText(focusWord.word.toUpperCase()).width;

      const shimmerGrad = ctx.createLinearGradient(posX - fW / 2, 0, posX + fW / 2, 0);
      shimmerGrad.addColorStop(0, "#eee");
      shimmerGrad.addColorStop(0.25, "#eee");
      shimmerGrad.addColorStop(0.5, "#fff");
      shimmerGrad.addColorStop(0.75, "#eee");
      shimmerGrad.addColorStop(1, "#eee");

      ctx.fillStyle = shimmerGrad;
      ctx.textAlign = "center";
      ctx.fillText(focusWord.word.toUpperCase(), posX, currentY + FOCUS_FONT_SIZE / 2);
      ctx.restore();

      currentY += FOCUS_FONT_SIZE + 12 * renderScale;
    }

    if (bottomWords.length > 0) {
      drawPhrase(bottomWords, false);
    }

    ctx.restore();
    return;
  }

  // Cinemaline & Directors Edition layouts
  if (["nxtgen-cinemaline", "nxtgen-directors-edition"].includes(layout)) {
    const isCinema = layout === "nxtgen-cinemaline";
    
    let longestIndex = 0;
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen) {
        maxLen = clean.length;
        longestIndex = i;
      }
    }

    const isCursiveFirst = longestIndex === 0 && words.length > 1;
    const isCursiveLast = longestIndex === words.length - 1 && words.length > 1;

    const satoshiFont = `'Satoshi', ${fontStack}`;
    const cursiveFont = `'Great Vibes', cursive, ${fontStack}`;

    const drawCinemaWord = (w: any, index: number, isTarget: boolean, currentX: number, drawY: number) => {
      const isSpoken = currentTime >= w.start;
      ctx.save();
      
      const font = isTarget ? (isCinema ? cursiveFont : satoshiFont) : satoshiFont;
      const weight = isTarget ? (isCinema ? "400" : "900") : (isCinema ? "700" : "400");
      const size = isTarget ? baseFontSize * 2 : baseFontSize;
      const color = isTarget ? (style.emphasisColor || "#EF4444") : (style.primaryColor || "#FFFFFF");

      let opacity = 0;
      if (isSpoken) {
        opacity = 1;
        ctx.filter = "none";
      } else {
        opacity = 0;
        ctx.filter = `blur(${10 * renderScale}px)`;
      }

      ctx.globalAlpha = opacity;
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.fillStyle = color;
      
      ctx.fillText(w.word, currentX, drawY);
      ctx.restore();
      
      ctx.font = `${weight} ${size}px ${font}`;
      return ctx.measureText(w.word).width;
    };

    if (isCursiveFirst) {
      const topY = posY - baseFontSize;
      const bottomY = posY + baseFontSize;

      ctx.font = `${isCinema ? "400" : "900"} ${baseFontSize * 2}px ${isCinema ? cursiveFont : satoshiFont}`;
      const topW = ctx.measureText(words[0].word).width;
      drawCinemaWord(words[0], 0, true, posX - topW / 2, topY);

      ctx.font = `${isCinema ? "700" : "400"} ${baseFontSize}px ${satoshiFont}`;
      const spaceW = ctx.measureText(" ").width;
      
      let bottomW = 0;
      const measured = words.slice(1).map((w: any) => {
        const wd = ctx.measureText(w.word).width;
        return { ...w, width: wd };
      });
      for (let i = 0; i < measured.length; i++) {
        bottomW += measured[i].width + (i < measured.length - 1 ? spaceW : 0);
      }

      let startX = posX - bottomW / 2;
      for (let idx = 0; idx < measured.length; idx++) {
        drawCinemaWord(measured[idx], idx + 1, false, startX, bottomY);
        startX += measured[idx].width + spaceW;
      }
      
    } else if (isCursiveLast) {
      const topY = posY - baseFontSize;
      const bottomY = posY + baseFontSize;

      ctx.font = `${isCinema ? "700" : "400"} ${baseFontSize}px ${satoshiFont}`;
      const spaceW = ctx.measureText(" ").width;
      
      let topW = 0;
      const measured = words.slice(0, words.length - 1).map((w: any) => {
        const wd = ctx.measureText(w.word).width;
        return { ...w, width: wd };
      });
      for (let i = 0; i < measured.length; i++) {
        topW += measured[i].width + (i < measured.length - 1 ? spaceW : 0);
      }

      let startX = posX - topW / 2;
      for (let idx = 0; idx < measured.length; idx++) {
        drawCinemaWord(measured[idx], idx, false, startX, topY);
        startX += measured[idx].width + spaceW;
      }

      ctx.font = `${isCinema ? "400" : "900"} ${baseFontSize * 2}px ${isCinema ? cursiveFont : satoshiFont}`;
      const bottomW = ctx.measureText(words[words.length - 1].word).width;
      drawCinemaWord(words[words.length - 1], words.length - 1, true, posX - bottomW / 2, bottomY);

    } else {
      ctx.font = `${isCinema ? "700" : "400"} ${baseFontSize}px ${satoshiFont}`;
      const spaceW = ctx.measureText(" ").width;

      let totalW = 0;
      const measured = words.map((w: any, idx: number) => {
        const isTarget = idx === longestIndex;
        const font = isTarget ? (isCinema ? cursiveFont : satoshiFont) : satoshiFont;
        const weight = isTarget ? (isCinema ? "400" : "900") : (isCinema ? "700" : "400");
        const size = isTarget ? baseFontSize * 2 : baseFontSize;

        ctx.font = `${weight} ${size}px ${font}`;
        const wd = ctx.measureText(w.word).width;
        return { ...w, width: wd, isTarget };
      });

      for (let i = 0; i < measured.length; i++) {
        totalW += measured[i].width + (i < measured.length - 1 ? spaceW : 0);
      }

      let startX = posX - totalW / 2;
      for (let idx = 0; idx < measured.length; idx++) {
        drawCinemaWord(measured[idx], idx, measured[idx].isTarget, startX, posY);
        startX += measured[idx].width + spaceW;
      }
    }

    ctx.restore();
    return;
  }

  // Modern Fade Reveal animation
  const isModern = false; // Handled dynamically in dedicated loop above

  // Word measurements & wrapping
  ctx.font = `${fontWeight} ${baseFontSize}px ${fontStack}`;
  const spaceWidth = ctx.measureText(" ").width;
  let lines: any[][] = [[]];
  let currentLineWidth = 0;

  for (let idx = 0; idx < words.length; idx++) {
    const w = words[idx];
    const isActive = currentTime >= w.start && currentTime <= w.end;
    let wordFontSize = baseFontSize;

    ctx.font = `${fontWeight} ${wordFontSize}px ${fontStack}`;
    const wordWidth = ctx.measureText(w.word).width;

    if (currentLineWidth + wordWidth > maxWidth && lines[lines.length - 1].length > 0) {
      lines.push([]);
      currentLineWidth = 0;
    }

    lines[lines.length - 1].push({
      ...w,
      width: wordWidth,
      fontSize: wordFontSize,
      globalIndex: idx,
    });
    currentLineWidth += wordWidth + spaceWidth;
  }

  // Draw lines
  let currentY = posY - ((lines.length - 1) * baseFontSize * (style.lineSpacing || 1.25)) / 2;

  for (const line of lines) {
    let lineWidth = 0;
    for (let i = 0; i < line.length; i++) {
      lineWidth += line[i].width + (i < line.length - 1 ? spaceWidth : 0);
    }

    // Set starting position based on selected alignment
    const textAlignment = style.textAlignment || "center";
    let startX = posX;
    if (textAlignment === "left") {
      startX = posX - maxWidth / 2;
    } else if (textAlignment === "right") {
      startX = posX + maxWidth / 2 - lineWidth;
    } else {
      startX = posX - lineWidth / 2;
    }

    for (let i = 0; i < line.length; i++) {
      const w = line[i];
      const isActive = currentTime >= w.start && currentTime <= w.end;
      const isAccent = w.isEmphasized || w.isHighlighted || isActive;

      // Determine proper weight for current template
      let weight = fontWeight;
      if (layout === "gadzhi") {
        weight = isActive ? "700" : "300";
      } else if (layout === "ali-abdaal") {
        weight = (w.isEmphasized || w.isHighlighted) ? "700" : "400";
      } else {
        weight = isActive ? "900" : "700";
      }

      // Handle active scale up in-place
      let wordSize = w.fontSize;
      if (isActive) {
        if (["classic", "bubble", "modern"].includes(layout)) {
          wordSize = w.fontSize * 1.05;
        } else if (layout === "hormozi") {
          wordSize = w.fontSize * 1.2;
        }
      }

      ctx.font = `${weight} ${wordSize}px ${fontStack}`;

      let color = primaryColor;
      if (w.isHighlighted) color = highlightColor;
      else if (w.isEmphasized || isActive) color = emphasisColor;

      // Calculate stagger opacity for modern template
      let opacity = 1;
      let yOffset = 0;
      if (isModern) {
        const captionAge = currentTime - segment.start;
        const wordDelay = w.globalIndex * 0.08;
        if (captionAge < wordDelay) {
          opacity = 0;
        } else {
          const wordAge = captionAge - wordDelay;
          opacity = Math.min(1, Math.max(0, wordAge / 0.15));
          yOffset = -22 * (1 - opacity);
        }
      }

      ctx.save();
      ctx.globalAlpha = opacity;

      // Apply blur filter for Apple Style
      if (layout === "apple") {
        const isSpoken = currentTime >= w.start;
        if (isSpoken) {
          ctx.filter = "none";
          color = style.emphasisColor || emphasisColor;
        } else {
          ctx.filter = `blur(${3 * renderScale}px)`;
          ctx.globalAlpha = 0.5;
        }
      }

      // Configure Shadows / Glows
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (isAccent && style.emphasisGlow) {
        ctx.shadowColor = style.emphasisGlowColor || color;
        ctx.shadowBlur = style.emphasisGlowIntensity * 4 * renderScale;
      } else if (style.dropShadow) {
        ctx.shadowColor = style.dropShadowColor || "rgba(0,0,0,0.5)";
        ctx.shadowBlur = style.dropShadowOpacity * 10 * renderScale;
        ctx.shadowOffsetX = 2 * renderScale;
        ctx.shadowOffsetY = 2 * renderScale;
      }

      // Draw word background for Bubble style
      if (layout === "bubble") {
        const bgCol = isAccent
          ? (w.isHighlighted ? highlightColor : (style.bubbleSecondaryColor || "#4ADE80"))
          : "transparent";
        
        if (bgCol !== "transparent") {
          ctx.save();
          // Disable shadow for background drawing to prevent double-shadow
          ctx.shadowColor = "transparent";
          ctx.fillStyle = bgCol;
          const padX = 8 * renderScale;
          const padY = 4 * renderScale;
          drawRoundedRect(
            ctx,
            startX - padX,
            currentY + yOffset - w.fontSize / 2 - padY,
            w.width + padX * 2,
            w.fontSize + padY * 2,
            999 // Pill shapes
          );
          ctx.fill();
          ctx.restore();

          color = isAccent
            ? (w.isHighlighted ? "#000000" : (style.bubbleTertiaryColor || "#ffffff"))
            : (style.bubblePrimaryColor || primaryColor);
        }
      }

      // Draw word background for Ali Abdaal style
      if (layout === "ali-abdaal") {
        if (isAccent) {
          ctx.save();
          ctx.shadowColor = "transparent";
          ctx.fillStyle = w.isHighlighted
            ? highlightColor
            : (w.isEmphasized || isActive ? emphasisColor : "transparent");
          ctx.fillRect(startX - 2 * renderScale, currentY + yOffset - w.fontSize / 2, w.width + 4 * renderScale, w.fontSize);
          ctx.restore();
          
          if (w.isHighlighted) {
            color = "#000000";
          }
        }
      }

      ctx.fillStyle = color;

      // Handle word casing cases
      let displayWord = w.word;
      if (layout === "hormozi") {
        displayWord = w.word.toUpperCase();
      } else if (layout === "gadzhi") {
        displayWord = w.word.toLowerCase();
      }

      ctx.fillText(displayWord, startX, currentY + yOffset);
      ctx.restore();
      
      startX += w.width + spaceWidth;
    }

    currentY += baseFontSize * (style.lineSpacing || 1.25);
  }

  ctx.restore();
}
