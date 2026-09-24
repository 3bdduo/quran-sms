"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  BookMarked,
  Phone,
  FileText,
  Edit2,
  X,
  Search,
} from "lucide-react";
import { studentsApi, groupsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { Student } from "@/types";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({
    name: "",
    nationalId: "",
    dateOfBirth: "",
    age: 10,
    phone: "",
    memorizedAmount: "0",
    groupId: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const [sData, gData] = await Promise.all([
        studentsApi.listMine(),
        groupsApi.mine()
      ]);
      setStudents(sData);
      setGroups(gData);
    } catch {
      showToast("تعذّر تحميل بيانات طلاب الحلقة", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, {
          name: form.name,
          nationalId: form.nationalId,
          dateOfBirth: form.dateOfBirth,
          age: Number(form.age),
          phone: form.phone,
          memorizedAmount: form.memorizedAmount,
          notes: form.notes,
        });
        showToast("تم تحديث بيانات الطالب بنجاح", "success");
      } else {
        await studentsApi.create({
          ...form,
          age: Number(form.age),
          groupId: form.groupId || (groups.length === 1 ? groups[0].id : undefined)
        });
        showToast("تمت إضافة الطالب للحلقة بنجاح", "success");
      }
      setShowAddModal(false);
      setEditingStudent(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر الحفظ", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleExportWord(id: string, name: string) {
    setDownloadingId(id);
    try {
      await downloadFile(`/exports/students/${id}.docx`, `تقرير-طالب-${name}.docx`);
      showToast("تم تنزيل تقرير الطالب (Word)", "success");
    } catch {
      showToast("تعذّر تنزيل التقرير", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.national_id.includes(search) ||
      (s.phone && s.phone.includes(search))
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">طلاب حلقتي</h1>
          <p className="text-ink-mute text-sm mt-1">
            متابعة بيانات طلاب الحلقة وإضافة طلاب جدد وتنزيل التقارير الفردية
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingStudent(null);
            setForm({
              name: "",
              nationalId: "",
              dateOfBirth: "",
              age: 10,
              phone: "",
              memorizedAmount: "0",
              groupId: "",
              notes: "",
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2"
        >
          <UserPlus size={17} />
          <span>إضافة طالب للحلقة</span>
        </Button>
      </div>

      {/* البحث */}
      <div className="card !rounded-2xl p-4">
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder="ابحث باسم الطالب أو الرقم القومي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pr-10 text-sm py-2.5 w-full"
          />
        </div>
      </div>

      {/* جدول الطلاب */}
      {loading ? (
        <Loader size="lg" />
      ) : filtered.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <Users size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لا يوجد طلاب مسجلون في حلقتك</p>
        </div>
      ) : (
        <div className="card !rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">الاسم</th>
                  <th className="p-4 font-bold">الرقم القومي</th>
                  <th className="p-4 font-bold">السن</th>
                  <th className="p-4 font-bold">المحفوظ الحالي</th>
                  <th className="p-4 font-bold">رقم الهاتف</th>
                  <th className="p-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-ink whitespace-nowrap">{s.name}</td>
                    <td className="p-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                      {s.national_id}
                    </td>
                    <td className="p-4 text-ink-soft whitespace-nowrap">{s.age} سنة</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-bold text-xs bg-gold-soft text-gold-ink px-2.5 py-1 rounded-lg">
                        <BookMarked size={13} /> {s.memorized_amount || "0"}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-ink-soft whitespace-nowrap">
                      {s.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {s.phone}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleExportWord(s.id, s.name)}
                          disabled={downloadingId === s.id}
                          title="تصدير تقرير الطالب (Word)"
                          className="p-2 rounded-lg bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors"
                        >
                          {downloadingId === s.id ? (
                            <Spinner size={15} />
                          ) : (
                            <FileText size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(s);
                            setForm({
                              name: s.name,
                              nationalId: s.national_id,
                              dateOfBirth: s.date_of_birth || "",
                              age: s.age || 10,
                              phone: s.phone || "",
                              memorizedAmount: s.memorized_amount || "0",
                              groupId: s.group_id || "",
                              notes: s.notes || "",
                            });
                            setShowAddModal(true);
                          }}
                          title="تعديل بيانات الطالب"
                          className="p-2 rounded-lg bg-bg-alt hover:bg-brand-soft text-ink-soft hover:text-brand-ink transition-colors"
                        >
                          <Edit2 size={15} />
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

      {/* Modal: إضافة أو تعديل طالب */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full sh-float border border-line overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="font-extrabold text-lg text-ink">
                {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب جديد للحلقتي"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">اسم الطالب *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">الرقم القومي (14 رقم) *</label>
                  <input
                    required
                    value={form.nationalId}
                    onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                    className="field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">تاريخ الميلاد *</label>
                  <input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
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
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">المحفوظ الحالي</label>
                  <input
                    value={form.memorizedAmount}
                    onChange={(e) => setForm({ ...form, memorizedAmount: e.target.value })}
                    className="field"
                    placeholder="مثال: 3 أجزاء"
                  />
                </div>
                {!editingStudent && groups.length > 1 && (
                  <div>
                    <label className="field-label">إضافة إلى حلقة *</label>
                    <select
                      required
                      value={form.groupId}
                      onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                      className="field field-select text-sm"
                    >
                      <option value="">-- اختر الحلقة --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="field-label">رقم الهاتف للتواصل</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">ملاحظات المعلم</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="field resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  حفظ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
