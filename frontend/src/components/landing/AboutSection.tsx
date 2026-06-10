"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Languages, Wand2, Zap, Target, Globe } from 'lucide-react';
import { ScrollRevealText } from './ScrollRevealText';

export default function AboutSection() {
  const features = [
    {
      icon: Sparkles,
      title: "Next-Level Precision",
      description: "Leveraging state-of-the-art AI (Whisper-v3), we deliver up to 95% transcription accuracy across a massive range of languages, with a specialized focus on the nuances of Desi languages (Hindi, Urdu, Bengali, Tamil, and more).",
    },
    {
      icon: Wand2,
      title: "Cinematic Aesthetics",
      description: "Move beyond boring subtitles. Our library features one-click premium templates inspired by the world's top storytellers—including styles like Hormozi, Ali Abdaal, and our exclusive NxtGen Special—featuring advanced physics-based shadows and metallic shimmer effects.",
    },
    {
      icon: Languages,
      title: "Studio-Grade Audio",
      description: "Don't let bad audio ruin good video. Our integrated AI Audio Enhancement cleans up background noise, traffic, and hiss, delivering studio-quality clarity in seconds.",
    },
    {
      icon: Zap,
      title: "Pro-Editor Workflow",
      description: "Built for power users, our platform supports 4K rendering, Lock-on Head Stabilization, and professional exports (Alpha Channel and SRT) to integrate seamlessly with your existing NLE workflow.",
    },
  ];

  const highlights = [
    { label: "Speed", value: "Instant transcription & parallel rendering" },
    { label: "Accuracy", value: "Word-level timestamping" },
    { label: "Discovery", value: "Multi-language translation" },
  ];

  const expoOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full py-32 px-4 relative border-t border-white/3">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="text-center mb-24"
        >
          <div className="flex justify-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
              Welcome to NxtGen Captions
            </h1>
          </div>
          <div className="max-w-3xl mx-auto text-lg leading-relaxed text-center font-medium">
            <ScrollRevealText
              text="NxtGen Captions is a production-grade, AI-driven storytelling platform built to bridge the gap between raw footage and viral, cinematic content. Born from a deep understanding of the advanced video editing landscape, we provide creators with the tools to produce high-energy, professional-grade captions with the click of a button."
              className="text-(--color-fg-muted) justify-center"
            />
          </div>
          <div className="max-w-3xl mx-auto text-lg leading-relaxed mt-6 text-center font-medium">
            <ScrollRevealText
              text="In an era where 80% of social media videos are watched on mute, captions aren't just an accessory—they are the heartbeat of your engagement. NxtGen Captions ensures your message is never missed, regardless of the language or the noise."
              className="text-(--color-fg-muted) justify-center"
            />
          </div>
        </motion.div>

        {/* What Defines Us */}
        <div className="mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: expoOut }}
            className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-16"
          >
            What Defines Us
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8 perspective-1000">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2, z: 10 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: expoOut }}
                style={{ transformStyle: 'preserve-3d' }}
                className="group p-8 rounded-3xl border border-white/5 bg-black/40 hover:bg-bg-elevated hover:border-accent/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(94,106,210,0.1)] transition-colors duration-500 cursor-pointer"
              >
                <div className="flex items-start gap-6" style={{ transform: 'translateZ(20px)' }}>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 group-hover:border-accent/40 group-hover:scale-110 transition-all duration-500">
                    <feature.icon className="w-6 h-6 text-white/70 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
                    <p className="text-(--color-fg-muted) text-sm font-medium leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The NxtGen Promise */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-8">
            The NxtGen Promise
          </h2>
          <p className="text-lg text-(--color-fg-muted) font-medium max-w-3xl mx-auto text-center leading-relaxed mb-12">
            We believe that every creator deserves access to the high-end visuals typically reserved for massive production houses. Whether you are a solo creator building your brand or a creative agency managing high-volume output, NxtGen Captions is engineered for:
          </p>

          <div className="grid md:grid-cols-3 gap-6 perspective-1000">
            {highlights.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: expoOut }}
                className="p-8 rounded-2xl border border-accent/20 bg-bg-elevated text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                  {index === 0 && <Zap className="w-5 h-5 text-(--color-accent-bright)" />}
                  {index === 1 && <Target className="w-5 h-5 text-(--color-accent-bright)" />}
                  {index === 2 && <Globe className="w-5 h-5 text-(--color-accent-bright)" />}
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">{item.label}</h3>
                <p className="text-(--color-fg-muted) font-medium text-sm">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Our Vision */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
          className="text-center py-16 border-t border-white/5"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Our Vision</h2>
          <p className="text-lg text-(--color-fg-muted) font-medium max-w-3xl mx-auto leading-relaxed">
            To empower the next generation of digital storytellers by providing an intelligent, &quot;What You See Is What You Get&quot; editing experience. We don&apos;t just add text to your screen; we add impact to your story.
          </p>
          <div className="mt-8 text-2xl font-display font-bold text-gradient-accent">
            Your content. Our captions. NxtGen results.
          </div>
        </motion.div>
      </div>
    </section>
  );
}