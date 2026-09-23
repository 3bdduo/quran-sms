"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck, UserRound, LogIn } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
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
    <div className="py-16 sm:py-24 min-h-[70vh] flex items-center">
      <Container className="max-w-md">
        <div className="bg-white rounded-3xl border border-emerald-900/5 p-8 sm:p-10 shadow-sm">
          <div className="text-center mb-8">
            <div className="h-14 w-14 rounded-full bg-emerald-600 text-cream-50 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              ق
            </div>
            <h1 className="text-2xl font-extrabold text-emerald-950">تسجيل الدخول</h1>
            <p className="text-sm text-emerald-900/50 mt-1">اختر صفتك وسجّل دخولك للمنصة</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  role === value ? "bg-emerald-600 text-cream-50" : "bg-cream-100 text-emerald-900/60 hover:bg-emerald-50"
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">
                {role === "student" ? "الرقم القومي" : "اسم المستخدم"}
              </label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                placeholder={role === "student" ? "أدخل رقمك القومي" : "أدخل اسم المستخدم"}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-emerald-900 mb-1.5 block">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-emerald-900/10 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <LogIn size={18} />
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
}
