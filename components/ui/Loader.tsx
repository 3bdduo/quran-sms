import clsx from "clsx";

export function Loader({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center justify-center py-16", className)}>
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    </div>
  );
}
