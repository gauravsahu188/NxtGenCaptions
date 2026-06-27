"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Loader2, Lock, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Google Icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type Mode = "main" | "login" | "signup" | "verify-otp";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("main");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleOAuth = async (provider: "google") => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading("login");
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (res?.error) {
      setLoading(null);
      setError("Invalid email or password. Please try again.");
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading("signup");
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(null);
        setError(data.error || "Failed to send OTP. Please try again.");
      } else {
        setLoading(null);
        setMode("verify-otp");
      }
    } catch (err) {
      setLoading(null);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !otp) return;
    setLoading("verify-otp");
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(null);
        setError(data.error || "Invalid OTP. Please try again.");
      } else {
        // Automatically sign in after sign up
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: "/dashboard",
        });

        if (signInRes?.error) {
          setLoading(null);
          setError("Account created, but failed to log in automatically.");
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err) {
      setLoading(null);
      setError("An unexpected error occurred. Please try again.");
    }
  };

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
            <Image src="/logo.png" alt="NxtGen Logo" width={48} height={48} className="w-12 h-12 rounded-xl mb-3" />
            <span className="text-3xl font-bold tracking-tighter text-white">
              NxtGen<span className="text-accent">.</span>
            </span>
            <p className="text-zinc-400 text-sm mt-2">
              {mode === "signup" ? "Create a new account" : mode === "verify-otp" ? "Verify your email" : "Sign in to your account to continue"}
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



                {/* Divider */}
                <div className="relative flex items-center py-2">
                  <div className="grow border-t border-white/10" />
                  <span className="mx-4 text-zinc-500 text-xs">OR</span>
                  <div className="grow border-t border-white/10" />
                </div>

                {/* Email Login */}
                <button
                  id="btn-sign-in-email"
                  onClick={() => setMode("login")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-white/5 text-white border border-white/10 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-5 h-5 text-accent" />
                  Continue with Email
                </button>

                <p className="text-center text-xs text-zinc-500 pt-4">
                  Don't have an account?{" "}
                  <button onClick={() => setMode("signup")} className="text-accent hover:text-white transition-colors font-medium">Sign Up</button>
                </p>
                <p className="text-center text-xs text-zinc-500 pt-2">
                  By continuing, you agree to our{" "}
                  <span className="text-zinc-300 hover:text-white cursor-pointer transition-colors">Terms of Service</span>{" "}
                  and{" "}
                  <span className="text-zinc-300 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>.
                </p>
              </motion.div>
            )}

            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => { setMode("main"); setError(""); setPassword(""); }}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <form onSubmit={handleLogin} className="space-y-4">
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

                  <div>
                    <label className="block text-sm text-zinc-300 mb-2 font-medium">
                      Password
                    </label>
                    <input
                      id="input-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    id="btn-login"
                    type="submit"
                    disabled={!!loading}
                    className="w-full bg-accent hover:bg-accent-bright text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:scale-[0.98] mt-2"
                  >
                    {loading === "login" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                  
                  <p className="text-center text-xs text-zinc-500 pt-4">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-accent hover:text-white transition-colors font-medium">Sign Up</button>
                  </p>
                </form>
              </motion.div>
            )}

            {mode === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => { setMode("main"); setError(""); setPassword(""); }}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2 font-medium">
                      Full Name
                    </label>
                    <input
                      id="input-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-300 mb-2 font-medium">
                      Email address
                    </label>
                    <input
                      id="input-email-signup"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-300 mb-2 font-medium">
                      Password
                    </label>
                    <input
                      id="input-password-signup"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    id="btn-signup"
                    type="submit"
                    disabled={!!loading}
                    className="w-full bg-accent hover:bg-accent-bright text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:scale-[0.98] mt-2"
                  >
                    {loading === "signup" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                    ) : (
                      "Sign Up"
                    )}
                  </button>

                  <p className="text-center text-xs text-zinc-500 pt-4">
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-accent hover:text-white transition-colors font-medium">Log In</button>
                  </p>
                </form>
              </motion.div>
            )}

            {mode === "verify-otp" && (
              <motion.div
                key="verify-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => { setMode("signup"); setError(""); setOtp(""); }}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="mb-6 text-center">
                  <p className="text-zinc-300 text-sm">
                    We've sent a 6-digit code to <span className="text-white font-medium">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2 font-medium">
                      Verification Code
                    </label>
                    <input
                      id="input-otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      required
                      maxLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all text-center tracking-[0.5em] font-mono text-xl"
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    id="btn-verify-otp"
                    type="submit"
                    disabled={!!loading}
                    className="w-full bg-accent hover:bg-accent-bright text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:scale-[0.98] mt-2"
                  >
                    {loading === "verify-otp" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : (
                      "Verify & Create Account"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
