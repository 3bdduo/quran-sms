"use client";

import { useState, useEffect } from "react";
import { Calendar, Save, Download, X, CalendarCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { downloadFile } from "@/lib/download";
import { eduAttendanceApi } from "@/lib/resources";
import type { EduGroupItem } from "@/types";

interface EduAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  eduGroup: EduGroupItem | null;
}

export function EduAttendanceModal({ isOpen, onClose, eduGroup }: EduAttendanceModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [attDate, setAttDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<
    { student_id: string; student_name: string; group_name?: string; status: string }[]
  >([]);

  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen || !eduGroup?.id) return;
    loadAttendance();
  }, [isOpen, eduGroup?.id, attDate]);

  async function loadAttendance() {
    if (!eduGroup?.id) return;
    setLoading(true);
    try {
      const existing = await eduAttendanceApi.find(eduGroup.id, attDate);
      const statusMap = Object.fromEntries(existing.map((e) => [e.student_id, e.status]));

      const list = (eduGroup.students || []).map((s) => ({
        student_id: s.studentId,
        student_name: s.studentName || s.studentId,
        group_name: s.groupName,
        status: statusMap[s.studentId] || "غائب",
      }));
      setRecords(list);
    } catch {
      showToast("تعذّر جلب بيانات الحضور", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleStatus(studentId: string, status: string) {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  }

  function handleSetAll(status: string) {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  }

  async function handleSave() {
    if (!eduGroup?.id || records.length === 0) return;
    setSaving(true);
    try {
      const payload = records.map((r) => ({
        studentId: r.student_id,
        status: r.status,
      }));
      await eduAttendanceApi.record(eduGroup.id, attDate, payload);
      showToast("تم حفظ سجل الحضور والغياب بنجاح", "success");
    } catch {
      showToast("تعذّر حفظ الحضور", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!eduGroup?.id) return;
    try {
      await downloadFile(
        `/exports/edu-groups/${eduGroup.id}/attendance.xlsx?date=${attDate}`,
        `حضور-${eduGroup.name}-${attDate}.xlsx`
      );
    } catch {
      showToast("تعذّر تصدير ملف الحضور", "error");
    }
  }

  if (!isOpen || !eduGroup) return null;

  const presentCount = records.filter((r) => r.status === "حاضر").length;
  const absentCount = records.filter((r) => r.status === "غائب").length;
  const lateCount = records.filter((r) => r.status === "متأخر").length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-surface rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col sh-float border border-line overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between bg-bg-alt/40">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="text-brand" size={22} />
              <h2 className="font-extrabold text-lg sm:text-xl text-ink">
                حضور وغياب: <span className="text-brand-ink">{eduGroup.name}</span>
              </h2>
            </div>
            <p className="text-xs text-ink-mute mt-1">
              تسجيل حضور الطلاب في المادة التربوية وحفظ ومتابعة الغياب
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-mute hover:text-ink hover:bg-bg-alt rounded-2xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls bar */}
        <div className="p-4 sm:p-6 pb-4 border-b border-line bg-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-ink-mute" />
              <span className="text-xs font-bold text-ink">التاريخ:</span>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="field !py-1.5 text-sm font-mono w-44"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-1.5 !text-xs font-bold"
              >
                <Download size={14} />
                <span>تصدير Excel</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                loading={saving}
                className="flex items-center gap-1.5 !text-xs font-bold"
              >
                <Save size={14} />
                <span>حفظ الحضور</span>
              </Button>
            </div>
          </div>

          {/* Quick stats and bulk buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                <CheckCircle2 size={15} /> حاضر: {presentCount}
              </span>
              <span className="flex items-center gap-1 font-bold text-red-500 dark:text-red-400">
                <XCircle size={15} /> غائب: {absentCount}
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Clock size={15} /> متأخر: {lateCount}
              </span>
              <span className="text-ink-mute font-bold">
                (إجمالي: {records.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetAll("حاضر")}
                className="px-2.5 py-1 rounded-xl bg-green-500/10 text-green-700 dark:text-green-300 font-bold hover:bg-green-500/20 transition-colors"
              >
                الكل حاضر
              </button>
              <button
                type="button"
                onClick={() => handleSetAll("غائب")}
                className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-600 dark:text-red-300 font-bold hover:bg-red-500/20 transition-colors"
              >
                الكل غائب
              </button>
            </div>
          </div>
        </div>

        {/* List of students */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
          {loading ? (
            <div className="py-16 text-center">
              <Loader size="lg" />
              <p className="text-xs text-ink-mute mt-3">جاري تحميل سجل الحضور...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-ink-mute">
              <p className="font-bold text-lg text-ink">لا يوجد طلاب في هذه المجموعة بعد</p>
              <p className="text-xs mt-1">أضف طلاباً للمجموعة أولاً لتتمكن من رصد الحضور والغياب</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r, idx) => (
                <div
                  key={r.student_id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-line bg-surface hover:bg-bg-alt/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-ink-mute w-6 text-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-ink">{r.student_name}</h4>
                      {r.group_name && (
                        <span className="text-xs text-ink-mute">حلقة: {r.group_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStatus(r.student_id, "حاضر")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        r.status === "حاضر"
                          ? "bg-green-600 text-white shadow-sm ring-2 ring-green-600/30"
                          : "bg-bg-alt text-ink-mute hover:bg-green-500/15 hover:text-green-600"
                      }`}
                    >
                      حاضر
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatus(r.student_id, "غائب")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        r.status === "غائب"
                          ? "bg-red-600 text-white shadow-sm ring-2 ring-red-600/30"
                          : "bg-bg-alt text-ink-mute hover:bg-red-500/15 hover:text-red-600"
                      }`}
                    >
                      غائب
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatus(r.student_id, "متأخر")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        r.status === "متأخر"
                          ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30"
                          : "bg-bg-alt text-ink-mute hover:bg-amber-500/15 hover:text-amber-600"
                      }`}
                    >
                      متأخر
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-line flex items-center justify-between bg-bg-alt/30">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button onClick={handleSave} loading={saving} className="flex items-center gap-2">
            <Save size={16} />
            <span>حفظ الحضور</span>
          </Button>
        </div>

      </div>
    </div>
  );
}
