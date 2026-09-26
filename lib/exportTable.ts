/**
 * أداة تصدير موحدة لأي جدول في المنصة إلى ملف Excel / CSV
 * تدعم اللغة العربية بترميز UTF-8 مع BOM لفتح الملفات في Excel بدون تشويه الحروف.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
) {
  const BOM = "\uFEFF";
  const csvContent =
    BOM +
    [
      headers.map((h) => `"${(h ?? "").toString().replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${(cell ?? "").toString().replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const cleanName = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", cleanName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
