import type { Metadata } from "next";
import { BookOpen, Mic2, Scale, Languages, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "المناهج" };

const tracks = [
  {
    icon: BookOpen,
    title: "تحفيظ القرآن الكريم",
    duration: "برنامج متدرج (3-5 سنوات حسب المستوى)",
    ages: "من 6 سنوات فأكثر",
    points: ["تسميع يومي منتظم بمتابعة فردية", "مراجعة دورية أسبوعية وشهرية", "تصحيح التلاوة أثناء الحفظ", "شهادات إتمام لكل جزء محفوظ"],
  },
  {
    icon: Mic2,
    title: "التفسير والتجويد",
    duration: "مستويات متدرجة (مبتدئ - متقدم)",
    ages: "من 8 سنوات فأكثر",
    points: ["أحكام التجويد النظرية والتطبيقية", "تفسير ميسّر لقصار السور", "تدريب على القراءة المجوّدة", "متابعة الأداء الصوتي والمخارج"],
  },
  {
    icon: Scale,
    title: "العلوم الشرعية",
    duration: "برنامج سنوي متكامل",
    ages: "من 7 سنوات فأكثر",
    points: ["أساسيات الفقه الميسّر", "السيرة النبوية بأسلوب قصصي", "مبادئ العقيدة الصحيحة", "آداب وأخلاق إسلامية تطبيقية"],
  },
  {
    icon: Languages,
    title: "اللغة العربية",
    duration: "مستويات حسب الفئة العمرية",
    ages: "من 6 سنوات فأكثر",
    points: ["أساسيات النحو والصرف", "تقوية الإملاء والخط", "التعبير والمحادثة", "ربط اللغة بفهم النصوص القرآنية"],
  },
];

export default function CurriculumPage() {
  return (
    <div className="py-14 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="مناهجنا"
          title="أربعة مسارات تعليمية متكاملة"
          description="منهج شامل يبني الطالب حفظًا وفهمًا وسلوكًا، بمستويات متدرجة تناسب كل الأعمار"
        />

        <div className="mt-12 sm:mt-16 space-y-6 sm:space-y-8">
          {tracks.map(({ icon: Icon, title, duration, ages, points }, i) => (
            <Reveal key={title} from={i % 2 === 1 ? "end" : "start"} distance={50}>
              <div
                className={`group card-interactive flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-6 sm:gap-8 items-center p-6 sm:p-10`}
              >
                <div className="shrink-0 h-24 w-24 rounded-3xl bg-brand-soft group-hover:bg-brand flex items-center justify-center text-brand-ink group-hover:text-on-brand transition-all duration-[1300ms] sh-soft group-hover:rotate-[-6deg]">
                  <Icon size={44} />
                </div>
                <div className="flex-1 min-w-0 text-center lg:text-start">
                  <h3 className="font-ruqaa font-bold text-3xl leading-[1.6] text-ink">{title}</h3>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2.5 mt-3">
                    <span className="text-xs font-bold bg-brand-soft text-brand-ink px-3 py-1.5 rounded-full">{duration}</span>
                    <span className="text-xs font-bold bg-gold-soft text-gold-ink px-3 py-1.5 rounded-full">{ages}</span>
                  </div>
                  <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-start">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-ink-soft">
                        <CheckCircle2 size={17} className="text-brand-ink shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
