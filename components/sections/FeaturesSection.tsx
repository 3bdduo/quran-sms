"use client";

import { BookMarked, GraduationCap, ClipboardCheck, CalendarClock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";

const features = [
  { icon: BookMarked, title: "منهج متكامل", desc: "تحفيظ، تفسير وتجويد، وعلوم شرعية — في مسار تعليمي واحد متدرج." },
  { icon: GraduationCap, title: "معلمون مؤهلون", desc: "نخبة من المعلمين أصحاب الإجازات القرآنية والخبرة التربوية الطويلة." },
  { icon: ClipboardCheck, title: "متابعة مستمرة", desc: "تقارير دورية عن الحفظ والحضور والتقدم، تصل لولي الأمر أولًا بأول." },
  { icon: CalendarClock, title: "مرونة في المواعيد", desc: "حلقات ومجموعات تعليمية بمواعيد متعددة تناسب جدول الطالب وأسرته." },
];

export function FeaturesSection() {
  return (
    <section className="cv-auto py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="لماذا نحن؟" title="تجربة تعليمية متكاملة لأبنائكم" />

        <Stagger className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <StaggerItem key={title} className="h-full">
              <div className="group card-interactive h-full p-6 sm:p-7">
                <div className="h-14 w-14 rounded-2xl bg-brand-soft group-hover:bg-brand flex items-center justify-center text-brand-ink group-hover:text-on-brand transition-all duration-[1300ms] mb-5 sh-soft group-hover:rotate-[-6deg] group-hover:scale-110">
                  <Icon size={26} />
                </div>
                <h3 className="font-extrabold text-ink text-lg mb-2">{title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
