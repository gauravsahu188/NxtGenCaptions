"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Captions, Keyboard, Sparkles, FileCode, Video } from 'lucide-react';

export default function SEOSection() {
  const expoOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full py-28 px-4 relative border-t border-white/[0.03]">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 mb-6">
            <Sparkles className="w-4 h-4 text-(--color-accent-bright)" />
            <span className="text-xs font-semibold text-white tracking-wide uppercase">Core Technology</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight mb-6">
            The Science of High-Retention <span className="text-gradient-accent">Video Captions</span>
          </h2>
        </motion.div>

        {/* Intro Block (Paragraph 1) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="max-w-4xl mx-auto text-center mb-20"
        >
          <p className="text-lg md:text-xl text-(--color-fg-muted) leading-relaxed font-medium">
            In the modern digital landscape, video is the dominant form of communication. From short-form Reels, TikToks, and YouTube Shorts to long-form podcasts and documentation videos, creators are constantly seeking ways to capture and maintain viewer attention. Studies show that up to 80% of viewers watch social media videos on mute. This means that a visual representation of your audio is no longer just an accessibility add-on; it is a critical engagement driver. Enter NxtGen Captions, a state-of-the-art <strong className="text-white font-semibold">caption ai and ai subtitle generator</strong> built to transform raw video footage into highly engaging, viral content with the click of a button.
          </p>
        </motion.div>

        {/* Feature Grid (Paragraphs 2, 3, 4) */}
        <div className="grid md:grid-cols-3 gap-8 mb-20 perspective-1000">
          
          {/* Card 1: Subtitle Generator */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 5 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            whileHover={{ scale: 1.02, rotateX: 1, rotateY: -1, z: 5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: expoOut }}
            style={{ transformStyle: 'preserve-3d' }}
            className="group p-8 rounded-3xl border border-white/5 bg-black/40 hover:bg-[#0a0a0c] hover:border-accent/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(94,106,210,0.08)] transition-all duration-500 cursor-pointer"
          >
            <div className="flex flex-col h-full" style={{ transform: 'translateZ(20px)' }}>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 group-hover:border-accent/40 group-hover:scale-110 transition-all duration-500">
                <Keyboard className="w-5 h-5 text-white/70 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-4 tracking-wide">
                AI Subtitle Generator
              </h3>
              <p className="text-(--color-fg-muted) text-sm font-medium leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                Whether you are a solo content creator or a professional editor at a media agency, manually transcribing videos and timing text is a tedious, time-consuming bottleneck. NxtGen Captions solves this by acting as a fully automated <span className="text-white">subtitle generator</span>. Leveraging advanced Whisper-v3 model architectures, our <span className="text-white">ai subtitle generator</span> offers up to 95% word-level accuracy. It supports a wide variety of global languages and excels at transcribing mixed linguistic nuances, such as Hinglish or Spanish-English overlays. By choosing our <span className="text-white font-semibold">auto subtitle generator</span>, you save hours of manual labor, freeing you up to focus on the creative aspects of storytelling and video production.
              </p>
            </div>
          </motion.div>

          {/* Card 2: AI Caption Generator */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 5 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            whileHover={{ scale: 1.02, rotateX: 1, rotateY: -1, z: 5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: expoOut }}
            style={{ transformStyle: 'preserve-3d' }}
            className="group p-8 rounded-3xl border border-white/5 bg-black/40 hover:bg-[#0a0a0c] hover:border-accent/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(94,106,210,0.08)] transition-all duration-500 cursor-pointer"
          >
            <div className="flex flex-col h-full" style={{ transform: 'translateZ(20px)' }}>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 group-hover:border-accent/40 group-hover:scale-110 transition-all duration-500">
                <Video className="w-5 h-5 text-white/70 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-4 tracking-wide">
                AI Caption Generator
              </h3>
              <p className="text-(--color-fg-muted) text-sm font-medium leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                Unlike standard subtitle tools that produce flat, plain text, NxtGen Captions is designed to add flavor to your visual style. As an advanced <span className="text-white">ai caption generator</span>, it recognizes the tempo, pauses, and emphasis in speech, automatically highlighting key terms and injecting appropriate emojis. Our sophisticated <span className="text-white">caption generator</span> reads the rhythm of your voice, mapping word-by-word timestamps to generate dynamic, fast-paced text overlays. This is the difference between simple translation and actual audience retention. When you use a <span className="text-white">video subtitle generator</span> that understands creative timing, your retention rates skyrocket, and your viewers stay hooked from the first second to the last.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Modern Captions & Exports */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 5 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            whileHover={{ scale: 1.02, rotateX: 1, rotateY: -1, z: 5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: expoOut }}
            style={{ transformStyle: 'preserve-3d' }}
            className="group p-8 rounded-3xl border border-white/5 bg-black/40 hover:bg-[#0a0a0c] hover:border-accent/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(94,106,210,0.08)] transition-all duration-500 cursor-pointer"
          >
            <div className="flex flex-col h-full" style={{ transform: 'translateZ(20px)' }}>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 group-hover:border-accent/40 group-hover:scale-110 transition-all duration-500">
                <FileCode className="w-5 h-5 text-white/70 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-4 tracking-wide">
                Advanced Workflows & Exports
              </h3>
              <p className="text-(--color-fg-muted) text-sm font-medium leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                Every creator has a unique brand identity. That&apos;s why NxtGen Captions goes beyond basic defaults to offer custom <span className="text-white">modern captions</span> styled after the internet&apos;s top creators. With presets inspired by figures like Alex Hormozi, Ali Abdaal, and custom neon styles, your videos can have that premium, professional polish instantly. But NxtGen Captions is more than just a quick styling tool; it is a comprehensive <span className="text-white">AI Captioning Software</span> package that integrates directly into your existing post-production workflow. Need to customize your layout in professional editors? Export your transcript as a standard <span className="text-white">.srt file</span> for maximum flexibility, or choose <span className="text-white">alpha channel captions</span> to overlay transparent, pre-animated texts directly on your NLE timeline.
              </p>
            </div>
          </motion.div>

        </div>

        {/* Outro Block (Paragraph 5) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="text-center p-10 rounded-3xl border border-white/5 bg-gradient-to-b from-[#0a0a0c] to-[#050506]"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <Captions className="w-5 h-5 text-(--color-accent-bright)" />
          </div>
          <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-4">
            Why NxtGen Captions is the Premier Choice
          </h3>
          <p className="text-base text-(--color-fg-muted) font-medium max-w-4xl mx-auto leading-relaxed mb-4">
            In a crowded space of video tools, NxtGen Captions stands out as a premier production-grade suite. We combine high-speed parallel rendering with word-level speech alignment, multi-lingual support, and background noise removal. We don&apos;t just add a <span className="text-white font-semibold">caption</span> to your video; we enhance the entire viewing experience. By bridging the gap between raw transcripts and custom-designed visual text, NxtGen Captions helps you build authority, boost watch time, and optimize your videos for social algorithms. Experience the next generation of captioning technology today, and let your words move your audience.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
