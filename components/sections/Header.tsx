"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
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
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-cream-50/85 backdrop-blur-md border-b border-emerald-900/5">
      <Container className="flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-11 w-11 rounded-full bg-emerald-600 flex items-center justify-center text-cream-50 text-xl font-bold shadow-md shadow-emerald-900/10">
            ق
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-emerald-950 text-base sm:text-lg">مدرسة التربية</p>
            <p className="text-xs text-emerald-700 font-semibold">بالقرآن الكريم</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                pathname === link.href
                  ? "bg-emerald-600 text-cream-50"
                  : "text-emerald-900 hover:bg-emerald-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
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
              <ButtonLink href="/register" size="sm">سجّل الآن</ButtonLink>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-emerald-900"
          onClick={() => setOpen((o) => !o)}
          aria-label="فتح القائمة"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-emerald-900/5 bg-cream-50"
          >
            <Container className="flex flex-col gap-1 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold ${
                    pathname === link.href ? "bg-emerald-600 text-cream-50" : "text-emerald-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-emerald-900/5">
                {user ? (
                  <ButtonLink href={`/dashboard/${user.role}`}>لوحة التحكم</ButtonLink>
                ) : (
                  <>
                    <ButtonLink href="/login" variant="outline">تسجيل الدخول</ButtonLink>
                    <ButtonLink href="/register">سجّل الآن</ButtonLink>
                  </>
                )}
              </div>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
