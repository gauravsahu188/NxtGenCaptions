"use client";

import React from "react";
import { motion } from "framer-motion";
import { Captions, Keyboard, Sparkles, FileCode, Video } from "lucide-react";

export default function SEOSection() {
  const expoOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full py-28 md:py-36 px-4 sm:px-6 relative border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-[11px] font-mono tracking-widest uppercase mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Core Technology</span>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.12] text-balance">
            The Science of High-Retention Video Captions
          </h2>
        </motion.div>

        {/* Intro Block (Paragraph 1) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 leading-[1.65] font-normal text-pretty">
            In the modern digital landscape, video is the dominant form of communication. From short-form Reels, TikToks, and YouTube Shorts to long-form podcasts and documentation videos, creators are constantly seeking ways to capture and maintain viewer attention. Studies show that up to 80% of viewers watch social media videos on mute. This means that a visual representation of your audio is no longer just an accessibility add-on; it is a critical engagement driver. Enter NxtGen Captions, a state-of-the-art <strong className="text-white font-semibold">caption ai and ai subtitle generator</strong> built to transform raw video footage into highly engaging, viral content with the click of a button.
          </p>
        </motion.div>

        {/* Feature Grid (Paragraphs 2, 3, 4) */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          
          {/* Card 1: Subtitle Generator */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: expoOut }}
            className="group p-7 rounded-3xl border border-white/10 bg-[#07070c]/80 hover:border-cyan-500/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300"
          >
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Keyboard className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight">
                AI Subtitle Generator
              </h3>
              <p className="text-zinc-400 text-sm font-normal leading-relaxed text-pretty">
                Whether you are a solo content creator or a professional editor at a media agency, manually transcribing videos and timing text is a tedious, time-consuming bottleneck. NxtGen Captions solves this by acting as a fully automated <span className="text-white">subtitle generator</span>. Leveraging advanced Whisper-v3 model architectures, our <span className="text-white">ai subtitle generator</span> offers up to 95% word-level accuracy. It supports a wide variety of global languages and excels at transcribing mixed linguistic nuances, such as Hinglish or Spanish-English overlays. By choosing our <span className="text-white font-semibold">auto subtitle generator</span>, you save hours of manual labor, freeing you up to focus on the creative aspects of storytelling and video production.
              </p>
            </div>
          </motion.div>

          {/* Card 2: AI Caption Generator */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08, ease: expoOut }}
            className="group p-7 rounded-3xl border border-white/10 bg-[#07070c]/80 hover:border-cyan-500/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300"
          >
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight">
                AI Caption Generator
              </h3>
              <p className="text-zinc-400 text-sm font-normal leading-relaxed text-pretty">
                Unlike standard subtitle tools that produce flat, plain text, NxtGen Captions is designed to add flavor to your visual style. As an advanced <span className="text-white">ai caption generator</span>, it recognizes the tempo, pauses, and emphasis in speech, automatically highlighting key terms and injecting appropriate emojis. Our sophisticated <span className="text-white">caption generator</span> reads the rhythm of your voice, mapping word-by-word timestamps to generate dynamic, fast-paced text overlays. This is the difference between simple translation and actual audience retention. When you use a <span className="text-white">video subtitle generator</span> that understands creative timing, your retention rates skyrocket, and your viewers stay hooked from the first second to the last.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Modern Captions & Exports */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16, ease: expoOut }}
            className="group p-7 rounded-3xl border border-white/10 bg-[#07070c]/80 hover:border-cyan-500/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300"
          >
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight">
                Advanced Workflows & Exports
              </h3>
              <p className="text-zinc-400 text-sm font-normal leading-relaxed text-pretty">
                Every creator has a unique brand identity. That&apos;s why NxtGen Captions goes beyond basic defaults to offer custom <span className="text-white">modern captions</span> styled after the internet&apos;s top creators. With presets inspired by figures like Alex Hormozi, Ali Abdaal, and custom neon styles, your videos can have that premium, professional polish instantly. But NxtGen Captions is more than just a quick styling tool; it is a comprehensive <span className="text-white">AI Captioning Software</span> package that integrates directly into your existing post-production workflow. Need to customize your layout in professional editors? Export your transcript as a standard <span className="text-white">.srt file</span> for maximum flexibility, or choose <span className="text-white">alpha channel captions</span> to overlay transparent, pre-animated texts directly on your NLE timeline.
              </p>
            </div>
          </motion.div>

        </div>

        {/* Outro Block (Paragraph 5) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="text-center p-8 sm:p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-[#090912] to-[#050508] relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <Captions className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 text-balance">
            Why NxtGen Captions is the Premier Choice
          </h3>
          <p className="text-sm sm:text-base text-zinc-300 font-normal max-w-4xl mx-auto leading-relaxed text-pretty">
            In a crowded space of video tools, NxtGen Captions stands out as a premier production-grade suite. We combine high-speed parallel rendering with word-level speech alignment, multi-lingual support, and background noise removal. We don&apos;t just add a <span className="text-white font-semibold">caption</span> to your video; we enhance the entire viewing experience. By bridging the gap between raw transcripts and custom-designed visual text, NxtGen Captions helps you build authority, boost watch time, and optimize your videos for social algorithms. Experience the next generation of captioning technology today, and let your words move your audience.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
