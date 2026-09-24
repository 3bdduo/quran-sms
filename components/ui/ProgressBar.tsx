"use client";

import { motion } from "framer-motion";

interface Props {
  value: number; // 0-100
  label?: string;
  colorClass?: string;
}

export function ProgressBar({ value, label, colorClass = "bg-linear-to-l from-brand-strong to-brand" }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-2 text-ink-soft">
          <span className="font-semibold">{label}</span>
          <span className="font-bold text-ink">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="h-3 w-full rounded-full bg-brand-soft overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)]"
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${clamped}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${colorClass} shadow-[0_0_14px_var(--glow-1)]`}
        />
      </div>
    </div>
  );
}
