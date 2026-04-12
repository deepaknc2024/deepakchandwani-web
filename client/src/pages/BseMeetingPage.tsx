import { useSlideshow } from "@/hooks/useSlideshow";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthGate } from "@/components/auth/AuthGate";
import { SlideContainer } from "@/components/bse/SlideContainer";
import { TopBar } from "@/components/bse/TopBar";
import { SideArrows } from "@/components/bse/SideArrows";
import { VoiceChatbot } from "@/components/bse/VoiceChatbot";

import { TitleSlide } from "@/components/bse/slides/TitleSlide";
import { AgendaSlide } from "@/components/bse/slides/AgendaSlide";
import { MissionSlide } from "@/components/bse/slides/MissionSlide";
import { PlatformSlide } from "@/components/bse/slides/PlatformSlide";
import { TrustSlide } from "@/components/bse/slides/TrustSlide";
import { TechnologySlide } from "@/components/bse/slides/TechnologySlide";
import { LaunchSlide } from "@/components/bse/slides/LaunchSlide";
import { SustainabilitySlide } from "@/components/bse/slides/SustainabilitySlide";
import { AdvisorySlide } from "@/components/bse/slides/AdvisorySlide";
import { ActionSlide } from "@/components/bse/slides/ActionSlide";
import { DecisionsSlide } from "@/components/bse/slides/DecisionsSlide";
import { ClosingSlide } from "@/components/bse/slides/ClosingSlide";

const TOTAL_SLIDES = 12;

interface BseMeetingPageProps {
  slug?: string;
}

export default function BseMeetingPage({
  slug = "bse-meeting",
}: BseMeetingPageProps) {
  const slideshow = useSlideshow(TOTAL_SLIDES);
  const { t } = useLanguage();

  const slideComponents = [
    <TitleSlide key={0} />,
    <AgendaSlide key={1} isActive={slideshow.current === 1} />,
    <MissionSlide key={2} isActive={slideshow.current === 2} />,
    <PlatformSlide key={3} isActive={slideshow.current === 3} />,
    <TrustSlide key={4} isActive={slideshow.current === 4} />,
    <TechnologySlide key={5} isActive={slideshow.current === 5} />,
    <LaunchSlide key={6} isActive={slideshow.current === 6} />,
    <SustainabilitySlide key={7} isActive={slideshow.current === 7} />,
    <AdvisorySlide key={8} isActive={slideshow.current === 8} />,
    <ActionSlide key={9} isActive={slideshow.current === 9} />,
    <DecisionsSlide key={10} isActive={slideshow.current === 10} />,
    <ClosingSlide key={11} />,
  ];

  return (
    <AuthGate slug={slug} title={t.bse.authTitle}>
      <div
        className="h-screen w-screen overflow-hidden font-dm"
        style={{ background: "#334155" }}
      >
        <SlideContainer current={slideshow.current}>
          {slideComponents}
        </SlideContainer>

        <TopBar
          current={slideshow.current}
          total={slideshow.total}
          isAutoplaying={slideshow.isAutoplaying}
          goTo={slideshow.goTo}
          startAutoplay={slideshow.startAutoplay}
          stopAutoplay={slideshow.stopAutoplay}
          restart={slideshow.restart}
        />

        <SideArrows
          current={slideshow.current}
          total={slideshow.total}
          onPrev={() => {
            slideshow.stopAutoplay();
            slideshow.prev();
          }}
          onNext={() => {
            slideshow.stopAutoplay();
            slideshow.next();
          }}
        />

        <VoiceChatbot />
      </div>
    </AuthGate>
  );
}
