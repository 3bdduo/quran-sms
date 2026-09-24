"use client";

import { useEffect, useState } from "react";
import {
  Users, GraduationCap, CalendarCheck, Wallet, FileSpreadsheet, FileText, Mail,
} from "lucide-react";
import { reportsApi, contactApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { StatCard } from "@/components/dashboard/StatCard";

import type { DashboardStats } from "@/types";

const currentMonthKey = new Date().toISOString().slice(0, 7);

const exportButtons = [
  { label: "كشف الطلاب", icon: FileSpreadsheet, path: "/exports/students.xlsx", filename: "كشف-الطلاب.xlsx" },
  { label: "تقرير المدفوعات", icon: FileSpreadsheet, path: `/exports/payments/${currentMonthKey}.xlsx`, filename: "تقرير-المدفوعات.xlsx" },
  { label: "تقرير الرواتب", icon: FileSpreadsheet, path: `/exports/salaries/${currentMonthKey}.xlsx`, filename: "تقرير-الرواتب.xlsx" },
  { label: "التقرير العام", icon: FileText, path: `/exports/dashboard.docx?monthKey=${currentMonthKey}`, filename: "التقرير-العام.docx" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      reportsApi.dashboard(currentMonthKey).then(setStats).catch(() => undefined),
      contactApi.listForAdmin("unread").then((msgs) => setUnreadMessages(msgs.length)).catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleDownload(path: string, filename: string) {
    setDownloadingKey(path);
    try {
      await downloadFile(path, filename);
    } catch {
      showToast("تعذّر تحميل الملف", "error");
    } finally {
      setDownloadingKey(null);
    }
  }

  if (loading) return <Loader size="lg" />;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">لوحة الإدارة</h1>
        <p className="text-ink-mute text-sm mt-1">نظرة عامة على أداء المدرسة هذا الشهر</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="إجمالي الطلاب" value={stats?.totalStudents ?? 0} />
        <StatCard icon={GraduationCap} label="إجمالي المعلمين" value={stats?.totalTeachers ?? 0} tone="gold" delay={0.08} />
        <StatCard icon={CalendarCheck} label="نسبة الحضور" value={`${stats?.attendanceRate ?? 0}%`} delay={0.16} />
        <StatCard icon={Wallet} label="المحصّل هذا الشهر" value={`${stats?.paidThisMonth ?? 0} جنيه`} tone="gold" delay={0.24} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="card !rounded-2xl p-6">
            <h3 className="font-extrabold text-ink mb-1">تقارير جاهزة للطباعة</h3>
            <p className="text-xs text-ink-mute mb-5">Word / Excel احترافية بضغطة واحدة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportButtons.map(({ label, icon: Icon, path, filename }) => (
                <button
                  key={path}
                  onClick={() => handleDownload(path, filename)}
                  disabled={downloadingKey === path}
                  className="flex items-center gap-3 bg-bg-alt hover:bg-brand-soft rounded-xl p-4 text-right transition-all duration-[1000ms] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
                >
                  <div className="h-10 w-10 rounded-lg bg-brand-soft text-brand-ink flex items-center justify-center shrink-0">
                    {downloadingKey === path ? <Spinner size={18} /> : <Icon size={18} />}
                  </div>
                  <span className="text-sm font-bold text-ink">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card !rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-danger-soft text-danger-ink flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <p className="font-extrabold text-ink">رسائل تواصل غير مقروءة</p>
                <p className="text-xs text-ink-mute">راجع صفحة الرسائل في نظام الإدارة</p>
              </div>
            </div>
            <span className="h-8 min-w-8 px-2 rounded-full bg-danger-solid text-white font-bold flex items-center justify-center">
              {unreadMessages}
            </span>
          </div>
        </div>


      </div>
    </div>
  );
}
