import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

export interface NxtGenGenZProps {
  /** Top line text (left aligned) */
  topText: string;
  /** Hero text (center, uppercase, largest) */
  heroText: string;
  /** Bottom line text (right aligned) */
  bottomText: string;
  /** Primary color for tiers 1 and 3 */
  primaryColor?: string;
  /** Spotlight color for hero shimmer */
  spotlightColor?: string;
  /** Lighter spotlight color (40% stop) */
  lighterSpotlight?: string;
  /** Font family (default: Inter/Montserrat) */
  fontFamily?: string;
  /** Animation duration in seconds */
  durationInSeconds?: number;
  /** When to start animation */
  startTime?: number;
}

const DEFAULT_FONT = "'Inter', 'Montserrat', sans-serif";

export const NxtGenGenZ: React.FC<NxtGenGenZProps> = ({
  topText,
  heroText,
  bottomText,
  primaryColor = "#ffffff",
  spotlightColor = "#8B5CF6",
  lighterSpotlight = "#A78BFA",
  fontFamily = DEFAULT_FONT,
  durationInSeconds = 2,
  startTime = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = startTime * fps;
  const totalFrames = durationInSeconds * fps;

  // Animation progress (0 to 1 over the duration)
  const progress = interpolate(
    frame,
    [startFrame, startFrame + totalFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Shimmer animation - moves from 0% to 200%
  const shimmerPosition = interpolate(progress, [0, 1], [0, 200]);

  // Opacity fade in
  const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateLeft: "clamp" });

  // 7-stop gradient for metallic shimmer effect
  const shimmerGradient = `linear-gradient(90deg,
    ${spotlightColor} 0%,
    ${lighterSpotlight} 20%,
    ${spotlightColor} 40%,
    ${lighterSpotlight} 60%,
    ${spotlightColor} 80%,
    ${lighterSpotlight} 100%
  )`;

  // Calculate the exact ratio: 209.92 / 96 = 2.185
  const HERO_FONT_SIZE = 209.92;
  const SUB_FONT_SIZE = 96;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        opacity,
        // Double Glow Filter Stack
        filter: `
          drop-shadow(${spotlightColor} 0px 0px 100px)
          drop-shadow(rgba(0, 0, 0, 0.35) 5px 5px 15px)
        `,
      }}
    >
      {/* Tier 1: Top Line - Left aligned, 96px, font-weight 800 */}
      <div
        style={{
          position: "relative",
          textAlign: "left",
          fontSize: `${SUB_FONT_SIZE}px`,
          fontWeight: 800,
          lineHeight: 0.9,
          textTransform: "uppercase",
          marginBottom: "15px",
        }}
      >
        {/* Ghost Blur Layer */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "120%",
            height: "80%",
            color: primaryColor,
            filter: "blur(10px)",
            opacity: 0.4,
            transform: "translateY(10%)",
          }}
        >
          {topText}
        </span>
        {/* Main Text */}
        <span style={{ color: primaryColor, position: "relative", zIndex: 1 }}>
          {topText}
        </span>
      </div>

      {/* Tier 2: Hero - Center aligned, ~210px, font-weight 900, metallic shimmer */}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          fontSize: `${HERO_FONT_SIZE}px`,
          fontWeight: 900,
          lineHeight: 0.9,
          textTransform: "uppercase",
          marginBottom: "15px",
        }}
      >
        {/* Ghost Blur Layer */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "120%",
            height: "80%",
            background: shimmerGradient,
            backgroundSize: "200% 100%",
            backgroundPosition: `${shimmerPosition}% 0`,
            filter: "blur(10px)",
            opacity: 0.4,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {heroText}
        </span>
        {/* Main Text with Metallic Shimmer */}
        <span
          style={{
            background: shimmerGradient,
            backgroundSize: "200% 100%",
            backgroundPosition: `${shimmerPosition}% 0`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            position: "relative",
            zIndex: 1,
          }}
        >
          {heroText}
        </span>
      </div>

      {/* Tier 3: Bottom Line - Right aligned, 96px, font-weight 800 */}
      <div
        style={{
          position: "relative",
          textAlign: "right",
          fontSize: `${SUB_FONT_SIZE}px`,
          fontWeight: 800,
          lineHeight: 0.9,
          textTransform: "uppercase",
        }}
      >
        {/* Ghost Blur Layer */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120%",
            height: "80%",
            color: primaryColor,
            filter: "blur(10px)",
            opacity: 0.4,
            transform: "translateY(10%)",
          }}
        >
          {bottomText}
        </span>
        {/* Main Text */}
        <span style={{ color: primaryColor, position: "relative", zIndex: 1 }}>
          {bottomText}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export default NxtGenGenZ;