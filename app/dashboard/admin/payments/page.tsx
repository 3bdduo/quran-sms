"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Filter,
  Users,
} from "lucide-react";
import { paymentsApi, groupsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import type { GroupItem } from "@/types";

export default function AdminPaymentsPage() {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [summary, setSummary] = useState<{
    paid: number;
    unpaid: number;
    exempt: number;
    total: number;
    totalAmount: number;
  } | null>(null);

  const [studentsPayments, setStudentsPayments] = useState<
    {
      student_id: string;
      student_name: string;
      status: "paid" | "unpaid" | "exempt";
      amount?: number;
      paid_date?: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    groupsApi.list().then((list) => {
      setGroups(list);
      if (list.length) setSelectedGroupId(list[0].id);
    });
  }, []);

  async function loadData() {
    if (!monthKey) return;
    setLoading(true);
    try {
      const sumPromise = paymentsApi.summary(monthKey);
      const listPromise = selectedGroupId
        ? paymentsApi.byGroup(selectedGroupId, monthKey)
        : Promise.resolve([]);

      const [sumRes, listRes] = await Promise.all([sumPromise, listPromise]);
      setSummary(sumRes);
      setStudentsPayments(listRes);
    } catch {
      showToast("تعذّر تحميل بيانات الاشتراكات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [monthKey, selectedGroupId]);

  async function handleStatusChange(
    studentId: string,
    newStatus: "paid" | "unpaid" | "exempt",
    currentAmount?: number
  ) {
    try {
      await paymentsApi.updateMonth(studentId, monthKey, {
        status: newStatus,
        amount: currentAmount || 200,
        paidDate: newStatus === "paid" ? new Date().toISOString().slice(0, 10) : undefined,
      });

      setStudentsPayments((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, status: newStatus } : s))
      );

      // Refresh summary
      paymentsApi.summary(monthKey).then(setSummary).catch(() => undefined);
      showToast("تم تحديث حالة الدفع", "success");
    } catch {
      showToast("تعذّر تحديث حالة الدفع", "error");
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      await downloadFile(`/exports/payments/${monthKey}.xlsx`, `تقرير-المدفوعات-${monthKey}.xlsx`);
      showToast("تم تنزيل تقرير المدفوعات بنجاح", "success");
    } catch {
      showToast("تعذّر تنزيل ملف الإكسل", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">الاشتراكات والمدفوعات</h1>
          <p className="text-ink-mute text-sm mt-1">
            متابعة تحصيل الاشتراكات الشهرية للطلاب وتصدير تقارير المحصّلات
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-2"
        >
          {exporting ? <Spinner size={16} /> : <FileSpreadsheet size={16} />}
          <span>تصدير تقرير الشهر (Excel)</span>
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="إجمالي المحصل هذا الشهر"
          value={`${summary?.totalAmount ?? 0} جنيه`}
          tone="gold"
        />
        <StatCard
          icon={CheckCircle2}
          label="تم السداد (طلاب)"
          value={summary?.paid ?? 0}
          delay={0.08}
        />
        <StatCard
          icon={XCircle}
          label="لم يتم السداد (متأخر)"
          value={summary?.unpaid ?? 0}
          delay={0.16}
        />
        <StatCard
          icon={AlertCircle}
          label="معفون من الرسوم"
          value={summary?.exempt ?? 0}
          tone="gold"
          delay={0.24}
        />
      </div>

      {/* شريط الفلترة */}
      <div className="card !rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-ink-mute" />
            <input
              type="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="field text-sm py-2 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-ink-mute" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="field field-select text-sm py-2 min-w-48"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-bold text-ink-mute">
          إجمالي طلاب الحلقة: {studentsPayments.length}
        </span>
      </div>

      {/* جدول الاشتراكات */}
      {loading ? (
        <Loader size="lg" />
      ) : studentsPayments.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <Users size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لا يوجد طلاب في هذه الحلقة</p>
        </div>
      ) : (
        <div className="card !rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">اسم الطالب</th>
                  <th className="p-4 font-bold">قيمة الاشتراك</th>
                  <th className="p-4 font-bold">تاريخ الدفع</th>
                  <th className="p-4 font-bold text-center">حالة السداد للشهر</th>
                </tr>
              </thead>
              <tbody>
                {studentsPayments.map((item, idx) => (
                  <tr
                    key={item.student_id}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 text-xs font-mono text-ink-mute">{idx + 1}</td>
                    <td className="p-4 font-bold text-ink whitespace-nowrap">{item.student_name}</td>
                    <td className="p-4 font-semibold text-ink-soft whitespace-nowrap">
                      {item.amount ?? 200} جنيه
                    </td>
                    <td className="p-4 text-xs font-mono text-ink-mute whitespace-nowrap">
                      {item.paid_date || "-"}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.student_id, "paid", item.amount)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.status === "paid"
                              ? "bg-brand text-on-brand shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-brand-soft hover:text-brand-ink"
                          }`}
                        >
                          مدفوع
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.student_id, "unpaid", item.amount)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.status === "unpaid"
                              ? "bg-danger-solid text-white shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-danger-soft hover:text-danger-ink"
                          }`}
                        >
                          غير مدفوع
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.student_id, "exempt", item.amount)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.status === "exempt"
                              ? "bg-gold text-on-brand shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-gold-soft hover:text-gold-ink"
                          }`}
                        >
                          معفى
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
