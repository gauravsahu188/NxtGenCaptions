"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, Crown, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useInView } from 'framer-motion';

export default function GenzTemplateSection() {
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Trigger when 30% of the section is visible
  const isInView = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isInView) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    } else {
      videoRef.current.pause();
    }
  }, [isInView]);

  return (
    <section ref={containerRef} className="w-full py-32 flex flex-col items-center justify-center overflow-hidden relative z-10 border-t border-(--color-border-default)">
      
      {/* Background ambient effects specific to this section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

      <div className="max-w-7xl w-full px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left: Text Content */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Premium Exclusive
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
            The <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-600">Modern GenZ</span> Template
          </h2>
          
          <p className="text-xl text-(--color-fg-muted) leading-relaxed">
            Engineered for maximum retention. Bring a hyper-engaging, eye-catching aesthetic to your videos that stops the scroll and drives <strong className="text-white">exponentially more views</strong>.
          </p>
          
          <div className="space-y-4">
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
        <div className="flex-1 w-full max-w-md lg:max-w-none relative mx-auto">
          <div className="relative rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(168,85,247,0.2)] aspect-9/16 bg-black max-w-[320px] mx-auto group">
            <video
              ref={videoRef}
              src="/nxtgencapvision.mp4"
              loop
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] pointer-events-none" />
            
            {/* Playful UI elements floating around */}
            <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 z-10 transition-opacity group-hover:opacity-0">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-white">Viral Potential</span>
            </div>

            {/* Mute toggle button */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-6 right-6 z-20 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-4 w-32 h-32 bg-pink-500/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-4 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
        </div>

      </div>
    </section>
  );
}
