"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCaptionContext } from "../context/CaptionContext";

export default function CaptionOverlay() {
  const { activeCaption } = useCaptionContext();

  return (
    <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-12">
      <AnimatePresence mode="wait">
        {activeCaption && (
          <motion.div
            key={activeCaption.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="px-6 py-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl"
          >
            <span className="text-white font-bold text-2xl tracking-wide drop-shadow-md">
              {activeCaption.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
