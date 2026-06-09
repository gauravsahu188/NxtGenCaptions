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