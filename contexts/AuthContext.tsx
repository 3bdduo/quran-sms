"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/types";
import { authApi } from "@/lib/resources";
import { ApiError, clearApiCache, clearToken, getToken, setToken } from "@/lib/api";
import { prefetchForUser, resetPrefetch } from "@/lib/prefetch";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (role: string, username: string, password?: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_KEY = "qs_user";

// نسخة من بيانات المستخدم (الدور/الاسم/المعرّفات — مفيش أي أسرار) بنستخدمها عشان
// لوحة التحكم تفتح فورًا، وبعدها بنتأكد من الباك إند في الخلفية.
function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
function storeUser(u: AuthUser | null) {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* التخزين ممنوع — عادي */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      storeUser(null);
      setLoading(false);
      return;
    }

    // 1) اعرض فورًا اللي متخزّن (لو موجود)
    const stored = readStoredUser();
    if (stored) {
      setUser(stored);
      setLoading(false);
    }

    // 2) اتأكد من الباك إند في الخلفية
    authApi
      .me()
      .then((u) => {
        setUser(u);
        storeUser(u);
      })
      .catch((err) => {
        // التوكن مش صالح → خروج. أي خطأ تاني (شبكة مثلًا) نسيب المستخدم زي ما هو.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearToken();
          storeUser(null);
          setUser(null);
        } else if (!stored) {
          clearToken();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(role: string, username: string, password?: string) {
    const res = await authApi.login(role, username, password);
    setToken(res.token);
    setUser(res.user);
    storeUser(res.user);
    resetPrefetch();
    // ابدأ تحميل بيانات كل صفحات اللوحة فورًا — قبل ما المستخدم يوصل لها
    prefetchForUser(res.user);
    return res.user;
  }

  function logout() {
    clearToken();
    storeUser(null);
    clearApiCache();
    resetPrefetch();
    setUser(null);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth لازم يتستخدم جوه AuthProvider");
  return ctx;
}
