import React from "react";
import { Composition } from "remotion";
import { CaptionVideo } from "./CaptionVideo";
import { CaptionVideoProps } from "./types";

/**
 * Root — registers all Remotion compositions.
 * The composition id "CaptionVideo" is what the CLI targets with --composition.
 *
 * IMPORTANT: Duration, width, height, and fps are dynamically set from props
 * at render time via calculateMetadata - not from these defaults.
 */
export const RemotionRoot: React.FC = () => {
  // Default props used only for local development / preview
  const defaultProps: CaptionVideoProps = {
    src: "http://localhost:3001/uploads/sample.mp4",
    durationInSeconds: 30,
    captions: [
      {
        id: "1",
        start: 0,
        end: 3,
        text: "Welcome to NxtGen Captions",
        words: [
          { word: "Welcome",  start: 0.0, end: 0.5 },
          { word: "to",       start: 0.5, end: 0.7 },
          { word: "NxtGen",   start: 0.7, end: 1.2 },
          { word: "Captions", start: 1.2, end: 2.0 },
        ],
      },
    ],
    style: {
      template: "modern",
      layout: "modern",
      fontSize: 52,
      primaryColor: "#ffffff",
      emphasisColor: "#38bdf8",
      fontFamily: "Inter",
      fontWeight: "700",
      positionX: 50,
      positionY: 80,
      width: 80,
      letterSpacing: 0,
      lineSpacing: 1.4,
      textAlignment: "center",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowOpacity: 60,
      emphasisWords: true,
      emphasisGlow: false,
      emphasisGlowColor: "#38bdf8",
      emphasisGlowIntensity: 10,
      bubblePrimaryColor: "#ffffff",
      bubbleSecondaryColor: "#38bdf8",
      bubbleTertiaryColor: "#000000",
      spotlightColor: "#facc15",
      aliAbdaalPosition: "center",
      kineticLayout: "center",
      transitionTarget: "word",
      transitionType: "fade",
      dynamicSpeed: false,
    },
  };

  return (
    <Composition
      id="CaptionVideo"
      component={CaptionVideo as any}
      // Use placeholder values - will be overridden by calculateMetadata
      durationInFrames={30}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const p = props as Partial<CaptionVideoProps>;
        const durationInSeconds = p.durationInSeconds ?? 30;
        const fps = p.fps ?? 30;
        const width = p.width ?? 1280;
        const height = p.height ?? 720;

        return {
          durationInFrames: Math.round(durationInSeconds * fps),
          fps,
          width,
          height,
          props,
        };
      }}
    />
  );
};
