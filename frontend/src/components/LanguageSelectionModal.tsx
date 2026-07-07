"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Type } from "lucide-react";

export const LANGUAGES = [
  { code: "auto", name: "Auto Detect", flag: "🌐" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ne", name: "Nepali", flag: "🇳🇵" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "sd", name: "Sindhi", flag: "🇵🇰" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", flag: "🇮🇳" },
  { code: "ps", name: "Pushto", flag: "🇦🇫" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
];

export const SCRIPTS = [
  { code: "native", name: "Native" },
  { code: "romanised", name: "Romanised Latin" },
  { code: "english", name: "English Translation" },
];

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (language: string, script: string) => void;
}

export default function LanguageSelectionModal({
  isOpen,
  onClose,
  onSubmit,
}: LanguageSelectionModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("hi");
  const [selectedScript, setSelectedScript] = useState("native");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Language Selection */}
          <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/20 text-accent rounded-lg">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">What language is used in video?</h3>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedLanguage === lang.code
                        ? "bg-accent/15 border-accent/50 text-accent shadow-sm"
                        : "bg-zinc-900/50 border-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700"
                    } border`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Script Selection */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Type className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">What writing script you want?</h3>
              </div>
              
              <div className="space-y-3">
                {SCRIPTS.map((script) => (
                  <button
                    key={script.code}
                    onClick={() => setSelectedScript(script.code)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-4 rounded-xl transition-all ${
                      selectedScript === script.code
                        ? "bg-purple-500/15 border-purple-500/50 text-purple-400 shadow-sm"
                        : "bg-zinc-900/50 border-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700"
                    } border`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedScript === script.code ? "border-purple-400" : "border-zinc-600"
                    }`}>
                      {selectedScript === script.code && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      )}
                    </div>
                    <span className="font-medium text-lg">{script.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <button
                onClick={() => onSubmit(selectedLanguage, selectedScript)}
                className="w-full py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-lg shadow-accent/25 transition-all active:scale-[0.98]"
              >
                Generate Transcription
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
