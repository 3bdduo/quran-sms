"use client";

import { useEffect, useRef } from "react";

/**
 * شريط تقدم القراءة — CSS فقط، بدون Framer Motion.
 * بيستخدم animation-timeline: scroll() في المتصفحات الحديثة،
 * وـ requestAnimationFrame fallback للباقي — أخف بكتير من useSpring.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // المتصفحات الحديثة: CSS scroll-driven animations — صفر JS
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timeline", "scroll()")) return;

    // Fallback: rAF خفيف عند السكرول فقط (بدون حلقة مستمرة)
    let ticking = false;
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const pct = scrollHeight <= clientHeight ? 0 : scrollTop / (scrollHeight - clientHeight);
      el.style.transform = `scaleX(${pct})`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="scroll-progress-bar fixed inset-x-0 top-0 z-[60] h-[3px] bg-linear-to-l from-gold via-brand to-brand-strong"
      style={{ transformOrigin: "0% 50%", transform: "scaleX(0)" }}
    />
  );
}
