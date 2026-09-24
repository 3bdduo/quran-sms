"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Activity,
  Plus,
  Trash2,
  Send,
  Users,
  Calendar,
  Filter,
  Eye,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { notificationsApi, activityLogApi, groupsApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { NotificationItem, ActivityLogItem, GroupItem } from "@/types";

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<"notifications" | "logs">("notifications");

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [notifForm, setNotifForm] = useState({
    title: "",
    body: "",
    target: "all",
  });
  const [sendingNotif, setSendingNotif] = useState(false);

  // Activity Logs State
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      if (tab === "notifications") {
        const [notifs, grps] = await Promise.all([
          notificationsApi.adminAll(),
          groupsApi.list(),
        ]);
        setNotifications(notifs);
        setGroups(grps);
      } else {
        const res = await activityLogApi.list({
          role: roleFilter || undefined,
          username: usernameFilter || undefined,
          page: logPage,
          limit: 30,
        });
        setLogs(res.data);
        setLogTotal(res.total);
      }
    } catch {
      showToast("تعذّر تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tab, logPage, roleFilter, usernameFilter]);

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    setSendingNotif(true);
    try {
      await notificationsApi.create(notifForm);
      showToast("تم إرسال الإشعار بنجاح", "success");
      setShowSendModal(false);
      setNotifForm({ title: "", body: "", target: "all" });
      loadData();
    } catch {
      showToast("تعذّر إرسال الإشعار", "error");
    } finally {
      setSendingNotif(false);
    }
  }

  async function handleDeleteNotification(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;
    try {
      await notificationsApi.remove(id);
      showToast("تم حذف الإشعار", "success");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">الإشعارات وسجل النشاط</h1>
          <p className="text-ink-mute text-sm mt-1">
            إرسال التنبيهات الموجهة ومتابعة سجل العمليات في النظام
          </p>
        </div>

        {tab === "notifications" && (
          <Button onClick={() => setShowSendModal(true)} className="flex items-center gap-2">
            <Plus size={17} />
            <span>إرسال إشعار جديد</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab("notifications")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "notifications"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Bell size={18} />
          <span>مركز الإشعارات ({notifications.length})</span>
        </button>

        <button
          onClick={() => setTab("logs")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "logs"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Activity size={18} />
          <span>سجل حركات النظام ({logTotal})</span>
        </button>
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : tab === "notifications" ? (
        /* قائمة الإشعارات */
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <Bell size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لا توجد إشعارات مسجلة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="card !rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold bg-brand-soft text-brand-ink px-2.5 py-0.5 rounded-full">
                        {n.target === "all"
                          ? "الجميع"
                          : n.target === "teachers"
                          ? "كل المعلمين"
                          : `فئة: ${n.target}`}
                      </span>
                      <span className="text-xs text-ink-mute flex items-center gap-1 font-mono">
                        <Eye size={12} /> قُرئ {n.read_by_count ?? 0}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-ink mt-2">{n.title}</h3>
                    <p className="text-xs text-ink-soft leading-relaxed mt-2 whitespace-pre-wrap">
                      {n.body}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-ink-mute">
                    <span>{new Date(n.created_at).toLocaleDateString("ar-EG")}</span>
                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      className="p-1 rounded text-ink-mute hover:text-danger-ink"
                      title="حذف الإشعار"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* سجل النشاطات */
        <div className="space-y-4">
          <div className="card !rounded-2xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-ink-mute" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setLogPage(1);
                }}
                className="field field-select text-xs py-2"
              >
                <option value="">جميع الصلاحيات</option>
                <option value="admin">الإدارة</option>
                <option value="teacher">المعلمين</option>
              </select>
            </div>

            <div>
              <input
                type="text"
                placeholder="تصفية باسم المستخدم..."
                value={usernameFilter}
                onChange={(e) => {
                  setUsernameFilter(e.target.value);
                  setLogPage(1);
                }}
                className="field text-xs py-2 font-mono"
              />
            </div>
          </div>

          {!logs.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <Activity size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لا توجد سجلات نشاط مطابقة</p>
            </div>
          ) : (
            <div className="card !rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute text-xs">
                      <th className="p-3 font-bold">الوقت والتاريخ</th>
                      <th className="p-3 font-bold">المستخدم</th>
                      <th className="p-3 font-bold">الصفة</th>
                      <th className="p-3 font-bold">الإجراء المنفذ</th>
                      <th className="p-3 font-bold">المسار (API Endpoint)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-line last:border-0 hover:bg-bg-alt/30 transition-colors"
                      >
                        <td className="p-3 text-xs text-ink-mute font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("ar-EG")}
                        </td>
                        <td className="p-3 font-bold text-ink whitespace-nowrap">
                          {log.actor_username}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              log.actor_role === "admin"
                                ? "bg-gold-soft text-gold-ink"
                                : "bg-brand-soft text-brand-ink"
                            }`}
                          >
                            {log.actor_role === "admin" ? (
                              <ShieldCheck size={11} />
                            ) : (
                              <UserRound size={11} />
                            )}
                            {log.actor_role === "admin" ? "إدارة" : "معلم"}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-semibold text-ink whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-ink-soft whitespace-nowrap">
                          <span className="bg-bg-alt px-2 py-0.5 rounded">
                            {log.method || "GET"} {log.path || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logTotal > 30 && (
                <div className="p-4 border-t border-line flex items-center justify-between text-xs font-bold text-ink-mute">
                  <span>إجمالي السجلات: {logTotal}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                      disabled={logPage === 1}
                      className="text-xs"
                    >
                      السابق
                    </Button>
                    <span>صفحة {logPage}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLogPage((p) => p + 1)}
                      disabled={logPage * 30 >= logTotal}
                      className="text-xs"
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: إرسال إشعار */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full sh-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-4">إرسال إشعار تنبيهي</h3>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="field-label">عنوان الإشعار *</label>
                <input
                  required
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  className="field"
                  placeholder="مثال: موعد اختبار نهاية الفصل"
                />
              </div>

              <div>
                <label className="field-label">الفئة المستهدفة *</label>
                <select
                  value={notifForm.target}
                  onChange={(e) => setNotifForm({ ...notifForm, target: e.target.value })}
                  className="field field-select text-sm"
                >
                  <option value="all">الجميع (كل المعلمين والطلاب)</option>
                  <option value="teachers">المعلمين فقط</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      طلاب حلقة: {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">نص الإشعار *</label>
                <textarea
                  required
                  rows={4}
                  value={notifForm.body}
                  onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
                  className="field resize-none leading-relaxed"
                  placeholder="اكتب رسالة الإشعار هنا..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowSendModal(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" loading={sendingNotif} className="flex items-center gap-1.5">
                  <Send size={15} />
                  <span>إرسال الإشعار</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
