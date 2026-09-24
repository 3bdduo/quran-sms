"use client";

import { useEffect, useState } from "react";
import { BookMarked, CalendarCheck, Wallet, TrendingUp, Hand, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { reportsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";

import type { Student } from "@/types";

type StudentReport = Student & { stats: { attendanceRate: number; present: number; total: number; paidMonths: number; unpaidMonths: number } };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user?.studentId) return;
    reportsApi
      .student(user.studentId)
      .then((r) => setData(r as StudentReport))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleExportWord() {
    if (!data?.id) return;
    setExporting(true);
    try {
      await downloadFile(`/exports/students/${data.id}.docx`, `تقرير-طالب-${data.name}.docx`);
      showToast("تم تنزيل تقرير الطالب (Word) بنجاح", "success");
    } catch {
      showToast("تعذّر تحميل التقرير", "error");
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <Loader size="lg" />;
  if (!data) return <p className="text-ink-mute">تعذّر تحميل بياناتك، حاول تسجيل الدخول مرة أخرى.</p>;

  const statusLabel: Record<string, string> = { paid: "مدفوع", unpaid: "غير مدفوع", exempt: "معفى" };
  const statusTone: Record<string, "green" | "red" | "gray"> = { paid: "green", unpaid: "red", exempt: "gray" };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            أهلًا بك، {data.name}{" "}
            <Hand
              size={22}
              className="inline text-gold-ink animate-wave origin-bottom-right"
              aria-hidden="true"
            />
          </h1>
          <p className="text-ink-mute text-sm mt-1">هنا ملخص تقدمك ومتابعتك في المدرسة</p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportWord}
          disabled={exporting}
          className="flex items-center gap-2"
        >
          {exporting ? <Spinner size={16} /> : <FileText size={16} />}
          <span>تحميل تقريري الرسمي (Word)</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={BookMarked} label="إجمالي المحفوظ" value={data.memorized_amount} />
        <StatCard icon={CalendarCheck} label="نسبة الحضور" value={`${data.stats.attendanceRate}%`} tone="gold" delay={0.08} />
        <StatCard icon={TrendingUp} label="أشهر مدفوعة" value={data.stats.paidMonths} delay={0.16} />
        <StatCard icon={Wallet} label="الاشتراك الشهري" value={`${data.monthly_fee} جنيه`} tone="gold" delay={0.24} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="card !rounded-2xl p-6">
            <h3 className="font-extrabold text-ink mb-5">نسبة الحضور</h3>
            <ProgressBar value={data.stats.attendanceRate} label={`${data.stats.present} من ${data.stats.total} يوم`} />
          </div>

          <div className="card !rounded-2xl p-6">
            <h3 className="font-extrabold text-ink mb-4">سجل الحفظ الأخير</h3>
            {!data.memorizationLog?.length ? (
              <p className="text-sm text-ink-mute py-4 text-center">لا يوجد سجل حفظ بعد</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.memorizationLog.slice(0, 6).map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-ink">{m.added_amount}</p>
                      {m.teacher_note && <p className="text-xs text-ink-mute mt-0.5">{m.teacher_note}</p>}
                    </div>
                    <span className="text-xs text-ink-mute font-semibold">{m.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card !rounded-2xl p-6">
            <h3 className="font-extrabold text-ink mb-4">حالة الاشتراك الشهري</h3>
            {!data.payment?.months || Object.keys(data.payment.months).length === 0 ? (
              <p className="text-sm text-ink-mute py-4 text-center">لا توجد بيانات دفع بعد</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(data.payment.months).map(([month, info]) => (
                  <div key={month} className="flex items-center justify-between bg-bg-alt rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-ink-soft">{month}</span>
                    <Badge tone={statusTone[info.status]}>{statusLabel[info.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
