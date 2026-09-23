interface Props {
  value: number; // 0-100
  label?: string;
  colorClass?: string;
}

export function ProgressBar({ value, label, colorClass = "bg-emerald-500" }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1.5 text-emerald-900">
          <span className="font-semibold">{label}</span>
          <span className="font-bold">{clamped}%</span>
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-emerald-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
