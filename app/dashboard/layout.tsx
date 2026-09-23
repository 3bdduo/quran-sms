"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, LogOut, Bell, Menu, X, GraduationCap, ShieldCheck, UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/resources";
import { Loader } from "@/components/ui/Loader";

const roleMeta = {
  admin: { label: "الإدارة", icon: ShieldCheck },
  teacher: { label: "المعلم", icon: UserRound },
  student: { label: "الطالب", icon: GraduationCap },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    notificationsApi.unreadCount().then((r) => setUnread(r.count)).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader />
      </div>
    );
  }

  const meta = roleMeta[user.role];

  return (
    <div className="min-h-screen bg-cream-100/40 flex" dir="rtl">
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-emerald-950 text-cream-50 flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 p-6 border-b border-cream-50/10">
          <div className="h-11 w-11 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">ق</div>
          <div>
            <p className="font-extrabold text-sm">مدرسة التربية بالقرآن</p>
            <p className="text-xs text-cream-100/50 flex items-center gap-1 mt-0.5">
              <meta.icon size={12} /> لوحة {meta.label}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            href={`/dashboard/${user.role}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              pathname === `/dashboard/${user.role}` ? "bg-emerald-600" : "hover:bg-emerald-900"
            }`}
          >
            <LayoutDashboard size={18} />
            نظرة عامة
          </Link>
        </nav>

        <div className="p-4 border-t border-cream-50/10 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-cream-100/70">
            <Bell size={18} />
            الإشعارات
            {unread > 0 && (
              <span className="ms-auto h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-cream-50 border-b border-emerald-900/5 p-4 flex items-center justify-between">
          <span className="font-extrabold text-emerald-950">لوحة {meta.label}</span>
          <button onClick={() => setSidebarOpen((s) => !s)} className="text-emerald-900">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
