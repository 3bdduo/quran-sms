"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** شريط رفيع أعلى الصفحة بيبيّن مكان القارئ من الصفحة. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "100% 50%" }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-linear-to-l from-gold via-brand to-brand-strong"
    />
  );
}
