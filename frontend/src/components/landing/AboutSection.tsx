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

  return (
    <section className="w-full py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <ScrollRevealText 
              as="h2"
              text="Welcome to NxtGen Captions"
              className="text-3xl md:text-4xl font-semibold text-white tracking-tight justify-center"
            />
          </div>
          <div className="max-w-3xl mx-auto text-lg leading-relaxed text-center">
            <ScrollRevealText 
              text="NxtGen Captions is a production-grade, AI-driven storytelling platform built to bridge the gap between raw footage and viral, cinematic content. Born from a deep understanding of the advanced video editing landscape, we provide creators with the tools to produce high-energy, professional-grade captions with the click of a button."
              className="text-[var(--color-fg-muted)] justify-center"
            />
          </div>
          <div className="max-w-3xl mx-auto text-lg leading-relaxed mt-6 text-center">
            <ScrollRevealText 
              text="In an era where 80% of social media videos are watched on mute, captions aren't just an accessory—they are the heartbeat of your engagement. NxtGen Captions ensures your message is never missed, regardless of the language or the noise."
              className="text-[var(--color-fg-muted)] justify-center"
            />
          </div>
        </motion.div>

        {/* What Defines Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-semibold text-white text-center mb-12">
            What Defines Us
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="group p-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-[var(--color-fg-muted)] text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* The NxtGen Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-semibold text-white text-center mb-8">
            The NxtGen Promise
          </h3>
          <p className="text-lg text-[var(--color-fg-muted)] max-w-3xl mx-auto text-center leading-relaxed mb-8">
            We believe that every creator deserves access to the high-end visuals typically reserved for massive production houses. Whether you are a solo creator building your brand or a creative agency managing high-volume output, NxtGen Captions is engineered for:
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {highlights.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="p-6 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center mx-auto mb-4">
                  {index === 0 && <Zap className="w-5 h-5 text-[var(--color-accent)]" />}
                  {index === 1 && <Target className="w-5 h-5 text-[var(--color-accent)]" />}
                  {index === 2 && <Globe className="w-5 h-5 text-[var(--color-accent)]" />}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{item.label}</h4>
                <p className="text-[var(--color-fg-muted)] text-sm">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Our Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center py-12 border-t border-[var(--color-border-default)]"
        >
          <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">Our Vision</h3>
          <p className="text-lg text-[var(--color-fg-muted)] max-w-3xl mx-auto leading-relaxed">
            To empower the next generation of digital storytellers by providing an intelligent, &quot;What You See Is What You Get&quot; editing experience. We don&apos;t just add text to your screen; we add impact to your story.
          </p>
          <div className="mt-6 text-xl font-semibold text-[var(--color-accent)]">
            Your content. Our captions. NxtGen results.
          </div>
        </motion.div>
      </div>
    </section>
  );
}