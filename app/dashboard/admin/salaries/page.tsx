"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Calendar,
  Settings,
  History,
  Edit2,
  Trash2,
  X,
  CreditCard,
} from "lucide-react";
import { salariesApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import type { SalaryMonthSummary, TeacherSalaryConfig } from "@/types";

export default function AdminSalariesPage() {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [tab, setTab] = useState<"month" | "configs">("month");
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  const [monthSummary, setMonthSummary] = useState<SalaryMonthSummary | null>(null);
  const [teacherConfigs, setTeacherConfigs] = useState<TeacherSalaryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Modal: ضبط الراتب الأساسي
  const [editingConfig, setEditingConfig] = useState<TeacherSalaryConfig | null>(null);
  const [baseSalaryInput, setBaseSalaryInput] = useState<number>(1500);
  const [notesInput, setNotesInput] = useState("");

  // Modal: تسجيل الصرف الشهري
  const [payingTeacher, setPayingTeacher] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payStatus, setPayStatus] = useState<"paid" | "unpaid" | "advance">("paid");
  const [payNote, setPayNote] = useState("");

  // Modal: سجل المعلم
  const [historyTeacher, setHistoryTeacher] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      if (tab === "month") {
        const data = await salariesApi.byMonth(monthKey);
        setMonthSummary(data);
      } else {
        const configs = await salariesApi.teachers();
        setTeacherConfigs(configs);
      }
    } catch {
      showToast("تعذّر تحميل بيانات الرواتب", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tab, monthKey]);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!editingConfig) return;
    try {
      await salariesApi.setConfig(editingConfig.username, {
        baseSalary: Number(baseSalaryInput),
        notes: notesInput,
      });
      showToast("تم تحديث الراتب الأساسي للمعلم", "success");
      setEditingConfig(null);
      loadData();
    } catch {
      showToast("تعذّر تحديث الراتب الأساسي", "error");
    }
  }

  async function handleSavePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!payingTeacher) return;
    try {
      await salariesApi.setMonth(payingTeacher.username, monthKey, {
        status: payStatus,
        amount: Number(payAmount),
        paidDate: payStatus === "paid" ? new Date().toISOString().slice(0, 10) : undefined,
        note: payNote,
      });
      showToast("تم تسجيل صرف الراتب", "success");
      setPayingTeacher(null);
      loadData();
    } catch {
      showToast("تعذّر تسجيل الصرف", "error");
    }
  }

  async function handleDeleteMonthRecord(username: string) {
    if (!window.confirm(`هل أنت متأكد من حذف سجل راتب "${username}" لهذا الشهر؟`)) return;
    try {
      await salariesApi.deleteMonth(username, monthKey);
      showToast("تم حذف السجل", "success");
      loadData();
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  async function openHistory(username: string) {
    setHistoryTeacher(username);
    setHistoryLoading(true);
    try {
      const records = await salariesApi.history(username);
      setHistoryRecords(records);
    } catch {
      showToast("تعذّر تحميل سجل الرواتب", "error");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      await downloadFile(`/exports/salaries/${monthKey}.xlsx`, `تقرير-الرواتب-${monthKey}.xlsx`);
      showToast("تم تنزيل تقرير الرواتب بنجاح", "success");
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">رواتب المعلمين</h1>
          <p className="text-ink-mute text-sm mt-1">
            إدارة الرواتب الأساسية ومتابعة الصرف الشهري وسجل المستحقات
          </p>
        </div>

        {tab === "month" && (
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            {exporting ? <Spinner size={16} /> : <FileSpreadsheet size={16} />}
            <span>تصدير تقرير الرواتب (Excel)</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab("month")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "month"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Calendar size={18} />
          <span>مسير رواتب الشهر</span>
        </button>

        <button
          onClick={() => setTab("configs")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "configs"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Settings size={18} />
          <span>إعدادات الرواتب الأساسية</span>
        </button>
      </div>

      {tab === "month" ? (
        <>
          {/* الإحصائيات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Banknote}
              label="إجمالي المنصرف"
              value={`${monthSummary?.totalPaidAmount ?? 0} جنيه`}
              tone="gold"
            />
            <StatCard
              icon={CheckCircle2}
              label="تم الصرف لهم"
              value={monthSummary?.paidCount ?? 0}
              delay={0.08}
            />
            <StatCard
              icon={XCircle}
              label="متبقي بدون صرف"
              value={monthSummary?.unpaidCount ?? 0}
              delay={0.16}
            />
            <StatCard
              icon={CreditCard}
              label="سلف مدفوعة"
              value={monthSummary?.advanceCount ?? 0}
              tone="gold"
              delay={0.24}
            />
          </div>

          {/* فلتر الشهر */}
          <div className="card !rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-ink-mute" />
              <input
                type="month"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="field text-sm py-2 font-mono"
              />
            </div>
            <span className="text-xs font-bold text-ink-mute">
              عدد المعلمين: {monthSummary?.totalTeachers ?? 0}
            </span>
          </div>

          {/* جدول الرواتب الشهرية */}
          {loading ? (
            <Loader size="lg" />
          ) : !monthSummary?.teachers?.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <Banknote size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لم يتم تسجيل معلمين في النظام بعد</p>
            </div>
          ) : (
            <div className="card !rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                      <th className="p-4 font-bold">المعلم</th>
                      <th className="p-4 font-bold">الراتب الأساسي</th>
                      <th className="p-4 font-bold">المبلغ المصروف</th>
                      <th className="p-4 font-bold">تاريخ الصرف</th>
                      <th className="p-4 font-bold">الحالة</th>
                      <th className="p-4 font-bold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthSummary.teachers.map((t) => (
                      <tr
                        key={t.username}
                        className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                      >
                        <td className="p-4 font-bold text-ink whitespace-nowrap">{t.username}</td>
                        <td className="p-4 text-ink-soft whitespace-nowrap">
                          {t.baseSalary || 0} جنيه
                        </td>
                        <td className="p-4 font-bold text-brand-ink whitespace-nowrap">
                          {t.amount || 0} جنيه
                        </td>
                        <td className="p-4 text-xs font-mono text-ink-mute whitespace-nowrap">
                          {t.paidDate || "-"}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              t.status === "paid"
                                ? "bg-brand-soft text-brand-ink"
                                : t.status === "advance"
                                ? "bg-gold-soft text-gold-ink"
                                : "bg-danger-soft text-danger-ink"
                            }`}
                          >
                            {t.status === "paid"
                              ? "تم الصرف"
                              : t.status === "advance"
                              ? "سلفة"
                              : "لم يُصرف"}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPayingTeacher(t);
                                setPayAmount(t.amount || t.baseSalary || 0);
                                setPayStatus(t.status || "paid");
                                setPayNote("");
                              }}
                              className="text-xs"
                            >
                              تسجيل الصرف
                            </Button>

                            <button
                              onClick={() => openHistory(t.username)}
                              title="سجل الرواتب السابقة"
                              className="p-2 rounded-lg bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors"
                            >
                              <History size={15} />
                            </button>

                            <button
                              onClick={() => handleDeleteMonthRecord(t.username)}
                              title="حذف سجل هذا الشهر"
                              className="p-2 rounded-lg bg-bg-alt hover:bg-danger-soft text-ink-soft hover:text-danger-ink transition-colors"
                            >
                              <Trash2 size={15} />
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
        </>
      ) : (
        /* تبويب إعدادات الرواتب الأساسية */
        <div>
          {loading ? (
            <Loader size="lg" />
          ) : (
            <div className="card !rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                      <th className="p-4 font-bold">اسم مستخدم المعلم</th>
                      <th className="p-4 font-bold">الراتب الأساسي المعتمد</th>
                      <th className="p-4 font-bold">ملاحظات</th>
                      <th className="p-4 font-bold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherConfigs.map((tc) => (
                      <tr
                        key={tc.username}
                        className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                      >
                        <td className="p-4 font-bold text-ink">{tc.username}</td>
                        <td className="p-4 font-bold text-brand-ink">
                          {tc.base_salary} جنيه
                        </td>
                        <td className="p-4 text-xs text-ink-soft">{tc.notes || "-"}</td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingConfig(tc);
                              setBaseSalaryInput(tc.base_salary);
                              setNotesInput(tc.notes || "");
                            }}
                            className="flex items-center gap-1.5 text-xs mx-auto"
                          >
                            <Edit2 size={14} />
                            <span>تعديل الراتب</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: تعديل الراتب الأساسي */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-sm w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-1">تحديد الراتب الأساسي</h3>
            <p className="text-xs text-ink-mute mb-4">للمعلم: {editingConfig.username}</p>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="field-label">الراتب الأساسي (بالجنيه)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={baseSalaryInput}
                  onChange={(e) => setBaseSalaryInput(Number(e.target.value))}
                  className="field"
                />
              </div>
              <div>
                <label className="field-label">ملاحظات (اختياري)</label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="field resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setEditingConfig(null)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ التعديل</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: تسجيل الصرف الشهري */}
      {payingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-md w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-1">تسجيل صرف الراتب</h3>
            <p className="text-xs text-ink-mute mb-4">
              للمعلم: {payingTeacher.username} — لشهر {monthKey}
            </p>
            <form onSubmit={handleSavePayout} className="space-y-4">
              <div>
                <label className="field-label">حالة الصرف</label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value as any)}
                  className="field field-select text-sm"
                >
                  <option value="paid">تم الصرف بالكامل</option>
                  <option value="advance">سلفة من الراتب</option>
                  <option value="unpaid">غير منصرف</option>
                </select>
              </div>

              <div>
                <label className="field-label">المبلغ المصروف (بالجنيه)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">ملاحظات الصرف</label>
                <input
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="field"
                  placeholder="مثال: نقدي عن طريق الإدارة"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" type="button" onClick={() => setPayingTeacher(null)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ الصرف</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: سجل المعلم السنوي */}
      {historyTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full sh-float border border-line max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-ink">سجل صرف الرواتب</h3>
                <p className="text-xs text-ink-mute">للمعلم: {historyTeacher}</p>
              </div>
              <button
                onClick={() => setHistoryTeacher(null)}
                className="p-2 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {historyLoading ? (
              <Loader />
            ) : !historyRecords.length ? (
              <p className="text-center text-ink-mute py-8">لا يوجد سجلات صرف مسجلة لهذا المعلم</p>
            ) : (
              <div className="divide-y divide-line">
                {historyRecords.map((r, i) => (
                  <div key={i} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-ink">شهر {r.month_key}</p>
                      <p className="text-xs text-ink-mute mt-0.5">
                        تاريخ الصرف: {r.paid_date || "غير محدد"}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-brand-ink">{r.amount} جنيه</span>
                      <span
                        className={`block text-[11px] font-bold ${
                          r.status === "paid" ? "text-brand-ink" : "text-gold-ink"
                        }`}
                      >
                        {r.status === "paid" ? "مصروف" : "سلفة"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
