"use client";

import { useEffect, useState } from "react";
import { BookMarked, Calendar, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { memorizationApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import type { MemorizationEntry } from "@/types";

export default function StudentMemorizationPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MemorizationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user?.studentId) {
      setLoading(false);
      return;
    }
    memorizationApi
      .findByStudent(user.studentId)
      .then(setLogs)
      .catch(() => showToast("تعذّر تحميل سجل الحفظ", "error"))
      .finally(() => setLoading(false));
  }, [user?.studentId]);

  if (loading) return <Loader size="lg" />;

  const latestAmount = logs[0]?.total_after || "0";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">سجل حفظي وتسميعي</h1>
          <p className="text-ink-mute text-sm mt-1">
            سجل متابعة تسميع القرآن الكريم المسجل من قبل شيخ الحلقة
          </p>
        </div>

        <div className="bg-gold-soft text-gold-ink px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-sm">
          <Award size={18} />
          <span>إجمالي المحفوظ: {latestAmount}</span>
        </div>
      </div>

      {!logs.length ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <BookMarked size={44} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لم يتم رصد جلسات تسميع لك بعد</p>
          <p className="text-xs mt-1">سيقوم معلم حلقتك برصد مقادير التسميع والمراجعة اليومية هنا</p>
        </div>
      ) : (
        <div className="card !rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">المقدار المسموع في الجلسة</th>
                  <th className="p-4 font-bold">إجمالي المحفوظ بعد الجلسة</th>
                  <th className="p-4 font-bold">ملاحظات وتقييم المعلم</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-ink whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="p-4 font-bold text-brand-ink whitespace-nowrap">
                      {log.added_amount}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="bg-gold-soft text-gold-ink font-bold text-xs px-2.5 py-1 rounded-lg">
                        {log.total_after}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-ink-soft leading-relaxed">
                      {log.teacher_note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
