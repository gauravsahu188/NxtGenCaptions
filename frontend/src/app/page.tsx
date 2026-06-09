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
    <div className="relative min-h-screen bg-(--color-bg-base) text-(--color-foreground) font-sans selection:bg-accent/30 overflow-hidden">
      {/* Typewriter Page Loader */}
      <Loader isPageLoader />
      {/* Background System: 3D Spatial Environment */}

      {/* Layer 1: Base Dark Void */}
      <div className="absolute inset-0 bg-[#020203] z-0 pointer-events-none" />

      {/* Layer 2: 3D Spatial Grid (Floor) */}
      <div className="absolute inset-x-0 bottom-[-20%] h-[80vh] perspective-1000 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:rotateX(75deg)_scale(2.5)] [transform-origin:bottom_center] opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      </div>

      {/* Layer 3: Editorial Core Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[80vh] bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.15)_0%,rgba(0,0,0,0)_60%)] z-0 pointer-events-none mix-blend-screen" />
      
      {/* Layer 4: High-frequency Grain */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

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