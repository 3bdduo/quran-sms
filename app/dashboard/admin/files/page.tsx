"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  FolderArchive,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Music,
  Archive,
  Folder,
  Search,
  Download,
  Share2,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  FileUp,
  HardDrive,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { filesVaultApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { StoredFileItem, FileCategory, FilesVaultData } from "@/types";
import { FILE_CATEGORIES } from "@/types";

// ======================================================================
// دوال مساعدة لحساب وتنسيق الحجم
// ======================================================================
function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 بايت";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getCategoryMeta(category: FileCategory) {
  return FILE_CATEGORIES.find((c) => c.key === category) || FILE_CATEGORIES[5];
}

function getFileIcon(category: FileCategory, ext?: string) {
  const e = (ext || "").toLowerCase();
  if (e === "pdf") return FileText;
  if (["xls", "xlsx", "csv"].includes(e)) return FileSpreadsheet;
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(e)) return ImageIcon;
  if (["mp3", "wav", "m4a", "ogg"].includes(e)) return Music;
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) return Archive;

  switch (category) {
    case "documents":
      return FileText;
    case "spreadsheets":
      return FileSpreadsheet;
    case "images":
      return ImageIcon;
    case "audio":
      return Music;
    case "archives":
      return Archive;
    default:
      return Folder;
  }
}

export default function FilesVaultPage() {
  const [data, setData] = useState<FilesVaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // الفلاتر والمجلدات
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | "all">("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // نافذة الرفع
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // نافذة المعاينة
  const [previewFile, setPreviewFile] = useState<StoredFileItem | null>(null);

  // نافذة التعديل
  const [editFile, setEditFile] = useState<StoredFileItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCategory, setEditCategory] = useState<FileCategory>("documents");

  // كليبورد نسخ الرابط
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { showToast } = useToast();

  // ── تحميل البيانات ─────────────────────────────────────────────────
  async function loadFiles() {
    setLoading(true);
    try {
      const res = await filesVaultApi.list();
      setData(res);
    } catch {
      showToast("تعذّر تحميل ملفات الخزينة", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  // ── اختيار ملف من المتصفح للرفع ───────────────────────────────────
  function handleFileSelect(file: File) {
    setSelectedFile(file);
    // اقتراح الاسم بدون الامتداد
    const lastDot = file.name.lastIndexOf(".");
    const baseName = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
    setCustomName(baseName);
  }

  // ── رفع الملف ───────────────────────────────────────────────────────
  async function handleUpload(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedFile) {
      showToast("يرجى اختيار ملف أولاً", "error");
      return;
    }

    setSaving("upload");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (customName.trim()) formData.append("name", customName.trim());
      if (notes.trim()) formData.append("notes", notes.trim());
      formData.append("isPublic", String(isPublic));

      await filesVaultApi.upload(formData);
      showToast("✅ تم رفع وتخزين الملف بنجاح", "success");
      setUploadModal(false);
      setSelectedFile(null);
      setCustomName("");
      setNotes("");
      setIsPublic(true);
      await loadFiles();
    } catch (err: any) {
      showToast(err.message || "حدث خطأ أثناء رفع الملف", "error");
    } finally {
      setSaving(null);
    }
  }

  // ── حذف ملف ─────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف الملف "${name}" نهائياً من الخزينة؟`)) return;
    setSaving(id + "-del");
    try {
      await filesVaultApi.remove(id);
      showToast("✅ تم حذف الملف بنجاح", "success");
      await loadFiles();
    } catch {
      showToast("تعذّر حذف الملف", "error");
    } finally {
      setSaving(null);
    }
  }

  // ── تعديل ملف ───────────────────────────────────────────────────────
  async function handleUpdateFile(e: React.FormEvent) {
    e.preventDefault();
    if (!editFile || !editName.trim()) return;

    setSaving("edit");
    try {
      await filesVaultApi.update(editFile._id, {
        name: editName.trim(),
        notes: editNotes.trim(),
        category: editCategory,
      });
      showToast("✅ تم تحديث بيانات الملف", "success");
      setEditFile(null);
      await loadFiles();
    } catch {
      showToast("تعذّر تحديث الملف", "error");
    } finally {
      setSaving(null);
    }
  }

  // ── نسخ رابط المشاركة ──────────────────────────────────────────────
  function copyShareLink(file: StoredFileItem) {
    const url = filesVaultApi.getDownloadUrl(file._id);
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(file._id);
        showToast("✅ تم نسخ رابط التنزيل المباشر للمشاركة", "success");
        setTimeout(() => setCopiedId(null), 2500);
      })
      .catch(() => {
        showToast("تعذّر نسخ الرابط", "error");
      });
  }

  // ── الفلترة المتقدمة ─────────────────────────────────────────────────
  const filteredFiles = useMemo(() => {
    if (!data?.files) return [];
    let list = data.files;

    if (selectedCategory !== "all") {
      list = list.filter((f) => f.category === selectedCategory);
    }
    if (selectedYear !== "all") {
      list = list.filter((f) => f.year === selectedYear);
    }
    if (selectedMonth !== "all") {
      list = list.filter((f) => f.month === selectedMonth);
    }
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.original_name.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          (f.notes && f.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [data?.files, selectedCategory, selectedYear, selectedMonth, searchQ]);

  // قائمة السنوات والشهور المتاحة للمجلد التلقائي
  const availableYears = useMemo(() => {
    if (!data?.files) return [];
    const set = new Set(data.files.map((f) => f.year).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [data?.files]);

  const availableMonths = useMemo(() => {
    if (!data?.files) return [];
    let list = data.files;
    if (selectedYear !== "all") {
      list = list.filter((f) => f.year === selectedYear);
    }
    const set = new Set(list.map((f) => f.month).filter(Boolean));
    return Array.from(set);
  }, [data?.files, selectedYear]);

  // إحصاءات عامة
  const stats = data?.stats || { totalFiles: 0, totalSizeBytes: 0, totalDownloads: 0 };

  return (
    <div data-dash className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      {/* ── الرأس والإجراء الرئيسي ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-brand-soft border border-brand/30 flex items-center justify-center text-brand shadow-sm">
            <FolderArchive size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">مركز الملفات والمستندات</h1>
            <p className="text-xs sm:text-sm text-ink-mute mt-0.5">
              خزينة سحابية آمنة لحفظ وتنظيم كافة ملفات ومستندات المدرسة حسب النوع والتاريخ
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setSelectedFile(null);
            setCustomName("");
            setNotes("");
            setUploadModal(true);
          }}
          className="gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <FileUp size={18} />
          رفع ملف جديد
        </Button>
      </div>

      {/* ── بطاقات الإحصاءات العلوية ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FolderArchive size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-ink tabular-nums">{stats.totalFiles}</p>
            <p className="text-xs font-semibold text-ink-mute mt-0.5">إجمالي الملفات</p>
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HardDrive size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-ink tabular-nums">
              {formatBytes(stats.totalSizeBytes)}
            </p>
            <p className="text-xs font-semibold text-ink-mute mt-0.5">المساحة المستخدمة</p>
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Download size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-ink tabular-nums">{stats.totalDownloads}</p>
            <p className="text-xs font-semibold text-ink-mute mt-0.5">مرات التنزيل</p>
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-ink tabular-nums">
              {Object.keys(data?.foldersTree || {}).filter((k) => (data?.foldersTree[k]?.count || 0) > 0).length || 6}
            </p>
            <p className="text-xs font-semibold text-ink-mute mt-0.5">تصنيفات نشطة</p>
          </div>
        </div>
      </div>

      {/* ── شريط المجلدات حسب نوع الملف (Auto Folders by Category) ─────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-brand" />
            <h2 className="text-sm font-bold text-ink">مجلدات الأنواع التلقائية</h2>
          </div>
          <span className="text-xs text-ink-mute">يتم إنشاء وتصنيف المجلد تلقائياً حسب نوع الملف</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedMonth("all");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
              selectedCategory === "all"
                ? "bg-brand text-white border-brand shadow-sm shadow-brand/20"
                : "bg-surface hover:bg-surface-2 text-ink border-line"
            }`}
          >
            <Layers size={14} />
            <span>كل الملفات</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${
                selectedCategory === "all" ? "bg-white/20 text-white" : "bg-bg-alt text-ink-mute"
              }`}
            >
              {stats.totalFiles}
            </span>
          </button>

          {FILE_CATEGORIES.map((cat) => {
            const Icon = getFileIcon(cat.key);
            const count = data?.foldersTree?.[cat.key]?.count || 0;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setSelectedMonth("all");
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
                  isSelected
                    ? "bg-brand text-white border-brand shadow-sm shadow-brand/20"
                    : "bg-surface hover:bg-surface-2 text-ink border-line"
                }`}
              >
                <Icon size={14} className={isSelected ? "text-white" : cat.color.split(" ")[0]} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${
                    isSelected ? "bg-white/20 text-white" : "bg-bg-alt text-ink-mute"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── شريط المجلدات الزمنية والبحث (Auto Folders by Date & Search) ─ */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* المجلدات الزمنية (السنة والشهور) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink-mute px-2">
            <Calendar size={14} />
            <span>المجلد الزمني:</span>
          </div>

          {/* اختيار السنة */}
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedMonth("all");
            }}
            className="text-xs font-bold border border-line rounded-xl px-3 py-2 bg-surface text-ink cursor-pointer outline-none focus:ring-1 focus:ring-brand/30"
          >
            <option value="all">كل السنوات</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                مجلد سنة {y}
              </option>
            ))}
          </select>

          {/* اختيار الشهر */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={availableMonths.length === 0}
            className="text-xs font-bold border border-line rounded-xl px-3 py-2 bg-surface text-ink cursor-pointer disabled:opacity-50 outline-none focus:ring-1 focus:ring-brand/30"
          >
            <option value="all">كل الشهور</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                مجلد شهر {m}
              </option>
            ))}
          </select>

          {(selectedCategory !== "all" || selectedYear !== "all" || selectedMonth !== "all") && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedYear("all");
                setSelectedMonth("all");
                setSearchQ("");
              }}
              className="text-xs text-brand font-bold hover:underline px-2 cursor-pointer"
            >
              إلغاء التصفية
            </button>
          )}
        </div>

        {/* البحث وطريقة العرض */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute"
            />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="بحث في الملفات والملاحظات..."
              className="w-full text-xs font-medium border border-line rounded-xl pr-9 pl-3 py-2 bg-surface text-ink placeholder:text-ink-mute outline-none focus:ring-1 focus:ring-brand/30"
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex border border-line rounded-xl overflow-hidden p-0.5 bg-surface">
            <button
              onClick={() => setViewMode("grid")}
              title="عرض كشبكة بطاقات"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-brand text-white shadow-xs" : "text-ink-mute hover:text-ink"
              }`}
            >
              <Layers size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="عرض كجدول بيانات"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-brand text-white shadow-xs" : "text-ink-mute hover:text-ink"
              }`}
            >
              <ArrowUpDown size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── شريط المسار الحالي (Breadcrumbs) ─────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-ink-mute px-1">
        <span>مركز الملفات</span>
        <ChevronRight size={13} />
        <span className="font-bold text-ink">
          {selectedCategory === "all"
            ? "جميع الملفات"
            : FILE_CATEGORIES.find((c) => c.key === selectedCategory)?.label}
        </span>
        {selectedYear !== "all" && (
          <>
            <ChevronRight size={13} />
            <span className="font-bold text-brand">{selectedYear}</span>
          </>
        )}
        {selectedMonth !== "all" && (
          <>
            <ChevronRight size={13} />
            <span className="font-bold text-brand">{selectedMonth}</span>
          </>
        )}
        <span className="mr-auto font-bold tabular-nums">
          {filteredFiles.length} {filteredFiles.length === 1 ? "ملف" : "ملفات"}
        </span>
      </div>

      {/* ── قائمة الملفات (Grid أو Table) ────────────────────────────── */}
      {loading ? (
        <Loader label="جاري استعراض مركز الملفات والمستندات..." />
      ) : filteredFiles.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderArchive size={52} className="mx-auto text-ink-mute mb-4 opacity-40" />
          <p className="text-lg font-bold text-ink">لا توجد ملفات في هذا المجلد</p>
          <p className="text-xs sm:text-sm text-ink-mute mt-1 max-w-md mx-auto">
            {searchQ
              ? "لم يتم العثور على أي ملف يطابق كلمة البحث الحالية"
              : "يمكنك رفع أول ملف الآن وسيتم تصنيفه في المجلد المناسب تلقائياً"}
          </p>
          <Button
            onClick={() => setUploadModal(true)}
            variant="outline"
            className="mt-5 gap-2 mx-auto"
          >
            <Upload size={16} />
            رفع ملف الآن
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── شبكة البطاقات (Grid View) ──────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const meta = getCategoryMeta(file.category);
            const Icon = getFileIcon(file.category, file.extension);
            const downloadUrl = filesVaultApi.getDownloadUrl(file._id);
            const previewUrl = filesVaultApi.getPreviewUrl(file._id);
            const isDeleting = saving === file._id + "-del";

            return (
              <div
                key={file._id}
                className="card p-4 flex flex-col justify-between hover:shadow-md transition-all group border-line hover:border-brand/40"
              >
                <div>
                  {/* رأس الكارد: أيقونة النوع + قائمة الخيارات السريعة */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${meta.border} ${meta.color}`}
                    >
                      <Icon size={24} />
                    </div>

                    <div className="flex items-center gap-1">
                      {/* زر نسخ الرابط */}
                      <button
                        onClick={() => copyShareLink(file)}
                        title="نسخ رابط التنزيل المباشر للمشاركة"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          copiedId === file._id
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "text-ink-mute hover:text-ink hover:bg-surface-2"
                        }`}
                      >
                        {copiedId === file._id ? <Check size={14} /> : <Share2 size={14} />}
                      </button>

                      {/* زر تعديل */}
                      <button
                        onClick={() => {
                          setEditFile(file);
                          setEditName(file.name);
                          setEditNotes(file.notes || "");
                          setEditCategory(file.category);
                        }}
                        title="تعديل اسم وملاحظات الملف"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-mute hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* زر حذف */}
                      <button
                        onClick={() => handleDelete(file._id, file.name)}
                        disabled={isDeleting}
                        title="حذف الملف نهائياً"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-danger-ink hover:bg-danger-soft transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isDeleting ? <Spinner size={14} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* اسم الملف المخصص */}
                  <h3
                    className="font-black text-ink text-sm leading-snug line-clamp-2 mb-1"
                    title={file.name}
                  >
                    {file.name}
                  </h3>

                  {/* اسم الملف الأصلي والحجم */}
                  <p
                    className="text-[11px] text-ink-mute truncate font-mono mb-2"
                    title={file.original_name}
                  >
                    {file.original_name}
                  </p>

                  {/* الملاحظات إن وجدت */}
                  {file.notes && (
                    <p className="text-xs text-ink-mute bg-bg-alt/70 p-2 rounded-lg mb-3 line-clamp-2">
                      {file.notes}
                    </p>
                  )}
                </div>

                <div>
                  {/* البادجات: النوع + الحجم + المجلد الزمني */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-3 border-t border-line text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${meta.badge}`}>
                      {file.extension}
                    </span>
                    <span className="text-ink-mute tabular-nums">
                      {formatBytes(file.size_bytes)}
                    </span>
                    <span className="text-ink-mute mx-1">•</span>
                    <span className="text-ink-mute">
                      {file.month} {file.year}
                    </span>
                  </div>

                  {/* أزرار الإجراءات السفلية: معاينة + تنزيل */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-line text-xs font-bold text-ink hover:bg-surface-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      معاينة
                    </a>

                    <a
                      href={downloadUrl}
                      className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download size={13} />
                      تنزيل
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── جدول البيانات (Table View) ─────────────────────────────── */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-xs font-bold text-ink-mute text-right">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">اسم الملف</th>
                  <th className="px-4 py-3">الملف الأصلي</th>
                  <th className="px-4 py-3 text-center">التصنيف</th>
                  <th className="px-4 py-3 text-center">المجلد الزمني</th>
                  <th className="px-4 py-3 text-center">الحجم</th>
                  <th className="px-4 py-3 text-center">التنزيلات</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, idx) => {
                  const meta = getCategoryMeta(file.category);
                  const Icon = getFileIcon(file.category, file.extension);
                  const downloadUrl = filesVaultApi.getDownloadUrl(file._id);
                  const previewUrl = filesVaultApi.getPreviewUrl(file._id);
                  const isDeleting = saving === file._id + "-del";

                  return (
                    <tr
                      key={file._id}
                      className="border-b border-line transition-colors hover:bg-surface-2/60"
                    >
                      <td className="px-4 py-3 text-xs text-ink-mute tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${meta.border} ${meta.color}`}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-ink text-xs sm:text-sm">{file.name}</p>
                            {file.notes && (
                              <p className="text-[11px] text-ink-mute line-clamp-1">
                                {file.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-mute font-mono">
                        {file.original_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-ink-mute">
                        {file.month} {file.year}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-ink tabular-nums">
                        {formatBytes(file.size_bytes)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-ink tabular-nums">
                        {file.download_count || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="معاينة في تبويب جديد"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-mute hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </a>

                          <a
                            href={downloadUrl}
                            title="تنزيل الملف"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-brand hover:bg-brand-soft transition-colors cursor-pointer"
                          >
                            <Download size={14} />
                          </a>

                          <button
                            onClick={() => copyShareLink(file)}
                            title="نسخ رابط التنزيل المباشر"
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              copiedId === file._id
                                ? "bg-emerald-100 text-emerald-700"
                                : "text-ink-mute hover:text-ink hover:bg-surface-2"
                            }`}
                          >
                            {copiedId === file._id ? <Check size={14} /> : <Share2 size={14} />}
                          </button>

                          <button
                            onClick={() => {
                              setEditFile(file);
                              setEditName(file.name);
                              setEditNotes(file.notes || "");
                              setEditCategory(file.category);
                            }}
                            title="تعديل الاسم والملاحظات"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-mute hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(file._id, file.name)}
                            disabled={isDeleting}
                            title="حذف الملف"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-danger-ink hover:bg-danger-soft transition-colors cursor-pointer disabled:opacity-40"
                          >
                            {isDeleting ? <Spinner size={14} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* مودال رفع ملف جديد (Upload Modal with Drag & Drop) */}
      {/* ======================================================== */}
      {uploadModal && (
        <div className="modal-overlay" onClick={() => !saving && setUploadModal(false)}>
          <div
            className="card w-full max-w-lg p-6 sm:p-7 mx-4 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <div>
                  <h2 className="font-black text-lg text-ink">رفع وتخزين ملف جديد</h2>
                  <p className="text-xs text-ink-mute">
                    يتم حفظ الملف في قاعدة البيانات وتصنيفه في المجلد تلقائياً
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModal(false)}
                disabled={Boolean(saving)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-mute hover:bg-bg-alt cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* منطقة الإفلات السحابية Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-brand bg-brand-soft/40 scale-[1.01]"
                    : selectedFile
                    ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-line hover:border-brand/50 hover:bg-surface-2/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                  }}
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center">
                      <Check size={20} />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-ink truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-ink-mute tabular-nums">
                        {formatBytes(selectedFile.size)} • انقر لتغيير الملف
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={32} className="mx-auto text-brand opacity-80" />
                    <p className="text-sm font-bold text-ink">
                      اسحب وأفلت الملف هنا، أو <span className="text-brand underline">تصفح جهازك</span>
                    </p>
                    <p className="text-xs text-ink-mute">
                      يقبل كافة الصيغ (PDF, Word, Excel, صور، صوتيات، أرشيف...) حتى 100 ميجابايت
                    </p>
                  </div>
                )}
              </div>

              {/* الاسم المخصص للملف */}
              <div>
                <label className="field-label">اسم الملف (للعرض والبحث)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="مثال: كشف درجات مسابقة القرآن 2026"
                  required
                  className="field"
                />
                <p className="text-[11px] text-ink-mute mt-1">
                  يمكنك تحديد اسم مميز وسهل للبحث داخل النظام
                </p>
              </div>

              {/* الملاحظات */}
              <div>
                <label className="field-label">ملاحظات وتفاصيل إضافية (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يخص طلاب المرحلة المتوسطة، تم اعتماده من الإدارة..."
                  rows={2}
                  className="field resize-none"
                />
              </div>

              {/* خيار المشاركة */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-line">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-brand cursor-pointer w-4 h-4"
                />
                <label htmlFor="isPublic" className="text-xs font-bold text-ink cursor-pointer select-none">
                  إتاحة الملف للتنزيل برابط مباشر (يمكن مشاركته مع المعلمين أو الطلاب)
                </label>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!selectedFile || saving === "upload"}
                  className="flex-1 gap-2"
                >
                  {saving === "upload" ? <Spinner size={16} /> : <Upload size={16} />}
                  بدء الرفع والتخزين
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadModal(false)}
                  disabled={Boolean(saving)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* مودال تعديل بيانات الملف */}
      {/* ======================================================== */}
      {editFile && (
        <div className="modal-overlay" onClick={() => !saving && setEditFile(null)}>
          <div
            className="card w-full max-w-md p-6 mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-bold text-base text-ink">تعديل بيانات الملف</h2>
              <button
                onClick={() => setEditFile(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-mute hover:bg-bg-alt cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateFile} className="space-y-4">
              <div>
                <label className="field-label">اسم الملف المخصص</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">المجلد والتصنيف</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as FileCategory)}
                  className="field field-select"
                >
                  {FILE_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">ملاحظات وتفاصيل</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="field resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={saving === "edit"} className="flex-1 gap-2">
                  {saving === "edit" ? <Spinner size={16} /> : <Check size={16} />}
                  حفظ التعديلات
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditFile(null)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
