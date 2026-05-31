"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Clock, Mic2, HardDrive, Crown, Zap, Star, Building2, X, Plus, CheckCircle } from "lucide-react";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";
import Pricing from "@/components/landing/Pricing";
import PaymentModal from "@/components/PaymentModal";

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
}

interface Project {
  id: string;
  title: string;
  s3Url: string | null;
  duration: number | null;
  createdAt: string;
  metadata?: any;
}

const PLAN_LIMITS: Record<PlanType, { transcription: number; storage: number; color: string; icon: React.ReactNode; label: string }> = {
  FREE:     { transcription: 5,   storage: 5 * 1024 * 1024 * 1024,   color: "text-zinc-400",  icon: <Star className="w-4 h-4" />,      label: "Free" },
  EDITOR:   { transcription: 120, storage: 20 * 1024 * 1024 * 1024,  color: "text-accent",    icon: <Zap className="w-4 h-4" />,       label: "Editor" },
  CREATOR:  { transcription: 300, storage: 60 * 1024 * 1024 * 1024,  color: "text-purple-400",icon: <Crown className="w-4 h-4" />,     label: "Creator" },
  BUSINESS: { transcription: 720, storage: 150 * 1024 * 1024 * 1024, color: "text-amber-400", icon: <Building2 className="w-4 h-4" />, label: "Business" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function UsageBar({ used, max, color }: { used: number; max: number; color: string }) {
  const pct = Math.min(100, (used / max) * 100);
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`h-full rounded-full ${color} bg-current relative`}
      >
        <div className="absolute inset-0 bg-white/20 blur-[2px]" />
      </motion.div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/editor?projectId=${project.id}`}>
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="bg-white/2 border border-white/5 rounded-3xl p-6 backdrop-blur-xl group cursor-pointer transition-all hover:bg-white/4 hover:border-white/10"
      >
        <div className="aspect-video bg-white/5 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <HardDrive className="w-10 h-10 text-zinc-700 group-hover:text-accent transition-colors" />
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
            {formatDuration(project.duration)}
          </div>
        </div>
        <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-accent transition-colors">
          {project.title}
        </h3>
        <p suppressHydrationWarning className="text-zinc-500 text-sm">
          {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </motion.div>
    </Link>
  );
}

export default function DashboardClient({ user, projects = [] }: { user: User; projects?: Project[] }) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const plan = PLAN_LIMITS[user.planType];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const orderPlan = params.get('plan');

    if (paymentStatus === 'success') {
      setShowSuccessMessage(true);
      setSuccessPlan(orderPlan);
      setIsPaymentModalOpen(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const stats = [
    {
      icon: <Clock className="w-6 h-6 text-accent" />,
      label: "Transcription Left",
      value: `${user.transcriptionBalance} min`,
      sub: `of ${plan.transcription} min`,
      bar: { used: plan.transcription - user.transcriptionBalance, max: plan.transcription, color: "text-accent" },
    },
    {
      icon: <Mic2 className="w-6 h-6 text-purple-400" />,
      label: "Audio Credits",
      value: user.audioCredits,
      sub: "1 credit = 1 video",
      bar: null,
    },
    {
      icon: <HardDrive className="w-6 h-6 text-emerald-400" />,
      label: "Storage Used",
      value: formatBytes(user.storageUsed),
      sub: `of ${formatBytes(plan.storage)}`,
      bar: { used: user.storageUsed, max: plan.storage, color: "text-emerald-400" },
    },
  ];

  return (
    <div className="min-h-screen bg-(--color-bg-base) text-(--color-foreground) relative overflow-hidden font-sans">
      {/* Layer 1: Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)] z-0 pointer-events-none" />

      {/* Layer 2: Animated Gradient Blobs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[1400px] bg-accent/20 blur-[150px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[800px] bg-purple-500/15 blur-[120px] rounded-full z-0 pointer-events-none animate-float-delayed mix-blend-screen" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[700px] bg-indigo-500/12 blur-[100px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />

      {/* Layer 3: Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.015] z-0 pointer-events-none mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_40%,transparent_100%)]" />

      {/* Layer 4: Noise Texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10">
        {/* Top Nav */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/4 bg-black/20 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="NxtGen Logo" className="w-8 h-8 rounded-md" />
            <span className="text-2xl font-bold tracking-tighter text-white">
              NxtGen<span className="text-accent">.</span>
            </span>
          </Link>
          <ProfileMenu user={{ name: user.name, email: user.email, image: user.image, planType: user.planType }} />
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <p className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-semibold">Welcome back 👋</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                {user.name ?? user.email}
              </h1>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-bold shadow-lg shadow-black/50 ${plan.color}`}>
                {plan.icon}
                <span className="uppercase tracking-wider text-xs">{plan.label} Plan</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-6 py-3 bg-(--color-surface) rounded-xl font-semibold text-(--color-foreground) flex items-center gap-2 transition-all duration-300 hover:bg-(--color-surface-hover) active:scale-[0.98] border border-(--color-border-default) hover:border-(--color-border-hover) shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              >
                Upgrade Plan
              </button>
              <Link href="/editor">
                <button className="group px-8 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-bright) text-white font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                  Open Editor
                  <ArrowUpRight className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {stats.map((s, i) => (
              <motion.div 
                key={s.label}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white/2 border border-white/5 rounded-3xl p-8 backdrop-blur-xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner`}>
                    {s.icon}
                  </div>
                  <span className="text-zinc-500 text-sm font-medium">{s.label}</span>
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black text-white mb-2 tracking-tight">{s.value}</p>
                  <p className="text-zinc-400 text-sm font-medium mb-6">{s.sub}</p>
                  {s.bar ? (
                    <UsageBar used={s.bar.used} max={s.bar.max} color={s.bar.color} />
                  ) : (
                    <div className="h-2" /> // spacer for consistency
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/1 border border-white/3 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
              <Link href="/editor">
                <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </Link>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="w-full border-2 border-dashed border-white/5 rounded-3xl py-24 flex flex-col items-center justify-center text-center group hover:border-accent/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
                  <HardDrive className="w-8 h-8 text-zinc-500 group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
                <p className="text-zinc-400 max-w-sm mb-6">Create your first AI-captioned masterpiece in seconds.</p>
                <Link href="/editor">
                  <button className="text-accent font-semibold hover:text-accent-bright transition-colors">
                    Get Started &rarr;
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={user.planType}
      />
    </div>
  );
}
