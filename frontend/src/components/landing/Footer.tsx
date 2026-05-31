"use client";

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: {
      title: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Templates", href: "/#templates" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { label: "About", href: "/#about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/#contact" },
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
    <footer className="w-full border-t border-(--color-border-default) bg-(--color-bg-deep)">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="NxtGen Logo" className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-semibold text-white">NxtGen Captions</span>
            </Link>
            <p className="text-(--color-fg-muted) mb-6 max-w-sm leading-relaxed">
              Production-grade, AI-driven storytelling platform for the next generation of content creators.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/nxtgencaptions"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-(--color-surface) flex items-center justify-center text-(--color-fg-muted) hover:text-white hover:bg-(--color-surface-hover) transition-colors duration-200"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="https://youtube.com/@nxtgencaptions"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-(--color-surface) flex items-center justify-center text-(--color-fg-muted) hover:text-white hover:bg-(--color-surface-hover) transition-colors duration-200"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a
                href="https://instagram.com/nxtgencaptions"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-(--color-surface) flex items-center justify-center text-(--color-fg-muted) hover:text-white hover:bg-(--color-surface-hover) transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="https://github.com/nxtgencaptions"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-(--color-surface) flex items-center justify-center text-(--color-fg-muted) hover:text-white hover:bg-(--color-surface-hover) transition-colors duration-200"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-(--color-fg-muted) hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-(--color-border-default)">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h4 className="text-white font-semibold mb-2">Stay Updated</h4>
              <p className="text-(--color-fg-muted) text-sm">
                Get notified about new features and updates.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:flex-initial md:w-72 px-4 py-2.5 rounded-xl bg-(--color-surface) border border-(--color-border-default) text-white placeholder-(--color-fg-muted) focus:outline-none focus:border-(--color-accent) transition-colors text-sm"
              />
              <button className="px-4 py-2.5 rounded-xl bg-(--color-accent) text-white font-medium hover:bg-(--color-accent-bright) transition-colors text-sm flex items-center gap-2 whitespace-nowrap">
                Subscribe
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-(--color-border-default) flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-(--color-fg-muted) text-sm">
            &copy; {currentYear} NxtGen Captions. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-(--color-fg-muted) text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>for creators worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}