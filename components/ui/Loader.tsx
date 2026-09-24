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

/** لودر احترافي: حلقة متدرّجة بتلف حوالين شعار المدرسة + توهج نابض. */
export function Loader({ className, size = "md", label = "جاري التحميل", showLabel = true }: LoaderProps) {
  const s = sizes[size];
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx("flex flex-col items-center justify-center gap-6 py-16", className)}
    >
      <div className={clsx("relative", s.box)}>
        <span aria-hidden="true" className="absolute -inset-4 rounded-full bg-glow-1 blur-2xl animate-pulse-soft" />
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
        <p className="flex items-center gap-1 text-sm font-bold text-ink-mute">
          {label}
          <span aria-hidden="true" className="flex gap-0.5">
            <i className="h-1 w-1 rounded-full bg-current animate-blink [animation-delay:0s]" />
            <i className="h-1 w-1 rounded-full bg-current animate-blink [animation-delay:0.2s]" />
            <i className="h-1 w-1 rounded-full bg-current animate-blink [animation-delay:0.4s]" />
          </span>
        </p>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

/** سبينر صغير جوه الأزرار وأماكن التحميل السريعة — بياخد لون النص الحالي. */
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
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** شاشة تحميل كاملة (بتظهر أثناء الانتقال بين الأقسام الكبيرة). */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[300] grid place-items-center bg-bg">
      <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.06] [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
      <Loader size="lg" />
    </div>
  );
}

/** هيكل عظمي (Skeleton) لأي كارت لسه بيتحمّل. */
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
