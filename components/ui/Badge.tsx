import clsx from "clsx";
import { ReactNode } from "react";

const tones = {
  green: "bg-emerald-100 text-emerald-700",
  gold: "bg-gold-400/20 text-gold-500",
  red: "bg-red-100 text-red-600",
  gray: "bg-cream-200 text-emerald-900/60",
};

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={clsx("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold", tones[tone])}>
      {children}
    </span>
  );
}
