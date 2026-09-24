"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  MailOpen,
  Phone,
  Calendar,
  CheckCircle2,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { contactApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { ContactMessageItem } from "@/types";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState<ContactMessageItem | null>(null);

  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const data = await contactApi.listForAdmin(statusFilter || undefined);
      setMessages(data);
    } catch {
      showToast("تعذّر تحميل رسائل التواصل", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function handleMarkRead(msg: ContactMessageItem) {
    try {
      await contactApi.markRead(msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
      );
      if (activeMessage?.id === msg.id) {
        setActiveMessage({ ...activeMessage, status: "read" });
      }
      showToast("تم تعليم الرسالة كمقروءة", "success");
    } catch {
      showToast("تعذّر التحديث", "error");
    }
  }

  async function handleDeleteMessage(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await contactApi.remove(id);
      showToast("تم حذف الرسالة بنجاح", "success");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (activeMessage?.id === id) setActiveMessage(null);
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">رسائل التواصل والاستفسارات</h1>
          <p className="text-ink-mute text-sm mt-1">
            متابعة الرسائل الواردة من نموذج &quot;تواصل معنا&quot; وطلبات التسجيل المبدئية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-ink-mute" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field field-select text-sm py-2"
          >
            <option value="">جميع الرسائل</option>
            <option value="unread">غير المقروءة فقط</option>
            <option value="read">المقروءة فقط</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : messages.length === 0 ? (
        <div className="card !rounded-2xl p-12 text-center text-ink-mute">
          <Mail size={40} className="mx-auto text-ink-mute/50 mb-3" />
          <p className="font-bold text-lg">لا توجد رسائل واردة حاليًا</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => {
                setActiveMessage(msg);
                if (msg.status === "unread") {
                  handleMarkRead(msg);
                }
              }}
              className={`card !rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${
                msg.status === "unread" ? "ring-2 ring-brand/40 bg-brand-soft/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-extrabold text-base text-ink line-clamp-1">{msg.name}</span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    msg.status === "unread"
                      ? "bg-danger-soft text-danger-ink"
                      : "bg-bg-alt text-ink-mute"
                  }`}
                >
                  {msg.status === "unread" ? <Mail size={12} /> : <MailOpen size={12} />}
                  {msg.status === "unread" ? "جديدة" : "مقروءة"}
                </span>
              </div>

              <p className="text-xs text-brand-ink font-mono mb-1">{msg.email}</p>
              {msg.phone && (
                <p className="text-xs text-ink-mute flex items-center gap-1 mb-3">
                  <Phone size={12} /> {msg.phone}
                </p>
              )}

              <p className="text-xs text-ink-soft line-clamp-3 leading-relaxed border-t border-line pt-2">
                {msg.message}
              </p>

              <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-ink-mute">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(msg.created_at).toLocaleDateString("ar-EG")}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(msg.id);
                  }}
                  className="p-1 rounded text-ink-mute hover:text-danger-ink"
                  title="حذف الرسالة"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: تفاصيل الرسالة الكاملة */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full sh-float border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-ink">{activeMessage.name}</h3>
                <p className="text-xs text-brand-ink font-mono mt-0.5">{activeMessage.email}</p>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="p-2 text-ink-mute hover:text-ink rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {activeMessage.phone && (
                <div className="flex items-center gap-2 text-xs font-bold text-ink-soft bg-bg-alt p-3 rounded-xl">
                  <Phone size={14} className="text-brand-ink" />
                  <span>رقم الهاتف: {activeMessage.phone}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-ink-mute block mb-1">نص الرسالة:</label>
                <div className="bg-bg-alt/70 p-4 rounded-2xl text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {activeMessage.message}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line text-xs text-ink-mute">
                <span>تاريخ الإرسال: {new Date(activeMessage.created_at).toLocaleString("ar-EG")}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMessage(activeMessage.id)}
                    className="text-xs text-danger-ink hover:bg-danger-soft"
                  >
                    حذف
                  </Button>
                  <Button size="sm" onClick={() => setActiveMessage(null)} className="text-xs">
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
