"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
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
      ].filter(Boolean).join("\n");

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
      <div className="py-24 min-h-[70dvh] flex items-center">
        <Container className="max-w-lg text-center">
          <motion.div
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="h-20 w-20 rounded-full bg-brand-soft text-brand-ink flex items-center justify-center mx-auto mb-6 sh-lift"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <Reveal delay={0.15}>
            <h1 className="font-ruqaa font-bold text-4xl leading-[1.6] text-ink">تم استلام طلب التسجيل بنجاح</h1>
            <p className="text-ink-soft mt-3 leading-relaxed">
              شكرًا لتواصلكم معنا. سيقوم فريق الإدارة بمراجعة الطلب والتواصل معكم قريبًا لإتمام باقي خطوات التسجيل.
            </p>
          </Reveal>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-14 sm:py-24">
      <Container className="max-w-2xl">
        <SectionHeading eyebrow="التسجيل" title="سجّل ابنك الآن" description="املأ البيانات التالية وسيتواصل معك فريقنا لإتمام التسجيل" />

        <Reveal className="mt-10 sm:mt-12" delay={0.1}>
          <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-5 !rounded-[2rem]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="field-label">اسم الطالب</label>
                <input required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} className="field" />
              </div>
              <div>
                <label className="field-label">سن الطالب</label>
                <input required type="number" inputMode="numeric" min={3} max={25} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="field" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="field-label">اسم ولي الأمر</label>
                <input required value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="field" autoComplete="name" />
              </div>
              <div>
                <label className="field-label">رقم الهاتف</label>
                <input required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" autoComplete="tel" />
              </div>
            </div>

            <div>
              <label className="field-label">البريد الإلكتروني</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" autoComplete="email" />
            </div>

            <div>
              <label className="field-label">المسار التعليمي المطلوب</label>
              <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className="field field-select">
                {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">ملاحظات إضافية (اختياري)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field resize-none" />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              {!loading && <UserPlus size={18} />}
              {loading ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
            </Button>
          </form>
        </Reveal>
      </Container>
    </div>
  );
}
