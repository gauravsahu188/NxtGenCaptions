"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LayoutTemplate, Volume2, VolumeX } from 'lucide-react';

const templates = [
  { id: 1, name: "Default Style", style: "Clean & Simple", video: "/Defallt Captions.mp4" },
  { id: 2, name: "Modern Captions", style: "Sleek Minimalist", video: "/Modern Captions.mp4" },
  { id: 3, name: "Harmozi Bold", style: "Bold & Direct", video: "/Harmozi Bold.mp4" },
  { id: 4, name: "Apple Style", style: "Premium Elegance", video: "/Apple Style.mp4" },
  { id: 5, name: "Gadzhi Luxury", style: "High-End Aesthetics", video: "/Gadhzi Luxury.mp4" }
];

export default function TemplateShowcase() {
  const [currentIndex, setCurrentIndex] = useState(2); // Start at middle (Harmozi Bold)
  const [isMuted, setIsMuted] = useState(true);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  return (
    <section id="templates" className="w-full py-32 flex flex-col items-center justify-center overflow-hidden relative z-10 border-t border-(--color-border-default)">
      
      <div className="flex flex-col items-center mb-16 space-y-4 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--color-border-default) bg-(--color-surface) text-(--color-fg-muted) text-xs font-mono tracking-widest">
          <LayoutTemplate className="w-3.5 h-3.5" />
          DESIGN LIBRARY
        </div>
        <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
          Engineered <span className="text-gradient-accent">Templates</span>
        </h2>
        <p className="text-(--color-fg-muted) text-lg max-w-xl">
          Dozens of fully customizable, high-converting templates built by top creators, ready to use in a single click.
        </p>
      </div>

      <div className="relative w-full max-w-7xl h-[600px] flex items-center justify-center">
        {templates.map((template, index) => {
          // Calculate relative position (-2, -1, 0, 1, 2)
          let offset = index - currentIndex;
          if (offset > 2) offset -= templates.length;
          if (offset < -2) offset += templates.length;

          const isActive = offset === 0;
          const scale = isActive ? 1 : 0.75 - Math.abs(offset) * 0.1;
          const x = offset * 250;
          const zIndex = 10 - Math.abs(offset);
          const opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.25;

          return (
            <motion.div
              key={template.id}
              animate={{
                scale,
                x,
                zIndex,
                opacity,
                rotateY: offset * -10 // subtle 3d effect
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={`absolute w-[300px] h-[500px] rounded-[24px] overflow-hidden cursor-pointer glass-panel ${isActive ? 'ring-1 ring-accent/50 shadow-[0_0_80px_rgba(94,106,210,0.15)]' : ''}`}
              onClick={() => setCurrentIndex(index)}
              style={{ perspective: 1000 }}
            >
              <div className="w-full h-full bg-black flex flex-col justify-end relative">
                {/* Video Background */}
                <video
                  src={template.video}
                  autoPlay
                  loop
                  muted={isActive ? isMuted : true}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
                
                {/* Subtle vignette inner shadow */}
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none z-10" />
                
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />

                {/* Mute/Unmute toggle for active card */}
                {isActive && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-12 bg-white/3 backdrop-blur-xl border border-(--color-border-default) rounded-full py-3 px-6 flex items-center gap-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <button onClick={handlePrev} className="p-2 hover:bg-white/8 rounded-full transition-colors text-(--color-fg-muted) hover:text-(--color-foreground)">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center min-w-[140px]">
          <span className="font-semibold text-white text-lg tracking-tight">{templates[currentIndex].name}</span>
          <span className="text-xs text-(--color-fg-subtle) font-medium">{templates[currentIndex].style}</span>
        </div>
 
        <button onClick={handleNext} className="p-2 hover:bg-white/8 rounded-full transition-colors text-(--color-fg-muted) hover:text-(--color-foreground)">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
