"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  Phone,
  BookMarked,
  X,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { studentsApi, groupsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { AddStudentWizardModal } from "@/components/wizards/AddStudentWizardModal";
import type { Student, GroupItem } from "@/types";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Add/Edit Form state
  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    phone: "",
    memorizedAmount: "0",
    currentSurah: "غير محدد",
    groupId: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const [stList, grList] = await Promise.all([
        studentsApi.list(),
        groupsApi.list(),
      ]);
      setStudents(stList);
      setGroups(grList);
    } catch {
      showToast("تعذّر تحميل بيانات الطلاب", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // تجميع الطلاب حسب الحلقة
  const groupedStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.national_id.includes(q) ||
            (s.phone && s.phone.includes(q))
        )
      : students;

    // ترتيب حسب الحلقات
    const map = new Map<string, { group: GroupItem | null; students: Student[] }>();
    for (const g of groups) {
      map.set(g.id, { group: g, students: [] });
    }
    // طلاب بدون حلقة
    map.set("__none__", { group: null, students: [] });

    for (const s of filtered) {
      const entry = map.get(s.group_id);
      if (entry) entry.students.push(s);
      else map.get("__none__")!.students.push(s);
    }

    // إزالة الحلقات الفارغة
    return Array.from(map.entries())
      .filter(([, v]) => v.students.length > 0)
      .map(([id, v]) => ({ id, ...v }));
  }, [students, groups, searchQuery]);

  const totalStudents = useMemo(
    () => groupedStudents.reduce((sum, g) => sum + g.students.length, 0),
    [groupedStudents]
  );

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.groupId) {
      showToast("يرجى اختيار الحلقة", "error");
      return;
    }
    setFormLoading(true);
    try {
      await studentsApi.create({ ...formData });
      showToast("تمت إضافة الطالب بنجاح", "success");
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      showToast(err.message || "فشلت إضافة الطالب", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdateStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    setFormLoading(true);
    try {
      await studentsApi.update(editingStudent.id, {
        name: formData.name,
        nationalId: formData.nationalId,
        phone: formData.phone,
        memorizedAmount: formData.memorizedAmount,
        currentSurah: formData.currentSurah,
        groupId: formData.groupId,
      });
      showToast("تم تحديث بيانات الطالب", "success");
      setEditingStudent(null);
      resetForm();
      loadData();
    } catch (err: any) {
      showToast(err.message || "فشل التحديث", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (!window.confirm(`هل أنت متأكد من حذف الطالب "${name}" وجميع سجلاته نهائيًا؟`)) return;
    try {
      await studentsApi.remove(id);
      showToast("تم حذف الطالب بنجاح", "success");
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch {
      showToast("تعذّر حذف الطالب", "error");
    }
  }

  // تصدير حلقة واحدة
  async function handleExportGroup(groupId: string, groupName: string) {
    setExportingType(`group-${groupId}`);
    try {
      await downloadFile(`/exports/students/group/${groupId}.xlsx`, `كشف-${groupName}.xlsx`);
      showToast("تم تنزيل الكشف بنجاح", "success");
    } catch {
      showToast("تعذّر تنزيل الكشف", "error");
    } finally {
      setExportingType(null);
    }
  }

  // تصدير كل المجاميع مقسمة حسب الحلقة
  async function handleExportAllGrouped() {
    setExportingType("all-grouped");
    setShowExportMenu(false);
    try {
      await downloadFile("/exports/students/all-grouped.xlsx", "كشف-الطلاب-مقسم-بالحلقات.xlsx");
      showToast("تم تنزيل كشف الطلاب مقسمًا بنجاح", "success");
    } catch {
      showToast("تعذّر تنزيل الكشف", "error");
    } finally {
      setExportingType(null);
    }
  }

  // تصدير كل الطلاب مرتبين أبجديًا بدون اسم المعلم
  async function handleExportAllAlpha() {
    setExportingType("all-alpha");
    setShowExportMenu(false);
    try {
      await downloadFile("/exports/students/all-alpha.xlsx", "كشف-الطلاب-أبجدي.xlsx");
      showToast("تم تنزيل الكشف الأبجدي بنجاح", "success");
    } catch {
      showToast("تعذّر تنزيل الكشف", "error");
    } finally {
      setExportingType(null);
    }
  }

  async function handleExportStudentWord(studentId: string, studentName: string) {
    setDownloadingId(studentId);
    try {
      await downloadFile(`/exports/students/${studentId}.docx`, `تقرير-طالب-${studentName}.docx`);
      showToast("تم تنزيل تقرير الطالب بنجاح", "success");
    } catch {
      showToast("تعذّر تنزيل تقرير الطالب", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      nationalId: student.national_id,
      phone: student.phone || "",
      memorizedAmount: student.memorized_amount || "0",
      currentSurah: student.current_surah || "غير محدد",
      groupId: student.group_id || "",
    });
  }

  function resetForm() {
    setFormData({
      name: "",
      nationalId: "",
      phone: "",
      memorizedAmount: "0",
      currentSurah: "غير محدد",
      groupId: "", // لا تختار حلقة تلقائياً — لازم الأدمن يختار بنفسه
    });
  }

  // اسم المعلم من الحلقة
  function getTeacherName(group: GroupItem | null) {
    if (!group) return "غير مسند";
    return group.teacherName || group.teacherUsername || "غير مسند";
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">إدارة الطلاب</h1>
          <p className="text-ink-mute text-sm mt-1">
            {totalStudents} طالب في {groupedStudents.length} حلقة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2"
          >
            <UserPlus size={17} />
            <span>طالب جديد</span>
          </Button>

          {/* Export menu */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={!!exportingType}
              className="flex items-center gap-2"
            >
              {exportingType === "all-grouped" || exportingType === "all-alpha"
                ? <Spinner size={16} />
                : <Download size={17} />}
              <span>تصدير</span>
              <ChevronDown size={14} />
            </Button>

            {showExportMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-surface border border-line rounded-2xl sh-float z-30 overflow-hidden">
                <button
                  onClick={handleExportAllGrouped}
                  className="w-full text-right px-4 py-3 text-sm font-bold text-ink hover:bg-bg-alt transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheet size={15} className="text-brand-ink" />
                  كل المجاميع (مقسمة حسب الحلقة)
                </button>
                <div className="border-t border-line" />
                <button
                  onClick={handleExportAllAlpha}
                  className="w-full text-right px-4 py-3 text-sm font-bold text-ink hover:bg-bg-alt transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheet size={15} className="text-gold-ink" />
                  كل الطلاب (مرتبين أبجديًا)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* بحث */}
      <div className="card !rounded-2xl p-4">
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الرقم القومي، أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field pr-10 text-sm py-2.5 w-full"
          />
        </div>
      </div>

      {/* المحتوى */}
      {loading ? (
        <Loader size="lg" />
      ) : groupedStudents.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <Users size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لم يتم العثور على طلاب</p>
          <p className="text-sm mt-1">جرّب تغيير معايير البحث أو إضافة طالب جديد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedStudents.map(({ id, group, students: gs }) => {
            const isCollapsed = collapsedGroups.has(id);
            const teacherName = getTeacherName(group);
            const groupName = group?.name || "طلاب بدون حلقة";
            const isExporting = exportingType === `group-${id}`;

            return (
              <div key={id} className="card !rounded-2xl overflow-hidden shadow-sm">
                {/* رأس الحلقة */}
                <div className="flex items-center justify-between px-5 py-4 bg-deep/90 text-on-deep">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleGroup(id)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                    <div>
                      <p className="font-extrabold text-base leading-tight">{groupName}</p>
                      <p className="text-xs text-on-deep-soft mt-0.5">
                        معلم الحلقة: <span className="text-gold font-bold">{teacherName}</span>
                        {" · "}
                        <span className="font-bold">{gs.length} طالب</span>
                      </p>
                    </div>
                  </div>
                  {id !== "__none__" && (
                    <button
                      onClick={() => handleExportGroup(id, groupName)}
                      disabled={isExporting}
                      title="تصدير كشف هذه الحلقة"
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                      {isExporting ? <Spinner size={13} /> : <FileSpreadsheet size={13} />}
                      تصدير الحلقة
                    </button>
                  )}
                </div>

                {/* الجدول */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-bg-alt/70 text-ink-mute text-right">
                          <th className="p-3 font-bold text-center w-12">م</th>
                          <th className="p-3 font-bold">اسم الطالب</th>
                          <th className="p-3 font-bold">الرقم القومي</th>
                          <th className="p-3 font-bold">رقم الهاتف</th>
                          <th className="p-3 font-bold">السن</th>
                          <th className="p-3 font-bold">السورة الحالية</th>
                          <th className="p-3 font-bold">عدد الأجزاء</th>
                          <th className="p-3 font-bold text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gs.map((s, idx) => (
                          <tr
                            key={s.id}
                            className="border-b border-line last:border-0 hover:bg-brand-soft/30 transition-colors"
                          >
                            <td className="p-3 text-ink-mute text-xs font-mono">{idx + 1}</td>
                            <td className="p-3 font-bold text-ink whitespace-nowrap">{s.name}</td>
                            <td className="p-3 font-mono text-xs text-ink-soft whitespace-nowrap">
                              {s.national_id}
                            </td>
                            <td className="p-3 text-xs text-ink-soft whitespace-nowrap">
                              {s.phone ? (
                                <span className="flex items-center gap-1">
                                  <Phone size={11} className="text-ink-mute" />
                                  {s.phone}
                                </span>
                              ) : (
                                <span className="text-ink-mute">-</span>
                              )}
                            </td>
                            <td className="p-3 text-xs text-ink-soft whitespace-nowrap">
                              {s.age ? `${s.age} سنة` : "-"}
                            </td>
                            <td className="p-3 text-xs text-ink-soft whitespace-nowrap max-w-[160px] truncate">
                              {s.current_surah || "-"}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 font-bold text-xs bg-gold-soft text-gold-ink px-2 py-0.5 rounded-lg">
                                <BookMarked size={11} />
                                {s.memorized_amount || "0"}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleExportStudentWord(s.id, s.name)}
                                  disabled={downloadingId === s.id}
                                  title="تصدير تقرير وورد"
                                  className="p-1.5 rounded-lg bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors disabled:opacity-50"
                                >
                                  {downloadingId === s.id ? <Spinner size={13} /> : <FileText size={13} />}
                                </button>
                                <button
                                  onClick={() => openEditModal(s)}
                                  title="تعديل بيانات الطالب"
                                  className="p-1.5 rounded-lg bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(s.id, s.name)}
                                  title="حذف الطالب"
                                  className="p-1.5 rounded-lg bg-bg-alt hover:bg-danger-soft text-ink-soft hover:text-danger-ink transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Wizard لتسجيل طالب جديد خطوة بخطوة */}
      <AddStudentWizardModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadData();
        }}
        groups={groups}
      />

      {/* Modal: تعديل بيانات طالب */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowExportMenu(false)}>
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full sh-float border border-line overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <h3 className="font-extrabold text-lg text-ink">
                تعديل بيانات الطالب
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">اسم الطالب الكامل *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="field"
                    placeholder="مثال: يوسف أحمد محمد علي"
                  />
                </div>
                <div>
                  <label className="field-label">الرقم القومي (14 رقم) *</label>
                  <input
                    required
                    maxLength={14}
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="field font-mono"
                    placeholder="2980101..."
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">الحلقة *</label>
                  <select
                    required
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                    className="field field-select"
                  >
                    <option value="">اختر الحلقة</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.teacherName ? `أ. ${g.teacherName}` : g.teacherUsername || "بدون معلم"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">رقم الهاتف *</label>
                  <input
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="field"
                    placeholder="01xxxxxxxxx"
                    inputMode="tel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">عدد الأجزاء المحفوظة</label>
                  <input
                    value={formData.memorizedAmount}
                    onChange={(e) => setFormData({ ...formData, memorizedAmount: e.target.value })}
                    className="field"
                    placeholder="مثال: 5 أجزاء"
                  />
                </div>
                <div>
                  <label className="field-label">السورة الحالية *</label>
                  <input
                    required
                    value={formData.currentSurah}
                    onChange={(e) => setFormData({ ...formData, currentSurah: e.target.value })}
                    className="field"
                    placeholder="مثال: سورة البقرة"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  حفظ التعديلات
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
