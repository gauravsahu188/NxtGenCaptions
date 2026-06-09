"use client";

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';

const pricingPlansINR = [
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

const pricingPlansUSD = [
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
    price: "9.00",
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
    price: "15.00",
    originalPrice: "25.00",
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
    price: "75.00",
    originalPrice: "99.00",
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
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency_preference') as 'INR' | 'USD';
    if (savedCurrency === 'INR' || savedCurrency === 'USD') {
      setCurrency(savedCurrency);
      return;
    }

    let detectedCurrency: 'INR' | 'USD' = 'INR';

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        const isIndiaTz = tz.includes('Kolkata') || tz.includes('Calcutta') || tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta';
        if (!isIndiaTz) {
          detectedCurrency = 'USD';
        }
      }
    } catch (e) {
      try {
        const locale = navigator.language || (navigator.languages && navigator.languages[0]) || '';
        if (locale && !locale.toLowerCase().endsWith('-in') && locale.toLowerCase() !== 'hi') {
          detectedCurrency = 'USD';
        }
      } catch (err) {}
    }

    setCurrency(detectedCurrency);

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code) {
          const isIndiaIp = data.country_code === 'IN';
          const newCurrency = isIndiaIp ? 'INR' : 'USD';
          setCurrency(newCurrency);
          localStorage.setItem('currency_preference', newCurrency);
        }
      })
      .catch(() => {});
  }, []);

  const handleCurrencyChange = (newCurrency: 'INR' | 'USD') => {
    setCurrency(newCurrency);
    localStorage.setItem('currency_preference', newCurrency);
  };

  const activePlans = currency === 'USD' ? pricingPlansUSD : pricingPlansINR;
  const currencySymbol = currency === 'USD' ? '$' : '₹';

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
    <section id="pricing" className="w-full max-w-[1400px] mx-auto py-32 px-6 relative z-10 border-t border-white/[0.03]">

      {/* Header */}
      <div className="flex flex-col items-center mb-20 space-y-4 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">
          Flexible plans for every <span className="text-gradient-accent">creator</span>
        </h2>
        <p className="text-(--color-fg-muted) text-lg max-w-xl font-medium">
          Scale your content creation with plans designed for solo creators and post-production houses.
        </p>
      </div>

      {/* Currency Switcher */}
      <div className="flex justify-center mb-12">
        <div className="relative flex p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => handleCurrencyChange('INR')}
            className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              currency === 'INR'
                ? 'bg-(--color-accent) text-white shadow-[0_0_15px_rgba(94,106,210,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => handleCurrencyChange('USD')}
            className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              currency === 'USD'
                ? 'bg-(--color-accent) text-white shadow-[0_0_15px_rgba(94,106,210,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start perspective-1000">
        {activePlans.map((plan, i) => (
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            whileHover={{ 
              scale: 1.02, 
              rotateX: 2, 
              rotateY: -2,
              z: 20
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              duration: 0.6, 
              delay: i * 0.1, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            key={i}
            style={{ transformStyle: 'preserve-3d' }}
            className={`relative rounded-3xl p-8 flex flex-col cursor-pointer transition-colors duration-500 ${plan.highlight
                ? 'bg-[#0a0a0c] border border-accent/40 shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(94,106,210,0.15)] md:scale-105 z-20'
                : 'bg-black/40 border border-white/5 hover:bg-white/[0.02] hover:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-10'
              }`}
          >
            {plan.highlight && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.1),transparent_70%)] rounded-3xl pointer-events-none" />
            )}

            <div className="flex justify-between items-start mb-6 relative z-10" style={{ transform: 'translateZ(10px)' }}>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">{plan.name}</h3>
              {plan.badge && (
                <span className="bg-(--color-accent)/20 border border-accent/40 text-(--color-accent-bright) text-[10px] font-mono tracking-widest px-3 py-1 rounded-full uppercase shadow-[0_0_10px_rgba(94,106,210,0.2)]">
                  {plan.badge}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-2 flex-wrap relative z-10" style={{ transform: 'translateZ(20px)' }}>
              <span className="text-5xl font-display font-bold tracking-[-0.03em] text-white">{currencySymbol}{plan.price}</span>
              {plan.originalPrice && (
                <span className="text-white/40 font-medium line-through text-sm decoration-white/20">{currencySymbol}{plan.originalPrice}</span>
              )}
            </div>
            <div className="w-full mb-8 relative z-10" style={{ transform: 'translateZ(10px)' }}>
              <span className="text-(--color-fg-muted) font-medium text-sm">/ month</span>
            </div>

            <Link href="/editor" onClick={(e) => handlePlanClick(e, plan.name)} className="w-full relative z-20" style={{ transform: 'translateZ(30px)' }}>
              <button className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98] ${plan.highlight
                  ? 'bg-(--color-accent) hover:bg-(--color-accent-bright) text-white shadow-[0_0_20px_rgba(94,106,210,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}>
                {plan.name === "Free" ? "Get Started" : "Upgrade Plan"}
              </button>
            </Link>

            <div className="mt-8 space-y-4 flex-1 relative z-10" style={{ transform: 'translateZ(10px)' }}>
              {plan.features.map((feature, idx) => {
                const isHeading = feature.includes('EVERYTHING IN');
                return (
                  <div key={idx} className={`flex items-start gap-3 ${isHeading ? 'mb-6 mt-6' : ''}`}>
                    {!isHeading && (
                      <div className={`mt-0.5 rounded-full p-1 ${plan.highlight ? 'text-(--color-accent-bright) bg-accent/10' : 'text-white/50 bg-white/5'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <span className={`text-sm font-medium ${isHeading ? 'font-mono text-(--color-accent-bright) text-xs uppercase tracking-widest' : 'text-(--color-fg-muted)'}`}>
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
