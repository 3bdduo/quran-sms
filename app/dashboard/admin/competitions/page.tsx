"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Plus,
  Award,
  Users,
  FileText,
  Calendar,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  CheckCircle2,
  X,
  GraduationCap,
} from "lucide-react";
import { competitionsApi, examsApi, eduGroupsApi, studentsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { CompetitionItem, EduGroupItem, Student, ExamItem } from "@/types";

export default function AdminCompetitionsPage() {
  const [tab, setTab] = useState<"competitions" | "exams">("competitions");

  // Competitions state
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [activeComp, setActiveComp] = useState<CompetitionItem | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals for Competitions
  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<CompetitionItem | null>(null);
  const [compForm, setCompForm] = useState({ name: "", description: "", year: "2026" });

  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [selectedStudentForComp, setSelectedStudentForComp] = useState("");

  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsEntries, setResultsEntries] = useState<{ studentId: string; score: number }[]>([]);

  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // Exams state
  const [eduGroups, setEduGroups] = useState<EduGroupItem[]>([]);
  const [selectedEduGroupId, setSelectedEduGroupId] = useState("");
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [activeEduGroupStudents, setActiveEduGroupStudents] = useState<Student[]>([]);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "",
    maxScore: 100,
    date: new Date().toISOString().slice(0, 10),
    scores: [] as { studentId: string; score: number }[],
  });

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const [compList, egList, sList] = await Promise.all([
        competitionsApi.list(),
        eduGroupsApi.list(),
        studentsApi.list(),
      ]);
      setCompetitions(compList);
      setEduGroups(egList);
      setAllStudents(sList);
      if (egList.length) setSelectedEduGroupId(egList[0].id);
    } catch {
      showToast("تعذّر تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Exams loader
  useEffect(() => {
    if (tab === "exams" && selectedEduGroupId) {
      examsApi.findByEduGroup(selectedEduGroupId).then(setExams).catch(() => setExams([]));
      eduGroupsApi.byId(selectedEduGroupId).then((g) => {
        const studentIds = (g.students || []).map((s) => s.studentId);
        const enrolled = allStudents.filter((s) => studentIds.includes(s.id));
        setActiveEduGroupStudents(enrolled);
      });
    }
  }, [tab, selectedEduGroupId, allStudents]);

  async function viewCompDetails(id: string) {
    try {
      const details = await competitionsApi.byId(id);
      setActiveComp(details);
    } catch {
      showToast("تعذّر تحميل تفاصيل المسابقة", "error");
    }
  }

  async function handleCreateCompetition(e: React.FormEvent) {
    e.preventDefault();
    try {
      await competitionsApi.create(compForm);
      showToast("تم إنشاء المسابقة بنجاح", "success");
      setShowAddCompModal(false);
      setCompForm({ name: "", description: "", year: "2026" });
      loadData();
    } catch {
      showToast("تعذّر إنشاء المسابقة", "error");
    }
  }

  async function handleUpdateCompetition(e: React.FormEvent) {
    e.preventDefault();
    if (!editingComp) return;
    try {
      await competitionsApi.update(editingComp.id, compForm);
      showToast("تم تحديث المسابقة", "success");
      setEditingComp(null);
      loadData();
    } catch {
      showToast("تعذّر التحديث", "error");
    }
  }

  async function handleDeleteCompetition(id: string, name: string) {
    if (!window.confirm(`هل أنت متأكد من حذف مسابقة "${name}"؟`)) return;
    try {
      await competitionsApi.remove(id);
      showToast("تم حذف المسابقة", "success");
      setCompetitions((prev) => prev.filter((c) => c.id !== id));
      if (activeComp?.id === id) setActiveComp(null);
    } catch {
      showToast("تعذّر حذف المسابقة", "error");
    }
  }

  async function handleAddParticipant() {
    if (!activeComp || !selectedStudentForComp) return;
    try {
      await competitionsApi.addParticipant(activeComp.id, selectedStudentForComp);
      showToast("تمت إضافة المشارك للمسابقة", "success");
      setShowAddParticipantModal(false);
      setSelectedStudentForComp("");
      viewCompDetails(activeComp.id);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر إضافة المشارك", "error");
    }
  }

  async function handleRemoveParticipant(studentId: string) {
    if (!activeComp) return;
    if (!window.confirm("هل أنت متأكد من إزالة هذا المشارك؟")) return;
    try {
      await competitionsApi.removeParticipant(activeComp.id, studentId);
      showToast("تمت إزالة المشارك", "success");
      viewCompDetails(activeComp.id);
      loadData();
    } catch {
      showToast("تعذّر إزالة المشارك", "error");
    }
  }

  function openResultsModal() {
    if (!activeComp || !activeComp.participants) return;
    const initial = activeComp.participants.map((pid) => {
      const existing = (activeComp.results || []).find((r) => r.student_id === pid);
      return { studentId: pid, score: existing?.score || 0 };
    });
    setResultsEntries(initial);
    setShowResultsModal(true);
  }

  async function handleSaveResults() {
    if (!activeComp) return;
    try {
      await competitionsApi.saveResults(activeComp.id, resultsEntries);
      showToast("تم رصد نتائج المسابقة ونشرها للمشاركين بنجاح", "success");
      setShowResultsModal(false);
      viewCompDetails(activeComp.id);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ النتائج", "error");
    }
  }

  async function handleExportWord(comp: CompetitionItem) {
    setDownloadingDocId(comp.id);
    try {
      await downloadFile(`/exports/competitions/${comp.id}.docx`, `نتائج-مسابقة-${comp.name}.docx`);
      showToast("تم تنزيل تقرير نتائج المسابقة (Word)", "success");
    } catch {
      showToast("تعذّر تنزيل ملف الوورد", "error");
    } finally {
      setDownloadingDocId(null);
    }
  }

  // Exams handlers
  function openAddExam() {
    setExamForm({
      name: "",
      maxScore: 100,
      date: new Date().toISOString().slice(0, 10),
      scores: activeEduGroupStudents.map((s) => ({ studentId: s.id, score: 0 })),
    });
    setShowAddExamModal(true);
  }

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEduGroupId) return;
    try {
      await examsApi.create(selectedEduGroupId, examForm);
      showToast("تم تسجيل الامتحان ورصد درجات الطلاب بنجاح", "success");
      setShowAddExamModal(false);
      examsApi.findByEduGroup(selectedEduGroupId).then(setExams);
    } catch (err: any) {
      showToast(err.message || "تعذّر تسجيل الامتحان", "error");
    }
  }

  async function handleDeleteExam(examId: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا الامتحان؟")) return;
    try {
      await examsApi.remove(selectedEduGroupId, examId);
      showToast("تم حذف الامتحان", "success");
      setExams((prev) => prev.filter((e) => e.examId !== examId));
    } catch {
      showToast("تعذّر حذف الامتحان", "error");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">المسابقات والاختبارات</h1>
          <p className="text-ink-mute text-sm mt-1">
            إدارة مسابقات حفظ وتلاوة القرآن الكريم واختبارات المجموعات التعليمية
          </p>
        </div>

        <Button
          onClick={() => {
            if (tab === "competitions") {
              setCompForm({ name: "", description: "", year: "2026" });
              setShowAddCompModal(true);
            } else {
              openAddExam();
            }
          }}
          className="flex items-center gap-2"
        >
          <Plus size={17} />
          <span>{tab === "competitions" ? "مسابقة جديدة" : "رصد امتحان جديد"}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab("competitions")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "competitions"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Trophy size={18} />
          <span>مسابقات القرآن ({competitions.length})</span>
        </button>

        <button
          onClick={() => setTab("exams")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "exams"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <GraduationCap size={18} />
          <span>امتحانات المجموعات التعليمية</span>
        </button>
      </div>

      {tab === "competitions" ? (
        <>
          {loading ? (
            <Loader size="lg" />
          ) : competitions.length === 0 ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <Trophy size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لا توجد مسابقات مسجلة حاليًا</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  className="card !rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="h-11 w-11 rounded-xl bg-gold-soft text-gold-ink flex items-center justify-center font-bold">
                        <Trophy size={20} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingComp(comp);
                            setCompForm({
                              name: comp.name,
                              description: comp.description || "",
                              year: comp.year || "2026",
                            });
                          }}
                          title="تعديل المسابقة"
                          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-ink-mute hover:text-brand-ink hover:bg-brand-soft rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCompetition(comp.id, comp.name)}
                          title="حذف المسابقة"
                          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-lg text-ink">{comp.name}</h3>
                    <p className="text-xs text-ink-mute mt-1">عام {comp.year}</p>
                    {comp.description && (
                      <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                        {comp.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-line space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1 text-ink-soft">
                        <Users size={14} className="text-brand-ink" /> {comp.participantsCount || 0}{" "}
                        مشارك
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          comp.resultsPublished
                            ? "bg-brand-soft text-brand-ink"
                            : "bg-bg-alt text-ink-mute"
                        }`}
                      >
                        {comp.resultsPublished ? "النتائج معلنة" : "قيد التنظيم"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewCompDetails(comp.id)}
                        className="text-xs flex-1"
                      >
                        إدارة المشاركين والنتائج
                      </Button>

                      {comp.resultsPublished && (
                        <button
                          onClick={() => handleExportWord(comp)}
                          disabled={downloadingDocId === comp.id}
                          title="تصدير نتائج المسابقة (Word)"
                          className="icon-btn rounded-xl bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors"
                        >
                          {downloadingDocId === comp.id ? (
                            <Spinner size={15} />
                          ) : (
                            <FileText size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* لوحة تفاصيل المسابقة المحددة */}
          {activeComp && (
            <div className="card !rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-xl text-ink">{activeComp.name}</h2>
                    <span className="text-xs font-bold bg-gold-soft text-gold-ink px-2.5 py-0.5 rounded-full">
                      عام {activeComp.year}
                    </span>
                  </div>
                  <p className="text-xs text-ink-mute mt-1">
                    {activeComp.description || "مسابقة قرآنية رسمية"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddParticipantModal(true)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <UserPlus size={15} />
                    <span>إضافة مشارك</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={openResultsModal}
                    className="flex items-center gap-1.5 text-xs"
                    disabled={!activeComp.participants?.length}
                  >
                    <Award size={15} />
                    <span>رصد النتائج والمراكز</span>
                  </Button>

                  <button
                    onClick={() => setActiveComp(null)}
                    className="icon-btn rounded-lg text-ink-mute hover:text-ink"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* جدول المشاركين والنتائج */}
              {!activeComp.participants?.length ? (
                <p className="text-center text-ink-mute py-8">
                  لا يوجد مشاركون مسجلون في هذه المسابقة بعد. اضغط &quot;إضافة مشارك&quot; للبدء.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                        <th className="p-3 font-bold">اسم الطالب المشارك</th>
                        <th className="p-3 font-bold">الرقم القومي</th>
                        <th className="p-3 font-bold">الدرجة</th>
                        <th className="p-3 font-bold">الترتيب</th>
                        <th className="p-3 font-bold text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeComp.participants.map((pid) => {
                        const st = allStudents.find((s) => s.id === pid);
                        const res = (activeComp.results || []).find((r) => r.student_id === pid);
                        return (
                          <tr
                            key={pid}
                            className="border-b border-line last:border-0 hover:bg-bg-alt/40"
                          >
                            <td className="p-3 font-bold text-ink">{st?.name || pid}</td>
                            <td className="p-3 font-mono text-xs text-ink-soft">
                              {st?.national_id || "-"}
                            </td>
                            <td className="p-3 font-bold text-brand-ink">
                              {res ? `${res.score} درجة` : "-"}
                            </td>
                            <td className="p-3">
                              {res?.rank ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    res.rank === 1
                                      ? "bg-gold-soft text-gold-ink"
                                      : res.rank === 2 || res.rank === 3
                                      ? "bg-brand-soft text-brand-ink"
                                      : "bg-bg-alt text-ink-soft"
                                  }`}
                                >
                                  {res.rank <= 3 && <Award size={13} />} المركز {res.rank}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemoveParticipant(pid)}
                                className="icon-btn rounded-lg text-danger-ink hover:bg-danger-soft transition-colors"
                                title="إزالة من المسابقة"
                              >
                                <UserMinus size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* تبويب الاختبارات للمجموعات التعليمية */
        <div className="space-y-6">
          <div className="card !rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-ink-mute">اختر المجموعة التعليمية:</label>
              <select
                value={selectedEduGroupId}
                onChange={(e) => setSelectedEduGroupId(e.target.value)}
                className="field field-select text-sm py-2 min-w-56"
              >
                {eduGroups.map((eg) => (
                  <option key={eg.id} value={eg.id}>
                    {eg.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-bold text-ink-mute">
              عدد الاختبارات المرصودة: {exams.length}
            </span>
          </div>

          {!exams.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <GraduationCap size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لا توجد اختبارات مسجلة لهذه المجموعة</p>
              <p className="text-xs mt-1">اضغط &quot;رصد امتحان جديد&quot; لتسجيل درجات الطلاب</p>
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
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-lg transition-colors"
                      title="حذف الامتحان"
                    >
                      <Trash2 size={18} />
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

      {/* Modal: إضافة / تعديل مسابقة */}
      {(showAddCompModal || editingComp) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-4">
              {editingComp ? "تعديل المسابقة" : "إنشاء مسابقة جديدة"}
            </h3>
            <form
              onSubmit={editingComp ? handleUpdateCompetition : handleCreateCompetition}
              className="space-y-4"
            >
              <div>
                <label className="field-label">اسم المسابقة *</label>
                <input
                  required
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  className="field"
                  placeholder="مثال: مسابقة الماهر بالقرآن السنوية"
                />
              </div>

              <div>
                <label className="field-label">السنة *</label>
                <input
                  required
                  value={compForm.year}
                  onChange={(e) => setCompForm({ ...compForm, year: e.target.value })}
                  className="field font-mono"
                  placeholder="2026"
                />
              </div>

              <div>
                <label className="field-label">وصف وشروط المسابقة</label>
                <textarea
                  rows={3}
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  className="field resize-none"
                  placeholder="المستويات، شروط التسميع، الجوائز..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCompModal(false);
                    setEditingComp(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit">{editingComp ? "حفظ التعديل" : "إنشاء المسابقة"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: إضافة مشارك لمسابقة */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-sm w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-4">إضافة مشارك للمسابقة</h3>
            <div className="space-y-4">
              <div>
                <label className="field-label">اختر الطالب</label>
                <select
                  value={selectedStudentForComp}
                  onChange={(e) => setSelectedStudentForComp(e.target.value)}
                  className="field field-select text-sm"
                >
                  <option value="">اختر الطالب...</option>
                  {allStudents
                    .filter((s) => !activeComp?.participants?.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.memorized_amount})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddParticipantModal(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddParticipant} disabled={!selectedStudentForComp}>
                  إضافة المشارك
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: رصد النتائج والمراكز */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full sh-float border border-line max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="font-extrabold text-lg text-ink">رصد درجات المشاركين</h3>
              <button
                onClick={() => setShowResultsModal(false)}
                className="icon-btn rounded-lg text-ink-mute hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-ink-mute mb-4">
              أدخل درجات المشاركين وسيتم احتساب الترتيب تلقائيًا حسب الدرجات.
            </p>

            <div className="space-y-3">
              {resultsEntries.map((entry, idx) => {
                const st = allStudents.find((s) => s.id === entry.studentId);
                return (
                  <div
                    key={entry.studentId}
                    className="flex items-center justify-between gap-3 bg-bg-alt/60 p-3 rounded-xl"
                  >
                    <span className="text-sm font-bold text-ink">{st?.name || entry.studentId}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={entry.score}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setResultsEntries((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, score: val } : it))
                          );
                        }}
                        className="field w-20 text-center py-1.5 font-bold"
                      />
                      <span className="text-xs text-ink-mute">درجة</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-5 border-t border-line mt-5">
              <Button variant="outline" onClick={() => setShowResultsModal(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveResults}>حفظ وإعلان النتائج</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: رصد امتحان جديد للمجموعة */}
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
                    placeholder="مثال: امتحان أحكام النون الساكنة"
                  />
                </div>
                <div>
                  <label className="field-label">النهاية العظمى (الدرجة القصوى) *</label>
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
                    const st = activeEduGroupStudents.find((s) => s.id === sc.studentId);
                    return (
                      <div
                        key={sc.studentId}
                        className="flex items-center justify-between gap-3 bg-bg-alt/70 p-2.5 rounded-xl"
                      >
                        <span className="text-sm font-bold text-ink">{st?.name}</span>
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
                <Button type="submit">تسجيل الامتحان والدرجات</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
