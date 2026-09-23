export function IslamicDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2" aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
      <svg width="20" height="20" viewBox="0 0 20 20" className="text-gold-500">
        <path
          fill="currentColor"
          d="M10 0l2.35 6.18L18.5 6.5l-4.9 4.02L15.5 17 10 13.3 4.5 17l1.9-6.48L1.5 6.5l6.15-.32L10 0z"
        />
      </svg>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
    </div>
  );
}
