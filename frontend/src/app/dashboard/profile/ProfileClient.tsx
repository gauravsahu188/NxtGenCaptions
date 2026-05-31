"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, Mic2, HardDrive, Crown, Zap, Star, Building2, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ProfileMenu from "@/components/ProfileMenu";

type PlanType = "FREE" | "EDITOR" | "CREATOR" | "BUSINESS";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  planType: PlanType;
  transcriptionBalance: number;
  audioCredits: number;
  storageUsed: number;
  createdAt: string;
}

const PLAN_META: Record<PlanType, { label: string; color: string; bg: string; icon: React.ReactNode; transcription: number; storage: number; description: string }> = {
  FREE:     { label: "Free",     color: "text-zinc-300",   bg: "bg-zinc-500/10 border-zinc-500/20",   icon: <Star className="w-5 h-5 text-zinc-400" />,      transcription: 10,  storage: 5,   description: "Basic access" },
  EDITOR:   { label: "Editor",   color: "text-accent",     bg: "bg-accent/10 border-accent/20",       icon: <Zap className="w-5 h-5 text-accent" />,         transcription: 120, storage: 20,  description: "For individual creators" },
  CREATOR:  { label: "Creator",  color: "text-purple-300", bg: "bg-purple-500/10 border-purple-500/20",icon: <Crown className="w-5 h-5 text-purple-400" />,   transcription: 300, storage: 60,  description: "Unlimited audio, SRT, 4K" },
  BUSINESS: { label: "Business", color: "text-amber-300",  bg: "bg-amber-500/10 border-amber-500/20", icon: <Building2 className="w-5 h-5 text-amber-400" />, transcription: 720, storage: 150, description: "Teams & translation" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/6 last:border-0">
      <div className="flex items-center gap-2.5 text-zinc-400 text-sm">
        {icon}
        {label}
      </div>
      <span suppressHydrationWarning className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ProfileClient({ user }: { user: User }) {
  const plan = PLAN_META[user.planType];
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? "?").toUpperCase();

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-(--color-bg-base) text-(--color-foreground) relative overflow-hidden font-sans">
      {/* Layer 1: Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)] z-0 pointer-events-none" />

      {/* Layer 2: Animated Gradient Blobs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[1400px] bg-accent/20 blur-[150px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[800px] bg-purple-500/15 blur-[120px] rounded-full z-0 pointer-events-none animate-float-delayed mix-blend-screen" />

      {/* Layer 3: Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.015] z-0 pointer-events-none mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_40%,transparent_100%)]" />

      {/* Layer 4: Noise Texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/6 bg-black/20 backdrop-blur-xl">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-white">
            NxtGen<span className="text-accent">.</span>
          </Link>
          <ProfileMenu user={{ name: user.name, email: user.email, image: user.image, planType: user.planType }} />
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
          {/* Back */}
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/3 border border-white/7 rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-linear-to-br from-[var(--color-accent)] to-[var(--color-accent-bright)] flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user.image ? (
                <Image src={user.image} alt="avatar" width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                initials
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{user.name ?? "Unnamed User"}</h1>
              <p className="text-zinc-400 text-sm mt-0.5 truncate">{user.email}</p>

              {/* Plan Badge */}
              <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full border text-sm font-semibold ${plan.bg} ${plan.color}`}>
                {plan.icon}
                {plan.label} Plan — {plan.description}
              </div>
            </div>

            <Link href="/#pricing">
              <button id="btn-profile-upgrade" className="shrink-0 px-5 py-2.5 text-sm font-bold rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-bright)] text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all active:scale-[0.98]">
                Upgrade
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Usage Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/3 border border-white/7 rounded-2xl p-6"
        >
          <h2 className="text-base font-semibold mb-4 text-zinc-200">Account Usage</h2>
          <StatRow icon={<Clock className="w-4 h-4" />}        label="Transcription Balance"  value={`${user.transcriptionBalance} min / ${plan.transcription} min`} />
          <StatRow icon={<Mic2 className="w-4 h-4" />}         label="Audio Credits"           value={`${user.audioCredits} credits`} />
          <StatRow icon={<HardDrive className="w-4 h-4" />}    label="Storage Used"            value={`${formatBytes(user.storageUsed)} / ${plan.storage} GB`} />
          <StatRow icon={<Mail className="w-4 h-4" />}         label="Email"                   value={user.email ?? "—"} />
          <StatRow icon={<Calendar className="w-4 h-4" />}     label="Member Since"            value={memberSince} />
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6"
        >
          <h2 className="text-base font-semibold text-red-400 mb-1">Danger Zone</h2>
          <p className="text-zinc-400 text-sm mb-4">Deleting your account is permanent and cannot be undone.</p>
          <button
            id="btn-delete-account"
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all"
          >
            Delete Account
          </button>
        </motion.div>
      </div>
    </div>
  </div>
  );
}
