"use client";

import { useEffect, useState, useMemo } from "react";
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
  Download,
  Clock,
  BookMarked,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { eduGroupsApi, eduAttendanceApi, examsApi, studentsApi, groupsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { StudentSelectorModal } from "@/components/edu/StudentSelectorModal";
import type { EduGroupItem, ExamItem, Student, GroupItem } from "@/types";

export default function TeacherEduGroupsPage() {
  const { user } = useAuth();
  const [eduGroup, setEduGroup] = useState<EduGroupItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students" | "attendance" | "exams">("students");

  // Students Pool (من الحلقات كلها)
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allGroups, setAllGroups] = useState<GroupItem[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  // Attendance State
  const today = new Date().toISOString().slice(0, 10);
  const [attDate, setAttDate] = useState(today);
  const [attRecords, setAttRecords] = useState<
    { student_id: string; student_name: string; group_name?: string; status: string }[]
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
        group_name: s.groupName,
        status: statusMap[s.studentId] || "غائب",
      }));
      setAttRecords(list);
    } catch {
      showToast("تعذّر تحميل بيانات المجموعة التربوية", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadPool() {
    setLoadingPool(true);
    try {
      const [students, groups] = await Promise.all([
        studentsApi.list(),
        groupsApi.list(),
      ]);
      setAllStudents(students);
      setAllGroups(groups);
    } catch {
      // quiet fail
    } finally {
      setLoadingPool(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.eduGroupId, attDate]);

  useEffect(() => {
    if (user?.eduGroupId) {
      loadPool();
    }
  }, [user?.eduGroupId]);

  const enrolledIdsSet = useMemo(() => {
    if (!eduGroup?.students) return new Set<string>();
    return new Set(eduGroup.students.map((s) => s.studentId));
  }, [eduGroup]);

  async function handleAddStudent(studentId: string) {
    if (!user?.eduGroupId) return;
    try {
      await eduGroupsApi.addStudent(user.eduGroupId, studentId);
      showToast("تمت إضافة الطالب للمجموعة التربوية بنجاح", "success");
      const updated = await eduGroupsApi.byId(user.eduGroupId);
      setEduGroup(updated);
    } catch (err: any) {
      showToast(err.message || "تعذّر إضافة الطالب", "error");
    }
  }

  async function handleBulkAddStudents(studentIds: string[]) {
    if (!user?.eduGroupId || !studentIds.length) return;
    try {
      await eduGroupsApi.bulkAddStudents(user.eduGroupId, studentIds);
      showToast(`تمت إضافة ${studentIds.length} طالب للمجموعة بنجاح`, "success");
      const updated = await eduGroupsApi.byId(user.eduGroupId);
      setEduGroup(updated);
      setShowStudentPicker(false);
    } catch (err: any) {
      showToast(err.message || "تعذّر إضافة الطلاب", "error");
    }
  }

  async function handleRemoveStudent(studentId: string, studentName: string) {
    if (!user?.eduGroupId) return;
    if (!window.confirm(`هل أنت متأكد من حذف الطالب "${studentName}" من المجموعة التربوية؟`)) return;
    try {
      await eduGroupsApi.removeStudent(user.eduGroupId, studentId);
      showToast("تم حذف الطالب من المجموعة", "success");
      const updated = await eduGroupsApi.byId(user.eduGroupId);
      setEduGroup(updated);
    } catch {
      showToast("تعذّر حذف الطالب", "error");
    }
  }

  function handleAttStatus(studentId: string, status: string) {
    setAttRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  }

  function handleSetAllAtt(status: string) {
    setAttRecords((prev) => prev.map((r) => ({ ...r, status })));
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
      showToast("تم حفظ حضور المجموعة التربوية بنجاح", "success");
    } catch {
      showToast("تعذّر حفظ الحضور", "error");
    } finally {
      setSavingAtt(false);
    }
  }

  async function handleExportStudents() {
    if (!user?.eduGroupId || !eduGroup) return;
    try {
      await downloadFile(`/exports/edu-groups/${user.eduGroupId}/students.xlsx`, `طلاب-${eduGroup.name}.xlsx`);
    } catch {
      showToast("تعذّر تصدير ملف الطلاب", "error");
    }
  }

  async function handleExportAttendance() {
    if (!user?.eduGroupId || !eduGroup) return;
    try {
      await downloadFile(
        `/exports/edu-groups/${user.eduGroupId}/attendance.xlsx?date=${attDate}`,
        `حضور-${eduGroup.name}-${attDate}.xlsx`
      );
    } catch {
      showToast("تعذّر تصدير ملف الحضور", "error");
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

  if (loading) return <Loader size="lg" className="my-16" />;

  if (!user?.eduGroupId) {
    return (
      <div className="card !rounded-2xl p-12 text-center text-ink-mute max-w-2xl mx-auto space-y-4 border border-line">
        <GraduationCap size={48} className="mx-auto text-ink-mute/50" />
        <h2 className="font-black text-2xl text-ink">لست مسنداً لمجموعة تربوية حالياً</h2>
        <p className="text-sm text-ink-mute leading-relaxed">
          حسابك مسند لحلقة تحفيظ قرآن رئيسية. تقوم إدارة المدرسة بإسناد مجموعات التربوي المتخصصة
          عند بدء الدورات والبرامج التربوية.
        </p>
      </div>
    );
  }

  const presentCount = attRecords.filter((r) => r.status === "حاضر").length;
  const absentCount = attRecords.filter((r) => r.status === "غائب").length;
  const lateCount = attRecords.filter((r) => r.status === "متأخر").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-ink">
              مجموعة: {eduGroup?.name}
            </h1>
            <span className="text-xs font-bold bg-brand-soft text-brand-ink px-3 py-1 rounded-full font-mono">
              {eduGroup?.students?.length || 0} طالب
            </span>
          </div>
          <p className="text-ink-mute text-sm mt-1">
            إدارة طلاب المجموعة واختيارهم من الحلقات، تسجيل الحضور والغياب، ورصد الامتحانات
          </p>
        </div>

        {tab === "students" ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportStudents} className="flex items-center gap-2">
              <Download size={16} />
              <span>تصدير الطلاب Excel</span>
            </Button>
            <Button onClick={() => setShowStudentPicker(true)} className="flex items-center gap-2">
              <Plus size={16} />
              <span>+ إضافة طلاب من الحلقات</span>
            </Button>
          </div>
        ) : tab === "attendance" ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportAttendance} className="flex items-center gap-2">
              <Download size={16} />
              <span>تصدير الحضور Excel</span>
            </Button>
            <Button onClick={handleSaveAttendance} loading={savingAtt} className="flex items-center gap-2">
              {!savingAtt && <Save size={16} />}
              <span>حفظ الحضور</span>
            </Button>
          </div>
        ) : (
          <Button onClick={openExamModal} className="flex items-center gap-2">
            <Plus size={16} />
            <span>رصد امتحان جديد</span>
          </Button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-line gap-2 overflow-x-auto">
        <button
          onClick={() => setTab("students")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
            tab === "students"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Users size={18} />
          <span>طلاب المجموعة ({eduGroup?.students?.length || 0})</span>
        </button>

        <button
          onClick={() => setTab("attendance")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
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
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
            tab === "exams"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Trophy size={18} />
          <span>امتحانات المجموعة ({exams.length})</span>
        </button>
      </div>

      {/* TAB 1: Enrolled Students */}
      {tab === "students" && (
        <div className="space-y-4">
          {!eduGroup?.students || eduGroup.students.length === 0 ? (
            <div className="card !rounded-2xl p-16 text-center text-ink-mute border border-line space-y-4">
              <Users size={48} className="mx-auto text-ink-mute/40" />
              <div>
                <h3 className="font-black text-xl text-ink">لا يوجد طلاب مسجلون في مجموعتك بعد</h3>
                <p className="text-xs text-ink-mute mt-1.5 max-w-md mx-auto">
                  يمكنك الآن إضافة الطلاب مباشرة من حلقات التحفيظ، حيث يتم تقسيمهم تلقائياً إلى شباب
                  وبنات ومصنفين أبجدياً.
                </p>
              </div>
              <Button onClick={() => setShowStudentPicker(true)} className="flex items-center gap-2 mx-auto">
                <Plus size={16} />
                <span>اختيار طلاب من الحلقات الآن</span>
              </Button>
            </div>
          ) : (
            <div className="card !rounded-2xl overflow-hidden border border-line shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute text-xs">
                      <th className="p-4 font-bold">م</th>
                      <th className="p-4 font-bold">اسم الطالب</th>
                      <th className="p-4 font-bold">النوع</th>
                      <th className="p-4 font-bold">الرقم القومي</th>
                      <th className="p-4 font-bold">حلقة القرآن الأصلية</th>
                      <th className="p-4 font-bold">الهاتف</th>
                      <th className="p-4 font-bold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eduGroup.students.map((st, idx) => (
                      <tr
                        key={st.studentId}
                        className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                      >
                        <td className="p-4 font-mono text-xs text-ink-mute">{idx + 1}</td>
                        <td className="p-4 font-bold text-ink">{st.studentName}</td>
                        <td className="p-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              st.gender === "female"
                                ? "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            }`}
                          >
                            {st.gender === "female" ? "بنات" : "شباب"}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-ink-soft">
                          {st.studentNationalId || "-"}
                        </td>
                        <td className="p-4 font-bold text-brand-ink text-xs">
                          {st.groupName || "غير محدد"}
                        </td>
                        <td className="p-4 font-mono text-xs text-ink-soft">
                          {st.studentPhone || "-"}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRemoveStudent(st.studentId, st.studentName || "")}
                            className="p-2 text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-xl transition-colors"
                            title="حذف من المجموعة"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* TAB 2: Attendance */}
      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="card !rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-line">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-ink-mute" />
              <span className="text-xs font-bold text-ink">تاريخ التحضير:</span>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="field text-sm py-1.5 font-mono w-44"
              />
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-green-600 dark:text-green-400">حاضر: {presentCount}</span>
              <span className="text-red-500 dark:text-red-400">غائب: {absentCount}</span>
              <span className="text-amber-500">متأخر: {lateCount}</span>

              <div className="flex items-center gap-1 mr-2 border-r border-line pr-2">
                <button
                  type="button"
                  onClick={() => handleSetAllAtt("حاضر")}
                  className="px-2 py-1 rounded-lg bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 transition-colors"
                >
                  الكل حاضر
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllAtt("غائب")}
                  className="px-2 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  الكل غائب
                </button>
              </div>
            </div>
          </div>

          {!attRecords.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute border border-line">
              <Users size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg text-ink">لا يوجد طلاب مسجلون في هذه المجموعة بعد</p>
              <p className="text-xs mt-1">أضف طلاباً للمجموعة أولاً لرصد الحضور</p>
            </div>
          ) : (
            <div className="card !rounded-2xl overflow-hidden border border-line shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute text-xs">
                      <th className="p-4 font-bold">اسم الطالب</th>
                      <th className="p-4 font-bold">الحلقة الأصلية</th>
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
                        <td className="p-4 text-xs font-bold text-brand-ink">{r.group_name || "-"}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAttStatus(r.student_id, "حاضر")}
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
                              onClick={() => handleAttStatus(r.student_id, "غائب")}
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
                              onClick={() => handleAttStatus(r.student_id, "متأخر")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                r.status === "متأخر"
                                  ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30"
                                  : "bg-bg-alt text-ink-mute hover:bg-amber-500/15 hover:text-amber-600"
                              }`}
                            >
                              متأخر
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
      )}

      {/* TAB 3: Exams */}
      {tab === "exams" && (
        <div className="space-y-4">
          {!exams.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute border border-line">
              <Trophy size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg text-ink">لم يتم رصد أي اختبارات لهذه المجموعة بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((ex) => (
                <div key={ex.examId} className="card !rounded-2xl p-6 space-y-4 border border-line">
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

      {/* Student Selector Modal (Requirement 2) */}
      <StudentSelectorModal
        isOpen={showStudentPicker}
        onClose={() => setShowStudentPicker(false)}
        eduGroupName={eduGroup?.name || ""}
        allStudents={allStudents}
        allGroups={allGroups}
        enrolledStudentIds={enrolledIdsSet}
        onAddStudent={handleAddStudent}
        onBulkAddStudents={handleBulkAddStudents}
        loadingStudents={loadingPool}
      />

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
                    placeholder="امتحان مادة التربوي"
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
