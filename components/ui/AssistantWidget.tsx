"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { assistantApi } from "@/lib/resources";
import { ApiError } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const WELCOME: ChatMessage = {
  role: "assistant",
  text: "أهلاً بيك! أنا المساعد الذكي للموقع، اسألني عن أي حاجة عايز توصلها أو تعملها وهوجهك خطوة بخطوة.",
};

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user" as const, text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await assistantApi.ask({
        message: text,
        history: nextMessages.slice(-8),
        role: (user?.role as any) || "guest",
        currentPath: pathname,
      });

      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);

      if (res.navigateTo) {
        // مهلة بسيطة عشان المستخدم يقرأ الرد الأول قبل ما ينتقل
        setTimeout(() => {
          router.push(res.navigateTo as string);
        }, 700);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "معلش، حصلت مشكلة في الاتصال بالمساعد. جرّب تاني بعد شوية.";
      setMessages((m) => [...m, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* الزرار العائم */}
      <m.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "إغلاق المساعد الذكي" : "فتح المساعد الذكي"}
        className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center sh-float hover:sh-brand transition-shadow"
        style={{ boxShadow: "0 10px 30px -8px color-mix(in oklab, var(--brand) 55%, transparent)" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <m.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </m.span>
          ) : (
            <m.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={24} />
            </m.span>
          )}
        </AnimatePresence>
      </m.button>

      {/* نافذة المحادثة */}
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-5 z-40 w-[92vw] max-w-sm h-[70vh] max-h-[540px] bg-surface border border-line rounded-3xl sh-float flex flex-col overflow-hidden"
          >
            {/* الهيدر */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-brand-soft/50">
              <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-ink text-sm">المساعد الذكي</div>
                <div className="text-[11px] text-ink-mute">هنا لمساعدتك في التنقل بالموقع</div>
              </div>
            </div>

            {/* الرسائل */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-bg-alt text-ink rounded-bl-sm"
                        : "bg-brand text-white rounded-br-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-brand text-white rounded-2xl rounded-br-sm px-4 py-2.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* صندوق الكتابة */}
            <form onSubmit={handleSend} className="p-2.5 border-t border-line flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                disabled={loading}
                className="flex-1 bg-bg-alt rounded-full px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="إرسال"
                className="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send size={16} className="-rotate-180" />
              </button>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
