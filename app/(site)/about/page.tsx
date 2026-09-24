import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IslamicDivider } from "@/components/ui/IslamicDivider";
import { Reveal } from "@/components/ui/Reveal";
import { Target, Eye, HeartHandshake } from "lucide-react";

export const metadata: Metadata = { title: "عن المدرسة" };

const values = [
  { icon: Target, title: "رسالتنا", text: "تربية جيل يحمل القرآن الكريم في صدره وسلوكه، عبر منهج تعليمي وتربوي متكامل يجمع بين الحفظ والفهم والتطبيق." },
  { icon: Eye, title: "رؤيتنا", text: "أن نكون منارة رائدة في تعليم القرآن الكريم وعلومه، ونموذجًا يُحتذى به في الجمع بين الأصالة والمنهجية الحديثة." },
  { icon: HeartHandshake, title: "قيمنا", text: "الإخلاص، الصبر، الرحمة في التعليم، والشراكة الحقيقية مع أولياء الأمور في رحلة كل طالب." },
];

export default function AboutPage() {
  return (
    <div className="py-14 sm:py-24">
      <Container>
        <SectionHeading eyebrow="من نحن" title="عن مدرسة التربية بالقرآن الكريم" />

        <Reveal delay={0.1} className="max-w-3xl mx-auto mt-10 text-center text-ink-soft leading-loose text-base sm:text-lg">
          <p>
            انطلقت مدرستنا من إيمان راسخ بأن القرآن الكريم هو أعظم وسيلة لتربية الأجيال، فجمعنا نخبة من المعلمين
            والمعلمات أصحاب الإجازات القرآنية والخبرة التربوية، لنقدّم منهجًا متكاملًا يوازن بين الحفظ المتقن،
            وفهم المعنى، وتطبيق القيم في حياة الطالب اليومية.
          </p>
          <p className="mt-6">
            نؤمن أن كل طالب له طريقته الخاصة في التعلم، لذلك تقوم فلسفتنا التربوية على المتابعة الفردية المستمرة،
            والتواصل الدائم مع أولياء الأمور، ليكونوا شركاء حقيقيين في رحلة أبنائهم مع كتاب الله.
          </p>
        </Reveal>

        <div className="mt-6">
          <IslamicDivider />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-10">
          {values.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.12} className="h-full">
              <div className="group card-interactive h-full p-7 sm:p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-brand-soft group-hover:bg-brand flex items-center justify-center text-brand-ink group-hover:text-on-brand mx-auto mb-5 transition-all duration-[1300ms] sh-soft group-hover:rotate-[-6deg] group-hover:scale-110">
                  <Icon size={28} />
                </div>
                <h3 className="font-ruqaa font-bold text-ink text-2xl leading-[1.6] mb-2">{title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
