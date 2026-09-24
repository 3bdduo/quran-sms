"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { attendanceApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/dashboard/StatCard";

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<{ date: string; status: string }[]>([]);
  const [rateInfo, setRateInfo] = useState<{ rate: number; present: number; total: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user?.studentId) {
      setLoading(false);
      return;
    }
    Promise.all([
      attendanceApi.byStudent(user.studentId),
      attendanceApi.rate(user.studentId),
    ])
      .then(([recList, rateRes]) => {
        setRecords(recList);
        setRateInfo(rateRes);
      })
      .catch(() => showToast("تعذّر تحميل كشف الحضور", "error"))
      .finally(() => setLoading(false));
  }, [user?.studentId]);

  if (loading) return <Loader size="lg" />;

  const absentDays = (rateInfo?.total ?? 0) - (rateInfo?.present ?? 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">سجل حضوري وغيابي</h1>
        <p className="text-ink-mute text-sm mt-1">
          متابعة نسبة الحضور اليومي وأيام الغياب والاستئذان في الحلقة
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={CalendarCheck}
          label="نسبة الالتزام بالحضور"
          value={`${rateInfo?.rate ?? 0}%`}
          tone="gold"
        />
        <StatCard
          icon={CheckCircle2}
          label="أيام الحضور الفعلي"
          value={`${rateInfo?.present ?? 0} يوم`}
          delay={0.08}
        />
        <StatCard
          icon={XCircle}
          label="أيام الغياب"
          value={`${absentDays > 0 ? absentDays : 0} يوم`}
          delay={0.16}
        />
      </div>

      {rateInfo && (
        <div className="card !rounded-2xl p-6">
          <h3 className="font-extrabold text-base text-ink mb-4">مؤشر الحضور الكلي</h3>
          <ProgressBar
            value={rateInfo.rate}
            label={`${rateInfo.present} من إجمالي ${rateInfo.total} يوم دراسي`}
          />
        </div>
      )}

      {/* جدول الحضور */}
      <div className="card !rounded-2xl overflow-hidden shadow-sm">
        <h3 className="font-extrabold text-lg text-ink p-6 pb-2">التفاصيل اليومية</h3>
        {!records.length ? (
          <p className="text-center text-ink-mute p-10">لا يوجد سجلات حضور مسجلة بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-ink whitespace-nowrap">{r.date}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                          r.status === "حاضر"
                            ? "bg-brand-soft text-brand-ink"
                            : r.status === "غائب"
                            ? "bg-danger-soft text-danger-ink"
                            : "bg-gold-soft text-gold-ink"
                        }`}
                      >
                        {r.status === "حاضر" ? (
                          <CheckCircle2 size={13} />
                        ) : r.status === "غائب" ? (
                          <XCircle size={13} />
                        ) : (
                          <Clock size={13} />
                        )}
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
