"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Building,
  Phone,
  MapPin,
  DollarSign,
  Lock,
} from "lucide-react";
import { settingsApi, healthApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { SchoolSettings } from "@/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    schoolName: "",
    schoolPhone: "",
    schoolAddress: "",
    monthlyFee: 200,
    adminPassword: "",
  });

  // Health Status State
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    database: string;
    timestamp: string;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const [sData, hData] = await Promise.all([
        settingsApi.get(),
        healthApi.check().catch(() => null),
      ]);
      setSettings(sData);
      setForm({
        schoolName: sData.schoolName || "",
        schoolPhone: sData.schoolPhone || "",
        schoolAddress: sData.schoolAddress || "",
        monthlyFee: sData.monthlyFee || 200,
        adminPassword: "",
      });
      setHealthStatus(hData);
    } catch {
      showToast("تعذّر تحميل إعدادات المدرسة", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsApi.update({
        schoolName: form.schoolName,
        schoolPhone: form.schoolPhone,
        schoolAddress: form.schoolAddress,
        monthlyFee: Number(form.monthlyFee),
        adminPassword: form.adminPassword || undefined,
      });
      setSettings(updated);
      setForm((prev) => ({ ...prev, adminPassword: "" }));
      showToast("تم حفظ إعدادات المدرسة بنجاح", "success");
    } catch {
      showToast("تعذّر حفظ الإعدادات", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckHealth() {
    setCheckingHealth(true);
    try {
      const hData = await healthApi.check();
      setHealthStatus(hData);
      showToast("حالة الخادم وقاعدة البيانات ممتازة", "success");
    } catch {
      showToast("تعذّر الاتصال بخدمة الفحص", "error");
    } finally {
      setCheckingHealth(false);
    }
  }

  if (loading) return <Loader size="lg" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">إعدادات المدرسة</h1>
        <p className="text-ink-mute text-sm mt-1">
          إعدادات النظام العامة، بيانات المدرسة الرسمية، والتحقق من حالة الاتصال
        </p>
      </div>

      {/* بطاقة فحص الخادم وقاعدة البيانات */}
      <div className="card !rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold ${
              healthStatus?.status === "ok"
                ? "bg-brand-soft text-brand-ink"
                : "bg-danger-soft text-danger-ink"
            }`}
          >
            <Activity size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-ink">حالة الاتصال والخدمات</h3>
            <p className="text-xs text-ink-mute">
              الخادم: {healthStatus?.status === "ok" ? "يعمل بكفاءة" : "غير مستقر"} | قاعدة
              البيانات: {healthStatus?.database === "connected" ? "متصلة (MongoDB)" : "منفصلة"}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCheckHealth}
          loading={checkingHealth}
          className="text-xs"
        >
          فحص الاتصال الآن
        </Button>
      </div>

      {/* نموذج تعديل الإعدادات */}
      <form onSubmit={handleSaveSettings} className="card !rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-ink pb-2 border-b border-line flex items-center gap-2">
            <Building size={18} className="text-brand-ink" />
            <span>البيانات الأساسية للمدرسة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">اسم المدرسة الرسمي</label>
              <input
                required
                value={form.schoolName}
                onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                className="field"
                placeholder="مدرسة الإمام نافع لتحفيظ القرآن الكريم"
              />
            </div>

            <div>
              <label className="field-label">رقم الهاتف الرسمي</label>
              <input
                value={form.schoolPhone}
                onChange={(e) => setForm({ ...form, schoolPhone: e.target.value })}
                className="field"
                placeholder="01000000000"
              />
            </div>
          </div>

          <div>
            <label className="field-label">العنوان الجغرافي</label>
            <input
              value={form.schoolAddress}
              onChange={(e) => setForm({ ...form, schoolAddress: e.target.value })}
              className="field"
              placeholder="جمهورية مصر العربية - محافظة..."
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-line">
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
              value={form.monthlyFee}
              onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
              className="field max-w-xs font-bold"
            />
            <p className="text-xs text-ink-mute mt-1">
              سيتم تطبيق هذا المبلغ افتراضيًا على كل طالب جديد يتم تسجيله.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-line">
          <h3 className="font-extrabold text-lg text-ink pb-2 border-b border-line flex items-center gap-2">
            <Lock size={18} className="text-danger-ink" />
            <span>أمان حساب الإدارة</span>
          </h3>

          <div>
            <label className="field-label">
              تغيير كلمة مرور الإدارة (اترك الحقل فارغًا للإبقاء على الحالية)
            </label>
            <input
              type="password"
              value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              className="field max-w-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-line">
          <Button type="submit" loading={saving} className="flex items-center gap-2">
            {!saving && <Save size={16} />}
            <span>حفظ جميع الإعدادات</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
