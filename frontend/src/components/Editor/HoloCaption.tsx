"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useCaptionContext } from "../../context/CaptionContext";

export default function HoloCaption() {
  const { activeCaption, captionStyle } = useCaptionContext();

  // Split text into words, then into characters for typewriter effect
  const words = useMemo(() => {
    if (!activeCaption) return [];
    return activeCaption.text.split(/[\s\u200B-\u200D\uFEFF]+/u).filter(Boolean).map((word, wordIndex) => {
      // Every 4th word triggers the glitch
      const isGlitch = (wordIndex + 1) % 4 === 0;
      return {
        word,
        isGlitch,
        chars: word.split(""),
        wordIndex
      };
    });
  }, [activeCaption, activeCaption?.text]);

  if (!activeCaption) return null;

  const STAGGER = 0.03; // ~1 frame at 30fps

  const glitchAnimation = {
    skewX: [0, -15, 10, -5, 5, 0],
    x: [0, -3, 3, -1, 1, 0],
    transition: {
      duration: 0.25,
      ease: "easeInOut" as const,
      repeat: Infinity,
      repeatType: "mirror" as const,
      repeatDelay: 1.5
    }
  };

  return (
    <div key={activeCaption.id} className="pointer-events-none w-full max-w-[900px] flex items-center justify-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
      `}</style>
      <div
        className="flex flex-wrap justify-center items-center text-center"
        style={{
          fontFamily: `'${captionStyle.fontFamily}', monospace`,
          fontWeight: captionStyle.fontWeight,
          fontSize: `${captionStyle.fontSize}px`,
          color: captionStyle.primaryColor,
          backgroundColor: "rgba(0, 255, 65, 0.08)",
          border: `1px solid ${captionStyle.primaryColor}`,
          boxShadow: `0 0 15px ${captionStyle.primaryColor}40, inset 0 0 10px ${captionStyle.primaryColor}30`,
          padding: "16px 24px",
          borderRadius: "8px",
          backdropFilter: "blur(2px)",
          letterSpacing: `${captionStyle.letterSpacing}px`,
          lineHeight: captionStyle.lineSpacing,
          textShadow: captionStyle.dropShadow
            ? `2px 2px ${captionStyle.dropShadowOpacity}px ${captionStyle.dropShadowColor}`
            : `0 0 8px ${captionStyle.primaryColor}`,
        }}
      >
        {words.map((w, wIdx) => {
          return (
            <motion.div
              key={`${activeCaption.id}-w-${wIdx}`}
              className="flex whitespace-pre mr-[0.3em]"
              animate={w.isGlitch ? glitchAnimation : undefined}
              style={{
                textShadow: w.isGlitch ? `-2px 0 red, 2px 0 blue` : undefined
              }}
            >
              {w.chars.map((char, cIdx) => {
                // Calculate absolute index for stagger delay
                const absoluteCharIdx = words.slice(0, wIdx).reduce((acc, curr) => acc + curr.chars.length, 0) + cIdx;
                return (
                  <motion.span
                    key={`${activeCaption.id}-c-${wIdx}-${cIdx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: absoluteCharIdx * STAGGER,
                      duration: 0.01
                    }}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
