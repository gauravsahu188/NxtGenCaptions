"use client";
import React, { useState } from "react";
import SidebarLeft from "./Editor/SidebarLeft";
import CaptionsList from "./Editor/CaptionsList";
import VideoPlayer from "./Editor/VideoPlayer";
import Timeline from "./Editor/Timeline";
import PropertiesRight from "./Editor/PropertiesRight";
import { useCaptionContext } from "../context/CaptionContext";
import {
  ArrowUpRight, Monitor, Smartphone, Tv, Lock,
  CheckCircle2, Download, X, Sparkles, Zap,
  ChevronUp, ChevronDown, Type, Captions, Music, LayoutTemplate
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "./Loader";
import PaymentModal from "@/components/PaymentModal";

type Resolution = {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: any;
  unlockedFor: string[];
};

const RESOLUTIONS: Resolution[] = [
  { id: "720p", name: "720p HD", width: 1280, height: 720, icon: Smartphone, unlockedFor: ["FREE", "EDITOR", "CREATOR", "BUSINESS"] },
  { id: "1080p", name: "1080p Full HD", width: 1920, height: 1080, icon: Monitor, unlockedFor: ["EDITOR", "CREATOR", "BUSINESS"] },
  { id: "4k", name: "4K Ultra HD", width: 3840, height: 2160, icon: Tv, unlockedFor: ["CREATOR", "BUSINESS"] },
];

export default function EditorLayout({ user }: { user?: any }) {
  const router = useRouter();
  const { videoUrl, captions, captionStyle, duration, s3Key, aspectRatio, originalVideoWidth, originalVideoHeight } = useCaptionContext();
  const [isRendering, setIsRendering] = useState(false);
  const [showResModal, setShowResModal] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [renderProgress, setRenderProgress] = useState("");

  const planType = user?.planType || "FREE";
  const isFreePlan = planType === "FREE";
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [mobileLeftPanelOpen, setMobileLeftPanelOpen] = useState(false);
  const [mobileRightPanelTab, setMobileRightPanelTab] = useState<string | null>(null);
  const [mobileTimelineExpanded, setMobileTimelineExpanded] = useState(false);

  const handleExportClick = () => {
    if (!videoUrl) {
      alert("Please upload and process a video before exporting.");
      return;
    }
    try {
      sessionStorage.setItem("nxtgen_export", JSON.stringify({
        videoKey: s3Key,
        videoUrl,
        captions,
        captionStyle,
        duration,
        aspectRatio,
        originalVideoWidth,
        originalVideoHeight,
        userId: user?.id,
      }));
    } catch (e) {
      console.error("sessionStorage write failed:", e);
    }
    router.push("/export");
  };

  const triggerExport = async (res: Resolution) => {
    const isUnlocked = res.unlockedFor.includes(planType);
    if (!isUnlocked) return;

    if (removeWatermark && isFreePlan) {
      router.push("/dashboard?upgrade=true");
      return;
    }

    setShowResModal(false);
    setIsRendering(true);
    setExportComplete(false);
    setRenderProgress("Bundling composition...");

    // Use s3Key if available, otherwise extract filename from local URL
    const videoId = s3Key || (videoUrl ? videoUrl.split("/").pop()?.split("?")[0] : null);
    if (!videoId) {
      alert("No video source found. Please re-upload your video.");
      setIsRendering(false);
      return;
    }

    const remotionStyle = {
      ...captionStyle,
      template:        mapLayoutToTemplate(captionStyle.layout),
      layout:          captionStyle.layout ?? "bottom",
      fontSize:        captionStyle.fontSize,
    };

    // Progress ticker
    const progressSteps = [
      "Bundling composition...",
      "Rendering frames...",
      "Encoding video...",
      "Uploading to cloud...",
    ];
    let stepIdx = 0;
    const progressTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, progressSteps.length - 1);
      setRenderProgress(progressSteps[stepIdx]);
    }, 8000);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.id) headers["x-user-id"] = user.id;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min

      const response = await fetch("/api/render", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          videoId,
          captions,
          style:             remotionStyle,
          durationInSeconds: duration,
          fps:               30,
          width:             res.width,
          height:            res.height,
          removeWatermark,
        }),
      });
      clearTimeout(timeoutId);

      const json = await response.json();
      if (json.status === "success") {
        setDownloadUrl(json.data.downloadUrl);
        setExportComplete(true);
        setRenderProgress("Done!");

        const link = document.createElement("a");
        link.href = json.data.downloadUrl;
        link.setAttribute("download", "NxtGenExport.mp4");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Render failed: " + (json.message ?? JSON.stringify(json)));
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        alert("Render timed out (over 5 minutes). Try a shorter video or lower resolution.");
      } else {
        alert("Export error: " + (e?.message ?? "Unknown error"));
      }
      console.error("[Export] error:", e);
    } finally {
      clearInterval(progressTimer);
      setIsRendering(false);
    }
  };

  function mapLayoutToTemplate(layout: string): string {
    const map: Record<string, string> = {
      modern:               "modern",
      bubble:               "bubble",
      delhi:                "delhi",
      neon:                 "neon",
      classic:              "classic",
      hormozi:              "modern",
      "ali-abdaal":         "modern",
      gadzhi:               "neon",
      apple:                "classic",
      "mogrt-shimmer-stack": "modern",
    };
    return map[layout] ?? "modern";
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-57px)] w-full bg-[#050505] overflow-hidden font-sans text-white relative">
      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden relative">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#050505] z-30">
          <button onClick={() => setMobileLeftPanelOpen(true)} className="p-2 bg-white/5 rounded-xl border border-white/10 text-white flex items-center gap-2">
            <Captions className="w-4 h-4" />
            <span className="text-xs font-bold">Captions</span>
          </button>
          
          <button
            onClick={handleExportClick}
            disabled={isRendering}
            className="bg-white text-black hover:bg-zinc-200 font-bold px-4 py-2 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <ArrowUpRight className="w-4 h-4 text-black" />
            <span className="text-xs">Export</span>
          </button>
        </div>

        {/* Desktop Sidebar Left */}
        <div className="hidden md:flex">
          <SidebarLeft />
        </div>
        
        {/* Captions List Panel */}
        <div className={`md:w-[380px] flex-col min-h-0 overflow-hidden border-r border-white/5 relative z-40 bg-[#050505] ${mobileLeftPanelOpen ? 'absolute inset-0 z-50 flex' : 'hidden'} md:flex`}>
          {mobileLeftPanelOpen && (
             <div className="flex justify-between items-center p-4 border-b border-white/5 md:hidden bg-[#050505]">
               <span className="font-bold text-white">Captions</span>
               <button onClick={() => setMobileLeftPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
             </div>
          )}
          <CaptionsList />
          {/* Timeline on desktop */}
          <div className="hidden md:block">
            <Timeline />
          </div>
        </div>

        {/* Video Player & Mobile Timeline */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 bg-transparent relative h-full">
          <div className="flex-1 w-full flex items-center justify-center relative">
            <VideoPlayer />
          </div>
          
          {/* Mobile Timeline Toggle */}
          <div className="md:hidden w-full bg-[#050505] border-t border-white/10 z-30 flex flex-col">
            <button onClick={() => setMobileTimelineExpanded(!mobileTimelineExpanded)} className="w-full py-3 flex justify-center items-center gap-2 text-zinc-400 hover:text-white transition-colors">
               {mobileTimelineExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />} 
               <span className="text-xs font-bold uppercase tracking-widest">Timeline</span>
            </button>
            <AnimatePresence>
              {mobileTimelineExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <Timeline />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Properties Right Panel */}
        <div className="hidden md:flex flex-col min-h-0 relative z-20">
          <div className="flex-1 overflow-hidden">
            <PropertiesRight user={user} onOpenUpgradeModal={() => setIsPaymentModalOpen(true)} />
          </div>
          {/* Export button — always in normal document flow, never hidden */}
          <div className="p-4 border-t border-white/6 bg-[#050505]">
            <button
              onClick={handleExportClick}
              disabled={isRendering}
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-4 rounded-2xl shadow-2xl flex justify-center items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </div>
              Export Video
            </button>
          </div>
        </div>

        {/* Mobile Right Properties Vertical Buttons */}
        <div className="md:hidden absolute right-3 top-1/4 flex flex-col gap-3 z-30">
          {[
            { id: 'Text', icon: <Type className="w-5 h-5" /> },
            { id: 'Templates', icon: <LayoutTemplate className="w-5 h-5" /> },
            { id: 'Motion', icon: <Sparkles className="w-5 h-5" /> },
            { id: 'AI Audio', icon: <Music className="w-5 h-5" /> }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setMobileRightPanelTab(tab.id)} 
              className="w-10 h-10 rounded-xl bg-[#050505]/80 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-lg"
            >
              {tab.icon}
            </button>
          ))}
        </div>

        {/* Mobile Properties Overlay */}
        <AnimatePresence>
           {mobileRightPanelTab && (
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="md:hidden absolute inset-0 z-50 bg-[#050505] flex flex-col"
              >
                 <div className="flex justify-between items-center p-4 border-b border-white/5">
                    <span className="font-bold text-white uppercase tracking-widest">{mobileRightPanelTab}</span>
                    <button onClick={() => setMobileRightPanelTab(null)} className="p-2 hover:bg-white/10 rounded-full">
                      <X className="w-5 h-5 text-white" />
                    </button>
                 </div>
                 <div className="flex-1 overflow-hidden relative">
                   <PropertiesRight 
                      user={user} 
                      onOpenUpgradeModal={() => setIsPaymentModalOpen(true)}
                      activeTabOverride={mobileRightPanelTab}
                      hideTabs={true}
                   />
                 </div>
              </motion.div>
           )}
        </AnimatePresence>
      </div>

      {/* Exporting Overlay */}
      <AnimatePresence>
        {isRendering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-bg-deep/90 backdrop-blur-xl"
          >
            <Loader text="Exporting" />
            <div className="mt-8 text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Rendering your Masterpiece</h2>
              <p className="text-zinc-400 text-sm">{renderProgress || "This may take a few moments depending on video length."}</p>
              {downloadUrl && exportComplete && (
                <a
                  href={downloadUrl}
                  download="NxtGenExport.mp4"
                  className="mt-4 inline-block px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-colors"
                >
                  ⬇ Download Again
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolution Selection Modal */}
      <AnimatePresence>
        {showResModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-bg-elevated border border-white/10 rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">Select Quality</h3>
                    <p className="text-zinc-400 text-sm">Choose the output resolution for your video.</p>
                  </div>
                  <button onClick={() => setShowResModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  {RESOLUTIONS.map((res) => {
                    const isUnlocked = res.unlockedFor.includes(planType);
                    const Icon = res.icon;
                    return (
                      <button
                        key={res.id}
                        onClick={() => triggerExport(res)}
                        disabled={!isUnlocked}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          isUnlocked
                          ? "bg-white/5 border-white/10 hover:border-sky-500/50 hover:bg-white/8"
                          : "bg-white/2 border-white/5 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${isUnlocked ? "bg-sky-500/10 text-sky-400" : "bg-zinc-800 text-zinc-500"}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-bold">{res.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{res.width} × {res.height}</div>
                          </div>
                        </div>
                        {!isUnlocked && <Lock className="w-4 h-4 text-zinc-600" />}
                        {isUnlocked && <ArrowUpRight className="w-4 h-4 text-zinc-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Remove Watermark Option */}
                <div className="pt-4 border-t border-white/10">
                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      removeWatermark
                      ? "bg-sky-500/10 border-sky-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                    onClick={() => {
                      if (isFreePlan) {
                        router.push("/dashboard?upgrade=true");
                        return;
                      }
                      setRemoveWatermark(!removeWatermark);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${removeWatermark ? "bg-sky-500/20 text-sky-400" : "bg-zinc-800 text-zinc-500"}`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm">Remove Watermark</div>
                        <div className="text-[10px] text-zinc-500">
                          {isFreePlan ? "Upgrade to remove" : "Professional export"}
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors ${removeWatermark ? "bg-sky-500" : "bg-zinc-700"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${removeWatermark ? "translate-x-4" : "translate-x-0.5"} mt-0.5`} />
                    </div>
                  </label>
                </div>

                <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  <p className="text-[11px] text-sky-200/70 leading-relaxed">
                    Higher resolutions are processed on our high-performance GPU clusters for maximum clarity.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Complete Modal */}
      <AnimatePresence>
        {exportComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-bg-elevated border border-white/10 rounded-[32px] shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 text-center space-y-6 overflow-y-auto custom-scrollbar">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Export Ready!</h3>
                <p className="text-zinc-400 text-sm">Your video has been rendered and is ready for download.</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (downloadUrl) {
                      const link = document.createElement("a");
                      link.href = downloadUrl;
                      link.setAttribute("download", "NxtGenExport.mp4");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Again
                </button>
                <button
                  onClick={() => setExportComplete(false)}
                  className="w-full bg-white/5 text-zinc-400 font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        currentPlan={user?.planType ?? "FREE"} 
      />
    </div>
  );
}
