"use client";

import React, { useState, useRef } from "react";
import { Sparkles, TrendingUp, Crown, Volume2, VolumeX, Flame, Ghost, Activity, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useInView, motion, AnimatePresence } from "framer-motion";

const premiumTemplates = [
  {
    id: "genz",
    name: "Modern GenZ",
    shortName: "GenZ",
    description: "Engineered for maximum retention. Bring a hyper-engaging, eye-catching aesthetic to your videos that stops the scroll and drives exponentially more views.",
    video: "/nxtgencapvision.mp4",
    gradientText: "from-purple-400 to-pink-500",
    shadowColor: "rgba(168,85,247,0.3)",
    ambient: "rgba(168,85,247,0.12)",
    activeColor: "bg-purple-600/30 border-purple-500/50 text-purple-200",
    accentHex: "#A855F7",
    icon: Sparkles,
    metrics: { boost: "+54%", label: "Retention" }
  },
  {
    id: "alpha",
    name: "NxtGen Alpha",
    shortName: "Alpha",
    description: "Cursive and metallic elegance. Command attention with a premium aesthetic that elevates your content to elite creator status.",
    video: "/Nxtgen Alpha.mp4",
    gradientText: "from-amber-300 to-orange-500",
    shadowColor: "rgba(245,158,11,0.3)",
    ambient: "rgba(245,158,11,0.12)",
    activeColor: "bg-amber-600/30 border-amber-500/50 text-amber-200",
    accentHex: "#F59E0B",
    icon: Crown,
    metrics: { boost: "+42%", label: "Niche Premium" }
  },
  {
    id: "horror",
    name: "NxtGen Horror",
    shortName: "Horror",
    description: "Dark, edgy, and mysterious. Keep your audience on the edge of their seats with creepy, chalk-style typography and intense red shadows.",
    video: "/Nxtgen Horror.mp4",
    gradientText: "from-red-500 to-rose-600",
    shadowColor: "rgba(225,29,72,0.3)",
    ambient: "rgba(225,29,72,0.12)",
    activeColor: "bg-rose-600/30 border-rose-500/50 text-rose-200",
    accentHex: "#E11D48",
    icon: Ghost,
    metrics: { boost: "+38%", label: "Hook Rate" }
  },
  {
    id: "vengence",
    name: "NxtGen Vengeance",
    shortName: "Vengeance",
    description: "Fierce, aggressive, and striking. Dominate the feed with jagged typography and intense, high-contrast glitch effects.",
    video: "/Nxtgen Vengence.mp4",
    gradientText: "from-indigo-400 to-cyan-400",
    shadowColor: "rgba(99,102,241,0.3)",
    ambient: "rgba(99,102,241,0.12)",
    activeColor: "bg-indigo-600/30 border-indigo-500/50 text-indigo-200",
    accentHex: "#6366F1",
    icon: Flame,
    metrics: { boost: "+49%", label: "Engagement" }
  }
];

export default function GenzTemplateSection() {
  const [isMuted, setIsMuted] = useState(true);
  const [activeId, setActiveId] = useState("genz");
  const containerRef = useRef(null);

  const activeTemplate = premiumTemplates.find(t => t.id === activeId) || premiumTemplates[0];
  const isInView = useInView(containerRef, { amount: 0.3 });

  return (
    <section 
      ref={containerRef} 
      className="w-full py-28 md:py-36 flex flex-col items-center justify-center overflow-hidden relative z-10 border-t border-white/[0.06]"
    >
      {/* Background ambient lighting adaptive color blob */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] blur-[180px] rounded-full z-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${activeTemplate.ambient} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      <div className="max-w-6xl w-full px-6 flex flex-col lg:flex-row items-center gap-14 lg:gap-20 relative z-10">

        {/* Left: Text Content & Controls */}
        <div className="flex-1 space-y-7 text-left select-none">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] leading-[1.12] text-white text-balance">
            <span>The <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeTemplate.gradientText} transition-all duration-700`}>{activeTemplate.name}</span></span>
            <span className="block mt-1 text-white/90">Template Preset</span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed min-h-[75px] font-normal text-pretty">
            {activeTemplate.description}
          </p>

          {/* Luxury Switcher Dock */}
          <div className="relative inline-block w-full sm:w-auto">
            <div className="flex flex-wrap gap-2 p-1.5 bg-[#09090f]/90 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl">
              {premiumTemplates.map((t) => {
                const ItemIcon = t.icon;
                const isSelected = activeId === t.id;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={`px-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 relative cursor-pointer border ${
                      isSelected
                        ? `${t.activeColor} shadow-[0_0_20px_rgba(255,255,255,0.06)] scale-[1.02]`
                        : "bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <ItemIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "opacity-50"}`} />
                    <span>{t.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-zinc-200 font-medium text-xs sm:text-sm">Proven to boost retention</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-zinc-200 font-medium text-xs sm:text-sm">Adaptive alignment physics</span>
            </div>
          </div>

          {/* Pricing Action */}
          <div className="pt-4 border-t border-white/[0.07]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link 
                href="#pricing" 
                className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 px-7 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:bg-neutral-100 active:scale-[0.98] shadow-[0_4px_25px_rgba(255,255,255,0.18)] text-sm"
              >
                <Crown className="w-4 h-4 text-black" />
                <span>Upgrade to Premium Editor</span>
              </Link>
              <span className="text-xs text-zinc-400 font-sans">
                Unlock all premium templates instantly.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Video Showcase in Titanium Frame */}
        <div className="flex-1 w-full max-w-sm lg:max-w-none relative mx-auto h-[560px] flex items-center justify-center perspective-1000">
          
          {/* Smartphone Bezel Outline Wrapper */}
          <div
            className="relative w-full max-w-[275px] aspect-9/16 rounded-[36px] border-[3px] border-[#22222a] bg-black group transition-all duration-700 z-10 shadow-2xl overflow-hidden"
            style={{ boxShadow: `0 25px 80px ${activeTemplate.shadowColor}` }}
          >
            {/* Dynamic Island Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black z-30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 absolute right-4" />
            </div>

            {/* Metallic screen glare edge */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none z-20" />

            {/* Scrolling Reel Animation Container */}
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[30px]">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeTemplate.id}
                  initial={{ y: "100%", opacity: 0.8 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 22,
                  }}
                  className="absolute inset-0 w-full h-full"
                >
                  {isInView && (
                    <video
                      src={activeTemplate.video}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.7)] pointer-events-none z-15" />

            {/* Badge */}
            <div className="absolute top-6 right-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 z-25">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-wider text-white uppercase">Viral Potential</span>
            </div>

            {/* Mute toggle button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-5 right-5 z-30 p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Next Template Reel button */}
          <button
            onClick={() => {
              const currentIndex = premiumTemplates.findIndex(t => t.id === activeId);
              const nextIndex = (currentIndex + 1) % premiumTemplates.length;
              setActiveId(premiumTemplates[nextIndex].id);
            }}
            className="absolute right-0 sm:right-4 lg:right-6 z-30 p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white rounded-full transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)] active:scale-95 group/arrow"
            aria-label="Next Template Reel"
          >
            <ChevronDown className="w-5 h-5 text-zinc-300 group-hover/arrow:text-white transition-colors" />
          </button>
        </div>

      </div>
    </section>
  );
}
