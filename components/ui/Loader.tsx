import Image from "next/image";
import clsx from "clsx";

const sizes = {
  sm: { box: "h-14 w-14", inner: "inset-[13%]" },
  md: { box: "h-24 w-24", inner: "inset-[13%]" },
  lg: { box: "h-32 w-32", inner: "inset-[13%]" },
} as const;

interface LoaderProps {
  className?: string;
  size?: keyof typeof sizes;
  label?: string;
  /** false = اللوجو والحلقة بس من غير كلمة "جاري التحميل" */
  showLabel?: boolean;
}

/** لودر احترافي ملوّن: حلقة بألوان الطيف الإسلامية + هالة متوهجة + شريط تقدم حيوي يوحي بقرب الانتهاء. */
export function Loader({ className, size = "md", label = "جاري التحميل", showLabel = true }: LoaderProps) {
  const s = sizes[size];
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx("qs-delay flex flex-col items-center justify-center gap-4 py-8", className)}
    >
      <div className={clsx("relative", s.box)}>
        <span aria-hidden="true" className="loader-glow" />
        <span aria-hidden="true" className="loader-dash" />
        <span aria-hidden="true" className="loader-ring" />
        <span
          className={clsx(
            "absolute grid place-items-center overflow-hidden rounded-full bg-[#f7f9ef] sh-lift",
            s.inner,
          )}
        >
          <Image
            src="/logo-mark.png"
            alt=""
            width={120}
            height={120}
            priority
            className="h-[80%] w-[80%] object-contain animate-breathe"
          />
        </span>
      </div>

      {showLabel ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
            {label}
            <span aria-hidden="true" className="flex gap-1 items-center">
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-blink [animation-delay:0s]" />
              <i className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-blink [animation-delay:0.2s]" />
              <i className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-blink [animation-delay:0.4s]" />
            </span>
          </p>

          {/* شريط تقدم ملون نابض بالحياة يعطي شعوراً بقرب انتهاء التحميل */}
          <div className="w-36 sm:w-44 h-1.5 rounded-full bg-line/60 overflow-hidden relative shadow-inner border border-line-strong/30">
            <div className="loader-progress-bar" />
          </div>

          <span className="text-[11px] font-semibold text-brand-ink/90 animate-pulse">
            لحظات وتكتمل...
          </span>
        </div>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

/** سبينر ملوّن ومتدرج جوه الأزرار وأماكن التحميل السريعة. */
export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      role="status"
      aria-label="جاري التحميل"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={clsx("animate-spin shrink-0", className)}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
        stroke="url(#qs-spinner-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="qs-spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** شاشة تحميل كاملة مفعمة بالألوان والتأثيرات الحيوية (تظهر أثناء الانتقال والتحميل العام). */
export function PageLoader() {
  return (
    <div className="qs-delay fixed inset-0 z-[300] flex flex-col items-center justify-center bg-bg overflow-hidden">
      {/* نمط الخلفية */}
      <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.06] [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />

      {/* هالة ضوئية ملونة دافئة في الخلفية */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(245,158,11,0.14) 40%, rgba(6,182,212,0.1) 70%, transparent 85%)",
          animation: "qs-pulse-soft 2.5s ease-in-out infinite",
        }}
      />

      <Loader size="lg" />

      {/* شريط تقدم علوي ملون يمتد على كامل العرض */}
      <div
        aria-hidden="true"
        className="fixed top-0 inset-x-0 h-1 z-[310] overflow-hidden bg-line/40"
      >
        <div className="loader-progress-bar" />
      </div>

      {/* شريط تقدم سفلي ملون */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 inset-x-0 h-1 z-[310] overflow-hidden bg-line/40"
      >
        <div className="loader-progress-bar" />
      </div>
    </div>
  );
}

/** هيكل عظمي (Skeleton) مع لمعان ملون خفيف. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("card p-6 space-y-4", className)} aria-hidden="true">
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
    </div>
  );
}
