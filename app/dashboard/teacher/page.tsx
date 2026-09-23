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

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">لوحة المعلم</h1>
        <p className="text-emerald-900/50 text-sm mt-1">نظرة عامة على طلاب حلقتك</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Users} label="عدد الطلاب" value={students.length} />
        <StatCard
          icon={BookMarked}
          label="متوسط المحفوظ"
          value={students.length ? "متوفر لكل طالب" : "-"}
          tone="gold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-900/5 overflow-hidden">
          <h3 className="font-extrabold text-emerald-950 p-6 pb-0">طلاب الحلقة</h3>
          {students.length === 0 ? (
            <p className="text-sm text-emerald-900/40 p-10 text-center">لا يوجد طلاب مسجلين في حلقتك بعد</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-emerald-900/50 border-y border-emerald-900/5">
                    <th className="font-bold p-4">الاسم</th>
                    <th className="font-bold p-4">السن</th>
                    <th className="font-bold p-4">المحفوظ</th>
                    <th className="font-bold p-4">الهاتف</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-emerald-900/5 last:border-0">
                      <td className="p-4 font-bold text-emerald-950">{s.name}</td>
                      <td className="p-4 text-emerald-900/60">{s.age}</td>
                      <td className="p-4 text-emerald-900/60">{s.memorized_amount}</td>
                      <td className="p-4 text-emerald-900/60">
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
