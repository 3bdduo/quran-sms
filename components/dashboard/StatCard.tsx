import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "emerald" | "gold" | "red";
}

const tones = {
  emerald: "bg-emerald-50 text-emerald-600",
  gold: "bg-gold-400/15 text-gold-500",
  red: "bg-red-50 text-red-500",
};

export function StatCard({ icon: Icon, label, value, tone = "emerald" }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-900/5 p-6 flex items-center gap-4">
      <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", tones[tone])}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-emerald-950">{value}</p>
        <p className="text-xs text-emerald-900/50 font-bold mt-0.5">{label}</p>
      </div>
    </div>
  );
}
