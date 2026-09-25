"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
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
        setHistory(hist || []);
      })
      .catch(() => showToast("تعذّر تحميل بيانات الراتب", "error"))
      .finally(() => setLoading(false));
  }, [user?.username]);

  if (loading) return <Loader size="lg" />;

  const paidRecords = history.filter((r) => r.status === "paid");
  const totalReceived = paidRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalIncentives = history.reduce((sum, r) => sum + (Number(r.incentive_amount) || 0), 0);
  const totalDeductions = history.reduce((sum, r) => sum + (Number(r.deduction_amount) || 0), 0);

  // أحدث سجل راتب
  const latestRecord = history[0] || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink flex items-center gap-2">
          <Banknote className="w-8 h-8 text-brand" />
          راتبي ومستحقاتي المالية
        </h1>
        <p className="text-ink-mute text-sm mt-1">
          متابعة الراتب الشهري، تفاصيل الحوافز والمكافآت، الخصومات وأسبابها، وسجل الاستحقاق والصرف
        </p>
      </div>

      {/* بطاقات المؤشرات الأساسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Banknote}
          label="الراتب الشهري الأساسي"
          value={`${(config?.base_salary ?? 0).toLocaleString()} ج.م`}
          tone="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="إجمالي الحوافز الممنوحة"
          value={`+${totalIncentives.toLocaleString()} ج.م`}
          tone="emerald"
          delay={0.06}
        />
        <StatCard
          icon={TrendingDown}
          label="إجمالي الخصومات"
          value={`-${totalDeductions.toLocaleString()} ج.م`}
          tone="red"
          delay={0.12}
        />
        <StatCard
          icon={CreditCard}
          label="إجمالي المبالغ المصروفة"
          value={`${totalReceived.toLocaleString()} ج.م`}
          tone="gold"
          delay={0.18}
        />
      </div>

      {/* ملاحظات الإدارة العامة إن وجدت */}
      {config?.notes && (
        <div className="card !rounded-2xl p-4 bg-brand-soft/30 border border-brand/20 text-xs flex items-center gap-2">
          <span className="font-bold text-brand-ink">ملاحظات الإدارة: </span>
          <span className="text-ink-soft">{config.notes}</span>
        </div>
      )}

      {/* بطاقة مميزة: تفاصيل أحدث مسير راتب */}
      {latestRecord && (
        <div className="card !rounded-3xl p-5 sm:p-6 border-2 border-brand/20 bg-gradient-to-br from-brand-soft/20 via-bg to-bg shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-soft flex items-center justify-center text-brand-ink">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-ink text-base sm:text-lg">
                  كشف استحقاق شهر ({latestRecord.month_key})
                </h3>
                <p className="text-xs text-ink-mute">
                  تفصيل الراتب الصافي مع بيان أسباب الحوافز والخصومات
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                latestRecord.status === "paid"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : latestRecord.status === "advance"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {latestRecord.status === "paid" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم الصرف بتاريخ: {latestRecord.paid_date || "معتمد"}
                </>
              ) : latestRecord.status === "advance" ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  سلفة
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  بانتظار الصرف
                </>
              )}
            </span>
          </div>

          {/* تفاصيل الحساب لأحدث شهر */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
            {/* الأساسي */}
            <div className="p-3.5 rounded-2xl bg-bg-alt/50 border border-line">
              <span className="text-xs text-ink-mute font-bold block mb-1">الراتب الأساسي</span>
              <span className="text-lg font-black text-ink">
                {(latestRecord.base_salary ?? 0).toLocaleString()} ج.م
              </span>
            </div>

            {/* الحافز والسبب */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                الحوافز والمكافآت
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                +{(latestRecord.incentive_amount ?? 0).toLocaleString()} ج.م
              </span>
              {latestRecord.incentive_reason ? (
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 font-semibold">
                  السبب: {latestRecord.incentive_reason}
                </p>
              ) : (
                <p className="text-[11px] text-ink-mute mt-1">لا توجد حوافز إضافية</p>
              )}
            </div>

            {/* الخصم والسبب */}
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-xs text-rose-700 dark:text-rose-400 font-bold block mb-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                الخصومات والاستقطاعات
              </span>
              <span className="text-lg font-black text-rose-700 dark:text-rose-400">
                -{(latestRecord.deduction_amount ?? 0).toLocaleString()} ج.م
              </span>
              {latestRecord.deduction_reason ? (
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 font-semibold">
                  السبب: {latestRecord.deduction_reason}
                </p>
              ) : (
                <p className="text-[11px] text-ink-mute mt-1">لا توجد استقطاعات</p>
              )}
            </div>

            {/* الراتب الصافي الكلي */}
            <div className="p-3.5 rounded-2xl bg-brand-soft/70 border border-brand/30">
              <span className="text-xs text-brand-ink font-bold block mb-1">الراتب الكلي المستحق</span>
              <span className="text-xl font-black text-brand-ink">
                {(latestRecord.net_salary ?? latestRecord.amount ?? 0).toLocaleString()} ج.م
              </span>
              <p className="text-[11px] text-ink-mute mt-1">
                الأساسي + الحوافز - الخصومات
              </p>
            </div>
          </div>

          {latestRecord.note && (
            <div className="text-xs bg-bg p-3 rounded-xl border border-line text-ink-soft">
              <span className="font-bold text-ink">ملاحظات الإدارة للشهر: </span>
              {latestRecord.note}
            </div>
          )}
        </div>
      )}

      {/* جدول السجل التاريخي لجميع الشهور */}
      <div className="card !rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-ink">سجل صرف الرواتب لجميع الشهور</h3>
          <span className="text-xs text-ink-mute font-bold">
            إجمالي السجلات: {history.length}
          </span>
        </div>

        {!history.length ? (
          <div className="p-12 text-center text-ink-mute">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-ink-soft opacity-60" />
            <p className="font-bold">لا توجد سجلات صرف مسجلة بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-xs font-bold text-ink-mute">
                  <th className="p-4 whitespace-nowrap">الشهر</th>
                  <th className="p-4 whitespace-nowrap">الراتب الأساسي</th>
                  <th className="p-4 whitespace-nowrap">الحوافز والسبب</th>
                  <th className="p-4 whitespace-nowrap">الخصومات والسبب</th>
                  <th className="p-4 whitespace-nowrap">الراتب الكلي</th>
                  <th className="p-4 whitespace-nowrap">المبلغ المصروف</th>
                  <th className="p-4 whitespace-nowrap">الحالة</th>
                  <th className="p-4 whitespace-nowrap">تاريخ الصرف</th>
                  <th className="p-4 whitespace-nowrap">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {history.map((r, i) => (
                  <tr
                    key={i}
                    className="hover:bg-bg-alt/30 transition-colors"
                  >
                    {/* الشهر */}
                    <td className="p-4 font-bold text-ink whitespace-nowrap font-mono">
                      شهر {r.month_key}
                    </td>

                    {/* الأساسي */}
                    <td className="p-4 font-bold text-ink whitespace-nowrap">
                      {(r.base_salary ?? 0).toLocaleString()} ج.م
                    </td>

                    {/* الحوافز + السبب */}
                    <td className="p-4">
                      {r.incentive_amount ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-600 text-xs inline-flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{(r.incentive_amount).toLocaleString()} ج.م
                          </span>
                          {r.incentive_reason && (
                            <p className="text-[11px] text-ink-mute line-clamp-1" title={r.incentive_reason}>
                              {r.incentive_reason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-soft font-mono">-</span>
                      )}
                    </td>

                    {/* الخصومات + السبب */}
                    <td className="p-4">
                      {r.deduction_amount ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-rose-600 text-xs inline-flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            -{(r.deduction_amount).toLocaleString()} ج.م
                          </span>
                          {r.deduction_reason && (
                            <p className="text-[11px] text-ink-mute line-clamp-1" title={r.deduction_reason}>
                              {r.deduction_reason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-soft font-mono">-</span>
                      )}
                    </td>

                    {/* الراتب الكلي */}
                    <td className="p-4 font-extrabold text-ink whitespace-nowrap">
                      {(r.net_salary ?? r.amount ?? 0).toLocaleString()} ج.م
                    </td>

                    {/* المبلغ المصروف */}
                    <td className="p-4 font-bold text-brand-ink whitespace-nowrap font-mono">
                      {(r.amount ?? 0).toLocaleString()} ج.م
                    </td>

                    {/* الحالة */}
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          r.status === "paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : r.status === "advance"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {r.status === "paid" ? "تم الصرف" : r.status === "advance" ? "سلفة" : "بانتظار الصرف"}
                      </span>
                    </td>

                    {/* تاريخ الصرف */}
                    <td className="p-4 text-xs font-mono text-ink-mute whitespace-nowrap">
                      {r.paid_date || "-"}
                    </td>

                    {/* ملاحظات */}
                    <td className="p-4 text-xs text-ink-soft max-w-[180px] truncate" title={r.note}>
                      {r.note || "-"}
                    </td>
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
