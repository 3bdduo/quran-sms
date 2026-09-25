"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Phone, BookMarked, CalendarCheck, Trophy, Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { studentsApi, eduGroupsApi, eduAttendanceApi, examsApi } from "@/lib/resources";
import { Loader } from "@/components/ui/Loader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import type { Student, EduGroupItem, ExamItem } from "@/types";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // حالة معلم الحلقة
  const [ringStudents, setRingStudents] = useState<Student[]>([]);

  // حالة معلم التربوي
  const [eduGroup, setEduGroup] = useState<EduGroupItem | null>(null);
  const [todayPresentCount, setTodayPresentCount] = useState<number>(0);
  const [examsCount, setExamsCount] = useState<number>(0);

  const isEduTeacher =
    user?.role === "teacher" &&
    (user.teacherType === "edu" || (Boolean(user.eduGroupId) && (!user.groupIds || user.groupIds.length === 0)));

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        if (isEduTeacher && user?.eduGroupId) {
          // جلب بيانات معلم التربوي
          const today = new Date().toISOString().slice(0, 10);
          const [gData, attData, exData] = await Promise.all([
            eduGroupsApi.byId(user.eduGroupId).catch(() => null),
            eduAttendanceApi.find(user.eduGroupId, today).catch(() => []),
            examsApi.findByEduGroup(user.eduGroupId).catch(() => []),
          ]);
          setEduGroup(gData);
          setTodayPresentCount(attData.filter((a) => a.status === "حاضر").length);
          setExamsCount(exData.length);
        } else {
          // جلب بيانات معلم الحلقة
          const data = await studentsApi.listMine().catch(() => []);
          setRingStudents(data);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [isEduTeacher, user?.eduGroupId]);

  if (loading) return <Loader size="lg" className="my-16" />;

  // 1. لوحة تحكم معلم التربوي
  if (isEduTeacher) {
    return (
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-ink">لوحة معلم التربوي</h1>
              {eduGroup?.name && (
                <span className="text-xs font-bold bg-brand-soft text-brand-ink px-3 py-1 rounded-full">
                  {eduGroup.name}
                </span>
              )}
            </div>
            <p className="text-ink-mute text-sm mt-1">
              متابعة طلاب المجموعة التربوية ورصد الحضور والغياب والاختبارات
            </p>
          </div>

          <Link href="/dashboard/teacher/edu-groups">
            <Button className="flex items-center gap-2">
              <BookMarked size={16} />
              <span>إدارة المجموعة والتحضير</span>
              <ArrowLeft size={16} />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="طلاب مجموعة التربوي"
            value={eduGroup?.students?.length || 0}
          />
          <StatCard
            icon={CalendarCheck}
            label="حضور اليوم"
            value={`${todayPresentCount} طالب حاضر`}
            tone="emerald"
            delay={0.08}
          />
          <StatCard
            icon={Trophy}
            label="الامتحانات المرصودة"
            value={examsCount}
            tone="gold"
            delay={0.16}
          />
        </div>

        <div className="card !rounded-2xl overflow-hidden border border-line">
          <div className="p-5 pb-3 border-b border-line flex items-center justify-between">
            <h3 className="font-extrabold text-ink">الطلاب المسجلون في مجموعة التربوي</h3>
            <span className="text-xs font-bold text-ink-mute">
              {eduGroup?.students?.length || 0} طالب
            </span>
          </div>

          {!eduGroup?.students || eduGroup.students.length === 0 ? (
            <div className="p-12 text-center text-ink-mute space-y-3">
              <Users size={40} className="mx-auto text-ink-mute/40" />
              <p className="font-bold text-ink">لا يوجد طلاب مسجلون في مجموعتك بعد</p>
              <Link href="/dashboard/teacher/edu-groups">
                <Button size="sm" className="mt-2">
                  + اختيار وإضافة طلاب من الحلقات
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-start text-ink-mute border-b border-line bg-bg-alt/60 text-xs">
                    <th className="font-bold p-4">م</th>
                    <th className="font-bold p-4">اسم الطالب</th>
                    <th className="font-bold p-4">النوع</th>
                    <th className="font-bold p-4">حلقة القرآن الأصلية</th>
                    <th className="font-bold p-4">الرقم القومي</th>
                    <th className="font-bold p-4">الهاتف</th>
                  </tr>
                </thead>
                <tbody>
                  {eduGroup.students.slice(0, 10).map((s, idx) => (
                    <tr
                      key={s.studentId}
                      className="border-b border-line last:border-0 hover:bg-brand-soft/40 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-ink-mute">{idx + 1}</td>
                      <td className="p-4 font-bold text-ink">{s.studentName}</td>
                      <td className="p-4">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            s.gender === "female"
                              ? "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          }`}
                        >
                          {s.gender === "female" ? "بنات" : "شباب"}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-brand-ink text-xs">{s.groupName || "-"}</td>
                      <td className="p-4 font-mono text-xs text-ink-soft">{s.studentNationalId || "-"}</td>
                      <td className="p-4 font-mono text-xs text-ink-soft">{s.studentPhone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {eduGroup.students.length > 10 && (
                <div className="p-3 text-center border-t border-line bg-bg-alt/20">
                  <Link
                    href="/dashboard/teacher/edu-groups"
                    className="text-xs font-bold text-brand-ink hover:underline"
                  >
                    عرض كل الطلاب ({eduGroup.students.length}) ←
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. لوحة تحكم معلم الحلقة العادية
  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">لوحة معلم الحلقة</h1>
        <p className="text-ink-mute text-sm mt-1">نظرة عامة على طلاب حلقتك القرآنية</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Users} label="عدد الطلاب" value={ringStudents.length} />
        <StatCard
          icon={BookMarked}
          label="متوسط المحفوظ"
          value={ringStudents.length ? "متوفر لكل طالب" : "-"}
          tone="gold"
          delay={0.08}
        />
      </div>

      <div className="card !rounded-2xl overflow-hidden border border-line">
        <h3 className="font-extrabold text-ink p-6 pb-0">طلاب الحلقة القرآنية</h3>
        {ringStudents.length === 0 ? (
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
                {ringStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line last:border-0 hover:bg-brand-soft/60 transition-colors"
                  >
                    <td className="p-4 font-bold text-ink">{s.name}</td>
                    <td className="p-4 text-ink-soft">{s.age}</td>
                    <td className="p-4 text-ink-soft">{s.memorized_amount}</td>
                    <td className="p-4 text-ink-soft">
                      {s.phone ? (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Phone size={13} /> {s.phone}
                        </span>
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
    </div>
  );
}
