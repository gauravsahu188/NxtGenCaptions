import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import Loader from "@/components/Loader";
import Link from "next/link";
import { UserCheck, CreditCard, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — NxtGen Captions",
  description: "Read the Terms of Service for NxtGen Captions, outlining account rules, billing plans, copyright licenses, and system policies.",
};

export default function TermsOfService() {
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

        <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 w-full grow">
          {/* Header Section */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--color-accent-glow) border border-(--color-border-accent) text-xs font-semibold text-(--color-accent-bright) mb-4 uppercase tracking-wider">
              Platform Rules
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-3">
              Terms of Service
            </h1>
            <p className="text-(--color-fg-muted) text-sm">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Terms Content Card */}
          <div className="glass-panel p-8 md:p-12 border border-(--color-border-default) bg-(--color-surface) backdrop-blur-xl">
            
            {/* Quick Summary Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 pb-8 border-b border-white/5">
              <div className="flex gap-3">
                <UserCheck className="w-5 h-5 text-(--color-accent-bright) shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Your Account</h4>
                  <p className="text-xs text-(--color-fg-muted)">You are responsible for securing your login details and active session tokens.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CreditCard className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Billing & Limits</h4>
                  <p className="text-xs text-(--color-fg-muted)">Free tiers include watermark renders. Subscriptions control credit resets.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Scale className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Usage Compliance</h4>
                  <p className="text-xs text-(--color-fg-muted)">No reverse-engineering, scraping, or malicious uploads allowed on NxtGen.</p>
                </div>
              </div>
            </div>

            {/* Terms content body */}
            <div className="prose prose-invert max-w-none text-(--color-fg-muted) space-y-8">
              
              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">1.</span> Agreement to Terms
                </h2>
                <p className="leading-relaxed">
                  By creating an account, accessing, or using NxtGen Captions (including all tools, editors, transcription systems, and exported video products), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and all applicable laws and regulations.
                </p>
                <p className="leading-relaxed mt-3">
                  If you are entering into these terms on behalf of a company, group, or brand, you represent that you have the legal authority to bind such entity. If you do not agree to these Terms, you are prohibited from using the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">2.</span> Workspace & Account Registration
                </h2>
                <p className="leading-relaxed">
                  To access our timeline editor and export server-side renders, you must create a workspace account.
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>
                    <strong className="text-white">Account Responsibility:</strong> You are solely responsible for maintaining the confidentiality of your session keys and Google/Apple authorization. All activities performed through your account will be deemed yours.
                  </li>
                  <li>
                    <strong className="text-white">Accuracy:</strong> You agree to provide current, accurate, and complete registration details.
                  </li>
                  <li>
                    <strong className="text-white">Account Abuse:</strong> Creating multiple free accounts to circumvent monthly usage caps, storage quotas, or trial limits is strictly forbidden and will lead to immediate account termination.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">3.</span> Subscriptions, Billing, and Credits
                </h2>
                <p className="leading-relaxed">
                  NxtGen Captions offers Free Accounts and several premium tiers (Creator, Pro, Agency) that provide credits for AI audio processing and watermark-free renders:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>
                    <strong className="text-white">Limits on Free Tier:</strong> Free tier users can upload videos up to <span className="text-white">5 minutes</span> in length. Exports will contain a NxtGen watermark and selected high-fidelity presets (like NxtGen GenZ) are restricted to premium plans.
                  </li>
                  <li>
                    <strong className="text-white">Premium Presets Check:</strong> Select styles (such as NxtGen GenZ) check your active `planType`. Trying to bypass these client/server checks will result in a suspension.
                  </li>
                  <li>
                    <strong className="text-white">Credit Expiration:</strong> Paid subscriber credits reset each month depending on your subscription cycle, unless explicitly specified otherwise.
                  </li>
                  <li>
                    <strong className="text-white">Refunds:</strong> Payments are pre-billed and are non-refundable once rendering or credit usage has occurred, except where required by law.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">4.</span> Intellectual Property & Content Ownership
                </h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">
                    We recognize that creative control and copyright ownership are vital for video creators:
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-white">Your Content Rights:</strong> You retain complete and absolute ownership, copyrights, and intellectual property rights in and to all videos, soundtracks, scripts, and media uploaded to the platform, as well as the generated subtitle transcript files.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-white">License Granted to Us:</strong> By uploading your content to NxtGen Captions, you grant us a temporary, limited, worldwide, royalty-free license solely to store, convert, parse, transcribe, and render your video files as necessary to provide the services you request. We do not use your private videos to train commercial transcription models without your explicit consent.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-white">Our Rights:</strong> All visual interfaces, software engines, design themes, presets, codes, logo systems, databases, and branding are the exclusive property of NxtGen Captions.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">5.</span> Acceptable Use Policy
                </h2>
                <p className="leading-relaxed">
                  You agree to use NxtGen Captions responsibly. You must not:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Upload any media that is illegal, defamatory, threatening, highly offensive, or violates third-party copyright laws.</li>
                  <li>Use custom automated scripts to stress-test the video-transcription or rendering engine, or bypass the AWS Lambda/S3 presigned URL authorization protocols.</li>
                  <li>Reverse engineer, decompile, or copy the template styling layouts, motion graphics packages, or timeline structures.</li>
                  <li>Falsify credit levels or exploit system glitches to bypass billing gates.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">6.</span> AI Subtitle Accuracy & Service Disclaimers
                </h2>
                <div className="mt-4 p-5 rounded-xl bg-white/2 border border-white/5 space-y-3">
                  <p className="text-sm">
                    <strong className="text-white">AI Discrepancy:</strong> NxtGen Captions uses state-of-the-art neural transcription systems to generate subtitles. However, transcription accuracy can vary based on audio quality, speaker accents, background noise, or terminology. We do not guarantee 100% precision. Subtitles must be reviewed and corrected by you in our timeline editor.
                  </p>
                  <p className="text-sm">
                    <strong className="text-white">Availability:</strong> Our services are provided &quot;as is&quot; and &quot;as available&quot;. While we aim for maximum uptime, we do not warrant that our server-side rendering pipelines (AWS Lambda, S3, or SQS) will be uninterrupted, error-free, or entirely bug-resistant.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">7.</span> Limitation of Liability
                </h2>
                <p className="leading-relaxed">
                  To the maximum extent permitted by law, NxtGen Captions, its founders, and employees will not be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of profits, loss of brand reputation, video project data corruption, or service pauses, resulting from your use or inability to use the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">8.</span> Governing Law & Updates
                </h2>
                <p className="leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of Delaware, USA, without regard to conflict of law principles. We reserve the right to amend these Terms at any time. We will notify you of major updates by changing the &quot;Last updated&quot; date or via dashboard alerts.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">9.</span> Contact & Inquiries
                </h2>
                <p className="leading-relaxed">
                  For any clarifications, legal issues, or policy feedback on these Terms of Service, please write to:
                </p>
                <div className="mt-4 p-4 rounded-lg bg-white/1 border border-white/5 text-sm text-(--color-fg-muted)">
                  <p><strong>Email:</strong> support@nxtgencaptions.com</p>
                  <p className="mt-1"><strong>Mailing Address:</strong> NxtGen Technologies Inc., Legal Dept, Dover, DE 19901</p>
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
