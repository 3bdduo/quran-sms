"use client";

import { Container } from "@/components/ui/Container";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

const stats = [
  { value: 500, label: "طالب وطالبة" },
  { value: 30, label: "معلم ومعلمة" },
  { value: 120, label: "حافظ وحافظة" },
  { value: 8, label: "سنوات خبرة" },
];

export function StatsSection() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <Reveal from="scale" className="relative overflow-hidden card !rounded-[2rem] p-6 sm:p-10">
          <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.06]" />
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
            {stats.map((s, i) => (
              <Reveal
                key={s.label}
                delay={0.1 + i * 0.1}
                className="text-center md:border-e md:last:border-e-0 border-line px-2"
              >
                <p className="text-4xl sm:text-5xl font-extrabold text-brand-ink tabular-nums">
                  <CountUp value={s.value} prefix="+" />
                </p>
                <p className="text-sm text-ink-soft font-bold mt-2">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
