"use client";

import { motion } from "framer-motion";
import { BookOpen, Mic2, Scale, Languages, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";

const tracks = [
  { icon: BookOpen, title: "تحفيظ القرآن الكريم", desc: "برنامج تحفيظ متدرج بمتابعة يومية وتسميع منتظم." },
  { icon: Mic2, title: "التفسير والتجويد", desc: "فهم معاني الآيات وإتقان أحكام التلاوة الصحيحة." },
  { icon: Scale, title: "علوم شرعية", desc: "أساسيات الفقه والسيرة والعقيدة بأسلوب مبسط." },
  { icon: Languages, title: "اللغة العربية", desc: "تقوية النحو والصرف والتعبير لخدمة فهم القرآن." },
];

export function CurriculumPreview() {
  return (
    <section className="py-20 bg-emerald-950 text-cream-50 relative overflow-hidden">
      <div className="absolute inset-0 islamic-divider opacity-10" />
      <Container className="relative">
        <SectionHeading
          eyebrow="مناهجنا"
          title="أربعة مسارات تعليمية متكاملة"
          description="كل مسار مصمم ليكمل الآخر، ويشكل معًا رحلة تربوية متوازنة لطالب القرآن"
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tracks.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-emerald-900/50 backdrop-blur-sm border border-cream-50/10 rounded-3xl p-7 hover:bg-emerald-900 transition-colors"
            >
              <Icon size={30} className="text-gold-400 mb-4" />
              <h3 className="font-extrabold text-lg mb-2">{title}</h3>
              <p className="text-sm text-cream-100/60 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <ButtonLink href="/curriculum" variant="secondary">
            <ArrowLeft size={18} />
            كل تفاصيل المناهج
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
