"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { useCaptionContext } from "../../context/CaptionContext";
import {
  Play, Pause, Volume2, VolumeX, ZoomIn, ZoomOut,
  SkipBack, SkipForward, Scissors, ChevronUp, ChevronDown
} from "lucide-react";

export default function Timeline() {
  const {
    captions, currentTime, setCurrentTime,
    duration, isPlaying, setIsPlaying
  } = useCaptionContext();

  const [zoom, setZoom] = useState(1); // 1x = full duration visible
  const [scrollLeft, setScrollLeft] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const currentTimeRef = useRef(currentTime);

  // Keep ref in sync
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  // Tick loop for playback
  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      const tick = (now: number) => {
        const delta = (now - (lastTickRef.current ?? now)) / 1000;
        lastTickRef.current = now;
        const next = currentTimeRef.current + delta;
        if (next >= duration) {
          setCurrentTime(duration);
          setIsPlaying(false);
          return;
        }
        setCurrentTime(next);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, duration]);

  // Convert x position in track to time
  const xToTime = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const visibleDuration = duration / zoom;
    const startTime = scrollLeft;
    return startTime + fraction * visibleDuration;
  }, [duration, zoom, scrollLeft]);

  const timeToX = useCallback((time: number) => {
    const visibleDuration = duration / zoom;
    const fraction = (time - scrollLeft) / visibleDuration;
    return Math.max(0, Math.min(100, fraction * 100));
  }, [duration, zoom, scrollLeft]);

  // Playhead drag
  const handleTrackPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingPlayhead(true);
    const t = xToTime(e.clientX);
    setCurrentTime(t);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleTrackPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingPlayhead) return;
    const t = xToTime(e.clientX);
    setCurrentTime(t);
  };

  const handleTrackPointerUp = () => {
    setIsDraggingPlayhead(false);
  };

  // Zoom
  const zoomIn = () => setZoom((z) => Math.min(z * 1.5, 20));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.5, 1));

  // Skip
  const skipBack = () => setCurrentTime(Math.max(0, currentTime - 5));
  const skipForward = () => setCurrentTime(Math.min(duration, currentTime + 5));

  // Ruler ticks
  const visibleDuration = duration / zoom;
  const startTime = scrollLeft;
  const endTime = startTime + visibleDuration;

  const generateTicks = () => {
    const tickInterval = visibleDuration <= 10 ? 1 : visibleDuration <= 60 ? 5 : visibleDuration <= 300 ? 30 : 60;
    const ticks: number[] = [];
    const first = Math.ceil(startTime / tickInterval) * tickInterval;
    for (let t = first; t <= endTime; t += tickInterval) {
      ticks.push(t);
    }
    return { ticks, tickInterval };
  };

  const { ticks } = generateTicks();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
  };

  const playheadX = timeToX(currentTime);

  return (
    <div className="w-full glass-panel border-t border-white/5 flex flex-col z-30 bg-transparent select-none md:h-[240px]">
      {/* Header Controls */}
      <div className="min-h-[48px] border-b border-white/5 flex items-center justify-between px-3 py-2 bg-white/3 flex-wrap gap-y-2 gap-x-1">
        {/* Playback controls */}
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            onClick={skipBack}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center transition-all hover:text-white"
          >
            <SkipBack className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-90"
          >
            {isPlaying
              ? <Pause className="w-3 h-3 fill-current" />
              : <Play className="w-3 h-3 fill-current ml-0.5" />
            }
          </button>
          <button
            onClick={skipForward}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center transition-all hover:text-white"
          >
            <SkipForward className="w-3 h-3" />
          </button>

          {/* Volume */}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center transition-all hover:text-white ml-1"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
            className="w-12 h-1 accent-sky-400 cursor-pointer"
          />
        </div>

        {/* Time display */}
        <span className="text-[10px] font-black font-mono tracking-widest text-white bg-black/50 px-2 py-1 rounded border border-white/5">
          {formatTime(currentTime)} <span className="text-zinc-600">/</span> {formatTime(duration)}
        </span>

        {/* Zoom + Extras */}
        <div className="flex items-center gap-1 text-zinc-500">
          <span className="text-[9px] font-bold text-zinc-600 w-5 text-right mr-1">{zoom.toFixed(1)}x</span>
          <div className="flex items-center bg-white/5 rounded border border-white/5">
            <button onClick={zoomOut} className="p-1 hover:text-white transition-colors hover:bg-white/10" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-white/10" />
            <button onClick={zoomIn} className="p-1 hover:text-white transition-colors hover:bg-white/10" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Split at Playhead">
            <Scissors className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <div className="md:hidden w-full bg-[#050505] border-b border-white/10 flex flex-col">
        <button onClick={() => setMobileExpanded(!mobileExpanded)} className="w-full py-2 flex justify-center items-center gap-2 text-zinc-400 hover:text-white transition-colors">
           {mobileExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />} 
           <span className="text-xs font-bold uppercase tracking-widest">Timeline Tracks</span>
        </button>
      </div>

      {/* Track Area */}
      <div className={`flex-1 relative overflow-hidden flex-col ${mobileExpanded ? 'flex h-[200px] md:h-auto' : 'hidden md:flex'}`}>
        {/* Ruler */}
        <div className="h-6 relative bg-black/20 border-b border-white/5 shrink-0">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute top-0 bottom-0 flex flex-col items-start"
              style={{ left: `${timeToX(t)}%` }}
            >
              <div className="w-px h-2 bg-white/20 mt-0" />
              <span className="text-[8px] font-mono text-zinc-600 ml-0.5 leading-none mt-0.5">{formatTime(t)}</span>
            </div>
          ))}
        </div>

        {/* Tracks */}
        <div
          ref={trackRef}
          className="flex-1 relative cursor-crosshair px-0 py-2 space-y-2 overflow-hidden"
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
        >
          {/* Captions Track */}
          <div className="relative h-9 mx-6">
            <div className="absolute inset-0 bg-white/2 rounded-xl border border-white/5" />
            <span className="absolute -left-10 top-1/2 -translate-y-1/2 text-[8px] font-black text-zinc-700 tracking-[0.15em] uppercase" style={{ writingMode: "horizontal-tb" }}>Text</span>
            {captions.map((cap) => {
              const left = timeToX(cap.start);
              const right = timeToX(cap.end);
              const width = right - left;
              if (width < 0.1) return null;
              return (
                <div
                  key={cap.id}
                  className="absolute top-1 h-7 bg-white text-black text-[9px] font-black px-2 rounded-lg flex items-center overflow-hidden whitespace-nowrap border border-white shadow-lg shadow-black/50 cursor-pointer hover:bg-sky-100 transition-colors"
                  style={{ left: `${left}%`, width: `${width}%`, minWidth: 4 }}
                  onPointerDown={(e) => { e.stopPropagation(); setCurrentTime(cap.start); }}
                  title={cap.text}
                >
                  <span className="truncate">{cap.text}</span>
                </div>
              );
            })}
          </div>

          {/* Audio waveform track */}
          <div className="relative h-9 mx-6">
            <div className="absolute inset-0 bg-sky-500/2 rounded-xl border border-sky-500/5" />
            <span className="absolute -left-10 top-1/2 -translate-y-1/2 text-[8px] font-black text-sky-900 tracking-[0.15em] uppercase">Wave</span>
            <div className="absolute inset-1 flex items-center overflow-hidden opacity-30">
              <svg width="100%" height="100%" preserveAspectRatio="none">
                {Array.from({ length: 120 }).map((_, i) => (
                  <rect
                    key={i}
                    x={`${(i / 120) * 100}%`}
                    y={`${50 - (Math.sin(i * 0.4) * 20 + Math.sin(i * 1.3) * 15 + 10)}%`}
                    width="0.5%"
                    height={`${20 + Math.abs(Math.sin(i * 0.7) * 50 + Math.sin(i * 2.1) * 20)}%`}
                    fill="url(#wave-grad)"
                    rx="1"
                  />
                ))}
                <defs>
                  <linearGradient id="wave-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Playhead */}
          <div
            className={`absolute top-0 bottom-0 z-20 pointer-events-none ${isDraggingPlayhead ? "opacity-100" : "opacity-90"}`}
            style={{ left: `${playheadX}%` }}
          >
            {/* Line */}
            <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
            {/* Head */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="bg-white text-black text-[8px] font-black px-1.5 py-0.5 rounded-b shadow-lg whitespace-nowrap">
                {formatTime(currentTime)}
              </div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
            </div>
          </div>
        </div>

        {/* Horizontal scrollbar for zoom > 1 */}
        {zoom > 1 && (
          <div className="h-2 px-6 mb-1">
            <input
              type="range"
              min={0}
              max={Math.max(0, duration - duration / zoom)}
              step={0.1}
              value={scrollLeft}
              onChange={(e) => setScrollLeft(Number(e.target.value))}
              className="w-full h-1 accent-sky-400 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
