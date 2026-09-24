import Image from "next/image";
import clsx from "clsx";

const sizes = {
  sm: { badge: "h-10 w-10", title: "text-base", sub: "text-[11px]" },
  md: { badge: "h-12 w-12 sm:h-[3.25rem] sm:w-[3.25rem]", title: "text-lg sm:text-xl", sub: "text-[11px] sm:text-xs" },
  lg: { badge: "h-20 w-20", title: "text-2xl", sub: "text-sm" },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  showText?: boolean;
  /** "onDeep" = لما اللوجو يبقى فوق خلفية غامقة (الفوتر / الشريط الجانبي) */
  tone?: "default" | "onDeep";
  className?: string;
}

/**
 * اللوجو الموحّد: الشعار جوه بادج فاتح دايمًا (عشان الحروف الغامقة تفضل ظاهرة في الدارك مود)
 * بإطار ذهبي وظل عالي، جنبه اسم المدرسة بخط الرقعة.
 */
export function Logo({ size = "md", showText = true, tone = "default", className }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={clsx("inline-flex items-center gap-3 text-start", className)}>
      <span
        className={clsx(
          "relative shrink-0 rounded-full bg-[#f7f9ef] sh-lift ring-2 ring-gold/70 ring-offset-2",
          tone === "onDeep" ? "ring-offset-deep" : "ring-offset-bg",
          "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-[-4deg]",
          s.badge,
        )}
      >
        <Image
          src="/logo-mark.png"
          alt="شعار مدرسة التربية بالقرآن الكريم"
          fill
          sizes="80px"
          className="object-contain p-[12%]"
          priority
        />
      </span>

      {showText && (
        <span className="leading-tight">
          <span
            className={clsx(
              "block font-ruqaa font-bold leading-[1.5]",
              s.title,
              tone === "onDeep" ? "text-on-deep" : "text-ink",
            )}
          >
            مدرسة التربية
          </span>
          <span
            className={clsx(
              "block font-bold",
              s.sub,
              tone === "onDeep" ? "text-gold" : "text-brand-ink",
            )}
          >
            بالقرآن الكريم
          </span>
        </span>
      )}
    </span>
  );
}
