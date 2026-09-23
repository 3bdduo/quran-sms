import { ReactNode } from "react";
import clsx from "clsx";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mx-auto max-w-7xl px-5 sm:px-8", className)}>{children}</div>;
}
