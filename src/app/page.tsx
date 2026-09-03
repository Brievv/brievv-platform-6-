import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import { TrustStrip, HowItWorks, ServicesPreview, QualitySecurity, FinalCTA } from "@/components/marketing/home-sections";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <ServicesPreview />
        <QualitySecurity />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}
