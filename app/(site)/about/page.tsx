import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IslamicDivider } from "@/components/ui/IslamicDivider";
import { Target, Eye, HeartHandshake } from "lucide-react";

export const metadata: Metadata = { title: "عن المدرسة" };

const values = [
  { icon: Target, title: "رسالتنا", text: "تربية جيل يحمل القرآن الكريم في صدره وسلوكه، عبر منهج تعليمي وتربوي متكامل يجمع بين الحفظ والفهم والتطبيق." },
  { icon: Eye, title: "رؤيتنا", text: "أن نكون منارة رائدة في تعليم القرآن الكريم وعلومه، ونموذجًا يُحتذى به في الجمع بين الأصالة والمنهجية الحديثة." },
  { icon: HeartHandshake, title: "قيمنا", text: "الإخلاص، الصبر، الرحمة في التعليم، والشراكة الحقيقية مع أولياء الأمور في رحلة كل طالب." },
];

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="من نحن" title="عن مدرسة التربية بالقرآن الكريم" />

        <div className="max-w-3xl mx-auto mt-10 text-center text-emerald-900/70 leading-loose text-lg">
          <p>
            انطلقت مدرستنا من إيمان راسخ بأن القرآن الكريم هو أعظم وسيلة لتربية الأجيال، فجمعنا نخبة من المعلمين
            والمعلمات أصحاب الإجازات القرآنية والخبرة التربوية، لنقدّم منهجًا متكاملًا يوازن بين الحفظ المتقن،
            وفهم المعنى، وتطبيق القيم في حياة الطالب اليومية.
          </p>
          <p className="mt-6">
            نؤمن أن كل طالب له طريقته الخاصة في التعلم، لذلك تقوم فلسفتنا التربوية على المتابعة الفردية المستمرة،
            والتواصل الدائم مع أولياء الأمور، ليكونوا شركاء حقيقيين في رحلة أبنائهم مع كتاب الله.
          </p>
        </div>

        <IslamicDivider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-3xl p-8 border border-emerald-900/5 text-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-5">
                <Icon size={26} />
              </div>
              <h3 className="font-extrabold text-emerald-950 text-lg mb-2">{title}</h3>
              <p className="text-sm text-emerald-900/60 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
