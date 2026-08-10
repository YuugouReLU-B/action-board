import { CopyrightSection } from "@/components/footer/copyright-section";
import { FeedbackSection } from "@/components/footer/feedback-section";
import { LogoSection } from "@/components/footer/logo-section";
import { SeasonsList } from "@/components/footer/seasons-list";
import { HeroBackdrop } from "@/components/top/hero-backdrop";

export default function Footer() {
  return (
    <footer className="w-full mt-16 pt-16">
      <div className="">
        <FeedbackSection />
      </div>

      <div className="relative w-full bg-linear-to-b from-[var(--app-brand-light)] to-[var(--app-brand-pale)] overflow-hidden">
        {/* トップと同じ風景を、ぼかして footer の地に敷く */}
        <HeroBackdrop blur overlayClassName="bg-white/55" />

        <div className="relative z-10 pb-4">
          <LogoSection />
          <SeasonsList />
          <CopyrightSection />
        </div>
      </div>
    </footer>
  );
}
