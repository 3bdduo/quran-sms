"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  Phone,
  BookMarked,
  DollarSign,
  X,
  Check,
} from "lucide-react";
import { studentsApi, groupsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { Student, GroupItem } from "@/types";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [feeModalStudent, setFeeModalStudent] = useState<Student | null>(null);
  const [newFee, setNewFee] = useState<number>(200);

  // Add/Edit Form state
  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    dateOfBirth: "",
    age: 10,
    phone: "",
    memorizedAmount: "0",
    groupId: "",
    notes: "",
    password: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const [stList, grList] = await Promise.all([
        studentsApi.list(selectedGroup || undefined),
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
  }, [selectedGroup]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.national_id.includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    });
  }, [students, searchQuery]);

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.groupId) {
      showToast("يرجى اختيار الحلقة", "error");
      return;
    }
    setFormLoading(true);
    try {
      await studentsApi.create({
        ...formData,
        age: Number(formData.age),
      });
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
        dateOfBirth: formData.dateOfBirth,
        age: Number(formData.age),
        phone: formData.phone,
        memorizedAmount: formData.memorizedAmount,
        groupId: formData.groupId,
        notes: formData.notes,
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
    if (!window.confirm(`هل أنت متأكد من حذف الطالب "${name}" وجميع سجلاته نهائيًا؟`)) {
      return;
    }
    try {
      await studentsApi.remove(id);
      showToast("تم حذف الطالب بنجاح", "success");
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch {
      showToast("تعذّر حذف الطالب", "error");
    }
  }

  async function handleUpdateFee() {
    if (!feeModalStudent) return;
    try {
      await studentsApi.updateMonthlyFee(feeModalStudent.id, newFee);
      showToast("تم تحديث الاشتراك الشهري", "success");
      setStudents((prev) =>
        prev.map((s) => (s.id === feeModalStudent.id ? { ...s, monthly_fee: newFee } : s))
      );
      setFeeModalStudent(null);
    } catch {
      showToast("تعذّر تحديث الاشتراك", "error");
    }
  }

  async function handleExportExcel() {
    setExportingAll(true);
    try {
      await downloadFile("/exports/students.xlsx", "كشف-الطلاب.xlsx");
      showToast("تم تنزيل كشف الطلاب بنجاح", "success");
    } catch {
      showToast("تعذّر تنزيل ملف الإكسل", "error");
    } finally {
      setExportingAll(false);
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
      dateOfBirth: student.date_of_birth || "",
      age: student.age || 10,
      phone: student.phone || "",
      memorizedAmount: student.memorized_amount || "0",
      groupId: student.group_id || "",
      notes: student.notes || "",
      password: "",
    });
  }

  function resetForm() {
    setFormData({
      name: "",
      nationalId: "",
      dateOfBirth: "",
      age: 10,
      phone: "",
      memorizedAmount: "0",
      groupId: groups[0]?.id || "",
      notes: "",
      password: "",
    });
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">إدارة الطلاب</h1>
          <p className="text-ink-mute text-sm mt-1">
            سجل الطلاب المسجلين، إضافة طلاب جدد، وتصدير التقارير
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2"
          >
            <UserPlus size={17} />
            <span>طالب جديد</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={exportingAll}
            className="flex items-center gap-2"
          >
            {exportingAll ? <Spinner size={16} /> : <FileSpreadsheet size={17} />}
            <span>تصدير إكسل</span>
          </Button>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="card !rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الرقم القومي، أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field pr-10 text-sm py-2.5 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-ink-mute shrink-0" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="field field-select text-sm py-2.5"
          >
            <option value="">جميع الحلقات</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول الطلاب */}
      {loading ? (
        <Loader size="lg" />
      ) : filteredStudents.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <Users size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لم يتم العثور على طلاب</p>
          <p className="text-sm mt-1">جرّب تغيير معايير البحث أو إضافة طالب جديد</p>
        </div>
      ) : (
        <div className="card !rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-ink-mute text-right">
                  <th className="p-4 font-bold">الاسم</th>
                  <th className="p-4 font-bold">الرقم القومي</th>
                  <th className="p-4 font-bold">الحلقة</th>
                  <th className="p-4 font-bold">المحفوظ</th>
                  <th className="p-4 font-bold">السن / الهاتف</th>
                  <th className="p-4 font-bold">الاشتراك</th>
                  <th className="p-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const groupName = groups.find((g) => g.id === s.group_id)?.name || s.group_id;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-line last:border-0 hover:bg-brand-soft/40 transition-colors"
                    >
                      <td className="p-4 font-bold text-ink whitespace-nowrap">{s.name}</td>
                      <td className="p-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                        {s.national_id}
                      </td>
                      <td className="p-4 text-xs font-semibold text-brand-ink whitespace-nowrap">
                        <span className="bg-brand-soft px-2.5 py-1 rounded-lg">{groupName}</span>
                      </td>
                      <td className="p-4 text-ink-soft whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-bold text-xs bg-gold-soft text-gold-ink px-2.5 py-1 rounded-lg">
                          <BookMarked size={13} /> {s.memorized_amount || "0"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-ink-soft whitespace-nowrap">
                        <div>{s.age} سنة</div>
                        {s.phone && (
                          <div className="flex items-center gap-1 text-ink-mute mt-0.5">
                            <Phone size={11} /> {s.phone}
                          </div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setFeeModalStudent(s);
                            setNewFee(s.monthly_fee || 200);
                          }}
                          className="text-xs font-bold text-ink hover:text-brand-ink underline decoration-dashed transition-colors"
                        >
                          {s.monthly_fee} ج/شهر
                        </button>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleExportStudentWord(s.id, s.name)}
                            disabled={downloadingId === s.id}
                            title="تصدير تقرير وورد"
                            className="p-2 rounded-lg bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors disabled:opacity-50"
                          >
                            {downloadingId === s.id ? (
                              <Spinner size={15} />
                            ) : (
                              <FileText size={15} />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            title="تعديل بيانات الطالب"
                            className="p-2 rounded-lg bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            title="حذف الطالب"
                            className="p-2 rounded-lg bg-bg-alt hover:bg-danger-soft text-ink-soft hover:text-danger-ink transition-colors"
                          >
                            <Trash2 size={15} />
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

      {/* Modal: إضافة / تعديل طالب */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full sh-float border border-line overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <h3 className="font-extrabold text-lg text-ink">
                {editingStudent ? "تعديل بيانات الطالب" : "تسجيل طالب جديد"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="p-2 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">اسم الطالب الكامل *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="field"
                    placeholder="مثال: يوسف أحمد محمد"
                  />
                </div>
                <div>
                  <label className="field-label">الرقم القومي (14 رقم) *</label>
                  <input
                    required
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="field font-mono"
                    placeholder="2980101..."
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
                        {g.name} (معلم: {g.teacherUsername})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">رقم الهاتف</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="field"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">تاريخ الميلاد *</label>
                  <input
                    required
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">السن *</label>
                  <input
                    required
                    type="number"
                    min={3}
                    max={30}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">المحفوظ الحالي</label>
                  <input
                    value={formData.memorizedAmount}
                    onChange={(e) => setFormData({ ...formData, memorizedAmount: e.target.value })}
                    className="field"
                    placeholder="مثال: 5 أجزاء"
                  />
                </div>
              </div>

              {!editingStudent && (
                <div>
                  <label className="field-label">كلمة مرور حساب الطالب (اختياري)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="field"
                    placeholder="افتراضي: بدون كلمة مرور أو حدد كلمة"
                  />
                </div>
              )}

              <div>
                <label className="field-label">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="field resize-none"
                  placeholder="أي ملاحظات تخص الطالب أو حالته الصحية..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  {editingStudent ? "حفظ التعديلات" : "إضافة الطالب"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: تعديل الاشتراك الشهري */}
      {feeModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-sm w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-2">تعديل الاشتراك الشهري</h3>
            <p className="text-xs text-ink-mute mb-4">
              للطالب: <span className="font-bold text-ink">{feeModalStudent.name}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="field-label">قيمة الاشتراك (بالجنيه)</label>
                <input
                  type="number"
                  min={0}
                  value={newFee}
                  onChange={(e) => setNewFee(Number(e.target.value))}
                  className="field"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setFeeModalStudent(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdateFee}>حفظ القيمة</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
