import { Hero } from "@/components/sections/Hero";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { CurriculumPreview } from "@/components/sections/CurriculumPreview";
import { StatsSection } from "@/components/sections/StatsSection";
import { TeachersPreview } from "@/components/sections/TeachersPreview";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { BlogPreview } from "@/components/sections/BlogPreview";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <CurriculumPreview />
      <StatsSection />
      <TeachersPreview />
      <TestimonialsSection />
      <BlogPreview />
      <CTASection />
    </>
  );
}
