"use client";
import React, { useRef, useState, useEffect } from "react";
import { useCaptionContext } from "../../context/CaptionContext";
import { RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModernCaption from "./ModernCaption";
import HoloCaption from "./HoloCaption";

export default function VideoPlayer() {
  const { videoUrl, setVideoUrl, setCaptions, currentTime, setCurrentTime, activeCaption, captionStyle, setCaptionStyle, setDuration, isPlaying, setIsPlaying, originalVideoWidth, setOriginalVideoWidth, originalVideoHeight, setOriginalVideoHeight, setAspectRatio } = useCaptionContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const isSeeking = useRef(false);

  // Sync video element play/pause from context
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isPlaying) {
      vid.play().catch(() => setIsPlaying(false));
    } else {
      vid.pause();
    }
  }, [isPlaying]);

  // Sync video element currentTime when Timeline scrubs
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || isSeeking.current) return;
    if (Math.abs(vid.currentTime - currentTime) > 0.3) {
      vid.currentTime = currentTime;
    }
  }, [currentTime]);

  // Measure and keep previewWidth in sync with the actual displayed video element size
  useEffect(() => {
    const wrapper = videoWrapperRef.current;
    if (!wrapper) return;
    const updatePreviewWidth = () => {
      const w = wrapper.clientWidth;
      if (w > 0) {
        setCaptionStyle(prev => (prev.previewWidth === w ? prev : { ...prev, previewWidth: w }));
      }
    };
    updatePreviewWidth();
    const ro = new ResizeObserver(updatePreviewWidth);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [setCaptionStyle]);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeMode, setResizeMode] = useState<"none" | "width-left" | "width-right" | "scale-tr" | "scale-br" | "scale-bl" | "scale-tl">("none");
  const [initialResizeData, setInitialResizeData] = useState({ x: 0, y: 0, width: 0, fontSize: 0, rectWidth: 0 });
  const [snapLines, setSnapLines] = useState({ x: false, y: false });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag if the source is the video player wrapper
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Client X/Y relative to the container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let percentX = (x / rect.width) * 100;
    let percentY = (y / rect.height) * 100;

    let snappedX = false;
    let snappedY = false;

    // Smart snap (within 3%)
    if (Math.abs(percentX - 50) < 3) {
      percentX = 50;
      snappedX = true;
    }
    if (Math.abs(percentY - 50) < 3) {
      percentY = 50;
      snappedY = true;
    }

    setSnapLines({ x: snappedX, y: snappedY });

    // Clamp
    percentX = Math.max(0, Math.min(100, percentX));
    percentY = Math.max(0, Math.min(100, percentY));

    setCaptionStyle(prev => ({
      ...prev,
      positionX: Number(percentX.toFixed(1)),
      positionY: Number(percentY.toFixed(1))
    }));
  };

  const handleResizeStart = (e: React.PointerEvent, mode: typeof resizeMode) => {
    e.stopPropagation();
    setResizeMode(mode);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setInitialResizeData({ x: e.clientX, y: e.clientY, width: captionStyle.width, fontSize: captionStyle.fontSize, rectWidth: rect.width });
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (resizeMode === "none" || !containerRef.current) return;

    if (resizeMode.startsWith("width")) {
      const deltaX = e.clientX - initialResizeData.x;
      // If right handle, positive delta increases width. If left, negative delta increases width.
      const sign = resizeMode === "width-right" ? 1 : -1;
      // Multiply by 2 because it's centered, dragging one side expands both sides
      const percentDelta = (deltaX / initialResizeData.rectWidth) * 100 * 2 * sign;
      setCaptionStyle(prev => ({
        ...prev,
        width: Math.max(2, Math.min(100, initialResizeData.width + percentDelta))
      }));
    } else if (resizeMode.startsWith("scale")) {
      // Use Y delta for scale (dragging up/out increases, down/in decreases)
      const deltaY = e.clientY - initialResizeData.y;
      // If top handles, negative delta increases scale. If bottom handles, positive delta increases scale.
      const sign = (resizeMode === "scale-tr" || resizeMode === "scale-tl") ? -1 : 1;
      const scaleFactor = 1 + ((deltaY * sign) / 200);
      setCaptionStyle(prev => ({
        ...prev,
        fontSize: Math.max(1, Math.min(200, initialResizeData.fontSize * scaleFactor))
      }));
    }
  };

  const handleResizeUp = (e: React.PointerEvent) => {
    setResizeMode("none");
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setSnapLines({ x: false, y: false });
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleReplace = () => {
    setVideoUrl(null);
    setCaptions([]);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      isSeeking.current = true;
      setCurrentTime(videoRef.current.currentTime);
      isSeeking.current = false;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
        setOriginalVideoWidth(videoRef.current.videoWidth);
        setOriginalVideoHeight(videoRef.current.videoHeight);
        // compute proper aspect ratio class
        const aspect = videoRef.current.videoWidth / videoRef.current.videoHeight;
        if (aspect < 0.7) setAspectRatio("9:16");
        else setAspectRatio("16:9");
        
        // Force an immediate read of the layout width so previewWidth is correct
        // even before the user resizes the window.
        setTimeout(() => {
          if (videoWrapperRef.current) {
            setCaptionStyle((s: any) => ({
              ...s,
              previewWidth: videoWrapperRef.current!.clientWidth
            }));
          }
        }, 50);
      }
    }
  };

  const getTransitionProps = () => {
    const baseTransition = { type: "spring" as const, stiffness: 300, damping: 20 };

    switch (captionStyle.transitionType) {
      case "none":
        return { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } };
      case "fade":
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };
      case "pop":
        return { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 }, transition: baseTransition };
      case "zoom":
        return { initial: { opacity: 0, scale: 1.5 }, animate: { opacity: 1, scale: 1 }, transition: baseTransition };
      case "scale":
        return { initial: { opacity: 0, scaleY: 0 }, animate: { opacity: 1, scaleY: 1 }, transition: baseTransition };
      case "slide-x":
        return { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, transition: baseTransition };
      case "slide-y":
        return { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition: baseTransition };
      default:
        return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: baseTransition };
    }
  };

  const renderStyledText = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;

    return caption.words.map((wordObj, i) => {
      // Highlight the word if the current video time is within its start/end boundary
      const isHighlight = currentTime >= wordObj.start && currentTime <= wordObj.end;

      const wordShadow = captionStyle.dropShadow
        ? `0px 0px 15px ${isHighlight ? captionStyle.emphasisColor : captionStyle.dropShadowColor}${Math.round(captionStyle.dropShadowOpacity * 2.55).toString(16).padStart(2, '0')}`
        : 'none';

      const hardShadow = captionStyle.dropShadow
        ? `2px 2px 0px ${captionStyle.dropShadowColor}${Math.round(captionStyle.dropShadowOpacity * 2.55).toString(16).padStart(2, '0')}`
        : 'none';

      return (
        <motion.span
          key={`${caption.id}-${i}`}
          animate={{
            color: isHighlight ? captionStyle.emphasisColor : captionStyle.primaryColor,
            textShadow: isHighlight ? wordShadow : hardShadow,
            scale: isHighlight ? 1.05 : 1,
            y: isHighlight ? -2 : 0,
          }}
          transition={{ duration: 0.1 }}
          className={isHighlight ? "font-black" : "font-bold"}
          style={{
            display: "inline-block",
            marginRight: "0.25em"
          }}
        >
          {wordObj.word}
        </motion.span>
      );
    });
  };

  // Bubble style: pill background behind the active word
  const renderBubbleText = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;
    return caption.words.map((wordObj, i) => {
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <motion.span
          key={`${caption.id}-b-${i}`}
          animate={{
            backgroundColor: isActive ? captionStyle.bubbleSecondaryColor : 'transparent',
            color: isActive ? captionStyle.bubbleTertiaryColor : captionStyle.bubblePrimaryColor,
            scale: isActive ? 1.08 : 1,
            y: isActive ? -2 : 0,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={isActive ? 'font-black' : 'font-bold'}
          style={{
            display: 'inline-block',
            marginRight: '0.25em',
            paddingLeft: isActive ? '0.55em' : '0',
            paddingRight: isActive ? '0.55em' : '0',
            paddingTop: isActive ? '0.1em' : '0',
            paddingBottom: isActive ? '0.1em' : '0',
            borderRadius: '999px',
          }}
        >
          {wordObj.word}
        </motion.span>
      );
    });
  };

  // Hormozi Style
  const renderHormoziText = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;
    return caption.words.map((wordObj, i) => {
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <motion.span
          key={`${caption.id}-h-${i}`}
          animate={{
            color: isActive ? captionStyle.spotlightColor : captionStyle.primaryColor,
            scale: isActive ? 1.2 : 1,
            textShadow: captionStyle.dropShadow
              ? `4px 4px 0px ${captionStyle.dropShadowColor}, 0px 0px 10px rgba(0,0,0,0.5)`
              : 'none',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="font-black uppercase"
          style={{
            display: 'inline-block',
            marginRight: '0.3em',
          }}
        >
          {wordObj.word}
        </motion.span>
      );
    });
  };

  // Ali Abdaal Style
  const renderAliAbdaalText = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;
    return caption.words.map((wordObj, i) => {
      const isSpoken = currentTime >= wordObj.start;
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <motion.span
          key={`${caption.id}-a-${i}`}
          initial={{ opacity: 0 }}
          animate={{
            opacity: isSpoken ? 1 : 0,
            backgroundColor: isActive ? captionStyle.emphasisColor : 'transparent',
            color: captionStyle.primaryColor,
          }}
          transition={{ duration: 0.2 }}
          className="font-normal"
          style={{
            display: 'inline-block',
            marginRight: '0.25em',
            padding: '0 0.1em',
            borderRadius: '4px',
          }}
        >
          {wordObj.word}
        </motion.span>
      );
    });
  };

  // Gadzhi Style
  const renderGadzhiText = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;
    return caption.words.map((wordObj, i) => {
      const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
      return (
        <motion.span
          key={`${caption.id}-g-${i}`}
          animate={{
            color: isActive ? captionStyle.spotlightColor : captionStyle.primaryColor,
            fontWeight: isActive ? 700 : 300,
          }}
          transition={{ duration: 0.15 }}
          className="lowercase"
          style={{
            display: 'inline-block',
            marginRight: '0.25em',
          }}
        >
          {wordObj.word}
        </motion.span>
      );
    });
  };



  // Apple Style
  const renderAppleText = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;
    return (
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
        {caption.words.map((wordObj, i) => {
          const isSpoken = currentTime >= wordObj.start;

          // Blur in as it is spoken, and stay fully visible (no out animation)
          let blurAmount = "0px";
          let opacity = 1;
          let color = captionStyle.emphasisColor;
          let scale = 1;

          if (isSpoken) {
            blurAmount = "0px";
            opacity = 1;
            color = captionStyle.emphasisColor; // bright
            scale = 1.05;
          } else {
            blurAmount = "4px"; // blur future words
            opacity = 0.5;
            color = captionStyle.primaryColor; // inactive (dimmed)
          }

          return (
            <motion.span
              key={`${caption.id}-apple-${i}`}
              animate={{
                color,
                opacity,
                filter: `blur(${blurAmount})`,
                scale,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="font-bold"
              style={{
                fontFamily: "'Satoshi', sans-serif",
                display: 'inline-block',
              }}
            >
              {wordObj.word}
            </motion.span>
          );
        })}
      </div>
    );
  };

  // MogrtShimmerStack Style — 3-tier vertical stack with silver metallic shimmer
  const renderMogrtShimmerStack = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;

    const words = caption.words;

    // Find Focus Word: longest alphabetic word in the segment
    let focusIndex = Math.floor(words.length / 2);
    let maxLen = 0;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].word.replace(/[^a-zA-Z]/g, '');
      if (clean.length > maxLen) {
        maxLen = clean.length;
        focusIndex = i;
      }
    }

    const topWords = words.slice(0, focusIndex);
    const focusWord = words[focusIndex];
    const bottomWords = words.slice(focusIndex + 1);

    const isFocusActive = currentTime >= focusWord.start && currentTime <= focusWord.end;
    const focusDuration = Math.max(0.8, focusWord.end - focusWord.start);

    const shadowStr = captionStyle.dropShadow
      ? `2px 2px 12px ${captionStyle.dropShadowColor}${Math.round(captionStyle.dropShadowOpacity * 2.55).toString(16).padStart(2, '0')}`
      : 'none';

    const renderSupportPhrase = (phraseWords: typeof words, position: 'top' | 'bottom') => {
      if (phraseWords.length === 0) return null;
      const anySpoken = phraseWords.some(w => currentTime >= w.start);
      return (
        <motion.div
          key={position}
          initial={{ opacity: 0, y: position === 'top' ? -10 : 10 }}
          animate={{
            opacity: anySpoken ? 1 : 0,
            y: anySpoken ? 0 : (position === 'top' ? -10 : 10),
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            fontSize: `${captionStyle.fontSize}px`,
            fontWeight: 600,
            color: captionStyle.primaryColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            textAlign: 'center',
            textShadow: shadowStr,
            marginBottom: position === 'top' ? '6px' : '0',
            marginTop: position === 'bottom' ? '6px' : '0',
            overflowWrap: 'break-word',
            maxWidth: '100%',
          }}
        >
          {phraseWords.map((w, i) => {
            const isSpoken = currentTime >= w.start;
            return (
              <motion.span
                key={i}
                animate={{ opacity: isSpoken ? 1 : 0.15 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'inline-block', marginRight: '0.3em' }}
              >
                {w.word}
              </motion.span>
            );
          })}
        </motion.div>
      );
    };

    return (
      <>
        <style>{`
          @keyframes mogrtShimmerSlide {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {renderSupportPhrase(topWords, 'top')}

          {/* Focus Word — 180px, weight 900, silver metallic shimmer */}
          <motion.span
            key={`mogrt-focus-${caption.id}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: currentTime >= focusWord.start ? 1 : 0,
              scale: isFocusActive
                ? [1, 1.1, 1.0]   // 1.1× scale-pop on entry
                : (currentTime >= focusWord.start ? 1.0 : 0.9),
            }}
            transition={{
              opacity: { duration: 0.25 },
              scale: isFocusActive
                ? { duration: 0.45, times: [0, 0.35, 1], ease: ['easeOut', 'easeInOut'] }
                : { duration: 0.2, type: 'spring', stiffness: 300, damping: 20 },
            }}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '100%',
              maxHeight: '1.2em',
              overflow: 'hidden',
              overflowWrap: 'break-word',
              textAlign: 'center',
              fontSize: `${captionStyle.fontSize * 2.8}px`,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              background: 'linear-gradient(45deg, #eee 25%, #fff 50%, #eee 75%)',
              backgroundSize: '400% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: isFocusActive
                ? `mogrtShimmerSlide ${focusDuration}s linear infinite`
                : 'none',
            }}
          >
            {focusWord.word}
          </motion.span>

          {renderSupportPhrase(bottomWords, 'bottom')}
        </div>
      </>
    );
  };

  // NxtgenGenZ Style — Kalakar-style: Top(words) → Hero(1 word with shimmer) → Bottom(words)
  const renderNxtgenGenZ = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;

    const words = caption.words;

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

    const primaryColor = captionStyle.primaryColor || "#ffffff";
    const spotlightColor = captionStyle.spotlightColor || "#A0D83E";
    const lighterSpotlight = captionStyle.emphasisColor || "#AADC56";

    // Font sizes scale dynamically with captionStyle.fontSize (baseline 32)
    const baseFont = captionStyle.fontSize || 32;
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

    const heroGhostBlurStyle: React.CSSProperties = {
      ...ghostBlurStyle,
      background: shimmerGradient,
      backgroundSize: "200% 100%",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };

    const wordStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
      whiteSpace: "pre",
    };

    const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
    const isHeroActive = activeWord && words.indexOf(activeWord) === heroIndex;
    const wrapperOpacity = isHeroActive ? 1 : (words.some(w => currentTime >= w.start) ? 0.8 : 0.3);

    const renderWord = (wordObj: typeof words[0], index: number, isHero: boolean = false) => {
      const isSpoken = currentTime >= wordObj.start;

      if (isHero) {
        return (
          <motion.span
            key={`${caption.id}-${index}`}
            animate={{ opacity: isSpoken ? 1 : 0, y: isSpoken ? 0 : -20 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ ...wordStyle, textAlign: "center" }}
          >
            <span aria-hidden="true" style={heroGhostBlurStyle}>{wordObj.word}</span>
            <span style={{
              fontFamily: captionStyle.fontFamily || "Inter",
              fontSize: `${HERO_FONT_SIZE}px`,
              fontWeight: 900,
              lineHeight: 0.9,
              textTransform: "uppercase",
              background: shimmerGradient,
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)",
            }}>{wordObj.word}</span>
          </motion.span>
        );
      }

      return (
        <motion.span
          key={`${caption.id}-${index}`}
          animate={{ opacity: isSpoken ? 1 : 0, y: isSpoken ? 0 : -20 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{ ...wordStyle, textAlign: "left" }}
        >
          <span aria-hidden="true" style={{ ...ghostBlurStyle, color: primaryColor }}>{wordObj.word}</span>
          <span style={{ fontFamily: captionStyle.fontFamily || "Inter", fontSize: `${SUB_FONT_SIZE}px`, color: primaryColor, fontWeight: 800, lineHeight: 0.9, filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)" }}>{wordObj.word}</span>
        </motion.span>
      );
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "fit-content",
          margin: "0 auto",
          filter: wrapperFilter,
        }}
      >
        {/* Top Line */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: captionStyle.fontFamily || "Inter",
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "left",
              display: "flex",
              gap: "0.5em",
            }}>
              {topWords.map((w, idx) => renderWord(w, idx))}
            </div>
          </div>
        )}

        {/* Hero Line */}
        <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0" }}>
          {renderWord(heroWordObj, heroIndex, true)}
        </div>

        {/* Bottom Line */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "right", width: "100%", position: "relative" }}>
            <div style={{
              fontFamily: captionStyle.fontFamily || "Inter",
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5em",
            }}>
              {bottomWords.map((w, idx) => renderWord(w, heroIndex + 1 + idx))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // NxtgenVengence Style — Cinematic style
  const renderNxtgenVengence = (caption: typeof activeCaption, opts: { heroOnly?: boolean, hideHero?: boolean } = {}) => {
    if (!caption || !caption.words) return null;

    const words = caption.words;

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

    const primaryColor = captionStyle.primaryColor || "#ffffff";
    const baseFont = captionStyle.fontSize || 32;
    const SUB_FONT_SIZE = Math.round(baseFont * 3);
    const HERO_FONT_SIZE = words.length <= 2 ? Math.round(baseFont * 4.5) : Math.round(baseFont * 6.56);

    const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
    const wrapperOpacity = words.some(w => currentTime >= w.start) ? 1 : 0.3;

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
            src: url('/fonts/bastliga/Bastliga One.ttf') format('truetype');
          }
          @font-face {
            font-family: 'Cuturila';
            src: url('/fonts/cuturila.ttf') format('truetype');
          }
          @font-face {
            font-family: 'Droid 1997';
            src: url('/fonts/droid-1997.otf') format('opentype');
          }
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
          @import url('https://fonts.cdnfonts.com/css/gilroy-bold');
        `}</style>

        {/* Top Line (Bastliga One, capitalize, reveal from top) */}
        {topWords.length > 0 && (
          <div style={{ textAlign: "left", width: "100%", position: "relative", visibility: opts.heroOnly ? "hidden" : "visible" }}>
            <div style={{
              fontFamily: "'Bastliga One', cursive, sans-serif",
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "left",
              display: "flex",
              gap: "0.5em",
              textTransform: "capitalize"
            }}>
              {topWords.map((w, idx) => {
                const isSpoken = currentTime >= w.start;
                return (
                  <motion.span
                    key={`top-${idx}`}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: isSpoken ? 1 : 0.15, y: isSpoken ? 0 : -30 }}
                    transition={{ duration: 0.4 }}
                    style={{ whiteSpace: "pre" }}
                  >
                    {w.word}
                  </motion.span>
                );
              })}
            </div>
          </div>
        )}

        {/* Hero Line (Cuturila, uppercase, difference filter, char by char from bottom) */}
        <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0", visibility: opts.hideHero ? "hidden" : "visible" }}>
          <div style={{
            fontFamily: "'Droid 1997', 'Cuturila', 'Syncopate', sans-serif",
            fontSize: `${HERO_FONT_SIZE}px`,
            fontWeight: 900,
            lineHeight: 0.9,
            textTransform: "uppercase",
            color: "#ffffff",
            mixBlendMode: "difference",
            display: "inline-flex",
            justifyContent: "center",
          }}>
            {heroWordObj.word.split("").map((char, charIdx) => {
              const isHeroActive = currentTime >= heroWordObj.start;
              return (
                <motion.span
                  key={`hero-char-${charIdx}`}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: isHeroActive ? 1 : 0, y: isHeroActive ? 0 : 40 }}
                  transition={{ duration: 0.3, delay: isHeroActive ? charIdx * 0.05 : 0 }}
                >
                  {char}
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* Bottom Line (Gilroy, basic in animation) */}
        {bottomWords.length > 0 && (
          <div style={{ textAlign: "right", width: "100%", position: "relative", visibility: opts.heroOnly ? "hidden" : "visible" }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: `${SUB_FONT_SIZE}px`,
              lineHeight: 0.9,
              color: primaryColor,
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5em",
            }}>
              {bottomWords.map((w, idx) => {
                const isSpoken = currentTime >= w.start;
                return (
                  <motion.span
                    key={`bottom-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isSpoken ? 1 : 0.15 }}
                    transition={{ duration: 0.3 }}
                    style={{ whiteSpace: "pre" }}
                  >
                    {w.word}
                  </motion.span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // NxtgenAlpha Style — Cursive style: Top('Aston Script') → Hero(1 word with shimmer) → Bottom('Aston Script')
  const renderNxtgenAlpha = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;

    const words = caption.words;

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

    const primaryColor = captionStyle.primaryColor || "#ffffff";
    const spotlightColor = captionStyle.spotlightColor || "#A0D83E";
    const lighterSpotlight = captionStyle.emphasisColor || "#AADC56";

    // Font sizes scale dynamically with captionStyle.fontSize (baseline 32)
    const baseFont = captionStyle.fontSize || 32;
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

    const heroGhostBlurStyle: React.CSSProperties = {
      ...ghostBlurStyle,
      background: shimmerGradient,
      backgroundSize: "200% 100%",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };

    const wordStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
      whiteSpace: "pre",
    };

    const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
    const isHeroActive = activeWord && words.indexOf(activeWord) === heroIndex;
    const wrapperOpacity = isHeroActive ? 1 : (words.some(w => currentTime >= w.start) ? 0.8 : 0.3);

    const renderWord = (wordObj: typeof words[0], index: number, isHero: boolean = false) => {
      const isSpoken = currentTime >= wordObj.start;

      if (isHero) {
        return (
          <motion.span
            key={`${caption.id}-${index}`}
            animate={{ opacity: isSpoken ? 1 : 0, y: isSpoken ? 0 : -20 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ ...wordStyle, textAlign: "center" }}
          >
            <span aria-hidden="true" style={heroGhostBlurStyle}>{wordObj.word}</span>
            <span style={{
              fontFamily: captionStyle.fontFamily || "Inter",
              fontSize: `${HERO_FONT_SIZE}px`,
              fontWeight: 900,
              lineHeight: 0.9,
              textTransform: "uppercase",
              background: shimmerGradient,
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)",
            }}>{wordObj.word}</span>
          </motion.span>
        );
      }

      return (
        <motion.span
          key={`${caption.id}-${index}`}
          animate={{ opacity: isSpoken ? 1 : 0, y: isSpoken ? 0 : -20 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{ ...wordStyle, textAlign: "left" }}
        >
          <span aria-hidden="true" style={{ ...ghostBlurStyle, fontFamily: "'Aston Script', cursive", fontWeight: 400, color: primaryColor }}>{wordObj.word}</span>
          <span style={{ fontFamily: "'Aston Script', cursive", fontSize: `${SUB_FONT_SIZE}px`, color: primaryColor, fontWeight: 400, lineHeight: 1.1, filter: "drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)" }}>{wordObj.word}</span>
        </motion.span>
      );
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "fit-content",
          margin: "0 auto",
          filter: wrapperFilter,
        }}
      >
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
              {topWords.map((w, idx) => renderWord(w, idx))}
            </div>
          </div>
        )}

        {/* Hero Line */}
        <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0" }}>
          {renderWord(heroWordObj, heroIndex, true)}
        </div>

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
              {bottomWords.map((w, idx) => renderWord(w, heroIndex + 1 + idx))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // NxtgenHorror Style
  const renderNxtgenHorror = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;

    const words = caption.words;

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

    const primaryColor = captionStyle.primaryColor || "#ffffff";
    const baseFont = captionStyle.fontSize || 32;
    const SUB_FONT_SIZE = Math.round(baseFont * 3);
    const HERO_FONT_SIZE = words.length <= 2 ? Math.round(baseFont * 4.5) : Math.round(baseFont * 6.56);

    const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
    const wrapperOpacity = words.some(w => currentTime >= w.start) ? 1 : 0.3;

    const renderWord = (wordObj: typeof words[0], index: number, pos: "top" | "bottom" | "hero") => {
      const isSpoken = currentTime >= wordObj.start;

      if (pos === "top") {
        return (
          <motion.span
            key={`${caption.id}-${index}`}
            animate={{ opacity: isSpoken ? 1 : 0, y: isSpoken ? 0 : -50 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              fontFamily: "'JaggyW01-Regular', sans-serif",
              color: primaryColor,
              whiteSpace: "pre",
            }}
          >
            {wordObj.word}
          </motion.span>
        );
      } else if (pos === "bottom") {
        return (
          <motion.span
            key={`${caption.id}-${index}`}
            animate={{ opacity: isSpoken ? 1 : 0, y: isSpoken ? 0 : 50 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              fontFamily: "'JaggyW01-Regular', sans-serif",
              color: primaryColor,
              whiteSpace: "pre",
            }}
          >
            {wordObj.word}
          </motion.span>
        );
      } else {
        // Hero: trigger chalkStrokeIn animation when the hero word is spoken
        return (
          <motion.span
            key={`${caption.id}-${index}`}
            animate={{ opacity: isSpoken ? 1 : 0 }}
            transition={{ duration: 0 }}
            style={{
              display: "inline-block",
              fontFamily: "'Chalk-y', sans-serif",
              fontSize: `${HERO_FONT_SIZE}px`,
              color: "#ffffff",
              textShadow: "0 0 15px rgba(255,255,255,0.8), 2px 2px 5px rgba(0,0,0,0.5)",
              animation: isSpoken ? "chalkStrokeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
              whiteSpace: "pre",
              opacity: isSpoken ? 1 : 0,
            }}
          >
            {wordObj.word}
          </motion.span>
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
        }}
      >
        <style>{`
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
        <div style={{ textAlign: "center", width: "100%", position: "relative", margin: "10px 0" }}>
          {renderWord(heroWordObj, heroIndex, "hero")}
        </div>

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

  // NxtgenCinemaLine Style
  const renderNxtgenCinemaLine = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;
    
    const words = caption.words;
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

    const renderWord = (wordObj: typeof words[0], i: number, isTarget: boolean, overrideMarginLeft: string = "0.3em") => {
      const isSpoken = currentTime >= wordObj.start;

      const fontFamily = isTarget ? "'Great Vibes', cursive" : "'Satoshi', sans-serif";
      const color = isTarget ? (captionStyle.emphasisColor || "#EF4444") : (captionStyle.primaryColor || "#FFFFFF");
      const fontSize = isTarget ? "2em" : "1em";
      const fontWeight = isTarget ? 400 : 700;

      let opacity = 0;
      let blur = "10px";
      let scale = 0.8;

      if (isSpoken) {
        opacity = 1;
        blur = "0px";
        scale = 1;
      }

      return (
        <motion.span
          key={`${caption.id}-cinemaline-${i}`}
          initial={{ opacity: 0, filter: "blur(10px)", scale: 0.8 }}
          animate={{
            opacity,
            filter: `blur(${blur})`,
            scale,
            color
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            fontFamily,
            fontSize,
            fontWeight,
            display: "inline-block",
            paddingRight: isTarget ? "0.1em" : "0",
            marginLeft: overrideMarginLeft,
            position: "relative",
          }}
        >
          {wordObj.word}
        </motion.span>
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

  // NxtgenDirectorsEdition Style
  const renderNxtgenDirectorsEdition = (caption: typeof activeCaption) => {
    if (!caption || !caption.words) return null;
    
    const words = caption.words;
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

    const renderWord = (wordObj: typeof words[0], i: number, isTarget: boolean, overrideMarginLeft: string = "0.3em") => {
      const isSpoken = currentTime >= wordObj.start;

      const fontFamily = "'Satoshi', sans-serif";
      const color = isTarget ? (captionStyle.emphasisColor || "#EF4444") : (captionStyle.primaryColor || "#FFFFFF");
      const fontSize = isTarget ? "2em" : "1em";
      const fontWeight = isTarget ? 900 : 400;

      let opacity = 0;
      let blur = "10px";
      let scale = 0.8;

      if (isSpoken) {
        opacity = 1;
        blur = "0px";
        scale = 1;
      }

      return (
        <motion.span
          key={`${caption.id}-directors-${i}`}
          initial={{ opacity: 0, filter: "blur(10px)", scale: 0.8 }}
          animate={{
            opacity,
            filter: `blur(${blur})`,
            scale,
            color
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            fontFamily,
            fontSize,
            fontWeight,
            display: "inline-block",
            paddingRight: isTarget ? "0.1em" : "0",
            marginLeft: overrideMarginLeft,
            position: "relative",
          }}
        >
          {wordObj.word}
        </motion.span>
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

  // NxtgenViral & NxtgenEnergetic Style
  const renderNxtgenViralOrEnergetic = (caption: typeof activeCaption, isEnergetic: boolean) => {
    if (!caption || !caption.words) return null;
    
    const words = caption.words;
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

      let fontSize = "1em";
      let color = captionStyle.primaryColor || "#FFFFFF";
      let fontWeight: number | string = 700;
      let textShadow = "none";
      let baseOpacity = 1;
      let alignSelf = "center";

      if (isTargetWord) {
        fontSize = "2.5em";
        color = captionStyle.emphasisColor || "#FACC15";
        fontWeight = 900;
        textShadow = `0 0 15px ${color}90`;
      } else if (isPrecedingTarget) {
        fontSize = "0.65em";
        fontWeight = 500;
        baseOpacity = 0.8;
        alignSelf = "flex-end"; 
      } else if (isLastInNormalLine) {
        fontSize = "0.65em";
        fontWeight = 500;
        baseOpacity = 0.8;
        alignSelf = "flex-end";
      }

      let opacity = 0;
      let blur = isEnergetic ? "0px" : "10px";
      let scale = isEnergetic ? 0 : 0.4;

      if (isSpoken) {
        opacity = baseOpacity;
        blur = "0px";
        scale = 1;
      }

      return (
        <motion.span
          key={`${caption.id}-viral-${globalIndex}`}
          initial={{ opacity: 0, filter: isEnergetic ? "none" : "blur(10px)", scale: isEnergetic ? 0 : 0.4 }}
          animate={{
            opacity,
            filter: isEnergetic ? "none" : `blur(${blur})`,
            scale,
            color
          }}
          transition={isEnergetic 
            ? { type: "spring", stiffness: 400, damping: 25, mass: 0.5 }
            : { duration: 0.15, ease: "easeOut" }}
          style={{
            fontFamily: "'Satoshi', sans-serif",
            fontSize,
            fontWeight,
            textShadow,
            display: "inline-block",
            marginLeft: "0.15em",
            marginRight: "0.15em",
            alignSelf,
            lineHeight: "1",
            paddingBottom: (isPrecedingTarget || isLastInNormalLine) ? (isTargetWord ? "0.3em" : "0.1em") : "0", 
            position: "relative",
          }}
        >
          {wordObj.word}
        </motion.span>
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

  const animProps = getTransitionProps();

  return (
    <div className="flex-1 bg-transparent p-8 flex flex-col relative h-full overflow-hidden">

      <div className="flex justify-between items-center mb-4 absolute top-10 left-10 right-10 z-20 pointer-events-none">
        <button
          onClick={handleReplace}
          className="flex items-center gap-2 bg-black/40 backdrop-blur-2xl hover:bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full pointer-events-auto border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-2xl"
        >
          <RefreshCw className="w-3 h-3 text-sky-400" /> Replace Video
        </button>
        <div className="bg-sky-500/10 backdrop-blur-2xl text-sky-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-sky-500/20 flex items-center gap-2 shadow-2xl">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
          AI Preview Active
        </div>
      </div>

      <div
        className="flex-1 w-full relative flex items-center justify-center rounded-[32px] overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group"
        style={{
          backgroundColor: captionStyle.alphaChannel ? "#0a0a0a" : "rgba(0, 0, 0, 0.4)",
          backgroundImage: captionStyle.alphaChannel
            ? "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)"
            : "none",
          backgroundSize: captionStyle.alphaChannel ? "24px 24px" : "auto",
          backgroundPosition: captionStyle.alphaChannel ? "0 0, 12px 12px" : "auto",
          backdropFilter: "blur(4px)",
          containerType: "size"
        }}
      >
        <div 
          ref={videoWrapperRef}
          className="relative flex items-center justify-center"
          style={{
            width: `min(100cqw, 100cqh * ${(originalVideoWidth || 16) / (originalVideoHeight || 9)})`,
            height: `min(100cqh, 100cqw / ${(originalVideoWidth || 16) / (originalVideoHeight || 9)})`,
          }}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className={`h-full w-full object-contain shadow-2xl transition-opacity duration-300 ${captionStyle.alphaChannel ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              style={{ position: "relative" }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <Sparkles className="w-8 h-8 text-zinc-800" />
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No Source Loaded</p>
            </div>
          )}

          {/* Grid Guidelines (shown during drag) */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Rule of thirds grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  <div className="border-b border-r border-white/20 border-dashed" />
                  <div className="border-b border-r border-white/20 border-dashed" />
                  <div className="border-b border-white/20 border-dashed" />
                  <div className="border-b border-r border-white/20 border-dashed" />
                  <div className="border-b border-r border-white/20 border-dashed" />
                  <div className="border-b border-white/20 border-dashed" />
                  <div className="border-r border-white/20 border-dashed" />
                  <div className="border-r border-white/20 border-dashed" />
                  <div className="" />
                </div>

                {/* Smart Snap Lines */}
                {snapLines.x && (
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] -translate-x-1/2 z-10" />
                )}
                {snapLines.y && (
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] -translate-y-1/2 z-10" />
                )}
                {/* Center dot */}
                {(snapLines.x && snapLines.y) && (
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] -translate-x-1/2 -translate-y-1/2 z-20" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Captions Overlay Container */}
          <div
            className="absolute inset-0 pointer-events-none"
            ref={containerRef}
          >
          {/* Draggable Handle wrapper */}
          <div
            className={`absolute pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none group`}
            style={{
              top: `${captionStyle.positionY}%`,
              left: `${captionStyle.positionX}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: captionStyle.layout === "ali-abdaal"
                ? captionStyle.aliAbdaalPosition
                : (captionStyle.layout === "hormozi" || captionStyle.layout === "gadzhi" || captionStyle.layout === "bubble" || captionStyle.layout === "apple" || captionStyle.layout === "holo")
                  ? 'center'
                  : captionStyle.textAlignment,
              letterSpacing: `${captionStyle.letterSpacing}px`,
              lineHeight: captionStyle.lineSpacing,
              fontSize: `${captionStyle.fontSize}px`,
              fontFamily: `'${captionStyle.fontFamily}', sans-serif`,
              touchAction: 'none',
              width: `${captionStyle.width}%`,
              maxWidth: '100%',
              padding: '1rem', // generous hit area for dragging
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Bounding Box overlay */}
            <div className={`absolute inset-0 border-2 border-dashed ${resizeMode !== 'none' ? 'border-sky-400/50' : 'border-sky-400/30 md:border-sky-400/0'} group-hover:border-sky-400/50 transition-colors pointer-events-none z-50`}>
              {/* Left Edge Width */}
              <div
                className={`absolute left-[-10px] md:left-[-6px] top-1/2 -translate-y-1/2 w-5 h-8 md:w-3 md:h-8 bg-white border border-sky-500 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 cursor-ew-resize pointer-events-auto touch-none ${resizeMode === 'width-left' ? 'opacity-100 scale-110' : ''} transition-transform`}
                onPointerDown={(e) => handleResizeStart(e, "width-left")}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
              />
              {/* Right Edge Width */}
              <div
                className={`absolute right-[-10px] md:right-[-6px] top-1/2 -translate-y-1/2 w-5 h-8 md:w-3 md:h-8 bg-white border border-sky-500 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 cursor-ew-resize pointer-events-auto touch-none ${resizeMode === 'width-right' ? 'opacity-100 scale-110' : ''} transition-transform`}
                onPointerDown={(e) => handleResizeStart(e, "width-right")}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
              />
              {/* Corner Scales */}
              <div
                className={`absolute top-[-10px] md:top-[-6px] left-[-10px] md:left-[-6px] w-5 h-5 md:w-3 md:h-3 bg-sky-500 border-2 border-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 cursor-nwse-resize pointer-events-auto touch-none ${resizeMode === 'scale-tl' ? 'opacity-100 scale-150' : ''} transition-transform`}
                onPointerDown={(e) => handleResizeStart(e, "scale-tl")}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
              />
              {/* TR */}
              <div
                className={`absolute top-[-10px] md:top-[-6px] right-[-10px] md:right-[-6px] w-5 h-5 md:w-3 md:h-3 bg-sky-500 border-2 border-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 cursor-nesw-resize pointer-events-auto touch-none ${resizeMode === 'scale-tr' ? 'opacity-100 scale-150' : ''} transition-transform`}
                onPointerDown={(e) => handleResizeStart(e, "scale-tr")}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
              />
              {/* BL */}
              <div
                className={`absolute bottom-[-10px] md:bottom-[-6px] left-[-10px] md:left-[-6px] w-5 h-5 md:w-3 md:h-3 bg-sky-500 border-2 border-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 cursor-nesw-resize pointer-events-auto touch-none ${resizeMode === 'scale-bl' ? 'opacity-100 scale-150' : ''} transition-transform`}
                onPointerDown={(e) => handleResizeStart(e, "scale-bl")}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
              />
              {/* BR */}
              <div
                className={`absolute bottom-[-10px] md:bottom-[-6px] right-[-10px] md:right-[-6px] w-5 h-5 md:w-3 md:h-3 bg-sky-500 border-2 border-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 cursor-nwse-resize pointer-events-auto touch-none ${resizeMode === 'scale-br' ? 'opacity-100 scale-150' : ''} transition-transform`}
                onPointerDown={(e) => handleResizeStart(e, "scale-br")}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
              />
            </div>
            {captionStyle.layout === "modern" ? (
              <ModernCaption />
            ) : captionStyle.layout === "holo" ? (
              <HoloCaption />
            ) : (
              <AnimatePresence>
                {activeCaption && captionStyle.layout === "nxtgen-vengence" ? (
                  <div key={activeCaption.id} className="w-full px-16">
                    {renderNxtgenVengence(activeCaption, { hideHero: true })}
                  </div>
                ) : activeCaption && (
                  <motion.div
                    key={activeCaption.id}
                    {...animProps}
                    className="w-full px-16"
                  >
                    {captionStyle.layout === "bubble" ? renderBubbleText(activeCaption) :
                      captionStyle.layout === "hormozi" ? renderHormoziText(activeCaption) :
                        captionStyle.layout === "ali-abdaal" ? renderAliAbdaalText(activeCaption) :
                          captionStyle.layout === "gadzhi" ? renderGadzhiText(activeCaption) :
                            captionStyle.layout === "apple" ? renderAppleText(activeCaption) :
                              captionStyle.layout === "mogrt-shimmer-stack" ? renderMogrtShimmerStack(activeCaption) :
                                captionStyle.layout === "nxtgen-genz" ? renderNxtgenGenZ(activeCaption) :
                                  captionStyle.layout === "nxtgen-alpha" ? renderNxtgenAlpha(activeCaption) :
                                    captionStyle.layout === "nxtgen-horror" ? renderNxtgenHorror(activeCaption) :
                                      captionStyle.layout === "nxtgen-cinemaline" ? renderNxtgenCinemaLine(activeCaption) :
                                      captionStyle.layout === "nxtgen-directors-edition" ? renderNxtgenDirectorsEdition(activeCaption) :
                                      captionStyle.layout === "nxtgen-viral" ? renderNxtgenViralOrEnergetic(activeCaption, false) :
                                      captionStyle.layout === "nxtgen-energetic" ? renderNxtgenViralOrEnergetic(activeCaption, true) :
                                        <div className="tracking-tight leading-tight">{renderStyledText(activeCaption)}</div>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
          {/* Secondary wrapper for Nxtgen Vengence Hero line (to break out of transform stacking context) */}
          <AnimatePresence>
            {activeCaption && captionStyle.layout === "nxtgen-vengence" && (
              <div
                className="absolute pointer-events-none select-none"
                style={{
                  top: `${captionStyle.positionY}%`,
                  left: `${captionStyle.positionX}%`,
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  letterSpacing: `${captionStyle.letterSpacing}px`,
                  lineHeight: captionStyle.lineSpacing,
                  fontSize: `${captionStyle.fontSize}px`,
                  fontFamily: `'${captionStyle.fontFamily}', sans-serif`,
                  width: `${captionStyle.width}%`,
                  maxWidth: '100%',
                  padding: '1rem',
                  mixBlendMode: 'difference',
                  zIndex: 20,
                }}
              >
                <div className="w-full px-16">
                  {renderNxtgenVengence(activeCaption, { heroOnly: true })}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
        </div> {/* Close the new aspect ratio wrapper div */}

        <div className="absolute bottom-8 right-8 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            NxtGen <span className="text-sky-500">Captions</span>
          </h1>
        </div>
      </div>
    </div>
  );
}
