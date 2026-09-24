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


// ============================================================================
// كاش خفيف لطلبات الـ GET (في المتصفح فقط) — عشان أي صفحة تفتح فورًا من غير تحميل.
//  • نفس الـ URL ونفس الـ headers ونفس الـ endpoints — مفيش أي تغيير في شكل الطلب.
//  • أي طلب تعديل (POST/PUT/PATCH/DELETE) بيمسح الكاش كله، فالبيانات دايمًا صح بعد التعديل.
//  • الطلبات المتكررة في نفس اللحظة بتتجمّع في طلب واحد.
// ============================================================================
const CACHE_TTL = 30_000; // البيانات "طازة" لمدة 30 ثانية
const REFRESH_AFTER = 8_000; // بعد 8 ثواني بنجدد الكاش في الخلفية عشان الزيارة الجاية
const cache = new Map<string, { data: unknown; time: number }>();
const inflight = new Map<string, Promise<unknown>>();
const isBrowser = typeof window !== "undefined";
let cacheVersion = 0; // بيزيد مع كل مسح للكاش عشان طلب قديم ما يكتبش بيانات قديمة بعد تعديل

const clone = <T>(v: T): T => (typeof structuredClone === "function" ? structuredClone(v) : v);

export function clearApiCache() {
  cacheVersion++;
  cache.clear();
  inflight.clear();
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // إرفاق التوكن مع الطلب
  params?: Record<string, string | number | undefined>;
}

async function networkRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  // على السيرفر: الصفحات العامة (مدونة/معلمين/...) بتتخزّن دقيقة، فالصفحة الرئيسية بتفتح فورًا
  // من غير ما تستنى الباك إند. باقي الطلبات (المحمية بالتوكن + أي تعديل) دايمًا طازة.
  const cacheOptions: RequestInit & { next?: { revalidate: number } } =
    !isBrowser && method === "GET" && !auth ? { next: { revalidate: 60 } } : { cache: "no-store" };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...cacheOptions,
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", auth = false } = options;

  // تعديل بيانات: ننفّذه وبعدين نمسح الكاش
  if (method !== "GET") {
    const result = await networkRequest<T>(path, options);
    clearApiCache();
    return result;
  }

  // على السيرفر مفيش كاش في الذاكرة (كل طلب مستقل)
  if (!isBrowser) return networkRequest<T>(path, options);

  const qs = options.params
    ? Object.entries(options.params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}=${String(v)}`)
        .join("&")
    : "";
  const key = `${auth ? getToken() || "anon" : "public"}|${path}?${qs}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL) {
    // جدّد في الخلفية لو الكاش بدأ يقدم — من غير ما المستخدم يستنى
    if (Date.now() - hit.time > REFRESH_AFTER && !inflight.has(key)) {
      networkFetch<T>(key, path, options).catch(() => undefined);
    }
    return clone(hit.data as T);
  }

  const pending = inflight.get(key);
  if (pending) return clone((await pending) as T);

  return clone(await networkFetch<T>(key, path, options));
}

function networkFetch<T>(key: string, path: string, options: RequestOptions): Promise<T> {
  const version = cacheVersion;
  const promise: Promise<T> = networkRequest<T>(path, options)
    .then((data) => {
      if (version === cacheVersion) cache.set(key, { data, time: Date.now() });
      return data;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
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
