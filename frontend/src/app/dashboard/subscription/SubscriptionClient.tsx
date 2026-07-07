"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CreditCard, HeadphonesIcon, FileText, Download, CheckCircle, ArrowUpRight, Zap, Crown, Building2, Star, Receipt } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PaymentModal from "@/components/PaymentModal";

type PlanType = "FREE" | "EDITOR" | "CREATOR" | "BUSINESS" | "TRIAL_1_INR" | "TRIAL_9_INR";

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

interface Subscription {
  id: string;
  planType: PlanType;
  billingCycleStart: string;
  billingCycleEnd: string | null;
  storageLimitGb: number;
  transcriptionLimitMins: number;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  planType: string;
  razorpayOrderId: string | null;
  createdAt: string;
}

const PLAN_LIMITS: Record<PlanType, { color: string; icon: React.ReactNode; label: string }> = {
  FREE:     { color: "text-zinc-400",  icon: <Star className="w-4 h-4" />,      label: "Free" },
  EDITOR:   { color: "text-accent",    icon: <Zap className="w-4 h-4" />,       label: "Editor" },
  CREATOR:  { color: "text-purple-400",icon: <Crown className="w-4 h-4" />,     label: "Creator" },
  BUSINESS: { color: "text-amber-400", icon: <Building2 className="w-4 h-4" />, label: "Business" },
  TRIAL_1_INR: { color: "text-cyan-400", icon: <Zap className="w-4 h-4" />, label: "1 Rupee Trial" },
  TRIAL_9_INR: { color: "text-cyan-400", icon: <Zap className="w-4 h-4" />, label: "9 Rupee Trial" },
};

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SubscriptionClient({
  user,
  subscription,
  transactions
}: {
  user: User;
  subscription: Subscription | null;
  transactions: Transaction[];
}) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const planInfo = PLAN_LIMITS[user.planType];

  let daysRemaining = 0;
  if (subscription?.billingCycleEnd) {
    const end = new Date(subscription.billingCycleEnd);
    const now = new Date();
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2">Subscription & Billing</h1>
          <p className="text-zinc-400">Manage your plan, billing history, and preferences.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Plan Overview & Support */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Current Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl bg-white/5 ${planInfo.color}`}>
                      {planInfo.icon}
                    </div>
                    <h2 className="text-2xl font-bold">{planInfo.label} Plan</h2>
                  </div>
                  {user.planType !== "FREE" ? (
                    <p className="text-zinc-400 mt-2">
                      Your plan renews on <span className="text-white font-medium">{formatDate(subscription?.billingCycleEnd || null)}</span>
                    </p>
                  ) : (
                    <p className="text-zinc-400 mt-2">You are currently on the free tier.</p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(6,182,212,0.2)] whitespace-nowrap"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>

              {/* Quick Stats inside Plan Card */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-white/5 relative z-10">
                <div>
                  <p className="text-zinc-500 text-sm mb-1">Days Remaining</p>
                  <p className="text-3xl font-black text-white">{user.planType === "FREE" ? "∞" : daysRemaining}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm mb-1">Transcription Balance</p>
                  <p className="text-3xl font-black text-white">{Math.floor(user.transcriptionBalance)} <span className="text-lg text-zinc-500 font-medium">min</span></p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm mb-1">Audio Credits</p>
                  <p className="text-3xl font-black text-white">{user.audioCredits}</p>
                </div>
              </div>
            </motion.div>

            {/* Payment History Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Receipt className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xl font-bold">Payment History</h3>
              </div>

              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-sm">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <td className="py-4 text-zinc-300">{formatDate(tx.createdAt)}</td>
                          <td className="py-4 font-medium">{tx.planType}</td>
                          <td className="py-4">{tx.currency} {tx.amount.toFixed(2)}</td>
                          <td className="py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" /> {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No payment history found.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Support & Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-linear-to-b from-white/5 to-transparent border border-white/5 rounded-4xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                <HeadphonesIcon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Need Help?</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Have questions about your subscription, credits, or experiencing technical issues? Our support team is here to help.
              </p>
              <a 
                href="mailto:support@nxtgencaptions.com?subject=Support Request"
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/5"
              >
                Report an Issue
              </a>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8"
            >
              <h3 className="text-lg font-bold mb-4">Frequently Asked</h3>
              <ul className="space-y-4 text-sm">
                <li className="border-b border-white/5 pb-4">
                  <p className="text-white font-medium mb-1">What happens when I run out of credits?</p>
                  <p className="text-zinc-500">You can upgrade to a higher plan or purchase a top-up pack to continue generating captions instantly.</p>
                </li>
                <li>
                  <p className="text-white font-medium mb-1">Can I cancel anytime?</p>
                  <p className="text-zinc-500">Yes, your subscription will remain active until the end of the current billing cycle.</p>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={user.planType}
      />
    </div>
  );
}
