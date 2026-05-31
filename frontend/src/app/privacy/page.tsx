import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Loader from "@/components/Loader";
import Link from "next/link";
import { Shield, Eye, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — NxtGen Captions",
  description: "Read how NxtGen Captions handles, stores, and protects your personal data and uploaded media assets.",
};

export default function PrivacyPolicy() {
  const lastUpdated = "May 18, 2026";

  return (
    <div className="relative min-h-screen bg-(--color-bg-base) text-(--color-foreground) font-sans selection:bg-accent/30 overflow-hidden">
      {/* Typewriter Page Loader */}
      <Loader isPageLoader />

      {/* Layer 1: Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)] z-0 pointer-events-none" />

      {/* Layer 2: Animated Gradient Blobs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[1000px] bg-accent/15 blur-[150px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />
      <div className="absolute top-[30%] left-[-10%] w-[600px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full z-0 pointer-events-none animate-float-delayed mix-blend-screen" />

      {/* Layer 3: Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.015] z-0 pointer-events-none mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_40%,transparent_100%)]" />

      {/* Layer 4: Noise Texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.01]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        <Navbar />

        <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 w-full flex-grow">
          {/* Header Section */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--color-accent-glow) border border-(--color-border-accent) text-xs font-semibold text-(--color-accent-bright) mb-4 uppercase tracking-wider">
              Legal Document
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-3">
              Privacy Policy
            </h1>
            <p className="text-(--color-fg-muted) text-sm">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Policy Content Card */}
          <div className="glass-panel p-8 md:p-12 border border-(--color-border-default) bg-(--color-surface) backdrop-blur-xl">
            
            {/* Quick Summary Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 pb-8 border-b border-white/5">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-(--color-accent-bright) shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Your Media is Yours</h4>
                  <p className="text-xs text-(--color-fg-muted)">Uploaded video files are processed and deleted within 24 hours of rendering.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Secure Transactions</h4>
                  <p className="text-xs text-(--color-fg-muted)">All payment billing is handled directly through premium secure gateways.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Eye className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">No Secret Tracking</h4>
                  <p className="text-xs text-(--color-fg-muted)">We only gather required telemetry necessary to run and improve our caption generator.</p>
                </div>
              </div>
            </div>

            {/* Privacy content body */}
            <div className="prose prose-invert max-w-none text-(--color-fg-muted) space-y-8">
              
              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">1.</span> Introduction
                </h2>
                <p className="leading-relaxed">
                  Welcome to NxtGen Captions (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting the personal data you share with us. This Privacy Policy describes how we collect, use, process, and protect your information when you visit our website, use our web application (the &quot;Editor&quot;), and interact with our automated subtitle/captions services.
                </p>
                <p className="leading-relaxed mt-3">
                  By accessing or using NxtGen Captions, you agree to the practices outlined in this policy. If you do not agree with any terms of this policy, please do not use our platform or upload any media assets.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">2.</span> Information We Collect
                </h2>
                <p className="leading-relaxed">
                  To provide you with high-quality AI captioning and motion graphic overlay features, we collect several types of data:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>
                    <strong className="text-white">Account Information:</strong> When you sign in (via Google, Apple, or Email), we store your name, email address, profile photo, and authorization credentials to authenticate your account and securely manage your workspace.
                  </li>
                  <li>
                    <strong className="text-white">Uploaded Media Files:</strong> We collect video and audio files you upload to our editor so our transcription engine can generate word-level timestamps. These assets are uploaded securely via signed URLs directly to Amazon Simple Storage Service (S3).
                  </li>
                  <li>
                    <strong className="text-white">Project Configuration Data:</strong> We store caption text, timestamps, layout settings, chosen templates (such as NxtGen GenZ, Hormozi Bold, etc.), custom fonts, colors, and timeline edits in our secure cloud databases so that you can resume your projects.
                  </li>
                  <li>
                    <strong className="text-white">Payment & Subscription Data:</strong> When you purchase credits or upgrade to a Premium plan, transactions are processed directly by our external PCI-compliant payment gateways. We do not store or hold your full credit card number or bank credentials on our systems.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">3.</span> How We Process and Use Your Data
                </h2>
                <p className="leading-relaxed">
                  Your information is utilized solely to deliver and improve our automated services:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>
                    <strong className="text-white">AI Audio Transcription:</strong> We send the audio track of your uploaded video to secure speech-to-text models (such as the Whisper API) to generate detailed timestamped subtitles.
                  </li>
                  <li>
                    <strong className="text-white">Video Rendering:</strong> We run server-side rendering nodes (via AWS Lambda and Remotion) to burn the motion graphic overlays, templates, and caption styles onto your video.
                  </li>
                  <li>
                    <strong className="text-white">Workspace Operations:</strong> To update your available storage quota, verify remaining AI audio credits, and maintain state persistence in your editor workspace.
                  </li>
                  <li>
                    <strong className="text-white">Product Development:</strong> Anonymized usage data helps us optimize rendering performance, debug compilation crashes, and improve AI template placement.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">4.</span> Media Retention & Deletion Policy
                </h2>
                <p className="leading-relaxed">
                  We prioritize storage efficiency and privacy, implementing strict automated lifecycles for your media:
                </p>
                <div className="mt-4 p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <p className="text-sm">
                    <strong className="text-white">Raw Uploaded Videos:</strong> Video files uploaded to our secure AWS S3 buckets are reserved only for active transcription/rendering and are automatically purged from our storage systems within <span className="text-white font-medium">24 hours</span>.
                  </p>
                  <p className="text-sm">
                    <strong className="text-white">Exported/Rendered Videos:</strong> Once your stylized video has successfully finished rendering via AWS Lambda, the final output file is stored for your convenience to download. It is systematically deleted after <span className="text-white font-medium">7 days</span>.
                  </p>
                  <p className="text-sm">
                    <strong className="text-white">Editor Projects:</strong> The subtitle transcripts and styling properties remain saved in our databases. If you delete a project from your dashboard, all related styling metadata, transcripts, and cached assets are deleted permanently.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">5.</span> Sharing of Information
                </h2>
                <p className="leading-relaxed">
                  We do not sell, rent, or lease your personal information or video content to third parties. We share data only with highly vetted subprocessors required to host, process, and secure the app:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-white">Infrastructure Providers:</strong> Amazon Web Services (AWS) for secure S3 storage, Fargate, SQS, and Lambda computing.</li>
                  <li><strong className="text-white">AI Services:</strong> Secured API gateways for audio processing and automatic speech recognition.</li>
                  <li><strong className="text-white">Billing Gateways:</strong> PCI-DSS compliant companies like Stripe or Paytm to manage secure premium tier checkouts.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">6.</span> Your Choices and Rights
                </h2>
                <p className="leading-relaxed">
                  Depending on your jurisdiction, you have several rights regarding your data:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-white">Access & Portability:</strong> You can download copies of your subtitle transcripts directly from the editor in SRT, VTT, or JSON formats.</li>
                  <li><strong className="text-white">Data Erasure:</strong> You can permanently close your account and wipe all stored data by visiting your Account Settings or emailing our support team.</li>
                  <li><strong className="text-white">Opt-Out:</strong> You can choose not to accept analytical cookies via your browser configurations (learn more in our <Link href="/cookies" className="text-(--color-accent-bright) hover:underline">Cookie Policy</Link>).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">7.</span> Contact Us
                </h2>
                <p className="leading-relaxed">
                  If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your media assets, please reach out to us:
                </p>
                <div className="mt-4 p-4 rounded-lg bg-white/[0.01] border border-white/5 text-sm text-(--color-fg-muted)">
                  <p><strong>Email:</strong> legal@nxtgencaptions.com</p>
                  <p className="mt-1"><strong>Response Time:</strong> We typically respond to legal or privacy inquiries within 48 business hours.</p>
                </div>
              </section>

            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
