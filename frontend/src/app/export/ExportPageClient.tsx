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
  { pct: 0,   label: "Initializing render..." },
  { pct: 15,  label: "Bundling composition..." },
  { pct: 35,  label: "Encoding frames on Lambda..." },
  { pct: 65,  label: "Stitching video segments..." },
  { pct: 85,  label: "Uploading to cloud storage..." },
  { pct: 95,  label: "Generating download link..." },
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

  // Start render
  async function handleExport() {
    if (!ctx) return;
    setPhase("rendering");
    setProgress(5);
    setStageLabel(PROGRESS_STAGES[0].label);
    setErrorMsg("");

    try {
      const style = buildRemotionStyle(ctx.captionStyle);
      const body  = {
        videoKey:     ctx.videoKey,
        captions:     ctx.captions,
        style,
        projectName,
        requestedRes: resolution,
        bitrate,
        showWatermark: watermark,
        alphaChannel,
        srtExport,
        duration:     ctx.duration ?? 30,
        fps:          30,
        aspectRatio:  ctx.aspectRatio ?? "16:9",
        originalVideoWidth: ctx.originalVideoWidth,
        originalVideoHeight: ctx.originalVideoHeight,
      };

      const res  = await fetch("/api/export", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Render failed");

      const { renderId, bucketName, outKey } = json;
      setProgress(20);
      setStageLabel(PROGRESS_STAGES[2].label);

      // Poll progress
      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch(
            `/api/export?renderId=${renderId}&bucketName=${encodeURIComponent(bucketName)}&outKey=${encodeURIComponent(outKey)}`
          );
          const pd = await pr.json();
          if (pd.error) throw new Error(pd.error);

          const pct = Math.round((pd.overallProgress ?? 0) * 100);
          setProgress(Math.max(pct, 20));

          const stage = PROGRESS_STAGES.reduce<typeof PROGRESS_STAGES[0] | undefined>(
            (acc, s) => (pct >= s.pct ? s : acc), undefined
          );
          if (stage) setStageLabel(stage.label);

          if (pd.fatalErrorEncountered) {
            throw new Error(pd.errors?.[0]?.message ?? "Lambda render failed");
          }

          if (pd.done) {
            clearInterval(pollRef.current!);
            
            if (pd.downloadError) {
              setErrorMsg(pd.downloadError);
              setPhase("error");
              return;
            }

            setProgress(100);
            setStageLabel("Export complete!");
            setDownloadUrl(pd.downloadUrl);
            setPhase("done");

            // Auto-download video
            if (pd.downloadUrl) {
              // Using window.location to bypass browser popup blockers inside setInterval
              window.location.assign(pd.downloadUrl);
            }

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
          }
        } catch (e: any) {
          clearInterval(pollRef.current!);
          setErrorMsg(e.message ?? "Unknown error");
          setPhase("error");
        }
      }, 3000);
    } catch (e: any) {
      setErrorMsg(e.message ?? "Unknown error");
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
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
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

              {!ctx?.videoKey && (
                <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-xl mt-2">
                  <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-accent-bright">
                    No S3 source video. Lambda render requires the video to be uploaded to S3 first. Try a fresh upload.
                  </p>
                </div>
              )}
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={phase === "rendering" || !ctx?.videoKey}
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
                            <div className="pt-2 flex items-center justify-center md:justify-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <p className="text-xs font-bold uppercase tracking-widest text-amber-500/90">
                                Do not close this window
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

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

                      {/* Stage steps */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                        {["Init", "Bundle", "Render", "Stitch", "Upload", "Done"].map((s, i) => {
                          const stagePct = [0, 15, 35, 65, 85, 100][i];
                          const done     = progress >= stagePct;
                          return (
                            <div key={s} className="flex flex-col items-center gap-1.5">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                done ? "border-accent bg-accent/20" : "border-white/10 bg-[#050505]"
                              }`}>
                                {done && <div className="w-2 h-2 bg-accent rounded-full" />}
                              </div>
                              <span className={`text-[10px] font-bold tracking-wide transition-colors ${done ? "text-accent" : "text-zinc-600"}`}>{s}</span>
                            </div>
                          );
                        })}
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
                      <button
                        onClick={handleDownloadClick}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-black text-sm rounded-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        {srtExport ? "Download Video & SRT" : "Download Now"}
                      </button>
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
