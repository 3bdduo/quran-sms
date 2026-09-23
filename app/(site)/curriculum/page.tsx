import type { Metadata } from "next";
import { BookOpen, Mic2, Scale, Languages, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
    <div className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="مناهجنا"
          title="أربعة مسارات تعليمية متكاملة"
          description="منهج شامل يبني الطالب حفظًا وفهمًا وسلوكًا، بمستويات متدرجة تناسب كل الأعمار"
        />

        <div className="mt-16 space-y-8">
          {tracks.map(({ icon: Icon, title, duration, ages, points }, i) => (
            <div
              key={title}
              className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 items-center bg-white rounded-3xl border border-emerald-900/5 p-8 sm:p-10`}
            >
              <div className="shrink-0 h-24 w-24 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Icon size={44} />
              </div>
              <div className="flex-1 text-center lg:text-right">
                <h3 className="text-2xl font-extrabold text-emerald-950">{title}</h3>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-3">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{duration}</span>
                  <span className="text-xs font-bold bg-gold-400/20 text-gold-500 px-3 py-1 rounded-full">{ages}</span>
                </div>
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-emerald-900/70">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
