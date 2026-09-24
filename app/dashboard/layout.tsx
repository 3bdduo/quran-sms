"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Bell,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
  UserRound,
  Home,
  Users,
  Layers,
  CalendarCheck,
  Wallet,
  Banknote,
  Trophy,
  Globe,
  Mail,
  Activity,
  Settings,
  BookMarked,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/resources";
import { Loader } from "@/components/ui/Loader";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const roleMeta = {
  admin: { label: "الإدارة", icon: ShieldCheck },
  teacher: { label: "المعلم", icon: UserRound },
  student: { label: "الطالب", icon: GraduationCap },
};

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

const navItemsByRole: Record<string, NavItem[]> = {
  admin: [
    { href: "/dashboard/admin", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/dashboard/admin/students", label: "إدارة الطلاب", icon: Users },
    { href: "/dashboard/admin/teachers", label: "المعلمين", icon: UserRound },
    { href: "/dashboard/admin/groups", label: "الحلقات والمجموعات", icon: Layers },
    { href: "/dashboard/admin/attendance", label: "التحضير والغياب", icon: CalendarCheck },
    { href: "/dashboard/admin/payments", label: "الاشتراكات والمدفوعات", icon: Wallet },
    { href: "/dashboard/admin/salaries", label: "رواتب المعلمين", icon: Banknote },
    { href: "/dashboard/admin/competitions", label: "المسابقات والامتحانات", icon: Trophy },
    { href: "/dashboard/admin/content", label: "إدارة المحتوى والموقع", icon: Globe },
    { href: "/dashboard/admin/messages", label: "رسائل التواصل", icon: Mail },
    { href: "/dashboard/admin/notifications", label: "الإشعارات والنشاط", icon: Activity },
    { href: "/dashboard/admin/settings", label: "إعدادات المدرسة", icon: Settings },
  ],
  teacher: [
    { href: "/dashboard/teacher", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/dashboard/teacher/students", label: "طلاب حلقتي", icon: Users },
    { href: "/dashboard/teacher/memorization", label: "تسجيل التسميع والحفظ", icon: BookMarked },
    { href: "/dashboard/teacher/attendance", label: "تسجيل الحضور اليومي", icon: CalendarCheck },
    { href: "/dashboard/teacher/edu-groups", label: "المجموعات والاختبارات", icon: Layers },
    { href: "/dashboard/teacher/salary", label: "راتبي ومستحقاتي", icon: Banknote },
  ],
  student: [
    { href: "/dashboard/student", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/dashboard/student/memorization", label: "سجل حفظي", icon: BookMarked },
    { href: "/dashboard/student/attendance", label: "سجل حضوري", icon: CalendarCheck },
    { href: "/dashboard/student/payments", label: "الاشتراك الشهري", icon: Wallet },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    notificationsApi
      .unreadCount()
      .then((r) => setUnread(r.count))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // اقفل الشريط الجانبي عند التنقل + امنع سكرول الصفحة وهو مفتوح
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (loading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <Loader size="lg" />
      </div>
    );
  }

  const meta = roleMeta[user.role] || roleMeta.student;
  const navItems = navItemsByRole[user.role] || [];

  return (
    <div className="min-h-dvh bg-bg flex" dir="rtl">
      {/* الشريط الجانبي */}
      <aside
        className={`fixed inset-y-0 right-0 lg:sticky lg:top-0 h-dvh w-72 max-w-[85vw] bg-deep text-on-deep flex flex-col z-40 border-l border-deep-line shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pt-[env(safe-area-inset-top)] ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.05] pointer-events-none" />

        <div className="relative p-5 border-b border-deep-line">
          <Logo size="md" tone="onDeep" />
          <p className="text-xs text-on-deep-soft flex items-center gap-1.5 mt-3">
            <meta.icon size={13} className="text-gold" /> لوحة {meta.label}
          </p>
        </div>

        <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 min-h-11 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 active:scale-[0.98] ${
                  isActive
                    ? "bg-brand text-on-brand sh-brand"
                    : "text-on-deep-soft hover:bg-deep-2 hover:text-on-deep"
                }`}
              >
                <Icon size={17} className={isActive ? "text-on-brand" : "text-gold/80"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-deep-line/60">
            <Link
              href="/"
              className="flex items-center gap-3 min-h-11 px-3.5 rounded-xl text-xs sm:text-sm font-bold text-on-deep-soft hover:bg-deep-2 hover:text-on-deep transition-all duration-300 active:scale-[0.98]"
            >
              <Home size={17} />
              <span>الموقع الرئيسي</span>
            </Link>
          </div>
        </nav>

        <div className="relative p-4 border-t border-deep-line space-y-1.5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 px-3 min-h-10 rounded-xl text-xs font-bold text-on-deep-soft">
            <Bell size={16} />
            الإشعارات
            {unread > 0 && (
              <span className="ms-auto h-5 min-w-5 px-1.5 rounded-full bg-danger-solid text-white text-[10px] flex items-center justify-center font-bold animate-pulse-soft">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between px-3 min-h-10">
            <span className="text-xs font-bold text-on-deep-soft">المظهر</span>
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 min-h-10 px-3 rounded-xl text-xs font-bold text-[#ffb4a3] hover:bg-danger-solid/20 transition-colors active:scale-[0.98]"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-surface/85 backdrop-blur-xl border-b border-line sh-lift px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between">
          <span className="font-ruqaa font-bold text-xl text-ink">لوحة {meta.label}</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="h-11 w-11 grid place-items-center rounded-2xl bg-surface border border-line text-ink sh-soft active:scale-90 transition-transform"
              aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>
        <main className="p-4 xs:p-5 sm:p-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</main>
      </div>
    </div>
  );
}
