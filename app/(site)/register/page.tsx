"use client";

import { FormEvent, useState } from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { contactApi } from "@/lib/resources";
import { ApiError } from "@/lib/api";

const tracks = ["تحفيظ القرآن الكريم", "التفسير والتجويد", "العلوم الشرعية", "اللغة العربية"];

// ملحوظة: التسجيل حاليًا بيتبعت كـ "طلب تسجيل" لإدارة المدرسة (عن طريق نظام
// الرسائل)، وبعدها الإدارة بتنشئ حساب الطالب فعليًا من لوحة التحكم.
// التسجيل الذاتي المباشر (إنشاء حساب طالب تلقائي) محتاج إضافة على الباك إند.
export default function RegisterPage() {
  const [form, setForm] = useState({
    studentName: "", parentName: "", email: "", phone: "", age: "", track: tracks[0], notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const message = [
        `طلب تسجيل طالب جديد`,
        `اسم الطالب: ${form.studentName}`,
        `اسم ولي الأمر: ${form.parentName}`,
        `السن: ${form.age}`,
        `المسار المطلوب: ${form.track}`,
        form.notes ? `ملاحظات: ${form.notes}` : "",
      ].filter(Boolean).join("\\n");

      await contactApi.submit({ name: form.parentName, email: form.email, phone: form.phone, message });
      setSuccess(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ، حاول مرة أخرى", "error");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="py-24 min-h-[70vh] flex items-center">
        <Container className="max-w-lg text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-950">تم استلام طلب التسجيل بنجاح</h1>
          <p className="text-emerald-900/60 mt-3 leading-relaxed">
            شكرًا لتواصلكم معنا. سيقوم فريق الإدارة بمراجعة الطلب والتواصل معكم قريبًا لإتمام باقي خطوات التسجيل.
          </p>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-24">
      <Container className="max-w-2xl">
        <SectionHeading eyebrow="التسجيل" title="سجّل ابنك الآن" description="املأ البيانات التالية وسيتواصل معك فريقنا لإتمام التسجيل" />

        <form onSubmit={handleSubmit} className="mt-12 bg-white rounded-3xl border border-emerald-900/5 p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">اسم الطالب</label>
              <input required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
            </div>
            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">سن الطالب</label>
              <input required type="number" min={3} max={25} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">اسم ولي الأمر</label>
              <input required value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
            </div>
            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">رقم الهاتف</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-emerald-900 mb-1.5 block">البريد الإلكتروني</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
          </div>

          <div>
            <label className="text-sm font-bold text-emerald-900 mb-1.5 block">المسار التعليمي المطلوب</label>
            <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}
              className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white">
              {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-emerald-900 mb-1.5 block">ملاحظات إضافية (اختياري)</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition resize-none" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <UserPlus size={18} />
            {loading ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
          </Button>
        </form>
      </Container>
    </div>
  );
}
