"use client";

import { motion } from "framer-motion";

// الـ template بيتعمله remount مع كل تنقّل، فبنستغله لحركة دخول ناعمة لأي صفحة
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0.35, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
