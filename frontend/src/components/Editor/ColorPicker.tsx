"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const PALETTES = [
  {
    name: "Neon / GenZ",
    colors: ["#FFE600", "#00FFCC", "#FF0055", "#9900FF", "#00FF00", "#FF9900"]
  },
  {
    name: "Metallic / Gold",
    colors: ["#D4AF37", "#F3E5AB", "#AA7C11", "#C5A059", "#A0D83E", "#AADC56"]
  },
  {
    name: "Soft Pastel",
    colors: ["#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA", "#FFC6FF"]
  },
  {
    name: "Clean / Editorial",
    colors: ["#FFFFFF", "#0EA5E9", "#6366F1", "#10B981", "#F59E0B", "#EF4444"]
  },
  {
    name: "Dark / Horror",
    colors: ["#FF2E2E", "#9B0000", "#7F1D1D", "#1F2937", "#111827", "#030712"]
  }
];

export default function ColorPicker({
  label,
  value,
  onChange,
  className = ""
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLockedOpen, setIsLockedOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateCoords();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isLockedOpen) return;
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // slight delay to make moving mouse to popup easier
  };

  // Close when clicking outside and handle scroll to update/close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click was outside both the trigger container and the portal popup
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsLockedOpen(false);
      }
    }
    
    function handleScroll() {
      if (isOpen) {
        updateCoords();
      }
    }

    function handleResize() {
      if (isOpen) {
        updateCoords();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Convert short hex, missing hash, or uppercase codes to safe 7-character lowercase hex format required by <input type="color">
  const getSafeHexForInputColor = (val: string): string => {
    if (!val || typeof val !== "string") return "#ffffff";
    let hex = val.trim().toLowerCase();
    if (!hex.startsWith("#")) {
      hex = "#" + hex;
    }
    if (hex.length === 4) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    if (hex.length !== 7) {
      return "#ffffff";
    }
    return hex;
  };

  const safeValue = value && typeof value === "string" && value.startsWith('#') ? value : '#FFFFFF';
  const nativeInputColor = getSafeHexForInputColor(value);

  // Approximate popup dimensions
  const popupWidth = 256; // w-64
  const popupHeight = 330; // calculated height of popup

  // Calculate layout positioning dynamically to prevent clipping at viewport top/bottom
  let left = coords.left + coords.width - popupWidth;
  let top = coords.top - 8 - popupHeight; // Default: show above

  if (typeof window !== "undefined") {
    // Keep horizontally within screen bounds
    left = Math.max(8, Math.min(window.innerWidth - popupWidth - 8, coords.left + coords.width - popupWidth));
    
    // If showing above pushes it off the top of the screen (top < 8)
    if (coords.top - 8 - popupHeight < 8) {
      const belowTop = coords.top + coords.height + 8;
      // If showing below fits within viewport, show below
      if (belowTop + popupHeight < window.innerHeight - 8) {
        top = belowTop;
      } else {
        // Otherwise, clamp top position to screen viewport
        top = Math.max(8, window.innerHeight - popupHeight - 8);
      }
    }
  }

  const popupContent = (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: top,
        left: left,
        zIndex: 9999999 // Ensure it is on top of all other components
      }}
      className="w-64 p-3 bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-2.5 before:absolute before:-inset-x-4 before:-inset-y-4 before:-z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={portalRef}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Color Palettes</span>
        <span className="text-[9px] font-semibold text-zinc-600">Select standard color</span>
      </div>

      <div className="w-full h-px bg-white/10" />

      {/* Grouped Professional Palettes Scrollable Container */}
      <div className="flex flex-col gap-3.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
        {PALETTES.map((palette) => (
          <div key={palette.name} className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider px-1">{palette.name}</span>
            <div className="grid grid-cols-6 gap-2 px-1 justify-items-center">
              {palette.colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                    setIsLockedOpen(false);
                  }}
                  className="w-6 h-6 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-white/10 hover:scale-115 transition-all cursor-pointer relative group/item"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 bg-zinc-900 border border-white/10 text-[8px] text-white rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity font-mono z-[10000000] shadow-md">
                    {color}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full h-px bg-white/10" />

      {/* Custom Color Selector */}
      <div className="flex items-center justify-between px-1 py-0.5">
         <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Custom Color</span>
         <div className="flex items-center gap-2">
           <span className="text-[10px] text-zinc-500 font-mono font-bold">{safeValue.toUpperCase()}</span>
           <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 shadow-inner cursor-pointer hover:scale-105 transition-transform bg-zinc-800">
             <input 
                type="color" 
                value={nativeInputColor}
                onChange={(e) => onChange(e.target.value)}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
             />
           </div>
         </div>
      </div>
    </motion.div>
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative flex items-center justify-between group ${className}`}>
      {label && <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">{label}</span>}
      
      <div 
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          updateCoords();
          // If already open from hover but not locked, lock it. Otherwise toggle normal click behavior.
          if (isOpen && !isLockedOpen) {
            setIsLockedOpen(true);
          } else {
            setIsOpen(!isOpen);
            setIsLockedOpen(!isLockedOpen);
          }
        }}
        className={`flex items-center gap-3 bg-white/5 border rounded-xl p-1.5 pl-3 pr-2 relative z-10 cursor-pointer transition-colors ${
          isOpen ? 'border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div
          className="w-5 h-5 rounded-lg shadow-lg border border-white/10"
          style={{ backgroundColor: safeValue }}
        ></div>
        <input
          type="text"
          value={value ? value.toUpperCase() : ""}
          onChange={e => {
            let val = e.target.value.trim();
            if (val && !val.startsWith('#')) {
              val = '#' + val;
            }
            onChange(val);
          }}
          onClick={(e) => {
            e.stopPropagation();
            updateCoords();
            setIsOpen(true);
            setIsLockedOpen(true);
          }}
          className="bg-transparent text-[11px] font-black text-white w-20 focus:outline-none"
        />
      </div>

      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && popupContent}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
