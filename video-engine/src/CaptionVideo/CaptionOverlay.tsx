import React, { useState, useEffect } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  delayRender,
  continueRender,
} from "remotion";
import { CaptionSegment, CaptionStyleProps, WordTiming } from "../types";
import jaggyFont from "../assets/jaggy-w01-regular.ttf";
import chalkFont from "../assets/chalk-y.otf";
import bastligaFont from "../assets/bastliga/Bastliga One.ttf";
import droidFont from "../assets/droid-1997.otf";

// ─── Remotion Google Fonts — correct way to load fonts in headless Chromium ──
// These use @remotion/google-fonts which downloads fonts before rendering starts,
// solving the "□□□ box" issue caused by @import in headless Chrome (no network).
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadNotoSansDevanagari } from "@remotion/google-fonts/NotoSansDevanagari";
import { loadFont as loadNotoSansTamil } from "@remotion/google-fonts/NotoSansTamil";
import { loadFont as loadNotoSansBengali } from "@remotion/google-fonts/NotoSansBengali";
import { loadFont as loadNotoSansTelugu } from "@remotion/google-fonts/NotoSansTelugu";
import { loadFont as loadNotoSansKannada } from "@remotion/google-fonts/NotoSansKannada";
import { loadFont as loadNotoSansMalayalam } from "@remotion/google-fonts/NotoSansMalayalam";
import { loadFont as loadNotoSansGujarati } from "@remotion/google-fonts/NotoSansGujarati";
import { loadFont as loadNotoSansGurmukhi } from "@remotion/google-fonts/NotoSansGurmukhi";
import { loadFont as loadNotoSansOriya } from "@remotion/google-fonts/NotoSansOriya";
import { loadFont as loadNotoSansArabic } from "@remotion/google-fonts/NotoSansArabic";

// Load all fonts eagerly so they are ready before the first frame renders.
// IMPORTANT: We explicitly define the weights AND subsets we use to prevent Remotion Lambda
// from timing out on EC2 due to hundreds of font network requests.
loadInter("normal", { weights: ["400", "600", "700", "800", "900"], subsets: ["latin"] });
loadRoboto("normal", { weights: ["400", "500", "700", "900"], subsets: ["latin"] });
loadPoppins("normal", { weights: ["400", "600", "700", "800", "900"], subsets: ["latin"] });
loadMontserrat("normal", { weights: ["400", "600", "700", "800", "900"], subsets: ["latin"] });
loadOswald("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
loadBebasNeue("normal", { weights: ["400"], subsets: ["latin"] });
loadSpaceGrotesk("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

// Eagerly load Noto Sans regional fonts to prevent tofu boxes in headless browser rendering
loadNotoSansDevanagari("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansTamil("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansBengali("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansTelugu("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansKannada("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansMalayalam("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansGujarati("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansGurmukhi("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansOriya("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
loadNotoSansArabic("normal", { weights: ["400", "500", "600", "700", "800", "900"] });


/**
 * buildFontFaceCSS — produces @font-face rules for local (bundled) custom fonts.
 * These are injected as a <style> tag so they work inside Remotion's headless browser.
 * Unlike Google Fonts, local fonts don't need network access.
 */
const LOCAL_FONT_CSS = `
  @font-face {
    font-family: 'Jaggy W01 Regular';
    src: url('${jaggyFont}') format('truetype');
    font-weight: normal; font-display: block;
  }
  @font-face {
    font-family: 'Chalk-y';
    src: url('${chalkFont}') format('opentype');
    font-weight: normal; font-display: block;
  }
  @font-face {
    font-family: 'Bastliga One';
    src: url('${bastligaFont}') format('truetype');
    font-weight: normal; font-display: block;
  }
  @font-face {
    font-family: 'Droid 1997';
    src: url('${droidFont}') format('opentype');
    font-weight: normal; font-display: block;
  }
`;

/**
 * NOTO_FALLBACK_STACK — appended to every font-family in the render.
 *
 * CSS font matching is glyph-level: if Inter has no Devanagari glyph the
 * browser moves to the next font in the list. By including all Noto Indian
 * script fonts here every character Sarvam AI returns is rendered correctly.
 * All fonts are pre-loaded via @remotion/google-fonts above.
 */
const NOTO_FALLBACK_STACK = [
  "'Noto Sans Devanagari'",
  "'Noto Sans Tamil'",
  "'Noto Sans Bengali'",
  "'Noto Sans Telugu'",
  "'Noto Sans Kannada'",
  "'Noto Sans Malayalam'",
  "'Noto Sans Gujarati'",
  "'Noto Sans Gurmukhi'",
  "'Noto Sans Oriya'",
  "'Noto Sans Arabic'",
  "sans-serif",
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Noto Color Emoji"',
].join(", ");

/**
 * buildFontStack — returns a complete CSS font-family string.
 * Primary font + all Noto Indian-script fallbacks.
 * Unknown fonts (e.g. THEBOLDFONT) are replaced with Inter.
 */
function buildFontStack(fontFamily?: string | null): string {
  const knownGoogle = new Set([
    "Inter", "Roboto", "Poppins", "Montserrat", "Oswald", "Bebas Neue",
    "Space Grotesk",
    "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Bengali",
    "Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Malayalam",
    "Noto Sans Gujarati", "Noto Sans Gurmukhi", "Noto Sans Oriya",
    "Noto Sans Arabic",
  ]);
  const knownLocal = new Set([
    "Jaggy W01 Regular", "JaggyW01-Regular", "Chalk-y", "Bastliga One", "Droid 1997",
  ]);
  const primary = (fontFamily && (knownGoogle.has(fontFamily) || knownLocal.has(fontFamily)))
    ? fontFamily
    : "Inter";
  return `'${primary}', ${NOTO_FALLBACK_STACK}`;
}

/** Alias kept for backward-compat with the style object construction below */
function resolveRenderFont(fontFamily: string): string {
  return buildFontStack(fontFamily);
}

function secToFrame(sec: number, fps: number) {
  return Math.round(sec * fps);
}

/**
 * Extend the last word's end-time to fill the entire segment.
 * ASR engines systematically underestimate last-word duration;
 * this prevents the active-word highlight from cutting off early
 * and leaving blank frames before the next segment starts.
 */
function preprocessCaptions(captions: CaptionSegment[]): CaptionSegment[] {
  return captions.map(seg => {
    if (seg.words.length === 0) return seg;
    const words = [...seg.words];
    words[words.length - 1] = { ...words[words.length - 1], end: seg.end };
    return { ...seg, words };
  });
}

/** Resolve the best word color given emphasis/highlight flags and current active state */
function resolveWordColor(
  wordObj: { isEmphasized?: boolean; isHighlighted?: boolean },
  isTimingActive: boolean,
  style: { emphasisColor: string; highlightColor: string; primaryColor: string }
): string {
  if (wordObj.isHighlighted) return style.highlightColor ?? "#FACC15";
  if (wordObj.isEmphasized)  return style.emphasisColor  ?? "#4ADE80";
  if (isTimingActive)        return style.emphasisColor  ?? "#4ADE80";
  return style.primaryColor;
}

// ─── Modern Caption (word-by-word top-to-bottom reveal) ──────────────────────
const ModernCaption: React.FC<{
  caption: CaptionSegment;
  style: CaptionStyleProps;
  fps: number;
}> = ({ caption, style, fps }) => {
  const frame = useCurrentFrame();
  const captionStartFrame = secToFrame(caption.start, fps);

  const stopWords = new Set([
    "the","and","is","in","to","of","a","for","it","on","with","as","at","by","an","or","be","this","that","are",
  ]);

  const words = caption.words.map((wordObj, index) => {
    const cleanWord = wordObj.word.toLowerCase().replace(/[^a-z]/g, "");
    const isStopWord = stopWords.has(cleanWord);
    const isLongWord = wordObj.word.length >= 4;
    const isRhythmicWord = index % 3 === 2;
    const isSpotlight = (isLongWord && !isStopWord) || (isRhythmicWord && !isStopWord);

    const seed = wordObj.word.length + index + (cleanWord.charCodeAt(0) || 0);
    const pseudoRand = ((seed * 9301 + 49297) % 233280) / 233280;

    let fontSizeMultiplier: number;
    if (isSpotlight) {
      fontSizeMultiplier = 1.3 + pseudoRand * 0.35;
    } else if (isLongWord && !isStopWord) {
      fontSizeMultiplier = 0.9 + pseudoRand * 0.25;
    } else {
      fontSizeMultiplier = 0.65 + pseudoRand * 0.25;
    }

    return { ...wordObj, isSpotlight, fontSizeMultiplier, index };
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: buildFontStack(style.fontFamily),
        fontWeight: style.fontWeight || 600,
        letterSpacing: `${style.letterSpacing}px`,
        lineHeight: style.lineSpacing,
        padding: "20px 30px",
      }}
    >
      {words.map((w, i) => {
        const isEmphasis = w.isSpotlight && style.emphasisWords;
        const color = isEmphasis ? style.emphasisColor : style.primaryColor;
        const textShadow =
          isEmphasis && style.emphasisGlow
            ? `0 0 ${style.emphasisGlowIntensity * 2}px ${style.emphasisGlowColor}, 0 0 ${style.emphasisGlowIntensity * 4}px ${style.emphasisGlowColor}`
            : undefined;

        const wordStaggerFrames = secToFrame(i * 0.08, fps);
        const revealFrame = captionStartFrame + wordStaggerFrames;

        const opacity = interpolate(frame, [revealFrame, revealFrame + 5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(frame, [revealFrame, revealFrame + 5], [-22, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const clipProgress = interpolate(frame, [revealFrame, revealFrame + 5], [100, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              color,
              fontWeight: isEmphasis ? 800 : 400,
              fontSize: `${style.fontSize * w.fontSizeMultiplier}px`,
              textShadow,
              whiteSpace: "nowrap",
              margin: `${isEmphasis ? 6 : 4}px 0`,
              overflow: "hidden",
              paddingBottom: "2px",
              opacity,
              transform: `translateY(${y}px)`,
              clipPath: `inset(0% 0% ${clipProgress}% 0%)`,
            }}
          >
            {w.word}
          </div>
        );
      })}
    </div>
  );
};

export const CaptionOverlay: React.FC<{
  captions: CaptionSegment[];
  style: CaptionStyleProps;
  isBackgroundLayer?: boolean;
}> = ({ captions: rawCaptions, style: originalStyle, isBackgroundLayer }) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth } = useVideoConfig();

  // --- Wait for Google Fonts CSS to load before capturing frames ---
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [handle] = useState(() => delayRender("Loading Indian Noto Fonts"));

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
      continueRender(handle);
    });
  }, [handle]);

  // ── Pre-process captions: extend last word end → segment end ─────────────
  const captions = preprocessCaptions(rawCaptions);

  // ── Dual-buffer crossfade constants ──────────────────────────────────────
  // CROSSFADE_FRAMES: how many frames the exiting segment stays visible while
  // the entering segment fades in. 0.18s @ 30fps = ~5 frames.
  const CROSSFADE_FRAMES = Math.round(fps * 0.18);

  const currentTime = frame / fps;

  // Active segment (currently playing)
  const activeCaption = captions.find(seg =>
    frame >= secToFrame(seg.start, fps) && frame < secToFrame(seg.end, fps)
  );

  // Exiting segment: the one that ended within the last CROSSFADE_FRAMES frames
  const exitingCaption = !activeCaption
    ? captions.find(seg => {
        const endFrame = secToFrame(seg.end, fps);
        return frame >= endFrame && frame < endFrame + CROSSFADE_FRAMES;
      })
    : undefined;

  // Exit opacity: 1→0 over CROSSFADE_FRAMES
  const exitOpacity = exitingCaption
    ? interpolate(
        frame,
        [secToFrame(exitingCaption.end, fps), secToFrame(exitingCaption.end, fps) + CROSSFADE_FRAMES],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  // Nothing to render at all
  if (!activeCaption && !exitingCaption) return null;

  const previewWidth = originalStyle.previewWidth ?? 400;
  const renderScale  = videoWidth / previewWidth;

  /**
   * Build the effective style for a given segment.
   * Per-segment overrides (layout + colors) are merged on top of global style.
   * Font / size / position always come from global style.
   */
  const buildSegmentStyle = (seg: CaptionSegment) => {
    const ov = (seg as any).segmentOverride ?? {};
    return {
      ...originalStyle,
      // apply per-segment color overrides
      ...(ov.primaryColor   ? { primaryColor:   ov.primaryColor }   : {}),
      ...(ov.emphasisColor  ? { emphasisColor:  ov.emphasisColor }  : {}),
      ...(ov.highlightColor ? { highlightColor: ov.highlightColor } : {}),
      ...(ov.spotlightColor ? { spotlightColor: ov.spotlightColor } : {}),
      // apply per-segment layout
      ...(ov.layout         ? { layout: ov.layout }                 : {}),
      // scale font
      fontSize:      originalStyle.fontSize * renderScale,
      letterSpacing: originalStyle.letterSpacing * renderScale,
      fontFamily:    resolveRenderFont(originalStyle.fontFamily ?? "Inter"),
      // ensure highlightColor fallback
      highlightColor: ov.highlightColor ?? (originalStyle as any).highlightColor ?? "#FACC15",
    };
  };

  const style = buildSegmentStyle(activeCaption ?? exitingCaption!);

  // ── renderStyledText ─────────────────────────────────────────────────────
  const renderStyledText = (seg: CaptionSegment = activeCaption!) => {
    const segStyle = buildSegmentStyle(seg);
    return seg.words.map((wordObj, i) => {
      const isTimingActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      const wordColor = resolveWordColor(wordObj, isTimingActive, segStyle);
      const isAccent = wordObj.isEmphasized || wordObj.isHighlighted || isTimingActive;
      const wordShadow = segStyle.dropShadow
        ? `0px 0px 15px ${wordColor}${Math.round(segStyle.dropShadowOpacity * 2.55).toString(16).padStart(2, "0")}`
        : "none";
      const hardShadow = segStyle.dropShadow
        ? `2px 2px 0px ${segStyle.dropShadowColor}${Math.round(segStyle.dropShadowOpacity * 2.55).toString(16).padStart(2, "0")}`
        : "none";
      return (
        <span
          key={i}
          style={{
            color: wordColor,
            textShadow: isAccent ? wordShadow : hardShadow,
            transform: `scale(${isAccent ? 1.05 : 1}) translateY(${isAccent ? -2 : 0}px)`,
            fontWeight: isAccent ? 900 : 700,
            display: "inline-block",
            marginRight: "0.25em",
          }}
        >
          {wordObj.word}
        </span>
      );
    });
  };

  // ── renderBubbleText ──────────────────────────────────────────────────────
  const renderBubbleText = (seg: CaptionSegment = activeCaption!) => {
    const segStyle = buildSegmentStyle(seg);
    return seg.words.map((wordObj, i) => {
      const isTimingActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      const isAccent = wordObj.isEmphasized || wordObj.isHighlighted || isTimingActive;
      const accentBg = wordObj.isHighlighted
        ? segStyle.highlightColor
        : segStyle.bubbleSecondaryColor;
      const accentFg = wordObj.isHighlighted
        ? "#000000"
        : wordObj.isEmphasized
        ? segStyle.emphasisColor
        : segStyle.bubbleTertiaryColor;
      return (
        <span
          key={i}
          style={{
            backgroundColor: isAccent ? accentBg : "transparent",
            color: isAccent ? accentFg : segStyle.bubblePrimaryColor,
            transform: `scale(${isAccent ? 1.08 : 1}) translateY(${isAccent ? -2 : 0}px)`,
            fontWeight: isAccent ? 900 : 700,
            display: "inline-block",
            marginRight: "0.25em",
            paddingLeft:   isAccent ? "0.55em" : "0",
            paddingRight:  isAccent ? "0.55em" : "0",
            paddingTop:    isAccent ? "0.1em"  : "0",
            paddingBottom: isAccent ? "0.1em"  : "0",
            borderRadius: "999px",
          }}
        >
          {wordObj.word}
        </span>
      );
    });
  };

  // ── renderHormoziText ─────────────────────────────────────────────────────
  const renderHormoziText = (seg: CaptionSegment = activeCaption!) => {
    const segStyle = buildSegmentStyle(seg);
    return seg.words.map((wordObj, i) => {
      const isTimingActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      const isAccent = wordObj.isEmphasized || wordObj.isHighlighted || isTimingActive;
      const wordColor = resolveWordColor(wordObj, isTimingActive, { ...segStyle, emphasisColor: segStyle.spotlightColor });
      return (
        <span
          key={i}
          style={{
            color: wordColor,
            transform: `scale(${isAccent ? 1.2 : 1})`,
            textShadow: segStyle.dropShadow
              ? `4px 4px 0px ${segStyle.dropShadowColor}, 0px 0px 10px rgba(0,0,0,0.5)`
              : "none",
            fontWeight: 900,
            textTransform: "uppercase",
            display: "inline-block",
            marginRight: "0.3em",
          }}
        >
          {wordObj.word}
        </span>
      );
    });
  };

  // ── renderAliAbdaalText ───────────────────────────────────────────────────
  const renderAliAbdaalText = (seg: CaptionSegment = activeCaption!) => {
    const segStyle = buildSegmentStyle(seg);
    return seg.words.map((wordObj, i) => {
      const isSpoken = currentTime >= wordObj.start;
      const isTimingActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      const highlightBg = wordObj.isHighlighted
        ? segStyle.highlightColor
        : wordObj.isEmphasized
        ? segStyle.emphasisColor
        : isTimingActive
        ? segStyle.emphasisColor
        : "transparent";
      return (
        <span
          key={i}
          style={{
            opacity: isSpoken ? 1 : 0,
            backgroundColor: highlightBg,
            color: wordObj.isHighlighted ? "#000000" : segStyle.primaryColor,
            fontWeight: (wordObj.isEmphasized || wordObj.isHighlighted) ? 700 : 400,
            display: "inline-block",
            marginRight: "0.25em",
            padding: "0 0.1em",
            borderRadius: "4px",
          }}
        >
          {wordObj.word}
        </span>
      );
    });
  };

  // ── renderGadzhiText ──────────────────────────────────────────────────────
  const renderGadzhiText = (seg: CaptionSegment = activeCaption!) => {
    const segStyle = buildSegmentStyle(seg);
    return seg.words.map((wordObj, i) => {
      const isTimingActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      const wordColor = resolveWordColor(wordObj, isTimingActive, { ...segStyle, emphasisColor: segStyle.spotlightColor });
      const isAccent = wordObj.isEmphasized || wordObj.isHighlighted || isTimingActive;
      return (
        <span
          key={i}
          style={{
            color: wordColor,
            fontWeight: isAccent ? 700 : 300,
            textTransform: "lowercase",
            display: "inline-block",
            marginRight: "0.25em",
          }}
        >
          {wordObj.word}
        </span>
      );
    });
  };

  // ── renderAppleText ───────────────────────────────────────────────────────
  const renderAppleText = () => (
    <div style={{
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.3em",
    }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
      `}</style>
      {activeCaption!.words.map((wordObj, i) => {
        const isSpoken = currentTime >= wordObj.start;
        const wordStartFrame = secToFrame(wordObj.start, fps);
        const blurAnim = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.2], [4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const scaleAnim = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.2], [1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const opacityAnim = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.2], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        return (
          <span
            key={i}
            style={{
              fontFamily: "'Satoshi', sans-serif",
              color: isSpoken ? style.emphasisColor : style.primaryColor,
              opacity: isSpoken ? opacityAnim : 0.5,
              filter: isSpoken ? `blur(${blurAnim}px)` : "blur(4px)",
              transform: `scale(${isSpoken ? scaleAnim : 1})`,
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            {wordObj.word}
          </span>
        );
      })}
    </div>
  );



  // ── renderNxtgenGenZ ─────────────────────────────────────────────────────
  // Kalakar-style: Top(words) → Hero(1 word with shimmer) → Bottom(words)
  const renderNxtgenGenZ = () => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    // Find the hero word - longest word in the segment not greater than 7 letters
    let heroIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen && clean.length <= 7) {
        maxLen = clean.length;
        heroIndex = i;
      }
    }

    const topWords = words.slice(0, heroIndex);
    const heroWordObj = words[heroIndex];
    const bottomWords = words.slice(heroIndex + 1);

    const primaryColor = style.primaryColor || "#ffffff";
    const spotlightColor = style.spotlightColor || "#A0D83E";
    const lighterSpotlight = style.emphasisColor || "#AADC56";

    // Font sizes scale dynamically with style.fontSize (baseline 32)
    const baseFont = style.fontSize || 32;
    const SUB_FONT_SIZE = Math.round(baseFont * 3);   // 96 at baseline 32
    
    // Lower the hero font size if there are only 1 or 2 words to prevent overpowering the frame
    const HERO_FONT_SIZE = words.length <= 2 
      ? Math.round(baseFont * 4.5) 
      : Math.round(baseFont * 6.56); // 209.92 at baseline 32

    // Shimmer animation for hero word
    const shimmerGradient = `linear-gradient(90deg, ${spotlightColor} 0%, ${spotlightColor} 20%, ${lighterSpotlight} 40%, #CAEE93 50%, ${lighterSpotlight} 70%, ${spotlightColor} 80%, ${spotlightColor} 100%)`;

    const wrapperFilter = `drop-shadow(${spotlightColor} 0px 0px ${100 * renderScale}px) drop-shadow(rgba(0, 0, 0, 0.35) ${5 * renderScale}px ${5 * renderScale}px ${15 * renderScale}px)`;

    const ghostBlurStyle: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "120%",
      height: "80%",
      transform: "translate(-50%, -50%)",
      filter: `blur(${10 * renderScale}px)`,
      pointerEvents: "none",
      zIndex: 0,
    };

    // Shimmer sweep across the hero word
    const heroStartFrame = secToFrame(heroWordObj.start, fps);
    const shimmerProgress = interpolate(frame, [heroStartFrame, heroStartFrame + fps * 2], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const heroGhostBlurStyle: React.CSSProperties = {
      ...ghostBlurStyle,
      background: shimmerGradient,
      backgroundSize: "200% 100%",
      backgroundPosition: `${shimmerProgress}% 0`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };

    const wordStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
      whiteSpace: "pre",
    };

    const renderWord = (wordObj: typeof words[0], index: number, isHero: boolean = false) => {
      // Each word reveals exactly when it is spoken (no stagger delay)
      const revealFrame = secToFrame(wordObj.start, fps);
      const animFrames = Math.round(fps * 0.12);

      const yOffset = interpolate(frame, [revealFrame, revealFrame + animFrames], [-20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const opacityVal = interpolate(frame, [revealFrame, revealFrame + animFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      if (isHero) {
        return (
          <span
            key={`hero-${wordObj.start}`}
            style={{ 
              ...wordStyle, 
              textAlign: "center",
              transform: `translateY(${yOffset}px)`,
              opacity: opacityVal
            }}
          >
            <span aria-hidden="true" style={heroGhostBlurStyle}>{wordObj.word}</span>
            <span style={{
              fontFamily: buildFontStack(style.fontFamily),
              fontSize: `${HERO_FONT_SIZE}px`,
              fontWeight: 900,
              lineHeight: 0.9,
              textTransform: "uppercase",
              background: shimmerGradient,
              backgroundSize: "200% 100%",
              backgroundPosition: `${shimmerProgress}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: `drop-shadow(rgba(0, 0, 0, 0.35) ${5 * renderScale}px ${5 * renderScale}px ${15 * renderScale}px)`,
            }}>{wordObj.word}</span>
          </span>
        );
      }

      return (
        <span
          key={`sub-${wordObj.start}`}
          style={{ 
            ...wordStyle, 
            textAlign: "left",
            transform: `translateY(${yOffset}px)`,
            opacity: opacityVal
          }}
        >
          <span aria-hidden="true" style={{ ...ghostBlurStyle, color: primaryColor }}>{wordObj.word}</span>
          <span style={{ fontFamily: buildFontStack(style.fontFamily), fontSize: `${SUB_FONT_SIZE}px`, color: primaryColor, fontWeight: 800, lineHeight: 0.9, filter: `drop-shadow(rgba(0, 0, 0, 0.35) ${5 * renderScale}px ${5 * renderScale}px ${15 * renderScale}px)` }}>{wordObj.word}</span>
        </span>
      );
    };

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "fit-content",
        margin: "0 auto",
        filter: wrapperFilter,
      }}>
        {/* Top Line */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: buildFontStack(style.fontFamily),
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "left",
              display: "flex",
              gap: "0.5em",
            }}>
              {topWords.map((w, idx) => renderWord(w, idx, false))}
            </div>
          </div>
        )}

        {/* Hero Line */}
        {heroWordObj && (
          <div style={{ textAlign: "center", width: "100%", position: "relative", margin: `${10 * renderScale}px 0` }}>
            {renderWord(heroWordObj, heroIndex, true)}
          </div>
        )}

        {/* Bottom Line */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "right", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: buildFontStack(style.fontFamily),
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5em",
            }}>
              {bottomWords.map((w, idx) => renderWord(w, heroIndex + 1 + idx, false))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── renderNxtgenAlpha ─────────────────────────────────────────────────────
  // Cursive Style: Top('Aston Script') → Hero(1 word with shimmer) → Bottom('Aston Script')
  const renderNxtgenAlpha = () => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    // Find the hero word - longest word in the segment not greater than 7 letters
    let heroIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen && clean.length <= 7) {
        maxLen = clean.length;
        heroIndex = i;
      }
    }

    const topWords = words.slice(0, heroIndex);
    const heroWordObj = words[heroIndex];
    const bottomWords = words.slice(heroIndex + 1);

    const primaryColor = style.primaryColor || "#ffffff";
    const spotlightColor = style.spotlightColor || "#A0D83E";
    const lighterSpotlight = style.emphasisColor || "#AADC56";

    // Font sizes scale dynamically with style.fontSize (baseline 32)
    const baseFont = style.fontSize || 32;
    const SUB_FONT_SIZE = Math.round(baseFont * 3);   // 96 at baseline 32
    
    // Lower the hero font size if there are only 1 or 2 words to prevent overpowering the frame
    const HERO_FONT_SIZE = words.length <= 2 
      ? Math.round(baseFont * 4.5) 
      : Math.round(baseFont * 6.56); // 209.92 at baseline 32

    // Shimmer animation for hero word
    const shimmerGradient = `linear-gradient(90deg, ${spotlightColor} 0%, ${spotlightColor} 20%, ${lighterSpotlight} 40%, #CAEE93 50%, ${lighterSpotlight} 70%, ${spotlightColor} 80%, ${spotlightColor} 100%)`;

    const wrapperFilter = `drop-shadow(${spotlightColor} 0px 0px ${100 * renderScale}px) drop-shadow(rgba(0, 0, 0, 0.35) ${5 * renderScale}px ${5 * renderScale}px ${15 * renderScale}px)`;

    const ghostBlurStyle: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "120%",
      height: "80%",
      transform: "translate(-50%, -50%)",
      filter: `blur(${10 * renderScale}px)`,
      pointerEvents: "none",
      zIndex: 0,
    };

    // Shimmer sweep across the hero word
    const heroStartFrame = secToFrame(heroWordObj.start, fps);
    const shimmerProgress = interpolate(frame, [heroStartFrame, heroStartFrame + fps * 2], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const heroGhostBlurStyle: React.CSSProperties = {
      ...ghostBlurStyle,
      background: shimmerGradient,
      backgroundSize: "200% 100%",
      backgroundPosition: `${shimmerProgress}% 0`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };

    const wordStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
      whiteSpace: "pre",
    };

    const renderWord = (wordObj: typeof words[0], index: number, isHero: boolean = false) => {
      // Each word reveals exactly when it is spoken (no stagger delay)
      const revealFrame = secToFrame(wordObj.start, fps);
      const animFrames = Math.round(fps * 0.12);

      const yOffset = interpolate(frame, [revealFrame, revealFrame + animFrames], [-20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const opacityVal = interpolate(frame, [revealFrame, revealFrame + animFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      if (isHero) {
        return (
          <span
            key={`hero-${wordObj.start}`}
            style={{ 
              ...wordStyle, 
              textAlign: "center",
              transform: `translateY(${yOffset}px)`,
              opacity: opacityVal
            }}
          >
            <span aria-hidden="true" style={heroGhostBlurStyle}>{wordObj.word}</span>
            <span style={{
              fontFamily: buildFontStack(style.fontFamily),
              fontSize: `${HERO_FONT_SIZE}px`,
              fontWeight: 900,
              lineHeight: 0.9,
              textTransform: "uppercase",
              background: shimmerGradient,
              backgroundSize: "200% 100%",
              backgroundPosition: `${shimmerProgress}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: `drop-shadow(rgba(0, 0, 0, 0.35) ${5 * renderScale}px ${5 * renderScale}px ${15 * renderScale}px)`,
            }}>{wordObj.word}</span>
          </span>
        );
      }

      return (
        <span
          key={`sub-${wordObj.start}`}
          style={{ 
            ...wordStyle, 
            textAlign: "left",
            transform: `translateY(${yOffset}px)`,
            opacity: opacityVal
          }}
        >
          <span aria-hidden="true" style={{ ...ghostBlurStyle, fontFamily: `'Aston Script', cursive, ${NOTO_FALLBACK_STACK}`, fontWeight: 400, color: primaryColor }}>{wordObj.word}</span>
          <span style={{ fontFamily: `'Aston Script', cursive, ${NOTO_FALLBACK_STACK}`, fontSize: `${SUB_FONT_SIZE}px`, color: primaryColor, fontWeight: 400, lineHeight: 1.1, filter: `drop-shadow(rgba(0, 0, 0, 0.35) ${5 * renderScale}px ${5 * renderScale}px ${15 * renderScale}px)` }}>{wordObj.word}</span>
        </span>
      );
    };

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "fit-content",
        margin: "0 auto",
        filter: wrapperFilter,
      }}>
        {/* Inject the Aston Script stylesheet */}
        <style>{`
          @import url('https://fonts.cdnfonts.com/css/aston-script');
        `}</style>

        {/* Top Line */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: `'Aston Script', cursive, ${NOTO_FALLBACK_STACK}`,
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 1.1,
              color: primaryColor,
              textAlign: "left",
              display: "flex",
              gap: "0.5em",
            }}>
              {topWords.map((w, idx) => renderWord(w, idx, false))}
            </div>
          </div>
        )}

        {/* Hero Line */}
        {heroWordObj && (
          <div style={{ textAlign: "center", width: "100%", position: "relative", margin: `${10 * renderScale}px 0` }}>
            {renderWord(heroWordObj, heroIndex, true)}
          </div>
        )}

        {/* Bottom Line */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "right", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: `'Aston Script', cursive, ${NOTO_FALLBACK_STACK}`,
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 1.1,
              color: primaryColor,
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5em",
            }}>
              {bottomWords.map((w, idx) => renderWord(w, heroIndex + 1 + idx, false))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── renderNxtgenHorror ───────────────────────────────────────────────────
  const renderNxtgenHorror = () => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    // Split logic exactly like Nxtgen GenZ
    let heroIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen && clean.length <= 7) {
        maxLen = clean.length;
        heroIndex = i;
      }
    }

    const topWords = words.slice(0, heroIndex);
    const heroWordObj = words[heroIndex];
    const bottomWords = words.slice(heroIndex + 1);

    const primaryColor = style.primaryColor || "#ffffff";
    const baseFont = style.fontSize || 32;
    const SUB_FONT_SIZE = Math.round(baseFont * 3);
    const HERO_FONT_SIZE = words.length <= 2 ? Math.round(baseFont * 4.5) : Math.round(baseFont * 6.56);

    const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
    const wrapperOpacityBase = words.some(w => currentTime >= w.start) ? 1 : 0.3;

    // Animate wrapper entrance
    const segmentStartFrameForWrapper = secToFrame(words[0].start, fps);
    const wrapperEntranceOpacity = interpolate(frame, [segmentStartFrameForWrapper, segmentStartFrameForWrapper + Math.round(fps * 0.3)], [0, wrapperOpacityBase], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const renderWord = (wordObj: typeof words[0], index: number, pos: "top" | "bottom" | "hero") => {
      // Each word reveals exactly when it is spoken (no stagger delay)
      const revealFrame = secToFrame(wordObj.start, fps);
      const animFrames = Math.round(fps * 0.12);

      const opacityVal = interpolate(frame, [revealFrame, revealFrame + animFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      if (pos === "top") {
        const yOffset = interpolate(frame, [revealFrame, revealFrame + animFrames], [-50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`top-${wordObj.start}`}
            style={{
              fontFamily: `'JaggyW01-Regular', ${NOTO_FALLBACK_STACK}`,
              color: primaryColor,
              whiteSpace: "pre",
              transform: `translateY(${yOffset}px)`,
              opacity: opacityVal,
              display: "inline-block",
            }}
          >
            {wordObj.word}
          </span>
        );
      } else if (pos === "bottom") {
        const yOffset = interpolate(frame, [revealFrame, revealFrame + animFrames], [50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`bottom-${wordObj.start}`}
            style={{
              fontFamily: `'JaggyW01-Regular', ${NOTO_FALLBACK_STACK}`,
              color: primaryColor,
              whiteSpace: "pre",
              transform: `translateY(${yOffset}px)`,
              opacity: opacityVal,
              display: "inline-block",
            }}
          >
            {wordObj.word}
          </span>
        );
      } else {
        // Hero word — reveal on word start, chalk stroke in ~0.2s
        const animDurationFrames = Math.round(fps * 0.2);
        const opacity = interpolate(frame, [revealFrame, revealFrame + Math.round(animDurationFrames * 0.15), revealFrame + animDurationFrames], [0, 0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const scale = interpolate(frame, [revealFrame, revealFrame + animDurationFrames], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const skewX = interpolate(frame, [revealFrame, revealFrame + animDurationFrames], [-5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const clipX1 = interpolate(frame, [revealFrame, revealFrame + animDurationFrames], [0, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const clipX2 = interpolate(frame, [revealFrame, revealFrame + animDurationFrames], [0, 110], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        return (
          <span
            key={`hero-${wordObj.start}`}
            style={{
              display: "inline-block",
              fontFamily: `'Chalk-y', ${NOTO_FALLBACK_STACK}`,
              fontSize: `${HERO_FONT_SIZE}px`,
              color: "#ffffff",
              textShadow: `0 0 ${15 * renderScale}px rgba(255,255,255,0.8), ${2 * renderScale}px ${2 * renderScale}px ${5 * renderScale}px rgba(0,0,0,0.5)`,
              whiteSpace: "pre",
              opacity,
              transform: `scale(${scale}) skewX(${skewX}deg)`,
              clipPath: `polygon(0 0, ${clipX1}% 0, ${clipX2}% 100%, -10% 100%)`,
            }}
          >
            {wordObj.word}
          </span>
        );
      }
    };


    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: `${800 * renderScale}px`,
          margin: "0 auto",
        }}
      >
        <style>{`
          @font-face {
            font-family: 'Jaggy W01 Regular';
            src: url(${jaggyFont}) format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'JaggyW01-Regular';
            src: url(${jaggyFont}) format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'Chalk-y';
            src: url(${chalkFont}) format('opentype');
            font-weight: normal;
            font-style: normal;
          }
        `}</style>
        
        {/* Top Line */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative" }}>
            <div style={{
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              display: "flex",
              justifyContent: topWords.length >= 2 ? "space-between" : "center",
              width: "100%",
              gap: "0.5em",
            }}>
              {topWords.map((w, idx) => renderWord(w, idx, "top"))}
            </div>
          </div>
        )}

        {/* Hero Line */}
        {heroWordObj && (
          <div style={{ textAlign: "center", width: "100%", position: "relative", margin: `${10 * renderScale}px 0` }}>
            {renderWord(heroWordObj, heroIndex, "hero")}
          </div>
        )}

        {/* Bottom Line */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "center", width: "100%", position: "relative" }}>
            <div style={{
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              display: "flex",
              justifyContent: "center",
              width: "100%",
              gap: "0.5em",
            }}>
              {bottomWords.map((w, idx) => renderWord(w, heroIndex + 1 + idx, "bottom"))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── renderNxtgenVengence ─────────────────────────────────────────────────
  const renderNxtgenVengence = () => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    let heroIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen && clean.length <= 7) {
        maxLen = clean.length;
        heroIndex = i;
      }
    }

    const topWords = words.slice(0, heroIndex);
    const heroWordObj = words[heroIndex];
    const bottomWords = words.slice(heroIndex + 1);

    const primaryColor = style.primaryColor || "#ffffff";
    const baseFont = style.fontSize || 32;
    const SUB_FONT_SIZE = Math.round(baseFont * 3);
    const HERO_FONT_SIZE = words.length <= 2 ? Math.round(baseFont * 4.5) : Math.round(baseFont * 6.56);

    const segmentStartFrameForWrapper = secToFrame(words[0].start, fps);
    // wrapperEntranceOpacity removed to prevent stacking context isolation which breaks mix-blend-mode

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "fit-content",
          margin: "0 auto",
        }}
      >
        <style>{`
          @font-face {
            font-family: 'Bastliga One';
            src: url('${bastligaFont}') format('truetype');
          }
          @font-face {
            font-family: 'Droid 1997';
            src: url('${droidFont}') format('opentype');
          }
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
          @import url('https://fonts.cdnfonts.com/css/gilroy-bold');
        `}</style>

        {/* Top Line (Bastliga One, capitalize, reveal from top) */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: `'Bastliga One', cursive, ${NOTO_FALLBACK_STACK}`,
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "left",
              display: "flex",
              gap: "0.5em",
              textTransform: "capitalize"
            }}>
              {topWords.map((w, idx) => {
                const revealFrame = secToFrame(w.start, fps);
                const isSpoken = currentTime >= w.start;
                const opacityVal = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.4)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                const yOffset = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.4)], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                
                return (
                  <span
                    key={`top-${idx}`}
                    style={{ 
                      whiteSpace: "pre",
                      opacity: isSpoken ? opacityVal : 0.15,
                      transform: `translateY(${isSpoken ? yOffset : -30}px)`,
                      display: "inline-block"
                    }}
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Hero Line (Droid 1997, uppercase, difference filter, char by char from bottom) */}
        {heroWordObj && (
          <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0" }}>
            <div style={{
              fontFamily: `'Droid 1997', 'Syncopate', ${NOTO_FALLBACK_STACK}`,
              fontSize: `${HERO_FONT_SIZE}px`,
              fontWeight: 900,
              lineHeight: 0.9,
              textTransform: "uppercase",
              color: "#ffffff",
              display: "inline-flex",
              justifyContent: "center",
            }}>
              {heroWordObj.word.split("").map((char, charIdx) => {
                const isHeroActive = currentTime >= heroWordObj.start;
                const revealFrame = secToFrame(heroWordObj.start, fps) + Math.round(charIdx * 0.05 * fps);
                const opacityVal = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                const yOffset = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

                return (
                  <span
                    key={`hero-char-${charIdx}`}
                    style={{ 
                      opacity: isHeroActive ? opacityVal : 0,
                      transform: `translateY(${isHeroActive ? yOffset : 40}px)`,
                      display: "inline-block"
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Line (Space Grotesk, basic in animation) */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "right", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: `'Space Grotesk', ${NOTO_FALLBACK_STACK}`,
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5em",
            }}>
              {bottomWords.map((w, idx) => {
                const revealFrame = secToFrame(w.start, fps);
                const isSpoken = currentTime >= w.start;
                const opacityVal = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                
                return (
                  <span
                    key={`bottom-${idx}`}
                    style={{ 
                      whiteSpace: "pre",
                      opacity: isSpoken ? opacityVal : 0.15,
                      display: "inline-block"
                    }}
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── renderNxtgenCinemaLine ─────────────────────────────────────────────
  const renderNxtgenCinemaLine = () => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    let longestIndex = 0;
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen) {
        maxLen = clean.length;
        longestIndex = i;
      }
    }

    const isCursiveFirst = longestIndex === 0 && words.length > 1;
    const isCursiveLast = longestIndex === words.length - 1 && words.length > 1;

    const renderWord = (wordObj: typeof words[0], index: number, isTarget: boolean, overrideMarginLeft: string = "0.3em") => {
      // Cinematic Remotion interpolation
      const wordStartFrame = secToFrame(wordObj.start, fps);
      const isSpoken = currentTime >= wordObj.start;
      
      const opacityIn = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const blurIn = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.15], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const scaleIn = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.15], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

      return (
        <span
          key={index}
          style={{
            fontFamily: isTarget ? "'Great Vibes', cursive" : "'Satoshi', sans-serif",
            color: isTarget ? (style.emphasisColor || "#EF4444") : (style.primaryColor || "#FFFFFF"),
            fontSize: isTarget ? `${style.fontSize * 2}px` : `${style.fontSize}px`,
            fontWeight: isTarget ? 400 : 700,
            opacity: isSpoken ? opacityIn : 0,
            filter: isSpoken ? `blur(${blurIn}px)` : "blur(10px)",
            transform: isSpoken ? `scale(${scaleIn})` : "scale(0.8)",
            display: "inline-block",
            paddingRight: isTarget ? "0.1em" : "0",
            marginLeft: overrideMarginLeft,
            position: "relative",
          }}
        >
          {wordObj.word}
        </span>
      );
    };

    if (isCursiveFirst) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
            @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
          `}</style>
          {/* Top Row: Cursive Word */}
          <div style={{ zIndex: 1, position: "relative" }}>
            {renderWord(words[0], 0, true, "0")}
          </div>
          {/* Bottom Row: Normal Words */}
          <div style={{ 
            display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", 
            marginTop: "-0.8em", zIndex: 2, position: "relative" 
          }}>
            {words.slice(1).map((w, i) => renderWord(w, i + 1, false, i === 0 ? "0" : "0.3em"))}
          </div>
        </div>
      );
    } else if (isCursiveLast) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
            @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
          `}</style>
          {/* Top Row: Normal Words */}
          <div style={{ 
            display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
            zIndex: 1, position: "relative" 
          }}>
            {words.slice(0, words.length - 1).map((w, i) => renderWord(w, i, false, i === 0 ? "0" : "0.3em"))}
          </div>
          {/* Bottom Row: Cursive Word */}
          <div style={{ marginTop: "-0.8em", zIndex: 2, position: "relative" }}>
            {renderWord(words[words.length - 1], words.length - 1, true, "0")}
          </div>
        </div>
      );
    }

    // Default (Middle or Single Word)
    return (
      <div style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
          @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
        `}</style>
        {words.map((w, i) => renderWord(w, i, i === longestIndex, i === 0 ? "0" : "0.3em"))}
      </div>
    );
  };

  // ── renderNxtgenDirectorsEdition ─────────────────────────────────────────────
  const renderNxtgenDirectorsEdition = () => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    let longestIndex = 0;
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen) {
        maxLen = clean.length;
        longestIndex = i;
      }
    }

    const isCursiveFirst = longestIndex === 0 && words.length > 1;
    const isCursiveLast = longestIndex === words.length - 1 && words.length > 1;

    const renderWord = (wordObj: typeof words[0], index: number, isTarget: boolean, overrideMarginLeft: string = "0.3em") => {
      // Cinematic Remotion interpolation
      const wordStartFrame = secToFrame(wordObj.start, fps);
      const isSpoken = currentTime >= wordObj.start;
      
      const opacityIn = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const blurIn = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.15], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const scaleIn = interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.15], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

      return (
        <span
          key={index}
          style={{
            fontFamily: "'Satoshi', sans-serif",
            color: isTarget ? (style.emphasisColor || "#EF4444") : (style.primaryColor || "#FFFFFF"),
            fontSize: isTarget ? `${style.fontSize * 2}px` : `${style.fontSize}px`,
            fontWeight: isTarget ? 900 : 400,
            opacity: isSpoken ? opacityIn : 0,
            filter: isSpoken ? `blur(${blurIn}px)` : "blur(10px)",
            transform: isSpoken ? `scale(${scaleIn})` : "scale(0.8)",
            display: "inline-block",
            paddingRight: isTarget ? "0.1em" : "0",
            marginLeft: overrideMarginLeft,
            position: "relative",
          }}
        >
          {wordObj.word}
        </span>
      );
    };

    if (isCursiveFirst) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <style>{`
            @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
          `}</style>
          {/* Top Row: Target Word */}
          <div style={{ zIndex: 1, position: "relative" }}>
            {renderWord(words[0], 0, true, "0")}
          </div>
          {/* Bottom Row: Normal Words */}
          <div style={{ 
            display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", 
            marginTop: "-0.8em", zIndex: 2, position: "relative" 
          }}>
            {words.slice(1).map((w, i) => renderWord(w, i + 1, false, i === 0 ? "0" : "0.3em"))}
          </div>
        </div>
      );
    } else if (isCursiveLast) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <style>{`
            @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
          `}</style>
          {/* Top Row: Normal Words */}
          <div style={{ 
            display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
            zIndex: 1, position: "relative" 
          }}>
            {words.slice(0, words.length - 1).map((w, i) => renderWord(w, i, false, i === 0 ? "0" : "0.3em"))}
          </div>
          {/* Bottom Row: Target Word */}
          <div style={{ marginTop: "-0.8em", zIndex: 2, position: "relative" }}>
            {renderWord(words[words.length - 1], words.length - 1, true, "0")}
          </div>
        </div>
      );
    }

    // Default (Middle or Single Word)
    return (
      <div style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}>
        <style>{`
          @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
        `}</style>
        {words.map((w, i) => renderWord(w, i, i === longestIndex, i === 0 ? "0" : "0.3em"))}
      </div>
    );
  };

  // ── renderNxtgenViralOrEnergetic ───────────────────────────────────────────
  const renderNxtgenViralOrEnergetic = (isEnergetic: boolean) => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    let targetIndex = 0;
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen) {
        maxLen = clean.length;
        targetIndex = i;
      }
    }

    const lines: { words: typeof words, hasTarget: boolean }[] = [];
    let i = 0;
    while (i < words.length) {
      if (i === targetIndex || i === targetIndex - 1) {
        const chunk = [];
        if (i === targetIndex - 1) {
          chunk.push(words[i]);
          i++;
        }
        if (i < words.length) {
            chunk.push(words[i]); // targetIndex
            i++;
        }
        while (i < words.length && chunk.length < 2) {
            chunk.push(words[i]);
            i++;
        }
        lines.push({ words: chunk, hasTarget: true });
      } else {
        const chunk = [];
        chunk.push(words[i]);
        i++;
        if (i < words.length && i !== targetIndex && i !== targetIndex - 1) {
          chunk.push(words[i]);
          i++;
        }
        lines.push({ words: chunk, hasTarget: false });
      }
    }

    const renderWord = (wordObj: typeof words[0], globalIndex: number, lineHasTarget: boolean, isTargetWord: boolean, isPrecedingTarget: boolean, isLastInNormalLine: boolean) => {
      const isSpoken = currentTime >= wordObj.start;
      const wordStartFrame = secToFrame(wordObj.start, fps);
      
      const opacityIn = isEnergetic
        ? interpolate(frame, [wordStartFrame, wordStartFrame + 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const blurIn = isEnergetic
        ? 0
        : interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.1], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const scaleIn = isEnergetic
        ? interpolate(frame, [wordStartFrame, wordStartFrame + 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : interpolate(frame, [wordStartFrame, wordStartFrame + fps * 0.15], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

      let fontSize = `${style.fontSize}px`;
      let color = style.primaryColor || "#FFFFFF";
      let fontWeight: number | string = 700;
      let textShadow = "none";
      let baseOpacity = 1;
      let alignSelf = "center";

      if (isTargetWord) {
        fontSize = `${style.fontSize * 2.5}px`;
        color = style.emphasisColor || "#FACC15";
        fontWeight = 900;
        textShadow = `0 0 15px ${color}90`;
      } else if (isPrecedingTarget) {
        fontSize = `${style.fontSize * 0.65}px`;
        fontWeight = 500;
        baseOpacity = 0.8;
        alignSelf = "flex-end"; 
      } else if (isLastInNormalLine) {
        fontSize = `${style.fontSize * 0.65}px`;
        fontWeight = 500;
        baseOpacity = 0.8;
        alignSelf = "flex-end";
      }

      return (
        <span
          key={globalIndex}
          style={{
            fontFamily: "'Satoshi', sans-serif",
            color,
            fontSize,
            fontWeight,
            textShadow,
            opacity: isSpoken ? opacityIn * baseOpacity : 0,
            filter: isSpoken ? (isEnergetic ? "none" : `blur(${blurIn}px)`) : (isEnergetic ? "none" : "blur(10px)"),
            transform: isSpoken ? `scale(${scaleIn})` : (isEnergetic ? "scale(0)" : "scale(0.4)"),
            display: "inline-block",
            marginLeft: "0.15em",
            marginRight: "0.15em",
            alignSelf,
            lineHeight: "1",
            paddingBottom: (isPrecedingTarget || isLastInNormalLine) ? (isTargetWord ? "0.3em" : "0.1em") : "0", 
          }}
        >
          {wordObj.word}
        </span>
      );
    };

    let globalWordCounter = 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "0.2em" }}>
        <style>{`
          @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
        `}</style>
        {lines.map((line, lineIdx) => {
          return (
            <div key={lineIdx} style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "baseline" }}>
              {line.words.map((w, wIdx) => {
                const isTargetWord = line.hasTarget && w.word === words[targetIndex].word;
                const isPrecedingTarget = line.hasTarget && wIdx === 0 && line.words.length > 1 && !isTargetWord;
                const isLastInNormalLine = !line.hasTarget && wIdx === line.words.length - 1 && line.words.length > 1;
                
                const rendered = renderWord(w, globalWordCounter, line.hasTarget, isTargetWord, isPrecedingTarget, isLastInNormalLine);
                globalWordCounter++;
                return rendered;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ── renderMogrtShimmerStack ───────────────────────────────────────────────
  const renderMogrtShimmerStack = () => {
    const words = activeCaption!.words;
    let focusIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, "");
      if (clean.length > maxLen) { maxLen = clean.length; focusIndex = i; }
    }

    const topWords    = words.slice(0, focusIndex);
    const focusWord   = words[focusIndex];
    const bottomWords = words.slice(focusIndex + 1);

    const focusWordStartFrame = secToFrame(focusWord.start, fps);
    const focusWordEndFrame   = secToFrame(focusWord.end,   fps);
    const isFocusActive = frame >= focusWordStartFrame && frame <= focusWordEndFrame;

    const shadowStr = style.dropShadow
      ? `2px 2px 12px ${style.dropShadowColor}${Math.round(style.dropShadowOpacity * 2.55).toString(16).padStart(2, "0")}`
      : "none";

    // Shimmer sweep position
    const shimmerPos = interpolate(
      frame,
      [focusWordStartFrame, focusWordStartFrame + fps],
      [-200, 200],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const renderSupportPhrase = (phraseWords: WordTiming[], position: "top" | "bottom") => {
      if (phraseWords.length === 0) return null;
      const anySpoken = phraseWords.some((w) => currentTime >= w.start);
      const opacity = anySpoken ? 1 : 0;
      const yVal    = anySpoken ? 0 : (position === "top" ? -10 : 10);
      return (
        <div
          key={position}
          style={{
            opacity,
            transform: `translateY(${yVal}px)`,
            fontSize: `${style.fontSize}px`,
            fontWeight: 600,
            color: style.primaryColor,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            textAlign: "center",
            textShadow: shadowStr,
            marginBottom: position === "top"    ? "6px" : "0",
            marginTop:    position === "bottom" ? "6px" : "0",
            maxWidth: "100%",
          }}
        >
          {phraseWords.map((w, i) => {
            const isSpoken = currentTime >= w.start;
            return (
              <span
                key={i}
                style={{ opacity: isSpoken ? 1 : 0.15, display: "inline-block", marginRight: "0.3em" }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      );
    };

    const focusOpacity = frame >= focusWordStartFrame ? 1 : 0;
    const focusScale   = isFocusActive ? 1.1 : (frame >= focusWordStartFrame ? 1.0 : 0.9);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {renderSupportPhrase(topWords, "top")}
        <span
          style={{
            opacity: focusOpacity,
            transform: `scale(${focusScale})`,
            display: "block",
            width: "100%",
            maxWidth: "100%",
            maxHeight: "1.2em",
            overflow: "hidden",
            textAlign: "center",
            fontSize: `${style.fontSize * 2.8}px`,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            background: "linear-gradient(45deg, #eee 25%, #fff 50%, #eee 75%)",
            backgroundPosition: `${shimmerPos}% center`,
            backgroundSize: "400% auto",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {focusWord.word}
        </span>
        {renderSupportPhrase(bottomWords, "bottom")}
      </div>
    );
  };

  // ── renderHoloText ────────────────────────────────────────────────────────
  const renderHoloText = () => {
    const words = activeCaption!.words;
    if (words.length === 0) return null;

    const segmentStartFrame = secToFrame(words[0].start, fps);
    // Mimic the STAGGER of 0.03 seconds per character from HoloCaption.tsx
    const framesPerChar = Math.max(1, Math.round(0.03 * fps));

    let charCount = 0;
    const wordElements = words.map((w, wIdx) => {
      const isGlitch = (wIdx + 1) % 4 === 0;
      const chars = w.word.split("");

      const charElements = chars.map((char, cIdx) => {
        const revealFrame = segmentStartFrame + charCount * framesPerChar;
        charCount++;

        const opacity = frame >= revealFrame ? 1 : 0;
        return (
          <span
            key={cIdx}
            style={{ opacity, display: "inline-block" }}
          >
            {char}
          </span>
        );
      });

      let transform = "none";
      let textShadow = undefined;

      if (isGlitch) {
        // Fast repeating glitch animation based on current frame modulo
        const glitchCycle = Math.floor(frame / (fps * 0.25)) % 6; 
        // 0.25s duration loop -> 6 keyframes
        if (glitchCycle === 1) transform = "skewX(-15deg) translateX(-3px)";
        else if (glitchCycle === 2) transform = "skewX(10deg) translateX(3px)";
        else if (glitchCycle === 3) transform = "skewX(-5deg) translateX(-1px)";
        else if (glitchCycle === 4) transform = "skewX(5deg) translateX(1px)";
        
        textShadow = "-2px 0 red, 2px 0 blue";
      }

      return (
        <div
          key={wIdx}
          style={{
            display: "flex",
            whiteSpace: "pre",
            marginRight: "0.3em",
            transform,
            textShadow,
          }}
        >
          {charElements}
        </div>
      );
    });

    return (
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
        `}</style>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontFamily: buildFontStack(style.fontFamily),
            fontWeight: style.fontWeight || 700,
            fontSize: `${style.fontSize}px`,
            color: style.primaryColor || "#00FF41",
            backgroundColor: "rgba(0, 255, 65, 0.08)",
            border: `1px solid ${style.primaryColor || "#00FF41"}`,
            boxShadow: `0 0 ${15 * renderScale}px ${style.primaryColor || "#00FF41"}40, inset 0 0 ${10 * renderScale}px ${style.primaryColor || "#00FF41"}30`,
            padding: `${16 * renderScale}px ${24 * renderScale}px`,
            borderRadius: `${8 * renderScale}px`,
            letterSpacing: `${style.letterSpacing}px`,
            lineHeight: style.lineSpacing || 1.25,
            textShadow: style.dropShadow
              ? `2px 2px ${style.dropShadowOpacity}px ${style.dropShadowColor}`
              : `0 0 8px ${style.primaryColor || "#00FF41"}`,
          }}
        >
          {wordElements}
        </div>
      </div>
    );
  };

  // ── Shared layout renderer for a given segment ───────────────────────────
  const renderSegmentContent = (seg: CaptionSegment, segStyle: ReturnType<typeof buildSegmentStyle>) => {
    const effectiveLayout = segStyle.layout;
    const textAlign =
      effectiveLayout === "ali-abdaal"
        ? (segStyle.aliAbdaalPosition as any)
        : (effectiveLayout === "hormozi" || effectiveLayout === "gadzhi" || effectiveLayout === "bubble" || effectiveLayout === "apple")
        ? "center"
        : (segStyle.textAlignment as any);

    // Word-by-word layouts get NO group-level animation wrapper — each word
    // animates itself. Group wrapper caused the entire block to slam in together.
    const isWordByWord = [
      "bubble", "hormozi", "ali-abdaal", "gadzhi", "apple",
      "nxtgen-genz", "nxtgen-alpha", "nxtgen-horror", "nxtgen-vengence",
      "nxtgen-cinemaline", "nxtgen-directors-edition", "nxtgen-viral", "nxtgen-energetic",
      "mogrt-shimmer-stack",
    ].includes(effectiveLayout);

    // Group animation only for classic/center layouts that don't animate per-word
    const isAnimationEnabled = segStyle.animationEnabled !== false;
    const segStartFrame = secToFrame(seg.start, fps);
    const animDur = Math.round(fps * 0.15);
    const groupOpacity = (!isWordByWord && isAnimationEnabled)
      ? interpolate(frame, [segStartFrame, segStartFrame + animDur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;
    const groupScale = (!isWordByWord && isAnimationEnabled)
      ? interpolate(frame, [segStartFrame, segStartFrame + animDur], [0.97, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;

    return (
      <div
        style={{
          position: "absolute",
          top: `${originalStyle.positionY}%`,
          left: `${originalStyle.positionX}%`,
          transform: "translate(-50%, -50%)",
          textAlign,
          letterSpacing: `${segStyle.letterSpacing}px`,
          lineHeight: segStyle.lineSpacing,
          fontSize: `${segStyle.fontSize}px`,
          fontFamily: buildFontStack(originalStyle.fontFamily),
          width: `${originalStyle.width}%`,
          maxWidth: "100%",
          padding: "1rem",
          mixBlendMode: effectiveLayout === "nxtgen-vengence" ? "difference" : "normal",
        }}
      >
        {effectiveLayout === "modern" ? (
          <ModernCaption caption={seg} style={segStyle as any} fps={fps} />
        ) : effectiveLayout === "holo" ? (
          renderHoloText()
        ) : (
          <div
            style={{
              width: "100%",
              padding: `0 ${Math.round(64 * renderScale)}px`,
              boxSizing: "border-box",
              opacity: groupOpacity,
              transform: `scale(${groupScale})`,
            }}
          >
            {effectiveLayout === "bubble"              ? renderBubbleText(seg)                   :
             effectiveLayout === "hormozi"             ? renderHormoziText(seg)                  :
             effectiveLayout === "ali-abdaal"          ? renderAliAbdaalText(seg)                :
             effectiveLayout === "gadzhi"              ? renderGadzhiText(seg)                   :
             effectiveLayout === "apple"               ? renderAppleText()                       :
             effectiveLayout === "mogrt-shimmer-stack" ? renderMogrtShimmerStack()               :
             effectiveLayout === "nxtgen-genz"         ? renderNxtgenGenZ()                      :
             effectiveLayout === "nxtgen-alpha"        ? renderNxtgenAlpha()                     :
             effectiveLayout === "nxtgen-horror"       ? renderNxtgenHorror()                    :
             effectiveLayout === "nxtgen-vengence"     ? renderNxtgenVengence()                  :
             effectiveLayout === "nxtgen-cinemaline"   ? renderNxtgenCinemaLine()               :
             effectiveLayout === "nxtgen-directors-edition" ? renderNxtgenDirectorsEdition()    :
             effectiveLayout === "nxtgen-viral"        ? renderNxtgenViralOrEnergetic(false)     :
             effectiveLayout === "nxtgen-energetic"    ? renderNxtgenViralOrEnergetic(true)      :
             <div style={{ lineHeight: 1.25, letterSpacing: "-0.025em" }}>{renderStyledText(seg)}</div>
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* ── Native Google Fonts Injection for Indian Scripts ── */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;800;900&family=Noto+Sans+Tamil:wght@400;700;800;900&family=Noto+Sans+Bengali:wght@400;700;800;900&family=Noto+Sans+Telugu:wght@400;700;800;900&family=Noto+Sans+Kannada:wght@400;700;800;900&family=Noto+Sans+Malayalam:wght@400;700;800;900&family=Noto+Sans+Gujarati:wght@400;700;800;900&family=Noto+Sans+Gurmukhi:wght@400;700;800;900&family=Noto+Sans+Oriya:wght@400;700;800;900&family=Noto+Sans+Arabic:wght@400;700;800;900&display=swap"
      />
      <style>{LOCAL_FONT_CSS}</style>

      {/* ── EXITING segment (crossfade out) ── */}
      {exitingCaption && (
        <div style={{ opacity: exitOpacity, pointerEvents: "none" }}>
          {renderSegmentContent(exitingCaption, buildSegmentStyle(exitingCaption))}
        </div>
      )}

      {/* ── ACTIVE segment (entry + normal render) ── */}
      {activeCaption && renderSegmentContent(activeCaption, style)}
    </AbsoluteFill>
  );
};
