"use client";

import React, { useRef, useEffect } from "react";
import { useCaptionContext } from "../context/CaptionContext";

export default function VideoPlayer() {
  const { videoUrl, setCurrentTime, setAspectRatio } = useCaptionContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoHeight > videoWidth) {
        setAspectRatio("9:16");
      } else {
        setAspectRatio("16:9");
      }
    }
  };

  if (!videoUrl) return null;

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/50">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        controls
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  );
}
