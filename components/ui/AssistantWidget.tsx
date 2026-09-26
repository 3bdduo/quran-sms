"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, X, Send, RotateCcw, ArrowLeft, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { assistantApi } from "@/lib/resources";
import { ApiError } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  navigateTo?: string | null;
  time?: string;
}

const WELCOME: ChatMessage = {
  role: "assistant",
  text: "أهلاً بك! أنا المساعد الذكي لمدرسة التربية بالقرآن الكريم. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن أي صفحة، منهج، أو طريقة استخدام للمنصة.",
};

const SUGGESTIONS = [
  "كيف أسجل كمعلم في المنصة؟",
  "ما هي المناهج والمسارات المتاحة؟",
  "كيفية التواصل مع إدارة المدرسة",
  "أين أجد متابعة الحفظ والواجبات؟",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // منع تمرير الصفحة الخلفية أثناء فتح الشات
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // إغلاق الشات بسلاسة مع إلغاء فوكس الإدخال لتجنب أي قفزة
  const handleClose = () => {
    inputRef.current?.blur();
    setOpen(false);
  };

  // تمرير تلقائي لأسفل المحادثة
  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading, open]);

  // التركيز على حقل الإدخال عند الفتح وإغلاق بزر Escape بدون قفز الشاشة
  useEffect(() => {
    if (open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") handleClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 300);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [open]);

  async function sendMessage(textToSend: string) {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      text,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await assistantApi.ask({
        message: text,
        history: nextMessages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        role: (user?.role as any) || "guest",
        currentPath: pathname,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: res.reply,
        navigateTo: res.navigateTo,
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (res.navigateTo) {
        setTimeout(() => {
          router.push(res.navigateTo as string);
        }, 1200);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "معذرةً، حدثت مشكلة في الاتصال بالمساعد. يُرجى المحاولة مرة أخرى بعد قليل.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: msg,
          time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    sendMessage(input);
  }

  function resetChat() {
    setMessages([WELCOME]);
    setInput("");
  }

  return (
    <>
      {/* الزر العائم لفتح الشات — يبقى في مكانه ويختفي بنعومة بدون إعادة إنشاء بالـ DOM */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="المساعد الذكي لموقع مدرسة التربية بالقرءان الكريم"
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        className={`fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-brand text-on-brand flex items-center justify-center sh-float hover:sh-brand transition-all duration-200 cursor-pointer group ${
          open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 pointer-events-auto scale-100"
        }`}
        style={{
          boxShadow: "0 10px 30px -8px color-mix(in oklab, var(--brand) 60%, transparent)",
        }}
      >
        <MessageCircle size={26} className="transition-transform group-hover:scale-110" />
      </button>

      {/* نافذة الشات بطول الصفحة بالكامل مع خلفية الإغلاق */}
      <AnimatePresence>
        {open && (
          <>
            {/* خلفية شبه شفافة تغطي الصفحة بالكامل — الضغط في أي مكان يغلق الشات بسلاسة وبدون لاج الـ blur */}
            <m.div
              key="chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={handleClose}
              aria-label="إغلاق الشات"
              className="fixed inset-0 z-50 bg-black/50 cursor-pointer"
            />

            {/* الدرج الكامل للشات بطول الصفحة بالكامل من الأعلى للأسفل */}
            <m.aside
              key="chat-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-full sm:w-[440px] md:w-[480px] max-w-full h-[100dvh] bg-surface border-r border-line shadow-2xl flex flex-col overflow-hidden text-ink will-change-transform"
            >
              {/* رأس المحادثة */}
              <div className="flex items-center justify-between px-3.5 sm:px-4 py-3.5 border-b border-line bg-surface-2/80 backdrop-blur-md gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* لوجو مدرسة التربية بالقرآن الكريم مع إطار ذهبي */}
                  <div className="w-11 h-11 rounded-full bg-[#f7f9ef] border-2 border-gold/70 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/logo-mark.png"
                      alt="شعار مدرسة التربية بالقرآن الكريم"
                      width={44}
                      height={44}
                      className="object-contain p-1"
                      priority
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-ink text-xs sm:text-[13px] leading-snug">
                      المساعد الذكي لموقع مدرسة التربية بالقرءان الكريم
                    </h2>
                  </div>
                </div>

                {/* أزرار الإجراءات في الهيدر */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={resetChat}
                    title="بدء محادثة جديدة"
                    aria-label="بدء محادثة جديدة"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors cursor-pointer"
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    title="إغلاق الشات (Esc)"
                    aria-label="إغلاق الشات"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* منطقة الرسائل */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* فقاعة الرسالة */}
                      <div
                        className={`max-w-[84%] rounded-2xl px-4 py-3 text-[14px] sm:text-[14.5px] leading-relaxed shadow-xs transition-colors ${
                          isUser
                            ? "bg-[#f2eee6] dark:bg-[#25201b] text-[#1a251c] dark:text-[#f5ede3] border border-[#dad2c3] dark:border-[#42372c] rounded-tr-sm"
                            : "bg-[#eef7ef] dark:bg-[#152e1c] text-[#0d2a14] dark:text-[#f2fbf4] border border-[#b8deb9] dark:border-[#2b5936] rounded-tl-sm"
                        }`}
                      >
                        {/* تمييز المصدر بنص صغير */}
                        <div className={`text-[10px] font-semibold mb-1 ${isUser ? "text-right text-[#7a6e60]" : "text-right text-emerald-700 dark:text-emerald-400"}`}>
                          {isUser ? "أنت" : "المساعد"}
                        </div>

                        <div className="whitespace-pre-wrap font-normal selection:bg-brand/30">
                          {msg.text}
                        </div>

                        {/* زر توجيه اختياري إذا كان الرد يحوي مسار صفحة */}
                        {msg.navigateTo && (
                          <button
                            type="button"
                            onClick={() => {
                              router.push(msg.navigateTo!);
                              handleClose();
                            }}
                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition-all shadow-xs"
                          >
                            <span>الانتقال للصفحة الآن</span>
                            <ArrowLeft size={13} />
                          </button>
                        )}

                        {/* التوقيت */}
                        {msg.time && (
                          <div
                            className={`text-[10px] mt-1 ${isUser ? "text-right text-ink-mute/70" : "text-right text-emerald-800/60 dark:text-emerald-300/60"}`}
                          >
                            {msg.time}
                          </div>
                        )}
                      </div>
                    </m.div>
                  );
                })}

                {/* مؤشر جاري الكتابة */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#eef7ef] dark:bg-[#152e1c] border border-[#b8deb9] dark:border-[#2b5936] rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
                      <div className="text-[10px] font-semibold mb-1 text-right text-emerald-700 dark:text-emerald-400">المساعد</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#0d2a14] dark:text-[#f2fbf4] font-medium ml-1">
                          يكتب الآن
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                {/* اقتراحات سريعة عند بدء المحادثة فقط */}
                {messages.length === 1 && !loading && (
                  <div className="pt-2">
                    <div className="text-[12px] font-semibold text-ink-mute mb-2.5">
                      أسئلة شائعة يمكنك تجربتها:
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {SUGGESTIONS.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => sendMessage(suggestion)}
                          className="text-right px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-surface-2 border border-line text-ink hover:border-brand/50 hover:bg-brand/10 transition-all cursor-pointer font-medium"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* شريط الإدخال في الأسفل */}
              <div className="p-3 border-t border-line bg-surface-2/90 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اكتب سؤالك هنا واضغط إرسال..."
                    disabled={loading}
                    className="flex-1 bg-bg border border-line rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink-mute outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="إرسال السؤال"
                    className="w-11 h-11 shrink-0 rounded-2xl bg-brand text-on-brand flex items-center justify-center disabled:opacity-40 hover:bg-brand-strong transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Send size={18} className="-rotate-180" />
                  </button>
                </form>
                <div className="text-[11px] text-ink-mute text-center mt-2">
                  اضغط في أي مكان خارج النافذة لإغلاقها
                </div>
              </div>
            </m.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

