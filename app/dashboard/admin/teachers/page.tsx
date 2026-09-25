"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Download, Search, Users, CircleHelp } from "lucide-react";
import { teachersApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { Teacher } from "@/types";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    national_id: "",
    phone: "",
    password: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // المعلم اللي بنطلب منه يحدد نوعه دلوقتي (حلقة / عادي) — بيتفتح تلقائي بعد إضافة معلم جديد
  const [typeTeacher, setTypeTeacher] = useState<Teacher | null>(null);
  const [typeLoading, setTypeLoading] = useState<"group" | "other" | null>(null);

  const { showToast } = useToast();

  async function loadTeachers() {
    setLoading(true);
    try {
      const data = await teachersApi.list();
      setTeachers(data);
      setFilteredTeachers(data);
    } catch {
      showToast("تعذّر تحميل بيانات المعلمين", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredTeachers(teachers);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredTeachers(
      teachers.filter(
        (t) =>
          t.full_name.toLowerCase().includes(lower) ||
          t.national_id.includes(lower) ||
          t.username.toLowerCase().includes(lower) ||
          (t.phone && t.phone.includes(lower))
      )
    );
  }, [search, teachers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingTeacher) {
        await teachersApi.update(editingTeacher.id, {
          full_name: formData.full_name,
          national_id: formData.national_id,
          phone: formData.phone || undefined,
          password: formData.password || undefined,
        });
        showToast("تم تحديث بيانات المعلم بنجاح", "success");
      } else {
        const created = await teachersApi.create({
          full_name: formData.full_name,
          national_id: formData.national_id,
          phone: formData.phone || undefined,
          password: formData.password,
        });
        showToast("تم إضافة المعلم بنجاح", "success");
        // مباشرة بعد الإضافة، لازم الأدمن يحدد نوع المعلم: معلم حلقة (يقدر يكون عنده طلاب) أو معلم عادي (بدون طلاب)
        setTypeTeacher(created);
      }
      setShowModal(false);
      resetForm();
      loadTeachers();
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSetType(type: "group" | "other") {
    if (!typeTeacher) return;
    setTypeLoading(type);
    try {
      await teachersApi.setType(typeTeacher.id, type);
      showToast(
        type === "group" ? "تم تحديد المعلم كمعلم حلقة" : "تم تحديد المعلم كمعلم عادي",
        "success"
      );
      setTypeTeacher(null);
      loadTeachers();
    } catch (err: any) {
      showToast(err.message || "تعذّر تحديد نوع المعلم", "error");
    } finally {
      setTypeLoading(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`هل أنت متأكد من حذف المعلم "${name}"؟ هذا سيؤدي لفصله من جميع حلقاته.`)) {
      return;
    }
    try {
      await teachersApi.remove(id);
      showToast("تم الحذف بنجاح", "success");
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  function resetForm() {
    setFormData({ full_name: "", national_id: "", phone: "", password: "" });
    setEditingTeacher(null);
  }

  function openEdit(t: Teacher) {
    setEditingTeacher(t);
    setFormData({
      full_name: t.full_name,
      national_id: t.national_id,
      phone: t.phone || "",
      password: "",
    });
    setShowModal(true);
  }

  async function handleExport() {
    try {
      await downloadFile("/exports/teachers.xlsx", "تقرير-المعلمين.xlsx");
    } catch {
      // toast already shown by parent if needed
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">إدارة المعلمين</h1>
          <p className="text-ink-mute text-sm mt-1">سجل المعلمين وصلاحيات الدخول والحلقات المسندة</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download size={17} />
            <span>تصدير Excel</span>
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={17} />
            <span>معلم جديد</span>
          </Button>
        </div>
      </div>

      <div className="card p-2 sm:p-4 !rounded-2xl">
        <div className="relative mb-4">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
          <input
            type="text"
            placeholder="ابحث بالاسم، الرقم القومي، أو اسم المستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field !pl-4 !pr-11"
          />
        </div>

        {loading ? (
          <Loader size="lg" className="my-12" />
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12 text-ink-mute">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p>لا يوجد معلمين مسجلين أو لم يتم العثور على نتائج للبحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-line bg-bg-alt/50 text-right text-ink-mute">
                  <th className="p-4 font-bold">الاسم رباعي</th>
                  <th className="p-4 font-bold">الرقم القومي</th>
                  <th className="p-4 font-bold">اسم المستخدم (للدخول)</th>
                  <th className="p-4 font-bold">الهاتف</th>
                  <th className="p-4 font-bold">نوع المعلم</th>
                  <th className="p-4 font-bold">الحلقات المسندة</th>
                  <th className="p-4 font-bold text-center min-w-[100px] w-28">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="border-b border-line hover:bg-bg-alt/30 transition-colors">
                    <td className="p-4 font-bold text-ink">{t.full_name}</td>
                    <td className="p-4 font-mono text-xs text-ink-soft">{t.national_id}</td>
                    <td className="p-4 font-mono font-bold text-brand-ink">{t.username}</td>
                    <td className="p-4 text-ink-soft">{t.phone || "-"}</td>
                    <td className="p-4">
                      {t.teacher_type === "group" ? (
                        <button
                          onClick={() => setTypeTeacher(t)}
                          className="px-2 py-1 bg-brand-soft text-brand-ink rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                          title="اضغط لتغيير النوع"
                        >
                          معلم حلقة
                        </button>
                      ) : t.teacher_type === "other" ? (
                        <button
                          onClick={() => setTypeTeacher(t)}
                          className="px-2 py-1 bg-bg-alt text-ink-soft rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                          title="اضغط لتغيير النوع"
                        >
                          معلم عادي
                        </button>
                      ) : (
                        <button
                          onClick={() => setTypeTeacher(t)}
                          className="flex items-center gap-1 px-2 py-1 bg-danger-soft text-danger-ink rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                          title="لسه محدّدش نوعه"
                        >
                          <CircleHelp size={13} />
                          <span>حدد النوع</span>
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-ink-soft">
                      {t.groups && t.groups.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.groups.map((g) => (
                            <span key={g.id} className="px-2 py-0.5 bg-brand-soft text-brand-ink rounded text-xs font-bold">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-mute text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap min-w-[100px] w-28">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-2 text-ink-mute hover:text-brand-ink hover:bg-brand-soft rounded-xl transition-all shrink-0"
                          title="تعديل البيانات"
                        >
                          <Edit2 size={17} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.full_name)}
                          className="p-2 text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-xl transition-all shrink-0"
                          title="حذف المعلم"
                        >
                          <Trash2 size={17} />
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-5 pb-4 border-b border-line">
              {editingTeacher ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">الاسم رباعي باللغة العربية *</label>
                <input
                  required
                  minLength={5}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="field"
                  placeholder="مثال: أحمد محمود السيد علي"
                />
              </div>

              <div>
                <label className="field-label">الرقم القومي (14 رقم) *</label>
                <input
                  required
                  pattern="\d{14}"
                  title="الرقم القومي يجب أن يكون 14 رقماً"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  className="field font-mono"
                  placeholder="29001010101010"
                />
              </div>

              <div>
                <label className="field-label">الهاتف (اختياري)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="field font-mono text-right"
                  placeholder="010XXXXXXXX"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="field-label">
                  {editingTeacher ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء)" : "كلمة المرور *"}
                </label>
                <input
                  type="password"
                  required={!editingTeacher}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="field"
                  placeholder="••••••••"
                />
              </div>

              {!editingTeacher && (
                <div className="p-3 bg-brand-soft/50 rounded-xl border border-brand-soft text-xs text-brand-ink/80 leading-relaxed">
                  سيقوم النظام تلقائياً بتوليد <strong>اسم مستخدم (Username)</strong> باللغة الإنجليزية بناءً على الاسم المدخل ليستخدمه المعلم في تسجيل الدخول.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  {editingTeacher ? "حفظ التعديلات" : "إضافة المعلم"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {typeTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-2">تحديد نوع المعلم</h3>
            <p className="text-ink-mute text-sm mb-5">
              المعلم <strong className="text-ink">{typeTeacher.full_name}</strong> لازم يتحدد نوعه الأول:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSetType("group")}
                disabled={typeLoading !== null}
                className="w-full text-right p-4 rounded-2xl border-2 border-brand-soft hover:border-brand-ink hover:bg-brand-soft/40 transition-colors disabled:opacity-60"
              >
                <div className="font-bold text-ink mb-1">
                  {typeLoading === "group" ? "جاري الحفظ..." : "معلم حلقة"}
                </div>
                <p className="text-xs text-ink-mute leading-relaxed">
                  هيتعمله حلقة تلقائي، ويقدر يتضافله طلاب مباشرة زي أي معلم حلقة عادي.
                </p>
              </button>

              <button
                onClick={() => handleSetType("other")}
                disabled={typeLoading !== null}
                className="w-full text-right p-4 rounded-2xl border-2 border-line hover:border-ink-mute hover:bg-bg-alt/40 transition-colors disabled:opacity-60"
              >
                <div className="font-bold text-ink mb-1">
                  {typeLoading === "other" ? "جاري الحفظ..." : "معلم عادي"}
                </div>
                <p className="text-xs text-ink-mute leading-relaxed">
                  مينفعش يتضافله طلاب مباشرة (زي معلمي التفسير والتجويد ومواد المجموعات التعليمية).
                </p>
              </button>
            </div>

            <p className="text-[11px] text-ink-mute mt-4 text-center">
              تقدر تغيّر النوع في أي وقت من جدول المعلمين
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
