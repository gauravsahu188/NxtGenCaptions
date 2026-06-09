import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import Loader from "@/components/Loader";
import Link from "next/link";
import { Info, ToggleLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy — NxtGen Captions",
  description: "Learn how NxtGen Captions uses cookies and local storage tokens to preserve editor settings, secure your login session, and analyze platform traffic.",
};

export default function CookiePolicy() {
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
              Transparency
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-3">
              Cookie Policy
            </h1>
            <p className="text-(--color-fg-muted) text-sm">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Cookies Content Card */}
          <div className="glass-panel p-8 md:p-12 border border-(--color-border-default) bg-(--color-surface) backdrop-blur-xl">
            
            {/* Quick Summary Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 pb-8 border-b border-white/5">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-(--color-accent-bright) shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Session Security</h4>
                  <p className="text-xs text-(--color-fg-muted)">Necessary for secure user authentication via NextAuth.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ToggleLeft className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Your Preferences</h4>
                  <p className="text-xs text-(--color-fg-muted)">Remembers your last templates, timeline settings, and sidebars.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">Easy Opt-Out</h4>
                  <p className="text-xs text-(--color-fg-muted)">Disable analytics cookies at any time through standard browser parameters.</p>
                </div>
              </div>
            </div>

            {/* Cookies content body */}
            <div className="prose prose-invert max-w-none text-(--color-fg-muted) space-y-8">
              
              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">1.</span> What Are Cookies?
                </h2>
                <p className="leading-relaxed">
                  Cookies are tiny text files containing a unique string of characters that are automatically downloaded to your computer or mobile device when you visit a website. Together with similar browser storage mechanisms (such as SessionStorage and LocalStorage), they allow web applications to secure your interactions and remember your personal preferences.
                </p>
                <p className="leading-relaxed mt-3">
                  This Cookie Policy explains what types of cookies and local storage tokens we use, why we use them, and how you can exercise your options to delete or restrict them.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">2.</span> How We Use Cookies
                </h2>
                <p className="leading-relaxed">
                  NxtGen Captions uses cookies in three distinct categories. We do not use advertising or behavioral tracking cookies to target you with external products.
                </p>

                {/* Categories of Cookies Table/Cards */}
                <div className="space-y-4 mt-4">
                  <div className="p-5 rounded-xl bg-white/1 border border-white/5">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-(--color-accent-bright)"></span>
                      Essential & Session Cookies (Always Active)
                    </h4>
                    <p className="text-sm leading-relaxed text-(--color-fg-muted) pl-4">
                      These cookies are strictly required to let you navigate the app. They include authentication tokens (NextAuth) that keep you signed into your creator dashboard, and security validation tokens (CSRF) that shield your workspace from malicious third-party cross-site requests. Without these, the site cannot operate properly.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-white/1 border border-white/5">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      Functional & Preference Storage
                    </h4>
                    <p className="text-sm leading-relaxed text-(--color-fg-muted) pl-4">
                      We utilize cookies and HTML5 LocalStorage to preserve your workspace setups in the editor. For example, we remember if your caption editor sidebar was collapsed, which caption presets you selected (like Genz, Hormozi, Abdal), your timeline zoom settings, and audio playback volumes. This ensures a smooth, uninterrupted editing flow when you reload the page.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-white/1 border border-white/5">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Analytics & Performance Cookies
                    </h4>
                    <p className="text-sm leading-relaxed text-(--color-fg-muted) pl-4">
                      These collect aggregate, anonymized data about how visitors interact with NxtGen Captions. They count site visits, identify landing page loading times, measure video transcription speed, and pinpoint page compilation errors. This helps us optimize our AWS Lambda rendering capacity and speech-to-text processing speed.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">3.</span> Cookies Placed by Third-Party Subprocessors
                </h2>
                <p className="leading-relaxed">
                  In some cases, our secure integration partners place specialized tokens on your device:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-white">NextAuth.js:</strong> Handles authentication cookies securely under encrypted cryptographic keys.</li>
                  <li><strong className="text-white">Payment Providers:</strong> Secure payment partners like Stripe or Paytm place essential cookies to detect fraud, ensure card verification safety, and handle secure credit checkouts.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">4.</span> How to Manage and Disable Cookies
                </h2>
                <p className="leading-relaxed">
                  You have full control over cookie usage on your systems. You can configure your internet browser to refuse cookies, erase cookies upon closing the app, or warn you before accepting them.
                </p>
                <p className="leading-relaxed mt-2">
                  Please consult your browser&apos;s documentation to adjust these preferences:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-(--color-accent-bright) hover:underline">Google Chrome settings</a></li>
                  <li><a href="https://support.apple.com/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-(--color-accent-bright) hover:underline">Apple Safari settings</a></li>
                  <li><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-(--color-accent-bright) hover:underline">Mozilla Firefox settings</a></li>
                  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63fd9a15-d993-87da-87b5-d9789a983021" target="_blank" rel="noopener noreferrer" className="text-(--color-accent-bright) hover:underline">Microsoft Edge settings</a></li>
                </ul>
                <div className="mt-4 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-sm text-(--color-fg-muted)">
                  <strong className="text-white">Note:</strong> If you completely disable all cookies, you will not be able to sign in or use the timeline editor, since our NextAuth session storage and CSRF guards rely on these cookies to protect your workspace.
                </div>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">5.</span> Changes to This Cookie Policy
                </h2>
                <p className="leading-relaxed">
                  We may update our Cookie Policy from time to time to align with new legal requirements or adjustments in our local storage tools. Any changes will be published here with an updated revision date.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-(--color-accent-bright)">6.</span> Contact Us
                </h2>
                <p className="leading-relaxed">
                  If you have any questions regarding this Cookie Policy or browser LocalStorage tracking, please email us:
                </p>
                <p className="mt-2 text-sm text-white">
                  <strong>Email:</strong> legal@nxtgencaptions.com
                </p>
              </section>

            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
