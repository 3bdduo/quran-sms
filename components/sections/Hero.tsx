"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Users, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { IslamicDivider } from "@/components/ui/IslamicDivider";

const EASE = [0.22, 1, 0.36, 1] as const;

const line1 = "نُربّي أبناءنا على القرآن الكريم".split(" ");
const line2 = "حفظًا وفهمًا وتطبيقًا".split(" ");

const chips = [
  { icon: BookOpenCheck, label: "منهج متكامل ومتدرج" },
  { icon: Users, label: "معلمون مؤهلون وإجازات قرآنية" },
  { icon: Sparkles, label: "متابعة مستمرة لكل طالب" },
];

/** كلمات العنوان بتدخل واحدة ورا التانية بحركة ناعمة. */
function Words({ words, start, className }: { words: string[]; start: number; className?: string }) {
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={w + i}>
          <motion.span
            initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: start + i * 0.09, ease: EASE }}
            className="inline-block"
          >
            {w}
          </motion.span>{" "}
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[var(--hero-from)] via-bg to-bg">
      {/* زخرفة النجمة الثمانية بتتلاشى عند الأطراف */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pattern-star opacity-[0.16] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]"
      />

      {/* نجمة عملاقة بتلف ببطء ورا العنوان */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="pointer-events-none absolute left-1/2 top-[-6%] h-[34rem] w-[34rem] sm:h-[46rem] sm:w-[46rem] -translate-x-1/2 text-gold opacity-[0.16] animate-spin-slower"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="60" y="60" width="280" height="280" />
          <rect x="60" y="60" width="280" height="280" transform="rotate(45 200 200)" />
          <rect x="100" y="100" width="200" height="200" />
          <rect x="100" y="100" width="200" height="200" transform="rotate(45 200 200)" />
          <circle cx="200" cy="200" r="140" />
          <circle cx="200" cy="200" r="60" />
        </g>
      </svg>

      {/* توهجات طايرة */}
      <div aria-hidden="true" className="absolute -top-24 -right-16 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-glow-1 blur-3xl animate-float-slow" />
      <div aria-hidden="true" className="absolute -bottom-28 -left-16 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-glow-2 blur-3xl animate-float" />

      <Container className="relative py-16 sm:py-24 lg:py-28 text-center">
        <motion.span
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink bg-brand-soft border border-line px-5 py-2 rounded-full mb-7 sh-soft"
        >
          <Sparkles size={16} className="text-gold-ink" />
          رحلة حفظ وتدبر تبدأ من هنا
        </motion.span>

        {/* العنوان الرئيسي — خط الرقعة */}
        <h1 className="font-ruqaa font-bold text-ink text-[clamp(2.4rem,7.4vw,5rem)] leading-[1.7] max-w-4xl mx-auto text-balance">
          <Words words={line1} start={0.15} />
          <br className="hidden sm:block" />
          <Words words={line2} start={0.15 + line1.length * 0.09} className="text-brand-ink" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
          className="mt-6 text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed font-medium"
        >
          منهج متكامل يجمع بين تحفيظ القرآن الكريم، والتفسير والتجويد، والعلوم الشرعية، واللغة العربية —
          بمتابعة مستمرة من معلمين مؤهلين لكل طالب.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
          className="mt-9 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto"
        >
          <ButtonLink href="/register" size="lg">
            سجّل ابنك الآن
          </ButtonLink>
          <ButtonLink href="/curriculum" variant="outline" size="lg">
            تعرّف على المناهج
          </ButtonLink>
        </motion.div>

        <div className="mt-10 sm:mt-12">
          <IslamicDivider />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 1.25 } } }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto mt-4"
        >
          {chips.map(({ icon: Icon, label }) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.94 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
              }}
              className="card-interactive flex items-center gap-3 px-5 py-4"
            >
              <div className="h-11 w-11 shrink-0 rounded-full bg-brand-soft flex items-center justify-center text-brand-ink sh-soft">
                <Icon size={21} />
              </div>
              <p className="text-sm font-bold text-ink text-start leading-snug">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
