import { API_URL, getToken } from "./api";

// ملفات التصدير (Word/Excel) محتاجة التوكن في الهيدر (Authorization)، فمينفعش
// نعملها <a href> عادي — لازم نجيب الملف كـ Blob ونعمل تحميل يدوي بيه.
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error("تعذّر تحميل الملف، حاول مرة أخرى");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
