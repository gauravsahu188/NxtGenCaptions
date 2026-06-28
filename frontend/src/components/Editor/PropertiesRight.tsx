"use client";
import React, { useState, useEffect } from "react";
import { useCaptionContext } from "../../context/CaptionContext";
import { CheckCircle2, RotateCcw, AlignLeft, AlignCenter, AlignRight, ChevronDown, Zap, ZoomIn, Sparkles, ArrowUpRight, Loader2, HelpCircle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FontPicker from "./FontPicker";
import ColorPicker from "./ColorPicker";
import { useToast } from "../../context/ToastContext";

export default function PropertiesRight({ user, onOpenUpgradeModal, activeTabOverride, hideTabs }: { user?: any; onOpenUpgradeModal: () => void; activeTabOverride?: string | null; hideTabs?: boolean }) {
  const { error: showError, success: showSuccess } = useToast();
  const {
    captionStyle,
    setCaptionStyle,
    maxChars,
    setWordsPerLine,
    setLinesOption,
    resegmentWithLines,
    videoUrl,
    s3Key,
    setIsProcessing,
    setProcessingMessage
  } = useCaptionContext() as any;
  const [activeTab, setActiveTab] = useState(activeTabOverride || "Text");
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    if (activeTabOverride) setActiveTab(activeTabOverride);
  }, [activeTabOverride]);

  const updateStyle = (key: string, value: any) => {
    setCaptionStyle((s: any) => ({ ...s, [key]: value }));
  };

  const renderTextTab = () => (
    <div className="p-6 pb-32 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
      {/* Fonts & Size */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Typography</span>
          <div className="flex gap-2">
            <FontPicker
              value={captionStyle.fontFamily}
              onChange={(family) => updateStyle("fontFamily", family)}
            />
            <button
              onClick={() => updateStyle("fontFamily", "Inter")}
              className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-95 shrink-0"
              title="Reset to default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Font Size</span>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative h-6 flex items-center">
              <div className="absolute inset-0 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  style={{ width: `${(captionStyle.fontSize / 100) * 100}%` }}
                ></div>
              </div>
              <input
                type="range" min="1" max="100"
                value={captionStyle.fontSize}
                onChange={e => updateStyle("fontSize", Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={captionStyle.fontSize}
                onChange={e => updateStyle("fontSize", Number(e.target.value))}
                className="w-14 bg-white/5 border border-white/10 rounded-xl py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="space-y-4">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Workspace Position</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 group focus-within:border-sky-500/50 transition-colors">
              <span className="text-[10px] font-black text-zinc-600 group-focus-within:text-sky-400">X</span>
              <input
                type="number" step="0.1"
                value={captionStyle.positionX}
                onChange={e => updateStyle("positionX", Number(e.target.value))}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none text-right"
              />
              <span className="text-[10px] font-bold text-zinc-600">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 group focus-within:border-sky-500/50 transition-colors">
              <span className="text-[10px] font-black text-zinc-600 group-focus-within:text-sky-400">Y</span>
              <input
                type="number" step="0.1"
                value={captionStyle.positionY}
                onChange={e => updateStyle("positionY", Number(e.target.value))}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none text-right"
              />
              <span className="text-[10px] font-bold text-zinc-600">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Style Details */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Visual Styles</span>

          <ColorPicker
            label="Primary Color"
            value={captionStyle.primaryColor}
            onChange={val => updateStyle("primaryColor", val)}
          />

          <div className="flex items-center justify-between group">
            <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Letter Spacing</span>
            <div className="flex items-center gap-3">
              <div className="w-32 relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500"
                  style={{ width: `${((captionStyle.letterSpacing + 10) / 20) * 100}%` }}
                ></div>
              </div>
              <span className="text-[11px] font-black text-white w-6 text-right">{captionStyle.letterSpacing}</span>
            </div>
          </div>

          <div className="flex items-center justify-between group">
            <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Text Alignment</span>
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => updateStyle("textAlignment", "left")} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${captionStyle.textAlignment === 'left' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-zinc-500 hover:text-white'}`}><AlignLeft className="w-4 h-4" /></button>
              <button onClick={() => updateStyle("textAlignment", "center")} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${captionStyle.textAlignment === 'center' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-zinc-500 hover:text-white'}`}><AlignCenter className="w-4 h-4" /></button>
              <button onClick={() => updateStyle("textAlignment", "right")} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${captionStyle.textAlignment === 'right' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-zinc-500 hover:text-white'}`}><AlignRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Drop Shadow */}
      <div className="pt-6 border-t border-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Cinematic Shadow</span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-tight">Adds depth to captions</span>
          </div>
          <button
            onClick={() => updateStyle("dropShadow", !captionStyle.dropShadow)}
            className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${captionStyle.dropShadow ? 'bg-sky-500' : 'bg-white/10'}`}
          >
            <motion.div
              animate={{ x: captionStyle.dropShadow ? 24 : 4 }}
              className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-md"
            />
          </button>
        </div>
        {captionStyle.dropShadow && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5"
          >
            <ColorPicker
              label="Shadow Color"
              value={captionStyle.dropShadowColor}
              onChange={val => updateStyle("dropShadowColor", val)}
            />
          </motion.div>
        )}
      </div>

      {/* Premium Render Settings */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Render Options</span>

        {/* Alpha Channel Render Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-white">Alpha Channel Render</p>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-white cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-zinc-900 border border-white/10 rounded-lg text-[10px] text-zinc-400 font-medium leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
                    Renders captions with a transparent background, perfect for overlaying in Premiere Pro or Final Cut.
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                {user?.planType === "FREE" || user?.planType === "EDITOR" ? "Requires Creator+" : "Transparent background"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(user?.planType === "FREE" || user?.planType === "EDITOR") ? (
              <button
                onClick={onOpenUpgradeModal}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold">UPGRADE</span>
              </button>
            ) : (
              <button
                onClick={() => updateStyle("alphaChannel", !captionStyle.alphaChannel)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${captionStyle.alphaChannel ? "bg-sky-500" : "bg-zinc-700"
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${captionStyle.alphaChannel ? "left-7" : "left-1"
                  }`} />
              </button>
            )}
          </div>
        </div>

        {/* SRT Subtitles Render Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-white">SRT Subtitles</p>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-white cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-zinc-900 border border-white/10 rounded-lg text-[10px] text-zinc-400 font-medium leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
                    Downloads a separate perfectly-timed .srt subtitle file alongside your video export.
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                {user?.planType === "FREE" || user?.planType === "EDITOR" ? "Requires Creator+" : "Separate SRT file"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(user?.planType === "FREE" || user?.planType === "EDITOR") ? (
              <button
                onClick={onOpenUpgradeModal}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold">UPGRADE</span>
              </button>
            ) : (
              <button
                onClick={() => updateStyle("srtExport", !captionStyle.srtExport)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${captionStyle.srtExport ? "bg-sky-500" : "bg-zinc-700"
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${captionStyle.srtExport ? "left-7" : "left-1"
                  }`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransitionsTab = () => (
    <div className="p-6 pb-32 flex-1 overflow-y-auto space-y-8">
      <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
        <button
          onClick={() => updateStyle("transitionTarget", "line")}
          className={`flex-1 rounded-xl py-3 text-[11px] font-black uppercase tracking-widest transition-all ${captionStyle.transitionTarget === 'line' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
        >By Line</button>
        <button
          onClick={() => updateStyle("transitionTarget", "word")}
          className={`flex-1 rounded-xl py-3 text-[11px] font-black uppercase tracking-widest transition-all ${captionStyle.transitionTarget === 'word' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
        >By Word</button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white">Motion Effects</h4>
          <span className="text-[10px] text-zinc-500 font-medium tracking-tight">Applied to individual {captionStyle.transitionTarget}s</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "none", label: "Static", icon: <div className="w-1.5 h-1.5 rounded-full bg-current"></div> },
            { id: "fade", label: "Ethereal", icon: <div className="w-6 h-6 bg-current blur-md opacity-50"></div> },
            { id: "pop", label: "Spring", icon: <div className="w-6 h-6 rounded-full border-4 border-current scale-75"></div> },
            { id: "zoom", label: "Focus", icon: <ZoomIn className="w-6 h-6" /> },
            { id: "scale", label: "Reveal", icon: <div className="w-8 h-1 bg-current rounded-full"></div> },
            { id: "slide-x", label: "Sideways", icon: <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-current"></div><div className="w-4 h-1 bg-current rounded-full"></div></div> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => updateStyle("transitionType", t.id)}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border group relative overflow-hidden"
              style={{
                backgroundColor: captionStyle.transitionType === t.id ? 'rgba(56,189,248,0.1)' : 'transparent',
                borderColor: captionStyle.transitionType === t.id ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.05)'
              }}
            >
              <div className={`transition-all ${captionStyle.transitionType === t.id ? 'text-sky-400 scale-110' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                {t.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${captionStyle.transitionType === t.id ? 'text-sky-400' : 'text-zinc-500'}`}>{t.label}</span>
              {captionStyle.transitionType === t.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-white/5 flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            Dynamic Speed <Zap className="w-3.5 h-3.5 text-sky-400" />
          </span>
          <p className="text-[10px] text-zinc-500 font-medium mt-1">AI-synchronized timing</p>
        </div>
        <button
          onClick={() => updateStyle("dynamicSpeed", !captionStyle.dynamicSpeed)}
          className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${captionStyle.dynamicSpeed ? 'bg-sky-500' : 'bg-white/10'}`}
        >
          <motion.div
            animate={{ x: captionStyle.dynamicSpeed ? 24 : 4 }}
            className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-md"
          />
        </button>
      </div>
    </div>
  );

  const handleEnhanceAudio = async () => {
    if (!user) {
      showError("Please sign in to use audio enhancement.");
      return;
    }
    if ((user.audioCredits ?? 0) < 1) {
      showError("You do not have enough audio credits. Please upgrade your plan.", {
        duration: 7000,
        action: {
          label: "Upgrade Plan",
          onClick: () => {
            window.location.href = "/dashboard?upgrade=true";
          }
        }
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${BACKEND_URL}/api/video/enhance-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });

      const json = await res.json();
      if (res.ok && json.status === "success") {
        showSuccess("Audio enhanced successfully!");
        // Update the user's credits locally if possible, or just rely on a refresh
        if (user) {
          user.audioCredits = json.data.audioCredits;
        }
      } else {
        showError(json.message || "Failed to enhance audio.");
      }
    } catch (error) {
      console.error(error);
      showError("An error occurred while enhancing audio.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const renderAIAudioTab = () => (
    <div className="p-8 pb-32 flex-1 overflow-y-auto flex flex-col items-center text-center">
      <div className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-2 mb-8">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest">NxtGen Core</span>
      </div>

      <h2 className="text-2xl font-bold text-white tracking-tighter mb-4">Neural Audio Engine</h2>
      <p className="text-sm text-zinc-400 mb-8 leading-relaxed max-w-[240px]">
        Studio-grade restoration using advanced neural networks.
      </p>

      <button
        onClick={handleEnhanceAudio}
        disabled={isEnhancing}
        className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-sky-500/20 mb-10 uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isEnhancing ? (
          <>
            Enhancing...
            <Loader2 className="w-4 h-4 animate-spin" />
          </>
        ) : (
          <>
            Enhance Audio
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-4 w-full text-left">
        {[
          { label: "Denoise", icon: "01" },
          { label: "De-reverb", icon: "02" },
          { label: "Leveling", icon: "03" },
          { label: "Clarity", icon: "04" },
        ].map((item) => (
          <div key={item.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-zinc-600 font-mono tracking-tighter">{item.icon}</span>
            <span className="text-[11px] font-bold text-white">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto w-full pt-8 border-t border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Zap className="w-6 h-6 text-sky-400" />
        </div>
        <div className="text-left flex-1">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Neural Credits</div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-white leading-none">{user?.audioCredits ?? 0}</span>
            <span className="text-[9px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full uppercase">Credits</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full md:w-[360px] glass-panel md:border-l border-white/5 flex flex-col h-full font-sans relative z-20">
      {/* Tabs */}
      {!hideTabs && (
        <div className="flex border-b border-white/5 text-[11px] font-black uppercase tracking-widest px-4">
        {['Text', 'Templates', 'Motion', 'AI Audio'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-5 transition-all relative ${activeTab === tab ? 'text-sky-400' : 'text-zinc-500 hover:text-white'}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
              />
            )}
          </button>
        ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "Text" && renderTextTab()}
        {activeTab === "Motion" && renderTransitionsTab()}
        {activeTab === "AI Audio" && renderAIAudioTab()}
        {activeTab === "Templates" && (
          <div className="p-6 pb-32 flex-1 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Premium Templates</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {/* NxtGenGenZ Template - Metallic Style */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "nxtgen-genz" ? "border-lime-500 bg-lime-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    const plan = user?.planType ?? "FREE";
                    if (plan === "FREE") {
                      onOpenUpgradeModal();
                      return;
                    }
                    updateStyle("layout", "nxtgen-genz");
                    updateStyle("fontFamily", "Inter");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("spotlightColor", "#A0D83E");
                    updateStyle("emphasisColor", "#AADC56");
                    updateStyle("dropShadow", true);
                    updateStyle("dropShadowColor", "#000000");
                    updateStyle("dropShadowOpacity", 70);
                    updateStyle("textAlignment", "center");
                    updateStyle("fontSize", 10);
                    setWordsPerLine(3);
                    setLinesOption("1 Line");
                    resegmentWithLines(3, maxChars, "1 Line");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-lime-500/20 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-lime-500/20 flex items-center justify-center">
                          <span className="text-lime-400 text-lg font-bold">G</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">NxtGen GenZ</h4>
                          <p className="text-[10px] text-zinc-400">Metallic style</p>
                        </div>
                      </div>
                      {captionStyle.layout === "nxtgen-genz" && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(160,216,62,0.9)]" />
                          <span className="text-[10px] text-lime-400 font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    {/* Live preview thumbnail with metallic shimmer effect */}
                    <div className="bg-black/50 rounded-xl p-3 flex flex-col items-center gap-1">
                      <div className="text-white text-[8px] font-bold flex w-full justify-start">
                        <span>TOP</span>
                      </div>
                      <span
                        className="font-black leading-none"
                        style={{
                          fontSize: '22px',
                          background: 'linear-gradient(90deg, #A0D83E 0%, #A0D83E 20%, #AADC56 40%, #CAEE93 50%, #AADC56 70%, #A0D83E 80%, #A0D83E 100%)',
                          backgroundSize: '200% 100%',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >GENZ</span>
                      <div className="text-white text-[8px] font-bold flex w-full justify-end">
                        <span>NOW</span>
                      </div>
                    </div>
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "nxtgen-genz" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Spotlight Color" value={captionStyle.spotlightColor || "#FFFFFF"} onChange={val => updateStyle("spotlightColor", val)} />
                          <ColorPicker label="Emphasis Color" value={captionStyle.emphasisColor || "#FFFFFF"} onChange={val => updateStyle("emphasisColor", val)} />
                          <ColorPicker label="Shadow Color" value={captionStyle.dropShadowColor || "#FFFFFF"} onChange={val => updateStyle("dropShadowColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* NxtGenVengence Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "nxtgen-vengence" ? "border-purple-500 bg-purple-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    const plan = user?.planType ?? "FREE";
                    if (plan === "FREE") {
                      onOpenUpgradeModal();
                      return;
                    }
                    updateStyle("layout", "nxtgen-vengence");
                    updateStyle("fontFamily", "Inter");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("spotlightColor", "#A0D83E");
                    updateStyle("emphasisColor", "#AADC56");
                    updateStyle("dropShadow", true);
                    updateStyle("dropShadowColor", "#000000");
                    updateStyle("dropShadowOpacity", 70);
                    updateStyle("textAlignment", "center");
                    updateStyle("fontSize", 10);
                    setWordsPerLine(3);
                    setLinesOption("1 Line");
                    resegmentWithLines(3, maxChars, "1 Line");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-purple-500/20 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 text-lg font-bold">V</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">NxtGen Vengence</h4>
                          <p className="text-[10px] text-zinc-400">Cinematic style</p>
                        </div>
                      </div>
                      {captionStyle.layout === "nxtgen-vengence" && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
                          <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    {/* Live preview thumbnail */}
                    <div className="bg-black/50 rounded-xl p-3 flex flex-col items-center gap-1">
                      <div className="text-white text-[8px] font-bold flex w-full justify-start">
                        <span>Top</span>
                      </div>
                      <span
                        className="font-black leading-none uppercase"
                        style={{
                          fontSize: '22px',
                          color: '#FFFFFF',
                          mixBlendMode: 'difference'
                        }}
                      >VENGENCE</span>
                      <div className="text-white text-[8px] font-bold flex w-full justify-end">
                        <span>Now</span>
                      </div>
                    </div>
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "nxtgen-vengence" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* NxtGenAlpha Template - Cursive Metallic Style */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "nxtgen-alpha" ? "border-amber-500 bg-amber-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    const plan = user?.planType ?? "FREE";
                    if (plan === "FREE") {
                      onOpenUpgradeModal();
                      return;
                    }
                    updateStyle("layout", "nxtgen-alpha");
                    updateStyle("fontFamily", "Inter");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("spotlightColor", "#A0D83E");
                    updateStyle("emphasisColor", "#AADC56");
                    updateStyle("dropShadow", true);
                    updateStyle("dropShadowColor", "#000000");
                    updateStyle("dropShadowOpacity", 70);
                    updateStyle("textAlignment", "center");
                    updateStyle("fontSize", 10);
                    setWordsPerLine(3);
                    setLinesOption("1 Line");
                    resegmentWithLines(3, maxChars, "1 Line");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-amber-500/20 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <span className="text-amber-400 text-lg font-bold">A</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">NxtGen Alpha</h4>
                          <p className="text-[10px] text-zinc-400">Cursive Metallic style</p>
                        </div>
                      </div>
                      {captionStyle.layout === "nxtgen-alpha" && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
                          <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    {/* Live preview thumbnail with cursive and metallic shimmer effect */}
                    <div className="bg-black/50 rounded-xl p-3 flex flex-col items-center gap-1 relative overflow-hidden">
                      <style>{`
                        @import url('https://fonts.cdnfonts.com/css/aston-script');
                      `}</style>
                      <div className="text-white text-[12px] flex w-full justify-start" style={{ fontFamily: "'Aston Script', cursive" }}>
                        <span>Alpha</span>
                      </div>
                      <span
                        className="font-black leading-none"
                        style={{
                          fontSize: '22px',
                          background: 'linear-gradient(90deg, #A0D83E 0%, #A0D83E 20%, #AADC56 40%, #CAEE93 50%, #AADC56 70%, #A0D83E 80%, #A0D83E 100%)',
                          backgroundSize: '200% 100%',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >SHIMMER</span>
                      <div className="text-white text-[12px] flex w-full justify-end" style={{ fontFamily: "'Aston Script', cursive" }}>
                        <span>Style</span>
                      </div>
                    </div>
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "nxtgen-alpha" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Spotlight Color" value={captionStyle.spotlightColor || "#FFFFFF"} onChange={val => updateStyle("spotlightColor", val)} />
                          <ColorPicker label="Emphasis Color" value={captionStyle.emphasisColor || "#FFFFFF"} onChange={val => updateStyle("emphasisColor", val)} />
                          <ColorPicker label="Shadow Color" value={captionStyle.dropShadowColor || "#FFFFFF"} onChange={val => updateStyle("dropShadowColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* NxtGenHorror Template - Horror Style */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "nxtgen-horror" ? "border-red-500 bg-red-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    const plan = user?.planType ?? "FREE";
                    if (plan === "FREE") {
                      onOpenUpgradeModal();
                      return;
                    }
                    updateStyle("layout", "nxtgen-horror");
                    updateStyle("fontFamily", "JaggyW01-Regular");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("dropShadow", true);
                    updateStyle("dropShadowColor", "#000000");
                    updateStyle("dropShadowOpacity", 80);
                    updateStyle("textAlignment", "center");
                    updateStyle("fontSize", 10);
                    setWordsPerLine(4);
                    setLinesOption("1 Line");
                    resegmentWithLines(4, maxChars, "1 Line");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-red-500/20 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <span className="text-red-500 text-lg font-bold" style={{ fontFamily: "'JaggyW01-Regular', sans-serif" }}>H</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">NxtGen Horror</h4>
                          <p className="text-[10px] text-zinc-400">Creepy Chalk style</p>
                        </div>
                      </div>
                      {captionStyle.layout === "nxtgen-horror" && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                          <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    {/* Live preview thumbnail */}
                    <div className="bg-black/50 rounded-xl p-3 flex flex-col items-center gap-1 relative overflow-hidden">
                      <div className="text-white text-[12px] flex w-full justify-between" style={{ fontFamily: "'JaggyW01-Regular', sans-serif" }}>
                        <span>Beware</span>
                        <span>Now</span>
                      </div>
                      <span
                        className="font-black leading-none"
                        style={{
                          fontSize: '22px',
                          fontFamily: "'Chalk-y', sans-serif",
                          color: '#ffffff',
                          textShadow: '0 0 10px rgba(255,0,0,0.8)'
                        }}
                      >SCREAM</span>
                      <div className="text-white text-[12px] flex w-full justify-center" style={{ fontFamily: "'JaggyW01-Regular', sans-serif" }}>
                        <span>Loud</span>
                      </div>
                    </div>
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "nxtgen-horror" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Shadow Color" value={captionStyle.dropShadowColor || "#FFFFFF"} onChange={val => updateStyle("dropShadowColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            <div className="space-y-4 mt-8">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Standard Templates</span>
              <div className="grid grid-cols-1 gap-4">
                {/* Modern Caption Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "modern" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "modern");
                    updateStyle("emphasisWords", true);
                    updateStyle("emphasisGlow", true);
                    updateStyle("emphasisColor", "#4ADE80");
                    updateStyle("emphasisGlowColor", "#4ADE80");
                    updateStyle("emphasisGlowIntensity", 50);
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("fontSize", 32);
                    updateStyle("textAlignment", "center");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-emerald-500/20 to-transparent rounded-bl-full"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 text-lg font-bold">M</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Modern Caption</h4>
                        <p className="text-[10px] text-zinc-400">Emphasized words with glow</p>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-3 mb-2">
                      <div className="flex flex-wrap gap-1 items-center justify-center">
                        <span className="text-white text-xs">Create</span>
                        <span className="text-emerald-400 text-xs font-bold" style={{ textShadow: "0 0 10px #4ADE80" }}>amazing</span>
                        <span className="text-white text-xs">content</span>
                        <span className="text-emerald-400 text-xs font-bold" style={{ textShadow: "0 0 10px #4ADE80" }}>today</span>
                      </div>
                    </div>

                    {captionStyle.layout === "modern" && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                        <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                      </div>
                    )}
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "modern" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-4 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Emphasis Color" value={captionStyle.emphasisColor || "#FFFFFF"} onChange={val => updateStyle("emphasisColor", val)} />
                          <ColorPicker label="Glow Color" value={captionStyle.emphasisGlowColor || "#FFFFFF"} onChange={val => updateStyle("emphasisGlowColor", val)} />
                          
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs font-medium text-zinc-400">Emphasize Words</span>
                            <button
                              onClick={() => updateStyle("emphasisWords", !captionStyle.emphasisWords)}
                              className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${captionStyle.emphasisWords ? "bg-emerald-500" : "bg-white/10"
                                }`}
                            >
                              <motion.div
                                animate={{ x: captionStyle.emphasisWords ? 24 : 4 }}
                                className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-md"
                              />
                            </button>
                          </div>

                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs font-medium text-zinc-400">Glow Effect</span>
                            <button
                              onClick={() => updateStyle("emphasisGlow", !captionStyle.emphasisGlow)}
                              className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${captionStyle.emphasisGlow ? "bg-emerald-500" : "bg-white/10"
                                }`}
                            >
                              <motion.div
                                animate={{ x: captionStyle.emphasisGlow ? 24 : 4 }}
                                className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-md"
                              />
                            </button>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <span className="text-xs font-medium text-zinc-400">Glow Intensity</span>
                            <div className="flex gap-4 items-center">
                              <div className="flex-1 relative h-6 flex items-center">
                                <div className="absolute inset-0 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                    style={{ width: `${(captionStyle.emphasisGlowIntensity / 100) * 100}%` }}
                                  ></div>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={captionStyle.emphasisGlowIntensity || 0}
                                  onChange={(e) => updateStyle("emphasisGlowIntensity", Number(e.target.value))}
                                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={captionStyle.emphasisGlowIntensity || 0}
                                  onChange={(e) => updateStyle("emphasisGlowIntensity", Number(e.target.value))}
                                  className="w-12 bg-white/5 border border-white/10 rounded-lg py-1 text-center text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Holo Cyberpunk Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "holo" ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "holo");
                    updateStyle("fontFamily", "Space Grotesk");
                    updateStyle("fontWeight", "700");
                    updateStyle("primaryColor", "#00FF41");
                    updateStyle("positionX", 50);
                    updateStyle("positionY", 80);
                    updateStyle("dropShadow", false);
                    updateStyle("fontSize", 24);
                    updateStyle("textAlignment", "center");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-green-500/20 to-transparent rounded-bl-full"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <span className="text-[#00FF41] text-lg font-bold">H</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Holo Cyberpunk</h4>
                        <p className="text-[10px] text-zinc-400">Terminal HUD style</p>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-3 mb-2 border border-[#00FF41]/30">
                      <div className="flex flex-wrap gap-1 items-center justify-start">
                        <span className="text-[#00FF41] text-xs font-mono" style={{ textShadow: "0 0 5px #00FF41" }}>System.</span>
                        <span className="text-[#00FF41] text-xs font-mono" style={{ textShadow: "-1px 0 red, 1px 0 blue" }}>glitch()</span>
                      </div>
                    </div>

                    {captionStyle.layout === "holo" && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-[#00FF41] shadow-[0_0_8px_rgba(0,255,65,0.8)]"></div>
                        <span className="text-[10px] text-[#00FF41] font-bold">Active</span>
                      </div>
                    )}
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "holo" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-4 border-t border-white/10 mt-2">
                          <ColorPicker label="Terminal Color" value={captionStyle.primaryColor || "#00FF41"} onChange={val => updateStyle("primaryColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* NxtGenFicticVisual Template - Cinematic Style */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "nxtgen-ficticvisual" ? "border-cyan-500 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "nxtgen-ficticvisual");
                    updateStyle("fontFamily", "Syncopate");
                    updateStyle("fontWeight", "700");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("dropShadow", false);
                    updateStyle("textAlignment", "center");
                    updateStyle("fontSize", 12);
                    setWordsPerLine(2);
                    setLinesOption("1 Line");
                    resegmentWithLines(2, maxChars, "1 Line");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-cyan-500/20 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <span className="text-cyan-400 text-lg font-bold">F</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">Fictic Visual</h4>
                          <p className="text-[10px] text-zinc-400">Cinematic Tracking</p>
                        </div>
                      </div>
                      {captionStyle.layout === "nxtgen-ficticvisual" && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                          <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    {/* Live preview thumbnail */}
                    <div className="bg-black/50 rounded-xl p-3 flex flex-col items-center gap-1 relative overflow-hidden">
                      <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@700&display=swap');
                      `}</style>
                      <span
                        className="font-bold leading-none uppercase tracking-widest text-center"
                        style={{
                          fontFamily: "'Syncopate', sans-serif",
                          fontSize: '11px',
                          color: '#ffffff',
                          filter: 'drop-shadow(0px 0px 8px #00FFFF)'
                        }}
                      >CINEMATIC</span>
                    </div>
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "nxtgen-ficticvisual" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Apple Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "apple" ? "border-gray-300 bg-gray-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "apple");
                    updateStyle("fontFamily", "Inter"); // San Francisco-like
                    updateStyle("fontWeight", "700");
                    updateStyle("primaryColor", "#A1A1AA"); // Dimmed
                    updateStyle("emphasisColor", "#FFFFFF"); // Bright
                    updateStyle("dropShadow", false);
                    updateStyle("fontSize", 34);
                    updateStyle("textAlignment", "center");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-gray-500/20 to-transparent rounded-bl-full"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center">
                        <span className="text-gray-300 text-lg font-bold">A</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Apple Style</h4>
                        <p className="text-[10px] text-zinc-400">Smooth blur in & out</p>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 mb-2">
                      <div className="flex justify-center gap-1">
                        <span className="text-[#A1A1AA] text-[11px] font-bold" style={{ fontFamily: "Inter", filter: "blur(0.5px)" }}>Think</span>
                        <span className="text-white text-[11px] font-bold" style={{ fontFamily: "Inter" }}>different.</span>
                      </div>
                    </div>
                    {captionStyle.layout === "apple" && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-gray-300 shadow-[0_0_8px_rgba(209,213,219,0.8)]"></div>
                        <span className="text-[10px] text-gray-300 font-bold">Active</span>
                      </div>
                    )}
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "apple" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Emphasis Color" value={captionStyle.emphasisColor || "#FFFFFF"} onChange={val => updateStyle("emphasisColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bubble Style Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "bubble" ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "bubble");
                    updateStyle("transitionType", "pop");
                    updateStyle("bubblePrimaryColor", "#FFFFFF");
                    updateStyle("bubbleSecondaryColor", "#48A680");
                    updateStyle("bubbleTertiaryColor", "#FFFFFF");
                    updateStyle("fontSize", 32);
                    updateStyle("textAlignment", "center");
                    updateStyle("dropShadow", false);
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-emerald-400/20 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-base font-black">B</div>
                        <div>
                          <h4 className="text-white font-bold text-sm">Bubble Style</h4>
                          <p className="text-[10px] text-zinc-400">Pill highlight on active word</p>
                        </div>
                      </div>
                      {captionStyle.layout === "bubble" && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(72,166,128,0.9)]" />
                          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-black/40 rounded-xl p-3">
                      <div className="flex flex-wrap gap-1 items-center justify-center text-sm font-bold">
                        {["The", "quick", "brown", "fox"].map((w, i) =>
                          i === 2 ? (
                            <span key={w} className="px-2.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: captionStyle.bubbleSecondaryColor, color: captionStyle.bubbleTertiaryColor }}>{w}</span>
                          ) : (
                            <span key={w} style={{ color: captionStyle.bubblePrimaryColor }}>{w}</span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "bubble" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Text Color" value={captionStyle.bubblePrimaryColor || "#FFFFFF"} onChange={val => updateStyle("bubblePrimaryColor", val)} />
                          <ColorPicker label="Bubble BG" value={captionStyle.bubbleSecondaryColor || "#FFFFFF"} onChange={val => updateStyle("bubbleSecondaryColor", val)} />
                          <ColorPicker label="Inner Text" value={captionStyle.bubbleTertiaryColor || "#FFFFFF"} onChange={val => updateStyle("bubbleTertiaryColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* MogrtShimmerStack Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "mogrt-shimmer-stack" ? "border-zinc-300 bg-zinc-300/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "mogrt-shimmer-stack");
                    updateStyle("fontFamily", "Inter");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("dropShadow", true);
                    updateStyle("dropShadowColor", "#000000");
                    updateStyle("dropShadowOpacity", 40);
                    updateStyle("fontSize", 15);
                    updateStyle("textAlignment", "center");
                    updateStyle("transitionType", "none");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-zinc-300/20 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-500/20 flex items-center justify-center">
                          <span
                            className="text-base font-black"
                            style={{
                              background: 'linear-gradient(45deg, #ccc, #fff, #ccc)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}
                          >✦</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">Mogrt Shimmer</h4>
                          <p className="text-[10px] text-zinc-400">Silver metallic focus word stack</p>
                        </div>
                      </div>
                      {captionStyle.layout === "mogrt-shimmer-stack" && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 shadow-[0_0_8px_rgba(212,212,212,0.9)]" />
                          <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    {/* Live preview thumbnail */}
                    <div className="bg-black/50 rounded-xl p-3 flex flex-col items-center gap-0.5">
                      <span className="text-zinc-500 text-[9px] font-semibold uppercase tracking-widest">supporting phrase</span>
                      <span
                        className="font-black tracking-tighter leading-none"
                        style={{
                          fontSize: '26px',
                          background: 'linear-gradient(45deg, #ccc 25%, #fff 50%, #ccc 75%)',
                          backgroundSize: '200% auto',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >MOGRT</span>
                      <span className="text-zinc-500 text-[9px] font-semibold uppercase tracking-widest">supporting phrase</span>
                    </div>
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "mogrt-shimmer-stack" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Shadow Color" value={captionStyle.dropShadowColor || "#FFFFFF"} onChange={val => updateStyle("dropShadowColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Iman Gadzhi Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "gadzhi" ? "border-neutral-500 bg-neutral-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "gadzhi");
                    updateStyle("fontFamily", "Montserrat");
                    updateStyle("fontWeight", "300"); // Light
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("spotlightColor", "#FFFFFF");
                    updateStyle("dropShadow", false);
                    updateStyle("fontSize", 36);
                    updateStyle("textAlignment", "center");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-neutral-500/20 to-transparent rounded-bl-full"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-500/20 flex items-center justify-center">
                        <span className="text-neutral-400 text-lg font-bold">G</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Gadzhi Luxury</h4>
                        <p className="text-[10px] text-zinc-400">Minimalist, light-to-bold</p>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 mb-2">
                      <div className="text-center text-[11px]">
                        <span className="text-white/60 font-light" style={{ fontFamily: "Montserrat" }}>The secret to </span>
                        <span className="text-white font-bold" style={{ fontFamily: "Montserrat", textShadow: "0 0 10px #ffffff" }}>success</span>
                      </div>
                    </div>
                    {captionStyle.layout === "gadzhi" && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-neutral-400 shadow-[0_0_8px_rgba(163,163,163,0.8)]"></div>
                        <span className="text-[10px] text-neutral-400 font-bold">Active</span>
                      </div>
                    )}
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "gadzhi" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Spotlight Color" value={captionStyle.spotlightColor || "#FFFFFF"} onChange={val => updateStyle("spotlightColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hormozi Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "hormozi" ? "border-yellow-500 bg-yellow-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "hormozi");
                    updateStyle("fontFamily", "Montserrat");
                    updateStyle("fontWeight", "900");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("emphasisColor", "#4ADE80");
                    updateStyle("spotlightColor", "#FDE047");
                    updateStyle("dropShadow", true);
                    updateStyle("dropShadowColor", "#000000");
                    updateStyle("dropShadowOpacity", 100);
                    updateStyle("fontSize", 42);
                    updateStyle("textAlignment", "center");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-yellow-500/20 to-transparent rounded-bl-full"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-yellow-400 text-lg font-bold">H</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Hormozi Bold</h4>
                        <p className="text-[10px] text-zinc-400">High energy, all-caps</p>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 mb-2">
                      <div className="flex flex-wrap gap-1 items-center justify-center text-center">
                        <span className="text-white font-black text-[11px] uppercase" style={{ fontFamily: "Montserrat" }}>MAKE</span>
                        <span className="text-yellow-400 font-black text-[11px] uppercase" style={{ fontFamily: "Montserrat", textShadow: "0 0 10px #FDE047" }}>10K</span>
                        <span className="text-white font-black text-[11px] uppercase" style={{ fontFamily: "Montserrat" }}>A MONTH</span>
                      </div>
                    </div>
                    {captionStyle.layout === "hormozi" && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(253,224,71,0.8)]"></div>
                        <span className="text-[10px] text-yellow-400 font-bold">Active</span>
                      </div>
                    )}
                  </div>
                </button>
                  <AnimatePresence>
                    {captionStyle.layout === "hormozi" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Spotlight Color" value={captionStyle.spotlightColor || "#FFFFFF"} onChange={val => updateStyle("spotlightColor", val)} />
                          <ColorPicker label="Emphasis Color" value={captionStyle.emphasisColor || "#FFFFFF"} onChange={val => updateStyle("emphasisColor", val)} />
                          <ColorPicker label="Shadow Color" value={captionStyle.dropShadowColor || "#FFFFFF"} onChange={val => updateStyle("dropShadowColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ali Abdaal Template */}
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "ali-abdaal" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <button type="button"
                  onClick={() => {
                    updateStyle("layout", "ali-abdaal");
                    updateStyle("fontFamily", "Inter");
                    updateStyle("fontWeight", "400");
                    updateStyle("primaryColor", "#FFFFFF");
                    updateStyle("emphasisColor", "rgba(253, 224, 71, 0.3)");
                    updateStyle("fontSize", 32);
                    updateStyle("dropShadow", false);
                    updateStyle("aliAbdaalPosition", "left");
                  }}
                  className="w-full p-4 text-left relative z-10"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-blue-500/20 to-transparent rounded-bl-full"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400 text-lg font-bold">A</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Ali Abdaal Clean</h4>
                        <p className="text-[10px] text-zinc-400">Editorial, phrase reveals</p>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-start text-left">
                        <span className="text-white text-[11px]" style={{ fontFamily: "Inter" }}>This is a </span>
                        <span className="text-white text-[11px] px-1 mx-1 rounded" style={{ fontFamily: "Inter", backgroundColor: "rgba(253, 224, 71, 0.3)" }}>highly effective</span>
                        <span className="text-white text-[11px]" style={{ fontFamily: "Inter" }}> habit.</span>
                      </div>
                    </div>
                    {captionStyle.layout === "ali-abdaal" && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        <span className="text-[10px] text-blue-400 font-bold">Active</span>
                      </div>
                    )}
                  </div>
                </button>                {/* Classic Template */}
                  <AnimatePresence>
                    {captionStyle.layout === "ali-abdaal" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Emphasis Color" value={captionStyle.emphasisColor || "#FFFFFF"} onChange={val => updateStyle("emphasisColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className={`rounded-2xl border-2 transition-all relative overflow-hidden group ${captionStyle.layout === "center" ? "border-sky-500 bg-sky-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                  <button type="button"
                    onClick={() => {
                      updateStyle("layout", "center");
                      updateStyle("emphasisWords", false);
                      updateStyle("emphasisGlow", false);
                      updateStyle("primaryColor", "#FFFFFF");
                      updateStyle("emphasisColor", "#FFE600");
                      updateStyle("fontSize", 28);
                      updateStyle("textAlignment", "center");
                    }}
                    className="w-full p-4 text-left relative z-10"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-sky-500/20 to-transparent rounded-bl-full"></div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                          <span className="text-sky-400 text-lg font-bold">C</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">Classic Center</h4>
                          <p className="text-[10px] text-zinc-400">Simple centered text</p>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-lg p-3 mb-2">
                        <div className="text-white text-xs text-center">
                          Simple centered caption text
                        </div>
                      </div>

                      {captionStyle.layout === "center" && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                          <span className="text-[10px] text-sky-400 font-bold">Active</span>
                        </div>
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {captionStyle.layout === "center" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
                          <ColorPicker label="Primary Color" value={captionStyle.primaryColor || "#FFFFFF"} onChange={val => updateStyle("primaryColor", val)} />
                          <ColorPicker label="Emphasis Color" value={captionStyle.emphasisColor || "#FFE600"} onChange={val => updateStyle("emphasisColor", val)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
