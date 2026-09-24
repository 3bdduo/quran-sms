"use client";

import { useEffect, useState } from "react";
import { Users, Phone, BookMarked } from "lucide-react";
import { studentsApi } from "@/lib/resources";
import { Loader } from "@/components/ui/Loader";
import { StatCard } from "@/components/dashboard/StatCard";
import { NotificationsList } from "@/components/dashboard/NotificationsList";
import type { Student } from "@/types";

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentsApi
      .listMine()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader size="lg" />;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">لوحة المعلم</h1>
        <p className="text-ink-mute text-sm mt-1">نظرة عامة على طلاب حلقتك</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Users} label="عدد الطلاب" value={students.length} />
        <StatCard
          icon={BookMarked}
          label="متوسط المحفوظ"
          value={students.length ? "متوفر لكل طالب" : "-"}
          tone="gold"
          delay={0.08}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card !rounded-2xl overflow-hidden">
          <h3 className="font-extrabold text-ink p-6 pb-0">طلاب الحلقة</h3>
          {students.length === 0 ? (
            <p className="text-sm text-ink-mute p-10 text-center">لا يوجد طلاب مسجلين في حلقتك بعد</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-ink-mute border-y border-line bg-bg-alt/60">
                    <th className="font-bold p-4">الاسم</th>
                    <th className="font-bold p-4">السن</th>
                    <th className="font-bold p-4">المحفوظ</th>
                    <th className="font-bold p-4">الهاتف</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-line last:border-0 hover:bg-brand-soft/60 transition-colors">
                      <td className="p-4 font-bold text-ink">{s.name}</td>
                      <td className="p-4 text-ink-soft">{s.age}</td>
                      <td className="p-4 text-ink-soft">{s.memorized_amount}</td>
                      <td className="p-4 text-ink-soft">
                        {s.phone ? (
                          <span className="flex items-center gap-1.5"><Phone size={13} /> {s.phone}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <NotificationsList />
      </div>
    </div>
  );
}
