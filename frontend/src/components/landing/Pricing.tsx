"use client";

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';

const pricingPlans = [
  {
    name: "Free",
    price: "0.00",
    originalPrice: null,
    features: [
      "All Languages",
      "5 Minutes Free Testing (Full Templates)",
      "5 GB Cloud Storage",
      "Max Video Length 2 min",
      "3 Audio Enhancement Credits"
    ],
    highlight: false
  },
  {
    name: "Editor",
    price: "599.00",
    originalPrice: null,
    features: [
      "2 Hours of Transcription",
      "20 GB Cloud Storage",
      "1080P Video Render",
      "Max Video Length 5 min",
      "50 Audio Enhancement Credits (1 Credit = 1 Video)",
      "Custom Font Upload",
      "NxtGen Premium Templates Access"
    ],
    highlight: false
  },
  {
    name: "Creator",
    price: "999.00",
    originalPrice: "1499.00",
    badge: "Most Popular",
    features: [
      "5 Hours of Transcription",
      "60 GB Cloud Storage",
      "4K Video Render",
      "Max Video Length 10 min",
      "150 Audio Enhancement Credits",
      "Alpha Channel Render",
      "SRT Render",
      "Custom Font Upload",
      "NxtGen Premium Templates Access"
    ],
    highlight: true
  },
  {
    name: "Business",
    price: "4999.00",
    originalPrice: "6999.00",
    features: [
      "30 Hours of Transcription",
      "150 GB Cloud Storage",
      "4K Video Render",
      "Max Video Length 30 min",
      "500 Audio Enhancement Credits",
      "Alpha Channel Render",
      "SRT Render",
      "Priority Support",
      "NxtGen Premium Templates Access"
    ],
    highlight: false
  }
];

export default function Pricing() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePlanClick = (e: React.MouseEvent, planName: string) => {
    if (planName === "Free") {
      return; // Let the link navigate normally
    }

    e.preventDefault();

    if (!session?.user) {
      router.push("/sign-in");
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  return (
    <section id="pricing" className="w-full max-w-[1400px] mx-auto py-32 px-6 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-20 space-y-4 text-center">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Flexible plans for every <span className="text-gradient-accent">creator</span>
        </h2>
        <p className="text-[var(--color-fg-muted)] text-lg max-w-xl">
          Scale your content creation with plans designed for solo creators and post-production houses.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {pricingPlans.map((plan, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            key={i} 
            className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 ${
              plan.highlight 
                ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] border-x border-t border-x-[var(--color-border-accent)] border-t-[var(--color-border-accent)] shadow-[0_0_0_1px_rgba(94,106,210,0.1),0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(94,106,210,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] z-10 scale-[1.02] mt-[-16px] mb-[-16px]' 
                : 'glass-panel hover:-translate-y-1'
            }`}
          >
            {plan.highlight && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.15),transparent_70%)] rounded-2xl pointer-events-none" />
            )}
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] tracking-tight">{plan.name}</h3>
              {plan.badge && (
                <span className="bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 text-[var(--color-accent-bright)] text-[10px] font-mono tracking-widest px-2.5 py-1 rounded-full uppercase">
                  {plan.badge}
                </span>
              )}
            </div>
            
            <div className="flex items-baseline gap-2 mb-2 flex-wrap relative z-10">
              <span className="text-4xl font-semibold tracking-[-0.03em] text-[var(--color-foreground)]">₹{plan.price}</span>
              {plan.originalPrice && (
                <span className="text-[var(--color-fg-muted)] line-through text-sm decoration-[var(--color-border-default)]">₹{plan.originalPrice}</span>
              )}
            </div>
            <div className="w-full mb-8 relative z-10">
              <span className="text-[var(--color-fg-muted)] text-sm">/ month</span>
            </div>
            
            <Link href="/editor" onClick={(e) => handlePlanClick(e, plan.name)} className="w-full relative z-10">
              <button className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-300 active:scale-[0.98] ${
                plan.highlight 
                  ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-bright)] text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]' 
                  : 'bg-white/[0.05] hover:bg-white/[0.08] text-[var(--color-foreground)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
              }`}>
                {plan.name === "Free" ? "Get Started" : "Upgrade Plan"}
              </button>
            </Link>
            
            <div className="mt-8 space-y-4 flex-1 relative z-10">
              {plan.features.map((feature, idx) => {
                const isHeading = feature.includes('EVERYTHING IN');
                return (
                  <div key={idx} className={`flex items-start gap-3 ${isHeading ? 'mb-6 mt-6' : ''}`}>
                    {!isHeading && (
                      <div className={`mt-0.5 rounded-full p-0.5 ${plan.highlight ? 'text-[var(--color-accent-bright)] bg-[var(--color-accent)]/10' : 'text-[var(--color-fg-subtle)] bg-white/[0.03]'}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className={`text-sm ${isHeading ? 'font-mono text-[var(--color-accent-bright)] text-xs uppercase tracking-widest' : 'text-[var(--color-fg-muted)]'}`}>
                      {feature}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={session?.user?.planType ?? 'FREE'}
      />
    </section>
  );
}
