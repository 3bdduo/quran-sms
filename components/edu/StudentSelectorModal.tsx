"use client";

import { useState, useMemo } from "react";
import { Search, X, Check, UserCheck, Plus, Users, Filter, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { getStudentGender } from "@/lib/gender";
import type { Student, GroupItem } from "@/types";

interface StudentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  eduGroupName: string;
  allStudents: Student[];
  allGroups: GroupItem[];
  enrolledStudentIds: Set<string>;
  onAddStudent: (studentId: string) => Promise<void>;
  onBulkAddStudents: (studentIds: string[]) => Promise<void>;
  loadingStudents?: boolean;
}

export function StudentSelectorModal({
  isOpen,
  onClose,
  eduGroupName,
  allStudents,
  allGroups,
  enrolledStudentIds,
  onAddStudent,
  onBulkAddStudents,
  loadingStudents = false,
}: StudentSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"male" | "female">("male");
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [singleAddingId, setSingleAddingId] = useState<string | null>(null);

  // خريطة أسماء الحلقات
  const groupMap = useMemo(() => {
    return Object.fromEntries(allGroups.map((g) => [g.id, g.name]));
  }, [allGroups]);

  // تصنيف الطلاب إلى شباب وبنات مع استبعاد طلاب قائمة الانتظار
  const { maleStudents, femaleStudents } = useMemo(() => {
    const active = allStudents.filter((s) => !s.is_waiting);
    const males: Student[] = [];
    const females: Student[] = [];

    active.forEach((s) => {
      const g = getStudentGender(s);
      if (g === "female") females.push(s);
      else males.push(s);
    });

    // ترتيب أبجدي بالعربي
    males.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
    females.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));

    return { maleStudents: males, femaleStudents: females };
  }, [allStudents]);

  // الطلاب المعروضين في التبويب الحالي مع الفلترة
  const currentList = activeTab === "male" ? maleStudents : femaleStudents;

  const filteredList = useMemo(() => {
    return currentList.filter((s) => {
      // فلتر الحلقة
      if (selectedGroupId !== "all" && s.group_id !== selectedGroupId) {
        return false;
      }
      // فلتر البحث
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const ringName = groupMap[s.group_id]?.toLowerCase() || "";
      return (
        s.name.toLowerCase().includes(q) ||
        s.national_id.includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        ringName.includes(q)
      );
    });
  }, [currentList, selectedGroupId, search, groupMap]);

  if (!isOpen) return null;

  // تحديد / إلغاء تحديد الكل غير المضافين
  const nonEnrolledFiltered = filteredList.filter((s) => !enrolledStudentIds.has(s.id));
  const allFilteredSelected =
    nonEnrolledFiltered.length > 0 &&
    nonEnrolledFiltered.every((s) => selectedStudentIds.has(s.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      // إلغاء تحديد الظاهرين
      const next = new Set(selectedStudentIds);
      nonEnrolledFiltered.forEach((s) => next.delete(s.id));
      setSelectedStudentIds(next);
    } else {
      // تحديد كل الظاهرين غير المضافين
      const next = new Set(selectedStudentIds);
      nonEnrolledFiltered.forEach((s) => next.add(s.id));
      setSelectedStudentIds(next);
    }
  }

  function toggleStudent(studentId: string) {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) next.delete(studentId);
    else next.add(studentId);
    setSelectedStudentIds(next);
  }

  async function handleSingleAdd(studentId: string) {
    setSingleAddingId(studentId);
    try {
      await onAddStudent(studentId);
      const next = new Set(selectedStudentIds);
      next.delete(studentId);
      setSelectedStudentIds(next);
    } finally {
      setSingleAddingId(null);
    }
  }

  async function handleBulkAdd() {
    if (selectedStudentIds.size === 0) return;
    setSubmitting(true);
    try {
      await onBulkAddStudents(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-surface rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col sh-float border border-line overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between bg-bg-alt/40">
          <div>
            <div className="flex items-center gap-2">
              <Users className="text-brand" size={22} />
              <h2 className="font-extrabold text-lg sm:text-xl text-ink">
                إضافة طلاب لمجموعة: <span className="text-brand-ink">{eduGroupName}</span>
              </h2>
            </div>
            <p className="text-xs text-ink-mute mt-1">
              اختر الطلاب من حلقات التحفيظ الحالية (مقسمين شباب وبنات ومصنفين أبجدياً)
            </p>
          </div>
          <button
            onClick={onClose}
            className="icon-btn rounded-2xl text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters and Tabs */}
        <div className="p-4 sm:p-6 pb-2 border-b border-line space-y-4 bg-surface">
          {/* Main Gender Tabs */}
          <div className="flex bg-bg-alt p-1.5 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("male")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "male"
                  ? "bg-surface text-brand-ink shadow-sm ring-1 ring-line"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              <span>👦 طلاب شباب (بنين)</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                activeTab === "male" ? "bg-brand-soft text-brand-ink" : "bg-surface text-ink-mute"
              }`}>
                {maleStudents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("female")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "female"
                  ? "bg-surface text-pink-600 dark:text-pink-400 shadow-sm ring-1 ring-line"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              <span>👧 طالبات (بنات)</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                activeTab === "female" ? "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300" : "bg-surface text-ink-mute"
              }`}>
                {femaleStudents.length}
              </span>
            </button>
          </div>

          {/* Search and Ring Select */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute" size={17} />
              <input
                type="text"
                placeholder={`ابحث بالاسم، الرقم القومي، أو حلقة التحفيظ بين الـ ${activeTab === "male" ? "شباب" : "بنات"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field !pl-4 !pr-10 text-sm"
              />
            </div>

            <div>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="field text-sm font-bold"
              >
                <option value="all">كل الحلقات ({allGroups.length})</option>
                {allGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Select Helper Row */}
          <div className="flex items-center justify-between text-xs text-ink-mute pt-1">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={nonEnrolledFiltered.length === 0}
              className="flex items-center gap-1.5 font-bold text-brand-ink hover:underline disabled:opacity-50"
            >
              {allFilteredSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              <span>
                {allFilteredSelected ? "إلغاء تحديد الكل" : `تحديد كل المتاح في القائمة (${nonEnrolledFiltered.length})`}
              </span>
            </button>

            <span>
              تم العثور على: <strong className="text-ink">{filteredList.length}</strong> طالب
              {enrolledStudentIds.size > 0 && (
                <> (منهم <strong className="text-brand-ink">{filteredList.filter((s) => enrolledStudentIds.has(s.id)).length}</strong> مضافين بالفعل)</>
              )}
            </span>
          </div>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-2">
          {loadingStudents ? (
            <div className="py-16 text-center">
              <Loader size="lg" />
              <p className="text-xs text-ink-mute mt-3">جاري تحميل قائمة الطلاب من الحلقات...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 text-ink-mute space-y-2">
              <Users size={40} className="mx-auto text-ink-mute/40" />
              <p className="font-bold text-ink">لا توجد نتائج مطابقة لبحثك</p>
              <p className="text-xs">جرّب البحث باسم آخر أو اختيار حلقة أخرى أو التبديل بين الشباب والبنات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredList.map((student) => {
                const isEnrolled = enrolledStudentIds.has(student.id);
                const isSelected = selectedStudentIds.has(student.id);
                const isAddingThis = singleAddingId === student.id;

                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      if (!isEnrolled) toggleStudent(student.id);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isEnrolled
                        ? "bg-bg-alt/40 border-line/60 opacity-80"
                        : isSelected
                        ? "bg-brand-soft/40 border-brand ring-1 ring-brand/30 cursor-pointer"
                        : "bg-surface hover:bg-bg-alt/30 border-line cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-1">
                      {!isEnrolled ? (
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-brand border-brand text-on-brand"
                              : "border-line bg-surface hover:border-ink-mute"
                          }`}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-lg bg-green-500/15 text-green-600 flex items-center justify-center">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-ink truncate">{student.name}</h4>
                          {isEnrolled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-300">
                              مضاف
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ink-mute mt-0.5">
                          <span className="font-mono text-[11px]">{student.national_id}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-ink-soft">
                            {groupMap[student.group_id] || "حلقة غير محددة"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 mr-2">
                      {isEnrolled ? (
                        <span className="text-xs font-bold text-ink-mute flex items-center gap-1 bg-bg-alt px-2.5 py-1 rounded-xl">
                          <UserCheck size={14} className="text-green-600" />
                          <span>بالمجموعة</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant={isSelected ? "primary" : "outline"}
                          loading={isAddingThis}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleAdd(student.id);
                          }}
                          className="!h-8 !px-3 !text-xs font-bold"
                        >
                          <Plus size={14} />
                          <span>إضافة</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-alt/30">
          <div className="text-xs text-ink-mute">
            تم تحديد <strong className="text-brand-ink text-sm font-bold font-mono">{selectedStudentIds.size}</strong> طالب للإضافة دفعة واحدة
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              إغلاق
            </Button>
            <Button
              onClick={handleBulkAdd}
              loading={submitting}
              disabled={selectedStudentIds.size === 0}
              className="flex-1 sm:flex-none flex items-center gap-2 font-bold"
            >
              <Plus size={16} />
              <span>إضافة المحددين ({selectedStudentIds.size})</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
