"use client";

import { FormEvent, useState } from "react";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useToast } from "@/components/ui/Toast";
import { contactApi } from "@/lib/resources";
import { ApiError } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await contactApi.submit(form);
      showToast(res.message, "success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ، حاول مرة أخرى", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-14 sm:py-24">
      <Container>
        <SectionHeading eyebrow="تواصل معنا" title="نسعد بتواصلكم معنا" />

        <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 max-w-5xl mx-auto">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4 sm:gap-5 content-start">
            {[
              { icon: Phone, title: "الهاتف", value: "01000000000", ltr: true },
              { icon: Mail, title: "البريد الإلكتروني", value: "info@quran-school.com", ltr: true },
              { icon: MapPin, title: "العنوان", value: "جمهورية مصر العربية", ltr: false },
            ].map(({ icon: Icon, title, value, ltr }, i) => (
              <Reveal key={title} delay={i * 0.1} from="start">
                <div className="group card-interactive flex items-center gap-4 p-5 !rounded-2xl">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-brand-soft group-hover:bg-brand flex items-center justify-center text-brand-ink group-hover:text-on-brand transition-all duration-500 sh-soft">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-mute font-bold">{title}</p>
                    <p className="font-bold text-ink break-words" dir={ltr ? "ltr" : undefined} style={ltr ? { textAlign: "start" } : undefined}>
                      {value}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal from="end" className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-5 !rounded-[2rem]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="field-label">الاسم</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="field"
                    placeholder="اسمك الكامل"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="field-label">رقم الهاتف</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="field"
                    placeholder="01xxxxxxxxx"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">البريد الإلكتروني</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="field"
                  placeholder="example@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="field-label">رسالتك</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="field resize-none"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                {!loading && <Send size={18} />}
                {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
              </Button>
            </form>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
