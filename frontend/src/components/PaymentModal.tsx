"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Lock, Sparkles, Crown, Zap, Building2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PlanType = 'FREE' | 'EDITOR' | 'CREATOR' | 'BUSINESS';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: PlanType;
}

interface PlanDetails {
  name: string;
  price: string;
  originalPrice?: string;
  transcriptionBalance: number;
  audioCredits: number;
  maxExportRes: number;
  features: string[];
  badge?: string;
  highlight: boolean;
}

const PLANS: Record<string, PlanDetails> = {
  EDITOR: {
    name: 'Editor',
    price: '599',
    transcriptionBalance: 120,
    audioCredits: 50,
    maxExportRes: 1080,
    highlight: false,
    features: [
      '2 Hours of Transcription',
      '20 GB Cloud Storage',
      '1080P Video Render',
      'Max Video Length 5 min',
      '50 Audio Enhancement Credits',
      'Custom Font Upload',
      'NxtGen Premium Templates Access'
    ],
  },
  CREATOR: {
    name: 'Creator',
    price: '999',
    originalPrice: '1499',
    transcriptionBalance: 300,
    audioCredits: 150,
    maxExportRes: 2160,
    highlight: true,
    badge: 'Most Popular',
    features: [
      '5 Hours of Transcription',
      '60 GB Cloud Storage',
      '4K Video Render',
      'Max Video Length 10 min',
      '150 Audio Enhancement Credits',
      'Alpha Channel Render',
      'SRT Render',
      'Custom Font Upload',
      'NxtGen Premium Templates Access'
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: '4999',
    originalPrice: '6999',
    transcriptionBalance: 1800,
    audioCredits: 500,
    maxExportRes: 2160,
    highlight: false,
    features: [
      '30 Hours of Transcription',
      '150 GB Cloud Storage',
      '4K Video Render',
      'Max Video Length 30 min',
      '500 Audio Enhancement Credits',
      'Alpha Channel Render',
      'SRT Render',
      'Priority Support',
      'NxtGen Premium Templates Access'
    ],
  },
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  EDITOR: <Zap className="w-5 h-5" />,
  CREATOR: <Crown className="w-5 h-5" />,
  BUSINESS: <Building2 className="w-5 h-5" />,
};

export default function PaymentModal({ isOpen, onClose, currentPlan = 'FREE' }: PaymentModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayLoaded(true);
      document.body.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  const handleUpgrade = async (planType: string) => {
    if (planType === currentPlan || !razorpayLoaded) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create order from backend
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to initiate payment');
      }

      if (data.success && data.paymentPayload) {
        // Step 2: Open Razorpay Checkout
        const options = {
          key: data.paymentPayload.keyId,
          order_id: data.paymentPayload.razorpayOrderId,
          amount: parseFloat(PLANS[planType].price) * 100, // Convert to paise
          currency: 'INR',
          name: 'NxtGen Captions',
          description: `${PLANS[planType].name} Plan`,
          handler: async (response: any) => {
            // Payment successful - verify with backend
            try {
              const verifyResponse = await fetch('/api/payment/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.status === 'SUCCESS') {
                setShowSuccess(true);
                setTimeout(() => {
                  onClose();
                  setShowSuccess(false);
                  router.refresh();
                }, 3000);
              } else {
                setError('Payment verification failed');
              }
            } catch (err) {
              console.error('Payment verification error:', err);
              setError('Payment verification failed');
            }

            setIsProcessing(false);
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setError('Payment cancelled');
            },
          },
          theme: {
            color: '#f59e0b',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-[#050505] overflow-y-auto custom-scrollbar"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="relative min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center py-16 px-4 md:px-8"
          >
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors z-50 shadow-lg"
            >
              <X className="w-6 h-6 text-zinc-400 hover:text-white" />
            </button>

            <div className="w-full max-w-6xl flex flex-col justify-center">
              {showSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-16 text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                  <p className="text-zinc-400">Your plan has been upgraded. Refreshing...</p>
                </motion.div>
              ) : (
                <>
                  <div className="pb-4">
                    <div className="text-center mb-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-linear-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 text-sm font-medium text-white mb-4">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Upgrade Your Plan
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">Choose Your Plan</h2>
                      <p className="text-zinc-400 mt-3 text-base md:text-lg max-w-xl mx-auto">Unlock premium features and take your content to the next level</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(PLANS).map(([planType, plan]) => {
                        const isCurrentPlan = currentPlan === planType;
                        const isDisabled = isCurrentPlan || isProcessing;

                        return (
                          <motion.div
                            key={planType}
                            whileHover={!isDisabled ? { scale: 1.02 } : {}}
                            className={`relative rounded-[32px] p-8 border transition-all cursor-pointer flex flex-col justify-between min-h-[480px] ${
                              plan.highlight
                                ? 'bg-linear-to-b from-white/8 to-white/2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.15)]'
                                : isCurrentPlan
                                  ? 'bg-white/5 border-white/20'
                                  : 'bg-white/2 border-white/5 hover:border-white/20'
                            }`}
                            onClick={() => !isDisabled && setSelectedPlan(planType)}
                          >
                            {plan.highlight && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-xs font-bold text-white uppercase tracking-wider">
                                {plan.badge}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2 mb-6">
                                <div className={`p-2.5 rounded-xl ${
                                  plan.highlight ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-zinc-400'
                                }`}>
                                  {PLAN_ICONS[planType]}
                                </div>
                                <span className="text-xl font-bold text-white">{plan.name}</span>
                              </div>

                              <div className="mb-6">
                                <span className="text-4xl font-black text-white">₹{plan.price}</span>
                                {plan.originalPrice && (
                                  <span className="ml-2 text-lg text-zinc-500 line-through">₹{plan.originalPrice}</span>
                                )}
                                <span className="text-zinc-500 text-sm">/month</span>
                              </div>

                              <div className="space-y-3 mb-8">
                                {plan.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDisabled && razorpayLoaded) {
                                  handleUpgrade(planType);
                                }
                              }}
                              disabled={isDisabled || !razorpayLoaded}
                              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                                isCurrentPlan
                                  ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                                  : plan.highlight
                                    ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                    : 'bg-white/5 text-white hover:bg-white/10'
                              }`}
                            >
                              {isProcessing && selectedPlan === planType ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing...
                                </span>
                              ) : isCurrentPlan ? (
                                'Current Plan'
                              ) : !razorpayLoaded ? (
                                'Loading...'
                              ) : (
                                'Select Plan'
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-12 text-zinc-500 text-sm">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Secure Payment via Razorpay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-zinc-500" />
                        <span>All cards accepted</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}