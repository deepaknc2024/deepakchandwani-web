import HeroLeft from "@/components/landing/HeroLeft";
import HeroRight from "@/components/landing/HeroRight";
import StatsBand from "@/components/landing/StatsBand";
import AboutSection from "@/components/landing/AboutSection";
import ServicesSection from "@/components/landing/ServicesSection";
import VideoSection from "@/components/landing/VideoSection";
import ContactSection from "@/components/landing/ContactSection";

export default function LandingPage() {
  return (
    <>
      {/* Hero split */}
      <div className="grid grid-cols-[42%_58%] min-h-[calc(100vh-58px)] max-lg:grid-cols-1 max-lg:min-h-auto">
        <HeroLeft />
        <HeroRight />
      </div>

      <StatsBand />
      <AboutSection />
      <ServicesSection />
      <VideoSection />
      <ContactSection />
    </>
  );
}
