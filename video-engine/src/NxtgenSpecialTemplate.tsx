import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

export interface NxtgenSpecialTemplateProps {
  /** 2 words for top line */
  topLine: [string, string];
  /** Single hero word for middle line */
  middleWord: string;
  /** 2 words for bottom line */
  bottomLine: [string, string];
  /** Color for Lines 1 and 3 */
  primaryColor: string;
  /** Color for Line 2 (hero) */
  emphasisColor: string;
  /** Drop shadow color (default: rgba(0,0,0,0.7)) */
  shadowColor?: string;
  /** Font family (default: Montserrat Extra Bold) */
  fontFamily?: string;
  /** Total duration for animation sequence in seconds */
  durationInSeconds?: number;
  /** When to start animation (in seconds) */
  startTime?: number;
}

const DEFAULT_FONT = "'Montserrat', 'Inter Black', 'Inter', sans-serif";

function calculateShadow(
  angle: number,
  distance: number,
  blur: number,
  color: string
): string {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians) * distance;
  const dy = Math.sin(radians) * distance;
  return `${dx}px ${dy}px ${blur}px ${color}`;
}

export const NxtgenSpecialTemplate: React.FC<NxtgenSpecialTemplateProps> = ({
  topLine,
  middleWord,
  bottomLine,
  primaryColor,
  emphasisColor,
  shadowColor = "rgba(0,0,0,0.7)",
  fontFamily = DEFAULT_FONT,
  durationInSeconds = 2,
  startTime = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = startTime * fps;
  const totalFrames = durationInSeconds * fps;

  // 375° = 360° + 15° = shallow downward-right trajectory
  const shadowAngle = 375;
  const shadowDistance = 8;
  const shadowBlur = 4;
  const shadowOpacity = 0.7;

  // Multi-layered shadow for "long drop" effect that overlaps across lines
  const dropShadow = `
    ${calculateShadow(shadowAngle, shadowDistance, shadowBlur, shadowColor)},
    ${calculateShadow(shadowAngle, shadowDistance * 1.8, shadowBlur * 1.5, shadowColor)},
    ${calculateShadow(shadowAngle, shadowDistance * 2.8, shadowBlur * 2.5, shadowColor)}
  `.trim();

  // Animation timings
  // Line 2 (middle) pops in first: frames 5-20
  const line2Start = 5;
  const line2End = 20;
  const line2Progress = interpolate(
    frame,
    [startFrame + line2Start, startFrame + line2End],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const line2Scale = interpolate(line2Progress, [0, 1], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Spring-like easing
  });

  // Line 1 (top) fades in from top: frames 15-30
  const line1Start = 15;
  const line1End = 30;
  const line1Progress = interpolate(
    frame,
    [startFrame + line1Start, startFrame + line1End],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const line1Opacity = line1Progress;
  const line1Y = interpolate(line1Progress, [0, 1], [-30, 0]);

  // Line 3 (bottom) fades in from bottom: frames 25-40
  const line3Start = 25;
  const line3End = 40;
  const line3Progress = interpolate(
    frame,
    [startFrame + line3Start, startFrame + line3End],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const line3Opacity = line3Progress;
  const line3Y = interpolate(line3Progress, [0, 1], [30, 0]);

  // Calculate scale factor (0.8 → 1.0)
  const scaleValue = 0.8 + line2Scale * 0.2;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        textTransform: "uppercase",
        letterSpacing: "-0.02em",
      }}
    >
      {/* Line 1 (Top): 2 words, centered with gap */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          color: primaryColor,
          fontSize: "60px",
          fontWeight: 800,
          textShadow: dropShadow,
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
          lineHeight: 1.1,
          marginBottom: "20px",
        }}
      >
        <span>{topLine[0]}</span>
        <span>{topLine[1]}</span>
      </div>

      {/* Line 2 (Middle): 1 hero word, largest font, full width */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          color: emphasisColor,
          fontSize: "180px",
          fontWeight: 900,
          textShadow: dropShadow,
          transform: `scale(${scaleValue})`,
          lineHeight: 0.85,
          marginBottom: "20px",
        }}
      >
        {middleWord}
      </div>

      {/* Line 3 (Bottom): 2 words, frame effect */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          color: primaryColor,
          fontSize: "60px",
          fontWeight: 800,
          textShadow: dropShadow,
          opacity: line3Opacity,
          transform: `translateY(${line3Y}px)`,
          lineHeight: 1.1,
        }}
      >
        <span>{bottomLine[0]}</span>
        <span>{bottomLine[1]}</span>
      </div>
    </AbsoluteFill>
  );
};

export default NxtgenSpecialTemplate;