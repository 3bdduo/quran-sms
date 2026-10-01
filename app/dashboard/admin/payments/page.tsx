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
  Pencil,
  X,
} from "lucide-react";
import { paymentsApi, groupsApi, settingsApi, teachersApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import type { GroupItem } from "@/types";

/* ================================================================
   Modal: تعديل قيمة اشتراك طالب واحد
================================================================ */
function EditStudentFeeModal({
  studentName,
  currentAmount,
  onConfirm,
  onClose,
}: {
  studentName: string;
  currentAmount: number;
  onConfirm: (newAmount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(currentAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card !rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-ink text-lg">تعديل قيمة الاشتراك</h2>
          <button onClick={onClose} className="text-ink-mute hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-ink-mute">
          الطالب: <span className="font-bold text-ink">{studentName}</span>
        </p>
        <div>
          <label className="field-label">القيمة الجديدة (جنيه)</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="field font-bold"
            autoFocus
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1"
            onClick={() => onConfirm(amount)}
          >
            حفظ
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Modal: تعديل قيمة اشتراك المجموعة كلها
================================================================ */
function EditGroupFeeModal({
  groupName,
  defaultAmount,
  onConfirm,
  onClose,
}: {
  groupName: string;
  defaultAmount: number;
  onConfirm: (newAmount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(defaultAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card !rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-ink text-lg">تعديل اشتراك المجموعة</h2>
          <button onClick={onClose} className="text-ink-mute hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-ink-mute">
          المجموعة: <span className="font-bold text-ink">{groupName}</span>
        </p>
        <p className="text-xs text-ink-mute">
          سيتم تطبيق هذه القيمة على جميع طلاب الحلقة لهذا الشهر.
        </p>
        <div>
          <label className="field-label">القيمة الجديدة (جنيه)</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="field font-bold"
            autoFocus
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button className="flex-1" onClick={() => onConfirm(amount)}>
            تطبيق على الكل
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   الصفحة الرئيسية
================================================================ */
export default function AdminPaymentsPage() {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState("");

  // القيمة الافتراضية من الإعدادات
  const [defaultFee, setDefaultFee] = useState(200);

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

  // Modal states
  const [editStudentModal, setEditStudentModal] = useState<{
    studentId: string;
    studentName: string;
    currentAmount: number;
  } | null>(null);
  const [editGroupModal, setEditGroupModal] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const { showToast } = useToast();

  // دالة توليد اسم الحلقة مميزاً باسم مستخدم المعلم
  function getGroupOptionLabel(g: GroupItem) {
    const teacher = teachers.find(
      (t) =>
        (g.teacherId && (t.id === g.teacherId || t._id === g.teacherId)) ||
        (g.teacherUsername && (t.username === g.teacherUsername || t.full_name === g.teacherName))
    );
    const username = g.teacherUsername || teacher?.username;

    let label = g.name || "";
    if (label && !label.startsWith("حلقة") && !label.startsWith("مجموعة") && g.teacherName) {
      label = `حلقة أ. ${label}`;
    }

    if (username) {
      return `${label} (${username})`;
    }
    return label;
  }

  // تحميل الإعدادات والمجموعات وقائمة المعلمين
  useEffect(() => {
    Promise.all([
      groupsApi.list(),
      settingsApi.get().catch(() => null),
      teachersApi.list().catch(() => []),
    ]).then(([list, settings, teachersList]) => {
      setGroups(list);
      setTeachers(teachersList || []);
      if (list.length) {
        setSelectedGroupId(list[0].id);
      }
      if (settings?.monthlyFee) setDefaultFee(settings.monthlyFee);
    });
  }, []);

  // تحديث اسم المجموعة المختارة عند تغييرها
  useEffect(() => {
    const g = groups.find((g) => g.id === selectedGroupId);
    if (g) setSelectedGroupName(getGroupOptionLabel(g));
  }, [selectedGroupId, groups, teachers]);

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

  // تغيير حالة الدفع — لكن المعفى لا يُغيّر تلقائيًا
  async function handleStatusChange(
    studentId: string,
    newStatus: "paid" | "unpaid" | "exempt",
    currentStatus: "paid" | "unpaid" | "exempt",
    currentAmount?: number
  ) {
    // الطالب المعفى لا يُغيَّر إلا يدوياً (بضغط معفى أو تغيير الإدمن)
    // أزرار مدفوع/غير مدفوع لا تؤثر على المعفى
    if (currentStatus === "exempt" && newStatus !== "exempt") return;

    try {
      await paymentsApi.updateMonth(studentId, monthKey, {
        status: newStatus,
        amount: currentAmount || defaultFee,
        paidDate: newStatus === "paid" ? new Date().toISOString().slice(0, 10) : undefined,
      });

      setStudentsPayments((prev) =>
        prev.map((s) =>
          s.student_id === studentId
            ? { ...s, status: newStatus, amount: currentAmount || defaultFee }
            : s
        )
      );

      paymentsApi.summary(monthKey).then(setSummary).catch(() => undefined);
      showToast("تم تحديث حالة الدفع", "success");
    } catch {
      showToast("تعذّر تحديث حالة الدفع", "error");
    }
  }

  // تعديل قيمة اشتراك طالب واحد
  async function handleEditStudentFee(newAmount: number) {
    if (!editStudentModal) return;
    const { studentId, currentAmount } = editStudentModal;
    const student = studentsPayments.find((s) => s.student_id === studentId);
    if (!student) return;

    try {
      await paymentsApi.updateMonth(studentId, monthKey, {
        status: student.status,
        amount: newAmount,
        paidDate: student.paid_date || undefined,
      });
      setStudentsPayments((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, amount: newAmount } : s))
      );
      paymentsApi.summary(monthKey).then(setSummary).catch(() => undefined);
      showToast("تم تعديل قيمة الاشتراك", "success");
    } catch {
      showToast("تعذّر تعديل قيمة الاشتراك", "error");
    } finally {
      setEditStudentModal(null);
    }
  }

  // تعديل قيمة اشتراك المجموعة كلها
  async function handleEditGroupFee(newAmount: number) {
    setEditGroupModal(false);
    setBulkUpdating(true);
    try {
      await Promise.all(
        studentsPayments.map((s) =>
          paymentsApi.updateMonth(s.student_id, monthKey, {
            status: s.status,
            amount: newAmount,
            paidDate: s.paid_date || undefined,
          })
        )
      );
      setStudentsPayments((prev) => prev.map((s) => ({ ...s, amount: newAmount })));
      paymentsApi.summary(monthKey).then(setSummary).catch(() => undefined);
      showToast(`تم تعديل قيمة الاشتراك لجميع طلاب ${selectedGroupName}`, "success");
    } catch {
      showToast("تعذّر تعديل قيمة اشتراك المجموعة", "error");
    } finally {
      setBulkUpdating(false);
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
    <>
      {/* Modals */}
      {editStudentModal && (
        <EditStudentFeeModal
          studentName={editStudentModal.studentName}
          currentAmount={editStudentModal.currentAmount}
          onConfirm={handleEditStudentFee}
          onClose={() => setEditStudentModal(null)}
        />
      )}
      {editGroupModal && (
        <EditGroupFeeModal
          groupName={selectedGroupName}
          defaultAmount={defaultFee}
          onConfirm={handleEditGroupFee}
          onClose={() => setEditGroupModal(false)}
        />
      )}

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
                    {getGroupOptionLabel(g)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-ink-mute">
              إجمالي طلاب الحلقة: {studentsPayments.length}
            </span>

            {/* زر تعديل اشتراك المجموعة كلها */}
            {studentsPayments.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditGroupModal(true)}
                disabled={bulkUpdating}
                className="flex items-center gap-1.5 text-xs"
              >
                {bulkUpdating ? <Spinner size={13} /> : <Pencil size={13} />}
                <span>تعديل اشتراك الحلقة</span>
              </Button>
            )}
          </div>
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
                    <th className="p-4 font-bold text-center w-12">م</th>
                    <th className="p-4 font-bold">اسم الطالب</th>
                    <th className="p-4 font-bold">قيمة الاشتراك</th>
                    <th className="p-4 font-bold">تاريخ الدفع</th>
                    <th className="p-4 font-bold text-center">حالة السداد للشهر</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsPayments.map((item, idx) => {
                    const isExempt = item.status === "exempt";
                    return (
                      <tr
                        key={item.student_id}
                        className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                      >
                        <td className="p-4 text-xs font-mono text-ink-mute text-center">{idx + 1}</td>
                        <td className="p-4 font-bold text-ink whitespace-nowrap">{item.student_name}</td>

                        {/* قيمة الاشتراك مع زر التعديل */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink-soft">
                              {item.amount ?? defaultFee} جنيه
                            </span>
                            {!isExempt && (
                              <button
                                type="button"
                                title="تعديل قيمة الاشتراك"
                                onClick={() =>
                                  setEditStudentModal({
                                    studentId: item.student_id,
                                    studentName: item.student_name,
                                    currentAmount: item.amount ?? defaultFee,
                                  })
                                }
                                className="p-1 rounded-lg text-ink-mute hover:text-brand-ink hover:bg-brand-soft transition-all"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-xs font-mono text-ink-mute whitespace-nowrap">
                          {item.paid_date || "-"}
                        </td>

                        {/* أزرار الحالة */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={isExempt}
                              onClick={() =>
                                handleStatusChange(item.student_id, "paid", item.status, item.amount ?? defaultFee)
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                item.status === "paid"
                                  ? "bg-brand text-on-brand shadow-sm"
                                  : isExempt
                                  ? "bg-bg-alt text-ink-mute/40 cursor-not-allowed"
                                  : "bg-bg-alt text-ink-mute hover:bg-brand-soft hover:text-brand-ink"
                              }`}
                            >
                              مدفوع
                            </button>

                            <button
                              type="button"
                              disabled={isExempt}
                              onClick={() =>
                                handleStatusChange(item.student_id, "unpaid", item.status, item.amount ?? defaultFee)
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                item.status === "unpaid"
                                  ? "bg-danger-solid text-white shadow-sm"
                                  : isExempt
                                  ? "bg-bg-alt text-ink-mute/40 cursor-not-allowed"
                                  : "bg-bg-alt text-ink-mute hover:bg-danger-soft hover:text-danger-ink"
                              }`}
                            >
                              غير مدفوع
                            </button>

                            {/* زر معفى — متاح دائماً للتبديل للمعفى أو منه */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  item.student_id,
                                  isExempt ? "unpaid" : "exempt",
                                  item.status,
                                  item.amount ?? defaultFee
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isExempt
                                  ? "bg-gold text-on-brand shadow-sm"
                                  : "bg-bg-alt text-ink-mute hover:bg-gold-soft hover:text-gold-ink"
                              }`}
                            >
                              {isExempt ? "معفى ✓" : "معفى"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
