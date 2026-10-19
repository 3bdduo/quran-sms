"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const SESSION_KEY = "qs_splash_done";

/**
 * شاشة ترحيب تظهر عند أوّل دخول للموقع في كل جلسة.
 * - تعتمد على sessionStorage — تظهر مرة واحدة لكل تبويب.
 * - تُخفى تلقائيًا بعد 2.2 ثانية ثم تُشال من الـ DOM.
 * - مبنية من CSS + inline styles خالصة — لا تعتمد على Framer Motion.
 */
export function SplashScreen() {
  const alreadyShown = useRef(
    typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1"
  );

  const [phase, setPhase] = useState<"visible" | "fading" | "gone">(
    alreadyShown.current ? "gone" : "visible"
  );

  useEffect(() => {
    if (alreadyShown.current) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    const fadeTimer = window.setTimeout(() => setPhase("fading"), 2200);
    const goneTimer = window.setTimeout(() => setPhase("gone"), 2800);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        background: "var(--deep, #22392a)",
        transition: "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "auto",
        overflow: "hidden",
      }}
    >
      {/* نجوم خلفية */}
      <Stars />

      {/* الشعار في دائرة متوهّجة */}
      <div style={{ position: "relative", width: 160, height: 160 }}>
        {/* حلقة خارجية */}
        <span
          style={{
            position: "absolute",
            inset: -24,
            borderRadius: "50%",
            border: "1px solid rgba(194,154,62,0.25)",
            animation: "qs-spin 14s linear infinite",
          }}
        />
        {/* حلقة داخلية معكوسة */}
        <span
          style={{
            position: "absolute",
            inset: -10,
            borderRadius: "50%",
            border: "1px dashed rgba(194,154,62,0.18)",
            animation: "qs-spin 22s linear infinite reverse",
          }}
        />
        {/* توهّج خلفي */}
        <span
          style={{
            position: "absolute",
            inset: -16,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(72,122,63,0.35) 0%, transparent 70%)",
            animation: "qs-pulse-soft 2.4s ease-in-out infinite",
          }}
        />
        {/* دائرة الشعار */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "var(--surface, #f7f9ef)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(72,122,63,0.3)",
            overflow: "hidden",
          }}
        >
          <Image
            src="/logo-mark.png"
            alt="مدرسة التربية بالقرآن الكريم"
            width={110}
            height={110}
            priority
            style={{
              width: "78%",
              height: "78%",
              objectFit: "contain",
              animation: "qs-breathe 2.4s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* النصوص */}
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          animation: "qs-rise 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-tajawal, 'Tajawal', sans-serif)",
            fontSize: "clamp(1.15rem, 3vw, 1.5rem)",
            fontWeight: 700,
            color: "var(--on-deep, #eef3e2)",
            letterSpacing: "0.01em",
            margin: 0,
          }}
        >
          مدرسة التربية بالقرآن الكريم
        </p>
        <p
          style={{
            fontFamily: "var(--font-ruqaa, 'Aref Ruqaa', serif)",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            color: "var(--gold, #c29a3e)",
            margin: 0,
            opacity: 0.9,
          }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </div>

      {/* شريط التقدم */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, var(--brand, #487a3f), var(--gold, #c29a3e))",
            animation: "splash-progress 2.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            transformOrigin: "left",
          }}
        />
      </div>
    </div>
  );
}

function Stars() {
  const dots = [
    { top: "10%", left: "7%", s: 4, delay: 0 },
    { top: "18%", left: "88%", s: 3, delay: 0.6 },
    { top: "72%", left: "4%", s: 3, delay: 1.1 },
    { top: "82%", left: "91%", s: 4, delay: 0.3 },
    { top: "45%", left: "2%", s: 2.5, delay: 0.9 },
    { top: "55%", left: "96%", s: 2.5, delay: 1.4 },
    { top: "6%", left: "52%", s: 2, delay: 0.5 },
    { top: "93%", left: "48%", s: 3, delay: 0.8 },
    { top: "35%", left: "93%", s: 2, delay: 1.6 },
    { top: "62%", left: "10%", s: 2, delay: 0.2 },
  ];
  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: d.top,
            left: d.left,
            width: d.s,
            height: d.s,
            borderRadius: "50%",
            background: "var(--gold, #c29a3e)",
            opacity: 0.5,
            animation: `qs-twinkle 3s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}
