"use client";

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  // Parallax scroll effect
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);
  const y = useTransform(scrollY, [0, 500], [0, 100]);

  // Entrance easing
  const expoOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden">
      <motion.div 
        style={{ opacity, scale, y }}
        className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto space-y-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono tracking-widest mb-4"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          NXTGEN CAPTIONS 2.0 IS LIVE
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: expoOut, delay: 0.08 }}
          className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.03em] leading-[1.05] text-white"
        >
          <span className="text-gradient-accent">AI Captioning</span> Software,<br />
          <span className="text-gradient">For the NxtGen Creator.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: expoOut, delay: 0.16 }}
          className="text-lg md:text-xl text-[var(--color-fg-muted)] max-w-2xl font-normal leading-relaxed"
        >
          Auto-generate stunning, accurate captions in all major <span className="text-[var(--color-foreground)] font-medium">languages</span> in seconds. Build high-end videos faster with our cinematic templates.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: expoOut, delay: 0.24 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-8"
        >
          <Link href="/sign-in">
            <button id="btn-hero-getstarted" className="group relative px-6 py-3 bg-[var(--color-accent)] rounded-lg font-medium text-white flex items-center gap-2 transition-all duration-300 hover:bg-[var(--color-accent-bright)] active:scale-[0.98] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
              <span>Get started now</span>
              <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </button>
          </Link>
          <Link href="/showcase">
            <button className="px-6 py-3 bg-[var(--color-surface)] rounded-lg font-medium text-[var(--color-foreground)] flex items-center gap-2 transition-all duration-300 hover:bg-[var(--color-surface-hover)] active:scale-[0.98] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              View Showcase
            </button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: expoOut }}
          className="flex flex-col items-center gap-3 mt-16 pt-8 border-t border-[var(--color-border-default)]"
        >
          <span className="text-xs font-mono tracking-widest text-[var(--color-fg-muted)] uppercase">Trusted by 50,000+ Creators</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
            ))}
            <span className="text-[var(--color-foreground)] font-semibold ml-2">4.9/5</span>
            <span className="w-5 h-5 ml-1 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[10px] font-bold text-[var(--color-fg-subtle)]">G</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
