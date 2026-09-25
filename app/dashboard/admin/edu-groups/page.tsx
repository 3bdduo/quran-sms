"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BookMarked,
  Plus,
  Users,
  Search,
  CalendarCheck,
  Download,
  Trash2,
  Edit2,
  UserCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ShieldCheck,
  Eye,
  KeyRound,
  Phone,
  UserRound,
} from "lucide-react";
import { eduGroupsApi, studentsApi, groupsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { StudentSelectorModal } from "@/components/edu/StudentSelectorModal";
import { EduAttendanceModal } from "@/components/edu/EduAttendanceModal";
import type { EduGroupItem, Student, GroupItem } from "@/types";

export default function AdminEduGroupsPage() {
  const [eduGroups, setEduGroups] = useState<EduGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // كل الطلاب والحلقات لتمكين اختيار الطلاب من الحلقات
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allGroups, setAllGroups] = useState<GroupItem[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  // Group Details & Active Selected Group
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupData, setActiveGroupData] = useState<EduGroupItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EduGroupItem | null>(null);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [targetAttendanceGroup, setTargetAttendanceGroup] = useState<EduGroupItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    teacherName: "",
    nationalId: "",
    phone: "",
    password: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const { showToast } = useToast();

  async function loadEduGroups() {
    setLoading(true);
    try {
      const data = await eduGroupsApi.list();
      setEduGroups(data);
    } catch {
      showToast("تعذّر تحميل بيانات المجموعات التربوية", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadPoolData() {
    setLoadingPool(true);
    try {
      const [stList, grList] = await Promise.all([
        studentsApi.list(),
        groupsApi.list(),
      ]);
      setAllStudents(stList);
      setAllGroups(grList);
    } catch {
      // quiet fail or toast
    } finally {
      setLoadingPool(false);
    }
  }

  useEffect(() => {
    loadEduGroups();
    loadPoolData();
  }, []);

  async function openGroupDetails(groupId: string) {
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
      setActiveGroupData(null);
      return;
    }
    setActiveGroupId(groupId);
    setLoadingDetails(true);
    try {
      const data = await eduGroupsApi.byId(groupId);
      setActiveGroupData(data);
    } catch {
      showToast("تعذّر تحميل تفاصيل المجموعة", "error");
    } finally {
      setLoadingDetails(false);
    }
  }

  function openStudentPickerForGroup(group: EduGroupItem) {
    setActiveGroupId(group.id);
    setActiveGroupData(group);
    // ensure details loaded
    if (!group.students) {
      eduGroupsApi.byId(group.id).then((d) => {
        setActiveGroupData(d);
        setShowStudentPicker(true);
      });
    } else {
      setShowStudentPicker(true);
    }
  }

  function openAttendanceForGroup(group: EduGroupItem) {
    if (!group.students) {
      eduGroupsApi.byId(group.id).then((d) => {
        setTargetAttendanceGroup(d);
        setShowAttendanceModal(true);
      });
    } else {
      setTargetAttendanceGroup(group);
      setShowAttendanceModal(true);
    }
  }

  async function handleAddStudent(studentId: string) {
    if (!activeGroupId) return;
    try {
      await eduGroupsApi.addStudent(activeGroupId, studentId);
      showToast("تمت إضافة الطالب للمجموعة بنجاح", "success");
      // تحديث البيانات المحلية
      const updated = await eduGroupsApi.byId(activeGroupId);
      setActiveGroupData(updated);
      setEduGroups((prev) =>
        prev.map((g) => (g.id === activeGroupId ? { ...g, studentsCount: updated.students?.length || 0 } : g))
      );
    } catch (err: any) {
      showToast(err.message || "تعذّر إضافة الطالب", "error");
    }
  }

  async function handleBulkAddStudents(studentIds: string[]) {
    if (!activeGroupId || !studentIds.length) return;
    try {
      await eduGroupsApi.bulkAddStudents(activeGroupId, studentIds);
      showToast(`تمت إضافة ${studentIds.length} طالب للمجموعة بنجاح`, "success");
      const updated = await eduGroupsApi.byId(activeGroupId);
      setActiveGroupData(updated);
      setEduGroups((prev) =>
        prev.map((g) => (g.id === activeGroupId ? { ...g, studentsCount: updated.students?.length || 0 } : g))
      );
      setShowStudentPicker(false);
    } catch (err: any) {
      showToast(err.message || "تعذّر إضافة الطلاب", "error");
    }
  }

  async function handleRemoveStudent(studentId: string, studentName: string) {
    if (!activeGroupId) return;
    if (!window.confirm(`هل أنت متأكد من حذف الطالب "${studentName}" من المجموعة التربوية؟`)) return;
    try {
      await eduGroupsApi.removeStudent(activeGroupId, studentId);
      showToast("تم حذف الطالب من المجموعة", "success");
      const updated = await eduGroupsApi.byId(activeGroupId);
      setActiveGroupData(updated);
      setEduGroups((prev) =>
        prev.map((g) => (g.id === activeGroupId ? { ...g, studentsCount: updated.students?.length || 0 } : g))
      );
    } catch {
      showToast("تعذّر حذف الطالب", "error");
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingGroup) {
        await eduGroupsApi.update(editingGroup.id, {
          name: formData.name,
          teacherName: formData.teacherName,
          nationalId: formData.nationalId || undefined,
          phone: formData.phone || undefined,
          teacherPassword: formData.password || undefined,
        });
        showToast("تم تحديث بيانات المجموعة والمعلم بنجاح", "success");
      } else {
        await eduGroupsApi.create({
          name: formData.name,
          teacherName: formData.teacherName,
          nationalId: formData.nationalId,
          phone: formData.phone || undefined,
          teacherPassword: formData.password,
        });
        showToast("تم إنشاء مجموعة التربوي وحساب المعلم بنجاح", "success");
      }
      setShowCreateModal(false);
      resetForm();
      loadEduGroups();
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء حفظ المجموعة", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteGroup(group: EduGroupItem) {
    if (!window.confirm(`هل أنت متأكد من حذف مجموعة التربوي "${group.name}"؟ سيتم حذف سجلات حضورها وفصل طلابها.`)) {
      return;
    }
    try {
      await eduGroupsApi.remove(group.id);
      showToast("تم حذف المجموعة التربوية بنجاح", "success");
      setEduGroups((prev) => prev.filter((g) => g.id !== group.id));
      if (activeGroupId === group.id) {
        setActiveGroupId(null);
        setActiveGroupData(null);
      }
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  function resetForm() {
    setFormData({ name: "", teacherName: "", nationalId: "", phone: "", password: "" });
    setEditingGroup(null);
  }

  function openEdit(group: EduGroupItem) {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      teacherName: group.teacherName || group.teacherUsername,
      nationalId: group.teacherNationalId || "",
      phone: group.teacherPhone || "",
      password: "",
    });
    setShowCreateModal(true);
  }

  async function handleExportRoster(groupId: string, groupName: string) {
    try {
      await downloadFile(`/exports/edu-groups/${groupId}/students.xlsx`, `طلاب-${groupName}.xlsx`);
    } catch {
      showToast("تعذّر تحميل ملف الإكسل", "error");
    }
  }

  async function handleExportAll() {
    try {
      await downloadFile("/exports/edu-groups/all.xlsx", "تقرير-المجموعات-التربوية.xlsx");
    } catch {
      showToast("تعذّر تصدير التقرير العام", "error");
    }
  }

  // فلترة المجموعات
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return eduGroups;
    const q = search.trim().toLowerCase();
    return eduGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.teacherName && g.teacherName.toLowerCase().includes(q)) ||
        g.teacherUsername.toLowerCase().includes(q) ||
        (g.teacherNationalId && g.teacherNationalId.includes(q))
    );
  }, [search, eduGroups]);

  const enrolledIdsSet = useMemo(() => {
    if (!activeGroupData?.students) return new Set<string>();
    return new Set(activeGroupData.students.map((s) => s.studentId));
  }, [activeGroupData]);

  const totalStudentsInEdu = useMemo(() => {
    return eduGroups.reduce((acc, g) => acc + (g.studentsCount || 0), 0);
  }, [eduGroups]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">مجموعات التربوي</h1>
            <span className="text-xs font-bold bg-brand-soft text-brand-ink px-3 py-1 rounded-full">
              {eduGroups.length} مجموعة
            </span>
          </div>
          <p className="text-ink-mute text-sm mt-1">
            إدارة المجموعات التربوية، إسناد معلميها، واختيار الطلاب من حلقات القرآن ومتابعة الحضور
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportAll} className="flex items-center gap-2">
            <Download size={17} />
            <span>تصدير الكل Excel</span>
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={17} />
            <span>إنشاء مجموعة تربوي</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 !rounded-2xl flex items-center gap-4 bg-surface border border-line">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-ink flex items-center justify-center">
            <BookMarked size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-mute font-bold">إجمالي المجموعات التربوية</p>
            <h3 className="text-2xl font-black text-ink mt-0.5">{eduGroups.length}</h3>
          </div>
        </div>

        <div className="card p-5 !rounded-2xl flex items-center gap-4 bg-surface border border-line">
          <div className="w-12 h-12 rounded-2xl bg-green-500/15 text-green-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-mute font-bold">إجمالي مقاعد الطلاب بالتربوي</p>
            <h3 className="text-2xl font-black text-ink mt-0.5">{totalStudentsInEdu}</h3>
          </div>
        </div>

        <div className="card p-5 !rounded-2xl flex items-center gap-4 bg-surface border border-line">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-mute font-bold">خزان الطلاب المتاحين بالحلقات</p>
            <h3 className="text-2xl font-black text-ink mt-0.5">{allStudents.length} طالب</h3>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="card p-4 sm:p-6 !rounded-2xl border border-line space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
          <input
            type="text"
            placeholder="ابحث باسم المجموعة، اسم المعلم، الرقم القومي، أو اسم المستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field !pl-4 !pr-11"
          />
        </div>

        {loading ? (
          <Loader size="lg" className="my-16" />
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-ink-mute space-y-3">
            <BookMarked size={44} className="mx-auto text-ink-mute/30" />
            <p className="font-bold text-lg text-ink">لم يتم العثور على أي مجموعات تربوية</p>
            <p className="text-xs">اضغط على زر &quot;إنشاء مجموعة تربوي&quot; لبدء إضافة المجموعات ومعلميها</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const isExpanded = activeGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-line bg-surface overflow-hidden transition-all duration-200 hover:border-brand/40 shadow-sm"
                >
                  {/* Group Main Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-brand-soft text-brand-ink flex items-center justify-center shrink-0">
                        <BookMarked size={22} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-black text-lg text-ink truncate">{group.name}</h3>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-ink font-mono">
                            {group.studentsCount || 0} طالب
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-ink-mute mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-ink-soft">
                            <UserRound size={13} className="text-brand" />
                            <strong>المعلم:</strong> {group.teacherName || "غير محدد"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <KeyRound size={12} className="text-ink-mute" />
                            <strong>الدخول:</strong> {group.teacherUsername}
                          </span>
                          {group.teacherNationalId && (
                            <>
                              <span>•</span>
                              <span className="font-mono">
                                <strong>الرقم القومي:</strong> {group.teacherNationalId}
                              </span>
                            </>
                          )}
                          {group.teacherPhone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono">
                                <Phone size={12} />
                                {group.teacherPhone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Group Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-line">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStudentPickerForGroup(group)}
                        className="flex items-center gap-1.5 !text-xs font-bold"
                        title="اختيار وإضافة طلاب من حلقات التحفيظ"
                      >
                        <Plus size={14} />
                        <span>إضافة طلاب</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAttendanceForGroup(group)}
                        className="flex items-center gap-1.5 !text-xs font-bold"
                      >
                        <CalendarCheck size={14} />
                        <span>التحضير</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportRoster(group.id, group.name)}
                        className="flex items-center gap-1.5 !text-xs font-bold"
                        title="تصدير كشف الطلاب إكسل"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Excel</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openGroupDetails(group.id)}
                        className="flex items-center gap-1.5 !text-xs font-bold"
                      >
                        <Eye size={14} />
                        <span>{isExpanded ? "إخفاء الطلاب" : "عرض الطلاب"}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </Button>

                      <div className="flex items-center gap-1 mr-1 border-r border-line pr-1">
                        <button
                          onClick={() => openEdit(group)}
                          className="p-2 text-ink-mute hover:text-brand-ink hover:bg-brand-soft rounded-xl transition-all"
                          title="تعديل بيانات المجموعة"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group)}
                          className="p-2 text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-xl transition-all"
                          title="حذف المجموعة"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded View: Enrolled Students Sub-table */}
                  {isExpanded && (
                    <div className="border-t border-line bg-bg-alt/40 p-4 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-brand" />
                          <h4 className="font-extrabold text-sm sm:text-base text-ink">
                            قائمة الطلاب المسجلين بمجموعة ({group.name})
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => openStudentPickerForGroup(group)}
                            className="flex items-center gap-1.5 !text-xs font-bold"
                          >
                            <Plus size={14} />
                            <span>+ إضافة طلاب جدد من الحلقات</span>
                          </Button>
                        </div>
                      </div>

                      {loadingDetails ? (
                        <div className="py-12 text-center">
                          <Loader size="md" />
                          <p className="text-xs text-ink-mute mt-2">جاري تحميل بيانات الطلاب...</p>
                        </div>
                      ) : !activeGroupData?.students || activeGroupData.students.length === 0 ? (
                        <div className="p-8 text-center bg-surface rounded-2xl border border-line text-ink-mute">
                          <Users size={32} className="mx-auto text-ink-mute/40 mb-2" />
                          <p className="font-bold text-sm text-ink">لا يوجد طلاب في هذه المجموعة حالياً</p>
                          <p className="text-xs mt-1">
                            اضغط على زر &quot;إضافة طلاب جدد من الحلقات&quot; لاختيار الطلاب وتوزيعهم
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-surface rounded-2xl border border-line">
                          <table className="w-full text-sm whitespace-nowrap">
                            <thead>
                              <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute text-xs">
                                <th className="p-3.5 font-bold">م</th>
                                <th className="p-3.5 font-bold">اسم الطالب</th>
                                <th className="p-3.5 font-bold">النوع</th>
                                <th className="p-3.5 font-bold">الرقم القومي</th>
                                <th className="p-3.5 font-bold">حلقة القرآن الأصلية</th>
                                <th className="p-3.5 font-bold">الهاتف</th>
                                <th className="p-3.5 font-bold text-center">إجراءات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeGroupData.students.map((student, idx) => (
                                <tr
                                  key={student.studentId}
                                  className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                                >
                                  <td className="p-3.5 font-mono text-xs text-ink-mute">{idx + 1}</td>
                                  <td className="p-3.5 font-bold text-ink">{student.studentName}</td>
                                  <td className="p-3.5">
                                    <span
                                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        student.gender === "female"
                                          ? "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300"
                                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                      }`}
                                    >
                                      {student.gender === "female" ? "بنات" : "شباب"}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-mono text-xs text-ink-soft">
                                    {student.studentNationalId || "-"}
                                  </td>
                                  <td className="p-3.5 font-bold text-brand-ink text-xs">
                                    {student.groupName || "غير محدد"}
                                  </td>
                                  <td className="p-3.5 font-mono text-xs text-ink-soft">
                                    {student.studentPhone || "-"}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <button
                                      onClick={() =>
                                        handleRemoveStudent(student.studentId, student.studentName || "")
                                      }
                                      className="p-1.5 text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-lg transition-colors"
                                      title="حذف من المجموعة"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Educational Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full sh-float border border-line animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-black text-xl text-ink mb-1">
              {editingGroup ? "تعديل بيانات مجموعة التربوي" : "إنشاء مجموعة تربوي جديدة"}
            </h3>
            <p className="text-xs text-ink-mute mb-5 pb-4 border-b border-line">
              أنشئ مجموعة التربوي وحدد معلمها ورقمها القومي ليتم توليد حساب دخول تلقائي له.
            </p>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="field-label">اسم مجموعة التربوي *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="field"
                  placeholder="مثال: مجموعة التربوي - شباب (1) أو مرحلة الإعدادي"
                />
              </div>

              <div>
                <label className="field-label">اسم المعلم رباعي باللغة العربية *</label>
                <input
                  required
                  minLength={4}
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  className="field"
                  placeholder="مثال: عبد الرحمن محمد السيد علي"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">الرقم القومي للمعلم (14 رقم) *</label>
                  <input
                    required
                    pattern="\d{14}"
                    title="الرقم القومي يجب أن يتكون من 14 رقماً"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="field font-mono"
                    placeholder="29501010101010"
                  />
                </div>

                <div>
                  <label className="field-label">رقم الهاتف (اختياري)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="field font-mono text-right"
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">
                  {editingGroup ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء)" : "كلمة المرور للدخول *"}
                </label>
                <input
                  type="password"
                  required={!editingGroup}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="field"
                  placeholder="••••••••"
                />
              </div>

              {!editingGroup && (
                <div className="p-3 bg-brand-soft/50 rounded-2xl border border-brand-soft/60 text-xs text-brand-ink/90 leading-relaxed flex items-start gap-2">
                  <ShieldCheck size={18} className="text-brand shrink-0 mt-0.5" />
                  <span>
                    سيتم تلقائياً توليد <strong>اسم مستخدم (Username)</strong> باللغة الإنجليزية بناءً على
                    اسم المعلم، وسيقوم المعلم بالدخول به عبر صفحة تسجيل الدخول العادية لاختيار الطلاب
                    وتسجيل الحضور.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  {editingGroup ? "حفظ التعديلات" : "إنشاء المجموعة والمعلم"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Selector Modal (Requirement 2) */}
      <StudentSelectorModal
        isOpen={showStudentPicker}
        onClose={() => setShowStudentPicker(false)}
        eduGroupName={activeGroupData?.name || ""}
        allStudents={allStudents}
        allGroups={allGroups}
        enrolledStudentIds={enrolledIdsSet}
        onAddStudent={handleAddStudent}
        onBulkAddStudents={handleBulkAddStudents}
        loadingStudents={loadingPool}
      />

      {/* Attendance Modal (Requirement 3 & 4) */}
      <EduAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        eduGroup={targetAttendanceGroup}
      />
    </div>
  );
}
