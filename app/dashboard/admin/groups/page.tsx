"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  BookOpen,
  GraduationCap,
  Users,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  X,
  ShieldAlert,
} from "lucide-react";
import { groupsApi, eduGroupsApi, studentsApi, teachersApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { GroupItem, EduGroupItem, Student } from "@/types";

export default function AdminGroupsPage() {
  const [tab, setTab] = useState<"groups" | "eduGroups">("groups");
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [eduGroups, setEduGroups] = useState<EduGroupItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Group Details View
  const [activeGroupDetails, setActiveGroupDetails] = useState<GroupItem | null>(null);
  const [activeEduGroupDetails, setActiveEduGroupDetails] = useState<EduGroupItem | null>(null);

  // Modals
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupItem | EduGroupItem | null>(null);
  const [showAddStudentToEduModal, setShowAddStudentToEduModal] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    teacherUsername: "",
    teacherPassword: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [teachersList, setTeachersList] = useState<any[]>([]);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const [gList, egList, sList, tList] = await Promise.all([
        groupsApi.list(),
        eduGroupsApi.list(),
        studentsApi.list(),
        teachersApi.list(),
      ]);
      setGroups(gList);
      setEduGroups(egList);
      setAllStudents(sList);
      setTeachersList(tList);
    } catch {
      showToast("تعذّر تحميل بيانات الحلقات والمجموعات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (tab === "groups") {
        await groupsApi.create({ name: formData.name, teacherId: formData.teacherId || undefined });
        showToast("تم إنشاء حلقة التحفيظ بنجاح", "success");
      } else {
        await eduGroupsApi.create({
          name: formData.name,
          teacherUsername: formData.teacherUsername,
          teacherPassword: formData.teacherPassword,
        });
        showToast("تم إنشاء المجموعة التعليمية بنجاح", "success");
      }
      setShowAddGroupModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      showToast(err.message || "فشل إنشاء المجموعة", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGroup) return;
    setFormLoading(true);
    try {
      if (tab === "groups") {
        await groupsApi.update(editingGroup.id, {
          name: formData.name,
          teacherId: formData.teacherId || undefined,
        });
        showToast("تم تحديث حلقة التحفيظ", "success");
      } else {
        await eduGroupsApi.update(editingGroup.id, {
          name: formData.name,
          teacherUsername: formData.teacherUsername,
          teacherPassword: formData.teacherPassword || undefined,
        });
        showToast("تم تحديث المجموعة التعليمية", "success");
      }
      setEditingGroup(null);
      resetForm();
      loadData();
    } catch (err: any) {
      showToast(err.message || "فشل التحديث", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteGroup(id: string, name: string) {
    if (
      !window.confirm(
        `تحذير شديد: حذف "${name}" سيؤدي لحذف سجلات هذه المجموعة بالكامل! هل أنت متأكد؟`
      )
    ) {
      return;
    }
    try {
      if (tab === "groups") {
        await groupsApi.remove(id);
        setGroups((prev) => prev.filter((g) => g.id !== id));
      } else {
        await eduGroupsApi.remove(id);
        setEduGroups((prev) => prev.filter((g) => g.id !== id));
      }
      showToast("تم حذف المجموعة بنجاح", "success");
      setActiveGroupDetails(null);
      setActiveEduGroupDetails(null);
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  async function viewGroupDetails(id: string) {
    try {
      if (tab === "groups") {
        const details = await groupsApi.byId(id);
        setActiveGroupDetails(details);
      } else {
        const details = await eduGroupsApi.byId(id);
        setActiveEduGroupDetails(details);
      }
    } catch {
      showToast("تعذّر تحميل تفاصيل المجموعة", "error");
    }
  }

  async function handleAddStudentToEduGroup() {
    if (!activeEduGroupDetails || !selectedStudentToAdd) return;
    try {
      await eduGroupsApi.addStudent(activeEduGroupDetails.id, selectedStudentToAdd);
      showToast("تمت إضافة الطالب للمجموعة التعليمية", "success");
      setShowAddStudentToEduModal(false);
      setSelectedStudentToAdd("");
      viewGroupDetails(activeEduGroupDetails.id);
      loadData();
    } catch {
      showToast("تعذّر إضافة الطالب", "error");
    }
  }

  async function handleRemoveStudentFromEduGroup(studentId: string) {
    if (!activeEduGroupDetails) return;
    if (!window.confirm("هل أنت متأكد من إزالة هذا الطالب من المجموعة التعليمية؟")) return;
    try {
      await eduGroupsApi.removeStudent(activeEduGroupDetails.id, studentId);
      showToast("تمت إزالة الطالب من المجموعة", "success");
      viewGroupDetails(activeEduGroupDetails.id);
      loadData();
    } catch {
      showToast("تعذّر إزالة الطالب", "error");
    }
  }

  function resetForm() {
    setFormData({ name: "", teacherId: "", teacherUsername: "", teacherPassword: "" });
  }

  function openEdit(item: GroupItem | EduGroupItem) {
    setEditingGroup(item);
    setFormData({
      name: item.name,
      teacherId: "teacherId" in item ? (item.teacherId || "") : "",
      teacherUsername: item.teacherUsername || "",
      teacherPassword: "",
    });
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">الحلقات والمجموعات</h1>
          <p className="text-ink-mute text-sm mt-1">
            إدارة حلقات تحفيظ القرآن الكريم والمجموعات التعليمية الإضافية
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowAddGroupModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={17} />
          <span>{tab === "groups" ? "حلقة تحفيظ جديدة" : "مجموعة تعليمية جديدة"}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => {
            setTab("groups");
            setActiveGroupDetails(null);
            setActiveEduGroupDetails(null);
          }}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "groups"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <BookOpen size={18} />
          <span>حلقات القرآن الكريم ({groups.length})</span>
        </button>

        <button
          onClick={() => {
            setTab("eduGroups");
            setActiveGroupDetails(null);
            setActiveEduGroupDetails(null);
          }}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "eduGroups"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <GraduationCap size={18} />
          <span>المجموعات التعليمية ({eduGroups.length})</span>
        </button>
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(tab === "groups" ? groups : eduGroups).map((item) => (
            <div
              key={item.id}
              className="card !rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-11 w-11 rounded-xl bg-brand-soft text-brand-ink flex items-center justify-center font-bold">
                    {tab === "groups" ? <BookOpen size={20} /> : <GraduationCap size={20} />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      title="تعديل"
                      className="p-2 text-ink-mute hover:text-brand-ink rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(item.id, item.name)}
                      title="حذف"
                      className="p-2 text-ink-mute hover:text-danger-ink rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-lg text-ink">{item.name}</h3>
                <p className="text-xs text-ink-mute mt-1">
                  المعلم المسؤول:{" "}
                  <span className="font-bold text-ink-soft">{item.teacherUsername}</span>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                <span className="text-xs font-bold text-ink-soft flex items-center gap-1.5">
                  <Users size={14} className="text-brand-ink" />
                  {item.studentsCount ?? 0} طالب مسجل
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewGroupDetails(item.id)}
                  className="text-xs"
                >
                  عرض الطلاب
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* تفاصيل طلاب الحلقة العادية */}
      {activeGroupDetails && tab === "groups" && (
        <div className="card !rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-extrabold text-xl text-ink">
                طلاب حلقة: {activeGroupDetails.name}
              </h3>
              <p className="text-xs text-ink-mute">
                معلم الحلقة: {activeGroupDetails.teacherUsername}
              </p>
            </div>
            <button
              onClick={() => setActiveGroupDetails(null)}
              className="p-2 text-ink-mute hover:text-ink rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {!activeGroupDetails.students?.length ? (
            <p className="text-center text-ink-mute py-8">لا يوجد طلاب مسجلين في هذه الحلقة حاليًا</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-alt/60 text-right text-ink-mute">
                    <th className="p-3 font-bold">الاسم</th>
                    <th className="p-3 font-bold">الرقم القومي</th>
                    <th className="p-3 font-bold">المحفوظ</th>
                    <th className="p-3 font-bold">الهاتف</th>
                  </tr>
                </thead>
                <tbody>
                  {activeGroupDetails.students.map((s) => (
                    <tr key={s.id} className="border-b border-line last:border-0 hover:bg-bg-alt/40">
                      <td className="p-3 font-bold text-ink">{s.name}</td>
                      <td className="p-3 font-mono text-xs text-ink-soft">{s.national_id}</td>
                      <td className="p-3 text-ink-soft">{s.memorized_amount || "0"}</td>
                      <td className="p-3 text-ink-soft">{s.phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* تفاصيل طلاب المجموعة التعليمية وإضافة طلاب إليها */}
      {activeEduGroupDetails && tab === "eduGroups" && (
        <div className="card !rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-extrabold text-xl text-ink">
                طلاب المجموعة التعليمية: {activeEduGroupDetails.name}
              </h3>
              <p className="text-xs text-ink-mute">
                معلم المجموعة: {activeEduGroupDetails.teacherUsername}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowAddStudentToEduModal(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <UserPlus size={15} />
                <span>إضافة طالب</span>
              </Button>
              <button
                onClick={() => setActiveEduGroupDetails(null)}
                className="p-2 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {!activeEduGroupDetails.students?.length ? (
            <p className="text-center text-ink-mute py-8">
              لا يوجد طلاب مضافين في هذه المجموعة التعليمية بعد
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-alt/60 text-right text-ink-mute">
                    <th className="p-3 font-bold">اسم الطالب</th>
                    <th className="p-3 font-bold">حالات الحضور المسجلة</th>
                    <th className="p-3 font-bold">الاختبارات المرصودة</th>
                    <th className="p-3 font-bold text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEduGroupDetails.students.map((st) => (
                    <tr
                      key={st.studentId}
                      className="border-b border-line last:border-0 hover:bg-bg-alt/40"
                    >
                      <td className="p-3 font-bold text-ink">{st.studentName || st.studentId}</td>
                      <td className="p-3 text-xs text-ink-soft">
                        {st.attendanceRecords?.length || 0} تسجيل حضور
                      </td>
                      <td className="p-3 text-xs text-ink-soft">
                        {st.examRecords?.length || 0} اختبار
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveStudentFromEduGroup(st.studentId)}
                          className="p-1.5 rounded-lg text-danger-ink hover:bg-danger-soft transition-colors"
                          title="إزالة الطالب من المجموعة"
                        >
                          <UserMinus size={16} />
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

      {/* Modal: إضافة أو تعديل حلقة / مجموعة */}
      {(showAddGroupModal || editingGroup) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full sh-float border border-line">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <h3 className="font-extrabold text-lg text-ink">
                {editingGroup
                  ? `تعديل ${tab === "groups" ? "الحلقة" : "المجموعة"}`
                  : `إضافة ${tab === "groups" ? "حلقة تحفيظ" : "مجموعة تعليمية"} جديدة`}
              </h3>
              <button
                onClick={() => {
                  setShowAddGroupModal(false);
                  setEditingGroup(null);
                }}
                className="p-2 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
              className="space-y-4"
            >
              <div>
                <label className="field-label">اسم المجموعة / الحلقة *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="field"
                  placeholder="مثال: حلقة ابن الجزري / مجموعة النحو"
                />
              </div>

              {tab === "groups" ? (
                <div>
                  <label className="field-label">اختر المعلم المسؤول *</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="field field-select"
                  >
                    <option value="">-- يرجى اختيار المعلم --</option>
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.username})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="field-label">اسم مستخدم المعلم المسند إليه *</label>
                    <input
                      required
                      value={formData.teacherUsername}
                      onChange={(e) => setFormData({ ...formData, teacherUsername: e.target.value })}
                      className="field font-mono"
                      placeholder="مثال: teacher_ahmed"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      {editingGroup ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء)" : "كلمة المرور *"}
                    </label>
                    <input
                      type="password"
                      required={!editingGroup}
                      value={formData.teacherPassword}
                      onChange={(e) => setFormData({ ...formData, teacherPassword: e.target.value })}
                      className="field"
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddGroupModal(false);
                    setEditingGroup(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  {editingGroup ? "حفظ التعديلات" : "إنشاء الآن"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: إضافة طالب لمجموعة تعليمية */}
      {showAddStudentToEduModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-sm w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-4">إضافة طالب للمجموعة</h3>
            <div className="space-y-4">
              <div>
                <label className="field-label">اختر الطالب من قائمة الطلاب</label>
                <select
                  value={selectedStudentToAdd}
                  onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                  className="field field-select text-sm"
                >
                  <option value="">اختر الطالب...</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.national_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddStudentToEduModal(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddStudentToEduGroup} disabled={!selectedStudentToAdd}>
                  إضافة
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
