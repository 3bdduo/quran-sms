"use client";

import { useEffect, useState } from "react";
import { Banknote, Calendar, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { salariesApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { StatCard } from "@/components/dashboard/StatCard";

export default function TeacherSalaryPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<{ username: string; base_salary: number; notes?: string } | null>(
    null
  );
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    if (!user?.username) return;
    Promise.all([salariesApi.me(), salariesApi.history(user.username)])
      .then(([cfg, hist]) => {
        setConfig(cfg);
        setHistory(hist);
      })
      .catch(() => showToast("تعذّر تحميل بيانات الراتب", "error"))
      .finally(() => setLoading(false));
  }, [user?.username]);

  if (loading) return <Loader size="lg" />;

  const paidRecords = history.filter((r) => r.status === "paid");
  const totalReceived = paidRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">راتبي ومستحقاتي</h1>
        <p className="text-ink-mute text-sm mt-1">
          متابعة الراتب الشهري المعتمد وسجل الصرف والتحويلات المالية
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Banknote}
          label="الراتب الشهري الأساسي"
          value={`${config?.base_salary ?? 0} جنيه`}
          tone="gold"
        />
        <StatCard
          icon={CheckCircle2}
          label="أشهر تم صرفها"
          value={paidRecords.length}
          delay={0.08}
        />
        <StatCard
          icon={CreditCard}
          label="إجمالي المبالغ المصروفة"
          value={`${totalReceived} جنيه`}
          delay={0.16}
        />
      </div>

      {config?.notes && (
        <div className="card !rounded-2xl p-4 bg-brand-soft/30 border border-brand/20 text-xs">
          <span className="font-bold text-brand-ink">ملاحظات الإدارة: </span>
          <span className="text-ink-soft">{config.notes}</span>
        </div>
      )}

      {/* جدول السجلات */}
      <div className="card !rounded-2xl overflow-hidden shadow-sm">
        <h3 className="font-extrabold text-lg text-ink p-6 pb-2">سجل صرف الرواتب</h3>
        {!history.length ? (
          <p className="text-center text-ink-mute p-10">لا توجد سجلات صرف مسجلة بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">الشهر</th>
                  <th className="p-4 font-bold">المبلغ المصروف</th>
                  <th className="p-4 font-bold">تاريخ الصرف</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-ink whitespace-nowrap">شهر {r.month_key}</td>
                    <td className="p-4 font-bold text-brand-ink whitespace-nowrap">
                      {r.amount} جنيه
                    </td>
                    <td className="p-4 text-xs font-mono text-ink-mute whitespace-nowrap">
                      {r.paid_date || "غير محدد"}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          r.status === "paid"
                            ? "bg-brand-soft text-brand-ink"
                            : "bg-gold-soft text-gold-ink"
                        }`}
                      >
                        {r.status === "paid" ? "تم الصرف" : "سلفة"}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-ink-soft">{r.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
