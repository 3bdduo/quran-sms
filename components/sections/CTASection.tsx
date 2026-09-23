import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function CTASection() {
  return (
    <section className="py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-emerald-600 to-emerald-800 text-cream-50 px-8 py-16 sm:py-20 text-center">
          <div className="absolute inset-0 islamic-divider opacity-10" />
          <h2 className="relative text-3xl sm:text-4xl font-extrabold max-w-2xl mx-auto leading-tight">
            ابدأ رحلة ابنك مع القرآن الكريم اليوم
          </h2>
          <p className="relative mt-4 text-cream-100/80 max-w-xl mx-auto">
            التسجيل متاح الآن لكل الفئات العمرية — خطوة بسيطة تفصلكم عن بداية رحلة تربوية متكاملة
          </p>
          <div className="relative mt-8">
            <ButtonLink href="/register" variant="secondary" size="lg">سجّل الآن مجانًا</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
