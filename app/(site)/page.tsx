import { Suspense } from "react";
import { Hero } from "@/components/sections/Hero";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { CurriculumPreview } from "@/components/sections/CurriculumPreview";
import { StatsSection } from "@/components/sections/StatsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { BlogPreview } from "@/components/sections/BlogPreview";
import { CTASection } from "@/components/sections/CTASection";
import { Container } from "@/components/ui/Container";
import { Loader } from "@/components/ui/Loader";

// الأقسام اللي بتجيب بيانات من الباك إند بتتحمّل لوحدها وبيظهر لودر مكانها،
// فباقي الصفحة بتظهر فورًا من غير ما تستنى الـ API
function SectionFallback() {
  return (
    <section className="py-10">
      <Container>
        <Loader size="sm" label="جاري تحميل القسم" />
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <CurriculumPreview />
      <StatsSection />
      <TestimonialsSection />
      <Suspense fallback={<SectionFallback />}>
        <BlogPreview />
      </Suspense>
      <CTASection />
    </>
  );
}
