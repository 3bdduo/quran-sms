"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoModal } from "@/components/ui/LogoModal";
import { Logo } from "@/components/ui/Logo";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "عن المدرسة" },
  { href: "/curriculum", label: "المناهج" },
  { href: "/teachers", label: "المعلمون" },
  { href: "/blog", label: "المدونة" },
  { href: "/media", label: "المكتبة" },
  { href: "/contact", label: "تواصل معنا" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoModal, setLogoModal] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // الهيدر بيصغر ويقوى ظله لما تنزل بالصفحة
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // اقفل القائمة عند تغيير الصفحة
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // لو الشاشة كبرت لحجم ديسكتوب والقائمة مفتوحة، اقفلها
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // امنع سكرول الصفحة والقائمة مفتوحة (مهم في الموبايل)
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <ScrollProgress />

      <header
        className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] border-b transition-[background-color,box-shadow,border-color] duration-500 ${
          scrolled || open
            ? "glass border-line sh-lift"
            : "bg-bg/60 backdrop-blur-sm border-transparent shadow-none"
        }`}
      >
        <Container
          className={`flex items-center justify-between gap-3 transition-[height] duration-500 ${
            scrolled ? "h-16 sm:h-[4.25rem]" : "h-[4.5rem] sm:h-20"
          }`}
        >
          {/* اللوجو — بيفتح مودال معلومات المدرسة */}
          <button
            onClick={() => setLogoModal(true)}
            className="group shrink-0 min-w-0 rounded-2xl focus-visible:outline-offset-4"
            aria-label="معلومات المدرسة"
          >
            <Logo size="md" />
          </button>

          {/* قائمة الديسكتوب */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="التنقل الرئيسي">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 xl:px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 ${
                    active ? "text-on-brand" : "text-ink-soft hover:text-brand-ink hover:bg-brand-soft"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-brand sh-brand"
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* أزرار الديسكتوب */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <ButtonLink href={`/dashboard/${user.role}`} size="sm">
                <LayoutDashboard size={16} />
                لوحة التحكم
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" size="sm">
                  <LogIn size={16} />
                  تسجيل الدخول
                </ButtonLink>
                <ButtonLink href="/register" size="sm">
                  سجّل الآن
                </ButtonLink>
              </>
            )}
          </div>

          {/* موبايل / تابلت: زر المود + البرجر */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="relative h-11 w-11 grid place-items-center text-ink rounded-2xl bg-surface border border-line sh-soft active:scale-90 transition-transform duration-200"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={open}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute"
                >
                  {open ? <X size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </Container>

        {/* قائمة الموبايل */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden overflow-hidden border-t border-line"
              aria-label="قائمة الموبايل"
            >
              <Container className="flex flex-col gap-1.5 py-4 max-h-[calc(100dvh-5rem)] overflow-y-auto">
                {links.map((link, i) => {
                  const active = isActive(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.045, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={link.href}
                        className={`flex items-center min-h-12 px-4 rounded-2xl text-base font-bold transition-all duration-200 active:scale-[0.98] ${
                          active
                            ? "bg-brand text-on-brand sh-brand"
                            : "text-ink hover:bg-brand-soft"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.35 }}
                  className="flex flex-col gap-2.5 mt-3 pt-4 border-t border-line pb-[env(safe-area-inset-bottom)]"
                >
                  {user ? (
                    <ButtonLink href={`/dashboard/${user.role}`}>لوحة التحكم</ButtonLink>
                  ) : (
                    <>
                      <ButtonLink href="/login" variant="outline">
                        تسجيل الدخول
                      </ButtonLink>
                      <ButtonLink href="/register">سجّل الآن</ButtonLink>
                    </>
                  )}
                </motion.div>
              </Container>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <LogoModal open={logoModal} onClose={() => setLogoModal(false)} />
    </>
  );
}
