"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: {
      title: "Product",
      links: [
        { label: "Features", href: "/#templates" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Templates", href: "/#templates" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
    legal: {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
      ],
    },
  };

  return (
    <footer className="w-full relative overflow-hidden bg-[#040407] border-t border-white/[0.08] pt-16 pb-12">
      
      {/* Sundown-Style Ambient Sunset/Ember Radiance at Base */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110vw] max-w-7xl h-[320px] bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1)_0%,rgba(239,68,68,0.05)_35%,transparent_70%)] pointer-events-none -z-10 blur-[90px]" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Top Grid: Brand, Links & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/[0.07]">
          
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-3.5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Image 
                src="/logo.png" 
                alt="NxtGen Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" 
              />
              <span className="text-lg font-bold tracking-tight text-white">
                NxtGen Captions
              </span>
            </Link>
            <p className="text-zinc-400 text-sm max-w-sm leading-relaxed text-pretty font-normal">
              Production-grade, AI-driven storytelling platform for the next generation of content creators.
            </p>
          </div>

          {/* Navigation Links Columns */}
          <div className="lg:col-span-4 grid grid-cols-3 gap-6">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title} className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-[0.08em]">
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-zinc-400 hover:text-white transition-colors duration-150 text-sm font-normal"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Clean Editorial Newsletter Column */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-sm font-semibold text-white tracking-tight">Stay Updated</h4>
            <p className="text-zinc-400 text-xs leading-relaxed text-pretty">
              Get notified about new features and updates.
            </p>
            
            <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center mt-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-4 pr-11 py-2.5 rounded-full bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors text-xs"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="absolute right-1.5 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Metadata Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <span>&copy; {currentYear} NxtGen Captions. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for creators worldwide</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
