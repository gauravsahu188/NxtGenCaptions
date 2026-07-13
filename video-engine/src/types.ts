// ─── Caption Data Types ───────────────────────────────────────────────────────

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;   // seconds
  /** Set by annotateWords() when word is in segment.emphasisWords */
  isEmphasized?: boolean;
  /** Set by annotateWords() when word is in segment.highlightWords */
  isHighlighted?: boolean;
}

/** Per-segment style override — layout + colors only */
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
  /** Words rendered with emphasisColor */
  emphasisWords?: string[];
  /** Words rendered with highlightColor */
  highlightWords?: string[];
  /** Per-segment template + color override */
  segmentOverride?: SegmentStyleOverride;
}

// ─── Style / Template Types ───────────────────────────────────────────────────

export interface CaptionStyleProps {
  primaryColor: string;
  emphasisColor: string;
  /** NEW: second accent colour for per-word highlight (default #FACC15 yellow) */
  highlightColor: string;
  layout:
    | "center" | "modern" | "bubble" | "hormozi" | "ali-abdaal"
    | "gadzhi" | "apple" | "mogrt-shimmer-stack" | "nxtgen-genz"
    | "nxtgen-alpha" | "nxtgen-horror" | "nxtgen-cinemaline"
    | "nxtgen-directors-edition" | "nxtgen-viral" | "nxtgen-energetic"
    | "top" | "bottom" | string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  positionX: number;
  positionY: number;
  width: number;
  letterSpacing: number;
  lineSpacing: number;
  textAlignment: "left" | "center" | "right" | string;
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
  aliAbdaalPosition: "left" | "right" | "center" | string;
  kineticLayout: "center" | string;
  transitionTarget: "line" | "word" | string;
  transitionType: "none" | "fade" | "pop" | "zoom" | "scale" | "slide-x" | "slide-y" | string;
  dynamicSpeed: boolean;
  cutoutVideoUrl?: string;
  // legacy / fallback
  template?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  glowColor?: string;
  borderRadius?: number;
  alphaChannel?: boolean;
  previewWidth?: number;
  animationEnabled?: boolean;
}

// ─── Root Composition Props ───────────────────────────────────────────────────

export interface CaptionVideoProps {
  /** Path or public URL of the source video */
  src: string;
  durationInSeconds: number;
  captions: CaptionSegment[];
  style: CaptionStyleProps;
  width?: number;
  height?: number;
  fps?: number;
  showWatermark?: boolean;
}
