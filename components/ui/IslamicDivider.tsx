/** فاصل زخرفي: خطين ذهبيين ونجمة ثمانية بتلف ببطء. */
export function IslamicDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-3" aria-hidden="true">
      <span className="h-px w-16 sm:w-24 bg-linear-to-l from-transparent to-gold" />
      <svg width="22" height="22" viewBox="0 0 24 24" className="text-gold animate-spin-slow">
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" />
          <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
        </g>
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
      <span className="h-px w-16 sm:w-24 bg-linear-to-r from-transparent to-gold" />
    </div>
  );
}
