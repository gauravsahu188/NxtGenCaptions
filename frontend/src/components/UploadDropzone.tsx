"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileVideo, Globe, Sparkles, Zap } from "lucide-react";
import { useCaptionContext } from "../context/CaptionContext";

const LANGUAGES = [
  { code: "auto", name: "Auto Detect", flag: "🌐" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hinglish", name: "Hinglish", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
];

export default function UploadDropzone({ userId, transcriptionBalance, audioCredits }: { userId?: string; transcriptionBalance?: number; audioCredits?: number }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [audioEnhance, setAudioEnhance] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setVideoUrl, setCaptions, setIsProcessing, setProcessingMessage, setOriginalWords, setS3Key } = useCaptionContext();

  // Show remaining transcription time
  const remainingMinutes = transcriptionBalance ?? 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file.");
      return;
    }

    // Immediately show the Editor Layout
    setVideoUrl(URL.createObjectURL(file));
    setCaptions([]); // CRITICAL: Clear old data
    setIsProcessing(true);
    
    const formData = new FormData();
    if (userId) formData.append("userId", userId);
    formData.append("language", selectedLanguage);
    formData.append("audioEnhance", audioEnhance.toString());
    formData.append("video", file);

    try {
      const headers: Record<string, string> = {};
      if (userId) headers["x-user-id"] = userId;

      const res = await fetch("http://localhost:3001/api/video/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
        }

        const lines = buffer.split("\n\n");
        
        if (!done) {
          buffer = lines.pop() || ""; // Keep the last partial line in buffer
        } else {
          buffer = ""; // We process all lines, clear the buffer
        }

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;
          
          try {
            const data = JSON.parse(line.replace("data: ", ""));

            switch (data.type) {
              case "init":
                setVideoUrl(data.videoUrl);
                break;
              case "status":
                setProcessingMessage(data.message);
                break;
              case "segment":
                setCaptions((prev) => {
                  // Prevent duplicate segments if they somehow arrive twice
                  if (prev.some(s => s.id === data.segment.id)) return prev;
                  return [...prev, data.segment];
                });
                break;
              case "complete":
                setCaptions(data.captions);
                if (data.s3Key) setS3Key(data.s3Key);
                // Save the flat word pool for lossless re-segmentation
                setOriginalWords(
                  (data.captions as any[]).flatMap((seg: any) =>
                    seg.words && seg.words.length > 0
                      ? seg.words
                      : seg.text.split(" ").map((w: string, wi: number) => ({
                          word: w,
                          start: seg.start + wi * ((seg.end - seg.start) / seg.text.split(" ").length),
                          end: seg.start + (wi + 1) * ((seg.end - seg.start) / seg.text.split(" ").length),
                        }))
                  )
                );
                setIsProcessing(false);
                break;
              case "error":
                // Check for specific error codes and redirect
                if (data.message?.includes("FREE_LIMIT_EXCEEDED") || data.message?.includes("NO_CREDITS") || data.message?.includes("CREDIT_LIMIT_EXCEEDED")) {
                  const upgrade = confirm(data.message + "\n\nClick OK to upgrade your plan, or Cancel to stay on this page.");
                  if (upgrade) {
                    window.location.href = "/dashboard?upgrade=true";
                  }
                } else {
                  alert(data.message);
                }
                setIsProcessing(false);
                break;
            }
          } catch (e) {
            console.error("Error parsing SSE line:", line, e);
          }
        }
        
        if (done) break;
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the server.");
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Language Selector */}
      <div className="mb-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
          <Globe className="w-4 h-4 text-zinc-400" />
          <span>Transcription Language</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-xl">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLanguage(lang.code)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-250 cursor-pointer ${
                selectedLanguage === lang.code
                  ? "bg-accent text-white shadow-lg shadow-accent/25 scale-[1.01]"
                  : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white"
              }`}
            >
              <span className="mr-1">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>

        {/* Dynamic Helper Text */}
        <div className="min-h-10 mt-1 text-center max-w-lg px-4 flex items-center justify-center">
          <span className="text-xs text-zinc-400 font-normal leading-relaxed">

            {selectedLanguage === "auto" && (
              <motion.span
                key="auto"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                🌐 Automatically detects the primary language spoken in the video (e.g., outputs traditional Hindi or English).
              </motion.span>
            )}
            {selectedLanguage === "en" && (
              <motion.span
                key="en"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                🇬🇧 Transcribes English speech, or translates non-English languages to English.
              </motion.span>
            )}
            {selectedLanguage === "hinglish" && (
              <motion.span
                key="hinglish"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                🇮🇳 Forces Romanized Hindi transliteration (e.g., writing spoken Hindi using English alphabets like &quot;kaise ho&quot;).
              </motion.span>
            )}
            {selectedLanguage === "hi" && (
              <motion.span
                key="hi"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                🇮🇳 Forces Hindi transcription using the traditional Devanagari script (e.g., &quot;कैसे हो&quot;).
              </motion.span>
            )}
          </span>
        </div>
      </div>

      {/* Audio Enhance Toggle */}
      <div className="mb-4 flex items-center justify-center">
        <button
          onClick={() => setAudioEnhance(!audioEnhance)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            audioEnhance
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${audioEnhance ? "text-amber-400" : "text-zinc-500"}`} />
          <span className="text-sm font-medium">Audio Enhance</span>
          <div className={`relative w-8 h-5 rounded-full transition-all ${audioEnhance ? "bg-amber-500" : "bg-zinc-700"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              audioEnhance ? "left-3.5" : "left-0.5"
            }`} />
          </div>
          <Zap className={`w-3 h-3 ${audioEnhance ? "text-amber-300" : "text-zinc-600"}`} />
        </button>
      </div>

      {/* Remaining Credits Info */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <span className="text-xs text-zinc-400">Remaining transcription:</span>
          <span className={`text-sm font-bold ${remainingMinutes > 0 ? "text-green-400" : "text-red-400"}`}>
            {remainingMinutes} min
          </span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <span className="text-xs text-zinc-400">Audio Credits:</span>
          <span className={`text-sm font-bold ${(audioCredits ?? 0) > 0 ? "text-amber-400" : "text-red-400"}`}>
            {audioCredits ?? 0}
          </span>
        </div>
      </div>

      <div
        className={`glass-panel relative flex flex-col items-center justify-center w-full h-80 rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer ${
          isDragging
            ? "border-accent bg-accent/10"
            : "border-zinc-800 hover:border-zinc-700"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="video/*"
          onChange={handleFileSelect}
        />

        {/* Dropzone UI */}
        <div className="flex flex-col items-center space-y-6">
          <div className="p-4 bg-zinc-900/50 rounded-full shadow-inner border border-zinc-800">
            {isDragging ? (
              <FileVideo className="w-10 h-10 text-accent" />
            ) : (
              <UploadCloud className="w-10 h-10 text-zinc-400" />
            )}
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-gradient tracking-tight">
              Upload your video
            </h3>
            <p className="text-zinc-400 max-w-sm text-sm leading-relaxed">
              Drag and drop your MP4, MOV, or WEBM file here, or click to
              browse. We&apos;ll automatically generate high-quality captions.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
