import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import AboutSection from "@/components/landing/AboutSection";
import TemplateShowcase from "@/components/landing/TemplateShowcase";
import GenzTemplateSection from "@/components/landing/GenzTemplateSection";
import Pricing from "@/components/landing/Pricing";
import ContactSection from "@/components/landing/ContactSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import Loader from "@/components/Loader";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-(--color-bg-base) text-(--color-foreground) font-sans selection:bg-accent/30 overflow-hidden">
      {/* Typewriter Page Loader */}
      <Loader isPageLoader />
      {/* Background System: Layered Ambient Lighting */}

      {/* Layer 1: Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)] z-0 pointer-events-none" />

      {/* Layer 2: Animated Gradient Blobs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[1400px] bg-accent/20 blur-[150px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[800px] bg-purple-500/15 blur-[120px] rounded-full z-0 pointer-events-none animate-float-delayed mix-blend-screen" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[700px] bg-indigo-500/12 blur-[100px] rounded-full z-0 pointer-events-none animate-float mix-blend-screen" />

      {/* Layer 3: Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.02] z-0 pointer-events-none mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_40%,transparent_100%)]" />

      {/* Layer 4: Noise Texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10">
        <Navbar />
        <main className="flex flex-col items-center justify-center w-full">
          <Hero />
          <TemplateShowcase />
          <GenzTemplateSection />
          <AboutSection />
          <Pricing />
          <ContactSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}