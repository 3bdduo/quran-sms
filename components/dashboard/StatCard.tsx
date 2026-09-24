"use client";

import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "emerald" | "gold" | "red";
  delay?: number;
}

const tones = {
  emerald: "bg-brand-soft text-brand-ink",
  gold: "bg-gold-soft text-gold-ink",
  red: "bg-danger-soft text-danger-ink",
};

/** لو القيمة رقم (أو رقم + وحدة زي "85%" أو "1200 جنيه") بيعدّ من الصفر. */
function AnimatedValue({ value }: { value: string | number }) {
  const m = String(value).match(/^(\d+)(\D*)$/);
  if (!m) return <>{value}</>;
  return <CountUp value={Number(m[1])} suffix={m[2]} duration={1.4} />;
}

export function StatCard({ icon: Icon, label, value, tone = "emerald", delay = 0 }: Props) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="group card-interactive h-full p-5 sm:p-6 flex items-center gap-4 !rounded-2xl">
        <div
          className={clsx(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shrink-0 sh-soft transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]",
            tones[tone],
          )}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-extrabold text-ink truncate">
            <AnimatedValue value={value} />
          </p>
          <p className="text-xs text-ink-mute font-bold mt-0.5">{label}</p>
        </div>
      </div>
    </Reveal>
  );
}
