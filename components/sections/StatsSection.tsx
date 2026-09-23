"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const stats = [
  { value: "+500", label: "طالب وطالبة" },
  { value: "+30", label: "معلم ومعلمة" },
  { value: "+120", label: "حافظ وحافظة" },
  { value: "+8", label: "سنوات خبرة" },
];

export function StatsSection() {
  return (
    <section className="py-16">
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-white rounded-3xl border border-emerald-900/5 shadow-sm p-8 sm:p-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">{s.value}</p>
              <p className="text-sm text-emerald-900/60 font-bold mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
