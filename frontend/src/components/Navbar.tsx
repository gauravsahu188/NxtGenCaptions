"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileMenu from "@/components/ProfileMenu";
import type { Session } from "next-auth";

interface NavbarProps {
  initialSession?: Session | null;
}

export default function Navbar({ initialSession }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const currentSession = session ?? initialSession;
  const user = currentSession?.user;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if we are on dashboard or editor
  const isAppPage = pathname.startsWith("/dashboard") || pathname.startsWith("/editor");

  // Close mobile menu on path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Determine navbar links based on current path and login status
  const navLinks = isAppPage
    ? [
        { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" || pathname === "/dashboard/profile" },
        { label: "Editor", href: "/editor", active: pathname === "/editor" },
      ]
    : [
        { label: "About", href: "/about", active: pathname === "/about" },
        { label: "Templates", href: "/#templates", active: false },
        { label: "Pricing", href: "/#pricing", active: false },
        { label: "Contact Us", href: "/contact", active: pathname === "/contact" },
        ...(user ? [{ label: "Dashboard", href: "/dashboard", active: false }] : []),
      ];

  // Styles depending on page scroll and app status
  let outerStyles = "z-50 transition-all duration-500 ease-in-out ";
  let innerStyles = "flex items-center justify-between transition-all duration-500 ease-in-out ";

  if (isAppPage) {
    // App pages: standard sticky full-width header
    outerStyles += "sticky top-0 w-full";
    const isEditor = pathname.startsWith("/editor");
    innerStyles += isEditor 
      ? "w-full px-6 md:px-8 py-2 bg-[#050505] border-b border-white/5" 
      : "w-full px-6 md:px-12 py-3.5 bg-[#050505] border-b border-white/5";
  } else {
    // Landing/legal pages: fixed at the top, centering the floating dock when scrolled
    outerStyles += `fixed top-0 left-0 w-full pointer-events-none flex justify-center ${
      isScrolled ? "pt-4" : "pt-0"
    }`;
    
    innerStyles += "pointer-events-auto ";
    if (isScrolled) {
      innerStyles += "w-[92%] max-w-6xl bg-black/60 border border-white/8 backdrop-blur-xl rounded-2xl px-6 md:px-8 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
    } else {
      innerStyles += "w-full bg-transparent border border-transparent rounded-none px-6 md:px-12 py-6 shadow-none";
    }
  }

  const logoHref = "/";

  return (
    <>
      <div className={outerStyles}>
        <nav className={innerStyles}>
          {/* Logo */}
          <Link href={logoHref} className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="NxtGen Logo" 
              className={`rounded-md group-hover:scale-105 transition-transform duration-300 ${
                pathname.startsWith("/editor") ? "w-7 h-7" : "w-8 h-8"
              }`} 
            />
            <span className={`font-bold tracking-tight text-white ${
              pathname.startsWith("/editor") ? "text-lg" : "text-xl"
            }`}>
              NxtGen<span className="text-accent group-hover:animate-pulse">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full border border-white/0 bg-white/0">
            {navLinks.map((link) => {
              const isActive = link.active;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative transition-colors duration-200 rounded-full ${
                    pathname.startsWith("/editor") 
                      ? "px-3 py-1 text-xs font-medium" 
                      : "px-4 py-1.5 text-sm font-medium"
                  } ${
                    isActive ? "text-white" : "text-(--color-fg-muted) hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white/5 border border-white/8 rounded-full z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
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
                <button
                  id="btn-navbar-signin"
                  className="group px-4 py-2 bg-white/5 hover:bg-white/8 text-white font-medium rounded-lg flex items-center gap-2 transition-all duration-300 text-sm border border-transparent hover:border-(--color-border-hover) shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] active:scale-[0.98]"
                >
                  Sign In
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-(--color-fg-muted) hover:text-white transition-colors rounded-lg hover:bg-white/5"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-bg-base/95 backdrop-blur-xl flex flex-col pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-5 text-lg font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`hover:text-white transition-colors border-b border-white/5 pb-4 ${
                    link.active ? "text-white font-semibold" : "text-(--color-fg-muted)"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              {user ? (
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{user.name ?? "User"}</span>
                    <span className="text-xs text-(--color-fg-muted)">{user.email}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20 rounded-lg text-sm font-medium transition-all"
                  >
                    Dashboard
                  </Link>
                </div>
              ) : (
                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full py-3 bg-(--color-accent) hover:bg-(--color-accent-bright) rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
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
