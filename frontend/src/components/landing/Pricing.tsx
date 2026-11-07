"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaymentModal from "@/components/PaymentModal";

interface PlanItem {
  name: string;
  price: string;
  originalPrice: string | null;
  badge?: string;
  features: string[];
  highlight: boolean;
  internalPlan: string;
}

const trialPlansINR: PlanItem[] = [
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

const pricingPlansINR: PlanItem[] = [
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

const trialPlansUSD: PlanItem[] = [
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

const pricingPlansUSD: PlanItem[] = [
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
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  const [activeMobileIndex, setActiveMobileIndex] = useState(2);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activePlans = currency === "USD" ? pricingPlansUSD : pricingPlansINR;
  const activeTrialPlans = currency === "USD" ? trialPlansUSD : trialPlansINR;
  const currencySymbol = currency === "USD" ? "$" : "₹";

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.offsetWidth;
    const index = Math.round(scrollLeft / (width * 0.82));
    const finalIndex = Math.max(0, Math.min(activePlans.length - 1, index));
    setActiveMobileIndex(finalIndex);
  };

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.scrollWidth / activePlans.length;
      container.scrollTo({
        left: cardWidth * index,
        behavior: "smooth"
      });
      setActiveMobileIndex(index);
    }
  };

  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency_preference") as "INR" | "USD";
    if (savedCurrency === "INR" || savedCurrency === "USD") {
      setCurrency(savedCurrency);
      return;
    }

    let detectedCurrency: "INR" | "USD" = "INR";

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        const isIndiaTz = tz.includes("Kolkata") || tz.includes("Calcutta") || tz === "Asia/Kolkata" || tz === "Asia/Calcutta";
        if (!isIndiaTz) {
          detectedCurrency = "USD";
        }
      }
    } catch {
      try {
        const locale = navigator.language || (navigator.languages && navigator.languages[0]) || "";
        if (locale && !locale.toLowerCase().endsWith("-in") && locale.toLowerCase() !== "hi") {
          detectedCurrency = "USD";
        }
      } catch {}
    }

    setCurrency(detectedCurrency);

    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country_code) {
          const isIndiaIp = data.country_code === "IN";
          const newCurrency = isIndiaIp ? "INR" : "USD";
          setCurrency(newCurrency);
          localStorage.setItem("currency_preference", newCurrency);
        }
      })
      .catch(() => {});
  }, []);

  const handleCurrencyChange = (newCurrency: "INR" | "USD") => {
    setCurrency(newCurrency);
    localStorage.setItem("currency_preference", newCurrency);
  };

  const handlePlanClick = (e: React.MouseEvent, planName: string) => {
    if (planName === "Free") {
      return;
    }

    e.preventDefault();

    if (!session?.user) {
      router.push("/sign-in");
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const renderCard = (plan: PlanItem, i: number, isCurrentMobile: boolean, isMobileView: boolean) => {
    const isHighlighted = isMobileView ? (isCurrentMobile || plan.highlight) : plan.highlight;
    return (
      <motion.div
        initial={isMobileView ? undefined : { opacity: 0, y: 30 }}
        whileInView={isMobileView ? undefined : { opacity: 1, y: 0 }}
        whileHover={isMobileView ? undefined : { y: -4 }}
        animate={isMobileView ? {
          scale: isCurrentMobile ? 1.02 : 0.96,
          opacity: isCurrentMobile ? 1 : 0.75,
        } : undefined}
        viewport={isMobileView ? undefined : { once: true, margin: "-50px" }}
        transition={isMobileView ? { duration: 0.3 } : { 
          duration: 0.5, 
          delay: i * 0.08, 
          ease: [0.16, 1, 0.3, 1] 
        }}
        className={`relative rounded-3xl p-7 flex flex-col transition-all duration-300 h-full ${
          isHighlighted
            ? "bg-[#090912] border-2 border-cyan-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_50px_rgba(6,182,212,0.18)] z-20"
            : "bg-[#06060a]/80 border border-white/10 hover:border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.4)] z-10"
        } ${isMobileView ? "min-h-[520px]" : ""}`}
      >
        {isHighlighted && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_70%)] rounded-3xl pointer-events-none" />
        )}

        <div className="flex justify-between items-start mb-5 relative z-10">
          <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
          {plan.badge && (
            <span className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono tracking-widest px-3 py-1 rounded-full uppercase shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              {plan.badge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-1 flex-wrap relative z-10">
          <span className="text-4xl md:text-5xl font-sans font-extrabold tracking-[-0.03em] text-white tabular-nums">
            {currencySymbol}{plan.price}
          </span>
          {plan.originalPrice && (
            <span className="text-zinc-500 font-medium font-sans line-through text-sm decoration-zinc-500 tabular-nums">
              {currencySymbol}{plan.originalPrice}
            </span>
          )}
        </div>
        <div className="w-full mb-6 relative z-10">
          <span className="text-zinc-400 font-normal text-xs uppercase tracking-wider font-mono">/ month</span>
        </div>

        <Link 
          href="/editor" 
          onClick={(e) => handlePlanClick(e, plan.name)} 
          className="w-full relative z-20"
        >
          <button 
            className={`w-full py-3 rounded-full font-semibold text-sm transition-all duration-300 active:scale-[0.98] ${
              isHighlighted
                ? "bg-white text-black hover:bg-neutral-100 shadow-[0_4px_25px_rgba(255,255,255,0.22)]"
                : "bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10"
            }`}
          >
            {plan.name === "Free" ? "Get Started" : "Upgrade Plan"}
          </button>
        </Link>

        <div className="mt-7 space-y-3.5 flex-1 relative z-10 border-t border-white/[0.06] pt-6">
          {plan.features.map((feature: string, idx: number) => {
            const isHeading = feature.includes("EVERYTHING IN");
            return (
              <div key={idx} className={`flex items-start gap-2.5 ${isHeading ? "mb-4 mt-4" : ""}`}>
                {!isHeading && (
                  <div className={`mt-0.5 rounded-full p-1 ${isHighlighted ? "text-cyan-400 bg-cyan-950/60" : "text-zinc-400 bg-white/5"}`}>
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
                <span className={`text-xs md:text-sm font-medium text-left leading-snug ${isHeading ? "font-mono text-cyan-300 text-xs uppercase tracking-widest" : "text-zinc-300"}`}>
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
    <section id="pricing" className="w-full max-w-[1400px] mx-auto py-28 md:py-36 px-6 relative z-10 border-t border-white/[0.06]">

      {/* Header */}
      <div className="flex flex-col items-center mb-16 space-y-4 text-center">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white text-balance">
          Flexible plans for every creator
        </h2>
        <p className="text-zinc-400 text-base md:text-lg max-w-xl font-normal leading-relaxed text-pretty">
          Scale your content creation with plans designed for solo creators and post-production houses.
        </p>
      </div>

      {/* Currency Switcher */}
      <div className="flex justify-center mb-16">
        <div className="relative flex p-1 bg-[#09090f] border border-white/10 rounded-full backdrop-blur-md shadow-lg">
          <button
            onClick={() => handleCurrencyChange("INR")}
            className={`relative px-6 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
              currency === "INR"
                ? "bg-white text-black shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => handleCurrencyChange("USD")}
            className={`relative px-6 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
              currency === "USD"
                ? "bg-white text-black shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Eye-catching Trial Plans Section */}
      <div className="mb-20 md:mb-28 relative max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-indigo-500/10 blur-3xl opacity-50 rounded-[3rem] -z-10" />
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-[11px] font-mono tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Limited Offer</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            First Time Offers 🎁
          </h3>
          <p className="text-zinc-400 text-sm md:text-base">One-time exclusive trials to experience our full power.</p>
        </div>
        
        {/* Desktop Trial Cards */}
        <div className="hidden md:flex justify-center items-center gap-8 px-4">
          {activeTrialPlans.map((plan, i) => (
            <div key={`trial-desktop-${i}`} className="w-full max-w-[340px]">
              {renderCard(plan, i, false, false)}
            </div>
          ))}
        </div>

        {/* Mobile Trial Cards (Horizontal Scroll) */}
        <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-[6vw] pb-6 pt-4">
          {activeTrialPlans.map((plan, i) => (
            <div key={`trial-mobile-${i}`} className="min-w-[84vw] snap-center shrink-0 flex justify-center">
              {renderCard(plan, i, true, true)}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Standard Plans</h2>
        <p className="text-zinc-400 text-sm md:text-base">Choose the perfect plan for your needs</p>
      </div>

      {/* Desktop Grid for Normal Plans */}
      <div className="hidden md:flex flex-wrap justify-center gap-6 items-stretch mb-16">
        {activePlans.map((plan, i) => (
          <div key={i} className="w-full max-w-[285px] flex">
            {renderCard(plan, i, false, false)}
          </div>
        ))}
      </div>

      {/* Mobile Snap Carousel for Normal Plans */}
      <div className="md:hidden relative w-full mb-8">
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-[6vw] pb-8 pt-4"
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
        <div className="flex gap-2 mt-2 justify-center">
          {activePlans.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeMobileIndex 
                  ? "bg-cyan-400 w-6 shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                  : "bg-white/20 w-2"
              }`}
              aria-label={`Go to plan ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={session?.user?.planType ?? "FREE"}
      />
    </section>
  );
}
