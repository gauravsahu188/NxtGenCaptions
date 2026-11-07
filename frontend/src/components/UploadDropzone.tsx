"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileVideo,
  Zap,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  X,
  Clock,
  ImageOff,
  HardDrive,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useCaptionContext } from "../context/CaptionContext";
import LanguageSelectionModal from "./LanguageSelectionModal";
import PaymentModal from "./PaymentModal";
import { useToast } from "../context/ToastContext";

const PLAN_MAX_DURATIONS: Record<string, number> = {
  FREE: 30,         // 30 seconds
  TRIAL_1_INR: 60,  // 1 minute
  TRIAL_9_INR: 540, // 9 minutes
  EDITOR: 300,      // 5 minutes
  CREATOR: 600,     // 10 minutes
  BUSINESS: 1800,   // 30 minutes
};

const formatDurationLimit = (seconds: number): string => {
  if (seconds < 60) return `${seconds} seconds`;
  return `${Math.round(seconds / 60)} minutes`;
};

const formatTimeSeconds = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export interface UploadViolationError {
  type: "duration" | "image" | "file-type" | "file-size" | "storage" | "quota" | "server" | "network";
  title: string;
  message: string;
  is4K?: boolean;
  fileName?: string;
  fileSizeFormatted?: string;
  durationFormatted?: string;
  resolutionFormatted?: string;
  allowedLimit?: string;
  action?: {
    label: string;
    variant: "upgrade" | "reselect" | "dismiss";
    onClick: () => void;
  };
}

interface VideoMetadataResult {
  duration: number;
  width: number;
  height: number;
  is4K: boolean;
}

export default function UploadDropzone({
  userId,
  transcriptionBalance,
  audioCredits,
  planType = "FREE",
}: {
  userId?: string;
  transcriptionBalance?: number;
  audioCredits?: number;
  planType?: "FREE" | "EDITOR" | "CREATOR" | "BUSINESS" | "TRIAL_1_INR" | "TRIAL_9_INR" | string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [audioEnhance, setAudioEnhance] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uiError, setUiError] = useState<UploadViolationError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    setVideoUrl,
    setCaptions,
    setIsProcessing,
    setProcessingMessage,
    setOriginalWords,
    setS3Key,
    setOriginalVideoWidth,
    setOriginalVideoHeight,
    setAspectRatio,
  } = useCaptionContext();
  const { error: showError } = useToast();

  const remainingMinutes = transcriptionBalance ?? 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const isImageFile = (file: File): boolean => {
    if (file.type && file.type.startsWith("image/")) return true;
    const name = file.name.toLowerCase();
    return /\.(jpe?g|png|webp|gif|svg|bmp|tiff?|heic|heif|ico)$/i.test(name);
  };

  const getVideoMetadata = (file: File): Promise<VideoMetadataResult> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      let hasResolved = false;

      // 6-second safety timeout: Prevents UI from hanging on high-bitrate 4K files or codecs that take long to parse
      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          URL.revokeObjectURL(video.src);
          // If browser client can't read metadata quickly, defer duration verification to server ffprobe
          resolve({ duration: 0, width: 0, height: 0, is4K: false });
        }
      }, 6000);

      video.onloadedmetadata = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          const w = video.videoWidth || 0;
          const h = video.videoHeight || 0;
          const dur = video.duration || 0;
          URL.revokeObjectURL(video.src);
          const is4K = w >= 3840 || h >= 2160 || (w >= 2160 && h >= 3840);
          resolve({ duration: dur, width: w, height: h, is4K });
        }
      };

      video.onerror = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          URL.revokeObjectURL(video.src);
          // In case the browser cannot decode 4K/HEVC/ProRes locally, allow upload to proceed to server-side ffprobe
          resolve({ duration: 0, width: 0, height: 0, is4K: false });
        }
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const processSelectedFile = async (file: File) => {
    // 1. Image File Violation Check
    if (isImageFile(file)) {
      const errMsg = `Image files ("${file.name}") cannot be processed. NxtGen Captions requires a video file to generate audio-synced captions. Please upload an MP4, MOV, or WEBM video.`;
      setUiError({
        type: "image",
        title: "Image Upload Violation",
        message: errMsg,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        action: {
          label: "Choose Video File",
          variant: "reselect",
          onClick: () => fileInputRef.current?.click(),
        },
      });
      showError("Image files are not supported. Please upload a video file.");
      return;
    }

    // 2. Non-Video Format Check
    if (!file.type.startsWith("video/") && !/\.(mp4|mov|webm|mkv|avi|m4v|wmv|flv)$/i.test(file.name)) {
      const errMsg = `"${file.name}" is not a supported video file. Supported video formats include MP4, MOV, WEBM, MKV, and AVI.`;
      setUiError({
        type: "file-type",
        title: "Unsupported File Format",
        message: errMsg,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        action: {
          label: "Choose Video File",
          variant: "reselect",
          onClick: () => fileInputRef.current?.click(),
        },
      });
      showError("Please upload a valid video file.");
      return;
    }

    // 3. File Size Violation Check (4 GB Max)
    const MAX_FILE_SIZE = 4000 * 1024 * 1024; // 4 GB
    if (file.size > MAX_FILE_SIZE) {
      const errMsg = `The selected video is ${formatFileSize(file.size)}, which exceeds the maximum allowed file size of 4 GB. Please compress or trim your video before uploading.`;
      setUiError({
        type: "file-size",
        title: "File Size Limit Exceeded",
        message: errMsg,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        action: {
          label: "Choose Another Video",
          variant: "reselect",
          onClick: () => fileInputRef.current?.click(),
        },
      });
      showError(errMsg);
      return;
    }

    // 4. Video Metadata & Duration Check (4K videos are fully supported, duration is restricted)
    const { duration, width, height, is4K } = await getVideoMetadata(file);

    const maxDuration = PLAN_MAX_DURATIONS[planType] || 30;

    // If client successfully detected duration and it exceeds the plan limit:
    if (duration > maxDuration) {
      const limitLabel = formatDurationLimit(maxDuration);
      const durLabel = formatTimeSeconds(duration);
      const title = is4K ? "4K Video Duration Limit Exceeded" : "Video Duration Limit Exceeded";
      const message = is4K
        ? `4K Ultra HD video is fully supported on NxtGen! However, your ${planType.toLowerCase()} plan allows a maximum duration of ${limitLabel}. Your 4K video is ${durLabel} (${Math.round(duration)}s). Please trim your video to ${limitLabel} or upgrade your plan to unlock longer 4K videos.`
        : `Your ${planType.toLowerCase()} plan allows videos up to ${limitLabel}. The uploaded video is ${durLabel} (${Math.round(duration)}s). Please trim your video to ${limitLabel} or upgrade your plan to process longer videos.`;

      setUiError({
        type: "duration",
        title,
        message,
        is4K,
        fileName: file.name,
        durationFormatted: durLabel,
        fileSizeFormatted: formatFileSize(file.size),
        resolutionFormatted: is4K ? "4K Ultra HD" : width && height ? `${width}x${height}` : undefined,
        allowedLimit: limitLabel,
        action: {
          label: "Upgrade Plan",
          variant: "upgrade",
          onClick: () => setIsPaymentModalOpen(true),
        },
      });

      showError(
        `Video duration exceeds limits. Your ${planType.toLowerCase()} plan allows maximum ${limitLabel}. Your video is ${durLabel}.`,
        {
          duration: 8000,
          action: {
            label: "Upgrade Plan",
            onClick: () => setIsPaymentModalOpen(true),
          },
        }
      );
      return;
    }

    // All validation checks passed: clear previous error and proceed
    setUiError(null);
    setPendingFile(file);
    setIsModalOpen(true);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processSelectedFile(file);
      // Reset input so the same file can be selected again if needed
      e.target.value = "";
    }
  };

  const handleUpload = async (file: File, language: string, script: string) => {
    if (!file.type.startsWith("video/") && !/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name)) {
      showError("Please upload a valid video file.");
      return;
    }

    setUiError(null);
    setVideoUrl(URL.createObjectURL(file));
    setCaptions([]);
    setIsProcessing(true);

    const formData = new FormData();
    if (userId) formData.append("userId", userId);
    formData.append("language", language);
    formData.append("script", script);
    formData.append("audioEnhance", audioEnhance.toString());
    formData.append("video", file);

    try {
      const headers: Record<string, string> = {};
      if (userId) headers["x-user-id"] = userId;

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${BACKEND_URL}/api/video/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `Server error (${res.status})`;
        let errType: UploadViolationError["type"] = "server";
        let errTitle = "Upload Failed";

        try {
          const errText = await res.text();
          try {
            const parsed = JSON.parse(errText);
            errorMsg = parsed.message || parsed.error || errorMsg;
          } catch {
            if (res.status === 413) {
              errorMsg = "Video file is too large for the server (maximum 4 GB allowed). Please compress or trim your video.";
              errType = "file-size";
              errTitle = "File Size Limit Exceeded";
            } else if (res.status === 403) {
              errType = "storage";
              errTitle = "Upload Restricted";
            } else if (res.status === 504) {
              errorMsg = "Server timed out processing the video (504 Gateway Timeout).";
              errType = "network";
            } else if (res.status === 502) {
              errorMsg = "Backend server is currently restarting or unreachable (502 Bad Gateway).";
              errType = "network";
            }
          }
        } catch {
          // ignore
        }

        setUiError({
          type: errType,
          title: errTitle,
          message: errorMsg,
          fileName: file.name,
          fileSizeFormatted: formatFileSize(file.size),
          action:
            errType === "storage"
              ? {
                  label: "Upgrade Plan",
                  variant: "upgrade",
                  onClick: () => setIsPaymentModalOpen(true),
                }
              : {
                  label: "Choose Another Video",
                  variant: "reselect",
                  onClick: () => fileInputRef.current?.click(),
                },
        });

        showError(errorMsg);
        setVideoUrl(null);
        setIsProcessing(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) {
        setUiError({
          type: "network",
          title: "Stream Error",
          message: "Failed to read server response stream.",
          action: {
            label: "Try Again",
            variant: "reselect",
            onClick: () => fileInputRef.current?.click(),
          },
        });
        showError("Failed to read server response stream.");
        setVideoUrl(null);
        setIsProcessing(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: !done });
        }

        const lines = buffer.split("\n\n");

        if (!done) {
          buffer = lines.pop() || "";
        } else {
          buffer = "";
        }

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.replace("data: ", ""));

            switch (data.type) {
              case "init":
                if (data.videoId) setS3Key(data.videoId);
                break;
              case "status":
                setProcessingMessage(data.message);
                break;
              case "segment":
                setCaptions((prev) => {
                  if (prev.some((s) => s.id === data.segment.id)) return prev;
                  return [...prev, data.segment];
                });
                break;
              case "complete":
                setCaptions(data.captions);
                if (data.s3Key) setS3Key(data.s3Key);
                if (data.dimensions) {
                  if (data.dimensions.width) setOriginalVideoWidth(data.dimensions.width);
                  if (data.dimensions.height) setOriginalVideoHeight(data.dimensions.height);
                  const aspect = data.dimensions.width / (data.dimensions.height || 1);
                  if (aspect < 0.7) setAspectRatio("9:16");
                  else setAspectRatio("16:9");
                }
                setOriginalWords(
                  (data.captions as any[]).flatMap((seg: any) =>
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
                setIsProcessing(false);
                break;
              case "error": {
                const rawMsg = data.message || "An error occurred during processing.";
                let errType: UploadViolationError["type"] = "server";
                let errTitle = "Processing Error";
                let isUpgrade = false;

                if (rawMsg.includes("DURATION_LIMIT_EXCEEDED") || rawMsg.includes("FREE_LIMIT_EXCEEDED")) {
                  errType = "duration";
                  errTitle = "Video Duration Limit Exceeded";
                  isUpgrade = true;
                } else if (rawMsg.includes("NO_CREDITS") || rawMsg.includes("CREDIT_LIMIT_EXCEEDED")) {
                  errType = "quota";
                  errTitle = "Insufficient Transcription Credits";
                  isUpgrade = true;
                } else if (rawMsg.includes("STORAGE_LIMIT_EXCEEDED") || rawMsg.includes("Storage limit")) {
                  errType = "storage";
                  errTitle = "Storage Limit Reached";
                  isUpgrade = true;
                } else if (rawMsg.includes("IMAGE_UPLOAD_VIOLATION")) {
                  errType = "image";
                  errTitle = "Image Upload Violation";
                } else if (rawMsg.includes("FILE_SIZE_LIMIT_EXCEEDED")) {
                  errType = "file-size";
                  errTitle = "File Size Limit Exceeded";
                }

                // Clean prefix like "DURATION_LIMIT_EXCEEDED: "
                const cleanMsg = rawMsg.replace(/^[A-Z_]+:\s*/, "");

                setUiError({
                  type: errType,
                  title: errTitle,
                  message: cleanMsg,
                  fileName: file.name,
                  fileSizeFormatted: formatFileSize(file.size),
                  action: isUpgrade
                    ? {
                        label: "Upgrade Plan",
                        variant: "upgrade",
                        onClick: () => setIsPaymentModalOpen(true),
                      }
                    : {
                        label: "Choose Another Video",
                        variant: "reselect",
                        onClick: () => fileInputRef.current?.click(),
                      },
                });

                if (isUpgrade) {
                  showError(cleanMsg, {
                    duration: 8000,
                    action: {
                      label: "Upgrade Plan",
                      onClick: () => setIsPaymentModalOpen(true),
                    },
                  });
                } else {
                  showError(cleanMsg);
                }
                setVideoUrl(null);
                setIsProcessing(false);
                break;
              }
            }
          } catch (e) {
            console.error("Error parsing SSE line:", line, e);
          }
        }

        if (done) break;
      }
    } catch (error: any) {
      console.error("[Upload error]", error);
      const msg = error?.message ? `Connection failed: ${error.message}` : "Failed to connect to the server.";
      setUiError({
        type: "network",
        title: "Connection Failed",
        message: msg,
        fileName: file.name,
        action: {
          label: "Try Again",
          variant: "reselect",
          onClick: () => fileInputRef.current?.click(),
        },
      });
      showError(msg);
      setVideoUrl(null);
    } finally {
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
      <LanguageSelectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingFile(null);
        }}
        onSubmit={(language, script) => {
          setIsModalOpen(false);
          if (pendingFile) {
            handleUpload(pendingFile, language, script);
            setPendingFile(null);
          }
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={planType as any}
      />

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
          <div
            className={`relative w-8 h-5 rounded-full transition-all ${
              audioEnhance ? "bg-amber-500" : "bg-zinc-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                audioEnhance ? "left-3.5" : "left-0.5"
              }`}
            />
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

      {/* Upload Violation Error Banner in UI */}
      <AnimatePresence>
        {uiError && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-5 rounded-2xl border border-red-500/30 bg-red-950/20 backdrop-blur-xl shadow-2xl shadow-red-950/40 text-left relative overflow-hidden"
          >
            {/* Background subtle radial glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="relative z-10 flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      uiError.type === "duration" || uiError.type === "quota"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {uiError.type === "image" && <ImageOff className="w-5 h-5" />}
                    {uiError.type === "duration" && <Clock className="w-5 h-5" />}
                    {uiError.type === "file-size" && <HardDrive className="w-5 h-5" />}
                    {uiError.type === "storage" && <HardDrive className="w-5 h-5" />}
                    {uiError.type === "quota" && <Zap className="w-5 h-5" />}
                    {uiError.type === "file-type" && <AlertTriangle className="w-5 h-5" />}
                    {(uiError.type === "server" || uiError.type === "network") && (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        {uiError.title}
                      </h4>
                      {uiError.is4K && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/40">
                          4K UHD
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">Upload Violation Detected</p>
                  </div>
                </div>

                <button
                  onClick={() => setUiError(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                  title="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message body */}
              <p className="text-sm text-zinc-300 leading-relaxed">{uiError.message}</p>

              {/* Violation Details Chips */}
              {(uiError.fileName ||
                uiError.allowedLimit ||
                uiError.durationFormatted ||
                uiError.fileSizeFormatted ||
                uiError.is4K) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {uiError.fileName && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-300 truncate max-w-xs">
                      File: {uiError.fileName}
                    </span>
                  )}
                  {uiError.durationFormatted && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-amber-400 font-medium">
                      Duration: {uiError.durationFormatted}
                    </span>
                  )}
                  {uiError.allowedLimit && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-green-400 font-medium">
                      Plan Limit: {uiError.allowedLimit}
                    </span>
                  )}
                  {uiError.fileSizeFormatted && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400">
                      Size: {uiError.fileSizeFormatted}
                    </span>
                  )}
                  {uiError.is4K && (
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 font-medium">
                      4K Videos Allowed (Plan duration limit applies)
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {uiError.action && (
                  <button
                    onClick={uiError.action.onClick}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                      uiError.action.variant === "upgrade"
                        ? "bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    }`}
                  >
                    {uiError.action.variant === "upgrade" ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {uiError.action.label}
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        {uiError.action.label}
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setUiError(null);
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Select Another Video
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`glass-panel relative flex flex-col items-center justify-center w-full h-80 rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer ${
          uiError
            ? "border-red-500/40 bg-red-500/5 hover:border-red-500/60"
            : isDragging
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
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/avi,video/*"
          onChange={handleFileSelect}
        />

        {/* Dropzone UI */}
        <div className="flex flex-col items-center space-y-6">
          <div
            className={`p-4 rounded-full shadow-inner border transition-all ${
              uiError
                ? "bg-red-500/10 border-red-500/30"
                : isDragging
                ? "bg-accent/20 border-accent/40"
                : "bg-zinc-900/50 border-zinc-800"
            }`}
          >
            {uiError ? (
              <AlertTriangle className="w-10 h-10 text-red-400" />
            ) : isDragging ? (
              <FileVideo className="w-10 h-10 text-accent" />
            ) : (
              <UploadCloud className="w-10 h-10 text-zinc-400" />
            )}
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-gradient tracking-tight">
              {uiError ? "Choose another video file" : "Upload your video"}
            </h3>
            <p className="text-zinc-400 max-w-sm text-sm leading-relaxed">
              Drag and drop your MP4, MOV, or WEBM file here, or click to browse. We&apos;ll
              automatically generate high-quality captions.
            </p>
          </div>
        </div>
      </div>

      {/* Feature & Limits Badges Bar */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] text-zinc-400">
        <div className="px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            <strong className="text-white font-medium">4K UHD</strong> Supported
          </span>
        </div>
        <div className="px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Max: <strong className="text-zinc-200">{formatDurationLimit(PLAN_MAX_DURATIONS[planType] || 30)}</strong>
          </span>
        </div>
        <div className="px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>
            Max Size: <strong className="text-zinc-200">4 GB</strong>
          </span>
        </div>
        <div className="px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-center gap-1.5">
          <FileVideo className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>MP4 • MOV • WEBM</span>
        </div>
      </div>
    </motion.div>
  );
}
