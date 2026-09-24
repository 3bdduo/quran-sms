import clsx from "clsx";
import { ReactNode } from "react";

const tones = {
  green: "bg-brand-soft text-brand-ink",
  gold: "bg-gold-soft text-gold-ink",
  red: "bg-danger-soft text-danger-ink",
  gray: "bg-bg-alt text-ink-soft",
};

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={clsx("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold", tones[tone])}>
      {children}
    </span>
  );
}
