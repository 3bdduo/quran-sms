"use client";

import { FormEvent, useState } from "react";
import { m } from "framer-motion";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useToast } from "@/components/ui/Toast";
import { studentsApi } from "@/lib/resources";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    nationalId: "",
    memorizedAmount: "",
    currentSurah: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (form.nationalId.length !== 14) {
      showToast("الرقم القومي يجب أن يكون 14 رقمًا", "error");
      return;
    }

    setLoading(true);
    try {
      await studentsApi.publicRegister({
        name: form.name,
        nationalId: form.nationalId,
        memorizedAmount: form.memorizedAmount || "0",
        currentSurah: form.currentSurah || "غير محدد",
        phone: form.phone,
      });
      setSuccess(true);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "حدث خطأ، حاول مرة أخرى",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="py-24 min-h-[70dvh] flex items-center">
        <Container className="max-w-lg text-center">
          <m.div
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 117, damping: 14 }}
            className="h-20 w-20 rounded-full bg-brand-soft text-brand-ink flex items-center justify-center mx-auto mb-6 sh-lift"
          >
            <CheckCircle2 size={40} />
          </m.div>
          <Reveal delay={0.15}>
            <h1 className="font-ruqaa font-bold text-4xl leading-[1.6] text-ink">
              تم استلام طلب التسجيل بنجاح
            </h1>
            <p className="text-ink-soft mt-3 leading-relaxed">
              شكرًا لتواصلكم معنا. سيقوم فريق الإدارة بمراجعة الطلب والتواصل
              معكم قريبًا لإتمام باقي خطوات التسجيل.
            </p>
          </Reveal>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-14 sm:py-24">
      <Container className="max-w-2xl">
        <SectionHeading
          eyebrow="التسجيل"
          title="سجّل ابنك الآن"
          description="املأ البيانات التالية وسيتواصل معك فريقنا لإتمام التسجيل"
        />

        <Reveal className="mt-10 sm:mt-12" delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="card p-6 sm:p-8 space-y-5 !rounded-[2rem]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="field-label">الاسم رباعي *</label>
                <input
                  required
                  value={form.name}
                  onChange={handleChange("name")}
                  className="field"
                  placeholder="الاسم رباعي بالكامل"
                />
              </div>
              <div>
                <label className="field-label">الرقم القومي (14 رقم) *</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={14}
                  minLength={14}
                  value={form.nationalId}
                  onChange={handleChange("nationalId")}
                  className="field font-mono"
                  placeholder="14 رقم"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="field-label">رقم الهاتف *</label>
                <input
                  required
                  inputMode="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="field"
                  autoComplete="tel"
                  placeholder="مثال: 01000000000"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="field-label">عدد الأجزاء *</label>
                <input
                  required
                  value={form.memorizedAmount}
                  onChange={handleChange("memorizedAmount")}
                  className="field"
                  placeholder="مثال: 3 أجزاء"
                />
              </div>
            </div>

            <div>
              <label className="field-label">السورة بالضبط *</label>
              <input
                required
                value={form.currentSurah}
                onChange={handleChange("currentSurah")}
                className="field"
                placeholder="مثال: سورة البقرة"
              />
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
