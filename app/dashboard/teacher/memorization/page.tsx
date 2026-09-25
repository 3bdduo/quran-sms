"use client";

import { useEffect, useState } from "react";
import {
  BookMarked,
  Plus,
  Calendar,
  Award,
  Edit2,
  Trash2,
  X,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { memorizationApi, studentsApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { Student, MemorizationEntry } from "@/types";

export default function TeacherMemorizationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [logs, setLogs] = useState<MemorizationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MemorizationEntry | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    addedAmount: "",
    totalAfter: "",
    teacherNote: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const { showToast } = useToast();

  const isEduTeacher =
    user?.role === "teacher" &&
    (user.teacherType === "edu" || (Boolean(user.eduGroupId) && (!user.groupIds || user.groupIds.length === 0)));

  useEffect(() => {
    if (isEduTeacher) {
      router.replace("/dashboard/teacher/edu-groups");
    }
  }, [isEduTeacher, router]);

  useEffect(() => {
    studentsApi
      .listMine()
      .then((data) => {
        setStudents(data);
        if (data.length) setSelectedStudentId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadLogs() {
    if (!selectedStudentId) return;
    setLogsLoading(true);
    try {
      const data = await memorizationApi.findByStudent(selectedStudentId);
      setLogs(data);
    } catch {
      showToast("تعذّر تحميل سجل الحفظ", "error");
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [selectedStudentId]);

  async function handleSaveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) return;
    setFormLoading(true);
    try {
      if (editingEntry) {
        await memorizationApi.update(selectedStudentId, editingEntry.id, form);
        showToast("تم تحديث سجل التسميع", "success");
      } else {
        await memorizationApi.create(selectedStudentId, form);
        showToast("تم تسجيل التسميع الجديد وإخطار الطالب تلقائيًا", "success");
      }
      setShowAddModal(false);
      setEditingEntry(null);
      loadLogs();
      // Update local student memorized_amount
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudentId ? { ...s, memorized_amount: form.totalAfter } : s))
      );
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ التسميع", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      await memorizationApi.remove(selectedStudentId, entryId);
      showToast("تم حذف السجل بنجاح", "success");
      setLogs((prev) => prev.filter((l) => l.id !== entryId));
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">تسجيل التسميع والحفظ</h1>
          <p className="text-ink-mute text-sm mt-1">
            متابعة مقدار الحفظ اليومي للطلاب، تسجيل التسميع الجديد، وتحديث إجمالي المحفوظ
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingEntry(null);
            setForm({
              date: new Date().toISOString().slice(0, 10),
              addedAmount: "",
              totalAfter: selectedStudent?.memorized_amount || "",
              teacherNote: "",
            });
            setShowAddModal(true);
          }}
          disabled={!selectedStudentId}
          className="flex items-center gap-2"
        >
          <Plus size={17} />
          <span>تسجيل تسميع جديد</span>
        </Button>
      </div>

      {/* اختيار الطالب */}
      <div className="card !rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-ink-mute whitespace-nowrap">اختر الطالب:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="field field-select text-sm py-2 min-w-56"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (محفوظه: {s.memorized_amount || "0"})
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-ink-mute">
              السن: <span className="text-ink">{selectedStudent.age} سنة</span>
            </span>
            <span className="bg-gold-soft text-gold-ink px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Award size={14} /> إجمالي المحفوظ: {selectedStudent.memorized_amount || "0"}
            </span>
          </div>
        )}
      </div>

      {/* سجلات التسميع */}
      {logsLoading ? (
        <Loader size="lg" />
      ) : logs.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <BookMarked size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لا يوجد سجلات تسميع سابقة لهذا الطالب</p>
          <p className="text-xs mt-1">اضغط &quot;تسجيل تسميع جديد&quot; للبدء برصد مقدار حفظ الطالب</p>
        </div>
      ) : (
        <div className="card !rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">المقدار المسموع (الجديد)</th>
                  <th className="p-4 font-bold">إجمالي المحفوظ بعد التسميع</th>
                  <th className="p-4 font-bold">ملاحظات المعلم / التقييم</th>
                  <th className="p-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 text-xs font-mono font-bold text-ink whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="p-4 font-bold text-brand-ink whitespace-nowrap">
                      {log.added_amount}
                    </td>
                    <td className="p-4 text-ink-soft whitespace-nowrap">
                      <span className="bg-gold-soft text-gold-ink font-bold text-xs px-2.5 py-1 rounded-lg">
                        {log.total_after}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-ink-soft">{log.teacher_note || "-"}</td>
                    <td className="p-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingEntry(log);
                            setForm({
                              date: log.date,
                              addedAmount: log.added_amount,
                              totalAfter: log.total_after,
                              teacherNote: log.teacher_note || "",
                            });
                            setShowAddModal(true);
                          }}
                          className="p-1.5 rounded-lg text-ink-mute hover:text-brand-ink transition-colors"
                          title="تعديل السجل"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(log.id)}
                          className="p-1.5 rounded-lg text-ink-mute hover:text-danger-ink transition-colors"
                          title="حذف السجل"
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

      {/* Modal: تسجيل أو تعديل تسميع */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full sh-float border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="font-extrabold text-lg text-ink">
                {editingEntry ? "تعديل سجل التسميع" : "تسجيل تسميع جديد"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div>
                <label className="field-label">تاريخ التسميع *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">المقدار الجديد المسموع *</label>
                <input
                  required
                  value={form.addedAmount}
                  onChange={(e) => setForm({ ...form, addedAmount: e.target.value })}
                  className="field"
                  placeholder="مثال: سورة البقرة 1-50 / نصف حزب"
                />
              </div>

              <div>
                <label className="field-label">إجمالي المحفوظ الكلي للطالب الآن *</label>
                <input
                  required
                  value={form.totalAfter}
                  onChange={(e) => setForm({ ...form, totalAfter: e.target.value })}
                  className="field"
                  placeholder="مثال: جزءان ونصف / 5 أجزاء"
                />
              </div>

              <div>
                <label className="field-label">ملاحظات المعلم وتقييم التلاوة (اختياري)</label>
                <textarea
                  rows={3}
                  value={form.teacherNote}
                  onChange={(e) => setForm({ ...form, teacherNote: e.target.value })}
                  className="field resize-none leading-relaxed"
                  placeholder="ممتاز، يحتاج لضبط مخارج الحروف، تم إتقان التجويد..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  {editingEntry ? "حفظ التعديل" : "تسجيل التسميع"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
