"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CACHE_TTL = 15 * 60 * 1000; // 15 دقيقة — البيانات تظل جاهزة وفورية
const memoryCache = new Map<string, { data: unknown; time: number }>();
const inflightPromises = new Map<string, Promise<unknown>>();

/**
 * جلب البيانات من الكاش الفوري (الذاكرة أو sessionStorage) بشكل متزامن 100% (Synchronous).
 * يضمن أن الـ Component يبدأ من أوّل رسمة (Frame 0) بالبيانات بدون ظهور أي لودر.
 */
export function getCachedData<T>(key: string): T | undefined {
  if (!key || typeof window === "undefined") return undefined;

  // 1. فحص ذاكرة الرام (0 ميلي ثانية)
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL) {
    return hit.data as T;
  }

  // 2. فحص sessionStorage في حال أعاد المستخدم تحديث الصفحة (F5)
  try {
    const raw = sessionStorage.getItem(`qs_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Date.now() - parsed.time < CACHE_TTL) {
        memoryCache.set(key, parsed);
        return parsed.data as T;
      }
    }
  } catch {
    // تجاهل أخطاء التخزين
  }

  return undefined;
}

/**
 * حفظ البيانات في الكاش المتزامن
 */
export function setCachedData<T>(key: string, data: T) {
  if (!key || typeof window === "undefined") return;
  const item = { data, time: Date.now() };
  memoryCache.set(key, item);
  try {
    sessionStorage.setItem(`qs_cache_${key}`, JSON.stringify(item));
  } catch {
    // quota exceeded or private mode
  }
}

/**
 * مسح عنصر أو كامل الكاش
 */
export function clearCachedData(key?: string) {
  if (key) {
    memoryCache.delete(key);
    inflightPromises.delete(key);
    try {
      sessionStorage.removeItem(`qs_cache_${key}`);
    } catch {}
  } else {
    memoryCache.clear();
    inflightPromises.clear();
    try {
      if (typeof window !== "undefined") {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith("qs_cache_")) sessionStorage.removeItem(k);
        });
      }
    } catch {}
  }
}

/**
 * تحميل البيانات مسبقاً وتخزينها في الكاش قبل أن يفتح المستخدم الصفحة
 */
export function prefetchData<T>(key: string, fetcher: () => Promise<T>): Promise<T | undefined> {
  if (!key) return fetcher().catch(() => undefined);

  // لو موجود في الكاش بالفعل لا نكرر الطلب
  const cached = getCachedData<T>(key);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  // منع تكرار نفس الطلب إذا كان قيد التنفيذ الآن
  const pending = inflightPromises.get(key);
  if (pending) {
    return pending as Promise<T | undefined>;
  }

  const promise = fetcher()
    .then((result) => {
      setCachedData(key, result);
      return result;
    })
    .catch((err) => {
      console.warn(`[Prefetch failed for ${key}]:`, err);
      return undefined;
    })
    .finally(() => {
      inflightPromises.delete(key);
    });

  inflightPromises.set(key, promise);
  return promise;
}

export interface UseDataOptions<T> {
  initialData?: T;
  enabled?: boolean;
  key?: string;
  revalidateOnMount?: boolean;
}

/**
 * Hook ذكي لجلب البيانات يضمن:
 * 1. عرض البيانات فوراً على Frame 0 إذا كانت محملة مسبقاً (Zero loading spinner / zero flicker).
 * 2. الحفاظ على البيانات عند التنقل بين الصفحات والرجوع بدون إعادة التحميل.
 * 3. دعم تحديث البيانات يدويًا أو عبر تفعيل التحديث الصامت.
 */
export function useData<T>(
  keyOrFetcher: string | (() => Promise<T>),
  fetcherOrOptions?: (() => Promise<T>) | UseDataOptions<T>,
  maybeOptions?: UseDataOptions<T>
): {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: (silent?: boolean) => Promise<T | undefined>;
  mutate: (newData: T | ((prev: T | undefined) => T)) => void;
} {
  const cacheKey =
    typeof keyOrFetcher === "string"
      ? keyOrFetcher
      : (fetcherOrOptions as UseDataOptions<T>)?.key || "";

  const fetcher =
    typeof keyOrFetcher === "function"
      ? keyOrFetcher
      : (fetcherOrOptions as () => Promise<T>);

  const options =
    typeof keyOrFetcher === "string"
      ? maybeOptions
      : (fetcherOrOptions as UseDataOptions<T>);

  const { initialData, enabled = true, revalidateOnMount = true } = options ?? {};

  // قراءة متزامنة فورية من الكاش
  const initialCached = cacheKey ? getCachedData<T>(cacheKey) : undefined;

  const [data, setData] = useState<T | undefined>(() => initialCached ?? initialData);
  const [loading, setLoading] = useState<boolean>(() => !initialCached && data === undefined);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const mutate = useCallback(
    (newData: T | ((prev: T | undefined) => T)) => {
      setData((prev) => {
        const next = typeof newData === "function" ? (newData as (prev: T | undefined) => T)(prev) : newData;
        if (cacheKey) {
          setCachedData(cacheKey, next);
        }
        return next;
      });
    },
    [cacheKey]
  );

  const refetch = useCallback(
    async (silent = false): Promise<T | undefined> => {
      if (!silent && data === undefined) {
        setLoading(true);
      }
      setError(null);
      try {
        const result = await fetcherRef.current();
        setData(result);
        if (cacheKey) {
          setCachedData(cacheKey, result);
        }
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات";
        setError(msg);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, data]
  );

  useEffect(() => {
    if (!enabled) return;

    // لو البيانات متوفرة في الكاش، نعرضها فوراً ونجري تحديثاً صامتاً في الخلفية فقط لو مر وقت
    const cached = cacheKey ? getCachedData<T>(cacheKey) : undefined;
    if (cached !== undefined) {
      setData(cached);
      setLoading(false);
      if (revalidateOnMount) {
        refetch(true); // تحديث صامت بدون إظهار سبينر
      }
      return;
    }

    // غير موجودة في الكاش — نجلبها مع إظهار اللودر لأول مرة فقط
    refetch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled]);

  return {
    data,
    loading: loading && data === undefined,
    error,
    refetch: () => refetch(false),
    mutate,
  };
}
