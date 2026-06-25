"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useCaptionContext, CaptionSegment } from "../../context/CaptionContext";
import {
  Search, Settings2, Layout, Loader2, Wand2, Mic, FileAudio,
  Eraser, AlignJustify, Minus, ChevronDown, RotateCcw, Clock, Type as TypeIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../Loader";

const LINES_OPTIONS = ["1 Line", "2 Lines", "3 Lines"];

/** Parse the label into a numeric count */
const parseLines = (label: string) => parseInt(label.split(" ")[0], 10) || 1;

/** Format seconds to MM:SS.ms (e.g. 01:23.450) */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

/** Duration badge text */
function formatDuration(start: number, end: number): string {
  const d = Math.max(0, end - start);
  if (d < 1) return `${Math.round(d * 1000)}ms`;
  return `${d.toFixed(2)}s`;
}

/**
 * Render caption text with emphasis words (*word*) highlighted.
 * Returns an array of styled spans.
 */
function RichCaptionText({
  text,
  emphasisColor = "#4ADE80",
}: {
  text: string;
  emphasisColor?: string;
}) {
  // Split on *word* markers, keep delimiters
  const parts = text.split(/(\*[^*]+\*)/g);

  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
        if (/^\*[^*]+\*$/.test(part)) {
          const word = part.slice(1, -1);
          return (
            <span
              key={i}
              className="font-black relative"
              style={{ color: emphasisColor }}
            >
              {/* Subtle glow behind emphasis words */}
              <span
                className="absolute inset-0 blur-sm opacity-30 rounded"
                style={{ backgroundColor: emphasisColor }}
              />
              <span className="relative">{word}</span>
            </span>
          );
        }
        return (
          <span key={i} className="text-white">
            {part}
          </span>
        );
      })}
    </span>
  );
}

/** Check if a caption text has any emphasis words */
function hasEmphasis(text: string): boolean {
  return /\*[^*]+\*/.test(text);
}

/** Count emphasis words in text */
function countEmphasis(text: string): number {
  return (text.match(/\*[^*]+\*/g) || []).length;
}

export default function CaptionsList() {
  const {
    captions,
    setCaptions,
    isProcessing,
    processingMessage,
    originalWords,
    wordsPerLine,
    setWordsPerLine,
    maxChars,
    setMaxChars,
    linesOption,
    setLinesOption,
    resegmentWithLines,
    currentTime,
    captionStyle,
  } = useCaptionContext();

  // Caption Tools panel state
  const [showTools, setShowTools] = useState(false);
  const [showLinesDropdown, setShowLinesDropdown] = useState(false);

  // Action toggles
  const [removePunctuation, setRemovePunctuation] = useState(false);
  const [removeEmphasis, setRemoveEmphasis] = useState(false);
  const [removeGaps, setRemoveGaps] = useState(false);

  // Track active caption index for auto-scroll
  const activeCaptionRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Find active caption (currently playing)
  const activeCaptionIndex = captions.findIndex(
    (c) => currentTime >= c.start && currentTime <= c.end
  );

  // Auto-scroll to active caption
  useEffect(() => {
    if (activeCaptionRef.current && listRef.current) {
      activeCaptionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeCaptionIndex]);

  // ----- Caption text editing -----
  const handleCaptionChange = (id: string, newText: string) => {
    setCaptions(
      captions.map((c) => {
        if (c.id !== id) return c;
        const rawWords = newText.split(" ");
        const timePerWord = (c.end - c.start) / Math.max(rawWords.length, 1);
        const newWords = rawWords.map((word, wi) => ({
          word,
          start: c.start + wi * timePerWord,
          end: c.start + (wi + 1) * timePerWord,
        }));
        return { ...c, text: newText, words: newWords };
      })
    );
  };

  // ----- Caption Tools Actions -----

  /** Strip all punctuation from every caption */
  const applyRemovePunctuation = useCallback(
    (enabled: boolean) => {
      setRemovePunctuation(enabled);
      if (!enabled) return;
      setCaptions(
        captions.map((c) => {
          const clean = c.text.replace(/[^\w\s*]/g, "").replace(/\s+/g, " ").trim();
          const rawWords = clean.split(" ");
          const timePerWord = (c.end - c.start) / Math.max(rawWords.length, 1);
          return {
            ...c,
            text: clean,
            words: rawWords.map((word, wi) => ({
              word,
              start: c.start + wi * timePerWord,
              end: c.start + (wi + 1) * timePerWord,
            })),
          };
        })
      );
    },
    [captions, setCaptions]
  );

  /** Remove ALL-CAPS or *asterisk* emphasis markers */
  const applyRemoveEmphasis = useCallback(
    (enabled: boolean) => {
      setRemoveEmphasis(enabled);
      if (!enabled) return;
      setCaptions(
        captions.map((c) => {
          const clean = c.text
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/_([^_]+)_/g, "$1")
            .replace(/\b[A-Z]{2,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
            .trim();
          const rawWords = clean.split(" ");
          const timePerWord = (c.end - c.start) / Math.max(rawWords.length, 1);
          return {
            ...c,
            text: clean,
            words: rawWords.map((word, wi) => ({
              word,
              start: c.start + wi * timePerWord,
              end: c.start + (wi + 1) * timePerWord,
            })),
          };
        })
      );
    },
    [captions, setCaptions]
  );

  /**
   * Remove Gaps — re-sequence captions so there is no dead time between them.
   */
  const applyRemoveGaps = useCallback(
    (enabled: boolean) => {
      setRemoveGaps(enabled);
      if (!enabled || captions.length < 2) return;
      const sorted = [...captions].sort((a, b) => a.start - b.start);
      const gapless: CaptionSegment[] = sorted.map((c, i) => {
        if (i === 0) return c;
        const prev = sorted[i - 1];
        const duration = c.end - c.start;
        const newStart = prev.end;
        const newEnd = newStart + duration;
        const rawWords = c.words.map((w, wi) => ({
          ...w,
          start: newStart + (wi / c.words.length) * duration,
          end: newStart + ((wi + 1) / c.words.length) * duration,
        }));
        return { ...c, start: newStart, end: newEnd, words: rawWords };
      });
      setCaptions(gapless);
    },
    [captions, setCaptions]
  );

  // ----- Loading icon helper -----
  const getLoadingIcon = () => {
    if (processingMessage.includes("Extracting")) return <FileAudio className="w-5 h-5 text-sky-400" />;
    if (processingMessage.includes("Enhancing") || processingMessage.includes("Clean"))
      return <Wand2 className="w-5 h-5 text-purple-400" />;
    return <Mic className="w-5 h-5 text-sky-400" />;
  };

  // ----- Toggle switch component (inline) -----
  const Toggle = ({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!active)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
        active ? "bg-sky-500 shadow-lg shadow-sky-500/30" : "bg-white/10"
      }`}
    >
      <motion.div
        animate={{ x: active ? 26 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
      />
    </button>
  );

  // Emphasis colour from captionStyle (or default green)
  const emphasisColor = captionStyle?.emphasisColor || "#4ADE80";

  return (
    <div className="flex-1 glass-panel flex flex-col min-h-0 font-sans relative z-20 bg-transparent">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white tracking-tight">Captions</h2>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {captions.length > 0
              ? `${captions.length} segments · Sarvam AI`
              : "Dialogue Timeline"}
          </span>
        </div>
        {!isProcessing && (
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95">
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTools((v) => !v)}
              className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 ${
                showTools
                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                  : "bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Caption Tools
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTools ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {/* Caption Tools Panel */}
      <AnimatePresence>
        {showTools && !isProcessing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-y-auto max-h-[300px] custom-scrollbar border-b border-white/5"
          >
            <div className="p-5 space-y-6 bg-white/2">
              {/* ── DISPLAY SETTINGS ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                    Display Settings
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Words per line — live stepper */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Words / Line
                    </span>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          const next =
                            wordsPerLine === "auto" ? 6 : Math.max(1, wordsPerLine - 1);
                          setWordsPerLine(next);
                          resegmentWithLines(next, maxChars, linesOption);
                        }}
                        className="px-2 py-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors text-sm font-black leading-none"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={wordsPerLine === "auto" ? "Auto" : String(wordsPerLine)}
                        className="flex-1 min-w-0 bg-transparent text-xs font-black text-white text-center focus:outline-none cursor-default py-2"
                      />
                      <button
                        onClick={() => {
                          const next = wordsPerLine === "auto" ? 7 : wordsPerLine + 1;
                          setWordsPerLine(next);
                          resegmentWithLines(next, maxChars, linesOption);
                        }}
                        className="px-2 py-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors text-sm font-black leading-none"
                      >
                        +
                      </button>
                    </div>
                    {wordsPerLine !== "auto" && (
                      <button
                        onClick={() => {
                          setWordsPerLine("auto");
                          resegmentWithLines("auto", maxChars, linesOption);
                        }}
                        className="w-full text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        ↺ Reset to Auto
                      </button>
                    )}
                  </div>

                  {/* Max chars */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Max Chars
                    </span>
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <span className="text-xs text-zinc-500 font-serif italic">T</span>
                      <input
                        type="number"
                        min={8}
                        max={80}
                        value={maxChars}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setMaxChars(v);
                          resegmentWithLines(wordsPerLine, v, linesOption);
                        }}
                        className="flex-1 w-full bg-transparent text-xs font-bold text-white text-center focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          setMaxChars(24);
                          resegmentWithLines(wordsPerLine, 24, linesOption);
                        }}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Lines */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Lines
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowLinesDropdown((v) => !v)}
                        className="w-full flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                      >
                        <AlignJustify className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="flex-1 text-left truncate">{linesOption}</span>
                        <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                      </button>
                      <AnimatePresence>
                        {showLinesDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            className="absolute top-full mt-1 right-0 w-36 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl"
                          >
                            {LINES_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setLinesOption(opt);
                                  setShowLinesDropdown(false);
                                  resegmentWithLines(wordsPerLine, maxChars, opt);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10 ${
                                  linesOption === opt ? "text-sky-400" : "text-zinc-300"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── ACTIONS ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Actions
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {[
                  {
                    icon: <Eraser className="w-4 h-4" />,
                    label: "Remove Punctuation",
                    desc: "Strip all punctuation for a cleaner, minimal look",
                    active: removePunctuation,
                    onChange: applyRemovePunctuation,
                  },
                  {
                    icon: <Minus className="w-4 h-4" />,
                    label: "Remove Emphasis",
                    desc: "Remove all text emphasis for uniform appearance",
                    active: removeEmphasis,
                    onChange: applyRemoveEmphasis,
                  },
                  {
                    icon: <AlignJustify className="w-4 h-4" />,
                    label: "Remove Gaps in Captions",
                    desc: "Eliminate gaps between captions for seamless flow",
                    active: removeGaps,
                    onChange: applyRemoveGaps,
                  },
                ].map((action) => (
                  <div
                    key={action.label}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      action.active
                        ? "bg-sky-500/5 border-sky-500/20"
                        : "bg-white/3 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        action.active ? "bg-sky-500/20 text-sky-400" : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold leading-tight transition-colors ${
                          action.active ? "text-white" : "text-zinc-300"
                        }`}
                      >
                        {action.label}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{action.desc}</p>
                    </div>
                    <Toggle active={action.active} onChange={action.onChange} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captions List */}
      <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar relative px-3 py-4">
        {/* Full-screen loader when 0 captions */}
        {isProcessing && captions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50 bg-[#050505]/80 backdrop-blur-sm"
          >
            <Loader />
            <div className="mt-8 space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">{processingMessage}</h3>
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                  Processing with Sarvam AI
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Caption items */}
        <div className="space-y-2">
          {captions.map((caption, index) => {
            const isActive = index === activeCaptionIndex;
            const emphasisCount = countEmphasis(caption.text);
            const hasEmph = emphasisCount > 0;

            return (
              <motion.div
                key={caption.id}
                ref={isActive ? activeCaptionRef : null}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                className="group relative"
              >
                <div
                  className={`relative flex gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-sky-500/8 border-sky-500/30 shadow-lg shadow-sky-500/5"
                      : "bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBar"
                      className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-sky-400"
                      style={{ boxShadow: "0 0 8px #38bdf8" }}
                    />
                  )}

                  {/* Left: index + connector */}
                  <div className="flex flex-col items-center pt-0.5 shrink-0 w-6">
                    <span
                      className={`text-[10px] font-black transition-colors ${
                        isActive ? "text-sky-400" : "text-zinc-600 group-hover:text-sky-400"
                      }`}
                    >
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div
                      className={`w-px flex-1 my-1.5 min-h-[10px] transition-colors ${
                        isActive ? "bg-sky-500/40" : "bg-zinc-800/60"
                      }`}
                    />
                  </div>

                  {/* Right: timestamps + text */}
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Timestamp row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                            isActive
                              ? "text-sky-300 bg-sky-500/10"
                              : "text-zinc-500 bg-white/5"
                          }`}
                        >
                          {formatTime(caption.start)}
                        </span>
                        <span className="text-zinc-700 text-[9px]">→</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                            isActive
                              ? "text-sky-300 bg-sky-500/10"
                              : "text-zinc-500 bg-white/5"
                          }`}
                        >
                          {formatTime(caption.end)}
                        </span>
                      </div>

                      {/* Duration badge */}
                      <span className="text-[9px] font-mono text-zinc-700 bg-white/3 px-1.5 py-0.5 rounded">
                        {formatDuration(caption.start, caption.end)}
                      </span>

                      {/* Emphasis badge */}
                      {hasEmph && (
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{
                            color: emphasisColor,
                            backgroundColor: `${emphasisColor}18`,
                          }}
                        >
                          ✦ {emphasisCount} emphasis
                        </span>
                      )}
                    </div>

                    {/* Caption text — rich rendered (read view) + plain textarea (edit view) */}
                    <div className="relative">
                      {/* Rich preview (always shown, click to edit) */}
                      <div className="text-sm font-semibold leading-snug select-none pointer-events-none">
                        <RichCaptionText text={caption.text} emphasisColor={emphasisColor} />
                      </div>
                      {/* Editable textarea overlaid (transparent, actual editing target) */}
                      <textarea
                        value={caption.text}
                        onChange={(e) => handleCaptionChange(caption.id, e.target.value)}
                        rows={1}
                        className="absolute inset-0 w-full bg-transparent text-transparent caret-white text-sm font-semibold focus:outline-none resize-none selection:bg-sky-500/30 leading-snug"
                        spellCheck={false}
                      />
                    </div>

                    {/* Word count */}
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="w-2.5 h-2.5 text-zinc-700" />
                      <span className="text-[9px] text-zinc-700 font-mono">
                        {caption.words?.length ?? caption.text.split(" ").length} words
                      </span>
                    </div>
                  </div>

                  {/* Action icon (hover) */}
                  <div className="flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                      <Layout className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Mini-loader when streaming more captions */}
          {isProcessing && captions.length > 0 && (
            <div className="p-4 flex items-center justify-center gap-3 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              {processingMessage}
            </div>
          )}

          {/* Empty state */}
          {!isProcessing && captions.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Mic className="w-6 h-6 text-zinc-700" />
              </div>
              <h4 className="text-white font-bold mb-1">No Captions Yet</h4>
              <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">
                Upload a video to start the Sarvam AI transcription engine.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
