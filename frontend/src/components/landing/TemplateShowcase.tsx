"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutTemplate, Volume2, VolumeX, Sparkles, TrendingUp } from "lucide-react";

const templates = [
  { 
    id: 1, 
    name: "Default Style", 
    style: "Clean & Simple", 
    video: "/Defallt Captions.mp4",
    accentColor: "rgba(56, 189, 248, 0.35)", // Cyan glow
    details: {
      font: "Manrope Regular",
      animation: "Standard Scroll",
      niche: "Tutorials & Vlogs",
      boost: "+18%",
      captionText: "Transcribe audio into text instantly."
    }
  },
  { 
    id: 2, 
    name: "Modern Captions", 
    style: "Sleek Minimalist", 
    video: "/Modern Captions.mp4",
    accentColor: "rgba(99, 102, 241, 0.35)", // Indigo glow
    details: {
      font: "Syne SemiBold",
      animation: "Fade Reveal",
      niche: "Tech Reviews & Business",
      boost: "+32%",
      captionText: "Elegant typography overlays for professionals."
    }
  },
  { 
    id: 3, 
    name: "Harmozi Bold", 
    style: "Bold & Direct", 
    video: "/Harmozi Bold.mp4",
    accentColor: "rgba(245, 158, 11, 0.4)", // Amber glow
    details: {
      font: "Impact / Heavy Sans",
      animation: "Active Highlight Pop",
      niche: "Shorts, Reels, Marketing",
      boost: "+54%",
      captionText: "MAXIMUM ATTENTION WORD BY WORD!"
    }
  },
  { 
    id: 4, 
    name: "Apple Style", 
    style: "Premium Elegance", 
    video: "/Apple Style.mp4",
    accentColor: "rgba(168, 85, 247, 0.35)", // Purple glow
    details: {
      font: "SF Pro Rounded",
      animation: "Smooth Word Slide",
      niche: "Life Hacks & Edutainment",
      boost: "+41%",
      captionText: "Clean, elegant layout styled for storytellers."
    }
  },
  { 
    id: 5, 
    name: "Gadzhi Luxury", 
    style: "High-End Aesthetics", 
    video: "/Gadhzi Luxury.mp4",
    accentColor: "rgba(217, 119, 6, 0.45)", // Gold/Yellow glow
    details: {
      font: "Georgia Italic / Serif",
      animation: "Timed Word Fade",
      niche: "Self-Dev & Finance Narratives",
      boost: "+48%",
      captionText: "High-ticket aesthetic built for premium narratives."
    }
  }
];

export default function TemplateShowcase() {
  const [currentIndex, setCurrentIndex] = useState(2); // Start at Harmozi Bold
  const [isMuted, setIsMuted] = useState(true);

  // Mobile Touch Swipe Handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const currentTemplate = templates[currentIndex];
  const expoOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section id="templates" className="w-full pt-20 pb-28 flex flex-col items-center justify-center overflow-hidden relative z-10 border-t border-white/[0.06]">
      
      {/* Background radial highlight behind active card */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] pointer-events-none -z-10 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle, ${currentTemplate.accentColor} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: expoOut }}
        className="flex flex-col items-center mb-16 space-y-4 px-4 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 text-[11px] font-mono tracking-widest uppercase">
          <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
          PREMIUM DESIGN PATTERNS
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white text-balance">
          Viral Templates
        </h2>
        <p className="text-zinc-400 text-base max-w-xl font-normal leading-relaxed text-pretty">
          Dozens of premium subtitle templates built by top creators, designed to double your retention rates.
        </p>
      </motion.div>

      {/* Main 3D Card Display */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-7xl h-[540px] flex items-center justify-center perspective-2000 select-none"
      >
        {templates.map((template, index) => {
          let offset = index - currentIndex;
          if (offset > 2) offset -= templates.length;
          if (offset < -2) offset += templates.length;

          const isActive = offset === 0;
          const scale = isActive ? 1 : 0.74 - Math.abs(offset) * 0.08;
          const x = offset * 260;
          const zIndex = 10 - Math.abs(offset);
          const opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.35;

          return (
            <motion.div
              key={template.id}
              animate={{
                scale,
                x,
                zIndex,
                opacity,
                rotateY: offset * -18,
                rotateX: isActive ? 0 : 5
              }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              className={`absolute w-[260px] sm:w-[280px] h-[480px] rounded-[34px] overflow-hidden cursor-pointer ${
                isActive 
                  ? 'ring-1 ring-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(56,189,248,0.2)]' 
                  : 'shadow-2xl brightness-50'
              }`}
              onClick={() => setCurrentIndex(index)}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Smartphone Outline Container wrapper */}
              <div className="w-full h-full bg-[#050508] border-[3px] border-[#22222b] rounded-[32px] overflow-hidden relative flex flex-col justify-end">
                
                {/* Dynamic Island Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black z-30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 absolute right-4" />
                </div>

                {/* Metallic screen glare edge */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none z-20" />
                
                {/* Looping video element (rendered for active template) */}
                {isActive && (
                  <video
                    src={template.video}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                )}

                {/* Dark gradient mapping overlay */}
                <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] pointer-events-none z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10 pointer-events-none" />

                {/* Mute toggle button */}
                {isActive && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 transition-colors active:scale-90"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
                
                {/* Details text visible in active preview */}
                <div className="relative z-20 p-5 select-none text-left" style={{ opacity: isActive ? 1 : 0, transform: 'translateZ(20px)' }}>
                  <h3 className="text-lg font-bold text-white tracking-tight">{template.name}</h3>
                  <p className="text-[11px] text-cyan-400 font-mono tracking-wider uppercase mt-0.5">{template.style}</p>
                </div>

              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Switcher & Style Spec Sheet */}
      <div className="w-full max-w-4xl px-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 mt-6 select-none">
        
        {/* Carousel controls bar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="bg-[#07070b]/80 backdrop-blur-xl border border-white/10 rounded-2xl py-3 px-6 flex items-center justify-between shadow-2xl grow md:max-w-md"
        >
          <button 
            onClick={handlePrev} 
            className="p-2.5 hover:bg-white/5 border border-white/0 hover:border-white/10 rounded-full transition-all text-zinc-400 hover:text-white active:scale-90" 
            aria-label="Previous Template"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="font-bold text-white text-lg tracking-tight">{currentTemplate.name}</span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-0.5">{currentTemplate.style}</span>
          </div>

          <button 
            onClick={handleNext} 
            className="p-2.5 hover:bg-white/5 border border-white/0 hover:border-white/10 rounded-full transition-all text-zinc-400 hover:text-white active:scale-90" 
            aria-label="Next Template"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Spec Sheet details grid display */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="rounded-2xl border border-white/10 bg-[#07070b]/80 backdrop-blur-xl p-5 flex-1 flex flex-col justify-between gap-4 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-2 text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
            <span>Style Specifications</span>
            <span className="flex items-center gap-1 text-cyan-400 font-semibold"><Sparkles className="w-3 h-3" /> Preset Info</span>
          </div>

          {/* Grid info stats */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-left">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">FONT FAMILY</span>
              <span className="text-xs text-white font-medium">{currentTemplate.details.font}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">TRANSITION STYLE</span>
              <span className="text-xs text-white font-medium">{currentTemplate.details.animation}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">RECOMMENDED FOR</span>
              <span className="text-xs text-white font-medium">{currentTemplate.details.niche}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Retention Boost
              </span>
              <span className="text-sm text-emerald-400 font-extrabold">{currentTemplate.details.boost}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
