"use client";

import { motion } from "framer-motion";
import { BookMarked, GraduationCap, ClipboardCheck, CalendarClock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  { icon: BookMarked, title: "منهج متكامل", desc: "تحفيظ، تفسير وتجويد، علوم شرعية، ولغة عربية — في مسار تعليمي واحد متدرج." },
  { icon: GraduationCap, title: "معلمون مؤهلون", desc: "نخبة من المعلمين أصحاب الإجازات القرآنية والخبرة التربوية الطويلة." },
  { icon: ClipboardCheck, title: "متابعة مستمرة", desc: "تقارير دورية عن الحفظ والحضور والتقدم، تصل لولي الأمر أولًا بأول." },
  { icon: CalendarClock, title: "مرونة في المواعيد", desc: "حلقات ومجموعات تعليمية بمواعيد متعددة تناسب جدول الطالب وأسرته." },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading eyebrow="لماذا نحن؟" title="تجربة تعليمية متكاملة لأبنائكم" />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-white rounded-3xl p-7 border border-emerald-900/5 hover:border-emerald-300 hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5"
            >
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 flex items-center justify-center text-emerald-600 group-hover:text-cream-50 transition-colors duration-300 mb-5">
                <Icon size={26} />
              </div>
              <h3 className="font-extrabold text-emerald-950 text-lg mb-2">{title}</h3>
              <p className="text-sm text-emerald-900/60 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
