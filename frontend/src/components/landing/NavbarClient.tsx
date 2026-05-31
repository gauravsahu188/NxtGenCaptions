"use client";

import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ProfileMenu from "@/components/ProfileMenu";
import type { Session } from "next-auth";

export default function NavbarClient({ session }: { session: Session | null }) {
  const user = session?.user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 md:px-12 py-6 absolute top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="NxtGen Logo" className="w-8 h-8 rounded-md" />
          <span className="text-xl font-bold tracking-tight text-(--color-foreground)">
            NxtGen<span className="text-(--color-accent)">.</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-(--color-fg-muted) font-medium">
          <Link href="/#about" className="hover:text-(--color-foreground) transition-colors">About</Link>
          <Link href="/#features" className="hover:text-(--color-foreground) transition-colors">Features</Link>
          <Link href="/#templates" className="hover:text-(--color-foreground) transition-colors">Templates</Link>
          <Link href="/#pricing" className="hover:text-(--color-foreground) transition-colors">Pricing</Link>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <ProfileMenu
              user={{
                name: user.name ?? null,
                email: user.email ?? null,
                image: user.image ?? null,
                planType: user.planType ?? "FREE",
              }}
            />
          ) : (
            <Link href="/sign-in">
              <button id="btn-navbar-signin" className="group px-4 py-2 bg-white/5 hover:bg-white/8 text-(--color-foreground) font-medium rounded-lg flex items-center gap-2 transition-all duration-300 text-sm border border-transparent hover:border-(--color-border-hover) shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] active:scale-[0.98]">
                Sign In
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-(--color-fg-muted) hover:text-(--color-foreground) transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-bg-base/95 backdrop-blur-xl flex flex-col pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-lg font-medium text-(--color-fg-muted)">
              <Link href="/#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-(--color-foreground) transition-colors border-b border-(--color-border-default) pb-4">About</Link>
              <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-(--color-foreground) transition-colors border-b border-(--color-border-default) pb-4">Features</Link>
              <Link href="/#templates" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-(--color-foreground) transition-colors border-b border-(--color-border-default) pb-4">Templates</Link>
              <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-(--color-foreground) transition-colors border-b border-(--color-border-default) pb-4">Pricing</Link>
            </div>
            
            <div className="mt-8">
              {user ? (
                <div className="flex items-center gap-4 border-t border-(--color-border-default) pt-6">
                  {/* Simplistic mobile representation */}
                  <span className="text-sm font-medium text-(--color-foreground)">Signed in as {user.name}</span>
                  <Link href="/dashboard" className="ml-auto text-sm text-(--color-accent) font-medium">Dashboard</Link>
                </div>
              ) : (
                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full py-3 bg-(--color-accent) rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                    Sign In <ArrowUpRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
