"use client";

import React, { useState, useRef } from 'react';
import { Sparkles, TrendingUp, Zap, Crown, Volume2, VolumeX, PlayCircle, Flame, Ghost, Activity, Wifi, Battery, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useInView, motion, AnimatePresence } from 'framer-motion';

const premiumTemplates = [
  {
    id: "genz",
    name: "Modern GenZ",
    shortName: "GenZ",
    description: "Engineered for maximum retention. Bring a hyper-engaging, eye-catching aesthetic to your videos that stops the scroll and drives exponentially more views.",
    video: "/nxtgencapvision.mp4",
    gradientText: "from-purple-400 to-pink-600",
    shadowColor: "rgba(168,85,247,0.25)",
    blob1: "bg-pink-500/15",
    blob2: "bg-purple-500/15",
    ambient: "bg-purple-500/10",
    buttonColor: "hover:bg-purple-500/20",
    activeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
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
    shadowColor: "rgba(245,158,11,0.25)",
    blob1: "bg-amber-500/15",
    blob2: "bg-orange-500/15",
    ambient: "bg-amber-500/10",
    buttonColor: "hover:bg-amber-500/20",
    activeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
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
    gradientText: "from-red-500 to-rose-700",
    shadowColor: "rgba(225,29,72,0.25)",
    blob1: "bg-red-500/15",
    blob2: "bg-rose-500/15",
    ambient: "bg-red-500/10",
    buttonColor: "hover:bg-red-500/20",
    activeColor: "bg-gradient-to-r from-red-600 to-rose-600",
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
    gradientText: "from-indigo-400 to-purple-600",
    shadowColor: "rgba(99,102,241,0.25)",
    blob1: "bg-indigo-500/15",
    blob2: "bg-purple-500/15",
    ambient: "bg-indigo-500/10",
    buttonColor: "hover:bg-indigo-500/20",
    activeColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
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

  // Trigger when 30% of the section is visible to loop videos
  const isInView = useInView(containerRef, { amount: 0.3 });

  // Access matching active icon
  const ActiveIcon = activeTemplate.icon;

  return (
    <section ref={containerRef} className="w-full py-32 flex flex-col items-center justify-center overflow-hidden relative z-10 border-t border-(--color-border-default) transition-all duration-1000">

      {/* Grid Floor overlay with color adaptation */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:4rem_4rem] z-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] transition-opacity duration-1000"
      />
      
      {/* Background ambient lighting adaptive color blob */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] blur-[150px] rounded-full z-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${activeTemplate.ambient.replace('bg-', 'rgba(').replace('/10', ',0.08)')} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      <div className="max-w-7xl w-full px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">

        {/* Left: Text Content & Controls */}
        <div className="flex-1 space-y-8 text-left select-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-white/80 text-xs font-mono tracking-widest uppercase backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
            <ActiveIcon className="w-3.5 h-3.5 text-accent-bright animate-pulse" />
            Premium Exclusive
          </div>

          <h2 className="text-4xl md:text-6xl font-bold font-display text-white tracking-tight leading-none h-[120px] md:h-auto flex flex-col justify-end">
            <span>The <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeTemplate.gradientText} transition-all duration-700`}>{activeTemplate.name}</span></span>
            <span className="mt-1.5 text-white/90">Template Preset</span>
          </h2>

          <p className="text-base sm:text-lg text-(--color-fg-muted) leading-relaxed min-h-[90px] md:min-h-[72px] transition-all duration-500 font-sans">
            {activeTemplate.description}
          </p>

          {/* Futuristic Switcher Dock */}
          <div className="relative inline-block w-full sm:w-auto">
            <div className="flex flex-wrap gap-2.5 p-2 bg-[#050508]/80 border border-white/5 rounded-2xl backdrop-blur-xl relative z-10 shadow-2xl">
              {premiumTemplates.map((t) => {
                const ItemIcon = t.icon;
                const isSelected = activeId === t.id;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={`px-5 py-3 rounded-xl font-display text-sm font-bold transition-all duration-300 flex items-center gap-2.5 relative overflow-hidden flex-1 sm:flex-initial justify-center cursor-pointer ${
                      isSelected
                        ? `text-white shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-[1.02] ${t.activeColor}`
                        : `bg-transparent text-white/50 hover:text-white ${t.buttonColor}`
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activePremiumTemplate"
                        className="absolute inset-0 z-0 bg-white/5"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <ItemIcon className={`w-4 h-4 ${isSelected ? "text-white" : "opacity-50"}`} />
                      {t.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cave-style arrow pointing to selector */}
            <div 
              className="absolute -right-32 -top-10 text-white/30 flex-col items-center pointer-events-none hidden md:flex opacity-70"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              <span className="font-['Caveat','Comic_Sans_MS',cursive] text-[15px] transform rotate-12 ml-8 tracking-wider">Tap selector</span>
              <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform -rotate-12 mt-1">
                <path d="M85 20 Q 60 70 20 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M20 60 L 35 45 M 20 60 L 35 75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>

          {/* Preset Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/5">
                <TrendingUp className="w-4.5 h-4.5 text-pink-400" />
              </div>
              <span className="text-white font-medium text-sm">Proven to boost retention</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/5">
                <Activity className="w-4.5 h-4.5 text-yellow-400" />
              </div>
              <span className="text-white font-medium text-sm">Adaptive alignment physics</span>
            </div>
          </div>

          {/* Pricing Action */}
          <div className="pt-6 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="#pricing" className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 px-6 bg-white text-black font-semibold rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(255,255,255,0.15)] text-sm">
                <Crown className="w-4 h-4" />
                <span>Upgrade to Premium Editor</span>
              </Link>
              <span className="text-xs text-(--color-fg-subtle) font-sans">
                Unlock all premium templates instantly.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Video Showcase */}
        <div className="flex-1 w-full max-w-md lg:max-w-none relative mx-auto h-[600px] flex items-center justify-center perspective-1000">
          
          {/* Smartphone Bezel Outline Wrapper */}
          <div
            className="relative w-full max-w-[280px] aspect-9/16 rounded-[34px] border-4 border-[#1c1c24] bg-black group transition-shadow duration-1000 z-10 shadow-2xl ring-4 ring-[#16161c] overflow-hidden"
            style={{ boxShadow: `0 25px 80px ${activeTemplate.shadowColor}` }}
          >
            {/* Dynamic Island Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black z-30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 absolute right-4" />
            </div>

            {/* Metallic screen glare edge */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none z-20" />

            {/* Scrolling Reel Animation Container */}
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[26px]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeTemplate.id}
                  initial={{ y: '100%', opacity: 1 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 20,
                    mass: 0.9
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

            {/* Playful UI elements floating around */}
            <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 z-25 transition-opacity group-hover:opacity-0">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-white">Viral Potential</span>
            </div>

            {/* Mute toggle button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-6 right-6 z-30 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Slide Down Arrow Button (to cycle templates like a reel) */}
          <button
            onClick={() => {
              const currentIndex = premiumTemplates.findIndex(t => t.id === activeId);
              const nextIndex = (currentIndex + 1) % premiumTemplates.length;
              setActiveId(premiumTemplates[nextIndex].id);
            }}
            className="absolute right-[-24px] sm:right-6 lg:right-10 z-30 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white rounded-full transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-95 group/arrow animate-bounce"
            style={{ animationDuration: '3s' }}
            aria-label="Next Template Reel"
          >
            <ChevronDown className="w-5 h-5 text-white/75 group-hover/arrow:text-white transition-colors" />
          </button>

          {/* Decorative elements */}
          <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full pointer-events-none transition-colors duration-1000 ${activeTemplate.blob1}`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 ${activeTemplate.blob2}`} />
        </div>

      </div>
    </section>
  );
}
