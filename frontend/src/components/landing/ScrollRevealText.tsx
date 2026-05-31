"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollRevealTextProps {
  text: string;
  className?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'div';
}

export function ScrollRevealText({ text, className = "", as = "span" }: ScrollRevealTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  // Track scroll position relative to the viewport
  // Starts revealing when entering 85% of viewport height (lower section)
  // Reaches full solid state when crossing 40% of viewport height (upper-middle section)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.40"],
  });

  const words = text.split(/\s+/);
  
  // Dynamically resolve the HTML element
  const Component = as;

  return (
    <Component ref={containerRef as any} className={`${className} inline-flex flex-wrap`}>
      {words.map((word, i) => {
        const totalWords = words.length;
        // Distribute word starts across 65% of the scroll track
        const progressPerWord = 0.65 / totalWords;
        const start = i * progressPerWord;
        // Overlap each word reveal by taking 35% of the track to complete, creating a liquid flow
        const end = Math.min(1, start + 0.35);

        // Opacity transition: from dim (15%) to solid (100%)
        const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1]);

        // Blur transition: starts blurred (4px), clears to 0px
        const filter = useTransform(scrollYProgress, [start, end], ["blur(4px)", "blur(0px)"]);

        // Color transition: from semi-transparent gray to crisp white
        const color = useTransform(
          scrollYProgress,
          [start, end],
          ["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 1)"]
        );

        // Subtle neon bloom that fades as text sharpens
        const textShadow = useTransform(
          scrollYProgress,
          [start, end],
          ["0 0 12px rgba(255, 255, 255, 0.4)", "0 0 0px rgba(255, 255, 255, 0)"]
        );

        return (
          <motion.span
            key={i}
            style={{
              opacity,
              filter,
              color,
              textShadow,
              willChange: "opacity, filter, color, text-shadow",
            }}
            className="mr-[0.25em] inline-block select-none"
          >
            {word}
          </motion.span>
        );
      })}
    </Component>
  );
}
