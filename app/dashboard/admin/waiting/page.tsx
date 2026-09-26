"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  UserCheck,
  Phone,
  Users,
  Search,
  ChevronDown,
  Loader2,
  Trash2,
  ArrowLeftRight,
  BookOpen,
} from "lucide-react";
import { studentsApi, groupsApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { Student, GroupItem } from "@/types";

export default function WaitingListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const [waitingList, groupList] = await Promise.all([
        studentsApi.listWaiting(),
        groupsApi.list(),
      ]);
      setStudents(waitingList);
      setGroups(groupList.filter((g) => g.id !== "waiting"));
    } catch {
      showToast("تعذّر تحميل قائمة الانتظار", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.national_id.includes(q) ||
      (s.phone && s.phone.includes(q))
    );
  });

  async function handleMove(student: Student) {
    const groupId = selectedGroup[student.id];
    if (!groupId) {
      showToast("اختر الحلقة أولاً", "error");
      return;
    }
    setMovingId(student.id);
    try {
      await studentsApi.moveFromWaiting(student.id, groupId);
      showToast(`تم نقل "${student.name}" للحلقة بنجاح`, "success");
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err: any) {
      showToast(err.message || "فشل النقل", "error");
    } finally {
      setMovingId(null);
    }
  }

  async function handleDelete(student: Student) {
    if (!window.confirm(`هل أنت متأكد من حذف طلب تسجيل "${student.name}" نهائيًا؟`)) return;
    setDeletingId(student.id);
    try {
      await studentsApi.remove(student.id);
      showToast("تم حذف الطلب بنجاح", "success");
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch {
      showToast("تعذّر حذف الطلب", "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h1 className="font-ruqaa font-bold text-2xl sm:text-3xl text-ink">
              قائمة الانتظار
            </h1>
          </div>
          <p className="text-ink-soft text-sm mr-13">
            طلبات التسجيل الواردة من الموقع — انقل كل طالب للحلقة المناسبة
          </p>
        </div>

        {/* عداد */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-2xl font-bold text-sm shrink-0">
          <Users size={16} />
          {students.length} طالب في الانتظار
        </div>
      </div>

      {/* Empty state */}
      {students.length === 0 && (
        <div className="card p-16 text-center rounded-[2rem]">
          <div className="h-16 w-16 rounded-full bg-brand-soft text-brand-ink flex items-center justify-center mx-auto mb-4">
            <UserCheck size={32} />
          </div>
          <h3 className="font-bold text-lg text-ink mb-1">قائمة الانتظار فارغة</h3>
          <p className="text-ink-soft text-sm">لا يوجد طلبات تسجيل جديدة حاليًا.</p>
        </div>
      )}

      {students.length > 0 && (
        <>
          {/* Search */}
          <div className="relative">
            <Search
              size={17}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="search"
              placeholder="بحث بالاسم أو الرقم القومي أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field pr-11 w-full max-w-md"
            />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((student) => {
              const groupId = selectedGroup[student.id] || "";
              const isMoving = movingId === student.id;
              const isDeleting = deletingId === student.id;
              const chosenGroup = groups.find((g) => g.id === groupId);

              return (
                <div
                  key={student.id}
                  className="card rounded-[1.5rem] p-5 flex flex-col gap-4 border border-line hover:border-brand/30 transition-all"
                >
                  {/* Student info */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-brand-soft text-brand-ink flex items-center justify-center shrink-0 font-bold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-ink text-base leading-snug truncate">
                        {student.name}
                      </h3>
                      <p className="text-ink-muted text-xs font-mono mt-0.5" dir="ltr">
                        {student.national_id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(student)}
                      disabled={isDeleting || isMoving}
                      className="icon-btn rounded-xl text-ink-muted hover:text-danger-solid hover:bg-danger-soft transition-colors"
                      title="حذف الطالب"
                    >
                      {isDeleting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm bg-surface-2/60 p-3.5 rounded-xl border border-line/60">
                    <div className="flex items-center gap-2 text-ink-soft">
                      <Phone size={14} className="text-brand shrink-0" />
                      <span className="font-medium text-ink">الهاتف:</span>
                      <span dir="ltr">{student.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-soft">
                      <BookOpen size={14} className="text-brand shrink-0" />
                      <span className="font-medium text-ink">عدد الأجزاء:</span>
                      <span>{student.memorized_amount || "0"}</span>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 text-ink-soft">
                      <BookOpen size={14} className="text-brand shrink-0" />
                      <span className="font-medium text-ink">السورة بالضبط:</span>
                      <span>{student.current_surah || "غير محدد"}</span>
                    </div>
                  </div>

                  {/* Move to group */}
                  <div className="border-t border-line pt-4 flex items-center gap-3">
                    {/* Custom dropdown */}
                    <div className="relative flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === student.id ? null : student.id
                          )
                        }
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                          groupId
                            ? "border-brand bg-brand-soft text-brand-ink"
                            : "border-line bg-surface text-ink-muted hover:border-brand/40"
                        }`}
                      >
                        <span className="truncate">
                          {chosenGroup ? chosenGroup.name : "اختر الحلقة..."}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`shrink-0 transition-transform ${
                            openDropdown === student.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {openDropdown === student.id && (
                        <div className="absolute top-full mt-1 right-0 left-0 z-50 bg-surface border border-line rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                          {groups.length === 0 ? (
                            <div className="p-4 text-center text-sm text-ink-muted">
                              لا توجد حلقات
                            </div>
                          ) : (
                            groups.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setSelectedGroup((prev) => ({
                                    ...prev,
                                    [student.id]: g.id,
                                  }));
                                  setOpenDropdown(null);
                                }}
                                className={`w-full text-right px-4 py-3 text-sm hover:bg-brand-soft transition-colors flex items-center justify-between gap-2 ${
                                  g.id === groupId
                                    ? "text-brand font-bold bg-brand-soft"
                                    : "text-ink"
                                }`}
                              >
                                <span>{g.name}</span>
                                {g.teacherName && (
                                  <span className="text-ink-muted text-xs shrink-0">
                                    {g.teacherName}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleMove(student)}
                      loading={isMoving}
                      disabled={!groupId || isMoving || isDeleting}
                      className="shrink-0 !py-2.5"
                      size="sm"
                    >
                      {!isMoving && <ArrowLeftRight size={15} />}
                      {isMoving ? "جاري النقل..." : "نقل للحلقة"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && searchQuery && (
            <div className="text-center py-12 text-ink-soft">
              لا توجد نتائج للبحث عن &quot;{searchQuery}&quot;
            </div>
          )}
        </>
      )}
    </div>
  );
}
