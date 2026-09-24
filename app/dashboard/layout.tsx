"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
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
  Settings,
  BookMarked,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
    { href: "/dashboard/admin/waiting", label: "قائمة الانتظار", icon: Clock },
    { href: "/dashboard/admin/teachers", label: "المعلمين", icon: UserRound },
    { href: "/dashboard/admin/groups", label: "الحلقات والمجموعات", icon: Layers },
    { href: "/dashboard/admin/attendance", label: "التحضير والغياب", icon: CalendarCheck },
    { href: "/dashboard/admin/payments", label: "الاشتراكات والمدفوعات", icon: Wallet },
    { href: "/dashboard/admin/salaries", label: "رواتب المعلمين", icon: Banknote },
    { href: "/dashboard/admin/competitions", label: "المسابقات والامتحانات", icon: Trophy },
    { href: "/dashboard/admin/content", label: "إدارة المحتوى والموقع", icon: Globe },
    { href: "/dashboard/admin/messages", label: "رسائل التواصل", icon: Mail },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
      {/* الشريط الجانبي العصري */}
      <aside
        className={`fixed inset-y-0 right-0 lg:sticky lg:top-0 h-dvh z-40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:p-4 lg:pl-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-[104px]" : "w-[300px] max-w-[85vw]"}`}
      >
        <div className="relative h-full w-full bg-deep text-on-deep lg:rounded-[2rem] border-l lg:border border-deep-line shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.55)] lg:shadow-[-20px_0_80px_-20px_rgba(0,0,0,0.6)] flex flex-col pt-[env(safe-area-inset-top)] z-10">
          
          {/* حاوية الزخرفة عشان ما تطلعش برا الحواف الدائرية */}
          <div className="absolute inset-0 overflow-hidden lg:rounded-[2rem] pointer-events-none">
            <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.03]" />
          </div>

          <div className="relative p-6 border-b border-deep-line flex items-center justify-between min-h-[104px]">
            {!collapsed ? (
              <div className="flex flex-col min-w-0 pr-1 py-1">
                {/* شيلنا overflow-hidden اللي كانت بتقص اللوجو */}
                <Logo size="md" tone="onDeep" className="py-1" />
                <m.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs text-on-deep-soft flex items-center gap-1.5 mt-3 whitespace-nowrap"
                >
                  <meta.icon size={14} className="text-gold" /> لوحة {meta.label}
                </m.p>
              </div>
            ) : (
              <div className="w-full flex justify-center py-1">
                <Logo size="sm" showText={false} tone="onDeep" />
              </div>
            )}
            
            {/* زر القفل والفتح العصري */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center h-8 w-8 rounded-full bg-brand text-on-brand hover:scale-110 hover:shadow-lg hover:shadow-brand/20 transition-all absolute -left-4 top-10 z-50 ring-[6px] ring-bg"
              aria-label={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
            >
              {collapsed ? <ChevronLeft size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
            </button>
          </div>

          <nav className="relative flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3.5 min-h-[3.25rem] rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 group ${
                    collapsed ? "justify-center px-0" : "px-4"
                  } ${
                    isActive
                      ? "text-brand"
                      : "text-on-deep-soft hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <m.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-brand/10 border border-brand/20 rounded-2xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {/* تأثير التوهج عند الـ hover */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  
                  <Icon 
                    size={collapsed ? 24 : 20} 
                    className={`relative z-10 transition-transform duration-300 ${collapsed ? "group-hover:scale-110" : ""} ${isActive ? "text-brand" : "text-on-deep-soft group-hover:text-gold"}`} 
                  />
                  {!collapsed && (
                    <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-deep-line/60">
              <Link
                href="/"
                className={`relative flex items-center gap-3.5 min-h-[3.25rem] rounded-2xl text-xs sm:text-sm font-bold text-on-deep-soft hover:text-white transition-all duration-300 group ${
                  collapsed ? "justify-center px-0" : "px-4"
                }`}
                title={collapsed ? "الموقع الرئيسي" : undefined}
              >
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Home size={collapsed ? 24 : 20} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
                {!collapsed && <span className="relative z-10 whitespace-nowrap">الموقع الرئيسي</span>}
              </Link>
            </div>
          </nav>

          <div className="relative p-5 border-t border-deep-line flex flex-col gap-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] z-10">
            {!collapsed ? (
              <>
                <div className="flex items-center justify-between px-3 min-h-[2.5rem] bg-deep-2/50 rounded-xl">
                  <span className="text-xs font-bold text-on-deep-soft">المظهر</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3.5 min-h-[3rem] px-4 rounded-2xl text-xs sm:text-sm font-bold text-danger-ink hover:bg-danger-solid/10 hover:text-danger-solid transition-colors active:scale-[0.98] group"
                >
                  <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-2">
                  <ThemeToggle />
                </div>
                <button
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="w-full flex items-center justify-center min-h-[3rem] rounded-2xl text-danger-ink hover:bg-danger-solid/10 hover:text-danger-solid transition-colors active:scale-[0.98] group"
                >
                  <LogOut size={22} className="transition-transform group-hover:scale-110" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-surface/95 border-b border-line sh-lift px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between">
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
        <main data-dash className="p-4 xs:p-5 sm:p-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</main>
      </div>
    </div>
  );
}
