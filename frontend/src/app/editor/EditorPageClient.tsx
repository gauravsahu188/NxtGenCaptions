"use client";

import { useEffect, useRef, useState } from "react";
import { useCaptionContext, CaptionProvider } from "@/context/CaptionContext";
import UploadDropzone from "@/components/UploadDropzone";
import Editor from "@/components/Editor";
import Loader from "@/components/Loader";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";
import { UploadCloud, FileVideo, CheckCircle2, X } from "lucide-react";

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatSeconds(secs: number): string {
  if (!secs || isNaN(secs) || secs <= 0) return "0s";
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

type PlanType = "FREE" | "EDITOR" | "CREATOR" | "BUSINESS" | "TRIAL_1_INR" | "TRIAL_9_INR";

interface EditorUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  planType: PlanType;
  transcriptionBalance: number;
  audioCredits: number;
}

function EditorApp({ user, projectId }: { user: EditorUser | null; projectId?: string }) {
  const { error } = useToast();
  const {
    videoUrl,
    setVideoUrl,
    setCaptions,
    setOriginalWords,
    setS3Key,
    setDuration,
    isProcessing,
    setIsProcessing,
    processingMessage,
    setProcessingMessage,
    uploadProgress,
    uploadStage,
    abortUpload,
  } = useCaptionContext();

  const loaded = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  // Auto-load project from backend if projectId is provided
  useEffect(() => {
    if (!projectId || loaded.current) return;
    loaded.current = true;

    const loadProject = async () => {
      setIsProcessing(true);
      setProcessingMessage("Loading project...");

      try {
        const headers: Record<string, string> = {};
        if (user?.id) headers["x-user-id"] = user.id;

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${BACKEND_URL}/api/video/project/${projectId}`, {
          headers,
        });

        if (!res.ok) {
          throw new Error(`Failed to load project: ${res.status}`);
        }

        const json = await res.json();
        if (json.status !== "success") {
          throw new Error(json.message ?? "Unknown error");
        }

        const { videoUrl: url, captions, s3Key, duration } = json.data;

        if (url) setVideoUrl(url);
        if (s3Key) setS3Key(s3Key);
        if (duration) setDuration(duration);

        if (captions && captions.length > 0) {
          setCaptions(captions);
          // Rebuild flat word pool
          setOriginalWords(
            captions.flatMap((seg: any) =>
              seg.words && seg.words.length > 0
                ? seg.words
                : (() => {
                    const wordsList = seg.text.split(/[\s\u200B-\u200D\uFEFF]+/u).filter(Boolean);
                    const total = wordsList.length || 1;
                    return wordsList.map((w: string, wi: number) => ({
                      word: w,
                      start: seg.start + wi * ((seg.end - seg.start) / total),
                      end: seg.start + (wi + 1) * ((seg.end - seg.start) / total),
                    }));
                  })()
            )
          );
        }
      } catch (err) {
        console.error("[EditorApp] Failed to load project:", err);
        error("Failed to load project. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    loadProject();
  }, [projectId]);

  const showLoader = isProcessing;

  return (
    <div className="min-h-screen w-full">
      <Navbar />

      <main className={`relative z-10 ${!videoUrl ? "flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 min-h-[calc(100vh-64px)]" : ""}`}>
        <div className="aurora-bg" />

        {showLoader && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-xl p-6 text-center">
            {uploadStage === "uploading" && uploadProgress ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-sky-500/10 flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Background glow effects */}
                <div className="absolute top-0 -left-10 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 -right-10 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Animated Upload Icon */}
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-sky-500/20 to-purple-500/20 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/20">
                    <UploadCloud className="w-8 h-8 text-sky-400 animate-bounce" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-sky-500/20 blur-md -z-10 animate-pulse" />
                </div>

                {/* Stage Steps Indicator */}
                <div className="flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-zinc-400">
                  <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                    Step 1: Uploading Video
                  </span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-zinc-500">Step 2: AI Captioning</span>
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Uploading video...
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
                  Please keep this page open while your video file is uploaded to our processing servers.
                </p>

                {/* File info pill */}
                {uploadProgress.fileName && (
                  <div className="flex items-center gap-2 mb-5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 max-w-full">
                    <FileVideo className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate max-w-[260px] font-medium">{uploadProgress.fileName}</span>
                    {uploadProgress.is4K && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/40">
                        4K UHD
                      </span>
                    )}
                  </div>
                )}

                {/* Progress Bar Container */}
                <div className="w-full space-y-2 mb-5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">Upload Progress</span>
                    <span className="text-sky-400 font-bold text-sm tracking-tight">{uploadProgress.percentage}%</span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-zinc-900 border border-white/10 overflow-hidden relative p-[2px]">
                    <motion.div
                      className="h-full rounded-full bg-linear-to-r from-sky-500 via-indigo-500 to-purple-500 shadow-md shadow-sky-500/40 relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress.percentage}%` }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {/* Shimmer light effect */}
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>

                  {/* Byte & Speed Stats */}
                  <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1">
                    <span>
                      {formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}
                    </span>
                    <div className="flex items-center gap-2 font-medium">
                      {uploadProgress.speed && uploadProgress.speed > 0 ? (
                        <span className="text-zinc-300">{formatBytes(uploadProgress.speed)}/s</span>
                      ) : null}
                      {uploadProgress.remainingSeconds && uploadProgress.remainingSeconds > 0 ? (
                        <span className="text-sky-400/90 font-semibold">
                          • ~{formatSeconds(uploadProgress.remainingSeconds)} left
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Cancel Upload button */}
                {abortUpload && (
                  <button
                    onClick={abortUpload}
                    className="mt-1 text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel Upload
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <Loader text={processingMessage || "Generating captions..."} />
                <div className="mt-8 space-y-3 max-w-xs">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Upload Complete
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Captions are generating</h3>
                  <p className="text-sm text-zinc-400">Please wait while our AI transcribes your video and creates cinematic captions.</p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Processing with Sarvam AI & Deepgram</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!videoUrl ? (
          <div className="w-full flex flex-col items-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium tracking-wide">
                Powered by AI & FFmpeg
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                NxtGen <span className="text-gradient">Captions</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
                Create cinematic, burn-in video captions in seconds.
                Upload your video and let our AI do the heavy lifting.
              </p>
            </motion.div>

            <UploadDropzone
              userId={user?.id}
              transcriptionBalance={user?.transcriptionBalance}
              audioCredits={user?.audioCredits}
              planType={user?.planType || "FREE"}
            />
          </div>
        ) : (
          <Editor user={user} />
        )}
      </main>
    </div>
  );
}

export default function EditorPageClient({
  user,
  projectId,
}: {
  user: EditorUser | null;
  projectId?: string;
}) {
  return (
    <CaptionProvider>
      <EditorApp user={user} projectId={projectId} />
    </CaptionProvider>
  );
}
