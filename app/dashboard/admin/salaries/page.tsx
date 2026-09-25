"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit2,
  Eye,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  X,
  FileSpreadsheet,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { salariesApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { TeacherSalaryRecord } from "@/types";

interface TeacherOption {
  id?: string;
  username: string;
  full_name?: string;
  national_id?: string;
  base_salary?: number;
}

export default function AdminSalariesPage() {
  const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [summary, setSummary] = useState<{
    totalTeachers: number;
    paidCount: number;
    unpaidCount: number;
    advanceCount: number;
    totalPaidAmount: number;
    teachers: TeacherSalaryRecord[];
  } | null>(null);

  const [allTeachers, setAllTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "advance">("all");
  const [exportLoading, setExportLoading] = useState(false);

  // نافذة تحديد / تعديل الراتب
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTeacherUsername, setSelectedTeacherUsername] = useState("");
  const [baseSalaryInput, setBaseSalaryInput] = useState<number | string>(0);
  const [incentiveAmountInput, setIncentiveAmountInput] = useState<number | string>(0);
  const [incentiveReasonInput, setIncentiveReasonInput] = useState("");
  const [deductionAmountInput, setDeductionAmountInput] = useState<number | string>(0);
  const [deductionReasonInput, setDeductionReasonInput] = useState("");
  const [salaryStatusInput, setSalaryStatusInput] = useState<"paid" | "unpaid" | "advance">("paid");
  const [paidDateInput, setPaidDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [noteInput, setNoteInput] = useState("");

  // نافذة سجل رواتب معلم كامل
  const [historyModalTeacher, setHistoryModalTeacher] = useState<TeacherOption | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showToast } = useToast();

  // تحميل بيانات الشهر والمعلمين
  async function loadData(month: string) {
    setLoading(true);
    try {
      const [monthData, teachersData] = await Promise.all([
        salariesApi.byMonth(month),
        salariesApi.teachers(),
      ]);
      setSummary(monthData);
      setAllTeachers(teachersData || []);
    } catch {
      showToast("تعذّر تحميل بيانات الرواتب", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth]);

  // الحساب المباشر للراتب الكلي داخل المودال: الأساسي + الحوافز - الخصومات
  const liveBase = Number(baseSalaryInput) || 0;
  const liveIncentive = Number(incentiveAmountInput) || 0;
  const liveDeduction = Number(deductionAmountInput) || 0;
  const liveNetSalary = Math.max(0, liveBase + liveIncentive - liveDeduction);

  // إحصائيات الشهر
  const totalNetAll = useMemo(() => {
    if (!summary?.teachers) return 0;
    return summary.teachers.reduce((sum, t) => sum + (Number(t.netSalary) || 0), 0);
  }, [summary]);

  // تصفية المعلمين حسب البحث والحالة
  const filteredTeachers = useMemo(() => {
    if (!summary?.teachers) return [];
    return summary.teachers.filter((t) => {
      const nameMatch =
        (t.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        t.username.toLowerCase().includes(search.toLowerCase()) ||
        (t.national_id || "").includes(search);
      if (!nameMatch) return false;

      if (statusFilter === "all") return true;
      return t.status === statusFilter;
    });
  }, [summary, search, statusFilter]);

  // فتح المودال لإضافة أو تعديل راتب معلم
  function openSalaryModal(targetUsername?: string) {
    const username = targetUsername || (allTeachers[0]?.username ?? "");
    setSelectedTeacherUsername(username);

    // البحث عن السجل الحالي للشهر لهذا المعلم
    const existingRec = summary?.teachers.find((t) => t.username === username);
    const teacherMeta = allTeachers.find((t) => t.username === username);

    if (existingRec) {
      setBaseSalaryInput(existingRec.baseSalary ?? teacherMeta?.base_salary ?? 0);
      setIncentiveAmountInput(existingRec.incentiveAmount ?? 0);
      setIncentiveReasonInput(existingRec.incentiveReason ?? "");
      setDeductionAmountInput(existingRec.deductionAmount ?? 0);
      setDeductionReasonInput(existingRec.deductionReason ?? "");
      setSalaryStatusInput(existingRec.status || "paid");
      setPaidDateInput(existingRec.paidDate || new Date().toISOString().slice(0, 10));
      setNoteInput(existingRec.note || "");
    } else {
      setBaseSalaryInput(teacherMeta?.base_salary ?? 0);
      setIncentiveAmountInput(0);
      setIncentiveReasonInput("");
      setDeductionAmountInput(0);
      setDeductionReasonInput("");
      setSalaryStatusInput("paid");
      setPaidDateInput(new Date().toISOString().slice(0, 10));
      setNoteInput("");
    }

    setModalOpen(true);
  }

  // عند تغيير المعلم المختار في القائمة المنسدلة داخل المودال
  function handleTeacherSelectChange(newUsername: string) {
    setSelectedTeacherUsername(newUsername);
    const existingRec = summary?.teachers.find((t) => t.username === newUsername);
    const teacherMeta = allTeachers.find((t) => t.username === newUsername);

    if (existingRec) {
      setBaseSalaryInput(existingRec.baseSalary ?? teacherMeta?.base_salary ?? 0);
      setIncentiveAmountInput(existingRec.incentiveAmount ?? 0);
      setIncentiveReasonInput(existingRec.incentiveReason ?? "");
      setDeductionAmountInput(existingRec.deductionAmount ?? 0);
      setDeductionReasonInput(existingRec.deductionReason ?? "");
      setSalaryStatusInput(existingRec.status || "paid");
      setPaidDateInput(existingRec.paidDate || new Date().toISOString().slice(0, 10));
      setNoteInput(existingRec.note || "");
    } else {
      setBaseSalaryInput(teacherMeta?.base_salary ?? 0);
      setIncentiveAmountInput(0);
      setIncentiveReasonInput("");
      setDeductionAmountInput(0);
      setDeductionReasonInput("");
      setSalaryStatusInput("paid");
      setPaidDateInput(new Date().toISOString().slice(0, 10));
      setNoteInput("");
    }
  }

  // حفظ واعتماد الراتب
  async function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeacherUsername) {
      showToast("يرجى اختيار المعلم أولاً", "error");
      return;
    }

    setModalLoading(true);
    try {
      await salariesApi.setMonth(selectedTeacherUsername, selectedMonth, {
        baseSalary: liveBase,
        incentiveAmount: liveIncentive,
        incentiveReason: incentiveReasonInput.trim() || undefined,
        deductionAmount: liveDeduction,
        deductionReason: deductionReasonInput.trim() || undefined,
        status: salaryStatusInput,
        amount: liveNetSalary,
        paidDate: salaryStatusInput === "paid" ? paidDateInput : undefined,
        note: noteInput.trim() || undefined,
      });

      showToast("تم حفظ واعتماد مسير الراتب بنجاح", "success");
      setModalOpen(false);
      loadData(selectedMonth);
    } catch {
      showToast("تعذّر حفظ بيانات الراتب", "error");
    } finally {
      setModalLoading(false);
    }
  }

  // صرف فوري سريع
  async function handleQuickPay(teacher: TeacherSalaryRecord) {
    try {
      await salariesApi.setMonth(teacher.username, selectedMonth, {
        baseSalary: teacher.baseSalary,
        incentiveAmount: teacher.incentiveAmount || 0,
        incentiveReason: teacher.incentiveReason || undefined,
        deductionAmount: teacher.deductionAmount || 0,
        deductionReason: teacher.deductionReason || undefined,
        status: "paid",
        amount: teacher.netSalary,
        paidDate: new Date().toISOString().slice(0, 10),
      });
      showToast(`تم تسجيل صرف راتب ${teacher.full_name || teacher.username} بنجاح`, "success");
      loadData(selectedMonth);
    } catch {
      showToast("تعذّر تسجيل عملية الصرف", "error");
    }
  }

  // حذف سجل الشهر
  async function handleDeleteRecord(username: string) {
    if (!confirm("هل أنت متأكد من حذف سجل الراتب لهذا الشهر؟")) return;
    try {
      await salariesApi.deleteMonth(username, selectedMonth);
      showToast("تم حذف سجل الراتب بنجاح", "success");
      loadData(selectedMonth);
    } catch {
      showToast("تعذّر حذف السجل", "error");
    }
  }

  // عرض سجل رواتب معلم كامل
  async function openHistoryModal(teacher: TeacherSalaryRecord | TeacherOption) {
    setHistoryModalTeacher(teacher as TeacherOption);
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const records = await salariesApi.history(teacher.username);
      setHistoryRecords(records || []);
    } catch {
      showToast("تعذّر تحميل سجل المعلم", "error");
    } finally {
      setHistoryLoading(false);
    }
  }

  // تصدير إكسل
  async function handleExportExcel() {
    setExportLoading(true);
    try {
      await downloadFile(`/exports/salaries/${selectedMonth}.xlsx`, `مسير-رواتب-${selectedMonth}.xlsx`);
      showToast("تم تحميل ملف مسير الرواتب بنجاح", "success");
    } catch {
      showToast("تعذّر تصدير ملف الإكسل", "error");
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* الرأس والإجراءات الأساسية */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink flex items-center gap-2">
            <Banknote className="w-8 h-8 text-brand" />
            إدارة رواتب المعلمين
          </h1>
          <p className="text-ink-mute text-sm mt-1">
            تحديد الرواتب الأساسية، الحوافز، والخصومات مع الحساب التلقائي لصافي الراتب وسجل الصرف
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* محدد الشهر */}
          <div className="flex items-center gap-2 bg-bg-alt/70 border border-line rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-brand-ink" />
            <span className="text-xs font-bold text-ink-mute">الشهر:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-ink focus:outline-none cursor-pointer"
            />
          </div>

          {/* زر التصدير إكسل */}
          <button
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="btn-outline flex items-center gap-2 text-xs !py-2 !px-3 rounded-xl border border-line hover:border-brand/40 transition-colors"
            title="تصدير مسير الرواتب لإكسل"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {exportLoading ? "جاري التصدير..." : "تصدير مسير الرواتب"}
          </button>

          {/* زر تحديد راتب معلم */}
          <button
            onClick={() => openSalaryModal()}
            className="btn-primary flex items-center gap-2 text-sm !py-2.5 !px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            تحديد راتب معلم
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={User}
          label="إجمالي المعلمين"
          value={summary?.totalTeachers ?? allTeachers.length}
          tone="emerald"
        />
        <StatCard
          icon={CheckCircle2}
          label="مسيرات تم صرفها"
          value={`${summary?.paidCount ?? 0} (${summary?.totalPaidAmount ?? 0} ج.م)`}
          tone="emerald"
          delay={0.05}
        />
        <StatCard
          icon={Clock}
          label="بانتظار الصرف"
          value={summary?.unpaidCount ?? 0}
          tone="red"
          delay={0.1}
        />
        <StatCard
          icon={CreditCard}
          label="إجمالي الاستحقاق الصافي"
          value={`${totalNetAll.toLocaleString()} ج.م`}
          tone="gold"
          delay={0.15}
        />
      </div>

      {/* شريط البحث وتصفية الحالات */}
      <div className="card !rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ink-mute absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم المعلم أو الرقم القومي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-text !pr-9 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-ink-mute ml-2 whitespace-nowrap">الحالة:</span>
          {(
            [
              { key: "all", label: "الكل" },
              { key: "paid", label: "تم الصرف" },
              { key: "unpaid", label: "بانتظار الصرف" },
              { key: "advance", label: "سلفة" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-brand text-white shadow-sm"
                  : "bg-bg-alt/80 text-ink-mute hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* جدول كشف الرواتب للمعلمين */}
      <div className="card !rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-ink flex items-center gap-2">
            <span>كشف رواتب شهر ({selectedMonth})</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink">
              {filteredTeachers.length} معلم
            </span>
          </h2>
          <span className="text-xs text-ink-mute">
            * يتم الحساب تلقائياً: الراتب الأساسي + الحوافز - الخصومات
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader size="lg" />
          </div>
        ) : !filteredTeachers.length ? (
          <div className="p-16 text-center text-ink-mute">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-ink-soft opacity-60" />
            <p className="font-bold text-base">لا توجد بيانات مطابقة لهذا البحث أو الشهر</p>
            <p className="text-xs mt-1">يمكنك الضغط على زر "تحديد راتب معلم" لإدخال مسير جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-xs font-bold text-ink-mute">
                  <th className="p-3.5 whitespace-nowrap">#</th>
                  <th className="p-3.5 whitespace-nowrap">المعلم</th>
                  <th className="p-3.5 whitespace-nowrap">الراتب الأساسي</th>
                  <th className="p-3.5 whitespace-nowrap">الحوافز والمكافآت</th>
                  <th className="p-3.5 whitespace-nowrap">الخصومات والاستقطاعات</th>
                  <th className="p-3.5 whitespace-nowrap">الراتب الكلي (الصافي)</th>
                  <th className="p-3.5 whitespace-nowrap">الحالة</th>
                  <th className="p-3.5 whitespace-nowrap">تاريخ الصرف</th>
                  <th className="p-3.5 whitespace-nowrap text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredTeachers.map((t, idx) => {
                  const net = t.netSalary ?? Math.max(0, (t.baseSalary || 0) + (t.incentiveAmount || 0) - (t.deductionAmount || 0));
                  const isPaid = t.status === "paid";
                  const isAdvance = t.status === "advance";

                  return (
                    <tr
                      key={t.username}
                      className="hover:bg-bg-alt/40 transition-colors group"
                    >
                      <td className="p-3.5 text-xs text-ink-mute font-mono">{idx + 1}</td>

                      {/* بيانات المعلم */}
                      <td className="p-3.5">
                        <div className="font-bold text-ink">{t.full_name || t.username}</div>
                        <div className="text-xs text-ink-mute font-mono flex items-center gap-2 mt-0.5">
                          <span>@{t.username}</span>
                          {t.national_id && <span>• {t.national_id}</span>}
                        </div>
                      </td>

                      {/* الراتب الأساسي */}
                      <td className="p-3.5 whitespace-nowrap font-bold text-ink">
                        {(t.baseSalary || 0).toLocaleString()} ج.م
                      </td>

                      {/* الحوافز + السبب */}
                      <td className="p-3.5">
                        {t.incentiveAmount ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                              <TrendingUp className="w-3 h-3" />
                              +{t.incentiveAmount.toLocaleString()} ج.م
                            </span>
                            {t.incentiveReason && (
                              <p className="text-[11px] text-ink-mute line-clamp-1 max-w-[150px]" title={t.incentiveReason}>
                                السبب: {t.incentiveReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-soft font-mono">-</span>
                        )}
                      </td>

                      {/* الخصومات + السبب */}
                      <td className="p-3.5">
                        {t.deductionAmount ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 text-xs bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                              <TrendingDown className="w-3 h-3" />
                              -{t.deductionAmount.toLocaleString()} ج.م
                            </span>
                            {t.deductionReason && (
                              <p className="text-[11px] text-ink-mute line-clamp-1 max-w-[150px]" title={t.deductionReason}>
                                السبب: {t.deductionReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-soft font-mono">-</span>
                        )}
                      </td>

                      {/* الراتب الكلي (الصافي) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-extrabold text-sm text-brand-ink bg-brand-soft/60 px-2.5 py-1 rounded-lg">
                          {net.toLocaleString()} ج.م
                        </span>
                      </td>

                      {/* الحالة */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isAdvance
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              تم الصرف
                            </>
                          ) : isAdvance ? (
                            <>
                              <Clock className="w-3 h-3" />
                              سلفة
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              بانتظار الصرف
                            </>
                          )}
                        </span>
                      </td>

                      {/* تاريخ الصرف */}
                      <td className="p-3.5 whitespace-nowrap text-xs text-ink-mute font-mono">
                        {t.paidDate || "-"}
                      </td>

                      {/* الإجراءات */}
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر صرف الآن إذا لم يكن مدفوعاً */}
                          {!isPaid && (
                            <button
                              onClick={() => handleQuickPay(t)}
                              className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="تسجيل صرف الراتب فوراً"
                            >
                              <Check className="w-3.5 h-3.5" />
                              صرف الآن
                            </button>
                          )}

                          {/* تعديل الراتب */}
                          <button
                            onClick={() => openSalaryModal(t.username)}
                            className="p-1.5 rounded-lg text-ink-mute hover:text-brand hover:bg-brand-soft/40 transition-colors"
                            title="تعديل وتحديد الراتب"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* سجل رواتب المعلم */}
                          <button
                            onClick={() => openHistoryModal(t)}
                            className="p-1.5 rounded-lg text-ink-mute hover:text-gold-ink hover:bg-gold-soft/40 transition-colors"
                            title="عرض السجل التاريخي لرواتب المعلم"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* حذف السجل */}
                          {(t.amount > 0 || t.status === "paid") && (
                            <button
                              onClick={() => handleDeleteRecord(t.username)}
                              className="p-1.5 rounded-lg text-ink-mute hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="حذف سجل هذا الشهر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* نافذة مودال: تحديد وتعديل راتب معلم (الأساسي، الحوافز، الخصومات) */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-line flex items-center justify-between bg-bg-alt/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand-ink">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-ink text-lg">تحديد راتب المعلم</h3>
                  <p className="text-xs text-ink-mute">
                    شهر {selectedMonth} — حساب الأساسي، الحوافز، والخصومات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-5 space-y-5">
              {/* قائمة المعلمين لاختيار المعلم */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  اختيار المعلم <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTeacherUsername}
                  onChange={(e) => handleTeacherSelectChange(e.target.value)}
                  className="input-text w-full text-sm font-bold bg-bg"
                  required
                >
                  <option value="" disabled>
                    -- اختر معلماً من القائمة --
                  </option>
                  {allTeachers.map((t) => (
                    <option key={t.username} value={t.username}>
                      {t.full_name || t.username} ({t.username})
                    </option>
                  ))}
                </select>
              </div>

              {/* 1. الراتب الأساسي */}
              <div className="bg-bg-alt/40 p-4 rounded-2xl border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand"></span>
                    الراتب الأساسي (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-ink-mute">راتب المعلم المعتمد</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={baseSalaryInput}
                    onChange={(e) => setBaseSalaryInput(e.target.value)}
                    placeholder="مثال: 3000"
                    className="input-text w-full text-base font-extrabold !pl-12"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mute">
                    جنيه
                  </span>
                </div>
              </div>

              {/* 2. الحوافز والمكافآت + السبب */}
              <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    الحوافز والمكافآت (تُضاف للراتب)
                  </label>
                  <span className="text-[11px] text-emerald-600/80 font-bold">+ إضافة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative sm:col-span-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={incentiveAmountInput}
                      onChange={(e) => setIncentiveAmountInput(e.target.value)}
                      placeholder="0"
                      className="input-text w-full text-sm font-bold text-emerald-700 !pl-10"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mute">
                      ج.م
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={incentiveReasonInput}
                      onChange={(e) => setIncentiveReasonInput(e.target.value)}
                      placeholder="سبب الحافز (مثلاً: تميز في التسميع، حلقات إضافية...)"
                      className="input-text w-full text-xs"
                    />
                  </div>
                </div>

                {/* اقتراحات سريعة لسبب الحافز */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-ink-mute">اقتراحات:</span>
                  {["التزام وانضباط بالحضور", "تميز حلقة التحفيظ", "ساعات إضافية", "مكافأة مسابقة"].map(
                    (s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setIncentiveReasonInput(s)}
                        className="text-[10px] bg-white dark:bg-bg border border-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 transition-colors"
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 3. الخصومات والاستقطاعات + السبب */}
              <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    الخصومات والاستقطاعات (تُخصم من الراتب)
                  </label>
                  <span className="text-[11px] text-rose-600/80 font-bold">- خصم</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative sm:col-span-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={deductionAmountInput}
                      onChange={(e) => setDeductionAmountInput(e.target.value)}
                      placeholder="0"
                      className="input-text w-full text-sm font-bold text-rose-700 !pl-10"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mute">
                      ج.م
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={deductionReasonInput}
                      onChange={(e) => setDeductionReasonInput(e.target.value)}
                      placeholder="سبب الخصم (مثلاً: غياب يومين، تأخير متكرر...)"
                      className="input-text w-full text-xs"
                    />
                  </div>
                </div>

                {/* اقتراحات سريعة لسبب الخصم */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-ink-mute">اقتراحات:</span>
                  {["غياب بدون عذر", "تأخير متكرر", "استقطاع سلفة سابقة", "عدم إتمام الساعات"].map(
                    (s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setDeductionReasonInput(s)}
                        className="text-[10px] bg-white dark:bg-bg border border-rose-500/20 px-2 py-0.5 rounded-lg text-rose-800 dark:text-rose-300 hover:bg-rose-50 transition-colors"
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* بطاقة الحساب التلقائي للراتب الكلي (صافي المستحق) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand/10 via-brand/5 to-transparent border-2 border-brand/30">
                <div className="flex items-center justify-between text-xs text-ink-mute mb-2">
                  <span className="font-bold flex items-center gap-1 text-ink">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    معادلة الحساب التلقائي:
                  </span>
                  <span>(الأساسي + الحوافز - الخصومات)</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono border-b border-line/60 pb-2 mb-2 text-ink-soft">
                  <span>الأساسي: {liveBase.toLocaleString()} ج.م</span>
                  <span className="text-emerald-600">+ حوافز: {liveIncentive.toLocaleString()} ج.م</span>
                  <span className="text-rose-600">- خصومات: {liveDeduction.toLocaleString()} ج.م</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-extrabold text-sm text-ink">الراتب الكلي المستحق:</span>
                  <span className="font-black text-xl text-brand-ink">
                    {liveNetSalary.toLocaleString()} جنيه مصري
                  </span>
                </div>
              </div>

              {/* حالة وتاريخ الصرف والملاحظات */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">حالة الصرف</label>
                  <select
                    value={salaryStatusInput}
                    onChange={(e) => setSalaryStatusInput(e.target.value as any)}
                    className="input-text w-full text-xs font-bold bg-bg"
                  >
                    <option value="paid">تم الصرف (مدفوع)</option>
                    <option value="unpaid">بانتظار الصرف (غير مدفوع)</option>
                    <option value="advance">سلفة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">تاريخ الصرف</label>
                  <input
                    type="date"
                    value={paidDateInput}
                    onChange={(e) => setPaidDateInput(e.target.value)}
                    className="input-text w-full text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-ink mb-1.5">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="أي ملاحظات للإدارة أو المعلم..."
                    className="input-text w-full text-xs"
                  />
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline text-xs !py-2.5 !px-4"
                  disabled={modalLoading}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary text-xs !py-2.5 !px-6 flex items-center gap-2 shadow-sm font-bold"
                >
                  {modalLoading ? <Loader size="sm" /> : <Check className="w-4 h-4" />}
                  حفظ واعتماد الراتب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* نافذة مودال: سجل رواتب المعلم التاريخي الكامل */}
      {/* ============================================================== */}
      {historyModalTeacher && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-line flex items-center justify-between bg-bg-alt/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gold-soft flex items-center justify-center text-gold-ink">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-ink text-lg">
                    سجل رواتب: {historyModalTeacher.full_name || historyModalTeacher.username}
                  </h3>
                  <p className="text-xs text-ink-mute font-mono">
                    @{historyModalTeacher.username} — الأرشيف المالي لجميع الشهور
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalTeacher(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {historyLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader size="md" />
                </div>
              ) : !historyRecords.length ? (
                <div className="p-10 text-center text-ink-mute">
                  <p className="font-bold">لا توجد سجلات رواتب مسجلة لهذا المعلم بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyRecords.map((r, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-line bg-bg-alt/30 hover:bg-bg-alt/50 transition-colors space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-ink">شهر {r.month_key}</span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              r.status === "paid"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : r.status === "advance"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {r.status === "paid" ? "تم الصرف" : r.status === "advance" ? "سلفة" : "بانتظار الصرف"}
                          </span>
                        </div>
                        <div className="text-xs text-ink-mute font-mono">
                          تاريخ الصرف: {r.paid_date || "غير محدد"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-ink-mute block">الأساسي:</span>
                          <span className="font-bold text-ink">{r.base_salary ?? 0} ج.م</span>
                        </div>
                        <div>
                          <span className="text-ink-mute block">الحوافز:</span>
                          <span className="font-bold text-emerald-600">
                            +{r.incentive_amount ?? 0} ج.م
                          </span>
                          {r.incentive_reason && (
                            <span className="text-[10px] text-ink-mute block line-clamp-1" title={r.incentive_reason}>
                              ({r.incentive_reason})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-ink-mute block">الخصومات:</span>
                          <span className="font-bold text-rose-600">
                            -{r.deduction_amount ?? 0} ج.م
                          </span>
                          {r.deduction_reason && (
                            <span className="text-[10px] text-ink-mute block line-clamp-1" title={r.deduction_reason}>
                              ({r.deduction_reason})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-ink-mute block">الصافي الكلي:</span>
                          <span className="font-extrabold text-brand-ink text-sm">
                            {r.net_salary ?? r.amount} ج.م
                          </span>
                        </div>
                      </div>

                      {r.note && (
                        <div className="text-xs bg-bg p-2 rounded-xl border border-line text-ink-soft">
                          <span className="font-bold text-ink">ملاحظة: </span>
                          {r.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-line flex justify-end bg-bg-alt/30">
              <button
                onClick={() => setHistoryModalTeacher(null)}
                className="btn-outline text-xs !py-2 !px-4"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
