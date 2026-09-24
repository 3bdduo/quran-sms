"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  FileSpreadsheet,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { attendanceApi, eduAttendanceApi, groupsApi, eduGroupsApi } from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { GroupItem, EduGroupItem, AttendanceGroupRecord } from "@/types";

export default function AdminAttendancePage() {
  const [tab, setTab] = useState<"regular" | "edu">("regular");
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  // Groups
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [eduGroups, setEduGroups] = useState<EduGroupItem[]>([]);
  const [selectedEduGroupId, setSelectedEduGroupId] = useState("");

  // Records state
  const [records, setRecords] = useState<AttendanceGroupRecord[]>([]);
  const [eduGroupStudents, setEduGroupStudents] = useState<
    { student_id: string; student_name: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([groupsApi.list(), eduGroupsApi.list()]).then(([gList, egList]) => {
      setGroups(gList);
      if (gList.length) setSelectedGroupId(gList[0].id);
      setEduGroups(egList);
      if (egList.length) setSelectedEduGroupId(egList[0].id);
    });
  }, []);

  async function loadRegularAttendance() {
    if (!selectedGroupId || !selectedDate) return;
    setLoading(true);
    try {
      const data = await attendanceApi.byGroup(selectedGroupId, selectedDate);
      setRecords(data);
    } catch {
      showToast("تعذّر تحميل كشف الحضور", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadEduAttendance() {
    if (!selectedEduGroupId || !selectedDate) return;
    setLoading(true);
    try {
      const groupData = await eduGroupsApi.byId(selectedEduGroupId);
      const existingAttendance = await eduAttendanceApi.find(selectedEduGroupId, selectedDate);
      const statusMap = Object.fromEntries(existingAttendance.map((a) => [a.student_id, a.status]));

      const list = (groupData.students || []).map((st) => ({
        student_id: st.studentId,
        student_name: st.studentName || st.studentId,
        status: statusMap[st.studentId] || "غائب",
      }));
      setEduGroupStudents(list);
    } catch {
      showToast("تعذّر تحميل حضور المجموعة التعليمية", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "regular") {
      loadRegularAttendance();
    } else {
      loadEduAttendance();
    }
  }, [tab, selectedGroupId, selectedEduGroupId, selectedDate]);

  function handleStatusChange(studentId: string, status: string) {
    if (tab === "regular") {
      setRecords((prev) =>
        prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
      );
    } else {
      setEduGroupStudents((prev) =>
        prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
      );
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      if (tab === "regular") {
        const entries = records.map((r) => ({
          studentId: r.student_id,
          status: r.status,
        }));
        await attendanceApi.markBulk(selectedDate, entries);
        showToast("تم حفظ كشف الحضور بنجاح", "success");
      } else {
        const recordsToSave = eduGroupStudents.map((r) => ({
          studentId: r.student_id,
          status: r.status,
        }));
        await eduAttendanceApi.record(selectedEduGroupId, selectedDate, recordsToSave);
        showToast("تم حفظ حضور المجموعة التعليمية بنجاح", "success");
      }
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ الحضور", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportExcel() {
    if (!selectedGroupId || !selectedDate) return;
    setExporting(true);
    try {
      await downloadFile(
        `/exports/attendance/${selectedGroupId}.xlsx?date=${selectedDate}`,
        `كشف-حضور-${selectedDate}.xlsx`
      );
      showToast("تم تنزيل كشف الحضور بنجاح", "success");
    } catch {
      showToast("تعذّر تنزيل ملف الإكسل", "error");
    } finally {
      setExporting(false);
    }
  }

  const currentList = tab === "regular" ? records : eduGroupStudents;
  const presentCount = currentList.filter((r) => r.status === "حاضر").length;
  const absentCount = currentList.filter((r) => r.status === "غائب").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">التحضير والغياب</h1>
          <p className="text-ink-mute text-sm mt-1">
            تسجيل الحضور والغياب اليومي لحلقات القرآن والمجموعات التعليمية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === "regular" && (
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exporting || !records.length}
              className="flex items-center gap-2"
            >
              {exporting ? <Spinner size={16} /> : <FileSpreadsheet size={16} />}
              <span>تصدير إكسل</span>
            </Button>
          )}

          <Button onClick={handleSaveAll} loading={saving} className="flex items-center gap-2">
            {!saving && <Save size={16} />}
            <span>حفظ الكشف</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab("regular")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "regular"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <BookOpen size={18} />
          <span>حلقات القرآن الكريم</span>
        </button>

        <button
          onClick={() => setTab("edu")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "edu"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <GraduationCap size={18} />
          <span>المجموعات التعليمية</span>
        </button>
      </div>

      {/* Controls: التاريخ واختيار الحلقة */}
      <div className="card !rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-bold text-ink-mute block mb-1">التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="field text-sm py-2"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-mute block mb-1">
              {tab === "regular" ? "حلقة التحفيظ" : "المجموعة التعليمية"}
            </label>
            {tab === "regular" ? (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="field field-select text-sm py-2 min-w-48"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedEduGroupId}
                onChange={(e) => setSelectedEduGroupId(e.target.value)}
                className="field field-select text-sm py-2 min-w-48"
              >
                {eduGroups.map((eg) => (
                  <option key={eg.id} value={eg.id}>
                    {eg.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ملخص الحضور */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-brand-ink bg-brand-soft px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={15} /> حضور: {presentCount}
          </span>
          <span className="flex items-center gap-1.5 text-danger-ink bg-danger-soft px-3 py-1.5 rounded-xl">
            <XCircle size={15} /> غياب: {absentCount}
          </span>
          <span className="text-ink-mute">الإجمالي: {currentList.length}</span>
        </div>
      </div>

      {/* جدول الحضور والغياب */}
      {loading ? (
        <Loader size="lg" />
      ) : currentList.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <CalendarCheck size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لا يوجد طلاب في هذه المجموعة</p>
        </div>
      ) : (
        <div className="card !rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">اسم الطالب</th>
                  <th className="p-4 font-bold text-center">حالة الحضور</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((item, index) => (
                  <tr
                    key={item.student_id}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 text-xs text-ink-mute font-mono">{index + 1}</td>
                    <td className="p-4 font-bold text-ink">{item.student_name}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.student_id, "حاضر")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.status === "حاضر"
                              ? "bg-brand text-on-brand shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-brand-soft hover:text-brand-ink"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          <span>حاضر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.student_id, "غائب")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.status === "غائب"
                              ? "bg-danger-solid text-white shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-danger-soft hover:text-danger-ink"
                          }`}
                        >
                          <XCircle size={14} />
                          <span>غائب</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.student_id, "مستأذن")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.status === "مستأذن"
                              ? "bg-gold text-on-brand shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-gold-soft hover:text-gold-ink"
                          }`}
                        >
                          <Clock size={14} />
                          <span>مستأذن</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
