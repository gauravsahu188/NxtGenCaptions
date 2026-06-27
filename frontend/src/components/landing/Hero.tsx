"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Custom SVG Icons with Micro-Animations for Steps
const UploadIcon = ({ active, completed }: { active: boolean; completed: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    {completed ? (
      <motion.path 
        d="M20 6 9 17l-5-5" 
        className="text-accent"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    ) : (
      <>
        {/* Cloud outline */}
        <path 
          d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.04-1.24.12A6 6 0 0 0 3 11.5 5.5 5.5 0 0 0 8 17" 
          className={`${active ? 'text-accent' : 'text-white/40'} transition-colors duration-300`} 
        />
        {/* Upload arrow with keyframes */}
        <motion.path 
          d="M12 11v8M9 14l3-3 3 3" 
          className="text-accent"
          animate={active ? {
            y: [2, -2, 2],
            opacity: [0.6, 1, 0.6]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </>
    )}
  </svg>
);

const EditIcon = ({ active, completed }: { active: boolean; completed: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    {completed ? (
      <motion.path 
        d="M20 6 9 17l-5-5" 
        className="text-accent"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    ) : (
      <>
        {/* Magic Wand Handle */}
        <path d="m15 4-2 2M19 8l-2 2M20.5 4.5l-2.5 2.5" className="text-white/30" />
        <path d="M17.8 2.2a.6.6 0 0 1 .4 0l3.6 3.6a.6.6 0 0 1 0 .4l-12 12a.6.6 0 0 1-.2.1l-4.2 1.4a.3.3 0 0 1-.4-.4l1.4-4.2a.6.6 0 0 1 .1-.2Z" className={active ? 'text-accent' : 'text-white/40'} />
        {/* Sparkles */}
        <motion.path 
          d="M6 3h.01M3 6h.01M4 3h.01" 
          className="text-accent stroke-[3px]"
          animate={active ? {
            scale: [0.8, 1.3, 0.8],
            opacity: [0.5, 1, 0.5]
          } : { opacity: 0 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </>
    )}
  </svg>
);

const RenderIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    {/* Gear rotation */}
    <motion.path 
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" 
      className={active ? 'text-accent' : 'text-white/40'}
      animate={active ? {
        rotate: 360
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <circle cx="12" cy="12" r="3" className="text-white/30" />
  </svg>
);

export default function Hero() {
  // Parallax scroll effects for background/hero container
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 500], [1, 0.98]);
  const y = useTransform(scrollY, [0, 500], [0, 30]);

  // Entrance spring curves
  const expoOut = [0.16, 1, 0.3, 1] as const;

  // Single deterministic time state to prevent React concurrent state race conditions
  const [time, setTime] = useState(0);
  const stepDuration = 4000; // 4 seconds per step
  const stepsCount = 3;

  useEffect(() => {
    const intervalTime = 40; // update every 40ms
    const timer = setInterval(() => {
      setTime((prev) => prev + intervalTime);
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const activeStep = Math.floor((time / stepDuration) % stepsCount);
  const progress = ((time % stepDuration) / stepDuration) * 100;

  // Helper classes for active/completed/upcoming steps
  const getNodeClass = (nodeIndex: number) => {
    if (activeStep === nodeIndex) {
      return 'bg-accent/15 border-accent text-accent shadow-[0_0_15px_rgba(94,106,210,0.3)]';
    } else if (activeStep > nodeIndex) {
      return 'bg-accent/10 border-accent/50 text-accent shadow-[0_0_10px_rgba(94,106,210,0.15)]';
    } else {
      return 'bg-white/[0.02] border-white/10 text-white/30';
    }
  };

  const getLabelClass = (nodeIndex: number) => {
    if (activeStep === nodeIndex) {
      return 'text-white font-bold';
    } else if (activeStep > nodeIndex) {
      return 'text-white/70 font-semibold';
    } else {
      return 'text-white/35';
    }
  };

  return (
    <section className="relative w-full min-h-[92vh] lg:min-h-[98vh] flex items-center justify-center pt-24 pb-8 overflow-hidden">
      
      {/* Editorial Grid Base inside Hero section */}
      <div className="absolute inset-x-0 top-0 h-[800px] bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-size-[4rem_4rem] z-0 pointer-events-none mask-[radial-gradient(ellipse_at_center,black_75%,transparent_100%)]" />
      
      <motion.div
        style={{ scale, y }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-center lg:text-left"
      >
        
        {/* Left Column: Title, Subtitle, CTA and Stats */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start space-y-5 lg:space-y-6">
          

          {/* Asymmetric Typography Header */}
          <div className="overflow-visible pb-1 max-w-xl">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: expoOut, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-[4.2rem] font-display font-extrabold tracking-[-0.04em] leading-[1.05] text-white"
            >
              Create <span className="text-gradient-accent">Captions</span> That<br />
              <span className="text-gradient relative inline-block">
                Hold Attention.
                <span className="absolute bottom-1 left-0 w-full h-[6px] bg-accent/20 rounded-full blur-[2px] -z-10" />
              </span>
            </motion.h1>
          </div>

          {/* Cinematic Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: expoOut, delay: 0.3 }}
            className="text-sm sm:text-base text-(--color-fg-muted) max-w-2xl font-normal leading-relaxed"
          >
            Auto-generate pixel-perfect subtitles in seconds. Engage viewers with templates inspired by the world&apos;s leading storytellers.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: expoOut, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full"
          >
            <Link href="/sign-in" className="w-full sm:w-auto">
              <button id="btn-hero-primary" className="group relative flex h-11 w-full sm:w-auto items-center justify-center gap-4 rounded-xl bg-white px-6 font-display text-sm font-semibold text-black transition-all hover:bg-white/95 active:scale-[0.98] shadow-[0_4px_30px_rgba(255,255,255,0.15)] overflow-hidden">
                {/* Shimmer light effect */}
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] bg-size-[250%_250%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none" />
                
                <span>Generate Captions Free</span>
                <ArrowRight className="h-4 w-4 text-black group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <a href="#templates" className="w-full sm:w-auto">
              <button className="group flex h-11 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 px-6 font-sans text-sm font-medium text-white transition-all active:scale-[0.98] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
                Explore Templates
              </button>
            </a>
          </motion.div>

          {/* Dynamic Social Trust Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease: expoOut }}
            className="flex flex-col items-center lg:items-start gap-2 pt-4 border-t border-white/5 w-full max-w-sm select-none"
          >
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Trusted by 50,000+ Creators</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
              ))}
              <span className="text-white font-semibold ml-1.5 text-xs font-display">4.9/5 Average Rating</span>
            </div>
          </motion.div>

        </div>

        {/* Right Column: Floating Editor Canvas Mockup + Progress Bar */}
        <div className="lg:col-span-7 w-full flex flex-col justify-center items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: expoOut, delay: 0.4 }}
            className="w-full max-w-xl lg:max-w-2xl px-1"
          >
            <motion.div
              animate={{
                y: [0, -12, 0],
              }}
              transition={{
                duration: 6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              className="w-full glass-panel border border-white/10 bg-[#050508]/60 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(94,106,210,0.08)] p-2 relative group/card"
            >
              {/* Diagonal Shimmer Sweep Reflection */}
               <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.04)_40%,rgba(255,255,255,0.08)_45%,rgba(255,255,255,0.04)_50%,transparent_60%)] bg-size-[200%_100%] bg-left transition-all duration-1000 group-hover/card:bg-right opacity-0 group-hover/card:opacity-100 mix-blend-overlay" />

              {/* Workspace Screenshot Asset */}
              <Image 
                src="/nxtgen-workspace.png" 
                alt="NxtGen Captions AI Workspace Screenshot" 
                width={1024}
                height={581}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="w-full h-auto rounded-xl border border-white/5 select-none pointer-events-none relative z-10 shadow-[0_10px_25px_rgba(0,0,0,0.4)]"
              />
            </motion.div>
          </motion.div>

          {/* Workflow Stepper Progress Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: expoOut, delay: 0.6 }}
            className="w-full max-w-xl lg:max-w-2xl px-1"
          >
            <div className="relative border border-white/5 bg-[#050508]/40 backdrop-blur-md rounded-2xl p-4 md:p-6 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              {/* Stepper container */}
              <div className="relative flex items-center justify-between gap-2 z-10">
                
                {/* Step 1: Upload & Language Selection */}
                <div 
                  className="flex flex-col items-center text-center w-24 md:w-32 group cursor-pointer" 
                  onClick={() => setTime(0 * stepDuration)}
                >
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${getNodeClass(0)}`}>
                    <UploadIcon active={activeStep === 0} completed={activeStep > 0} />
                    {activeStep === 0 && (
                      <span className="absolute -inset-1 rounded-xl border border-accent/30 animate-pulse pointer-events-none" />
                    )}
                  </div>
                  <span className={`text-[10px] font-mono tracking-wider font-semibold mt-2.5 transition-colors duration-300 ${getLabelClass(0)}`}>1. UPLOAD & DETECT</span>
                </div>

                {/* Line Segment 1 */}
                <div className="flex-1 h-[2px] bg-white/5 relative self-center mb-6">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-linear-to-r from-accent to-accent-bright shadow-[0_0_8px_rgba(94,106,210,0.5)]"
                    style={{
                      width: activeStep === 0 ? `${progress}%` : activeStep > 0 ? '100%' : '0%'
                    }}
                  />
                </div>

                {/* Step 2: Edit & Template Selection */}
                <div 
                  className="flex flex-col items-center text-center w-24 md:w-32 group cursor-pointer" 
                  onClick={() => setTime(1 * stepDuration)}
                >
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${getNodeClass(1)}`}>
                    <EditIcon active={activeStep === 1} completed={activeStep > 1} />
                    {activeStep === 1 && (
                      <span className="absolute -inset-1 rounded-xl border border-accent/30 animate-pulse pointer-events-none" />
                    )}
                  </div>
                  <span className={`text-[10px] font-mono tracking-wider font-semibold mt-2.5 transition-colors duration-300 ${getLabelClass(1)}`}>2. SELECT TEMPLATE</span>
                </div>

                {/* Line Segment 2 */}
                <div className="flex-1 h-[2px] bg-white/5 relative self-center mb-6">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-linear-to-r from-accent to-accent-bright shadow-[0_0_8px_rgba(94,106,210,0.5)]"
                    style={{
                      width: activeStep === 1 ? `${progress}%` : activeStep > 1 ? '100%' : '0%'
                    }}
                  />
                </div>

                {/* Step 3: Render & Export */}
                <div 
                  className="flex flex-col items-center text-center w-24 md:w-32 group cursor-pointer" 
                  onClick={() => setTime(2 * stepDuration)}
                >
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${getNodeClass(2)}`}>
                    <RenderIcon active={activeStep === 2} />
                    {activeStep === 2 && (
                      <span className="absolute -inset-1 rounded-xl border border-accent/30 animate-pulse pointer-events-none" />
                    )}
                  </div>
                  <span className={`text-[10px] font-mono tracking-wider font-semibold mt-2.5 transition-colors duration-300 ${getLabelClass(2)}`}>3. AI RENDER</span>
                </div>

              </div>

              {/* Dynamic Status Text Details */}
              <div className="mt-4 pt-3 border-t border-white/5 text-center min-h-[36px] flex items-center justify-center">
                <span className="text-[11px] font-sans font-medium text-white/60 tracking-wide leading-relaxed">
                  {activeStep === 0 && "Step 1: Upload video & auto-detect language (supports Hinglish/Hindi & 40+ others)..."}
                  {activeStep === 1 && "Step 2: Apply Gen-Z style preset templates & custom subtitle layouts..."}
                  {activeStep === 2 && "Step 3: Fast AI rendering & premium video export in under 10 seconds..."}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
}
