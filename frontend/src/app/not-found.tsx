"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, VideoOff, Play, Pause, AlertCircle, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import Loader from "@/components/Loader";

export default function NotFound() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelineProgress, setTimelineProgress] = useState(40.4);

  // Animate timeline progress indicator when "playing"
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimelineProgress((prev) => {
        const next = prev + 0.25;
        return next > 100 ? 0 : next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative min-h-screen bg-(--color-bg-base) text-(--color-foreground) font-sans selection:bg-accent/30 overflow-hidden flex flex-col justify-between">
      {/* Typewriter Page Loader */}
      <Loader isPageLoader />

      {/* Layer 1: Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)] z-0 pointer-events-none" />

      {/* Layer 2: Animated Gradient Blobs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-accent/10 blur-[150px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[700px] bg-purple-500/5 blur-[120px] rounded-full z-0 pointer-events-none animate-float-delayed mix-blend-screen" />

      {/* Layer 3: Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.015] z-0 pointer-events-none" />

      {/* Layer 4: Noise Texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.01]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10 w-full flex flex-col grow justify-between">
        <Navbar />

        {/* Content Area */}
        <main className="pt-32 pb-16 px-4 flex flex-col items-center justify-center grow">
          <div className="max-w-4xl w-full flex flex-col items-center text-center gap-8">
            
            {/* Main Typographic Header */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Timeline Drift Error
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-6xl font-bold font-display tracking-tight text-white"
              >
                Lost In <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-bright">Translation</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-(--color-fg-muted) max-w-lg mx-auto"
              >
                The sequence you are trying to view cannot be synced. This timestamp or timeline has drifted out of bounds.
              </motion.p>
            </div>

            {/* Visual Editor mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full glass-panel border border-white/5 bg-[#050508]/80 rounded-2xl overflow-hidden shadow-2xl p-4 md:p-6"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4 text-xs text-(--color-fg-muted)">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-white font-medium">sequence_404_drift.mp4</span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span>FPS: 23.976</span>
                  <span className="text-red-400 font-semibold">00:04:04:00</span>
                </div>
              </div>

              {/* Mock Video Canvas */}
              <div className="relative w-full aspect-video rounded-xl bg-[#020204] border border-white/5 overflow-hidden flex flex-col items-center justify-center gap-3">
                {/* Background Wave/Radar scan */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(94,106,210,0.05)_0%,rgba(0,0,0,0)_75%)]" />
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <div className="w-[80%] h-[1px] bg-white" />
                  <div className="h-[80%] w-[1px] bg-white absolute" />
                </div>

                <VideoOff className="w-12 h-12 text-white/20 relative z-10" />
                <p className="text-xs text-white/50 font-mono tracking-widest uppercase relative z-10">
                  NO_SIGNAL_SYNC_DRIFT
                </p>

                {/* Subtitle overlay */}
                <div className="absolute bottom-6 left-4 right-4 md:bottom-8 md:left-8 md:right-8 bg-black/60 backdrop-blur-md border border-white/5 px-4 py-2.5 rounded-xl max-w-xl mx-auto shadow-lg">
                  <p className="text-xs md:text-sm font-medium font-sans text-center text-white/90">
                    <span className="text-red-400 font-mono mr-2">[00:04:04.000]</span> 
                    Error: The page chunk does not exist or has been deleted from this track.
                  </p>
                </div>
              </div>

              {/* Controls & Track timeline */}
              <div className="mt-4 pt-2 space-y-4">
                {/* Timeline Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white transition-all active:scale-95"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="text-xs font-mono text-white/60">TRACK_STATUS: {isPlaying ? "SYNCHRONIZING..." : "STOPPED"}</span>
                  </div>

                  <div className="text-xs font-mono text-white/60">
                    OFFSET: <span className="text-red-400 font-bold">+404.00ms</span>
                  </div>
                </div>

                {/* Timeline Tracks */}
                <div className="space-y-2.5 bg-[#020204] border border-white/5 rounded-xl p-3.5 font-mono text-[10px]">
                  {/* Visual Timeline Track */}
                  <div className="relative h-6 bg-white/5 rounded-md overflow-hidden border border-white/5">
                    {/* Playhead indicator bar */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      style={{ left: `${timelineProgress}%` }}
                    />
                    <div className="absolute inset-y-0 left-0 w-[40%] bg-accent/25 border-r border-accent/40 flex items-center px-2 text-white/70">
                      intro_sequence.wav
                    </div>
                    <div className="absolute inset-y-0 left-[40.4%] right-0 bg-red-500/10 border-l border-red-500/40 border-dashed flex items-center px-2 text-red-400 font-bold">
                      [GAP / OUT_OF_BOUNDS_DRIFT]
                    </div>
                  </div>

                  {/* Audio Waveform Track */}
                  <div className="flex items-center justify-between gap-1.5 h-8 px-1">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const isActive = isPlaying;
                      // Generate somewhat random but structured wave peaks
                      const heightPercent = [30, 60, 45, 90, 20, 10, 80, 50, 40, 70, 95, 30, 20, 60, 85, 30, 10, 5, 5, 5, 5, 8, 10, 12, 10, 15, 35, 60, 80, 45, 90, 70, 85, 50, 65, 40, 90, 30, 20, 65, 80, 55, 30, 75, 40, 60, 85, 50][i];
                      const isErrorRange = i >= 19 && i <= 25; // 404 gap

                      return (
                        <motion.div
                          key={i}
                          className={`flex-1 rounded-sm transition-all duration-300 ${
                            isErrorRange
                              ? "bg-red-500/30 border border-red-500/40"
                              : "bg-accent/45 hover:bg-accent-bright"
                          }`}
                          animate={{
                            height: isActive
                              ? isErrorRange 
                                ? "4px" 
                                : `${Math.max(6, heightPercent + (Math.sin(timelineProgress + i) * 15))}%`
                              : `${isErrorRange ? 4 : heightPercent}%`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-2"
            >
              <Link href="/">
                <button className="group px-6 py-3 bg-white text-black font-semibold rounded-xl flex items-center gap-2 hover:bg-white/95 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]">
                  <Home className="w-4 h-4 text-black" />
                  Back to Home
                </button>
              </Link>
              
              <Link href="/dashboard">
                <button className="group px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl flex items-center gap-2 border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
                  <LayoutDashboard className="w-4 h-4 text-white/70" />
                  Go to Dashboard
                </button>
              </Link>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
