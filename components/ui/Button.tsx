import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Spinner } from "@/components/ui/Loader";

interface BaseProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  primary: "bg-brand text-on-brand hover:bg-brand-strong sh-brand",
  secondary: "bg-gold text-on-gold hover:brightness-105 sh-gold",
  outline: "border-2 border-brand text-brand-ink hover:bg-brand-soft sh-soft",
  ghost: "text-brand-ink hover:bg-brand-soft",
};

// min-h = 44px على الأقل عشان الضغط بالإصبع يبقى مريح في الموبايل والتابلت
const sizeStyles = {
  sm: "min-h-11 px-5 py-2 text-sm",
  md: "min-h-12 px-7 py-3 text-base",
  lg: "min-h-14 px-9 py-4 text-base sm:text-lg",
};

const base =
  "btn-shine inline-flex items-center justify-center gap-2 rounded-full font-bold select-none " +
  "transition-[translate,scale,box-shadow,background-color,color,border-color,filter] duration-300 ease-out " +
  "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] " +
  "disabled:opacity-60 disabled:pointer-events-none disabled:translate-y-0";

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  loading = false,
  disabled,
  ...props
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      className={clsx(base, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size={18} />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  children,
  className,
  onClick,
}: BaseProps & { href: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(base, variantStyles[variant], sizeStyles[size], className)}
    >
      {children}
    </Link>
  );
}
