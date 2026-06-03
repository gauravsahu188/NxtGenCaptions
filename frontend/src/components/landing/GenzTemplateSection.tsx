"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, Crown, Volume2, VolumeX, PlayCircle } from 'lucide-react';
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
    shadowColor: "rgba(168,85,247,0.2)",
    blob1: "bg-pink-500/20",
    blob2: "bg-purple-500/20",
    ambient: "bg-purple-500/10",
    buttonColor: "hover:bg-purple-500/20",
    activeColor: "bg-gradient-to-r from-purple-500 to-pink-500"
  },
  {
    id: "alpha",
    name: "NxtGen Alpha",
    shortName: "Alpha",
    description: "Cursive and metallic elegance. Command attention with a premium aesthetic that elevates your content to elite creator status.",
    video: "/Nxtgen Alpha.mp4",
    gradientText: "from-amber-300 to-orange-500",
    shadowColor: "rgba(245,158,11,0.2)",
    blob1: "bg-amber-500/20",
    blob2: "bg-orange-500/20",
    ambient: "bg-amber-500/10",
    buttonColor: "hover:bg-amber-500/20",
    activeColor: "bg-gradient-to-r from-amber-400 to-orange-500"
  },
  {
    id: "horror",
    name: "NxtGen Horror",
    shortName: "Horror",
    description: "Dark, edgy, and mysterious. Keep your audience on the edge of their seats with creepy, chalk-style typography and intense red shadows.",
    video: "/Nxtgen Horror.mp4",
    gradientText: "from-red-500 to-rose-700",
    shadowColor: "rgba(225,29,72,0.2)",
    blob1: "bg-red-500/20",
    blob2: "bg-rose-500/20",
    ambient: "bg-red-500/10",
    buttonColor: "hover:bg-red-500/20",
    activeColor: "bg-gradient-to-r from-red-600 to-rose-600"
  }
];

export default function GenzTemplateSection() {
  const [isMuted, setIsMuted] = useState(false);
  const [activeId, setActiveId] = useState("genz");
  const containerRef = useRef(null);
  
  const activeTemplate = premiumTemplates.find(t => t.id === activeId) || premiumTemplates[0];

  // Trigger when 30% of the section is visible
  const isInView = useInView(containerRef, { amount: 0.3 });

  return (
    <section ref={containerRef} className="w-full py-32 flex flex-col items-center justify-center overflow-hidden relative z-10 border-t border-(--color-border-default) transition-colors duration-1000">
      
      {/* Background ambient effects specific to this section */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] rounded-full z-0 pointer-events-none transition-colors duration-1000 ${activeTemplate.ambient}`} />

      <div className="max-w-7xl w-full px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left: Text Content */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs font-mono tracking-widest uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Premium Exclusive
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight min-h-[140px] md:min-h-0 flex flex-col justify-end">
            <span>The <span className={`text-transparent bg-clip-text bg-linear-to-r ${activeTemplate.gradientText} transition-all duration-700`}>{activeTemplate.name}</span></span>
            <span>Template</span>
          </h2>
          
          <p className="text-xl text-(--color-fg-muted) leading-relaxed min-h-[110px] md:min-h-[84px] transition-all duration-500">
            {activeTemplate.description}
          </p>

          {/* Template Selection Buttons */}
          <div className="relative inline-block w-fit">
            <div className="flex flex-wrap gap-3 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm relative z-10">
              {premiumTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 relative overflow-hidden ${
                    activeId === t.id 
                      ? `text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02] ${t.activeColor}` 
                      : `bg-transparent text-white/60 hover:text-white ${t.buttonColor}`
                  }`}
                >
                  {activeId === t.id && (
                    <motion.div 
                      layoutId="activePremiumTemplate" 
                      className="absolute inset-0 z-0 bg-white/10" 
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {activeId === t.id ? <PlayCircle className="w-4 h-4" /> : <Crown className="w-4 h-4 opacity-50" />}
                    {t.shortName}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Free-style modern arrow marker */}
            <div className="absolute -right-32 -top-8 text-white/50 flex flex-col items-center pointer-events-none hidden md:flex opacity-80"
              style={{ animation: 'bounce 3s infinite ease-in-out' }}>
              <span className="font-['Caveat',_'Comic_Sans_MS',_cursive] text-[16px] transform rotate-12 ml-8 tracking-wider">Try them!</span>
              <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform -rotate-12 mt-1">
                <path d="M85 20 Q 60 70 20 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M20 60 L 35 45 M 20 60 L 35 75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10">
                <TrendingUp className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-white text-lg font-medium">Proven to increase watch time</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-white text-lg font-medium">Dynamic word-level animations</span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="#pricing" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95">
                <Crown className="w-5 h-5" />
                <span>Upgrade to Editor Plan</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </Link>
              <span className="text-sm text-(--color-fg-subtle)">
                Unlock this and all premium features instantly.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Video Showcase */}
        <div className="flex-1 w-full max-w-md lg:max-w-none relative mx-auto h-[600px] flex items-center justify-center perspective-1000">
          <div 
            className="relative w-full max-w-[320px] aspect-9/16 rounded-[32px] overflow-hidden border border-white/20 bg-black group transition-shadow duration-1000 z-10"
            style={{ boxShadow: `0 20px 100px ${activeTemplate.shadowColor}` }}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={activeTemplate.id}
                initial={{ x: '120%', rotateZ: 90, opacity: 0, scale: 0.6 }}
                animate={{ x: 0, rotateZ: 0, opacity: 1, scale: 1 }}
                exit={{ x: '-120%', rotateZ: -90, opacity: 0, scale: 0.6 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 90, 
                  damping: 18, 
                  mass: 0.8
                }}
                className="absolute inset-0 w-full h-full origin-bottom-right"
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
            
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] pointer-events-none z-10" />
            
            {/* Playful UI elements floating around */}
            <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 z-20 transition-opacity group-hover:opacity-0">
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
          
          {/* Decorative elements */}
          <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full pointer-events-none transition-colors duration-1000 ${activeTemplate.blob1}`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 ${activeTemplate.blob2}`} />
        </div>

      </div>
    </section>
  );
}
