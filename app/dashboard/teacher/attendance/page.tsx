"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { attendanceApi, groupsApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { AttendanceGroupRecord } from "@/types";

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  
  const [records, setRecords] = useState<AttendanceGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  async function loadGroups() {
    try {
      const data = await groupsApi.mine();
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      } else if (data.length === 0) {
        setLoading(false);
      }
    } catch {
      showToast("تعذّر تحميل حلقاتك", "error");
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadData() {
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

  useEffect(() => {
    loadData();
  }, [selectedGroupId, selectedDate]);

  function handleStatusChange(studentId: string, status: string) {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  }

  async function handleSaveAttendance() {
    if (!records.length) return;
    setSaving(true);
    try {
      const entries = records.map((r) => ({
        studentId: r.student_id,
        status: r.status,
      }));
      await attendanceApi.markBulk(selectedDate, entries);
      showToast("تم حفظ كشف الحضور بنجاح", "success");
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ الحضور", "error");
    } finally {
      setSaving(false);
    }
  }

  const presentCount = records.filter((r) => r.status === "حاضر").length;
  const absentCount = records.filter((r) => r.status === "غائب").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">تسجيل الحضور اليومي</h1>
          <p className="text-ink-mute text-sm mt-1">
            تسجيل حضور وغياب طلاب حلقتك، مع إرسال تنبيهات تلقائية في حال تكرار الغياب
          </p>
        </div>

        <Button
          onClick={handleSaveAttendance}
          loading={saving}
          disabled={!records.length}
          className="flex items-center gap-2"
        >
          {!saving && <Save size={16} />}
          <span>حفظ كشف اليوم</span>
        </Button>
      </div>

      {/* شريط التحكم بالتاريخ والملخص */}
      <div className="card !rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {groups.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink-mute">الحلقة:</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="field text-sm py-1.5 min-w-[150px]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-ink-mute" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="field text-sm py-1.5 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-brand-ink bg-brand-soft px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={15} /> حضور: {presentCount}
          </span>
          <span className="flex items-center gap-1.5 text-danger-ink bg-danger-soft px-3 py-1.5 rounded-xl">
            <XCircle size={15} /> غياب: {absentCount}
          </span>
          <span className="text-ink-mute">إجمالي الحلقة: {records.length}</span>
        </div>
      </div>

      {/* جدول الحضور */}
      {loading ? (
        <Loader size="lg" />
      ) : records.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <CalendarCheck size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لا يوجد طلاب مسجلون في حلقتك</p>
        </div>
      ) : (
        <div className="card !rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">اسم الطالب</th>
                  <th className="p-4 font-bold text-center">حالة الحضور لتاريخ {selectedDate}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr
                    key={r.student_id}
                    className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="p-4 text-xs font-mono text-ink-mute">{idx + 1}</td>
                    <td className="p-4 font-bold text-ink whitespace-nowrap">{r.student_name}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.student_id, "حاضر")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            r.status === "حاضر"
                              ? "bg-brand text-on-brand shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-brand-soft hover:text-brand-ink"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          <span>حاضر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.student_id, "غائب")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            r.status === "غائب"
                              ? "bg-danger-solid text-white shadow-sm"
                              : "bg-bg-alt text-ink-mute hover:bg-danger-soft hover:text-danger-ink"
                          }`}
                        >
                          <XCircle size={14} />
                          <span>غائب</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.student_id, "مستأذن")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            r.status === "مستأذن"
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
