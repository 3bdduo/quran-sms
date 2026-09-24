"use client";

import { m, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  /** الاتجاه اللي العنصر بيدخل منه */
  from?: "up" | "down" | "start" | "end" | "scale" | "none";
  distance?: number;
  duration?: number;
}

/** ظهور ناعم لأي عنصر لما يدخل الشاشة (مرة واحدة). */
export function Reveal({
  children,
  delay = 0,
  from = "up",
  distance = 28,
  duration = 0.75,
  className,
  ...rest
}: RevealProps) {
  const initial =
    from === "up"
      ? { opacity: 0, y: distance }
      : from === "down"
        ? { opacity: 0, y: -distance }
        : from === "start"
          ? { opacity: 0, x: distance }
          : from === "end"
            ? { opacity: 0, x: -distance }
            : from === "scale"
              ? { opacity: 0, scale: 0.92 }
              : { opacity: 0 };

  return (
    <m.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </m.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: (stagger: number) => ({ transition: { staggerChildren: stagger, delayChildren: 0.05 } }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.05, ease: EASE } },
};

/** حاوية بتظهّر أولادها ورا بعض (Stagger) — استخدمها مع StaggerItem. */
export function Stagger({
  children,
  stagger = 0.09,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  className?: string;
}) {
  return (
    <m.div
      variants={containerVariants}
      custom={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div variants={itemVariants} className={className}>
      {children}
    </m.div>
  );
}
