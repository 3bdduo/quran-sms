"use client";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function CTASection() {
  return (
    <section className="py-14 sm:py-24">
      <Container>
        <Reveal from="scale" duration={0.9}>
          <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] bg-deep text-on-deep border border-deep-line px-6 sm:px-10 py-14 sm:py-20 text-center sh-float">
            <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.09]" />
            <div aria-hidden="true" className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-glow-2 blur-3xl animate-float-slow" />
            <div aria-hidden="true" className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-glow-1 blur-3xl animate-float" />

            <h2 className="relative font-ruqaa font-bold text-[clamp(2rem,5.6vw,3.6rem)] leading-[1.65] max-w-2xl mx-auto text-balance">
              ابدأ رحلة ابنك مع القرآن الكريم اليوم
            </h2>
            <p className="relative mt-4 text-on-deep-soft max-w-xl mx-auto leading-relaxed">
              التسجيل متاح الآن لكل الفئات العمرية — خطوة بسيطة تفصلكم عن بداية رحلة تربوية متكاملة
            </p>
            <div className="relative mt-8 sm:mt-10 flex justify-center">
              <ButtonLink href="/register" variant="secondary" size="lg">
                سجّل الآن مجانًا
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
