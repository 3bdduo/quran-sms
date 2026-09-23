"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { notificationsApi } from "@/lib/resources";
import type { NotificationItem } from "@/types";
import { Loader } from "@/components/ui/Loader";

export function NotificationsList() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi
      .mine()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await notificationsApi.markRead(id).catch(() => undefined);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  if (loading) return <Loader />;

  return (
    <div className="bg-white rounded-2xl border border-emerald-900/5 p-6">
      <h3 className="font-extrabold text-emerald-950 mb-4 flex items-center gap-2">
        <Bell size={18} className="text-emerald-600" />
        الإشعارات
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-emerald-900/40 py-6 text-center">لا توجد إشعارات حاليًا</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`p-3.5 rounded-xl cursor-pointer transition-colors ${
                n.isRead ? "bg-cream-50" : "bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.isRead && <BellRing size={15} className="text-emerald-600 mt-0.5 shrink-0" />}
                <div>
                  <p className="text-sm font-bold text-emerald-950">{n.title}</p>
                  <p className="text-xs text-emerald-900/60 mt-0.5">{n.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
