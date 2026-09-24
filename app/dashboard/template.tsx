"use client";

import { m } from "framer-motion";

// حركة دخول ناعمة لأي صفحة جوه لوحة التحكم
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0.6, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
