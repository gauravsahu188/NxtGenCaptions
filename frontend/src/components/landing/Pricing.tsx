"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';

const trialPlansINR = [
  {
    name: "1 Rupee Trial",
    price: "1.00",
    originalPrice: "99.00",
    badge: "Limited Time Offer",
    features: [
      "For First Time Users",
      "Valid for 1 Day",
      "1 Minute of Transcription",
      "1080P Video Render",
      "No Watermark",
      "One-time use only"
    ],
    highlight: true,
    internalPlan: "TRIAL_1_INR"
  },
  {
    name: "9 Rupee Trial",
    price: "9.00",
    originalPrice: "99.00",
    badge: "Limited Time Offer",
    features: [
      "Valid for 7 Days",
      "9 Minutes of Transcription",
      "1080P Video Render",
      "No Watermark",
      "One-time use only"
    ],
    highlight: false,
    internalPlan: "TRIAL_9_INR"
  }
];

const pricingPlansINR = [
  {
    name: "Free",
    price: "0.00",
    originalPrice: null,
    features: [
      "All Languages",
      "2 Minutes of Transcription",
      "5 GB Cloud Storage",
      "Max Video Length 2 min",
      "With Watermark",
      "3 Audio Enhancement Credits"
    ],
    highlight: false,
    internalPlan: "FREE"
  },
  {
    name: "Editor",
    price: "199.00",
    originalPrice: "299.00",
    features: [
      "90 Minutes of Transcription",
      "20 GB Cloud Storage",
      "1080P Video Render",
      "Max Video Length 5 min",
      "No Watermark",
      "50 Audio Enhancement Credits",
      "Custom Font Upload",
      "NxtGen Premium Templates Access"
    ],
    highlight: false,
    internalPlan: "EDITOR"
  },
  {
    name: "Creator",
    price: "349.00",
    originalPrice: "499.00",
    badge: "Most Popular",
    features: [
      "200 Minutes of Transcription",
      "60 GB Cloud Storage",
      "4K Video Render",
      "Max Video Length 10 min",
      "150 Audio Enhancement Credits",
      "Alpha Channel Render",
      "SRT Render",
      "Custom Font Upload",
      "NxtGen Premium Templates Access"
    ],
    highlight: true,
    internalPlan: "CREATOR"
  },
  {
    name: "Business",
    price: "749.00",
    originalPrice: "999.00",
    features: [
      "500 Minutes of Transcription",
      "150 GB Cloud Storage",
      "4K Video Render",
      "Max Video Length 30 min",
      "500 Audio Enhancement Credits",
      "Alpha Channel Render",
      "SRT Render",
      "Priority Support",
      "NxtGen Premium Templates Access"
    ],
    highlight: false,
    internalPlan: "BUSINESS"
  }
];

const trialPlansUSD = [
  {
    name: "1st Render Trial",
    price: "0.29",
    originalPrice: "0.99",
    badge: "Limited Time Offer",
    features: [
      "For First Time Users",
      "Valid for 1 Day",
      "1 Minute of Transcription",
      "1080P Video Render",
      "No Watermark",
      "One-time use only"
    ],
    highlight: true,
    internalPlan: "TRIAL_1_INR"
  },
  {
    name: "7 Day Trial",
    price: "0.99",
    originalPrice: "2.99",
    badge: "Limited Time Offer",
    features: [
      "Valid for 7 Days",
      "9 Minutes of Transcription",
      "1080P Video Render",
      "No Watermark",
      "One-time use only"
    ],
    highlight: false,
    internalPlan: "TRIAL_9_INR"
  }
];

const pricingPlansUSD = [
  {
    name: "Free",
    price: "0.00",
    originalPrice: null,
    features: [
      "All Languages",
      "2 Minutes of Transcription",
      "5 GB Cloud Storage",
      "Max Video Length 2 min",
      "With Watermark",
      "3 Audio Enhancement Credits"
    ],
    highlight: false,
    internalPlan: "FREE"
  },
  {
    name: "Editor",
    price: "9.00",
    originalPrice: null,
    features: [
      "90 Minutes of Transcription",
      "20 GB Cloud Storage",
      "1080P Video Render",
      "Max Video Length 5 min",
      "No Watermark",
      "50 Audio Enhancement Credits",
      "Custom Font Upload",
      "NxtGen Premium Templates Access"
    ],
    highlight: false,
    internalPlan: "EDITOR"
  },
  {
    name: "Creator",
    price: "15.00",
    originalPrice: "25.00",
    badge: "Most Popular",
    features: [
      "200 Minutes of Transcription",
      "60 GB Cloud Storage",
      "4K Video Render",
      "Max Video Length 10 min",
      "150 Audio Enhancement Credits",
      "Alpha Channel Render",
      "SRT Render",
      "Custom Font Upload",
      "NxtGen Premium Templates Access"
    ],
    highlight: true,
    internalPlan: "CREATOR"
  },
  {
    name: "Business",
    price: "75.00",
    originalPrice: "99.00",
    features: [
      "500 Minutes of Transcription",
      "150 GB Cloud Storage",
      "4K Video Render",
      "Max Video Length 30 min",
      "500 Audio Enhancement Credits",
      "Alpha Channel Render",
      "SRT Render",
      "Priority Support",
      "NxtGen Premium Templates Access"
    ],
    highlight: false,
    internalPlan: "BUSINESS"
  }
];

export default function Pricing() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  // Mobile Snap Carousel State & Scroll Handlers
  const [activeMobileIndex, setActiveMobileIndex] = useState(2); // Creator as default (index 2)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.offsetWidth;
    const index = Math.round(scrollLeft / (width * 0.82)); // Align with 84vw width card
    const finalIndex = Math.max(0, Math.min(activePlans.length - 1, index));
    setActiveMobileIndex(finalIndex);
  };

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.scrollWidth / activePlans.length;
      container.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      });
      setActiveMobileIndex(index);
    }
  };

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
  const activeTrialPlans = currency === 'USD' ? trialPlansUSD : trialPlansINR;
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const handlePlanClick = (e: React.MouseEvent, planName: string, internalPlan?: string) => {
    if (planName === "Free") {
      return; // Let the link navigate normally
    }

    e.preventDefault();

    if (!session?.user) {
      router.push("/sign-in");
    } else {
      // Pass standard URL param to open payment modal pre-selected if we implemented it, 
      // but opening it is good enough
      setIsPaymentModalOpen(true);
    }
  };

  const renderCard = (plan: any, i: number, isCurrentMobile: boolean, isMobileView: boolean) => {
    const isHighlighted = isMobileView ? (isCurrentMobile || plan.highlight) : plan.highlight;
    return (
      <motion.div
        initial={isMobileView ? undefined : { opacity: 0, y: 30, rotateX: 10 }}
        whileInView={isMobileView ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        whileHover={isMobileView ? undefined : { 
          scale: 1.02, 
          rotateX: 2, 
          rotateY: -2,
          z: 20
        }}
        animate={isMobileView ? {
          scale: isCurrentMobile ? 1.02 : 0.96,
          opacity: isCurrentMobile ? 1 : 0.75,
        } : undefined}
        viewport={isMobileView ? undefined : { once: true, margin: "-50px" }}
        transition={isMobileView ? { duration: 0.3 } : { 
          duration: 0.6, 
          delay: i * 0.1, 
          ease: [0.16, 1, 0.3, 1] 
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`relative rounded-3xl p-8 flex flex-col cursor-pointer transition-colors duration-500 h-full ${
          isHighlighted
            ? 'bg-[#0b0b12] border border-accent/40 shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(94,106,210,0.15)] z-20'
            : 'bg-black/40 border border-white/5 hover:bg-white/2 hover:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-10'
        } ${isMobileView ? 'min-h-[520px]' : ''}`}
      >
        {plan.highlight && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.1),transparent_70%)] rounded-3xl pointer-events-none" />
        )}

        <div className="flex justify-between items-start mb-6 relative z-10" style={{ transform: 'translateZ(10px)' }}>
          <h3 className="text-xl font-display font-bold text-white tracking-tight">{plan.name}</h3>
          {plan.badge && (
            <span className="bg-accent/20 border border-accent/40 text-(--color-accent-bright) text-[10px] font-mono tracking-widest px-3 py-1 rounded-full uppercase shadow-[0_0_10px_rgba(94,106,210,0.2)]">
              {plan.badge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2 flex-wrap relative z-10" style={{ transform: 'translateZ(20px)' }}>
          <span className="text-5xl font-sans font-bold tracking-[-0.03em] text-white">{currencySymbol}{plan.price}</span>
          {plan.originalPrice && (
            <span className="text-white/40 font-medium font-sans line-through text-sm decoration-white/20">{currencySymbol}{plan.originalPrice}</span>
          )}
        </div>
        <div className="w-full mb-8 relative z-10" style={{ transform: 'translateZ(10px)' }}>
          <span className="text-(--color-fg-muted) font-medium text-sm">/ month</span>
        </div>

        <Link href="/editor" onClick={(e) => handlePlanClick(e, plan.name, plan.internalPlan)} className="w-full relative z-20" style={{ transform: 'translateZ(30px)' }}>
          <button className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98] ${isHighlighted
              ? 'bg-(--color-accent) hover:bg-(--color-accent-bright) text-white shadow-[0_0_20px_rgba(94,106,210,0.3)]'
              : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            }`}>
            {plan.name === "Free" ? "Get Started" : "Upgrade Plan"}
          </button>
        </Link>

        <div className="mt-8 space-y-4 flex-1 relative z-10" style={{ transform: 'translateZ(10px)' }}>
          {plan.features.map((feature: string, idx: number) => {
            const isHeading = feature.includes('EVERYTHING IN');
            return (
              <div key={idx} className={`flex items-start gap-3 ${isHeading ? 'mb-6 mt-6' : ''}`}>
                {!isHeading && (
                  <div className={`mt-0.5 rounded-full p-1 ${isHighlighted ? 'text-(--color-accent-bright) bg-accent/10' : 'text-white/50 bg-white/5'}`}>
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <span className={`text-sm font-medium text-left ${isHeading ? 'font-mono text-(--color-accent-bright) text-xs uppercase tracking-widest' : 'text-(--color-fg-muted)'}`}>
                  {feature}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <section id="pricing" className="w-full max-w-[1400px] mx-auto py-32 px-6 relative z-10 border-t border-white/3">

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

      {/* Eye-catching Trial Plans Section */}
      <div className="mb-16 md:mb-24 relative max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-linear-to-r from-accent/20 via-purple-500/20 to-accent/20 blur-3xl opacity-30 rounded-[3rem] -z-10" />
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/60 mb-2">
            First Time Offers 🎁
          </h3>
          <p className="text-zinc-400 text-sm md:text-base">One-time exclusive trials to experience our full power.</p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 px-4">
          {activeTrialPlans.map((plan, i) => (
            <div key={`trial-${i}`} className="w-full max-w-[320px]">
              {renderCard(plan, i, false, true)}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Standard Plans</h2>
        <p className="text-zinc-400 text-sm md:text-base">Choose the perfect plan for your needs</p>
      </div>

      {/* Desktop Grid for Normal Plans */}
      <div className="hidden md:flex flex-wrap justify-center gap-6 items-start perspective-1000 mb-16">
        {activePlans.map((plan, i) => (
          <div key={i} className="h-full w-full max-w-[320px]">
            {renderCard(plan, i, false, false)}
          </div>
        ))}
      </div>

      {/* Mobile Snap Carousel for Normal Plans */}
      <div className="md:hidden relative w-full mb-8">
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-[8vw] pb-8 pt-4 perspective-1000"
        >
          {activePlans.map((plan, i) => (
            <div 
              key={i} 
              className="min-w-[84vw] snap-center shrink-0 flex justify-center"
            >
              {renderCard(plan, i, true, false)}
            </div>
          ))}
        </div>

        {/* Carousel Dot Indicators */}
        <div className="flex gap-2.5 mt-2 justify-center">
          {activePlans.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === activeMobileIndex 
                  ? 'bg-(--color-accent) w-6 shadow-[0_0_8px_rgba(94,106,210,0.5)]' 
                  : 'bg-white/20'
              }`}
              aria-label={`Go to plan ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={session?.user?.planType ?? 'FREE'}
      />
    </section>
  );
}
