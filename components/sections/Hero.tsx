"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Users, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { IslamicDivider } from "@/components/ui/IslamicDivider";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-cream-50 to-cream-50">
      <div className="absolute inset-0 islamic-divider pointer-events-none" />
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gold-400/20 blur-3xl" />

      <Container className="relative py-20 sm:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-100/70 px-5 py-2 rounded-full mb-6">
            <Sparkles size={16} />
            رحلة حفظ وتدبر تبدأ من هنا
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-emerald-950 leading-[1.2] max-w-4xl mx-auto">
            نُربّي أبناءنا على القرآن الكريم <br className="hidden sm:block" />
            <span className="text-emerald-600">حفظًا وفهمًا وتطبيقًا</span>
          </h1>

          <p className="mt-6 text-lg text-emerald-900/70 max-w-2xl mx-auto leading-relaxed">
            منهج متكامل يجمع بين تحفيظ القرآن الكريم، والتفسير والتجويد، والعلوم الشرعية، واللغة العربية —
            بمتابعة مستمرة من معلمين مؤهلين لكل طالب.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <ButtonLink href="/register" size="lg">سجّل ابنك الآن</ButtonLink>
            <ButtonLink href="/curriculum" variant="outline" size="lg">تعرّف على المناهج</ButtonLink>
          </div>
        </motion.div>

        <IslamicDivider />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto mt-4"
        >
          {[
            { icon: BookOpenCheck, label: "منهج متكامل ومتدرج" },
            { icon: Users, label: "معلمون مؤهلون وإجازات قرآنية" },
            { icon: Sparkles, label: "متابعة مستمرة لكل طالب" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-emerald-900/5 rounded-2xl px-5 py-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Icon size={20} />
              </div>
              <p className="text-sm font-bold text-emerald-900 text-right">{label}</p>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
