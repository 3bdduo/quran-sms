"use client";

import { useEffect, useState } from "react";
import {
  Save,
  ShieldAlert,
  DollarSign,
  Lock,
} from "lucide-react";
import { settingsApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { SchoolSettings } from "@/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState(200);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const sData = await settingsApi.get();
      setSettings(sData);
      setMonthlyFee(sData.monthlyFee || 200);
    } catch {
      showToast("تعذّر تحميل إعدادات المدرسة", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsApi.update({
        monthlyFee: Number(monthlyFee),
      });
      setSettings(updated);
      showToast("تم حفظ قيمة الاشتراك الافتراضي بنجاح", "success");
    } catch {
      showToast("تعذّر حفظ الإعدادات", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader size="lg" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">إعدادات المدرسة</h1>
        <p className="text-ink-mute text-sm mt-1">
          ضبط القيمة الافتراضية للاشتراك الشهري
        </p>
      </div>

      <form onSubmit={handleSave} className="card !rounded-2xl p-6 sm:p-8 space-y-6">

        {/* الاشتراك المالي */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-ink pb-2 border-b border-line flex items-center gap-2">
            <DollarSign size={18} className="text-gold-ink" />
            <span>الاشتراك المالي الافتراضي</span>
          </h3>

          <div>
            <label className="field-label">قيمة الاشتراك الشهري الافتراضي للطلاب الجدد (جنيه)</label>
            <input
              type="number"
              min={0}
              required
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(Number(e.target.value))}
              className="field max-w-xs font-bold"
            />
            <p className="text-xs text-ink-mute mt-1">
              سيتم تطبيق هذا المبلغ افتراضيًا على كل طالب جديد، ويمكن تعديله لكل طالب أو مجموعة من صفحة المدفوعات.
            </p>
          </div>
        </div>

        {/* أمان الحساب — عرض فقط */}
        <div className="space-y-4 pt-4 border-t border-line">
          <h3 className="font-extrabold text-lg text-ink pb-2 border-b border-line flex items-center gap-2">
            <Lock size={18} className="text-danger-ink" />
            <span>أمان حساب الإدارة</span>
          </h3>

          <div className="flex items-start gap-3 rounded-xl bg-danger-soft/60 border border-danger-ink/20 p-4">
            <ShieldAlert size={20} className="text-danger-ink mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-danger-ink text-sm">تغيير كلمة المرور غير متاح من هنا</p>
              <p className="text-xs text-ink-mute mt-0.5">
                لتغيير كلمة مرور حساب الإدارة، يرجى التواصل مع مسؤول النظام أو التعديل مباشرة من قاعدة البيانات.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-line">
          <Button type="submit" loading={saving} className="flex items-center gap-2">
            {!saving && <Save size={16} />}
            <span>حفظ الإعدادات</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
