"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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

  const isAppPage = pathname.startsWith("/dashboard") || pathname.startsWith("/editor");

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = isAppPage
    ? [
        { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" || pathname === "/dashboard/profile" },
        { label: "Editor", href: "/editor", active: pathname === "/editor" },
        { label: "Subscription", href: "/dashboard/subscription", active: pathname === "/dashboard/subscription" },
        { label: "Developer API", href: "/dashboard/api-keys", active: pathname === "/dashboard/api-keys" },
      ]
    : [
        { label: "About", href: "/about", active: pathname === "/about" },
        { label: "Templates", href: "/#templates", active: false },
        { label: "Pricing", href: "/#pricing", active: false },
        { label: "Contact Us", href: "/contact", active: pathname === "/contact" },
        ...(user ? [{ label: "Dashboard", href: "/dashboard", active: false }] : []),
      ];

  const logoHref = "/";

  if (isAppPage) {
    const isEditor = pathname.startsWith("/editor");
    return (
      <header className="sticky top-0 z-50 w-full bg-[#050505] border-b border-white/5">
        <nav className={`w-full flex items-center justify-between mx-auto ${
          isEditor ? "px-6 md:px-8 py-2.5" : "px-6 md:px-12 py-3.5"
        }`}>
          <Link href={logoHref} className="flex items-center gap-2.5 group">
            <Image 
              src="/logo.png" 
              alt="NxtGen Logo" 
              width={28}
              height={28}
              className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform duration-200" 
            />
            <span className="font-bold tracking-tight text-white text-lg">
              NxtGen<span className="text-cyan-400">.</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  link.active ? "text-white bg-white/10" : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user && (
              <ProfileMenu
                user={{
                  name: user.name ?? null,
                  email: user.email ?? null,
                  image: user.image ?? null,
                  planType: user.planType ?? "FREE",
                }}
              />
            )}
          </div>

          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 pointer-events-none flex flex-col items-center">
      {/* Floating Centered Navigation Dock */}
      <div className="w-full pointer-events-auto flex justify-center px-4 sm:px-6 pt-3 md:pt-4">
        <nav className={`w-full max-w-6xl flex items-center justify-between transition-all duration-300 ${
          isScrolled
            ? "bg-[#07070b]/90 border border-white/10 backdrop-blur-2xl rounded-full px-6 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
            : "bg-[#07070b]/60 border border-white/[0.08] backdrop-blur-xl rounded-full px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        }`}>
          {/* Logo */}
          <Link href={logoHref} className="flex items-center gap-2.5 group">
            <Image 
              src="/logo.png" 
              alt="NxtGen Logo" 
              width={30}
              height={30}
              className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform duration-200" 
            />
            <span className="font-bold tracking-tight text-white text-lg">
              NxtGen<span className="text-cyan-400">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.active;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors rounded-full ${
                    isActive ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white/10 border border-white/10 rounded-full z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
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
                  className="px-5 py-2 bg-white text-black font-semibold rounded-full flex items-center gap-1.5 transition-all text-sm hover:bg-neutral-100 shadow-[0_2px_15px_rgba(255,255,255,0.15)] active:scale-[0.98] cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
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
            className="fixed inset-0 z-40 bg-[#050508]/98 backdrop-blur-2xl flex flex-col pt-28 px-6 md:hidden pointer-events-auto"
          >
            <div className="flex flex-col gap-4 text-base font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`hover:text-white transition-colors border-b border-white/5 pb-3 ${
                    link.active ? "text-white font-semibold" : "text-zinc-400"
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
                    <span className="text-xs text-zinc-400">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-2 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="px-4 py-2 bg-white/5 text-white hover:bg-white/10 border border-white/5 rounded-lg text-sm font-medium transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full py-3 bg-white text-black rounded-full font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.2)]">
                    Sign In <ArrowUpRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
