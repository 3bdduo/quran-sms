"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { prefetchForUser, prefetchPublic, ROLE_ROUTES } from "@/lib/prefetch";

const PUBLIC_ROUTES = ["/about", "/curriculum", "/blog", "/media", "/contact", "/login", "/register"];

/**
 * بيشتغل أول ما الموقع يفتح (من غير ما يرسم أي حاجة):
 *  1) يسخّن بيانات الموقع العام
 *  2) لو فيه مستخدم مسجّل: يطلب بيانات كل صفحات لوحته (المهم الأول ثم الباقي في الخلفية)
 *  3) يحمّل كود الصفحات مقدمًا عشان الانتقال يبقى لحظي
 */
export function AppBootstrap() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    prefetchPublic();
    const t = window.setTimeout(() => PUBLIC_ROUTES.forEach((r) => router.prefetch(r)), 1200);
    return () => window.clearTimeout(t);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    prefetchForUser(user);
    const routes = ROLE_ROUTES[user.role] ?? [];
    const t = window.setTimeout(() => routes.forEach((r) => router.prefetch(r)), 300);
    return () => window.clearTimeout(t);
  }, [user, router]);

  return null;
}
