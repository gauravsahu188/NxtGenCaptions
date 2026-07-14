"use client";

import { useEffect, useRef, useState } from "react";
import { useCaptionContext, CaptionProvider } from "@/context/CaptionContext";
import UploadDropzone from "@/components/UploadDropzone";
import Editor from "@/components/Editor";
import Loader from "@/components/Loader";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";

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

  const showLoader = isProcessing && (isMobile || !videoUrl);

  return (
    <div className="min-h-screen w-full">
      <Navbar />

      <main className={`relative z-10 ${!videoUrl ? "flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 min-h-[calc(100vh-64px)]" : ""}`}>
        <div className="aurora-bg" />

        {showLoader ? (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] p-6 text-center">
            <Loader text={processingMessage || "Generating captions..."} />
            <div className="mt-8 space-y-3 max-w-xs">
              <h3 className="text-xl font-bold text-white tracking-tight">Captions are generating</h3>
              <p className="text-sm text-zinc-400">Please wait while our AI transcribes your video and creates cinematic captions.</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Processing with Sarvam AI</p>
              </div>
            </div>
          </div>
        ) : !videoUrl ? (
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
