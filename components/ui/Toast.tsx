"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextValue {
  showToast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2 items-center pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <m.div
              key={t.id}
              layout
              role="status"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 171, damping: 22 }}
              className={`relative overflow-hidden pointer-events-auto flex items-center gap-2.5 px-5 py-3.5 rounded-2xl sh-float text-sm font-bold max-w-md w-full sm:w-auto ${
                t.type === "success" ? "bg-brand text-on-brand" : "bg-danger-solid text-white"
              }`}
            >
              {t.type === "success" ? <CheckCircle2 size={20} className="shrink-0" /> : <XCircle size={20} className="shrink-0" />}
              <span className="leading-snug">{t.message}</span>
              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-[3px] w-full origin-right bg-current opacity-40"
                style={{ animation: `toast-bar ${DURATION}ms linear forwards` }}
              />
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast لازم يتستخدم جوه ToastProvider");
  return ctx;
}
