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
    // Master v2 - Madde 30: <main> etiketi SEO için <div> ile değiştirildi
    <div className="flex min-h-screen flex-col">
      <Hero />
      <HomeFeaturedProperties />
      <WhyOneKey />
      <HowItWorks />
      <AboutPreview />
      <ReviewsPreview />
      <FinalCTA />
    </div>
  );
}