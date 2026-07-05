// ─── Caption Data Types ───────────────────────────────────────────────────────

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
}

// ─── Style / Template Types ───────────────────────────────────────────────────

export interface CaptionStyleProps {
  primaryColor: string;
  emphasisColor: string;
  layout: "center" | "modern" | "bubble" | "hormozi" | "ali-abdaal" | "gadzhi" | "apple" | "mogrt-shimmer-stack" | "nxtgen-genz" | "nxtgen-alpha" | "nxtgen-horror" | "nxtgen-cinemaline" | "nxtgen-directors-edition" | "nxtgen-viral" | "nxtgen-energetic" | "top" | "bottom" | string;
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
  // some legacy properties to prevent typescript errors in other files:
  template?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  glowColor?: string;
  borderRadius?: number;
  alphaChannel?: boolean;
  /**
   * The actual pixel width at which the video was displayed in the editor preview.
   * Used by Remotion to compute renderScale = videoWidth / previewWidth,
   * ensuring the render output exactly matches the editor preview.
   * Measured from the video element's clientWidth at render time.
   */
  previewWidth?: number;
  animationEnabled?: boolean;
}

// ─── Root Composition Props ───────────────────────────────────────────────────

export interface CaptionVideoProps {
  /** Path or public URL of the source video (relative to the engine's cwd) */
  src: string;
  /** Total duration of the source video in seconds */
  durationInSeconds: number;
  /** All caption segments from Deepgram/Whisper */
  captions: CaptionSegment[];
  /** User-selected visual style */
  style: CaptionStyleProps;
  /** Video width (default 1280) */
  width?: number;
  /** Video height (default 720) */
  height?: number;
  /** FPS (default 30) */
  fps?: number;
  /** Show watermark for free plan (default true) */
  showWatermark?: boolean;
}
