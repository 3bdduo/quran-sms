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
  Calculator,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
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

  // نافذة تحديد / تعديل الراتب (نظام الخطوات المتسلسلة)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [salaryStep, setSalaryStep] = useState<1 | 2 | 3 | 4>(1);
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

  const selectedTeacherObj = useMemo(() => {
    return allTeachers.find((t) => t.username === selectedTeacherUsername) || null;
  }, [allTeachers, selectedTeacherUsername]);

  // فتح المودال لإضافة أو تعديل راتب معلم
  function openSalaryModal(targetUsername?: string) {
    const username = targetUsername || (allTeachers[0]?.username ?? "");
    setSelectedTeacherUsername(username);
    setSalaryStep(1);

    // البحث عن السجل الحالي للشهر لهذا المعلم
    const existingRec = summary?.teachers.find((t) => t.username === username);
    const teacherMeta = allTeachers.find((t) => t.username === username);

    const base = existingRec?.baseSalary ?? teacherMeta?.base_salary ?? 0;
    setBaseSalaryInput(base > 0 ? base : "");

    if (existingRec) {
      setIncentiveAmountInput(existingRec.incentiveAmount ? existingRec.incentiveAmount : "");
      setIncentiveReasonInput(existingRec.incentiveReason ?? "");
      setDeductionAmountInput(existingRec.deductionAmount ? existingRec.deductionAmount : "");
      setDeductionReasonInput(existingRec.deductionReason ?? "");
      setSalaryStatusInput(existingRec.status || "paid");
      setPaidDateInput(existingRec.paidDate || new Date().toISOString().slice(0, 10));
      setNoteInput(existingRec.note || "");
    } else {
      setIncentiveAmountInput("");
      setIncentiveReasonInput("");
      setDeductionAmountInput("");
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

    const base = existingRec?.baseSalary ?? teacherMeta?.base_salary ?? 0;
    setBaseSalaryInput(base > 0 ? base : "");

    if (existingRec) {
      setIncentiveAmountInput(existingRec.incentiveAmount ? existingRec.incentiveAmount : "");
      setIncentiveReasonInput(existingRec.incentiveReason ?? "");
      setDeductionAmountInput(existingRec.deductionAmount ? existingRec.deductionAmount : "");
      setDeductionReasonInput(existingRec.deductionReason ?? "");
      setSalaryStatusInput(existingRec.status || "paid");
      setPaidDateInput(existingRec.paidDate || new Date().toISOString().slice(0, 10));
      setNoteInput(existingRec.note || "");
    } else {
      setIncentiveAmountInput("");
      setIncentiveReasonInput("");
      setDeductionAmountInput("");
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

    if (liveBase <= 0) {
      showToast("يرجى إدخال الراتب الأساسي للمعلم (أكبر من 0)", "error");
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
    if (!teacher.baseSalary || teacher.baseSalary <= 0) {
      showToast("يرجى تحديد الراتب الأساسي والحوافز والخصومات أولاً", "error");
      openSalaryModal(teacher.username);
      return;
    }

    const net = teacher.netSalary ?? Math.max(0, (teacher.baseSalary || 0) + (teacher.incentiveAmount || 0) - (teacher.deductionAmount || 0));

    if (!confirm(`هل أنت متأكد من تسجيل صرف راتب (${net.toLocaleString()} ج.م) للمعلم ${teacher.full_name || teacher.username} لشهر ${selectedMonth}؟`)) {
      return;
    }

    try {
      await salariesApi.setMonth(teacher.username, selectedMonth, {
        baseSalary: teacher.baseSalary,
        incentiveAmount: teacher.incentiveAmount || 0,
        incentiveReason: teacher.incentiveReason || undefined,
        deductionAmount: teacher.deductionAmount || 0,
        deductionReason: teacher.deductionReason || undefined,
        status: "paid",
        amount: net,
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
        <div className="p-4 sm:p-5 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-ink flex items-center gap-2">
              <span>كشف رواتب شهر ({selectedMonth})</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink">
                {filteredTeachers.length} معلم
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-mute hidden sm:inline">
              * يتم الحساب تلقائياً: الراتب الأساسي + الحوافز - الخصومات
            </span>
            <button
              onClick={() => openSalaryModal()}
              className="btn-primary flex items-center gap-1.5 text-xs !py-2 !px-3.5 shadow-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              تحديد راتب معلم
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader size="lg" />
          </div>
        ) : !filteredTeachers.length ? (
          <div className="p-16 text-center text-ink-mute">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-ink-soft opacity-60" />
            <p className="font-bold text-base">لا توجد بيانات مطابقة لهذا البحث أو الشهر</p>
            <p className="text-xs mt-1">يمكنك الضغط على زر &quot;تحديد راتب معلم&quot; لإدخال مسير جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto" dir="rtl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-xs font-bold text-ink-mute">
                  <th className="p-3.5 whitespace-nowrap text-center w-12">م</th>
                  <th className="p-3.5 whitespace-nowrap sticky right-0 bg-bg-alt/95 z-20 border-l border-line/50 shadow-sm">
                    المعلم
                  </th>
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
                  const hasBase = t.baseSalary !== undefined && t.baseSalary !== null && t.baseSalary > 0;
                  const net = t.netSalary ?? Math.max(0, (t.baseSalary || 0) + (t.incentiveAmount || 0) - (t.deductionAmount || 0));
                  const isPaid = t.status === "paid";
                  const isAdvance = t.status === "advance";

                  return (
                    <tr
                      key={t.username}
                      className="hover:bg-bg-alt/40 transition-colors group"
                    >
                      <td className="p-3.5 text-xs text-ink-mute font-mono text-center">{idx + 1}</td>

                      {/* بيانات المعلم - الاسم الكامل فقط */}
                      <td className="p-3.5 sticky right-0 bg-bg group-hover:bg-bg-alt/90 transition-colors z-10 border-l border-line/50 shadow-sm">
                        <div
                          className="font-bold text-ink hover:text-brand cursor-pointer transition-colors"
                          onClick={() => openSalaryModal(t.username)}
                          title="اضغط لتحديد أو تعديل راتب هذا المعلم"
                        >
                          {t.full_name || t.username}
                        </div>
                      </td>

                      {/* الراتب الأساسي */}
                      <td className="p-3.5 whitespace-nowrap font-bold">
                        {hasBase ? (
                          <span className="text-ink">{(t.baseSalary || 0).toLocaleString()} ج.م</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                            غير محدد
                          </span>
                        )}
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
                        <span
                          className={`font-extrabold text-sm px-2.5 py-1 rounded-lg ${
                            net > 0 ? "text-brand-ink bg-brand-soft/60" : "text-ink-mute bg-bg-alt/70"
                          }`}
                        >
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
                        {!hasBase ? (
                          /* لو المعلم ملوش راتب أساسي متسجل لسه: زر كبير واضح لتحديد الراتب */
                          <button
                            onClick={() => openSalaryModal(t.username)}
                            className="btn-primary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap mx-auto"
                            title="تحديد الراتب الأساسي والحوافز والخصومات"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            تحديد الراتب
                          </button>
                        ) : (
                          /* لو الراتب محدد بالفعل */
                          <div className="flex items-center justify-center gap-1.5">
                            {!isPaid && (
                              <button
                                onClick={() => handleQuickPay(t)}
                                className="text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm whitespace-nowrap transition-colors"
                                title="تسجيل صرف الراتب فوراً"
                              >
                                <Check className="w-3.5 h-3.5" />
                                صرف ({net.toLocaleString()} ج.م)
                              </button>
                            )}

                            <button
                              onClick={() => openSalaryModal(t.username)}
                              className="btn-outline !py-1.5 !px-2.5 text-xs font-bold flex items-center gap-1 whitespace-nowrap"
                              title="تعديل وتحديد الراتب"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              تعديل
                            </button>

                            <button
                              onClick={() => openHistoryModal(t)}
                              className="p-1.5 rounded-lg text-ink-mute hover:text-gold-ink hover:bg-gold-soft/40 transition-colors"
                              title="عرض السجل التاريخي لرواتب المعلم"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

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
                        )}
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
      {/* ============================================================== */}
      {/* نافذة مودال: تحديد وتعديل راتب معلم (نظام خطوات سلس 4 مراحل) */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-line rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-bg-alt/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-soft flex items-center justify-center text-brand-ink">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-ink text-base sm:text-lg">
                    {salaryStep === 1
                      ? "الخطوة 1: تحديد الراتب الأساسي"
                      : salaryStep === 2
                      ? "الخطوة 2: الحوافز والمكافآت"
                      : salaryStep === 3
                      ? "الخطوة 3: الخصومات والاستقطاعات"
                      : "الخطوة 4: مراجعة واعتماد الراتب"}
                  </h3>
                  <p className="text-xs text-ink-mute">
                    شهر {selectedMonth} {selectedTeacherObj ? `• للمعلم ${selectedTeacherObj.full_name || selectedTeacherObj.username}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Navigation Bar */}
            <div className="px-3 sm:px-5 py-3 border-b border-line bg-bg-alt/20">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[
                  { num: 1, title: "الأساسي", icon: Banknote },
                  { num: 2, title: "الحوافز (+)", icon: TrendingUp },
                  { num: 3, title: "الخصومات (-)", icon: TrendingDown },
                  { num: 4, title: "المراجعة (✓)", icon: CheckCircle2 },
                ].map((step) => {
                  const Icon = step.icon;
                  const isActive = salaryStep === step.num;
                  const isDone = salaryStep > step.num;
                  const canClick = isDone || (step.num === 2 && liveBase > 0) || (step.num === 3 && liveBase > 0) || (step.num === 4 && liveBase > 0);

                  return (
                    <button
                      key={step.num}
                      type="button"
                      disabled={!canClick && !isActive}
                      onClick={() => {
                        if (canClick) setSalaryStep(step.num as any);
                      }}
                      className={`flex items-center gap-1.5 p-2 rounded-xl text-right transition-all border ${
                        isActive
                          ? "bg-brand/10 border-brand text-brand-ink font-bold shadow-xs"
                          : isDone
                          ? "bg-surface border-line text-ink hover:border-brand/40 font-bold cursor-pointer"
                          : "border-transparent text-ink-mute/40 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isActive
                            ? "bg-brand text-on-brand shadow-xs"
                            : isDone
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-bg-alt text-ink-mute"
                        }`}
                      >
                        {isDone ? <Check size={13} strokeWidth={3} /> : step.num}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] truncate leading-tight font-bold">{step.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form & Steps Content */}
            <form onSubmit={handleSaveSalary} className="p-4 sm:p-6 space-y-5">
              {/* ============================================================== */}
              {/* الخطوة 1: اختيار المعلم والراتب الأساسي */}
              {/* ============================================================== */}
              {salaryStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  {/* اختيار المعلم */}
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">
                      اختيار المعلم المستحق للراتب <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedTeacherUsername}
                      onChange={(e) => handleTeacherSelectChange(e.target.value)}
                      className="field text-sm font-bold w-full"
                      required
                    >
                      <option value="" disabled>
                        -- اختر معلماً من القائمة --
                      </option>
                      {allTeachers.map((t) => (
                        <option key={t.username} value={t.username}>
                          {t.full_name || t.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* بطاقة معلومات المعلم المختار */}
                  {selectedTeacherObj && (
                    <div className="p-3 bg-bg-alt/60 rounded-2xl border border-line text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-soft text-brand-ink flex items-center justify-center font-bold">
                          <User size={16} />
                        </div>
                        <div>
                          <strong className="text-ink block text-xs">{selectedTeacherObj.full_name || selectedTeacherObj.username}</strong>
                        </div>
                      </div>

                      {selectedTeacherObj.base_salary && selectedTeacherObj.base_salary > 0 ? (
                        <span className="bg-brand-soft text-brand-ink px-2.5 py-1 rounded-lg font-mono font-bold text-[11px]">
                          الأساسي المسجل: {selectedTeacherObj.base_salary.toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span className="text-ink-mute text-[11px]">لم يُسجل راتب أساسي سابق</span>
                      )}
                    </div>
                  )}

                  {/* الراتب الأساسي للشهر */}
                  <div className="bg-surface p-4 sm:p-5 rounded-2xl border-2 border-brand/30 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-brand" />
                        الراتب الأساسي لشهر {selectedMonth} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-brand-ink font-bold">المبلغ الثابت</span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={baseSalaryInput}
                        onChange={(e) => setBaseSalaryInput(e.target.value)}
                        placeholder="أدخل مبلغ الراتب الأساسي..."
                        className="field !pl-16 text-lg sm:text-xl font-black text-ink"
                        required
                        autoFocus
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mute">
                        جنيه مصري
                      </span>
                    </div>

                    {/* اختصارات مبالغ شائعة سريعة */}
                    <div className="pt-1">
                      <p className="text-[11px] text-ink-mute mb-1.5 font-bold">مبالغ سريعة بنقرة واحدة:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[1500, 2000, 2500, 3000, 3500, 4000, 5000].map((amt) => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => setBaseSalaryInput(amt)}
                            className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition-colors ${
                              Number(baseSalaryInput) === amt
                                ? "bg-brand text-on-brand border-brand"
                                : "bg-bg-alt/70 border-line hover:border-brand/40 text-ink"
                            }`}
                          >
                            {amt.toLocaleString()} ج.م
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* أزرار الخطوة 1 */}
                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalOpen(false)}
                      className="!min-h-10 px-4 text-xs font-bold"
                    >
                      إلغاء
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      disabled={liveBase <= 0 || !selectedTeacherUsername}
                      onClick={() => {
                        if (liveBase <= 0) {
                          showToast("يرجى إدخال الراتب الأساسي (أكبر من 0)", "error");
                          return;
                        }
                        setSalaryStep(2);
                      }}
                      className="!min-h-10 px-5 text-xs font-bold flex items-center gap-2"
                    >
                      <span>المتابعة للحوافز والمكافآت</span>
                      <ArrowLeft size={15} />
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* الخطوة 2: الحوافز والمكافآت (تُضاف للراتب) */}
              {/* ============================================================== */}
              {salaryStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  {/* بطاقة توجيهية */}
                  <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-2.5">
                    <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs">هل يستحق المعلم أي مكافأة أو حافز هذا الشهر؟</strong>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        هذه الخطوة اختيارية. إذا لم يكن هناك أي حوافز، يمكنك الضغط على &quot;تخطي بدون حوافز&quot;.
                      </p>
                    </div>
                  </div>

                  {/* إدخال مبلغ الحافز */}
                  <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        مبلغ الحافز أو المكافأة (ج.م)
                      </label>
                      {liveIncentive > 0 && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                          + {liveIncentive.toLocaleString()} ج.م يُضاف للراتب
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={incentiveAmountInput}
                        onChange={(e) => setIncentiveAmountInput(e.target.value)}
                        placeholder="0 (اتركه 0 إذا لم يوجد حافز)"
                        className="field !pl-16 text-lg font-black text-emerald-600"
                        autoFocus
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mute">
                        جنيه
                      </span>
                    </div>

                    {/* اختصارات مبالغ الحوافز السريعة */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-ink-mute font-bold">مبالغ سريعة:</span>
                      {[100, 200, 300, 500, 1000].map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => setIncentiveAmountInput(amt)}
                          className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border transition-colors ${
                            Number(incentiveAmountInput) === amt
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15"
                          }`}
                        >
                          +{amt} ج.م
                        </button>
                      ))}
                      {Number(incentiveAmountInput) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIncentiveAmountInput("");
                            setIncentiveReasonInput("");
                          }}
                          className="text-xs px-2 py-0.5 rounded-lg font-bold text-rose-600 hover:bg-rose-50"
                        >
                          إلغاء الحافز (0)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* سبب الحافز (يظهر دائماً، ومهم إذا وُجد مبلغ) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink">
                      سبب أو بند المكافأة {liveIncentive > 0 && <span className="text-emerald-600">*</span>}
                    </label>
                    <input
                      type="text"
                      value={incentiveReasonInput}
                      onChange={(e) => setIncentiveReasonInput(e.target.value)}
                      placeholder="مثال: تميز حلقة التحفيظ، التزام بالحضور، ساعات إضافية..."
                      className="field text-xs"
                    />

                    {/* اقتراحات سريعة لسبب الحافز */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-ink-mute">اقتراحات شائعة:</span>
                      {["التزام وانضباط بالحضور", "تميز حلقة التحفيظ", "ساعات إضافية", "مكافأة مسابقة القرآن"].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setIncentiveReasonInput(s)}
                          className="text-[10px] bg-bg-alt border border-line px-2 py-0.5 rounded-lg text-ink hover:border-emerald-500/40 hover:text-emerald-700 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* معاينة الراتب حتى الآن */}
                  <div className="p-3 bg-bg-alt/60 rounded-xl border border-line flex items-center justify-between text-xs">
                    <span className="text-ink-mute">الإجمالي المرحلي (الأساسي + الحوافز):</span>
                    <strong className="text-ink font-mono font-bold">
                      {(liveBase + liveIncentive).toLocaleString()} ج.م
                    </strong>
                  </div>

                  {/* أزرار الخطوة 2 */}
                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSalaryStep(1)}
                      className="!min-h-10 px-4 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowRight size={15} />
                      <span>السابق (الأساسي)</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSalaryStep(3)}
                      className="!min-h-10 px-5 text-xs font-bold flex items-center gap-2"
                    >
                      <span>{liveIncentive > 0 ? "المتابعة للخصومات" : "تخطي بدون حوافز"}</span>
                      <ArrowLeft size={15} />
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* الخطوة 3: الخصومات والاستقطاعات (تُخصم من الراتب) */}
              {/* ============================================================== */}
              {salaryStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  {/* بطاقة توجيهية */}
                  <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 leading-relaxed flex items-start gap-2.5">
                    <TrendingDown className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs">هل يوجد أي خصم أو استقطاع سلفة هذا الشهر؟</strong>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        هذه الخطوة اختيارية. إذا لم يكن هناك أي خصومات، يمكنك الضغط على &quot;تخطي بدون خصم&quot;.
                      </p>
                    </div>
                  </div>

                  {/* إدخال مبلغ الخصم */}
                  <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                        مبلغ الخصم أو الاستقطاع (ج.م)
                      </label>
                      {liveDeduction > 0 && (
                        <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-lg">
                          - {liveDeduction.toLocaleString()} ج.م يُخصم من الراتب
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={deductionAmountInput}
                        onChange={(e) => setDeductionAmountInput(e.target.value)}
                        placeholder="0 (اتركه 0 إذا لم يوجد خصم)"
                        className="field !pl-16 text-lg font-black text-rose-600"
                        autoFocus
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mute">
                        جنيه
                      </span>
                    </div>

                    {/* اختصارات مبالغ الخصومات السريعة */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-ink-mute font-bold">مبالغ سريعة:</span>
                      {[50, 100, 200, 300, 500].map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => setDeductionAmountInput(amt)}
                          className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border transition-colors ${
                            Number(deductionAmountInput) === amt
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-rose-500/5 text-rose-700 dark:text-rose-300 border-rose-500/20 hover:bg-rose-500/15"
                          }`}
                        >
                          -{amt} ج.م
                        </button>
                      ))}
                      {Number(deductionAmountInput) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeductionAmountInput("");
                            setDeductionReasonInput("");
                          }}
                          className="text-xs px-2 py-0.5 rounded-lg font-bold text-emerald-600 hover:bg-emerald-50"
                        >
                          إلغاء الخصم (0)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* سبب الخصم */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink">
                      سبب الخصم أو الاستقطاع {liveDeduction > 0 && <span className="text-rose-600">*</span>}
                    </label>
                    <input
                      type="text"
                      value={deductionReasonInput}
                      onChange={(e) => setDeductionReasonInput(e.target.value)}
                      placeholder="مثال: غياب يومين بدون عذر، تأخير، قسط سلفة..."
                      className="field text-xs"
                    />

                    {/* اقتراحات سريعة لسبب الخصم */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-ink-mute">اقتراحات شائعة:</span>
                      {["غياب بدون عذر", "تأخير متكرر", "استقطاع سلفة سابقة", "عدم إتمام ساعات العمل"].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setDeductionReasonInput(s)}
                          className="text-[10px] bg-bg-alt border border-line px-2 py-0.5 rounded-lg text-ink hover:border-rose-500/40 hover:text-rose-700 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* معاينة الصافي المتوقع */}
                  <div className="p-3 bg-bg-alt/60 rounded-xl border border-line flex items-center justify-between text-xs">
                    <span className="text-ink-mute">الصافي المتوقع (الأساسي + الحوافز - الخصومات):</span>
                    <strong className="text-ink font-mono font-bold">
                      {liveNetSalary.toLocaleString()} ج.م
                    </strong>
                  </div>

                  {/* أزرار الخطوة 3 */}
                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSalaryStep(2)}
                      className="!min-h-10 px-4 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowRight size={15} />
                      <span>السابق (الحوافز)</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSalaryStep(4)}
                      className="!min-h-10 px-5 text-xs font-bold flex items-center gap-2"
                    >
                      <span>{liveDeduction > 0 ? "المتابعة للمراجعة والاعتماد" : "تخطي بدون خصم"}</span>
                      <ArrowLeft size={15} />
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* الخطوة 4: المراجعة النهائية وتأكيد الصرف */}
              {/* ============================================================== */}
              {salaryStep === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  {/* كشف الحساب والنتيجة النهائية التلقائية */}
                  <div className="rounded-2xl border-2 border-brand/40 bg-gradient-to-br from-brand/10 via-surface to-surface overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-line/60 bg-brand/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-brand" />
                        <h4 className="font-black text-sm text-ink">كشف راتب المعلم: {selectedTeacherObj?.full_name || selectedTeacherUsername}</h4>
                      </div>
                      <span className="text-xs font-bold font-mono bg-brand-soft text-brand-ink px-2.5 py-0.5 rounded-full">
                        شهر {selectedMonth}
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3">
                      {/* تفاصيل الحسبة */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between text-ink-soft py-1 border-b border-line/50">
                          <span className="font-bold">1. الراتب الأساسي الشهري:</span>
                          <span className="font-mono font-bold text-ink">{liveBase.toLocaleString()} ج.م</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-line/50">
                          <span className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                            <TrendingUp size={14} />
                            2. الحوافز والمكافآت الإضافية:
                          </span>
                          <span className="font-mono font-bold text-emerald-600">
                            {liveIncentive > 0 ? `+ ${liveIncentive.toLocaleString()} ج.م` : "0 ج.م"}
                          </span>
                        </div>
                        {liveIncentive > 0 && incentiveReasonInput && (
                          <p className="text-[11px] text-ink-mute -mt-1 pr-5">سبب المكافأة: {incentiveReasonInput}</p>
                        )}

                        <div className="flex items-center justify-between py-1 border-b border-line/50">
                          <span className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                            <TrendingDown size={14} />
                            3. الخصومات والاستقطاعات:
                          </span>
                          <span className="font-mono font-bold text-rose-600">
                            {liveDeduction > 0 ? `- ${liveDeduction.toLocaleString()} ج.م` : "0 ج.م"}
                          </span>
                        </div>
                        {liveDeduction > 0 && deductionReasonInput && (
                          <p className="text-[11px] text-ink-mute -mt-1 pr-5">سبب الخصم: {deductionReasonInput}</p>
                        )}
                      </div>

                      {/* الصافي المستحق النهائي */}
                      <div className="mt-3 pt-3 border-t-2 border-dashed border-brand/30 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-ink-mute font-bold">الصافي الكلي المستحق للصرف:</p>
                          <p className="text-[11px] text-ink-mute">بعد إضافة الحوافز وخصم الاستقطاعات</p>
                        </div>
                        <div className="text-left">
                          <span className="text-2xl sm:text-3xl font-black text-brand-ink tracking-tight">
                            {liveNetSalary.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-ink-mute mr-1.5">جنيه مصري</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* خيارات حالة وتاريخ الصرف */}
                  <div className="bg-surface p-4 rounded-2xl border border-line space-y-3">
                    <label className="block text-xs font-bold text-ink">حالة الصرف لهذا الراتب:</label>

                    {/* خيارات الحالة كأزرار بطاقات سريعة */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "paid", label: "تم الصرف (مدفوع)", icon: CheckCircle2, activeColor: "bg-emerald-600 text-white border-emerald-600" },
                        { val: "unpaid", label: "بانتظار الصرف", icon: Clock, activeColor: "bg-amber-600 text-white border-amber-600" },
                        { val: "advance", label: "سلفة", icon: Banknote, activeColor: "bg-blue-600 text-white border-blue-600" },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = salaryStatusInput === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setSalaryStatusInput(item.val as any)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                              isSelected
                                ? item.activeColor + " shadow-xs ring-1"
                                : "bg-bg-alt/50 border-line text-ink-mute hover:text-ink hover:border-brand/40"
                            }`}
                          >
                            <Icon size={16} />
                            <span className="text-[11px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">تاريخ الصرف</label>
                        <input
                          type="date"
                          value={paidDateInput}
                          onChange={(e) => setPaidDateInput(e.target.value)}
                          className="field text-xs font-mono !py-1.5"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">ملاحظات إضافية (اختياري)</label>
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="ملاحظات تظهر بسجل المعلم..."
                          className="field text-xs !py-1.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* أزرار الخطوة 4 النهائية */}
                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSalaryStep(3)}
                      className="!min-h-10 px-4 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowRight size={15} />
                      <span>السابق (تعديل الخصومات)</span>
                    </Button>

                    <Button
                      type="submit"
                      loading={modalLoading}
                      size="sm"
                      className="!min-h-10 px-6 text-xs font-bold flex items-center gap-2"
                    >
                      <Check size={16} />
                      <span>تأكيد واعتماد الراتب رسميًا</span>
                    </Button>
                  </div>
                </div>
              )}
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
