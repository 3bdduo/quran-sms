"use client";

import { useTheme } from "@/contexts/ThemeContext";

/**
 * زر تبديل المود — سماء بتتغير:
 *  • لايت: سما دافية مخضرّة + سحابتين + شمس ذهبية بتلمع
 *  • دارك: ليل بني غامق + نجوم بتلمع + قمر بفوهات
 * الشكل كله بيتحكم فيه الـ class "dark" على <html> (CSS بس) — يعني مفيش وميض ولا حركة غلط
 * عند فتح الصفحة، والاتجاه ثابت LTR جوه الزر عشان الكرة تتحرك صح في الـ RTL.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      dir="ltr"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="تبديل الوضع الفاتح / الداكن"
      title="تبديل الوضع الفاتح / الداكن"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className={`group relative h-9 w-[68px] sm:h-10 sm:w-[76px] shrink-0 overflow-hidden rounded-full
        ring-1 ring-black/10 dark:ring-white/10
        shadow-[0_6px_18px_-4px_rgba(23,40,28,0.35),inset_0_2px_4px_rgba(23,40,28,0.25)]
        dark:shadow-[0_8px_22px_-4px_rgba(0,0,0,0.85),inset_0_2px_5px_rgba(0,0,0,0.7)]
        transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
    >
      {/* سما النهار */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-br from-[#f3efc4] via-[#cfe0ad] to-[#8fb77f] opacity-100 dark:opacity-0 transition-opacity duration-700"
      >
        <span className="absolute left-[46%] top-[58%] h-3 w-7 rounded-full bg-white/80 blur-[1px]" />
        <span className="absolute left-[58%] top-[30%] h-2.5 w-5 rounded-full bg-white/70 blur-[1px]" />
        <span className="absolute left-[38%] top-[28%] h-2 w-3.5 rounded-full bg-white/60 blur-[1px]" />
      </span>

      {/* سما الليل */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-br from-[#2b2119] via-[#17110d] to-[#0a0806] opacity-0 dark:opacity-100 transition-opacity duration-700"
      >
        <i className="absolute left-[12%] top-[26%] h-[3px] w-[3px] rounded-full bg-[#f5e6c8] animate-twinkle" />
        <i className="absolute left-[24%] top-[62%] h-[2px] w-[2px] rounded-full bg-white animate-twinkle [animation-delay:0.6s]" />
        <i className="absolute left-[34%] top-[22%] h-[2px] w-[2px] rounded-full bg-white animate-twinkle [animation-delay:1.2s]" />
        <i className="absolute left-[18%] top-[44%] h-[2px] w-[2px] rounded-full bg-[#f5e6c8] animate-twinkle [animation-delay:1.8s]" />
        <i className="absolute left-[40%] top-[70%] h-[3px] w-[3px] rounded-full bg-white animate-twinkle [animation-delay:2.4s]" />
      </span>

      {/* الكرة: شمس ↔ قمر */}
      <span
        aria-hidden="true"
        className="absolute left-1 top-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full
          translate-x-0 dark:translate-x-[32px] sm:dark:translate-x-[36px]
          transition-transform duration-[650ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      >
        {/* الشمس */}
        <span
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3b8,#f5c344_55%,#d99a1c)]
            shadow-[0_0_0_4px_rgba(245,195,68,0.28),0_0_16px_4px_rgba(245,195,68,0.65)]
            opacity-100 rotate-0 scale-100 dark:opacity-0 dark:rotate-90 dark:scale-50
            transition-all duration-500"
        />
        {/* القمر */}
        <span
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fffaf0,#e8dcc6_60%,#bfae92)]
            shadow-[0_0_12px_2px_rgba(240,225,195,0.35),inset_-3px_-3px_6px_rgba(120,100,70,0.35)]
            opacity-0 -rotate-90 scale-50 dark:opacity-100 dark:rotate-0 dark:scale-100
            transition-all duration-500"
        >
          <i className="absolute left-[22%] top-[30%] h-[6px] w-[6px] rounded-full bg-[#b8a688]/60" />
          <i className="absolute left-[52%] top-[52%] h-[8px] w-[8px] rounded-full bg-[#b8a688]/55" />
          <i className="absolute left-[38%] top-[68%] h-[4px] w-[4px] rounded-full bg-[#b8a688]/60" />
        </span>
      </span>
    </button>
  );
}
