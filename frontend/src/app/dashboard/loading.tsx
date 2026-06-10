"use client";

import React from "react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#050506] text-[#EDEDEF] relative overflow-hidden font-sans">
      {/* Background Lighting System */}
      <div className="absolute inset-0 bg-[#020203] z-0 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.05),transparent_50%)] z-0 pointer-events-none" />

      <div className="relative z-10">
        {/* Navbar skeleton */}
        <nav className="w-full px-6 md:px-12 py-5 bg-[#050505] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-white/5 animate-pulse" />
            <div className="w-24 h-5 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="w-20 h-4 rounded bg-white/5 animate-pulse" />
            <div className="w-20 h-4 rounded bg-white/5 animate-pulse" />
            <div className="w-20 h-4 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-16 space-y-10 md:space-y-16">
          {/* Welcome Section Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="w-32 h-4 rounded bg-white/5 animate-pulse" />
              <div className="w-2/3 max-w-md h-12 rounded bg-white/5 animate-pulse" />
              <div className="w-28 h-6 rounded-full bg-white/5 animate-pulse" />
            </div>
            
            <div className="flex w-full md:w-auto gap-4 mt-6 md:mt-0">
              <div className="flex-1 md:flex-none w-full md:w-36 h-12 rounded-xl bg-white/5 animate-pulse" />
              <div className="flex-1 md:flex-none w-full md:w-36 h-12 rounded-xl bg-white/5 animate-pulse" />
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 w-12 h-12 animate-pulse" />
                  <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
                </div>
                
                <div className="space-y-4">
                  <div className="w-32 h-10 rounded bg-white/5 animate-pulse" />
                  <div className="w-48 h-4 rounded bg-white/5 animate-pulse" />
                  <div className="w-full h-2 rounded bg-white/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Projects Skeleton */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-4xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-12 space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-40 h-8 rounded bg-white/5 animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#0b0b0c] border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="aspect-video bg-white/5 rounded-2xl animate-pulse relative" />
                  <div className="w-3/4 h-6 rounded bg-white/5 animate-pulse" />
                  <div className="w-1/3 h-4 rounded bg-white/5 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
