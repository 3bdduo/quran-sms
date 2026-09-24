"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  GraduationCap,
  CalendarCheck,
  Trophy,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Calendar,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { eduGroupsApi, eduAttendanceApi, examsApi, studentsApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { EduGroupItem, ExamItem, Student } from "@/types";

export default function TeacherEduGroupsPage() {
  const { user } = useAuth();
  const [eduGroup, setEduGroup] = useState<EduGroupItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"attendance" | "exams">("attendance");

  // Attendance State
  const today = new Date().toISOString().slice(0, 10);
  const [attDate, setAttDate] = useState(today);
  const [attRecords, setAttRecords] = useState<
    { student_id: string; student_name: string; status: string }[]
  >([]);
  const [savingAtt, setSavingAtt] = useState(false);

  // Exams State
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "",
    maxScore: 100,
    date: today,
    scores: [] as { studentId: string; score: number }[],
  });

  const { showToast } = useToast();

  async function loadData() {
    if (!user?.eduGroupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const gData = await eduGroupsApi.byId(user.eduGroupId);
      setEduGroup(gData);

      // Load exams
      const examData = await examsApi.findByEduGroup(user.eduGroupId);
      setExams(examData);

      // Load attendance for date
      const existing = await eduAttendanceApi.find(user.eduGroupId, attDate);
      const statusMap = Object.fromEntries(existing.map((e) => [e.student_id, e.status]));

      const list = (gData.students || []).map((s) => ({
        student_id: s.studentId,
        student_name: s.studentName || s.studentId,
        status: statusMap[s.studentId] || "غائب",
      }));
      setAttRecords(list);
    } catch {
      showToast("تعذّر تحميل بيانات المجموعة التعليمية", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.eduGroupId, attDate]);

  function handleAttStatus(studentId: string, status: string) {
    setAttRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  }

  async function handleSaveAttendance() {
    if (!user?.eduGroupId || !attRecords.length) return;
    setSavingAtt(true);
    try {
      const payload = attRecords.map((r) => ({
        studentId: r.student_id,
        status: r.status,
      }));
      await eduAttendanceApi.record(user.eduGroupId, attDate, payload);
      showToast("تم حفظ حضور المجموعة التعليمية", "success");
    } catch {
      showToast("تعذّر حفظ الحضور", "error");
    } finally {
      setSavingAtt(false);
    }
  }

  function openExamModal() {
    if (!eduGroup) return;
    setExamForm({
      name: "",
      maxScore: 100,
      date: today,
      scores: (eduGroup.students || []).map((s) => ({ studentId: s.studentId, score: 0 })),
    });
    setShowAddExamModal(true);
  }

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.eduGroupId) return;
    try {
      await examsApi.create(user.eduGroupId, examForm);
      showToast("تم رصد الامتحان وإخطار الطلاب بالنتائج", "success");
      setShowAddExamModal(false);
      examsApi.findByEduGroup(user.eduGroupId).then(setExams);
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ الامتحان", "error");
    }
  }

  async function handleDeleteExam(examId: string) {
    if (!user?.eduGroupId) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا الامتحان؟")) return;
    try {
      await examsApi.remove(user.eduGroupId, examId);
      showToast("تم حذف الامتحان", "success");
      setExams((prev) => prev.filter((e) => e.examId !== examId));
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  if (loading) return <Loader size="lg" />;

  if (!user?.eduGroupId) {
    return (
      <div className="card !rounded-2xl p-12 text-center text-ink-mute max-w-2xl mx-auto space-y-3">
        <GraduationCap size={44} className="mx-auto text-ink-mute/50" />
        <h2 className="font-extrabold text-xl text-ink">لست مسندًا لمجموعة تعليمية حاليًا</h2>
        <p className="text-xs text-ink-mute leading-relaxed">
          حسابك مسند لحلقة تحفيظ قرآن رئيسية. المجموعات التعليمية الإضافية (مثل التجويد أو الفقه أو
          النحو) تسندها إدارة المدرسة عند بدء البرامج المتخصصة.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
              المجموعة: {eduGroup?.name}
            </h1>
            <span className="text-xs font-bold bg-brand-soft text-brand-ink px-3 py-1 rounded-full">
              {eduGroup?.students?.length || 0} طالب
            </span>
          </div>
          <p className="text-ink-mute text-sm mt-1">
            تسجيل حضور المجموعة التعليمية ورصد امتحانات الطلاب
          </p>
        </div>

        {tab === "attendance" ? (
          <Button onClick={handleSaveAttendance} loading={savingAtt} className="flex items-center gap-2">
            {!savingAtt && <Save size={16} />}
            <span>حفظ الحضور</span>
          </Button>
        ) : (
          <Button onClick={openExamModal} className="flex items-center gap-2">
            <Plus size={16} />
            <span>رصد امتحان جديد</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab("attendance")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "attendance"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <CalendarCheck size={18} />
          <span>كشف الحضور والغياب</span>
        </button>

        <button
          onClick={() => setTab("exams")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "exams"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Trophy size={18} />
          <span>امتحانات المجموعة ({exams.length})</span>
        </button>
      </div>

      {tab === "attendance" ? (
        <div className="space-y-4">
          <div className="card !rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-ink-mute" />
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="field text-sm py-2 font-mono"
              />
            </div>
            <span className="text-xs font-bold text-ink-mute">
              حضور: {attRecords.filter((r) => r.status === "حاضر").length} / غياب:{" "}
              {attRecords.filter((r) => r.status === "غائب").length}
            </span>
          </div>

          {!attRecords.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <Users size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لا يوجد طلاب مسجلون في هذه المجموعة بعد</p>
            </div>
          ) : (
            <div className="card !rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                      <th className="p-4 font-bold">اسم الطالب</th>
                      <th className="p-4 font-bold text-center">حالة الحضور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attRecords.map((r) => (
                      <tr
                        key={r.student_id}
                        className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                      >
                        <td className="p-4 font-bold text-ink">{r.student_name}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAttStatus(r.student_id, "حاضر")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                r.status === "حاضر"
                                  ? "bg-brand text-on-brand shadow-sm"
                                  : "bg-bg-alt text-ink-mute hover:bg-brand-soft"
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttStatus(r.student_id, "غائب")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                r.status === "غائب"
                                  ? "bg-danger-solid text-white shadow-sm"
                                  : "bg-bg-alt text-ink-mute hover:bg-danger-soft"
                              }`}
                            >
                              غائب
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
      ) : (
        /* تبويب الامتحانات */
        <div className="space-y-4">
          {!exams.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <Trophy size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لم يتم رصد أي اختبارات لهذه المجموعة بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((ex) => (
                <div key={ex.examId} className="card !rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div>
                      <h3 className="font-extrabold text-lg text-ink">{ex.name}</h3>
                      <p className="text-xs text-ink-mute mt-0.5">
                        التاريخ: {ex.date} — النهاية العظمى: {ex.maxScore} درجة
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(ex.examId)}
                      className="p-2 text-ink-mute hover:text-danger-ink rounded-lg"
                      title="حذف الامتحان"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ex.results.map((r) => (
                      <div
                        key={r.student_id}
                        className="bg-bg-alt/70 rounded-xl p-3 flex items-center justify-between"
                      >
                        <span className="text-sm font-bold text-ink">{r.student_name}</span>
                        <span className="font-extrabold text-brand-ink text-sm">
                          {r.score} / {ex.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: رصد امتحان جديد */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full sh-float border border-line max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg text-ink mb-4">رصد امتحان جديد للمجموعة</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">اسم الامتحان *</label>
                  <input
                    required
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    className="field"
                    placeholder="امتحان منتصف الفصل"
                  />
                </div>
                <div>
                  <label className="field-label">الدرجة العظمى *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={examForm.maxScore}
                    onChange={(e) =>
                      setExamForm({ ...examForm, maxScore: Number(e.target.value) })
                    }
                    className="field font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">تاريخ الامتحان</label>
                <input
                  type="date"
                  required
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  className="field"
                />
              </div>

              <div className="pt-2">
                <label className="field-label mb-2 block">رصد درجات طلاب المجموعة:</label>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {examForm.scores.map((sc, i) => {
                    const st = (eduGroup?.students || []).find((s) => s.studentId === sc.studentId);
                    return (
                      <div
                        key={sc.studentId}
                        className="flex items-center justify-between gap-3 bg-bg-alt/70 p-2.5 rounded-xl"
                      >
                        <span className="text-sm font-bold text-ink">
                          {st?.studentName || sc.studentId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={examForm.maxScore}
                            value={sc.score}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setExamForm((prev) => ({
                                ...prev,
                                scores: prev.scores.map((s, idx) =>
                                  idx === i ? { ...s, score: val } : s
                                ),
                              }));
                            }}
                            className="field w-20 text-center py-1 font-bold"
                          />
                          <span className="text-xs text-ink-mute">/ {examForm.maxScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddExamModal(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">تسجيل الامتحان</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
