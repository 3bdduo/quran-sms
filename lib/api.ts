import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://quran-school-nest-js.vercel.app/api/v1";
const TOKEN_COOKIE = "qs_token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE);
}

export function setToken(token: string) {
  // 1 يوم — نفس مدة صلاحية الـ JWT الافتراضية في الباك إند (JWT_EXPIRES_IN)
  Cookies.set(TOKEN_COOKIE, token, { expires: 1, sameSite: "lax" });
}

export function clearToken() {
  Cookies.remove(TOKEN_COOKIE);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // إرفاق التوكن مع الطلب
  params?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, params } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const qsString = qs.toString();
    if (qsString) url += `?${qsString}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // استجابة بدون محتوى (ملفات التصدير مثلًا)
  }

  if (!res.ok) {
    const message = data?.error || data?.message || "حدث خطأ غير متوقع";
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"], auth = false) =>
    request<T>(path, { method: "GET", params, auth }),
  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "PUT", body, auth }),
  patch: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "PATCH", body, auth }),
  delete: <T>(path: string, auth = false) =>
    request<T>(path, { method: "DELETE", auth }),
};

export { API_URL };
