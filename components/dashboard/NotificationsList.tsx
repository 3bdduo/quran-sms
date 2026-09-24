"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellRing } from "lucide-react";
import { notificationsApi } from "@/lib/resources";
import type { NotificationItem } from "@/types";
import { Loader } from "@/components/ui/Loader";
import { Reveal } from "@/components/ui/Reveal";

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

  if (loading) return <Loader size="sm" label="جاري تحميل الإشعارات" className="py-10" />;

  return (
    <Reveal delay={0.1}>
      <div className="card p-5 sm:p-6 !rounded-2xl">
        <h3 className="font-extrabold text-ink mb-4 flex items-center gap-2">
          <Bell size={18} className="text-brand-ink" />
          الإشعارات
        </h3>

        {items.length === 0 ? (
          <p className="text-sm text-ink-mute py-6 text-center">لا توجد إشعارات حاليًا</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto pe-1">
            {items.map((n, i) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all duration-300 active:scale-[0.99] ${
                  n.isRead
                    ? "bg-bg-alt/70"
                    : "bg-brand-soft hover:brightness-95 border border-brand/25"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <BellRing size={15} className="text-brand-ink mt-0.5 shrink-0 animate-wave" />}
                  <div>
                    <p className="text-sm font-bold text-ink">{n.title}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{n.body}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </Reveal>
  );
}
