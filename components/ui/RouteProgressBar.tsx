"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressTrack() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // إكمال شريط التحميل وإخفاؤه بسلاسة عند اكتمال الانتقال
  useEffect(() => {
    if (!loading) return;
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 280);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // التقاط الضغطات على الروابط الداخلية لبدء شريط التحميل الملون فوراً
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      setLoading(true);
      setProgress(30);

      const t1 = setTimeout(() => setProgress((p) => (p > 0 && p < 75 ? 75 : p)), 150);
      const t2 = setTimeout(() => setProgress((p) => (p > 0 && p < 92 ? 92 : p)), 450);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] h-[3.5px] pointer-events-none overflow-hidden"
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #10b981 0%, #06b6d4 25%, #f59e0b 50%, #ec4899 75%, #10b981 100%)",
          backgroundSize: "200% 100%",
          animation: "rainbow-shimmer 1.2s linear infinite",
          boxShadow: "0 0 12px rgba(16, 185, 129, 0.7), 0 0 6px rgba(245, 158, 11, 0.6)",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressTrack />
    </Suspense>
  );
}
