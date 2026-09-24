"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

/**
 * Reveal / Stagger بـ CSS فقط — بدون Framer Motion على الموبايل.
 * بيستخدم IntersectionObserver + CSS animation عشان:
 *  • صفر JS overhead على الـ scroll
 *  • GPU-only animation (opacity + transform = composite layers)
 *  • يشتغل حتى على أضعف الأجهزة
 */

interface RevealProps {
  children: ReactNode;
  delay?: number;
  from?: "up" | "down" | "start" | "end" | "scale" | "none";
  distance?: number;
  duration?: number;
  className?: string;
  [key: string]: unknown;
}

const fromMap = {
  up: "translate3d(0, 28px, 0)",
  down: "translate3d(0, -28px, 0)",
  start: "translate3d(28px, 0, 0)",
  end: "translate3d(-28px, 0, 0)",
  scale: "scale(0.93)",
  none: "none",
};

export function Reveal({
  children,
  delay = 0,
  from = "up",
  distance: _distance = 28,
  duration = 0.55,
  className,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transform = fromMap[from] ?? fromMap.up;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transform,
        transition: visible
          ? `opacity ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s`
          : "none",
        willChange: visible ? "auto" : "opacity, transform",
      }}
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}

/** Stagger — بدون Framer Motion، بيضيف delay على كل ولد تلقائياً */
export function Stagger({
  children,
  stagger = 0.07,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-stagger-visible={visible ? "1" : "0"}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`qs-stagger-item ${className ?? ""}`}>
      {children}
    </div>
  );
}
