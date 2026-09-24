"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// تحميل مزايا الحركة بعد أول رسمة للصفحة (يقلل حجم الـ JS الأولي)
const loadFeatures = () => import("./motionFeatures").then((mod) => mod.default);

// بيحترم إعداد "تقليل الحركة" في الجهاز تلقائيًا
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
