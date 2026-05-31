"use client";
import React from "react";
import { Captions, Type, Music } from "lucide-react";

export default function SidebarLeft() {
  return (
    <div className="w-20 glass-panel border-r border-white/5 flex flex-col items-center py-8 space-y-8 z-30">
      <button className="flex flex-col items-center text-sky-400 group relative">
        <div className="w-10 h-10 rounded-xl bg-sky-400/10 flex items-center justify-center mb-1.5 transition-all group-hover:bg-sky-400/20 group-hover:scale-110">
          <Captions className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold tracking-tight">Captions</span>
        <div className="absolute -left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
      </button>
      
      <button className="flex flex-col items-center text-zinc-500 hover:text-white transition-all group">
        <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center mb-1.5 transition-all group-hover:bg-white/5 group-hover:scale-110">
          <Type className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold tracking-tight text-center leading-tight">Typography</span>
      </button>

      <button className="flex flex-col items-center text-zinc-500 hover:text-white transition-all group relative">
        <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center mb-1.5 transition-all group-hover:bg-white/5 group-hover:scale-110">
          <Music className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold tracking-tight">Audio</span>
        <span className="absolute -top-1 -right-2 bg-sky-500 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white shadow-lg shadow-sky-500/20 scale-75">AI</span>
      </button>
    </div>
  );
}
