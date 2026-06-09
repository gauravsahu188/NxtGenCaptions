"use client";

import { useEffect, useRef } from "react";
import { useCaptionContext, CaptionProvider } from "@/context/CaptionContext";
import UploadDropzone from "@/components/UploadDropzone";
import Editor from "@/components/Editor";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

type PlanType = "FREE" | "EDITOR" | "CREATOR" | "BUSINESS";

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
  const {
    videoUrl,
    setVideoUrl,
    setCaptions,
    setOriginalWords,
    setS3Key,
    setDuration,
    setIsProcessing,
    setProcessingMessage,
  } = useCaptionContext();

  const loaded = useRef(false);

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

        const res = await fetch(`http://localhost:3001/api/video/project/${projectId}`, {
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
                : seg.text.split(" ").map((w: string, wi: number) => ({
                    word: w,
                    start: seg.start + wi * ((seg.end - seg.start) / seg.text.split(" ").length),
                    end: seg.start + (wi + 1) * ((seg.end - seg.start) / seg.text.split(" ").length),
                  }))
            )
          );
        }
      } catch (err) {
        console.error("[EditorApp] Failed to load project:", err);
        alert("Failed to load project. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    loadProject();
  }, [projectId]);

  return (
    <div className="min-h-screen w-full">
      <Navbar />

      <main className={`relative z-10 ${!videoUrl ? "flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 min-h-[calc(100vh-64px)]" : ""}`}>
        <div className="aurora-bg" />

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

            <UploadDropzone userId={user?.id} transcriptionBalance={user?.transcriptionBalance} audioCredits={user?.audioCredits} />
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
