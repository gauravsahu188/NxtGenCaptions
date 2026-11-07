import Navbar from "@/components/Navbar";
import Hero from "@/components/landing/Hero";
import TemplateShowcase from "@/components/landing/TemplateShowcase";
import GenzTemplateSection from "@/components/landing/GenzTemplateSection";
import Pricing from "@/components/landing/Pricing";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import Loader from "@/components/Loader";
import SEOSection from "@/components/landing/SEOSection";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030305] text-[#EDEDEF] font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Typewriter Page Loader */}
      <Loader isPageLoader />

      {/* Layer 1: Base Deep Void */}
      <div className="absolute inset-0 bg-[#030305] z-0 pointer-events-none" />

      {/* Layer 2: Subtle Ambient Top Flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08)_0%,rgba(99,102,241,0.03)_40%,transparent_70%)] z-0 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />
        <main className="flex flex-col items-center justify-center w-full">
          <Hero />
          <TemplateShowcase />
          <GenzTemplateSection />
          <Pricing />
          <FAQSection />
          <SEOSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
