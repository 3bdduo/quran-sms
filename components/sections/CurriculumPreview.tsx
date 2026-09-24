"use client";

import { BookOpen, Mic2, Scale, Languages, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

const tracks = [
  { icon: BookOpen, title: "تحفيظ القرآن الكريم", desc: "برنامج تحفيظ متدرج بمتابعة يومية وتسميع منتظم." },
  { icon: Mic2, title: "التفسير والتجويد", desc: "فهم معاني الآيات وإتقان أحكام التلاوة الصحيحة." },
  { icon: Scale, title: "علوم شرعية", desc: "أساسيات الفقه والسيرة والعقيدة بأسلوب مبسط." },
  { icon: Languages, title: "اللغة العربية", desc: "تقوية النحو والصرف والتعبير لخدمة فهم القرآن." },
];

export function CurriculumPreview() {
  return (
    <section className="cv-auto py-16 sm:py-24 bg-deep text-on-deep relative overflow-hidden shadow-[0_-24px_60px_-30px_rgba(0,0,0,0.5),0_24px_60px_-30px_rgba(0,0,0,0.5)]">
      <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.07]" />
      <div aria-hidden="true" className="absolute -top-32 left-[10%] h-80 w-80 rounded-full orb-2" />
      <div aria-hidden="true" className="absolute -bottom-32 right-[8%] h-80 w-80 rounded-full orb-1" />

      <Container className="relative">
        <SectionHeading
          tone="onDeep"
          eyebrow="مناهجنا"
          title="أربعة مسارات تعليمية متكاملة"
          description="كل مسار مصمم ليكمل الآخر، ويشكل معًا رحلة تربوية متوازنة لطالب القرآن"
        />

        <Stagger className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tracks.map(({ icon: Icon, title, desc }) => (
            <StaggerItem key={title} className="h-full">
              <div className="group h-full bg-deep-2/80 border border-deep-line rounded-3xl p-6 sm:p-7 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)] transition-all duration-[1300ms] hover:-translate-y-2 hover:bg-deep-2 hover:border-gold/50 hover:shadow-[0_30px_60px_-18px_rgba(0,0,0,0.75)]">
                <div className="mb-5 h-14 w-14 grid place-items-center rounded-2xl bg-gold/15 text-gold transition-transform duration-[1300ms] group-hover:scale-110 group-hover:rotate-[-6deg]">
                  <Icon size={28} />
                </div>
                <h3 className="font-extrabold text-lg mb-2 text-on-deep">{title}</h3>
                <p className="text-sm text-on-deep-soft leading-relaxed">{desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2} className="mt-10 sm:mt-12 text-center">
          <ButtonLink href="/curriculum" variant="secondary">
            <ArrowLeft size={18} />
            كل تفاصيل المناهج
          </ButtonLink>
        </Reveal>
      </Container>
    </section>
  );
}
