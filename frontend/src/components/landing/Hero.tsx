"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// High-Fidelity Architectural Fluted Light Pillars (Left Side) - Orbix Exact Match
const LeftFlutedPillars = React.memo(() => (
  <div
    className="absolute top-0 left-0 bottom-0 w-[220px] sm:w-[300px] md:w-[360px] lg:w-[420px] xl:w-[460px] pointer-events-none z-0 overflow-hidden select-none"
    style={{
      transform: "translate3d(0,0,0)",
      willChange: "transform",
      maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.30) 78%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.30) 78%, transparent 100%)"
    }}
  >
    <svg
      viewBox="0 0 440 1000"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <defs>
        {/* Soft, rich ambient violet volumetric backlight behind the drapery */}
        <radialGradient id="orbixBacklightL" cx="20%" cy="42%" r="78%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#6d28d9" stopOpacity="0.35" />
          <stop offset="65%" stopColor="#4c1d95" stopOpacity="0.15" />
          <stop offset="88%" stopColor="#1e0836" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#030305" stopOpacity="0" />
        </radialGradient>

        {/* 3D Convex Cylindrical Flute Gradient: Deep shadow trough -> Rich royal violet -> Soft lavender crest (Subtle Velvet, ZERO harsh white) */}
        <linearGradient id="orbixFluteGradL" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#240747" stopOpacity="0.75" />
          <stop offset="16%" stopColor="#4c1d95" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#7c3aed" stopOpacity="0.95" />
          <stop offset="47%" stopColor="#9333ea" stopOpacity="0.98" />
          <stop offset="50%" stopColor="#c084fc" stopOpacity="0.95" />
          <stop offset="53%" stopColor="#9333ea" stopOpacity="0.98" />
          <stop offset="65%" stopColor="#7c3aed" stopOpacity="0.95" />
          <stop offset="84%" stopColor="#4c1d95" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#240747" stopOpacity="0.75" />
        </linearGradient>

        {/* Volumetric Stage Spotlight Falloff (Vertical & Horizontal combined) */}
        <radialGradient id="orbixSpotlightMaskL" cx="22%" cy="44%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1.0" />
          <stop offset="28%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="78%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="96%" stopColor="#000000" stopOpacity="0.0" />
        </radialGradient>

        <mask id="orbixMaskL">
          <rect x="0" y="0" width="440" height="1000" fill="url(#orbixSpotlightMaskL)" />
        </mask>

        {/* Organic Gaussian Blur Filter for Silky Velvet Transitions */}
        <filter id="orbixSilkFilterL" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5.0" />
        </filter>
      </defs>

      {/* Volumetric ambient glow */}
      <rect x="0" y="0" width="440" height="1000" fill="url(#orbixBacklightL)" />

      {/* 6 Seamless Contiguous Fluted Pleats */}
      <g mask="url(#orbixMaskL)" filter="url(#orbixSilkFilterL)">
        {[
          { x: -5, w: 78, op: 0.90 },
          { x: 73, w: 82, op: 0.98 },
          { x: 155, w: 80, op: 0.92 },
          { x: 235, w: 76, op: 0.76 },
          { x: 311, w: 72, op: 0.48 },
          { x: 383, w: 68, op: 0.22 },
        ].map((col, idx) => (
          <rect
            key={`flute-l-${idx}`}
            x={col.x}
            y="0"
            width={col.w}
            height="1000"
            fill="url(#orbixFluteGradL)"
            opacity={col.op}
          />
        ))}
      </g>
    </svg>
  </div>
));
LeftFlutedPillars.displayName = "LeftFlutedPillars";

// High-Fidelity Architectural Fluted Light Pillars (Right Side) - Orbix Exact Match
const RightFlutedPillars = React.memo(() => (
  <div
    className="absolute top-0 right-0 bottom-0 w-[220px] sm:w-[300px] md:w-[360px] lg:w-[420px] xl:w-[460px] pointer-events-none z-0 overflow-hidden select-none"
    style={{
      transform: "translate3d(0,0,0)",
      willChange: "transform",
      maskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.30) 78%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.30) 78%, transparent 100%)"
    }}
  >
    <svg
      viewBox="0 0 440 1000"
      preserveAspectRatio="none"
      className="w-full h-full scale-x-[-1]"
    >
      <defs>
        <radialGradient id="orbixBacklightR" cx="20%" cy="42%" r="78%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#6d28d9" stopOpacity="0.35" />
          <stop offset="65%" stopColor="#4c1d95" stopOpacity="0.15" />
          <stop offset="88%" stopColor="#1e0836" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#030305" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="orbixFluteGradR" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#240747" stopOpacity="0.75" />
          <stop offset="16%" stopColor="#4c1d95" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#7c3aed" stopOpacity="0.95" />
          <stop offset="47%" stopColor="#9333ea" stopOpacity="0.98" />
          <stop offset="50%" stopColor="#c084fc" stopOpacity="0.95" />
          <stop offset="53%" stopColor="#9333ea" stopOpacity="0.98" />
          <stop offset="65%" stopColor="#7c3aed" stopOpacity="0.95" />
          <stop offset="84%" stopColor="#4c1d95" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#240747" stopOpacity="0.75" />
        </linearGradient>

        <radialGradient id="orbixSpotlightMaskR" cx="22%" cy="44%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1.0" />
          <stop offset="28%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="78%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="96%" stopColor="#000000" stopOpacity="0.0" />
        </radialGradient>

        <mask id="orbixMaskR">
          <rect x="0" y="0" width="440" height="1000" fill="url(#orbixSpotlightMaskR)" />
        </mask>

        <filter id="orbixSilkFilterR" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5.0" />
        </filter>
      </defs>

      <rect x="0" y="0" width="440" height="1000" fill="url(#orbixBacklightR)" />

      <g mask="url(#orbixMaskR)" filter="url(#orbixSilkFilterR)">
        {[
          { x: -5, w: 78, op: 0.90 },
          { x: 73, w: 82, op: 0.98 },
          { x: 155, w: 80, op: 0.92 },
          { x: 235, w: 76, op: 0.76 },
          { x: 311, w: 72, op: 0.48 },
          { x: 383, w: 68, op: 0.22 },
        ].map((col, idx) => (
          <rect
            key={`flute-r-${idx}`}
            x={col.x}
            y="0"
            width={col.w}
            height="1000"
            fill="url(#orbixFluteGradR)"
            opacity={col.op}
          />
        ))}
      </g>
    </svg>
  </div>
));
RightFlutedPillars.displayName = "RightFlutedPillars";

export default function Hero() {
  const expoOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="relative w-full flex flex-col items-center justify-start pt-28 sm:pt-32 md:pt-36 pb-20 overflow-hidden">
      {/* Hardware-Accelerated Orbix-Style Architectural Fluted Side Pillars */}
      <LeftFlutedPillars />
      <RightFlutedPillars />

      {/* Center Ambient Atmospheric Violet Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110vw] max-w-6xl h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15)_0%,rgba(99,102,241,0.06)_45%,transparent_75%)] z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* Central Authoritative Headline */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: expoOut, delay: 0.08 }}
          className="font-display-headline text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-[-0.04em] leading-[1.08] text-white max-w-3xl text-balance"
        >
          Create Captions That Hold Attention.
        </motion.h1>

        {/* Cinematic Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: expoOut, delay: 0.16 }}
          className="mt-5 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl font-normal leading-[1.6] text-pretty"
        >
          Auto-generate pixel-perfect subtitles in seconds. Engage viewers with templates inspired by the world&apos;s leading storytellers.
        </motion.p>

        {/* High-Contrast Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: expoOut, delay: 0.24 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
        >
          <Link href="/editor" className="w-full sm:w-auto">
            <button
              id="btn-hero-primary"
              className="group relative flex h-11 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-white px-7 font-sans text-sm font-semibold text-black transition-all hover:bg-neutral-100 active:scale-[0.98] shadow-[0_4px_25px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              <span>Generate Captions Free</span>
              <ArrowRight className="h-4 w-4 text-black group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>

          <a href="#templates" className="w-full sm:w-auto">
            <button className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] px-6 font-sans text-sm font-medium text-white transition-all active:scale-[0.98] cursor-pointer">
              <span>Explore Templates</span>
              <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          </a>
        </motion.div>

        {/* Tabs-Style Product Showcase Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: expoOut, delay: 0.32 }}
          className="relative w-full max-w-5xl mt-12 sm:mt-14"
        >
          {/* Cyan Halo Behind Showcase */}
          <div className="absolute -inset-4 sm:-inset-6 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.25)_0%,rgba(6,182,212,0.12)_30%,rgba(99,102,241,0.08)_60%,transparent_75%)] rounded-[32px] blur-[60px] pointer-events-none -z-10" />

          {/* Architectural Window Container */}
          <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-[#07070b]/90 backdrop-blur-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)]">

            {/* Top Window Navigation Bar (Mac Style Chrome) */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.07] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70 border border-red-500/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70 border border-yellow-500/30" />
                <span className="w-3 h-3 rounded-full bg-green-500/70 border border-green-500/30" />
              </div>

              {/* Breadcrumb / Project Identifier */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[11px] font-mono text-zinc-400">
                <span className="text-cyan-400">●</span>
                <span>NxtGen Editor</span>
              </div>
            </div>

            {/* High-Fidelity Workspace Screenshot Asset */}
            <div className="relative w-full overflow-hidden bg-black/40">
              <Image
                src="/nxtgen-workspace.png"
                alt="NxtGen Captions AI Workspace Screenshot"
                width={1280}
                height={720}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
                className="w-full h-auto select-none pointer-events-none relative z-10"
              />

              {/* Metallic screen glare gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-transparent to-transparent pointer-events-none z-20" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
