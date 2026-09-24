"use client";

import { useEffect, useState } from "react";
import { Wallet, CheckCircle2, XCircle, AlertCircle, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

export default function StudentPaymentsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    monthlyFee: number;
    months: Record<string, { status: "paid" | "unpaid" | "exempt"; amount?: number; paidDate?: string; note?: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user?.studentId) {
      setLoading(false);
      return;
    }
    paymentsApi
      .byStudent(user.studentId)
      .then(setData)
      .catch(() => showToast("تعذّر تحميل بيانات الاشتراكات", "error"))
      .finally(() => setLoading(false));
  }, [user?.studentId]);

  if (loading) return <Loader size="lg" />;

  const statusLabel: Record<string, string> = {
    paid: "تم السداد",
    unpaid: "غير مسدد",
    exempt: "معفى من الرسوم",
  };
  const statusTone: Record<string, "green" | "red" | "gray"> = {
    paid: "green",
    unpaid: "red",
    exempt: "gray",
  };

  const monthsEntries = Object.entries(data?.months || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const paidMonthsCount = monthsEntries.filter(([, v]) => v.status === "paid").length;
  const unpaidMonthsCount = monthsEntries.filter(([, v]) => v.status === "unpaid").length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">الاشتراك الشهري والمدفوعات</h1>
        <p className="text-ink-mute text-sm mt-1">
          متابعة حالة سداد المصروفات والاشتراكات الشهرية وتواريخ السداد
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Wallet}
          label="الاشتراك الشهري المقرر"
          value={`${data?.monthlyFee ?? 200} جنيه`}
          tone="gold"
        />
        <StatCard
          icon={CheckCircle2}
          label="أشهر مسددة"
          value={`${paidMonthsCount} شهر`}
          delay={0.08}
        />
        <StatCard
          icon={XCircle}
          label="أشهر متأخرة"
          value={`${unpaidMonthsCount} شهر`}
          delay={0.16}
        />
      </div>

      <div className="card !rounded-2xl p-6 sm:p-8">
        <h3 className="font-extrabold text-lg text-ink mb-6">سجل الشهور</h3>

        {!monthsEntries.length ? (
          <p className="text-center text-ink-mute py-8">لا توجد بيانات دفع مسجلة بعد</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthsEntries.map(([monthKey, info]) => (
              <div
                key={monthKey}
                className="bg-bg-alt/70 border border-line rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm flex items-center gap-1.5 font-mono">
                    <Calendar size={14} className="text-brand-ink" /> شهر {monthKey}
                  </span>
                  <Badge tone={statusTone[info.status]}>{statusLabel[info.status]}</Badge>
                </div>

                <div className="text-xs text-ink-soft space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink-mute">المبلغ:</span>
                    <span className="font-bold text-ink">{info.amount ?? data?.monthlyFee} جنيه</span>
                  </div>
                  {info.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-ink-mute">تاريخ السداد:</span>
                      <span className="font-mono">{info.paidDate}</span>
                    </div>
                  )}
                  {info.note && (
                    <div className="text-[11px] text-ink-mute pt-1 border-t border-line">
                      ملاحظة: {info.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
