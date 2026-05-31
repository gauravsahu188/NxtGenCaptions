"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Check, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Curated font list: shown at top as "Featured" before search results
// ─────────────────────────────────────────────────────────────────────────────
const FEATURED_FONTS = [
  { family: "Inter", category: "sans-serif", tags: ["modern", "minimal"] },
  { family: "Outfit", category: "sans-serif", tags: ["modern", "minimal"] },
  { family: "Space Grotesk", category: "sans-serif", tags: ["modern"] },
  { family: "DM Sans", category: "sans-serif", tags: ["minimal"] },
  { family: "Syne", category: "sans-serif", tags: ["bold", "display"] },
  { family: "Bebas Neue", category: "display", tags: ["bold", "caption"] },
  { family: "Barlow Condensed", category: "sans-serif", tags: ["caption"] },
  { family: "Montserrat", category: "sans-serif", tags: ["modern"] },
  { family: "Raleway", category: "sans-serif", tags: ["minimal"] },
  { family: "Oswald", category: "sans-serif", tags: ["bold", "caption"] },
  { family: "Nunito", category: "sans-serif", tags: ["minimal"] },
  { family: "Urbanist", category: "sans-serif", tags: ["modern", "minimal"] },
  { family: "Plus Jakarta Sans", category: "sans-serif", tags: ["modern"] },
  { family: "Archivo", category: "sans-serif", tags: ["minimal"] },
  { family: "Anton", category: "display", tags: ["bold", "caption"] },
];

interface FontItem {
  family: string;
  category: string;
}

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

// Inject a Google Fonts <link> tag for a given family (once per session)
const loadedFonts = new Set<string>();
function loadGoogleFont(family: string) {
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700;900&display=swap`;
  document.head.appendChild(link);
}

export default function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FontItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [previewFont, setPreviewFont] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Pre-load featured fonts on mount
  useEffect(() => {
    FEATURED_FONTS.forEach((f) => loadGoogleFont(f.family));
  }, []);

  // Load current value's font
  useEffect(() => {
    if (value) loadGoogleFont(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  // Debounced Google Fonts API search
  const searchFonts = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      // Google Fonts API — uses a public list (no key needed for the listing endpoint)
      const res = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=AIzaSyD6sUkfJIHnJeI3SmHW6dHquBSH6D3mOKY`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const matches: FontItem[] = (data.items as any[])
        .filter((f: any) => f.family.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 20)
        .map((f: any) => ({ family: f.family, category: f.category }));
      matches.forEach((f) => loadGoogleFont(f.family));
      setSearchResults(matches);
    } catch {
      // Fallback: filter from featured list only
      setSearchResults(
        FEATURED_FONTS.filter((f) =>
          f.family.toLowerCase().includes(q.toLowerCase())
        )
      );
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => searchFonts(query), 350);
    return () => clearTimeout(t);
  }, [query, searchFonts]);

  const selectFont = (family: string) => {
    loadGoogleFont(family);
    onChange(family);
    setOpen(false);
    setQuery("");
    setSearchResults([]);
    setPreviewFont(null);
  };

  const displayList = query.trim() ? searchResults : FEATURED_FONTS;

  return (
    <div ref={dropdownRef} className="relative flex-1">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex justify-between items-center text-sm font-bold text-white hover:bg-white/10 transition-colors group"
        style={{ fontFamily: `'${value}', sans-serif` }}
      >
        <span className="truncate">{value || "Select Font"}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-all shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-2 left-0 right-0 z-100 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ minWidth: "260px" }}
          >
            {/* Search bar */}
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search Google Fonts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs font-medium text-white placeholder-zinc-600 focus:outline-none"
              />
              {query && (
                <button onClick={() => { setQuery(""); setSearchResults([]); }} className="text-zinc-600 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {searching && (
                <div className="w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </div>

            {/* Section label */}
            {!query && (
              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  Featured — Modern & Minimal
                </span>
              </div>
            )}
            {query && searchResults.length === 0 && !searching && (
              <p className="px-4 py-4 text-xs text-zinc-500">No fonts found for "{query}"</p>
            )}

            {/* Font list */}
            <div className="overflow-y-auto max-h-72 custom-scrollbar py-1">
              {displayList.map((font) => {
                const isActive = font.family === value;
                const isPreviewing = font.family === previewFont;
                return (
                  <button
                    key={font.family}
                    onMouseEnter={() => { loadGoogleFont(font.family); setPreviewFont(font.family); }}
                    onMouseLeave={() => setPreviewFont(null)}
                    onClick={() => selectFont(font.family)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-all group ${
                      isActive
                        ? "bg-sky-500/10 text-sky-300"
                        : isPreviewing
                        ? "bg-white/5 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex flex-col items-start min-w-0">
                      <span
                        className="text-sm truncate max-w-[160px]"
                        style={{ fontFamily: `'${font.family}', sans-serif`, fontWeight: isActive ? 700 : 400 }}
                      >
                        {font.family}
                      </span>
                      {/* Preview sentence */}
                      {isPreviewing && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[160px]"
                          style={{ fontFamily: `'${font.family}', sans-serif` }}
                        >
                          The quick brown fox
                        </motion.span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {"tags" in font && (
                        <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                          {(font as typeof FEATURED_FONTS[0]).tags[0]}
                        </span>
                      )}
                      {isActive && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] text-zinc-700 font-medium">Powered by Google Fonts</span>
              <span className="text-[9px] text-zinc-700">{displayList.length} fonts</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
