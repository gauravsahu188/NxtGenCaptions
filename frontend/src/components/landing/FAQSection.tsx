"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shield, Zap, Globe } from "lucide-react";

const faqCategories = [
  {
    title: "General Questions",
    icon: Globe,
    items: [
      {
        question: "How accurate is the AI transcription?",
        answer: "Our engine delivers up to 95% accuracy in major Desi languages and English. It is specifically tuned to handle regional accents and nuances that standard Western AI often misses.",
      },
      {
        question: "Which languages are supported?",
        answer: "We support a wide range of languages including Hindi, English, Urdu, Punjabi, Bengali, Tamil, Malayalam, Telugu, and many more. The platform is built to cater specifically to the South Asian creator community.",
      },
    ],
  },
  {
    title: "Security & Data Privacy",
    icon: Shield,
    items: [
      {
        question: "Is my video data secure on AWS?",
        answer: "Yes. We use AWS S3 with private buckets and folder-level isolation to ensure that only you can access your uploaded files. All uploads are handled via Secure Presigned URLs, meaning your data never passes through a public middleman.",
      },
      {
        question: "Who can see my uploaded videos?",
        answer: "Your videos are processed by automated AI workers in a secure, transient environment. No human staff members view your content unless you explicitly request support for a specific file.",
      },
      {
        question: "How long are my files stored?",
        answer: "Raw Uploads: Stored temporarily for processing and editing. Exported Renders: We implement a strict 48-hour S3 Lifecycle Policy. All rendered videos are automatically deleted from our servers 48 hours after export to protect your privacy and optimize storage.",
      },
    ],
  },
  {
    title: "Performance & Technicals",
    icon: Zap,
    items: [
      {
        question: "Why is rendering so fast compared to other tools?",
        answer: "We use a Hyper-Parallel Rendering Engine powered by AWS Lambda. Instead of rendering your video on one slow computer, we split it into tiny segments and render them simultaneously across hundreds of servers, stitching them back together in seconds.",
      },
      {
        question: "Can I use these captions in Premiere Pro or After Effects?",
        answer: "Absolutely. Our Creator and Business plans support exporting as an Alpha Channel (Transparent Video) or SRT file, allowing you to bring our premium designs directly into your professional NLE workflow.",
      },
    ],
  },
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <section className="w-full py-28 md:py-36 px-4 sm:px-6 relative border-t border-white/[0.06]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 text-[11px] font-mono tracking-widest uppercase mb-4">
            <span>Knowledge Base</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-4 text-balance">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed text-pretty">
            To help you feel confident in NxtGen Captions, here are answers to address technical, security, and performance concerns.
          </p>
        </motion.div>

        <div className="space-y-10">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <category.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{category.title}</h3>
              </div>

              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const itemId = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItems.has(itemId);

                  return (
                    <div
                      key={itemId}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isOpen
                          ? "border-cyan-500/40 bg-[#090912] shadow-[0_4px_25px_rgba(6,182,212,0.08)]"
                          : "border-white/[0.07] bg-[#06060a]/80 hover:border-white/15 hover:bg-[#07070d]"
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full flex items-center justify-between p-5 text-left transition-colors duration-200 cursor-pointer"
                      >
                        <span className="font-semibold text-sm sm:text-base text-white pr-4 leading-snug">{item.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-cyan-400" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-1 text-zinc-300 text-sm leading-relaxed border-t border-white/[0.05]">
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
