"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface WordTiming {
  word: string;
  start: number;
  end: number;
  /** Derived: true when word is in segment.emphasisWords */
  isEmphasized?: boolean;
  /** Derived: true when word is in segment.highlightWords */
  isHighlighted?: boolean;
}

/** Per-segment style override — layout + colors only; inherits global font/size/position */
export interface SegmentStyleOverride {
  layout?: string;
  primaryColor?: string;
  emphasisColor?: string;
  highlightColor?: string;
  spotlightColor?: string;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
  /** Words to render with emphasisColor (green glow) */
  emphasisWords?: string[];
  /** Words to render with highlightColor (yellow burst) */
  highlightWords?: string[];
  /** Per-segment template + color override */
  segmentOverride?: SegmentStyleOverride;
}

export interface CaptionStyle {
  primaryColor: string;
  emphasisColor: string;
  /** NEW: second accent colour for per-word highlight chips (default yellow) */
  highlightColor: string;
  layout:
    | "center" | "modern" | "holo" | "bubble" | "hormozi"
    | "ali-abdaal" | "gadzhi" | "apple" | "mogrt-shimmer-stack"
    | "nxtgen-genz" | "nxtgen-alpha" | "nxtgen-vengence" | "nxtgen-horror"
    | "nxtgen-cinemaline" | "nxtgen-directors-edition" | "nxtgen-viral" | "nxtgen-energetic";
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  positionX: number;
  positionY: number;
  width: number;
  letterSpacing: number;
  lineSpacing: number;
  textAlignment: "left" | "center" | "right";
  dropShadow: boolean;
  dropShadowColor: string;
  dropShadowOpacity: number;
  emphasisWords: boolean;
  emphasisGlow: boolean;
  emphasisGlowColor: string;
  emphasisGlowIntensity: number;
  bubblePrimaryColor: string;
  bubbleSecondaryColor: string;
  bubbleTertiaryColor: string;
  spotlightColor: string;
  aliAbdaalPosition: "left" | "right";
  kineticLayout: "center";
  transitionTarget: "line" | "word";
  transitionType: "none" | "fade" | "pop" | "zoom" | "scale" | "slide-x" | "slide-y";
  dynamicSpeed: boolean;
  alphaChannel?: boolean;
  srtExport?: boolean;
  cutoutVideoUrl?: string;
  previewWidth?: number;
}

interface CaptionContextProps {
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  captions: CaptionSegment[];
  setCaptions: (captions: CaptionSegment[] | ((prev: CaptionSegment[]) => CaptionSegment[])) => void;
  originalWords: WordTiming[];
  setOriginalWords: (words: WordTiming[]) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  activeCaption: CaptionSegment | null;
  duration: number;
  setDuration: (time: number) => void;
  captionStyle: CaptionStyle;
  setCaptionStyle: React.Dispatch<React.SetStateAction<CaptionStyle>>;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  processingMessage: string;
  setProcessingMessage: (msg: string) => void;
  s3Key: string | null;
  setS3Key: (key: string | null) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  originalVideoWidth: number;
  setOriginalVideoWidth: (w: number) => void;
  originalVideoHeight: number;
  setOriginalVideoHeight: (h: number) => void;
  wordsPerLine: number | "auto";
  setWordsPerLine: (val: number | "auto") => void;
  maxChars: number;
  setMaxChars: (val: number) => void;
  linesOption: string;
  setLinesOption: (val: string) => void;
  resegmentWithLines: (wpl: number | "auto", chars: number, linesLabel: string) => void;
  /** Cycle a word through: normal → emphasis → highlight → normal */
  toggleWordEmphasis: (segmentId: string, word: string) => void;
  toggleWordHighlight: (segmentId: string, word: string) => void;
  /** Patch per-segment style override */
  updateSegmentOverride: (segmentId: string, patch: SegmentStyleOverride) => void;
  /** Clear per-segment style override → reverts to global */
  clearSegmentOverride: (segmentId: string) => void;
}

const CaptionContext = createContext<CaptionContextProps | undefined>(undefined);

/** Attach isEmphasized / isHighlighted flags to each WordTiming */
function annotateWords(seg: CaptionSegment): CaptionSegment {
  const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const emphSet = new Set((seg.emphasisWords ?? []).map(clean));
  const hlSet   = new Set((seg.highlightWords ?? []).map(clean));
  return {
    ...seg,
    words: seg.words.map(wt => ({
      ...wt,
      isEmphasized: emphSet.has(clean(wt.word)),
      isHighlighted: hlSet.has(clean(wt.word)),
    })),
  };
}

export const CaptionProvider = ({ children }: { children: ReactNode }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captions, setCaptionsRaw] = useState<CaptionSegment[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>("Initializing...");
  const [originalWords, setOriginalWords] = useState<WordTiming[]>([]);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [originalVideoWidth, setOriginalVideoWidth] = useState<number>(1280);
  const [originalVideoHeight, setOriginalVideoHeight] = useState<number>(720);

  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    primaryColor: "#FFFFFF",
    emphasisColor: "#4ADE80",
    highlightColor: "#FACC15",
    layout: "gadzhi",
    fontFamily: "Inter",
    fontWeight: "Light",
    fontSize: 24,
    positionX: 50.0,
    positionY: 75.6,
    width: 85,
    letterSpacing: 0,
    lineSpacing: 0.9,
    textAlignment: "center",
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowOpacity: 35,
    emphasisWords: true,
    emphasisGlow: true,
    emphasisGlowColor: "#4ADE80",
    emphasisGlowIntensity: 50,
    bubblePrimaryColor: "#FFFFFF",
    bubbleSecondaryColor: "#48A680",
    bubbleTertiaryColor: "#FFFFFF",
    spotlightColor: "#FFE600",
    aliAbdaalPosition: "center" as any,
    kineticLayout: "center",
    transitionTarget: "line",
    transitionType: "none",
    dynamicSpeed: true,
    alphaChannel: false,
    srtExport: false,
  });

  const [wordsPerLine, setWordsPerLine] = useState<number | "auto">("auto");
  const [maxChars, setMaxChars] = useState<number>(24);
  const [linesOption, setLinesOption] = useState<string>("1 Line");

  /** Wrap raw setter to always re-annotate words */
  const setCaptions = useCallback(
    (arg: CaptionSegment[] | ((prev: CaptionSegment[]) => CaptionSegment[])) => {
      setCaptionsRaw(prev => {
        const next = typeof arg === "function" ? arg(prev) : arg;
        return next.map(annotateWords);
      });
    },
    []
  );

  // ── Word emphasis ─────────────────────────────────────────────────────────
  const toggleWordEmphasis = useCallback((segmentId: string, word: string) => {
    const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
    setCaptionsRaw(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      const existing  = seg.emphasisWords ?? [];
      const isOn      = existing.some(w => clean(w) === clean(word));
      const emphasisWords  = isOn ? existing.filter(w => clean(w) !== clean(word)) : [...existing, word];
      // Remove from highlight if being added to emphasis
      const highlightWords = (seg.highlightWords ?? []).filter(w => clean(w) !== clean(word));
      return annotateWords({ ...seg, emphasisWords, highlightWords });
    }));
  }, []);

  // ── Word highlight ────────────────────────────────────────────────────────
  const toggleWordHighlight = useCallback((segmentId: string, word: string) => {
    const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
    setCaptionsRaw(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      const existing  = seg.highlightWords ?? [];
      const isOn      = existing.some(w => clean(w) === clean(word));
      const highlightWords = isOn ? existing.filter(w => clean(w) !== clean(word)) : [...existing, word];
      // Remove from emphasis if being added to highlight
      const emphasisWords  = (seg.emphasisWords ?? []).filter(w => clean(w) !== clean(word));
      return annotateWords({ ...seg, emphasisWords, highlightWords });
    }));
  }, []);

  // ── Per-segment override ──────────────────────────────────────────────────
  const updateSegmentOverride = useCallback((segmentId: string, patch: SegmentStyleOverride) => {
    setCaptionsRaw(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      return annotateWords({ ...seg, segmentOverride: { ...(seg.segmentOverride ?? {}), ...patch } });
    }));
  }, []);

  const clearSegmentOverride = useCallback((segmentId: string) => {
    setCaptionsRaw(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      const { segmentOverride: _removed, ...rest } = seg;
      return annotateWords(rest);
    }));
  }, []);

  // ── Resegment ─────────────────────────────────────────────────────────────
  const resegment = useCallback(
    (wpl: number | "auto", chars: number, source?: typeof originalWords) => {
      const pool = source ?? originalWords;
      if (pool.length === 0) return;

      const segments: CaptionSegment[] = [];
      let i = 0, segIndex = 0;

      while (i < pool.length) {
        let chunk: typeof pool = [];

        if (wpl === "auto") {
          while (i < pool.length) {
            const prospective = [...chunk, pool[i]];
            const txt = prospective.map(w => w.word).join(" ");
            const dur = prospective[prospective.length - 1].end - prospective[0].start;
            let avg = dur > 0 ? dur / prospective.length : (pool[i].end - pool[i].start);
            if (avg <= 0) avg = 0.3;
            let maxW = 3;
            if (avg >= 0.5) maxW = 1;
            else if (avg >= 0.35) maxW = 2;
            if ((txt.length > chars && chunk.length > 0) ||
                (chunk.length > 0 && /[.!?]$/.test(pool[i - 1]?.word ?? "")) ||
                chunk.length >= maxW) break;
            chunk.push(pool[i++]);
          }
          if (chunk.length === 0 && i < pool.length) chunk.push(pool[i++]);
        } else {
          chunk = pool.slice(i, i + (wpl as number));
          i += wpl as number;
        }

        if (chunk.length === 0) break;
        segments.push({
          id: `seg-${segIndex++}`,
          start: chunk[0].start,
          end: chunk[chunk.length - 1].end,
          text: chunk.map(w => w.word).join(" "),
          words: chunk,
        });
      }
      setCaptions(segments);
    },
    [originalWords, setCaptions]
  );

  const resegmentWithLines = useCallback(
    (wpl: number | "auto", chars: number, linesLabel: string) => {
      const numLines = parseInt(linesLabel.split(" ")[0], 10) || 1;
      if (wpl === "auto" || numLines === 1) resegment(wpl, chars);
      else resegment((wpl as number) * numLines, chars);
    },
    [resegment]
  );

  const activeCaption =
    captions.find(c => currentTime >= c.start && currentTime <= c.end) || null;

  return (
    <CaptionContext.Provider value={{
      videoUrl, setVideoUrl,
      captions,
      setCaptions: setCaptions as any,
      originalWords, setOriginalWords,
      currentTime, setCurrentTime,
      isPlaying, setIsPlaying,
      activeCaption,
      duration, setDuration,
      isProcessing, setIsProcessing,
      processingMessage, setProcessingMessage,
      captionStyle, setCaptionStyle,
      s3Key, setS3Key,
      aspectRatio, setAspectRatio,
      originalVideoWidth, setOriginalVideoWidth,
      originalVideoHeight, setOriginalVideoHeight,
      wordsPerLine, setWordsPerLine,
      maxChars, setMaxChars,
      linesOption, setLinesOption,
      resegmentWithLines,
      toggleWordEmphasis,
      toggleWordHighlight,
      updateSegmentOverride,
      clearSegmentOverride,
    }}>
      {children}
    </CaptionContext.Provider>
  );
};

export const useCaptionContext = () => {
  const ctx = useContext(CaptionContext);
  if (!ctx) throw new Error("useCaptionContext must be used within a CaptionProvider");
  return ctx;
};
