"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, X, Send, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react";
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
  // isMobile: true = bottom-sheet (mobile), false = side drawer (desktop)
  const [isMobile, setIsMobile] = useState(true);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // تحديث isMobile عند تغيير حجم الشاشة
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsMobile(!mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(!e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // تتبع visualViewport في الموبايل لضبط الارتفاع مع الكيبورد تماماً مثل واتساب
  useEffect(() => {
    if (!open) return;

    const updateViewport = () => {
      const vv = window.visualViewport;
      if (vv) {
        setViewportHeight(vv.height);
        setViewportOffsetTop(vv.offsetTop);
        // لو الارتفاع أقل من ارتفاع الشاشة بأكثر من 120px يبقى الكيبورد مفتوحة
        const keyboardActive = window.innerHeight - vv.height > 120;
        setIsKeyboardOpen(keyboardActive);
      } else {
        setViewportHeight(window.innerHeight);
        setViewportOffsetTop(0);
        setIsKeyboardOpen(false);
      }
    };

    updateViewport();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateViewport);
      vv.addEventListener("scroll", updateViewport);
    }
    window.addEventListener("resize", updateViewport);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateViewport);
        vv.removeEventListener("scroll", updateViewport);
      }
      window.removeEventListener("resize", updateViewport);
    };
  }, [open]);

  // منع تمرير الصفحة بالخلفية بدون كسر الفيو-بورت
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleClose = () => {
    inputRef.current?.blur();
    setOpen(false);
  };

  // تمرير تلقائي لأسفل عند وصول رسائل جديدة أو فتح الكيبورد
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [messages, loading, open, viewportHeight]);

  // Escape key + focus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
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
        setTimeout(() => { router.push(res.navigateTo as string); }, 1200);
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
      {/* زر الفتح العائم */}
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

      {/* نافذة الشات */}
      <AnimatePresence>
        {open && (
          <>
            {/* خلفية إغلاق */}
            <m.div
              key="chat-backdrop"
              data-motion-el
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={handleClose}
              aria-label="إغلاق الشات"
              className="fixed inset-0 z-50 bg-black/50 cursor-pointer"
            />

            {/*
              موبايل  : bottom-sheet يصعد من الأسفل (زي واتساب تماماً)
              sm+     : drawer من الجانب الأيسر
            */}
            <m.aside
              key="chat-drawer"
              initial={isMobile ? { y: "100%" } : { x: "-100%" }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: "100%" } : { x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              style={
                isMobile && viewportHeight
                  ? {
                      height: `${viewportHeight}px`,
                      maxHeight: `${viewportHeight}px`,
                      top: viewportOffsetTop > 0 ? `${viewportOffsetTop}px` : "auto",
                      bottom: 0,
                    }
                  : undefined
              }
              className="fixed inset-x-0 bottom-0 z-50 h-[100dvh] overflow-hidden flex flex-col bg-surface text-ink will-change-transform sm:inset-y-0 sm:left-0 sm:bottom-auto sm:rounded-none sm:w-[440px] md:w-[480px] sm:max-w-full sm:border-r sm:border-line sm:shadow-2xl"
            >
              {/* رأس المحادثة - واتساب style */}
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 shrink-0"
                style={{
                  background: "var(--deep)",
                  paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
                }}
              >
                {/* زر الرجوع في الموبايل زي واتساب */}
                {isMobile && (
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="رجوع"
                    className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-on-deep-soft hover:text-on-deep hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  >
                    <ArrowRight size={20} />
                  </button>
                )}

                <div className="w-10 h-10 rounded-full bg-[#f7f9ef] border-2 border-gold/70 shrink-0 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo-mark.png"
                    alt="شعار مدرسة التربية بالقرآن الكريم"
                    width={40}
                    height={40}
                    className="object-contain p-0.5"
                    priority
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-deep text-sm leading-tight">
                    المساعد الذكي
                  </p>
                  <p className="text-[11px] text-on-deep-soft leading-tight mt-0.5">
                    مدرسة التربية بالقرآن الكريم
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={resetChat}
                    title="بدء محادثة جديدة"
                    aria-label="بدء محادثة جديدة"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-on-deep-soft hover:text-on-deep hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    title="إغلاق الشات (Esc)"
                    aria-label="إغلاق الشات"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-on-deep-soft hover:text-on-deep hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* منطقة الرسائل - خلفية هادئة ولون واحد مريح للعين */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 flex flex-col gap-1.5"
                style={{
                  background: "var(--bg)",
                }}
              >
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.18 }}
                      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-0.5`}
                    >
                      <div
                        className="max-w-[78%] sm:max-w-[82%]"
                        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.10))" }}
                      >
                        <div
                          className={`px-3.5 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap ${
                            isUser ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
                          }`}
                          style={
                            isUser
                              ? {
                                  background: "var(--brand-soft)",
                                  border: "1px solid color-mix(in oklab, var(--brand) 30%, var(--line))",
                                  color: "var(--brand-ink)",
                                }
                              : {
                                  background: "var(--surface)",
                                  border: "1px solid var(--line)",
                                  color: "var(--ink)",
                                }
                          }
                        >
                          {msg.text}

                          {msg.navigateTo && (
                            <button
                              type="button"
                              onClick={() => {
                                router.push(msg.navigateTo!);
                                handleClose();
                              }}
                              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition-all shadow-xs cursor-pointer"
                            >
                              <span>الانتقال للصفحة الآن</span>
                              <ArrowLeft size={12} />
                            </button>
                          )}

                          {msg.time && (
                            <div
                              className={`text-[10px] mt-1 select-none ${
                                isUser ? "text-right" : "text-left"
                              }`}
                              style={{ opacity: 0.55 }}
                            >
                              {msg.time}
                            </div>
                          )}
                        </div>
                      </div>
                    </m.div>
                  );
                })}

                {/* مؤشر الكتابة */}
                {loading && (
                  <div className="flex justify-start mt-1">
                    <div
                      className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tl-sm text-[14px]"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.10))",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-ink-mute font-medium ml-1">يكتب</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                {/* اقتراحات سريعة */}
                {messages.length === 1 && !loading && (
                  <div className="pt-3">
                    <div className="text-[11px] font-semibold text-ink-mute mb-2 text-center">
                      أسئلة يمكنك تجربتها
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {SUGGESTIONS.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => sendMessage(suggestion)}
                          className="text-right px-3.5 py-2.5 rounded-xl text-sm cursor-pointer font-medium active:scale-[0.98] transition-transform"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--line)",
                            color: "var(--ink)",
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* شريط الإدخال - واتساب style */}
              <div
                className="shrink-0 px-3 py-2 border-t border-line"
                style={{
                  background: "var(--surface-2)",
                  paddingBottom: isKeyboardOpen
                    ? "8px"
                    : "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
                }}
              >
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اكتب رسالة..."
                    disabled={loading}
                    autoComplete="off"
                    enterKeyHint="send"
                    className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none disabled:opacity-60"
                    style={{
                      background: "var(--bg)",
                      border: "1.5px solid var(--line-strong)",
                      color: "var(--ink)",
                      minHeight: "44px",
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        if (scrollRef.current) {
                          scrollRef.current.scrollTo({
                            top: scrollRef.current.scrollHeight,
                            behavior: "smooth",
                          });
                        }
                      }, 100);
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="إرسال السؤال"
                    className="w-11 h-11 shrink-0 rounded-full bg-brand text-on-brand flex items-center justify-center disabled:opacity-40 hover:bg-brand-strong active:scale-90 transition-all cursor-pointer shadow-sm"
                  >
                    <Send size={18} className="-rotate-180" />
                  </button>
                </form>
              </div>
            </m.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
