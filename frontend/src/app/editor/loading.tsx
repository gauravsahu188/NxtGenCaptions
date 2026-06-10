"use client";

import React from "react";

export default function EditorLoading() {
  return (
    <div className="min-h-screen bg-[#050506] text-[#EDEDEF] relative overflow-hidden font-sans flex flex-col">
      {/* Background Lighting System */}
      <div className="absolute inset-0 bg-[#020203] z-0 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.03),transparent_50%)] z-0 pointer-events-none" />

      {/* Navbar skeleton */}
      <nav className="w-full px-6 md:px-8 py-3 bg-[#050505] border-b border-white/5 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white/5 animate-pulse" />
          <div className="w-20 h-4 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="w-24 h-8 rounded-full bg-white/5 animate-pulse" />
          <div className="w-24 h-8 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
      </nav>

      {/* Workspace Skeleton */}
      <div className="flex-1 flex min-h-0 relative z-10 w-full">
        {/* Left Sidebar (Captions List skeleton) */}
        <div className="w-80 md:w-96 border-r border-white/5 bg-[#050506]/60 backdrop-blur-md flex flex-col shrink-0">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="w-24 h-5 rounded bg-white/5 animate-pulse" />
              <div className="w-16 h-3 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
              <div className="w-24 h-8 rounded-lg bg-white/5 animate-pulse" />
            </div>
          </div>

          {/* Sidebar Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-4 rounded bg-white/5 animate-pulse" />
                  <div className="w-2 h-px bg-zinc-800" />
                  <div className="w-10 h-4 rounded bg-white/5 animate-pulse" />
                </div>
                <div className="w-full h-8 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Center / Right Editor Workspace */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#020203]/40">
          {/* Main Video Screen Area */}
          <div className="flex-1 flex flex-col p-6 space-y-6">
            {/* Player Frame skeleton */}
            <div className="flex-1 bg-black/60 rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20" />
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-white/10 rounded-full" />
                </div>
                <div className="w-32 h-4 rounded bg-white/5 animate-pulse" />
              </div>
            </div>

            {/* Timeline Waveform skeleton */}
            <div className="h-24 bg-white/2 border border-white/5 rounded-2xl p-4 flex flex-col justify-between shrink-0">
              <div className="flex justify-between">
                <div className="w-12 h-3 rounded bg-white/5 animate-pulse" />
                <div className="w-12 h-3 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="flex items-end gap-1 h-8">
                {[...Array(30)].map((_, i) => {
                  const heights = ["h-3", "h-6", "h-4", "h-8", "h-5", "h-2", "h-7"];
                  const hClass = heights[i % heights.length];
                  return (
                    <div key={i} className={`flex-1 ${hClass} bg-white/5 rounded-full animate-pulse`} />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar (Properties panel skeleton) */}
          <div className="w-80 border-t md:border-t-0 md:border-l border-white/5 bg-[#050506]/40 backdrop-blur-md p-6 space-y-6 shrink-0 hidden lg:block">
            <div className="w-36 h-6 rounded bg-white/5 animate-pulse" />
            <div className="h-px bg-white/5" />
            <div className="space-y-4">
              <div className="w-20 h-4 rounded bg-white/5 animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
                <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-4 rounded bg-white/5 animate-pulse" />
              <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
