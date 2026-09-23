"use client";

import { FormEvent, useState } from "react";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
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
    <div className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="تواصل معنا" title="نسعد بتواصلكم معنا" />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          <div className="lg:col-span-2 space-y-5">
            {[
              { icon: Phone, title: "الهاتف", value: "01000000000" },
              { icon: Mail, title: "البريد الإلكتروني", value: "info@quran-school.com" },
              { icon: MapPin, title: "العنوان", value: "جمهورية مصر العربية" },
            ].map(({ icon: Icon, title, value }) => (
              <div key={title} className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-emerald-900/5">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-emerald-900/50 font-bold">{title}</p>
                  <p className="font-bold text-emerald-950">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-3xl border border-emerald-900/5 p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-emerald-900 mb-1.5 block">الاسم</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  placeholder="اسمك الكامل"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-emerald-900 mb-1.5 block">رقم الهاتف</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">البريد الإلكتروني</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">رسالتك</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition resize-none"
                placeholder="اكتب رسالتك هنا..."
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Send size={18} />
              {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
}
