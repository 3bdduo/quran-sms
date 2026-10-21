"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Award,
  Crown,
  Sparkles,
  Star,
  Medal,
  CheckCircle2,
  Printer,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SingleCompetitionResult } from "@/types";

interface Props {
  studentName: string;
  nationalId?: string;
  results: SingleCompetitionResult[];
  isOpen: boolean;
  onClose: () => void;
}

export function CompetitionCelebrationModal({
  studentName,
  nationalId,
  results,
  isOpen,
  onClose,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (results.length > 0) {
      setSelectedIndex(0);
    }
  }, [results]);

  if (!isOpen || !results || results.length === 0) return null;

  const current = results[selectedIndex] || results[0];
  const level = current.celebrationLevel;

  // إعدادات المظهر حسب المستوى
  const configs = {
    gold: {
      badgeText: "الوسام الذهبي الملكي",
      gradient: "from-amber-500/20 via-yellow-400/15 to-amber-600/20",
      border: "border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.35)]",
      glowColor: "text-yellow-500",
      bgGlow: "bg-yellow-500/10",
      accent: "text-amber-600 dark:text-amber-400",
      tagBg: "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black",
      icon: Crown,
      confettiCount: 30,
    },
    silver: {
      badgeText: "وسام التفوق والامتياز الفضي",
      gradient: "from-slate-300/20 via-sky-300/15 to-slate-400/20",
      border: "border-slate-300/60 shadow-[0_0_40px_rgba(148,163,184,0.35)]",
      glowColor: "text-slate-200",
      bgGlow: "bg-slate-400/10",
      accent: "text-sky-600 dark:text-sky-300",
      tagBg: "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 font-black",
      icon: Trophy,
      confettiCount: 22,
    },
    bronze: {
      badgeText: "وسام الجدارة البرونزي",
      gradient: "from-amber-700/20 via-amber-600/15 to-orange-700/20",
      border: "border-amber-700/50 shadow-[0_0_35px_rgba(180,83,9,0.3)]",
      glowColor: "text-amber-600",
      bgGlow: "bg-amber-600/10",
      accent: "text-amber-700 dark:text-amber-500",
      tagBg: "bg-gradient-to-r from-amber-600 to-orange-500 text-white font-black",
      icon: Medal,
      confettiCount: 16,
    },
    pass: {
      badgeText: "وسام الاجتهاد والنجاح",
      gradient: "from-emerald-500/15 via-teal-500/10 to-green-600/15",
      border: "border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.25)]",
      glowColor: "text-emerald-500",
      bgGlow: "bg-emerald-500/10",
      accent: "text-emerald-600 dark:text-emerald-400",
      tagBg: "bg-emerald-600 text-white font-black",
      icon: Award,
      confettiCount: 12,
    },
    good: {
      badgeText: "وسام الهمة والمشاركة المباركة",
      gradient: "from-indigo-500/15 via-blue-500/10 to-indigo-600/15",
      border: "border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.2)]",
      glowColor: "text-indigo-400",
      bgGlow: "bg-indigo-500/10",
      accent: "text-indigo-600 dark:text-indigo-400",
      tagBg: "bg-indigo-600 text-white font-black",
      icon: BookOpen,
      confettiCount: 8,
    },
  }[level || "pass"];

  const MainIcon = configs.icon;

  function handlePrintCertificate() {
    window.print();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Floating Confetti / Sparkles Animation */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10 print:hidden">
          {Array.from({ length: configs.confettiCount }).map((_, i) => (
            <m.div
              key={i}
              initial={{
                y: -30,
                x: `${(i * 100) / configs.confettiCount + (Math.random() * 6 - 3)}%`,
                rotate: 0,
                scale: Math.random() * 0.7 + 0.6,
                opacity: 1,
              }}
              animate={{
                y: ["0vh", "105vh"],
                rotate: [0, 360 * (i % 2 === 0 ? 2 : -2)],
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: 3 + (i % 4) * 0.8,
                repeat: Infinity,
                delay: (i * 0.15) % 2.5,
                ease: "linear",
              }}
              className="absolute text-xl select-none"
            >
              {i % 5 === 0 ? "✨" : i % 5 === 1 ? "🎉" : i % 5 === 2 ? "⭐" : i % 5 === 3 ? "🏆" : "🎊"}
            </m.div>
          ))}
        </div>

        {/* Modal Card */}
        <m.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={`relative z-20 w-full max-w-2xl bg-card rounded-[2.5rem] border ${configs.border} p-6 sm:p-9 overflow-hidden shadow-2xl text-center`}
        >
          {/* Subtle Glow Background */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 bg-gradient-to-b ${configs.gradient} opacity-80 pointer-events-none`}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-full bg-bg-alt/80 hover:bg-bg-alt text-ink-mute hover:text-ink transition-colors z-30 print:hidden"
            title="إغلاق"
          >
            <X size={20} />
          </button>

          {/* Multiple Results Switcher */}
          {results.length > 1 && (
            <div className="relative z-30 flex items-center justify-center gap-2 mb-4 flex-wrap print:hidden">
              <span className="text-xs font-bold text-ink-mute ml-1">نتائجك ({results.length}):</span>
              {results.map((r, idx) => (
                <button
                  key={r.competitionId}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    idx === selectedIndex
                      ? `${configs.tagBg} shadow-md scale-105`
                      : "bg-bg-alt text-ink-soft hover:bg-line"
                  }`}
                >
                  {r.competitionName}
                </button>
              ))}
            </div>
          )}

          {/* Type Badge & Year */}
          <div className="relative z-20 flex items-center justify-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold ${configs.tagBg}`}
            >
              <Sparkles size={14} />
              <span>{configs.badgeText}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-bg-alt text-xs font-bold text-ink-soft">
              {current.competitionType === "external" ? "مسابقة خارج المدرسة 🌐" : "اختبار داخل المدرسة 🏫"}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-bg-alt text-xs font-semibold text-ink-mute">
              {current.year}
            </span>
          </div>

          {/* Trophy / Icon Centerpiece with Animated Pulse */}
          <div className="relative z-20 my-4 flex justify-center">
            <div className="relative">
              <m.div
                animate={{ scale: [1, 1.12, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl ${configs.bgGlow} flex items-center justify-center relative shadow-inner border border-line`}
              >
                <MainIcon size={56} className={`${configs.glowColor} drop-shadow-md`} />
              </m.div>

              {/* Rank Badge if in top 3 */}
              {current.rank <= 3 && (
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-lg border border-amber-300"
                >
                  المركز {current.rank === 1 ? "الأول 🥇" : current.rank === 2 ? "الثاني 🥈" : "الثالث 🥉"}
                </m.div>
              )}
            </div>
          </div>

          {/* Student Name */}
          <div className="relative z-20 mb-2">
            <p className="text-xs sm:text-sm font-bold text-ink-mute tracking-wide">تهانينا الحارة للطالب المتميز</p>
            <h2 className="text-2xl sm:text-3xl font-black text-ink mt-0.5 font-ruqaa leading-normal">
              {studentName}
            </h2>
            <p className="text-sm font-bold text-ink-soft mt-1">
              في {current.competitionType === "external" ? "مسابقة" : "اختبار"}:{" "}
              <span className={configs.accent}>{current.competitionName}</span>
            </p>
          </div>

          {/* Ayah or Inspirational Quote */}
          {current.ayah && (
            <div className="relative z-20 my-4 py-2.5 px-4 rounded-2xl bg-bg-alt/70 border border-line inline-block max-w-lg mx-auto">
              <p className="text-sm sm:text-base font-amiri font-bold text-ink-soft leading-relaxed">
                ﴿ {current.ayah} ﴾
              </p>
            </div>
          )}

          {/* Score Box */}
          <div className="relative z-20 grid grid-cols-3 gap-3 max-w-md mx-auto my-4 p-3 rounded-2xl bg-bg-alt/80 border border-line">
            <div className="text-center">
              <p className="text-[11px] font-bold text-ink-mute">الدرجة</p>
              <p className="text-xl sm:text-2xl font-black text-ink mt-0.5">
                {current.score} <span className="text-xs text-ink-mute">/ {current.maxScore}</span>
              </p>
            </div>
            <div className="text-center border-x border-line">
              <p className="text-[11px] font-bold text-ink-mute">النسبة المئوية</p>
              <p className={`text-xl sm:text-2xl font-black mt-0.5 ${configs.accent}`}>
                {current.percentage}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-ink-mute">الترتيب</p>
              <p className="text-xl sm:text-2xl font-black text-ink mt-0.5">
                #{current.rank}
              </p>
            </div>
          </div>

          {/* Tailored Congratulations Message */}
          <p className="relative z-20 text-xs sm:text-sm text-ink-soft max-w-lg mx-auto leading-relaxed my-3 font-medium">
            {current.message}
          </p>

          {current.notes && (
            <div className="relative z-20 text-xs text-ink-mute bg-bg/60 p-2.5 rounded-xl border border-line max-w-md mx-auto my-2">
              <span className="font-bold ml-1 text-ink-soft">ملاحظة المعلم/المحكم:</span> {current.notes}
            </div>
          )}

          {/* Action Buttons */}
          <div className="relative z-20 flex items-center justify-center gap-3 mt-6 flex-wrap print:hidden">
            <Button
              variant="outline"
              onClick={handlePrintCertificate}
              className="flex items-center gap-2 !rounded-2xl"
            >
              <Printer size={16} />
              <span>طباعة شهادة التقدير</span>
            </Button>

            <Button
              onClick={onClose}
              className="flex items-center gap-2 !rounded-2xl bg-brand text-on-brand"
            >
              <CheckCircle2 size={16} />
              <span>شكراً، بارك الله فيكم</span>
            </Button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
