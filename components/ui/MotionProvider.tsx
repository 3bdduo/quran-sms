"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// بيحترم إعداد "تقليل الحركة" في الجهاز تلقائيًا لكل حركات framer-motion
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
