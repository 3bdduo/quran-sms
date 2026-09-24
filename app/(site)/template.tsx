"use client";

import { m } from "framer-motion";

// الـ template بيتعمله remount مع كل تنقّل، فبنستغله لحركة دخول ناعمة لأي صفحة
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
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
