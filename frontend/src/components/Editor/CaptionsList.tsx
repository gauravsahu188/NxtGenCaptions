"use client";
import React, { useState, useCallback } from "react";
import { useCaptionContext, CaptionSegment } from "../../context/CaptionContext";
import {
  Search, Settings2, Layout, Loader2, Wand2, Mic, FileAudio,
  Eraser, AlignJustify, Minus, ChevronDown, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../Loader";

const LINES_OPTIONS = ["1 Line", "2 Lines", "3 Lines"];

/** Parse the label into a numeric count */
const parseLines = (label: string) => parseInt(label.split(" ")[0], 10) || 1;

export default function CaptionsList() {
  const { captions, setCaptions, isProcessing, processingMessage, originalWords, wordsPerLine, setWordsPerLine, maxChars, setMaxChars, linesOption, setLinesOption, resegmentWithLines } = useCaptionContext();

  // Caption Tools panel state
  const [showTools, setShowTools] = useState(false);
  const [showLinesDropdown, setShowLinesDropdown] = useState(false);

  // Action toggles
  const [removePunctuation, setRemovePunctuation] = useState(false);
  const [removeEmphasis, setRemoveEmphasis] = useState(false);
  const [removeGaps, setRemoveGaps] = useState(false);

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
  const applyRemovePunctuation = useCallback((enabled: boolean) => {
    setRemovePunctuation(enabled);
    if (!enabled) return;
    setCaptions(
      captions.map((c) => {
        const clean = c.text.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
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
  }, [captions, setCaptions]);

  /** Remove ALL-CAPS or *asterisk* emphasis markers */
  const applyRemoveEmphasis = useCallback((enabled: boolean) => {
    setRemoveEmphasis(enabled);
    if (!enabled) return;
    setCaptions(
      captions.map((c) => {
        // normalise ALLCAPS words and strip asterisks/underscores
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
  }, [captions, setCaptions]);

  /**
   * Remove Gaps — re-sequence captions so there is no dead time between them.
   * Each caption's end becomes the next caption's start.
   */
  const applyRemoveGaps = useCallback((enabled: boolean) => {
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
  }, [captions, setCaptions]);

  // Deprecated — kept as no-op so existing action callbacks still compile
  const applyWordsPerLine = (val: string) => {
    setWordsPerLine(val === "Default" ? "auto" : parseInt(val, 10));
  };

  // ----- Loading icon helper -----
  const getLoadingIcon = () => {
    if (processingMessage.includes("Extracting")) return <FileAudio className="w-5 h-5 text-sky-400" />;
    if (processingMessage.includes("Enhancing") || processingMessage.includes("Clean")) return <Wand2 className="w-5 h-5 text-purple-400" />;
    return <Mic className="w-5 h-5 text-sky-400" />;
  };

  // ----- Toggle switch component (inline) -----
  const Toggle = ({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!active)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${active ? "bg-sky-500 shadow-lg shadow-sky-500/30" : "bg-white/10"}`}
    >
      <motion.div
        animate={{ x: active ? 26 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
      />
    </button>
  );

  return (
    <div className="flex-1 glass-panel flex flex-col min-h-0 font-sans relative z-20 bg-transparent">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white tracking-tight">Captions</h2>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Dialogue Timeline</span>
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
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Words / Line</span>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      {/* Decrement */}
                      <button
                        onClick={() => {
                          const next = wordsPerLine === "auto" ? 6 : Math.max(1, wordsPerLine - 1);
                          setWordsPerLine(next);
                          resegmentWithLines(next, maxChars, linesOption);
                        }}
                        className="px-2 py-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors text-sm font-black leading-none"
                      >−</button>
                      {/* Value display / input */}
                      <input
                        type="text"
                        readOnly
                        value={wordsPerLine === "auto" ? "Auto" : String(wordsPerLine)}
                        className="flex-1 min-w-0 bg-transparent text-xs font-black text-white text-center focus:outline-none cursor-default py-2"
                      />
                      {/* Increment */}
                      <button
                        onClick={() => {
                          const next = wordsPerLine === "auto" ? 7 : wordsPerLine + 1;
                          setWordsPerLine(next);
                          resegmentWithLines(next, maxChars, linesOption);
                        }}
                        className="px-2 py-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors text-sm font-black leading-none"
                      >+</button>
                    </div>
                    {/* Reset to Auto */}
                    {wordsPerLine !== "auto" && (
                      <button
                        onClick={() => { setWordsPerLine("auto"); resegmentWithLines("auto", maxChars, linesOption); }}
                        className="w-full text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        ↺ Reset to Auto
                      </button>
                    )}
                  </div>

                  {/* Max chars */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Max Chars</span>
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
                      <button onClick={() => { setMaxChars(24); resegmentWithLines(wordsPerLine, 24, linesOption); }} className="text-zinc-600 hover:text-white transition-colors">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Lines */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Lines</span>
                    <div className="relative">
                      <button
                        onClick={() => { setShowLinesDropdown((v) => !v); }}
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
                                className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10 ${linesOption === opt ? "text-sky-400" : "text-zinc-300"}`}
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      action.active ? "bg-sky-500/20 text-sky-400" : "bg-white/5 text-zinc-500"
                    }`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-tight transition-colors ${action.active ? "text-white" : "text-zinc-300"}`}>
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
      <div className="flex-1 overflow-y-auto custom-scrollbar relative px-3 py-4">
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
                  Processing with NxtGen AI
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Caption items */}
        <div className="space-y-2">
          {captions.map((caption, index) => (
            <motion.div
              key={caption.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group relative"
            >
              <div className="flex gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 active:scale-[0.99] cursor-pointer">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <span className="text-[10px] font-black text-zinc-600 group-hover:text-sky-400 transition-colors">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="w-px flex-1 bg-zinc-800/60 my-1.5 min-h-[12px]" />
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                      {new Date(caption.start * 1000).toISOString().substr(14, 8)}
                    </span>
                    <div className="h-px w-2 bg-zinc-700" />
                    <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                      {new Date(caption.end * 1000).toISOString().substr(14, 8)}
                    </span>
                  </div>
                  <textarea
                    value={caption.text}
                    onChange={(e) => handleCaptionChange(caption.id, e.target.value)}
                    rows={1}
                    className="w-full bg-transparent text-white text-sm font-medium focus:outline-none resize-none min-h-[24px] selection:bg-sky-500/30"
                  />
                </div>
                <div className="flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                    <Layout className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

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
                Upload a video to start the AI transcription engine.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
