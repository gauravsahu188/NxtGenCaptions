"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

// Google Icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Apple Icon SVG
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

type Mode = "main" | "email" | "otp";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("main");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first OTP input when switching to OTP mode
  useEffect(() => {
    if (mode === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [mode]);

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(null);

      if (!res.ok) {
        setError(data.error || "Failed to send OTP. Please try again.");
      } else {
        setMode("otp");
      }
    } catch (err) {
      setLoading(null);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]; // Only take last character
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) return;

    setLoading("verify");
    setError("");

    const res = await signIn("otp", {
      email,
      otp: otpString,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (res?.error) {
      setLoading(null);
      setError("Invalid or expired code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } else {
      window.location.href = "/dashboard";
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every(digit => digit !== "") && otp.join("").length === 6) {
      handleVerifyOtp();
    }
  }, [otp]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Back to home */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="NxtGen Logo" className="w-12 h-12 rounded-xl mb-3" />
            <span className="text-3xl font-bold tracking-tighter text-white">
              NxtGen<span className="text-accent">.</span>
            </span>
            <p className="text-zinc-400 text-sm mt-2">
              Sign in to your account to continue
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "main" && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {/* Google */}
                <button
                  id="btn-sign-in-google"
                  onClick={() => handleOAuth("google")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>

                {/* Apple */}
                <button
                  id="btn-sign-in-apple"
                  onClick={() => handleOAuth("apple")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === "apple" ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleIcon />}
                  Continue with Apple
                </button>

                {/* Divider */}
                <div className="relative flex items-center py-2">
                  <div className="grow border-t border-white/10" />
                  <span className="mx-4 text-zinc-500 text-xs">OR</span>
                  <div className="grow border-t border-white/10" />
                </div>

                {/* Email */}
                <button
                  id="btn-sign-in-email"
                  onClick={() => setMode("email")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-white/5 text-white border border-white/10 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-5 h-5 text-accent" />
                  Continue with Email
                </button>

                <p className="text-center text-xs text-zinc-500 pt-4">
                  By continuing, you agree to our{" "}
                  <span className="text-zinc-300 hover:text-white cursor-pointer transition-colors">Terms of Service</span>{" "}
                  and{" "}
                  <span className="text-zinc-300 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>.
                </p>
              </motion.div>
            )}

            {mode === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => setMode("main")}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2 font-medium">
                      Email address
                    </label>
                    <input
                      id="input-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    id="btn-send-otp"
                    type="submit"
                    disabled={!!loading}
                    className="w-full bg-accent hover:bg-accent-bright text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:scale-[0.98]"
                  >
                    {loading === "email" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    ) : (
                      "Send Code"
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {mode === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-accent" />
                </div>
                
                <div>
                  <h3 className="text-white font-semibold text-xl">Verification Code</h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                  </p>
                </div>

                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-accent focus:bg-white/10 transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <div className="space-y-4">
                  <button
                    onClick={() => handleVerifyOtp()}
                    disabled={otp.some(d => !d) || loading === "verify"}
                    className="w-full bg-accent hover:bg-accent-bright text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:scale-[0.98]"
                  >
                    {loading === "verify" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </button>

                  <button
                    onClick={() => { setMode("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="text-zinc-500 hover:text-white text-sm transition-colors"
                  >
                    Change email address
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
