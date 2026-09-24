"use client";

import { Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";

const testimonials = [
  { name: "أم عبدالرحمن", role: "ولية أمر", text: "ابني تغيّر تمامًا من ناحية الالتزام والأخلاق، والمتابعة المستمرة من المعلمين شيء نادر تلاقيه." },
  { name: "أبو مالك", role: "ولي أمر", text: "التقارير الدورية بتخليني عارف تقدم بنتي أول بأول، حسيت إني شريك حقيقي في رحلة حفظها." },
  { name: "سارة أحمد", role: "طالبة", text: "بحب المدرسة جدًا، المعلمات بيسهلوا الحفظ عليا وبحس بفرق كبير في فهمي للقرآن." },
];

export function TestimonialsSection() {
  return (
    <section className="cv-auto py-16 sm:py-24 bg-bg-alt/60">
      <Container>
        <SectionHeading eyebrow="آراؤهم" title="ماذا يقول أولياء الأمور والطلاب" />

        <Stagger className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t, i) => (
            <StaggerItem key={t.name} className={`h-full ${i === 2 ? "md:col-span-2 lg:col-span-1" : ""}`}>
              <figure className="card-interactive relative h-full p-6 sm:p-7 flex flex-col">
                <Quote className="text-gold mb-3 rotate-180" size={34} />
                <blockquote className="text-ink-soft leading-relaxed mb-6 flex-1">{t.text}</blockquote>
                <figcaption className="flex items-center gap-3 pt-4 border-t border-line">
                  <span className="h-11 w-11 shrink-0 rounded-full bg-brand-soft text-brand-ink grid place-items-center font-ruqaa text-xl font-bold">
                    {t.name.replace(/^(أم|أبو)\s/, "").charAt(0)}
                  </span>
                  <span>
                    <span className="block font-extrabold text-ink">{t.name}</span>
                    <span className="block text-xs text-brand-ink font-semibold">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
