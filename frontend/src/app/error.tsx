"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, RotateCcw, AlertTriangle, Terminal, HelpCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import Loader from "@/components/Loader";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Log the error to console
    console.error("Application runtime error captured:", error);
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    // Add a slight delay for realistic recompiling feedback
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-(--color-bg-base) text-(--color-foreground) font-sans selection:bg-accent/30 overflow-hidden flex flex-col justify-between">
      {/* Typewriter Page Loader */}
      <Loader isPageLoader />

      {/* Layer 1: Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0c0606_0%,#050506_50%,#020203_100%)] z-0 pointer-events-none" />

      {/* Layer 2: Animated Gradient Blobs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-red-500/5 blur-[150px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />
      <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[800px] bg-accent/5 blur-[120px] rounded-full z-0 pointer-events-none animate-float-delayed mix-blend-screen" />

      {/* Layer 3: Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.012] z-0 pointer-events-none" />

      {/* Layer 4: Noise Texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.01]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10 w-full flex flex-col grow justify-between">
        <Navbar />

        {/* Content Area */}
        <main className="pt-32 pb-16 px-4 flex flex-col items-center justify-center grow">
          <div className="max-w-4xl w-full flex flex-col items-center text-center gap-8">
            
            {/* Header info */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Pipeline Execution Halted
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-6xl font-bold font-display tracking-tight text-white"
              >
                Pipeline <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 via-amber-300 to-accent-bright">Interrupted</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-(--color-fg-muted) max-w-lg mx-auto"
              >
                An unexpected exception has interrupted the rendering pipeline. The session could not compile this segment.
              </motion.p>
            </div>

            {/* Virtual Compiler Terminal / Log Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full glass-panel border border-white/5 bg-[#050508]/80 rounded-2xl overflow-hidden shadow-2xl p-4 md:p-6"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4 text-xs text-(--color-fg-muted)">
                <div className="flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium">nxtgen_compiler_daemon.log</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </div>

              {/* Terminal Logs Content */}
              <div className="w-full bg-[#020204] border border-white/5 rounded-xl p-4 font-mono text-left text-xs text-white/70 space-y-2.5 overflow-x-auto min-h-[160px] leading-relaxed">
                <div>
                  <span className="text-white/30">[03:35:09]</span>{" "}
                  <span className="text-accent">system:</span> Initializing pipeline compilation...
                </div>
                <div>
                  <span className="text-white/30">[03:35:09]</span>{" "}
                  <span className="text-accent">loader:</span> Resolving environment variables and dynamic route configuration...
                </div>
                <div className="text-green-400">
                  <span className="text-white/30">[03:35:10]</span>{" "}
                  <span className="text-green-500">status:</span> Core engines loaded successfully (Remotion, Auth, S3 adapters active).
                </div>
                <div className="text-red-400 font-semibold bg-red-950/20 px-2 py-1 rounded border border-red-900/30">
                  <span className="text-white/30">[03:35:10]</span>{" "}
                  <span className="text-red-500">FATAL ERROR [500]:</span> Interruption inside main thread boundary. {error.message || "An unresolved exception occurred during component render."}
                  {error.digest && <div className="text-[10px] text-red-400/60 mt-0.5">Digest ID: {error.digest}</div>}
                </div>
                {isRetrying && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-amber-400 animate-pulse"
                  >
                    <span className="text-white/30">[03:35:11]</span>{" "}
                    Re-establishing database connections and memory buffer. Retrying compilation...
                  </motion.div>
                )}
              </div>

              {/* Footer info inside Card */}
              <div className="mt-4 pt-2 flex items-center justify-between text-xs text-(--color-fg-muted) font-mono">
                <span>COMPILED_WITH_WARNINGS</span>
                <span>STATUS: FAILED (500)</span>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-2"
            >
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="group px-6 py-3 bg-white text-black font-semibold rounded-xl flex items-center gap-2 hover:bg-white/95 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                <RotateCcw className={`w-4 h-4 text-black ${isRetrying ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`} />
                {isRetrying ? "Recompiling..." : "Try Again"}
              </button>
              
              <Link href="/">
                <button className="group px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl flex items-center gap-2 border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
                  <Home className="w-4 h-4 text-white/70" />
                  Return Home
                </button>
              </Link>

              <Link href="/contact">
                <button className="group px-6 py-3 bg-transparent hover:bg-white/5 text-(--color-fg-muted) hover:text-white font-medium rounded-xl flex items-center gap-2 transition-all">
                  <HelpCircle className="w-4 h-4 text-(--color-fg-muted) group-hover:text-white" />
                  Contact Support
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              </Link>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
