"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { X, BookOpen } from "lucide-react";

interface LogoModalProps {
  open: boolean;
  onClose: () => void;
}

export function LogoModal({ open, onClose }: LogoModalProps) {
  // إغلاق بـ Escape + منع سكرول الصفحة اللي ورا المودال
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.38 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="معلومات المدرسة"
        >
          {/* الخلفية */}
          <div className="absolute inset-0 bg-black/75" />

          {/* الكارت */}
          <m.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="relative z-10 w-full max-w-sm max-h-[92dvh] overflow-y-auto rounded-[2rem] bg-surface border border-line sh-float"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3.5 left-3.5 z-20 h-10 w-10 grid place-items-center rounded-full bg-bg-alt/90 text-ink-soft hover:bg-brand hover:text-on-brand hover:rotate-90 transition-all duration-200"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>

            {/* منطقة اللوجو */}
            <div className="relative overflow-hidden rounded-t-[2rem] bg-bg-alt px-6 pt-10 pb-8 grid place-items-center border-b border-line">
              <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.12]" />
              <div aria-hidden="true" className="absolute h-64 w-64 rounded-full orb-2" />
              <div aria-hidden="true" className="absolute h-56 w-56 rounded-full border border-dashed border-gold/50 animate-spin-slow" />
              {/* اللوجو الكامل على بلاطة بيضا عشان الكتابة الغامقة تفضل مقروءة في الدارك */}
              <m.div
                initial={{ rotate: -6, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.12 }}
                className="relative h-44 w-44 rounded-[1.75rem] bg-white overflow-hidden ring-2 ring-gold/60 sh-lift"
              >
                <Image src="/logo-full.png" alt="شعار مدرسة التربية بالقرآن الكريم" fill sizes="176px" className="object-contain p-2" priority />
              </m.div>
            </div>

            {/* المعلومات */}
            <div className="p-7 text-center" dir="rtl">
              <h2 className="font-ruqaa text-3xl font-bold text-ink leading-[1.6] mb-1">مدرسة التربية بالقرآن الكريم</h2>
              <p className="text-gold-ink text-sm font-bold mb-4">منصة تعليمية إسلامية متكاملة</p>
              <p className="text-ink-soft text-sm leading-relaxed mb-7">
                منهج شامل لتحفيظ القرآن الكريم والتفسير والتجويد والعلوم الشرعية، بمتابعة مستمرة من معلمين مؤهلين.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 min-h-12 rounded-2xl border-2 border-line-strong text-ink-soft text-sm font-bold hover:border-brand hover:text-brand-ink hover:bg-brand-soft transition-all duration-200 active:scale-[0.97]"
                >
                  إغلاق
                </button>
                <Link
                  href="/"
                  onClick={onClose}
                  className="btn-shine flex-1 min-h-12 flex items-center justify-center gap-2 rounded-2xl bg-brand text-on-brand text-sm font-bold hover:bg-brand-strong sh-brand transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  <BookOpen size={16} />
                  الصفحة الرئيسية
                </Link>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
