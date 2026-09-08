import {
  Hero,
  WhyOneKey,
  HowItWorks,
  AboutPreview,
  ReviewsPreview,
  FinalCTA,
} from "@/components/HomeSections";
import HomeFeaturedProperties from "@/components/HomeFeaturedProperties";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <HomeFeaturedProperties />
      <WhyOneKey />
      <HowItWorks />
      <AboutPreview />
      <ReviewsPreview />
      <FinalCTA />
      
      {/* 
        DİKKAT: <Footer /> bileşenini buradan kaldırdık. 
        Çünkü sitemizin ana iskeleti olan layout.tsx dosyasında zaten bir Footer var.
      */}
    </main>
  );
}