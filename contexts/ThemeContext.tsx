"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  /** origin = مكان الزر على الشاشة، عشان الدايرة تكبر منه لما المود يتبدّل */
  toggleTheme: (origin?: { x: number; y: number }) => void;
}

const STORAGE_KEY = "qs-theme";
const META_COLORS: Record<Theme, string> = { light: "#ecf0de", dark: "#0d0b09" };

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", META_COLORS[theme]);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // الـ class اتضبط أصلًا قبل الرسمة الأولى (سكريبت في الـ head) — هنا بس بنزامن الـ state
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  // لو المستخدم لسه ماختارش بإيده، نتابع تغيير مود الجهاز نفسه
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const next: Theme = e.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* التخزين ممنوع (وضع خصوصية) — عادي */
      }

      const doc = document as ViewTransitionDocument;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // المتصفحات الحديثة: دايرة بتكبر من الزر
      if (doc.startViewTransition && !reduce) {
        const x = origin?.x ?? window.innerWidth / 2;
        const y = origin?.y ?? 0;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

        const transition = doc.startViewTransition(() => applyTheme(next));
        transition.ready
          .then(() => {
            document.documentElement.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
              { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
            );
          })
          .catch(() => undefined);
      } else {
        // بديل: تدرّج ناعم للألوان
        const root = document.documentElement;
        root.classList.add("theme-anim");
        applyTheme(next);
        window.setTimeout(() => root.classList.remove("theme-anim"), 500);
      }

      setTheme(next);
    },
    [theme],
  );

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
