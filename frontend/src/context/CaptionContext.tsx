"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
}

export interface CaptionStyle {
  primaryColor: string;
  emphasisColor: string;
  layout: "center" | "modern" | "holo" | "bubble" | "hormozi" | "ali-abdaal" | "gadzhi" | "apple" | "mogrt-shimmer-stack" | "nxtgen-genz" | "nxtgen-alpha" | "nxtgen-vengence" | "nxtgen-horror" | "nxtgen-cinemaline";
  // Text Tab Properties
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  positionX: number;
  positionY: number;
  width: number; // percentage width relative to container
  letterSpacing: number;
  lineSpacing: number;
  textAlignment: "left" | "center" | "right";
  dropShadow: boolean;
  dropShadowColor: string;
  dropShadowOpacity: number;
  // Modern Caption Properties
  emphasisWords: boolean;
  emphasisGlow: boolean;
  emphasisGlowColor: string;
  emphasisGlowIntensity: number;
  // Bubble Template Properties
  bubblePrimaryColor: string;
  bubbleSecondaryColor: string;
  bubbleTertiaryColor: string;
  // Additional Template Properties
  spotlightColor: string;
  aliAbdaalPosition: "left" | "right";
  kineticLayout: "center";
  // Transitions Tab Properties
  transitionTarget: "line" | "word";
  transitionType: "none" | "fade" | "pop" | "zoom" | "scale" | "slide-x" | "slide-y";
  dynamicSpeed: boolean;
  alphaChannel?: boolean;
  srtExport?: boolean;
  cutoutVideoUrl?: string;
  /**
   * The actual pixel width of the video preview element in the editor.
   * Set when the video element loads/resizes. Used by Remotion to scale
   * captions proportionally (renderScale = renderWidth / previewWidth).
   */
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
}

const CaptionContext = createContext<CaptionContextProps | undefined>(undefined);

export const CaptionProvider = ({ children }: { children: ReactNode }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
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
    aliAbdaalPosition: "center" as any, // default fallback, will be overwritten by template
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

  const resegment = React.useCallback(
    (wpl: number | "auto", chars: number, source?: typeof originalWords) => {
      const pool = source ?? originalWords;
      if (pool.length === 0) return;

      const segments: CaptionSegment[] = [];
      let i = 0;
      let segIndex = 0;

      while (i < pool.length) {
        let chunk: typeof pool = [];

        if (wpl === "auto") {
          while (i < pool.length) {
            const prospective = [...chunk, pool[i]];
            const txt = prospective.map((w) => w.word).join(" ");
            
            // Intelligent auto mode based on speech speed
            const chunkDuration = prospective[prospective.length - 1].end - prospective[0].start;
            let avgWordDuration = chunkDuration > 0 
              ? chunkDuration / prospective.length 
              : (pool[i].end - pool[i].start);
              
            if (avgWordDuration <= 0) avgWordDuration = 0.3;

            let dynamicMaxWords = 3;
            if (avgWordDuration >= 0.5) {
              dynamicMaxWords = 1;
            } else if (avgWordDuration >= 0.35) {
              dynamicMaxWords = 2;
            }
            
            const hitChar = txt.length > chars && chunk.length > 0;
            const hitPunct = chunk.length > 0 && /[.!?]$/.test(pool[i - 1]?.word ?? "");
            const hitMax = chunk.length >= dynamicMaxWords;
            
            if (hitChar || hitPunct || hitMax) break;
            chunk.push(pool[i++]);
          }
          if (chunk.length === 0 && i < pool.length) chunk.push(pool[i++]);
        } else {
          chunk = pool.slice(i, i + (wpl as number));
          i += (wpl as number);
        }

        if (chunk.length === 0) break;

        segments.push({
          id: `seg-${segIndex++}`,
          start: chunk[0].start,
          end: chunk[chunk.length - 1].end,
          text: chunk.map((w) => w.word).join(" "),
          words: chunk,
        });
      }

      setCaptions(segments as any);
    },
    [originalWords]
  );

  const resegmentWithLines = React.useCallback(
    (wpl: number | "auto", chars: number, linesLabel: string) => {
      const parseLines = (label: string) => parseInt(label.split(" ")[0], 10) || 1;
      const numLines = parseLines(linesLabel);
      if (wpl === "auto" || numLines === 1) {
        resegment(wpl, chars);
      } else {
        resegment((wpl as number) * numLines, chars);
      }
    },
    [resegment]
  );

  const activeCaption =
    captions.find(
      (c) => currentTime >= c.start && currentTime <= c.end
    ) || null;

  return (
    <CaptionContext.Provider
      value={{
        videoUrl,
        setVideoUrl,
        captions,
        setCaptions: setCaptions as any,
        originalWords,
        setOriginalWords,
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        activeCaption,
        duration,
        setDuration,
        isProcessing,
        setIsProcessing,
        processingMessage,
        setProcessingMessage,
        captionStyle,
        setCaptionStyle,
        s3Key,
        setS3Key,
        aspectRatio,
        setAspectRatio,
        originalVideoWidth,
        setOriginalVideoWidth,
        originalVideoHeight,
        setOriginalVideoHeight,
        wordsPerLine,
        setWordsPerLine,
        maxChars,
        setMaxChars,
        linesOption,
        setLinesOption,
        resegmentWithLines,
      }}
    >
      {children}
    </CaptionContext.Provider>
  );
};

export const useCaptionContext = () => {
  const context = useContext(CaptionContext);
  if (!context) {
    throw new Error("useCaptionContext must be used within a CaptionProvider");
  }
  return context;
};
