"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { useCaptionContext } from "../../context/CaptionContext";

// Animation config for the word-by-word top-to-bottom reveal
const WORD_STAGGER = 0.08; // seconds between each word appearing
const WORD_DURATION = 0.35; // how long each word's entrance takes
const EASE_CURVE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const hiddenState = {
  opacity: 0,
  y: -22,
  clipPath: "inset(0% 0% 100% 0%)",
};

const getVisibleState = (i: number): { opacity: number; y: number; clipPath: string; transition: Transition } => ({
  opacity: 1,
  y: 0,
  clipPath: "inset(0% 0% 0% 0%)",
  transition: {
    delay: i * WORD_STAGGER,
    duration: WORD_DURATION,
    ease: EASE_CURVE,
  },
});

export default function ModernCaption() {
  const { activeCaption, captionStyle } = useCaptionContext();

  const stopWords = useMemo(() => new Set([
    "the", "and", "is", "in", "to", "of", "a", "for", "it",
    "on", "with", "as", "at", "by", "an", "or", "be", "this",
    "that", "are",
  ]), []);

  const words = useMemo(() => {
    if (!activeCaption) return [];
    return activeCaption.text.split(/[\s\u200B-\u200D\uFEFF]+/u).filter(Boolean).map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
      const isStopWord = stopWords.has(cleanWord);
      const isLongWord = word.length >= 4;
      const isRhythmicWord = index % 3 === 2;
      const isSpotlight =
        (isLongWord && !isStopWord) || (isRhythmicWord && !isStopWord);

      // Deterministic font size multiplier (no Math.random so it's stable)
      const seed = word.length + index + (cleanWord.charCodeAt(0) || 0);
      const pseudoRand = ((seed * 9301 + 49297) % 233280) / 233280;

      let fontSizeMultiplier: number;
      if (isSpotlight) {
        fontSizeMultiplier = 1.3 + pseudoRand * 0.35;
      } else if (isLongWord && !isStopWord) {
        fontSizeMultiplier = 0.9 + pseudoRand * 0.25;
      } else {
        fontSizeMultiplier = 0.65 + pseudoRand * 0.25;
      }

      // Horizontal offset for the kinetic / splash feel
      const offsetX = (((seed * 9301 + 49297) % 233280) / 233280) * 60 - 30;

      return {
        word,
        isSpotlight,
        fontSizeMultiplier,
        offsetX,
        index,
      };
    });
  }, [activeCaption?.text, stopWords]);

  if (!activeCaption) return null;

  return (
    // key={activeCaption.id} forces AnimatePresence + motion to fully remount
    // and replay animations when the caption segment changes
    <div
      key={activeCaption.id}
      className="pointer-events-none w-full max-w-[900px]"
    >
      <div
        className="flex flex-col items-center justify-center"
        style={{
          fontFamily: `'${captionStyle.fontFamily}', sans-serif`,
          fontWeight: captionStyle.fontWeight,
          letterSpacing: `${captionStyle.letterSpacing}px`,
          lineHeight: captionStyle.lineSpacing,
          textShadow: captionStyle.dropShadow
            ? `2px 2px ${captionStyle.dropShadowOpacity}px ${captionStyle.dropShadowColor}`
            : "none",
          padding: "20px 30px",
        }}
      >
        {words.map(({ word, isSpotlight, fontSizeMultiplier, offsetX, index }) => {
          const isEmphasis = isSpotlight && captionStyle.emphasisWords;
          const color = isEmphasis
            ? captionStyle.emphasisColor
            : captionStyle.primaryColor;
          const textShadow =
            isEmphasis && captionStyle.emphasisGlow
              ? `0 0 ${captionStyle.emphasisGlowIntensity * 2}px ${captionStyle.emphasisGlowColor},
                 0 0 ${captionStyle.emphasisGlowIntensity * 4}px ${captionStyle.emphasisGlowColor}`
              : undefined;

          return (
            <motion.div
              key={`${activeCaption.id}-word-${index}`}
              initial={hiddenState}
              animate={getVisibleState(index)}
              style={{
                marginLeft: `${offsetX}%`,
                color,
                fontWeight: isEmphasis ? "800" : "400",
                fontSize: `${captionStyle.fontSize * fontSizeMultiplier}px`,
                textShadow,
                whiteSpace: "nowrap",
                margin: `${isEmphasis ? 6 : 4}px 0`,
                overflow: "hidden",  // clip reveal from top
                paddingBottom: "2px", // prevents clipping descenders
              }}
            >
              {word}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}