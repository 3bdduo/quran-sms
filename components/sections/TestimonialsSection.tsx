"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const testimonials = [
  { name: "أم عبدالرحمن", role: "ولية أمر", text: "ابني تغيّر تمامًا من ناحية الالتزام والأخلاق، والمتابعة المستمرة من المعلمين شيء نادر تلاقيه." },
  { name: "أبو مالك", role: "ولي أمر", text: "التقارير الدورية بتخليني عارف تقدم بنتي أول بأول، حسيت إني شريك حقيقي في رحلة حفظها." },
  { name: "سارة أحمد", role: "طالبة", text: "بحب المدرسة جدًا، المعلمات بيسهلوا الحفظ عليا وبحس بفرق كبير في فهمي للقرآن." },
];

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading eyebrow="آراؤهم" title="ماذا يقول أولياء الأمور والطلاب" />

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-cream-100/60 rounded-3xl p-7 border border-emerald-900/5 relative"
            >
              <Quote className="text-emerald-200 mb-3" size={32} />
              <p className="text-emerald-900/80 leading-relaxed mb-5">{t.text}</p>
              <div>
                <p className="font-extrabold text-emerald-950">{t.name}</p>
                <p className="text-xs text-emerald-700 font-semibold">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
