"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Flower2,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus,
  Search,
  Users,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Star,
  Filter,
  X,
  UserPlus,
} from "lucide-react";
import { rayhanaApi, studentsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { RayhanaStudent, RayhanaLevel, Student } from "@/types";
import { RAYHANA_LEVELS } from "@/types";

// ======================================================================
// الألوان المخصصة لكل مستوى
// ======================================================================
const LEVEL_COLORS: Record<RayhanaLevel, { bg: string; border: string; text: string; badge: string }> = {
  level_3:    { bg: "bg-sky-50 dark:bg-sky-950/40",    border: "border-sky-200 dark:border-sky-800",    text: "text-sky-700 dark:text-sky-300",    badge: "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300" },
  level_5:    { bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-200 dark:border-violet-800", text: "text-violet-700 dark:text-violet-300", badge: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300" },
  level_10:   { bg: "bg-amber-50 dark:bg-amber-950/40",  border: "border-amber-200 dark:border-amber-800",  text: "text-amber-700 dark:text-amber-300",  badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" },
  level_20:   { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" },
  level_full: { bg: "bg-gold-soft dark:bg-amber-950/60", border: "border-gold/50 dark:border-gold/30",      text: "text-gold-ink dark:text-gold",          badge: "bg-gold-soft dark:bg-amber-900/60 text-gold-ink dark:text-gold" },
};

// ======================================================================
// مكون بطاقة الإحصاء
// ======================================================================
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className={`card p-4 sm:p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ink tabular-nums">{value}</p>
        <p className="text-xs font-semibold text-ink-mute mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ======================================================================
// مكون مؤشر المستوى
// ======================================================================
function LevelBadge({ level, className = "" }: { level: RayhanaLevel; className?: string }) {
  const info = RAYHANA_LEVELS.find(l => l.key === level);
  const colors = LEVEL_COLORS[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${colors.badge} ${className}`}>
      <Star size={11} fill="currentColor" />
      {info?.parts ?? level}
    </span>
  );
}

// ======================================================================
// الصفحة الرئيسية
// ======================================================================
export default function RayhanaPage() {
  const currentYear = new Date().getFullYear().toString();
  const [year, setYear] = useState(currentYear);
  const [students, setStudents] = useState<RayhanaStudent[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // فلاتر
  const [searchQ, setSearchQ] = useState("");
  const [filterLevel, setFilterLevel] = useState<RayhanaLevel | "all">("all");
  const [filterPassed, setFilterPassed] = useState<"all" | "passed" | "pending">("all");

  // selection للعمليات الجماعية
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // مودال الترقية الجماعية
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkTargetLevel, setBulkTargetLevel] = useState<RayhanaLevel>("level_3");

  // مودال إضافة طلاب غير موجودين
  const [addModal, setAddModal] = useState(false);
  const [addStudentId, setAddStudentId] = useState("");

  const { showToast } = useToast();

  // ── تحميل البيانات ─────────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    setSelected(new Set());
    try {
      const [rayhanaData, studentsList] = await Promise.all([
        rayhanaApi.getData(year).catch(() => ({ year, students: [] })),
        studentsApi.list(),
      ]);
      setStudents(rayhanaData.students ?? []);
      setAllStudents(studentsList);
    } catch {
      showToast("تعذّر تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [year]);

  // ── تهيئة الطلاب (init) ────────────────────────────────────────────
  async function handleInit() {
    setSaving("init");
    try {
      const res = await rayhanaApi.initStudents(year);
      showToast(`✅ تمت إضافة ${res.added} طالب للمسابقة`, "success");
      await loadData();
    } catch {
      showToast("حدث خطأ أثناء التهيئة", "error");
    } finally {
      setSaving(null);
    }
  }

  // ── تعديل مستوى طالب واحد ─────────────────────────────────────────
  async function handleUpdateStudent(
    studentId: string,
    updates: { currentLevel?: RayhanaLevel; passed?: boolean; notes?: string }
  ) {
    const current = students.find(s => s.studentId === studentId);
    if (!current) return;
    const merged = {
      currentLevel: updates.currentLevel ?? current.currentLevel,
      passed: updates.passed ?? current.passed,
      notes: updates.notes ?? current.notes,
    };
    setSaving(studentId);
    try {
      const updated = await rayhanaApi.updateStudent(studentId, merged);
      setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, ...updated } : s));
      showToast("✅ تم التحديث بنجاح", "success");
    } catch {
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(null);
    }
  }

  // ── ترقية جماعية ───────────────────────────────────────────────────
  async function handleBulkPromote() {
    if (!selected.size) return;
    setSaving("bulk");
    try {
      const res = await rayhanaApi.bulkPromote([...selected], bulkTargetLevel);
      showToast(`✅ تمت ترقية ${res.updated} طالب`, "success");
      setBulkModal(false);
      setSelected(new Set());
      await loadData();
    } catch {
      showToast("حدث خطأ أثناء الترقية الجماعية", "error");
    } finally {
      setSaving(null);
    }
  }

  // ── حذف طالب من المسابقة ──────────────────────────────────────────
  async function handleRemove(studentId: string, name: string) {
    if (!confirm(`هل أنت متأكد من إزالة "${name}" من المسابقة؟`)) return;
    setSaving(studentId + "-del");
    try {
      await rayhanaApi.removeStudent(studentId);
      setStudents(prev => prev.filter(s => s.studentId !== studentId));
      showToast("✅ تمت الإزالة", "success");
    } catch {
      showToast("حدث خطأ أثناء الإزالة", "error");
    } finally {
      setSaving(null);
    }
  }

  // ── تصدير Excel ────────────────────────────────────────────────────
  async function handleExport() {
    setSaving("export");
    try {
      // محاولة التصدير كملف إكسل من الباك إند
      await downloadFile(`/rayhana/export?year=${year}`, `ريحانة-المدينة-${year}.xlsx`);
      showToast("✅ تم تنزيل كشف الإكسل بنجاح", "success");
    } catch {
      // Fallback: تصدير CSV فوري من المتصفح لو الباك إند أوفلاين
      try {
        const rows = [
          ["م", "اسم الطالب", "المستوى", "عدد الأجزاء", "الحالة", "تاريخ آخر ترقية", "ملاحظات"],
          ...students.map((s, idx) => {
            const lvl = RAYHANA_LEVELS.find((l) => l.key === s.currentLevel);
            return [
              idx + 1,
              `"${s.studentName}"`,
              `"${lvl?.label ?? s.currentLevel}"`,
              `"${lvl?.parts ?? ""}"`,
              s.passed ? "نجح" : "قيد الاختبار",
              s.promotedAt ? new Date(s.promotedAt).toLocaleDateString("ar-EG") : "—",
              `"${s.notes ?? ""}"`,
            ];
          }),
        ];
        const csv = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ريحانة-المدينة-${year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("✅ تم تصدير ملف CSV", "success");
      } catch {
        showToast("حدث خطأ أثناء التصدير", "error");
      }
    } finally {
      setSaving(null);
    }
  }

  // ── الفلترة ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = students;
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter(s => s.studentName.toLowerCase().includes(q) || (s.nationalId ?? "").includes(q));
    }
    if (filterLevel !== "all") list = list.filter(s => s.currentLevel === filterLevel);
    if (filterPassed === "passed") list = list.filter(s => s.passed);
    if (filterPassed === "pending") list = list.filter(s => !s.passed);
    return list;
  }, [students, searchQ, filterLevel, filterPassed]);

  // ── الإحصاءات ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = students.length;
    const passed = students.filter(s => s.passed).length;
    const byLevel = RAYHANA_LEVELS.map(l => ({
      ...l,
      count: students.filter(s => s.currentLevel === l.key).length,
    }));
    return { total, passed, byLevel };
  }, [students]);

  // الطلاب غير المضافين في المسابقة
  const studentsNotInRayhana = useMemo(() => {
    const inIds = new Set(students.map(s => s.studentId));
    return allStudents.filter(s => !inIds.has(s.id));
  }, [students, allStudents]);

  // ── Selection helpers ──────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.studentId)));
  }

  // ── Promote/Demote helpers ─────────────────────────────────────────
  function getNextLevel(current: RayhanaLevel): RayhanaLevel | null {
    const idx = RAYHANA_LEVELS.findIndex(l => l.key === current);
    return idx < RAYHANA_LEVELS.length - 1 ? RAYHANA_LEVELS[idx + 1].key : null;
  }
  function getPrevLevel(current: RayhanaLevel): RayhanaLevel | null {
    const idx = RAYHANA_LEVELS.findIndex(l => l.key === current);
    return idx > 0 ? RAYHANA_LEVELS[idx - 1].key : null;
  }

  // ── إضافة طالب واحد للمسابقة ─────────────────────────────────────
  async function handleAddStudent() {
    if (!addStudentId) return;
    setSaving("add");
    try {
      // نستخدم updateStudent لإضافة طالب بمستوى أول
      const updated = await rayhanaApi.updateStudent(addStudentId, {
        currentLevel: "level_3",
        passed: false,
      });
      const studentInfo = allStudents.find(s => s.id === addStudentId);
      setStudents(prev => [...prev, {
        ...updated,
        studentName: studentInfo?.name ?? "طالب",
      }]);
      setAddModal(false);
      setAddStudentId("");
      showToast("✅ تمت إضافة الطالب للمسابقة", "success");
    } catch {
      showToast("حدث خطأ أثناء الإضافة", "error");
    } finally {
      setSaving(null);
    }
  }

  // ======================================================================
  // UI
  // ======================================================================
  return (
    <div data-dash className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold-soft border border-gold/40 flex items-center justify-center text-gold-ink sh-soft">
            <Flower2 size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">ريحانة المدينة</h1>
            <p className="text-sm text-ink-mute mt-0.5">مسابقة حفظ القرآن الكريم — {year}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* اختيار السنة */}
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="field field-select h-10 px-3 pr-8 text-sm rounded-xl"
          >
            {[currentYear, String(+currentYear - 1), String(+currentYear + 1)].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            تحديث
          </Button>

          <Button variant="outline" size="sm" onClick={() => setAddModal(true)} className="gap-1.5">
            <UserPlus size={15} />
            إضافة طالب
          </Button>

          <Button size="sm" onClick={handleInit} disabled={saving === "init"} className="gap-1.5 bg-gold text-on-gold hover:bg-gold/90">
            {saving === "init" ? <Spinner size={16} /> : <RefreshCw size={15} />}
            تهيئة كل الطلاب
          </Button>

          <Button size="sm" onClick={handleExport} disabled={saving === "export"} className="gap-1.5">
            {saving === "export" ? <Spinner size={16} /> : <Download size={15} />}
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* ── إحصاءات سريعة ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="إجمالي المشتركين" value={stats.total} icon={Users} color="bg-brand-soft text-brand-ink" />
        <StatCard label="نجحوا في مستواهم" value={stats.passed} icon={CheckCircle2} color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" />
        <StatCard label="قيد الاختبار" value={stats.total - stats.passed} icon={Star} color="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" />
        <StatCard label="غير المسجلين" value={studentsNotInRayhana.length} icon={Flower2} color="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" />
      </div>

      {/* ── شريط المستويات ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.byLevel.map(lv => {
          const colors = LEVEL_COLORS[lv.key];
          const pct = stats.total ? Math.round((lv.count / stats.total) * 100) : 0;
          return (
            <div
              key={lv.key}
              onClick={() => setFilterLevel(filterLevel === lv.key ? "all" : lv.key)}
              className={`card p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${filterLevel === lv.key ? `${colors.bg} ${colors.border} ring-2 ring-current ${colors.text}` : ""}`}
            >
              <p className={`text-[11px] font-bold uppercase tracking-wide ${colors.text}`}>{lv.label}</p>
              <p className="text-xs text-ink-mute mb-2">{lv.parts}</p>
              <p className="text-2xl font-extrabold text-ink tabular-nums">{lv.count}</p>
              <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors.text.replace("text-", "bg-")}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── أدوات الفلترة ─────────────────────────────────────────── */}
      <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="بحث بالاسم أو رقم الهوية..."
            className="field pr-9 h-10 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterPassed}
            onChange={e => setFilterPassed(e.target.value as any)}
            className="field field-select h-10 px-3 pr-8 text-sm rounded-xl min-w-[130px]"
          >
            <option value="all">كل الحالات</option>
            <option value="passed">نجح ✅</option>
            <option value="pending">قيد الاختبار ⏳</option>
          </select>
          {(searchQ || filterLevel !== "all" || filterPassed !== "all") && (
            <button
              onClick={() => { setSearchQ(""); setFilterLevel("all"); setFilterPassed("all"); }}
              className="h-10 px-3 rounded-xl text-sm font-semibold text-danger-ink bg-danger-soft border border-danger-solid/30 flex items-center gap-1.5 cursor-pointer hover:bg-danger-solid hover:text-white transition-colors"
            >
              <X size={14} />
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* عمليات جماعية */}
        {selected.size > 0 && (
          <button
            onClick={() => setBulkModal(true)}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-brand text-on-brand flex items-center gap-1.5 cursor-pointer hover:bg-brand-strong transition-colors whitespace-nowrap"
          >
            <ArrowUpCircle size={15} />
            ترقية {selected.size} طالب
          </button>
        )}
      </div>

      {/* ── الجدول / البطاقات ──────────────────────────────────────── */}
      {loading ? (
        <Loader label="جاري تحميل بيانات المسابقة..." />
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Flower2 size={48} className="mx-auto text-ink-mute mb-4 opacity-40" />
          <p className="text-lg font-bold text-ink-mute">لا توجد نتائج</p>
          {students.length === 0 && (
            <p className="text-sm text-ink-mute mt-2">
              اضغط على <strong>&quot;تهيئة كل الطلاب&quot;</strong> لإضافة جميع طلاب المدرسة للمسابقة
            </p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* رأس الجدول */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="cursor-pointer accent-brand"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-ink-mute">#</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-ink-mute">اسم الطالب</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-ink-mute">المستوى الحالي</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-ink-mute">الحالة</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-ink-mute">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => {
                  const colors = LEVEL_COLORS[s.currentLevel];
                  const isSaving = saving === s.studentId || saving === s.studentId + "-del";
                  const nextLv = getNextLevel(s.currentLevel);
                  const prevLv = getPrevLevel(s.currentLevel);
                  return (
                    <tr
                      key={s.studentId}
                      className={`border-b border-line transition-colors hover:bg-surface-2/60 ${selected.has(s.studentId) ? "bg-brand-soft/30" : ""}`}
                    >
                      {/* checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(s.studentId)}
                          onChange={() => toggleSelect(s.studentId)}
                          className="cursor-pointer accent-brand"
                        />
                      </td>

                      {/* رقم */}
                      <td className="px-4 py-3 text-sm text-ink-mute tabular-nums">{idx + 1}</td>

                      {/* الاسم */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-ink text-sm">{s.studentName}</p>
                        {s.groupName && <p className="text-[11px] text-ink-mute mt-0.5">{s.groupName}</p>}
                      </td>

                      {/* المستوى */}
                      <td className="px-4 py-3 text-center">
                        <LevelBadge level={s.currentLevel} />
                      </td>

                      {/* الحالة */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleUpdateStudent(s.studentId, { passed: !s.passed })}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            s.passed
                              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                              : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {isSaving && saving === s.studentId ? (
                            <Spinner size={16} />
                          ) : s.passed ? (
                            <><CheckCircle2 size={13} /> نجح</>
                          ) : (
                            <><Minus size={13} /> قيد الاختبار</>
                          )}
                        </button>
                      </td>

                      {/* الإجراءات */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* ترقية */}
                          {nextLv && (
                            <button
                              onClick={() => handleUpdateStudent(s.studentId, { currentLevel: nextLv, passed: false })}
                              disabled={isSaving}
                              title={`ترقية إلى ${RAYHANA_LEVELS.find(l => l.key === nextLv)?.parts}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <ArrowUpCircle size={17} />
                            </button>
                          )}

                          {/* تراجع */}
                          {prevLv && (
                            <button
                              onClick={() => handleUpdateStudent(s.studentId, { currentLevel: prevLv, passed: false })}
                              disabled={isSaving}
                              title={`رجوع إلى ${RAYHANA_LEVELS.find(l => l.key === prevLv)?.parts}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <ArrowDownCircle size={17} />
                            </button>
                          )}

                          {/* اختيار مستوى مباشر */}
                          <select
                            value={s.currentLevel}
                            onChange={e => handleUpdateStudent(s.studentId, { currentLevel: e.target.value as RayhanaLevel })}
                            disabled={isSaving}
                            className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink cursor-pointer disabled:opacity-40 outline-none focus:ring-1 focus:ring-brand/30"
                          >
                            {RAYHANA_LEVELS.map(l => (
                              <option key={l.key} value={l.key}>{l.parts}</option>
                            ))}
                          </select>

                          {/* حذف */}
                          <button
                            onClick={() => handleRemove(s.studentId, s.studentName)}
                            disabled={isSaving}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-danger-ink hover:bg-danger-soft transition-colors cursor-pointer disabled:opacity-40"
                            title="إزالة من المسابقة"
                          >
                            {saving === s.studentId + "-del" ? <Spinner size={16} /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-line text-xs text-ink-mute text-center">
            إجمالي {filtered.length} طالب {filtered.length !== students.length ? `(من ${students.length})` : ""}
            {selected.size > 0 && <span className="font-bold text-brand mr-3">• تم اختيار {selected.size}</span>}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* مودال الترقية الجماعية */}
      {/* ======================================================== */}
      {bulkModal && (
        <div className="modal-overlay" onClick={() => setBulkModal(false)}>
          <div className="card w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg text-ink">ترقية جماعية</h2>
              <button onClick={() => setBulkModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-mute hover:bg-bg-alt cursor-pointer"><X size={18} /></button>
            </div>
            <p className="text-sm text-ink-mute mb-4">
              سيتم تغيير مستوى <strong className="text-ink">{selected.size} طالب</strong> للمستوى المختار
            </p>
            <label className="field-label">المستوى الهدف</label>
            <select
              value={bulkTargetLevel}
              onChange={e => setBulkTargetLevel(e.target.value as RayhanaLevel)}
              className="field field-select mb-6"
            >
              {RAYHANA_LEVELS.map(l => (
                <option key={l.key} value={l.key}>{l.label} — {l.parts}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <Button onClick={handleBulkPromote} disabled={saving === "bulk"} className="flex-1 gap-1.5">
                {saving === "bulk" ? <Spinner size={16} /> : <ArrowUpCircle size={16} />}
                تأكيد الترقية
              </Button>
              <Button variant="outline" onClick={() => setBulkModal(false)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* مودال إضافة طالب واحد */}
      {/* ======================================================== */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="card w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg text-ink">إضافة طالب للمسابقة</h2>
              <button onClick={() => setAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-mute hover:bg-bg-alt cursor-pointer"><X size={18} /></button>
            </div>
            <label className="field-label">اختر طالباً</label>
            <select
              value={addStudentId}
              onChange={e => setAddStudentId(e.target.value)}
              className="field field-select mb-6"
            >
              <option value="">-- اختر طالباً --</option>
              {studentsNotInRayhana.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <Button onClick={handleAddStudent} disabled={!addStudentId || saving === "add"} className="flex-1 gap-1.5">
                {saving === "add" ? <Spinner size={16} /> : <UserPlus size={16} />}
                إضافة
              </Button>
              <Button variant="outline" onClick={() => setAddModal(false)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
