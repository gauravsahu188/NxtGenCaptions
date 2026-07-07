"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User, LayoutDashboard, Crown, Zap, Star, Building2, ChevronDown, Receipt } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PlanType = "FREE" | "EDITOR" | "CREATOR" | "BUSINESS" | "TRIAL_1_INR" | "TRIAL_9_INR";

interface ProfileMenuProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
    planType: PlanType;
  };
}

const PLAN_ICON: Record<PlanType, React.ReactNode> = {
  FREE:     <Star className="w-3.5 h-3.5 text-zinc-400" />,
  EDITOR:   <Zap className="w-3.5 h-3.5 text-cyan-400" />,
  CREATOR:  <Crown className="w-3.5 h-3.5 text-purple-400" />,
  BUSINESS: <Building2 className="w-3.5 h-3.5 text-amber-400" />,
  TRIAL_1_INR: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
  TRIAL_9_INR: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
};

const PLAN_COLOR: Record<PlanType, string> = {
  FREE:     "text-zinc-400",
  EDITOR:   "text-cyan-400",
  CREATOR:  "text-purple-400",
  BUSINESS: "text-amber-400",
  TRIAL_1_INR: "text-cyan-400",
  TRIAL_9_INR: "text-cyan-400",
};

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        id="btn-profile-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 transition-all"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-black shrink-0">
          {user.image ? (
            <Image src={user.image} alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
          ) : (
            initials
          )}
        </div>

        <span className="hidden sm:block text-white text-sm font-medium max-w-[120px] truncate">
          {user.name ?? user.email}
        </span>

        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#0e0e0e] border border-white/8 rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {/* Header */}
            <div className="px-4 py-4 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-black shrink-0">
                  {user.image ? (
                    <Image src={user.image} alt="avatar" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.name ?? "User"}</p>
                  <p className="text-zinc-400 text-xs truncate">{user.email}</p>
                </div>
              </div>

              {/* Plan badge */}
              <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold ${PLAN_COLOR[user.planType]}`}>
                {PLAN_ICON[user.planType]}
                {user.planType.charAt(0) + user.planType.slice(1).toLowerCase()} Plan
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <button id="btn-go-dashboard" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                  <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                  Dashboard
                </button>
              </Link>
              <Link href="/dashboard/profile" onClick={() => setOpen(false)}>
                <button id="btn-go-profile" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                  <User className="w-4 h-4 text-zinc-400" />
                  Profile Settings
                </button>
              </Link>
              <Link href="/dashboard/subscription" onClick={() => setOpen(false)}>
                <button id="btn-go-subscription" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                  <Receipt className="w-4 h-4 text-zinc-400" />
                  Subscription & Billing
                </button>
              </Link>
              <Link href="/#pricing" onClick={() => setOpen(false)}>
                <button id="btn-go-upgrade" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                  <Crown className="w-4 h-4 text-zinc-400" />
                  Upgrade Plan
                </button>
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-white/6 py-2">
              <button
                id="btn-sign-out"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
