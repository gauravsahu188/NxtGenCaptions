import React from "react";
import { AbsoluteFill, OffthreadVideo, useVideoConfig, Img } from "remotion";
import { CaptionVideoProps } from "../types";
import { CaptionOverlay } from "./CaptionOverlay";
import logoPng from "../assets/logo.png";

/**
 * CaptionVideo — the main Remotion composition.
 *
 * Accepts:
 *   - src: path/URL to the source video file
 *   - captions: array of CaptionSegment objects (from Deepgram/Whisper)
 *   - style: user-selected CaptionStyleProps
 *   - showWatermark: whether to show watermark (default true for free plan)
 */
export const CaptionVideo: React.FC<CaptionVideoProps & { alphaChannel?: boolean }> = ({
  src,
  captions,
  style,
  showWatermark = true,
  alphaChannel,
}) => {
  const { width, height } = useVideoConfig();
  const isAlpha = alphaChannel || (style as any)?.alphaChannel || (style as any)?.transparent;

  return (
    <AbsoluteFill style={{ background: isAlpha ? "transparent" : "#000" }}>
      {!isAlpha && (
        <OffthreadVideo
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <CaptionOverlay captions={captions} style={style} />

      {/* Watermark overlay for free plan */}
      {showWatermark && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 40,
            opacity: 0.3,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              padding: "16px 32px",
              borderRadius: 24,
            }}
          >
            <Img src={logoPng} style={{ width: 64, height: 64 }} />
            <div
              style={{
                fontSize: 42,
                fontFamily: "Inter, sans-serif",
                color: "rgba(255, 255, 255, 0.95)",
                fontWeight: 800,
                textShadow: "0px 4px 12px rgba(0,0,0,0.6)",
              }}
            >
              NxtGen Captions
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
