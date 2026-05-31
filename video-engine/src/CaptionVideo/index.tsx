import React from "react";
import { AbsoluteFill, Video, useVideoConfig } from "remotion";
import { CaptionVideoProps } from "../types";
import { CaptionOverlay } from "./CaptionOverlay";

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
        <Video
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
            justifyContent: "flex-end",
            alignItems: "flex-end",
            padding: 20,
            zIndex: 40,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: "Inter, sans-serif",
              color: "rgba(255, 255, 255, 0.6)",
              fontWeight: 600,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "8px 16px",
              borderRadius: 8,
            }}
          >
            NxtGen Captions
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
