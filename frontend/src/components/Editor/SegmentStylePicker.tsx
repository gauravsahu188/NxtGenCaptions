"use client";
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Check } from "lucide-react";
import { SegmentStyleOverride } from "../../context/CaptionContext";

// ── Template registry matching all layouts in CaptionOverlay ─────────────────
export const TEMPLATE_LIST = [
  { id: "gadzhi",                   label: "Gadzhi",         emoji: "⚡" },
  { id: "bubble",                   label: "Bubble",          emoji: "💬" },
  { id: "hormozi",                  label: "Hormozi",         emoji: "🔥" },
  { id: "ali-abdaal",               label: "Ali Abdaal",      emoji: "✨" },
  { id: "apple",                    label: "Apple",           emoji: "🍎" },
  { id: "center",                   label: "Classic",         emoji: "📝" },
  { id: "modern",                   label: "Modern",          emoji: "🎨" },
  { id: "holo",                     label: "Holo",            emoji: "🌐" },
  { id: "mogrt-shimmer-stack",      label: "Shimmer",         emoji: "✦" },
  { id: "nxtgen-genz",              label: "Gen Z",           emoji: "🦋" },
  { id: "nxtgen-alpha",             label: "Alpha",           emoji: "📜" },
  { id: "nxtgen-horror",            label: "Horror",          emoji: "💀" },
  { id: "nxtgen-vengence",          label: "Vengence",        emoji: "⚔️" },
  { id: "nxtgen-cinemaline",        label: "Cinema",          emoji: "🎬" },
  { id: "nxtgen-directors-edition", label: "Director's Cut",  emoji: "🎥" },
  { id: "nxtgen-viral",             label: "Viral",           emoji: "📱" },
  { id: "nxtgen-energetic",         label: "Energetic",       emoji: "💥" },
] as const;

interface SegmentStylePickerProps {
  segmentId: string;
  currentOverride?: SegmentStyleOverride;
  globalLayout: string;
  emphasisColor: string;
  highlightColor: string;
  onUpdate: (patch: SegmentStyleOverride) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function SegmentStylePicker({
  segmentId,
  currentOverride,
  globalLayout,
  emphasisColor,
  highlightColor,
  onUpdate,
  onClear,
  onClose,
}: SegmentStylePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const activeLayout = currentOverride?.layout ?? globalLayout;
  const hasOverride  = !!currentOverride?.layout;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="absolute left-0 top-full mt-2 z-50 w-[280px] rounded-2xl border border-white/10 bg-[#111]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
          Segment Template
        </span>
        <div className="flex items-center gap-2">
          {hasOverride && (
            <button
              onClick={() => { onClear(); onClose(); }}
              className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
            >
              <RotateCcw className="w-3 h-3" />
              Use Global
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Template grid */}
      <div className="p-3 grid grid-cols-3 gap-1.5 max-h-[260px] overflow-y-auto custom-scrollbar">
        {TEMPLATE_LIST.map(t => {
          const isActive = activeLayout === t.id;
          const isGlobal = !hasOverride && globalLayout === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onUpdate({ layout: t.id })}
              className={`relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-center transition-all duration-150 border ${
                isActive
                  ? "bg-sky-500/15 border-sky-500/50 shadow-sm shadow-sky-500/20"
                  : "bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/15"
              }`}
            >
              <span className="text-lg leading-none">{t.emoji}</span>
              <span className={`text-[9px] font-bold leading-tight ${isActive ? "text-sky-300" : "text-zinc-400"}`}>
                {t.label}
              </span>
              {isGlobal && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-600" title="Global default" />
              )}
              {isActive && hasOverride && (
                <span className="absolute top-1 right-1">
                  <Check className="w-2.5 h-2.5 text-sky-400" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Color overrides */}
      <div className="px-4 py-3 border-t border-white/5 space-y-2">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
          Colour Override (optional)
        </span>
        <div className="flex gap-2">
          {/* Emphasis colour */}
          <label className="flex items-center gap-2 flex-1 cursor-pointer group">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 shrink-0">
              <input
                type="color"
                value={currentOverride?.emphasisColor ?? emphasisColor}
                onChange={e => onUpdate({ emphasisColor: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute inset-0 rounded-lg"
                style={{ background: currentOverride?.emphasisColor ?? emphasisColor }}
              />
            </div>
            <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 transition-colors">Emphasis</span>
          </label>
          {/* Highlight colour */}
          <label className="flex items-center gap-2 flex-1 cursor-pointer group">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 shrink-0">
              <input
                type="color"
                value={currentOverride?.highlightColor ?? highlightColor}
                onChange={e => onUpdate({ highlightColor: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute inset-0 rounded-lg"
                style={{ background: currentOverride?.highlightColor ?? highlightColor }}
              />
            </div>
            <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 transition-colors">Highlight</span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}
