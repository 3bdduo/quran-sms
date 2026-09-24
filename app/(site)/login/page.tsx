"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { GraduationCap, ShieldCheck, UserRound, LogIn } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

const roles = [
  { value: "student", label: "طالب", icon: GraduationCap },
  { value: "teacher", label: "معلم", icon: UserRound },
  { value: "admin", label: "إدارة المدرسة", icon: ShieldCheck },
] as const;

export default function LoginPage() {
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(role, username, password || undefined);
      showToast("تم تسجيل الدخول بنجاح", "success");
      router.push(`/dashboard/${user.role}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ أثناء تسجيل الدخول", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative py-12 sm:py-24 min-h-[70dvh] flex items-center overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div aria-hidden="true" className="absolute top-10 right-[8%] h-64 w-64 rounded-full orb-1" />
      <div aria-hidden="true" className="absolute bottom-6 left-[6%] h-64 w-64 rounded-full orb-2" />

      <Container className="relative max-w-md">
        <m.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          style={{ boxShadow: "var(--sh-float)" }}
          className="card p-6 xs:p-8 sm:p-10 !rounded-[2rem]"
        >
          <div className="text-center mb-8 flex flex-col items-center">
            <Logo size="lg" showText={false} className="mb-4" />
            <h1 className="font-ruqaa font-bold text-4xl leading-[1.6] text-ink">تسجيل الدخول</h1>
            <p className="text-sm text-ink-mute mt-1">اختر صفتك وسجّل دخولك للمنصة</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6 p-1.5 rounded-3xl bg-bg-alt shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)]" role="tablist">
            {roles.map(({ value, label, icon: Icon }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRole(value)}
                  className={`relative flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition-colors duration-200 active:scale-95 ${
                    active ? "text-on-brand" : "text-ink-soft hover:text-brand-ink"
                  }`}
                >
                  {active && (
                    <m.span
                      layoutId="login-role"
                      transition={{ type: "spring", stiffness: 189, damping: 26 }}
                      className="absolute inset-0 rounded-2xl bg-brand sh-brand"
                    />
                  )}
                  <Icon size={20} className="relative" />
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">{role === "student" ? "الرقم القومي" : "اسم المستخدم"}</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field"
                placeholder={role === "student" ? "أدخل رقمك القومي" : "أدخل اسم المستخدم"}
                autoComplete="username"
                inputMode={role === "student" ? "numeric" : "text"}
              />
            </div>
            {role !== "student" && (
              <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <label className="field-label">كلمة المرور</label>
                <input
                  type="password"
                  data-vrule="loose"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </m.div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {!loading && <LogIn size={18} />}
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </m.div>
      </Container>
    </div>
  );
}
