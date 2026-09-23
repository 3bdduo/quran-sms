import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface BaseProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  primary: "bg-emerald-600 text-cream-50 hover:bg-emerald-700 shadow-md shadow-emerald-900/10",
  secondary: "bg-gold-400 text-emerald-950 hover:bg-gold-500 shadow-md shadow-gold-900/10",
  outline: "border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50",
  ghost: "text-emerald-700 hover:bg-emerald-50",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const base = "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0";

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={clsx(base, variantStyles[variant], sizeStyles[size], className)} {...props}>
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
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={clsx(base, variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </Link>
  );
}
