"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check, Layers, X } from "lucide-react";

export interface LanguageConfig {
  mode: "single" | "dual";
  language?: string;
  dualLanguage?: { primary: string; secondary: string };
}

export const LANGUAGES = [
  { code: "auto",     name: "Auto Detect",  flag: "🌐", description: "Automatically detects any international language." },
  { code: "en",       name: "English",       flag: "🇬🇧", description: "Transcribes English speech." },
  { code: "hi",       name: "Hindi",         flag: "🇮🇳", description: "Devanagari script (हिन्दी)." },
  { code: "hinglish", name: "Hinglish",      flag: "🇮🇳", description: "Romanized Hindi transliteration." },
  { code: "ml",       name: "Malayalam",     flag: "🇮🇳", description: "Malayalam script (മലയാളം)." },
  { code: "ta",       name: "Tamil",         flag: "🇮🇳", description: "Tamil script (தமிழ்)." },
  { code: "te",       name: "Telugu",        flag: "🇮🇳", description: "Telugu script (తెలుగు)." },
  { code: "kn",       name: "Kannada",       flag: "🇮🇳", description: "Kannada script (ಕನ್ನಡ)." },
  { code: "bn",       name: "Bengali",       flag: "🇮🇳", description: "Bengali script (বাংলা)." },
  { code: "gu",       name: "Gujarati",      flag: "🇮🇳", description: "Gujarati script (ગુજરાતી)." },
  { code: "mr",       name: "Marathi",       flag: "🇮🇳", description: "Devanagari script (मराठी)." },
  { code: "pa",       name: "Punjabi",       flag: "🇮🇳", description: "Gurmukhi script (ਪੰਜਾਬੀ)." },
  { code: "ur",       name: "Urdu",          flag: "🇵🇰", description: "Arabic Nastaliq script (اردو)." },
  { code: "ne",       name: "Nepali",        flag: "🇳🇵", description: "Devanagari script (नेपाली)." },
  { code: "sd",       name: "Sindhi",        flag: "🇵🇰", description: "Arabic script (سنڌي)." },
  { code: "ps",       name: "Pushto",        flag: "🇦🇫", description: "Arabic script (پښتو)." },
  { code: "ms",       name: "Malay",         flag: "🇲🇾", description: "Latin script (Bahasa Melayu)." },
];

// Languages valid as primary in dual mode (regional, not auto/hinglish)
export const DUAL_PRIMARY_LANGUAGES = LANGUAGES.filter(
  (l) => !["auto", "en", "hinglish"].includes(l.code)
);
// Secondary is always English in dual mode
export const DUAL_SECONDARY = LANGUAGES.find((l) => l.code === "en")!;

// ─────────────────────────────────────────────
// Dropdown sub-component
// ─────────────────────────────────────────────
function LangDropdown({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  options: typeof LANGUAGES;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((l) => l.code === value) ?? options[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="flex-1 min-w-0 relative">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 px-0.5">
        {label}
      </p>

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 text-left
          ${disabled
            ? "bg-zinc-900/30 border-zinc-800/50 opacity-50 cursor-not-allowed"
            : open
            ? "bg-accent/10 border-accent/40 shadow-[0_0_0_3px_rgba(94,106,210,0.12)]"
            : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 cursor-pointer"
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="font-semibold text-sm text-white truncate">{selected.name}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
              {options.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { onChange(lang.code); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors duration-100 text-left
                    ${lang.code === value
                      ? "bg-accent/15 text-white"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <span className="text-base leading-none w-5 text-center">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{lang.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{lang.description}</div>
                  </div>
                  {lang.code === value && (
                    <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main LanguageSelector
// ─────────────────────────────────────────────
interface LanguageSelectorProps {
  value: LanguageConfig;
  onChange: (config: LanguageConfig) => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const isDual = value.mode === "dual";

  const setMode = (mode: "single" | "dual") => {
    if (mode === "dual") {
      onChange({
        mode: "dual",
        dualLanguage: { primary: value.language ?? "ml", secondary: "en" },
      });
    } else {
      onChange({
        mode: "single",
        language: value.dualLanguage?.primary ?? "en",
      });
    }
  };

  const currentSingle = value.language ?? "en";
  const currentPrimary = value.dualLanguage?.primary ?? "ml";
  const currentSecondary = value.dualLanguage?.secondary ?? "en";

  const singleLang = LANGUAGES.find((l) => l.code === currentSingle);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-semibold text-zinc-300">Transcription Language</span>
        </div>

        {/* Mode toggle pill */}
        <div
          className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-0.5 gap-0.5"
          role="group"
          aria-label="Language mode"
        >
          <button
            type="button"
            id="lang-mode-single"
            onClick={() => setMode("single")}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 flex items-center gap-1.5
              ${!isDual
                ? "bg-accent text-white shadow-lg shadow-accent/30"
                : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Globe className="w-3 h-3" />
            Single
          </button>
          <button
            type="button"
            id="lang-mode-dual"
            onClick={() => setMode("dual")}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 flex items-center gap-1.5
              ${isDual
                ? "bg-accent text-white shadow-lg shadow-accent/30"
                : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Layers className="w-3 h-3" />
            Multilingual
          </button>
        </div>
      </div>

      {/* Selector panel */}
      <AnimatePresence mode="wait">
        {!isDual ? (
          // ── Single language ──────────────────────────────────────
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <LangDropdown
              id="lang-single"
              label="Language"
              value={currentSingle}
              options={LANGUAGES}
              onChange={(code) => onChange({ mode: "single", language: code })}
            />
            {singleLang && (
              <motion.p
                key={singleLang.code}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-zinc-500 text-center leading-relaxed px-2"
              >
                {singleLang.flag} {singleLang.description}
              </motion.p>
            )}
          </motion.div>
        ) : (
          // ── Dual language ────────────────────────────────────────
          <motion.div
            key="dual"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            {/* Info banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-accent/8 border border-accent/20">
              <Layers className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-accent/90">Dual API Transcription</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  We run two parallel Deepgram calls and pick the best words per 500ms window using confidence scores — perfect for code-mixed speech.
                </p>
              </div>
            </div>

            {/* Two dropdowns side by side */}
            <div className="flex gap-3">
              <LangDropdown
                id="lang-primary"
                label="Primary (Regional)"
                value={currentPrimary}
                options={DUAL_PRIMARY_LANGUAGES}
                onChange={(code) =>
                  onChange({
                    mode: "dual",
                    dualLanguage: { primary: code, secondary: currentSecondary },
                  })
                }
              />

              {/* Arrow connector */}
              <div className="flex flex-col items-center justify-end pb-2.5 gap-1 flex-shrink-0">
                <div className="w-px h-4 bg-zinc-800" />
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <span className="text-[10px] text-zinc-500 font-bold">+</span>
                </div>
                <div className="w-px h-4 bg-zinc-800" />
              </div>

              <LangDropdown
                id="lang-secondary"
                label="Secondary"
                value={currentSecondary}
                options={[DUAL_SECONDARY]}
                onChange={() => {}} // fixed to English
                disabled={true}
              />
            </div>

            {/* Dynamic description */}
            <motion.div
              key={currentPrimary}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 text-center"
            >
              <span>
                {DUAL_PRIMARY_LANGUAGES.find((l) => l.code === currentPrimary)?.flag}
                {" "}{DUAL_PRIMARY_LANGUAGES.find((l) => l.code === currentPrimary)?.name}
              </span>
              <span className="text-zinc-700">×</span>
              <span>🇬🇧 English</span>
              <span className="text-zinc-700">·</span>
              <span className="text-accent/70">Confidence-merged</span>
            </motion.div>

            {/* Cost note */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
              <X className="w-3 h-3" />
              <span>Uses 2× transcription credits — both calls run simultaneously</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
