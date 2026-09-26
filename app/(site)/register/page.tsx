"use client";

import { useState, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  BookOpen,
  BookMarked,
  IdCard,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useToast } from "@/components/ui/Toast";
import { studentsApi } from "@/lib/resources";
import { ApiError } from "@/lib/api";
import { isEgyptianName, isPhone, normalizeDigits } from "@/lib/validation";
import { parseEgyptianNationalId } from "@/lib/egyptianNid";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    nationalId: "",
    phone: "",
    currentSurah: "",
    memorizedAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const nidAnalysis = parseEgyptianNationalId(form.nationalId);
  const nameParts = form.name.trim().split(/\s+/).filter(Boolean);
  const isNameValid = isEgyptianName(form.name);
  const isPhoneValid = isPhone(form.phone);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentStep]);

  const canGoNext = () => {
    if (currentStep === 1) return isNameValid;
    if (currentStep === 2) return nidAnalysis.valid;
    if (currentStep === 3) return isPhoneValid;
    if (currentStep === 4) return form.currentSurah.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    if (currentStep < totalSteps) {
      setCurrentStep((p) => p + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((p) => p - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canGoNext()) handleNext();
    }
  };

  async function handleSubmit() {
    setLoading(true);
    try {
      await studentsApi.publicRegister({
        name: form.name.trim(),
        nationalId: form.nationalId.trim(),
        memorizedAmount: form.memorizedAmount.trim() || "0",
        currentSurah: form.currentSurah.trim() || "غير محدد",
        phone: form.phone.trim(),
      });
      setSuccess(true);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="py-24 min-h-[70dvh] flex items-center">
        <Container className="max-w-lg text-center">
          <m.div
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 117, damping: 14 }}
            className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 sh-lift"
          >
            <CheckCircle2 size={42} />
          </m.div>
          <Reveal delay={0.15}>
            <h1 className="font-ruqaa font-bold text-4xl leading-[1.6] text-ink">
              تم استلام طلب التسجيل بنجاح
            </h1>
            <p className="text-ink-soft mt-3 leading-relaxed">
              شكرًا لتواصلكم معنا. تم تسجيل بيانات الطالب{" "}
              <strong className="text-ink font-bold">{form.name}</strong> وسيقوم فريق الإدارة
              بمراجعة الطلب والتواصل معكم على الرقم{" "}
              <strong className="text-ink font-mono" dir="ltr">
                {form.phone}
              </strong>{" "}
              لتسكين الطالب في الحلقة المناسبة.
            </p>
          </Reveal>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-14 sm:py-24">
      <Container className="max-w-2xl">
        <SectionHeading
          eyebrow="التسجيل الإلكتروني"
          title="سجّل ابنك الآن"
          description="أدخل البيانات خطوة بخطوة للتحقق السريع وسيتواصل معك فريقنا"
        />

        <Reveal className="mt-10 sm:mt-12" delay={0.1}>
          <div className="card p-6 sm:p-10 !rounded-[2.5rem] sh-float border border-line">
            {/* شريط مؤشر الخطوات */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-bold text-ink-mute mb-2">
                <span className={currentStep >= 1 ? "text-brand-ink" : ""}>الاسم رباعي</span>
                <span className={currentStep >= 2 ? "text-brand-ink" : ""}>الرقم القومي</span>
                <span className={currentStep >= 3 ? "text-brand-ink" : ""}>رقم الهاتف</span>
                <span className={currentStep >= 4 ? "text-brand-ink" : ""}>المستوى القرآني</span>
              </div>
              <div className="h-2 bg-bg-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-ink transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
              <p className="text-xs text-ink-mute text-center mt-2 font-medium">
                الخطوة {currentStep} من {totalSteps}
              </p>
            </div>

            {/* محتوى الخطوة */}
            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                {/* ─── الخطوة 1: اسم الطالب رباعي ─────────── */}
                {currentStep === 1 && (
                  <m.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm sm:text-base font-extrabold text-ink flex items-center gap-2">
                          <User size={18} className="text-brand-ink" />
                          <span>اسم الطالب رباعي باللغة العربية *</span>
                        </label>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            isNameValid
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-bg-alt text-ink-mute"
                          }`}
                        >
                          {nameParts.length} / 4 كلمات
                        </span>
                      </div>

                      <input
                        ref={inputRef}
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder="مثال: يوسف أحمد محمد السيد"
                        className="field !text-base sm:!text-lg font-bold py-3.5"
                        dir="rtl"
                      />
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed flex items-start gap-3 transition-colors ${
                        isNameValid
                          ? "bg-emerald-50/80 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                          : "bg-brand-soft/40 text-ink-soft border border-brand-soft"
                      }`}
                    >
                      {isNameValid ? (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={18} className="text-brand-ink shrink-0 mt-0.5" />
                      )}
                      <div>
                        {isNameValid ? (
                          <p className="font-bold">الاسم رباعي وصحيح، اضغط &quot;التالي&quot; للمتابعة.</p>
                        ) : (
                          <p>
                            يجب إدخال الاسم كاملاً (<strong>رباعي على الأقل</strong>) باللغة
                            العربية كما هو مدون في شهادة الميلاد.
                          </p>
                        )}
                      </div>
                    </div>
                  </m.div>
                )}

                {/* ─── الخطوة 2: الرقم القومي وفحص البيانات ──── */}
                {currentStep === 2 && (
                  <m.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm sm:text-base font-extrabold text-ink flex items-center gap-2">
                          <IdCard size={18} className="text-brand-ink" />
                          <span>الرقم القومي للطالب (14 رقم) *</span>
                        </label>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                            nidAnalysis.valid
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-bg-alt text-ink-mute"
                          }`}
                        >
                          {normalizeDigits(form.nationalId).replace(/\D/g, "").length} / 14
                        </span>
                      </div>

                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={14}
                        value={form.nationalId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            nationalId: normalizeDigits(e.target.value).replace(/\D/g, ""),
                          })
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="3050101XXXXXXXX"
                        className="field !text-base sm:!text-lg font-mono font-bold tracking-wider py-3.5"
                        dir="ltr"
                      />
                    </div>

                    {nidAnalysis.valid && nidAnalysis.data ? (
                      <m.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                          <CheckCircle2 size={15} />
                          <span>بيانات تم استخراجها تلقائياً للطالب:</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="flex items-center gap-2 bg-surface/80 p-2.5 rounded-xl border border-line">
                            <Calendar size={14} className="text-brand-ink shrink-0" />
                            <div>
                              <span className="text-ink-mute block text-[10px]">تاريخ الميلاد</span>
                              <span className="font-bold text-ink">
                                {nidAnalysis.data.birthDateFormatted}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-surface/80 p-2.5 rounded-xl border border-line">
                            <Clock size={14} className="text-brand-ink shrink-0" />
                            <div>
                              <span className="text-ink-mute block text-[10px]">السن الآن</span>
                              <span className="font-bold text-ink">
                                {nidAnalysis.data.age} سنة
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-surface/80 p-2.5 rounded-xl border border-line">
                            <MapPin size={14} className="text-brand-ink shrink-0" />
                            <div>
                              <span className="text-ink-mute block text-[10px]">المحافظة</span>
                              <span className="font-bold text-ink">
                                {nidAnalysis.data.governorateName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-surface/80 p-2.5 rounded-xl border border-line">
                            <User size={14} className="text-brand-ink shrink-0" />
                            <div>
                              <span className="text-ink-mute block text-[10px]">النوع</span>
                              <span className="font-bold text-ink">
                                {nidAnalysis.data.gender}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 pt-1 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>إذا كانت هذه البيانات صحيحة، اضغط &quot;التالي&quot; لمتابعة التسجيل.</span>
                        </p>
                      </m.div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-bg-alt/70 border border-line text-xs sm:text-sm text-ink-mute flex items-start gap-3">
                        <AlertCircle size={18} className="shrink-0 mt-0.5 text-ink-soft" />
                        <div>
                          {form.nationalId.length > 0 && nidAnalysis.error ? (
                            <span className="text-danger-ink font-bold">{nidAnalysis.error}</span>
                          ) : (
                            <span>
                              أدخل الرقم القومي لشهادة ميلاد أو بطاقة الطالب المكون من 14 رقماً
                              مصرياً.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </m.div>
                )}

                {/* ─── الخطوة 3: رقم هاتف التواصل ──────────── */}
                {currentStep === 3 && (
                  <m.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm sm:text-base font-extrabold text-ink flex items-center gap-2">
                          <Phone size={18} className="text-brand-ink" />
                          <span>رقم هاتف ولي الأمر للتواصل (مصري) *</span>
                        </label>
                        <span className="text-xs text-ink-mute font-medium">010 / 011 / 012 / 015</span>
                      </div>

                      <input
                        ref={inputRef}
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: normalizeDigits(e.target.value) })
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="010XXXXXXXX"
                        className="field !text-base sm:!text-lg font-mono font-bold py-3.5 text-right"
                        dir="ltr"
                      />
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed flex items-start gap-3 ${
                        isPhoneValid
                          ? "bg-emerald-50/80 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                          : "bg-brand-soft/40 text-ink-soft border border-brand-soft"
                      }`}
                    >
                      {isPhoneValid ? (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={18} className="text-brand-ink shrink-0 mt-0.5" />
                      )}
                      <div>
                        {isPhoneValid ? (
                          <p className="font-bold">رقم الهاتف مصري وصحيح، اضغط &quot;التالي&quot;.</p>
                        ) : (
                          <p>
                            يجب إدخال رقم هاتف مصري صحيح (11 رقم) لتلقي إشعارات الحفظ والقبول
                            والتواصل من إدارة المجمع.
                          </p>
                        )}
                      </div>
                    </div>
                  </m.div>
                )}

                {/* ─── الخطوة 4: المستوى القرآني ─────────────── */}
                {currentStep === 4 && (
                  <m.div
                    key="step4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm sm:text-base font-extrabold text-ink block mb-2 flex items-center gap-2">
                        <BookOpen size={18} className="text-brand-ink" />
                        <span>السورة الحالية التي يحفظ فيها الطالب *</span>
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={form.currentSurah}
                        onChange={(e) => setForm({ ...form, currentSurah: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder="مثال: سورة البقرة، سورة النبأ، سورة الفاتحة"
                        className="field !text-base font-bold py-3.5"
                      />
                    </div>

                    <div>
                      <label className="text-sm sm:text-base font-extrabold text-ink block mb-2 flex items-center gap-2">
                        <BookMarked size={18} className="text-gold-ink" />
                        <span>عدد الأجزاء المحفوظة سابقاً</span>
                      </label>
                      <input
                        type="text"
                        value={form.memorizedAmount}
                        onChange={(e) => setForm({ ...form, memorizedAmount: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder="مثال: 3 أجزاء، جزء عم، صفر"
                        className="field !text-base py-3.5"
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {/* أزرار التنقل السفلية */}
            <div className="pt-6 border-t border-line flex items-center justify-between">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack} disabled={loading} className="gap-2">
                  <ArrowRight size={16} />
                  <span>السابق</span>
                </Button>
              ) : (
                <div />
              )}

              <Button
                onClick={handleNext}
                disabled={!canGoNext() || loading}
                loading={loading}
                className="gap-2 px-6"
              >
                <span>
                  {currentStep === totalSteps
                    ? "إرسال طلب التسجيل"
                    : "التالي"}
                </span>
                <ArrowLeft size={16} />
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
