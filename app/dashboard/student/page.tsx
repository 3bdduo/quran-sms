"use client";

import { useEffect, useState } from "react";
import { BookMarked, CalendarCheck, Wallet, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { reportsApi } from "@/lib/resources";
import { Loader } from "@/components/ui/Loader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { NotificationsList } from "@/components/dashboard/NotificationsList";
import type { Student } from "@/types";

type StudentReport = Student & { stats: { attendanceRate: number; present: number; total: number; paidMonths: number; unpaidMonths: number } };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;
    reportsApi
      .student(user.studentId)
      .then((r) => setData(r as StudentReport))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Loader />;
  if (!data) return <p className="text-emerald-900/50">تعذّر تحميل بياناتك، حاول تسجيل الدخول مرة أخرى.</p>;

  const statusLabel: Record<string, string> = { paid: "مدفوع", unpaid: "غير مدفوع", exempt: "معفى" };
  const statusTone: Record<string, "green" | "red" | "gray"> = { paid: "green", unpaid: "red", exempt: "gray" };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">أهلًا بك، {data.name} 👋</h1>
        <p className="text-emerald-900/50 text-sm mt-1">هنا ملخص تقدمك ومتابعتك في المدرسة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookMarked} label="إجمالي المحفوظ" value={data.memorized_amount} />
        <StatCard icon={CalendarCheck} label="نسبة الحضور" value={`${data.stats.attendanceRate}%`} tone="gold" />
        <StatCard icon={TrendingUp} label="أشهر مدفوعة" value={data.stats.paidMonths} />
        <StatCard icon={Wallet} label="الاشتراك الشهري" value={`${data.monthly_fee} جنيه`} tone="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-emerald-900/5 p-6">
            <h3 className="font-extrabold text-emerald-950 mb-5">نسبة الحضور</h3>
            <ProgressBar value={data.stats.attendanceRate} label={`${data.stats.present} من ${data.stats.total} يوم`} />
          </div>

          <div className="bg-white rounded-2xl border border-emerald-900/5 p-6">
            <h3 className="font-extrabold text-emerald-950 mb-4">سجل الحفظ الأخير</h3>
            {!data.memorizationLog?.length ? (
              <p className="text-sm text-emerald-900/40 py-4 text-center">لا يوجد سجل حفظ بعد</p>
            ) : (
              <ul className="divide-y divide-emerald-900/5">
                {data.memorizationLog.slice(0, 6).map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-emerald-950">{m.added_amount}</p>
                      {m.teacher_note && <p className="text-xs text-emerald-900/50 mt-0.5">{m.teacher_note}</p>}
                    </div>
                    <span className="text-xs text-emerald-900/40 font-semibold">{m.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-emerald-900/5 p-6">
            <h3 className="font-extrabold text-emerald-950 mb-4">حالة الاشتراك الشهري</h3>
            {!data.payment?.months || Object.keys(data.payment.months).length === 0 ? (
              <p className="text-sm text-emerald-900/40 py-4 text-center">لا توجد بيانات دفع بعد</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(data.payment.months).map(([month, info]) => (
                  <div key={month} className="flex items-center justify-between bg-cream-50 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-emerald-900">{month}</span>
                    <Badge tone={statusTone[info.status]}>{statusLabel[info.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <NotificationsList />
      </div>
    </div>
  );
}
