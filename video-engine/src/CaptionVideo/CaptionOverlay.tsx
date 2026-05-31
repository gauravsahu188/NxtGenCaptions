import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { CaptionSegment, CaptionStyleProps, WordTiming } from "../types";
import jaggyFont from "../assets/jaggy-w01-regular.ttf";
import chalkFont from "../assets/chalk-y.otf";

function secToFrame(sec: number, fps: number) {
  return Math.round(sec * fps);
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
        fontFamily: `'${style.fontFamily}', sans-serif`,
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

// ─── Segment Renderer (main export) ──────────────────────────────────────────
export const CaptionOverlay: React.FC<{
  captions: CaptionSegment[];
  style: CaptionStyleProps;
  isBackgroundLayer?: boolean;
}> = ({ captions, style, isBackgroundLayer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // seconds equivalent of current frame — used just like `currentTime` in the editor
  const currentTime = frame / fps;

  // Find the active caption segment
  const activeCaption = captions.find((seg) => {
    const startFrame = secToFrame(seg.start, fps);
    const endFrame   = secToFrame(seg.end,   fps);
    return frame >= startFrame && frame < endFrame;
  });

  if (!activeCaption) return null;



  // ── renderStyledText ─────────────────────────────────────────────────────
  const renderStyledText = () =>
    activeCaption.words.map((wordObj, i) => {
      const isHighlight = currentTime >= wordObj.start && currentTime <= wordObj.end;

      const wordShadow = style.dropShadow
        ? `0px 0px 15px ${isHighlight ? style.emphasisColor : style.dropShadowColor}${Math.round(style.dropShadowOpacity * 2.55).toString(16).padStart(2, "0")}`
        : "none";
      const hardShadow = style.dropShadow
        ? `2px 2px 0px ${style.dropShadowColor}${Math.round(style.dropShadowOpacity * 2.55).toString(16).padStart(2, "0")}`
        : "none";

      return (
        <span
          key={i}
          style={{
            color: isHighlight ? style.emphasisColor : style.primaryColor,
            textShadow: isHighlight ? wordShadow : hardShadow,
            transform: `scale(${isHighlight ? 1.05 : 1}) translateY(${isHighlight ? -2 : 0}px)`,
            fontWeight: isHighlight ? 900 : 700,
            display: "inline-block",
            marginRight: "0.25em",
          }}
        >
          {wordObj.word}
        </span>
      );
    });

  // ── renderBubbleText ──────────────────────────────────────────────────────
  const renderBubbleText = () =>
    activeCaption.words.map((wordObj, i) => {
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <span
          key={i}
          style={{
            backgroundColor: isActive ? style.bubbleSecondaryColor : "transparent",
            color: isActive ? style.bubbleTertiaryColor : style.bubblePrimaryColor,
            transform: `scale(${isActive ? 1.08 : 1}) translateY(${isActive ? -2 : 0}px)`,
            fontWeight: isActive ? 900 : 700,
            display: "inline-block",
            marginRight: "0.25em",
            paddingLeft:   isActive ? "0.55em" : "0",
            paddingRight:  isActive ? "0.55em" : "0",
            paddingTop:    isActive ? "0.1em"  : "0",
            paddingBottom: isActive ? "0.1em"  : "0",
            borderRadius: "999px",
          }}
        >
          {wordObj.word}
        </span>
      );
    });

  // ── renderHormoziText ─────────────────────────────────────────────────────
  const renderHormoziText = () =>
    activeCaption.words.map((wordObj, i) => {
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <span
          key={i}
          style={{
            color: isActive ? style.spotlightColor : style.primaryColor,
            transform: `scale(${isActive ? 1.2 : 1})`,
            textShadow: style.dropShadow
              ? `4px 4px 0px ${style.dropShadowColor}, 0px 0px 10px rgba(0,0,0,0.5)`
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

  // ── renderAliAbdaalText ───────────────────────────────────────────────────
  const renderAliAbdaalText = () =>
    activeCaption.words.map((wordObj, i) => {
      const isSpoken = currentTime >= wordObj.start;
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <span
          key={i}
          style={{
            opacity: isSpoken ? 1 : 0,
            backgroundColor: isActive ? style.emphasisColor : "transparent",
            color: style.primaryColor,
            fontWeight: 400,
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

  // ── renderGadzhiText ──────────────────────────────────────────────────────
  const renderGadzhiText = () =>
    activeCaption.words.map((wordObj, i) => {
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <span
          key={i}
          style={{
            color: isActive ? style.spotlightColor : style.primaryColor,
            fontWeight: isActive ? 700 : 300,
            textTransform: "lowercase",
            display: "inline-block",
            marginRight: "0.25em",
          }}
        >
          {wordObj.word}
        </span>
      );
    });

  // ── renderAppleText ───────────────────────────────────────────────────────
  const renderAppleText = () =>
    activeCaption.words.map((wordObj, i) => {
      const isSpoken = currentTime >= wordObj.start;
      return (
        <span
          key={i}
          style={{
            color: isSpoken ? style.emphasisColor : style.primaryColor,
            opacity: isSpoken ? 1 : 0.5,
            filter: isSpoken ? "blur(0px)" : "blur(4px)",
            transform: `scale(${isSpoken ? 1.05 : 1})`,
            fontWeight: 700,
            display: "inline-block",
            marginRight: "0.25em",
          }}
        >
          {wordObj.word}
        </span>
      );
    });



  // ── renderNxtgenGenZ ─────────────────────────────────────────────────────
  // Kalakar-style: Top(words) → Hero(1 word with shimmer) → Bottom(words)
  const renderNxtgenGenZ = () => {
    const words = activeCaption.words;
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

    const wrapperFilter = `drop-shadow(${spotlightColor} 0px 0px 100px) drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)`;

    const ghostBlurStyle: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "120%",
      height: "80%",
      transform: "translate(-50%, -50%)",
      filter: "blur(10px)",
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
      // Staggered animation matching frontend: delay = index * 0.1
      const delayFrames = Math.round(index * 0.1 * fps);
      // Segment starts when the first word in the caption block starts
      const segmentStartFrame = secToFrame(words[0].start, fps);
      const revealFrame = segmentStartFrame + delayFrames;

      const yOffset = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [-20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const opacityVal = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [0, 1], {
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
              fontFamily: style.fontFamily || "Inter",
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
              filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)",
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
          <span style={{ fontFamily: style.fontFamily || "Inter", fontSize: `${SUB_FONT_SIZE}px`, color: primaryColor, fontWeight: 800, lineHeight: 0.9, filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)" }}>{wordObj.word}</span>
        </span>
      );
    };

    // Main wrapper opacity
    const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
    const isHeroActive = activeWord && words.indexOf(activeWord) === heroIndex;
    const wrapperOpacityBase = isHeroActive ? 1 : (words.some(w => currentTime >= w.start) ? 0.8 : 0.3);
    
    // Animate wrapper entrance
    const segmentStartFrameForWrapper = secToFrame(words[0].start, fps);
    const wrapperEntranceOpacity = interpolate(frame, [segmentStartFrameForWrapper, segmentStartFrameForWrapper + Math.round(fps * 0.3)], [0, wrapperOpacityBase], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "fit-content",
        margin: "0 auto",
        filter: wrapperFilter,
        opacity: wrapperEntranceOpacity
      }}>
        {/* Top Line */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: style.fontFamily || "Inter",
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
          <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0" }}>
            {renderWord(heroWordObj, heroIndex, true)}
          </div>
        )}

        {/* Bottom Line */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "right", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: style.fontFamily || "Inter",
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
    const words = activeCaption.words;
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

    const wrapperFilter = `drop-shadow(${spotlightColor} 0px 0px 100px) drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)`;

    const ghostBlurStyle: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "120%",
      height: "80%",
      transform: "translate(-50%, -50%)",
      filter: "blur(10px)",
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
      // Staggered animation matching frontend: delay = index * 0.1
      const delayFrames = Math.round(index * 0.1 * fps);
      // Segment starts when the first word in the caption block starts
      const segmentStartFrame = secToFrame(words[0].start, fps);
      const revealFrame = segmentStartFrame + delayFrames;

      const yOffset = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [-20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const opacityVal = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [0, 1], {
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
              fontFamily: style.fontFamily || "Inter",
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
              filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)",
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
          <span aria-hidden="true" style={{ ...ghostBlurStyle, fontFamily: "'Aston Script', cursive", fontWeight: 400, color: primaryColor }}>{wordObj.word}</span>
          <span style={{ fontFamily: "'Aston Script', cursive", fontSize: `${SUB_FONT_SIZE}px`, color: primaryColor, fontWeight: 400, lineHeight: 1.1, filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)" }}>{wordObj.word}</span>
        </span>
      );
    };

    // Main wrapper opacity
    const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
    const isHeroActive = activeWord && words.indexOf(activeWord) === heroIndex;
    const wrapperOpacityBase = isHeroActive ? 1 : (words.some(w => currentTime >= w.start) ? 0.8 : 0.3);
    
    // Animate wrapper entrance
    const segmentStartFrameForWrapper = secToFrame(words[0].start, fps);
    const wrapperEntranceOpacity = interpolate(frame, [segmentStartFrameForWrapper, segmentStartFrameForWrapper + Math.round(fps * 0.3)], [0, wrapperOpacityBase], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "fit-content",
        margin: "0 auto",
        filter: wrapperFilter,
        opacity: wrapperEntranceOpacity
      }}>
        {/* Inject the Aston Script stylesheet */}
        <style>{`
          @import url('https://fonts.cdnfonts.com/css/aston-script');
        `}</style>

        {/* Top Line */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: "'Aston Script', cursive",
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
          <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0" }}>
            {renderWord(heroWordObj, heroIndex, true)}
          </div>
        )}

        {/* Bottom Line */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "right", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: "'Aston Script', cursive",
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
    const words = activeCaption.words;
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
      const delayFrames = Math.round(index * 0.1 * fps);
      const segmentStartFrame = secToFrame(words[0].start, fps);
      const revealFrame = segmentStartFrame + delayFrames;

      const opacityVal = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      if (pos === "top") {
        const yOffset = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [-50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`top-${wordObj.start}`}
            style={{
              fontFamily: "'JaggyW01-Regular', sans-serif",
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
        const yOffset = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`bottom-${wordObj.start}`}
            style={{
              fontFamily: "'JaggyW01-Regular', sans-serif",
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
        const isHeroActive = activeWord && words.indexOf(activeWord) === heroIndex;
        const scale = interpolate(frame, [revealFrame, revealFrame + Math.round(fps * 0.3)], [0.8, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const staggerDelay = (revealFrame - segmentStartFrame) / fps;
        return (
          <span
            key={`hero-${wordObj.start}`}
            style={{
              display: "inline-block",
              fontFamily: "'Chalk-y', sans-serif",
              fontSize: `${HERO_FONT_SIZE}px`,
              color: "#ffffff",
              textShadow: "0 0 15px rgba(255,255,255,0.8), 2px 2px 5px rgba(0,0,0,0.5)",
              animation: "chalkStrokeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              animationDelay: `${staggerDelay}s`,
              whiteSpace: "pre",
              opacity: 0,
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
          maxWidth: "800px",
          margin: "0 auto",
          opacity: wrapperEntranceOpacity,
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
          @keyframes chalkStrokeIn {
            0% {
              clip-path: polygon(0 0, 0 0, -10% 100%, -10% 100%);
              opacity: 0;
              transform: scale(0.95) skewX(-5deg);
            }
            15% {
              opacity: 0.8;
            }
            100% {
              clip-path: polygon(0 0, 120% 0, 110% 100%, -10% 100%);
              opacity: 1;
              transform: scale(1) skewX(0deg);
            }
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
          <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0" }}>
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

  // ── renderNxtgenFicticVisual ─────────────────────────────────────────────
  const renderNxtgenFicticVisual = () => {
    const words = activeCaption.words;
    if (words.length === 0) return null;

    return (
      <div style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        gap: "0.4em",
      }}>
        {/* Inject Google Fonts stylesheet */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@700&family=Cinzel+Decorative:wght@700&display=swap');
        `}</style>
        {words.map((wordObj, index) => {
          const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
          const isPast = currentTime > wordObj.end;

          const wordStyle: React.CSSProperties = {
            fontFamily: style.fontFamily === "Cinzel Decorative" ? "'Cinzel Decorative', serif" : "'Syncopate', sans-serif",
            fontWeight: 700,
            fontSize: `${style.fontSize * 1.5}px`, // match editor scaling
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            transition: "opacity 0.3s ease, filter 0.3s ease, letter-spacing 0.05s linear",
          };

          if (isActive) {
            // Remotion linear interpolation using frame count for absolute precision!
            const wordStartFrame = secToFrame(wordObj.start, fps);
            const wordEndFrame = secToFrame(wordObj.end, fps);
            const tracking = interpolate(frame, [wordStartFrame, wordEndFrame], [0, 15], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <span
                key={index}
                style={{
                  ...wordStyle,
                  color: "#FFFFFF",
                  filter: "drop-shadow(0px 0px 20px #00FFFF)",
                  opacity: 1,
                  letterSpacing: `${tracking}px`,
                }}
              >
                {wordObj.word}
              </span>
            );
          } else if (isPast) {
            return (
              <span
                key={index}
                style={{
                  ...wordStyle,
                  color: "#FFFFFF",
                  opacity: 0.2,
                  filter: "blur(4px)",
                  letterSpacing: "15px",
                }}
              >
                {wordObj.word}
              </span>
            );
          } else {
            // Future word: hidden until spoken
            return (
              <span
                key={index}
                style={{
                  ...wordStyle,
                  opacity: 0,
                  pointerEvents: "none",
                  letterSpacing: "0px",
                }}
              >
                {wordObj.word}
              </span>
            );
          }
        })}
      </div>
    );
  };

  // ── renderMogrtShimmerStack ───────────────────────────────────────────────
  const renderMogrtShimmerStack = () => {
    const words = activeCaption.words;
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

  // ── Layout / positioning (mirrors the editor's draggable handle exactly) ──
  const textAlign =
    style.layout === "ali-abdaal"
      ? (style.aliAbdaalPosition as any)
      : (style.layout === "hormozi" || style.layout === "gadzhi" || style.layout === "bubble" || style.layout === "apple")
      ? "center"
      : (style.textAlignment as any);



  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Positioned exactly like the editor's draggable caption handle */}
      <div
        style={{
          position: "absolute",
          top: `${style.positionY}%`,
          left: `${style.positionX}%`,
          transform: "translate(-50%, -50%)",
          textAlign,
          letterSpacing: `${style.letterSpacing}px`,
          lineHeight: style.lineSpacing,
          fontSize: `${style.fontSize}px`,
          fontFamily: `'${style.fontFamily}', sans-serif`,
          width: `${style.width}%`,
          maxWidth: "100%",
          padding: "1rem",
        }}
      >
        {style.layout === "modern" ? (
          <ModernCaption caption={activeCaption} style={style} fps={fps} />
        ) : (
          <div style={{ width: "100%", padding: "0 4rem", boxSizing: "border-box" }}>
            {style.layout === "bubble"              ? renderBubbleText()         :
             style.layout === "hormozi"             ? renderHormoziText()        :
             style.layout === "ali-abdaal"          ? renderAliAbdaalText()      :
             style.layout === "gadzhi"              ? renderGadzhiText()         :
             style.layout === "apple"               ? renderAppleText()          :
             style.layout === "mogrt-shimmer-stack" ? renderMogrtShimmerStack()  :
             style.layout === "nxtgen-genz"         ? renderNxtgenGenZ()         :
             style.layout === "nxtgen-alpha"        ? renderNxtgenAlpha()        :
             style.layout === "nxtgen-horror"       ? renderNxtgenHorror()       :
             style.layout === "nxtgen-ficticvisual" ? renderNxtgenFicticVisual() :
             <div style={{ lineHeight: "tight" }}>{renderStyledText()}</div>
            }
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
