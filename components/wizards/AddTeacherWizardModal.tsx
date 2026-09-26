"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  User,
  Phone,
  Clock,
  IdCard,
  Layers,
  GraduationCap,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { teachersApi } from "@/lib/resources";
import { isEgyptianName, isPhone, normalizeDigits } from "@/lib/validation";
import { parseEgyptianNationalId, generateRandomPassword, EgyptianNidData } from "@/lib/egyptianNid";

interface AddTeacherWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacher: any) => void;
}

export function AddTeacherWizardModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTeacherWizardModalProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Steps: 1: name, 2: national_id, 3: phone, 4: type_and_password, 5: success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [teacherType, setTeacherType] = useState<"group" | "other">("group");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // تحليل فوري للرقم القومي
  const nidAnalysis = parseEgyptianNationalId(nationalId);

  // حساب عدد الكلمات في الاسم
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const isNameValid = isEgyptianName(fullName);

  // فحص رقم الهاتف
  const isPhoneValid = !phone || isPhone(phone);

  // التركيز التلقائي على الإنبوت عند تغير الخطوة
  useEffect(() => {
    if (isOpen && currentStep <= totalSteps) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [currentStep, isOpen]);

  // إعادة تعيين النموذج عند الفتح
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFullName("");
      setNationalId("");
      setPhone("");
      setTeacherType("group");
      setPassword(generateRandomPassword());
      setCreatedTeacher(null);
      setCopiedField(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // نسخ نص للحافظة
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`تم نسخ ${fieldName} بنجاح`, "success");
    setTimeout(() => setCopiedField(null), 2500);
  };

  // التحقق قبل الانتقال للخطوة التالية
  const canGoNext = () => {
    if (currentStep === 1) return isNameValid;
    if (currentStep === 2) return nidAnalysis.valid;
    if (currentStep === 3) return isPhoneValid;
    if (currentStep === 4) return password.length >= 6;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep <= totalSteps) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // إرسال البيانات النهائية
  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // 1. إنشاء المعلم
      const res = await teachersApi.create({
        full_name: fullName.trim(),
        national_id: nationalId.trim(),
        phone: phone.trim() || undefined,
        password: password,
      });

      // 2. تعيين نوع المعلم
      if (res?.id && teacherType) {
        try {
          await teachersApi.setType(res.id, teacherType);
          res.teacher_type = teacherType;
        } catch {
          // ignore type error if any
        }
      }

      setCreatedTeacher({
        ...res,
        plainPassword: password,
      });
      setCurrentStep(5); // شاشة النجاح
      onSuccess(res);
      showToast("تم تسجيل المعلم بنجاح", "success");
    } catch (err: any) {
      showToast(err.message || "فشل تسجيل المعلم، يرجى التحقق من البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canGoNext()) {
        handleNext();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && currentStep !== 5) onClose();
      }}
    >
      <div className="bg-surface rounded-3xl w-full max-w-lg sh-float border border-line relative overflow-hidden my-auto">
        {/* شريط الإغلاق والعنوان */}
        <div className="p-5 sm:p-6 pb-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-soft text-brand-ink flex items-center justify-center font-bold">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-ink">إضافة معلم جديد</h2>
              <p className="text-xs text-ink-mute">
                {currentStep <= totalSteps
                  ? `الخطوة ${currentStep} من ${totalSteps}: خطوة بخطوة لدقة البيانات`
                  : "تم التسجيل بنجاح"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-btn rounded-xl text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        {/* مؤشر التقدم */}
        {currentStep <= totalSteps && (
          <div className="px-6 pt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-ink-mute mb-1.5">
              <span className={currentStep >= 1 ? "text-brand-ink" : ""}>الاسم</span>
              <span className={currentStep >= 2 ? "text-brand-ink" : ""}>الرقم القومي</span>
              <span className={currentStep >= 3 ? "text-brand-ink" : ""}>الهاتف</span>
              <span className={currentStep >= 4 ? "text-brand-ink" : ""}>كلمة المرور</span>
            </div>
            <div className="h-1.5 bg-bg-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-ink transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* محتوى الخطوات */}
        <div className="p-5 sm:p-7">
          <AnimatePresence mode="wait">
            {/* ─── الخطوة 1: الاسم رباعي ────────────────── */}
            {currentStep === 1 && (
              <m.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <User size={16} className="text-brand-ink" />
                      <span>اسم المعلم رباعي باللغة العربية *</span>
                    </label>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="مثال: أحمد محمود السيد عبد الرحيم"
                    className="field !text-base sm:!text-lg font-bold py-3.5"
                    dir="rtl"
                  />
                </div>

                {/* ملاحظة الفالديشن */}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed flex items-start gap-2.5 transition-colors ${
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
                        يجب إدخال الاسم كاملاً (<strong>رباعي على الأقل</strong>) باللغة العربية
                        فقط وبدون أرقام أو رموز خاصة.
                      </p>
                    )}
                  </div>
                </div>
              </m.div>
            )}

            {/* ─── الخطوة 2: الرقم القومي واستخراج البيانات ─── */}
            {currentStep === 2 && (
              <m.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <IdCard size={16} className="text-brand-ink" />
                      <span>الرقم القومي المصري (14 رقم) *</span>
                    </label>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                        nidAnalysis.valid
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-bg-alt text-ink-mute"
                      }`}
                    >
                      {normalizeDigits(nationalId).replace(/\D/g, "").length} / 14
                    </span>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    value={nationalId}
                    onChange={(e) => setNationalId(normalizeDigits(e.target.value).replace(/\D/g, ""))}
                    onKeyDown={handleKeyDown}
                    placeholder="2950101XXXXXXXX"
                    className="field !text-base sm:!text-lg font-mono font-bold tracking-wider py-3.5"
                    dir="ltr"
                  />
                </div>

                {/* كارت البيانات المستخرجة تلقائياً */}
                {nidAnalysis.valid && nidAnalysis.data ? (
                  <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                      <CheckCircle2 size={15} />
                      <span>بيانات تم استخراجها تلقائياً من الرقم القومي:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="flex items-center gap-2 bg-surface/80 p-2 rounded-xl border border-line">
                        <Calendar size={14} className="text-brand-ink shrink-0" />
                        <div>
                          <span className="text-ink-mute block text-[10px]">تاريخ الميلاد</span>
                          <span className="font-bold text-ink">
                            {nidAnalysis.data.birthDateFormatted}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-surface/80 p-2 rounded-xl border border-line">
                        <Clock size={14} className="text-brand-ink shrink-0" />
                        <div>
                          <span className="text-ink-mute block text-[10px]">السن الآن</span>
                          <span className="font-bold text-ink">{nidAnalysis.data.age} سنة</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-surface/80 p-2 rounded-xl border border-line">
                        <MapPin size={14} className="text-brand-ink shrink-0" />
                        <div>
                          <span className="text-ink-mute block text-[10px]">المحافظة</span>
                          <span className="font-bold text-ink">
                            {nidAnalysis.data.governorateName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-surface/80 p-2 rounded-xl border border-line">
                        <User size={14} className="text-brand-ink shrink-0" />
                        <div>
                          <span className="text-ink-mute block text-[10px]">النوع</span>
                          <span className="font-bold text-ink">{nidAnalysis.data.gender}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 pt-1 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span>إذا كانت هذه البيانات صحيحة، اضغط &quot;التالي&quot; لمتابعة التسجيل.</span>
                    </p>
                  </m.div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-bg-alt/70 border border-line text-xs text-ink-mute flex items-start gap-2.5">
                    <AlertCircle size={17} className="shrink-0 mt-0.5 text-ink-soft" />
                    <div>
                      {nationalId.length > 0 && nidAnalysis.error ? (
                        <span className="text-danger-ink font-bold">{nidAnalysis.error}</span>
                      ) : (
                        <span>
                          أدخل 14 رقماً للرقم القومي المصري، وسيتم فحص صحته واستخراج تاريخ الميلاد
                          والسن والمحافظة فوراً.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </m.div>
            )}

            {/* ─── الخطوة 3: رقم الهاتف ─────────────────── */}
            {currentStep === 3 && (
              <m.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <Phone size={16} className="text-brand-ink" />
                      <span>رقم الهاتف المحمول (اختياري)</span>
                    </label>
                    <span className="text-xs text-ink-mute font-medium">شبكات مصرية فقط</span>
                  </div>

                  <input
                    ref={inputRef}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(normalizeDigits(e.target.value))}
                    onKeyDown={handleKeyDown}
                    placeholder="010XXXXXXXX"
                    className="field !text-base sm:!text-lg font-mono font-bold py-3.5 text-right"
                    dir="ltr"
                  />
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed flex items-start gap-2.5 ${
                    phone && !isPhoneValid
                      ? "bg-danger-soft text-danger-ink border border-danger-soft"
                      : "bg-bg-alt/70 text-ink-mute border border-line"
                  }`}
                >
                  <AlertCircle size={17} className="shrink-0 mt-0.5 text-brand-ink" />
                  <div>
                    {phone && !isPhoneValid ? (
                      <p className="font-bold">
                        رقم الهاتف غير صحيح — يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً.
                      </p>
                    ) : (
                      <p>
                        يمكنك إدخال رقم هاتف المعلم للتواصل وإرسال الإشعارات، أو تركه فارغاً
                        والضغط على <strong>&quot;تخطي&quot;</strong> للمتابعة.
                      </p>
                    )}
                  </div>
                </div>
              </m.div>
            )}

            {/* ─── الخطوة 4: نوع المعلم + كلمة المرور ──────── */}
            {currentStep === 4 && (
              <m.div
                key="step4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* تحديد النوع */}
                <div>
                  <label className="text-xs font-bold text-ink block mb-2">
                    اختر نوع المعلم في المنظومة:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTeacherType("group")}
                      className={`p-3 rounded-2xl border-2 text-right transition-all ${
                        teacherType === "group"
                          ? "border-brand-ink bg-brand-soft/50 shadow-sm"
                          : "border-line bg-surface hover:bg-bg-alt/40"
                      }`}
                    >
                      <div className="font-extrabold text-xs sm:text-sm text-ink mb-1 flex items-center justify-between">
                        <span>معلم حلقة</span>
                        {teacherType === "group" && (
                          <CheckCircle2 size={16} className="text-brand-ink" />
                        )}
                      </div>
                      <p className="text-[11px] text-ink-mute leading-snug">
                        تُنشأ له حلقة ويتم إسناد طلاب له مباشرة.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeacherType("other")}
                      className={`p-3 rounded-2xl border-2 text-right transition-all ${
                        teacherType === "other"
                          ? "border-brand-ink bg-brand-soft/50 shadow-sm"
                          : "border-line bg-surface hover:bg-bg-alt/40"
                      }`}
                    >
                      <div className="font-extrabold text-xs sm:text-sm text-ink mb-1 flex items-center justify-between">
                        <span>معلم عادي</span>
                        {teacherType === "other" && (
                          <CheckCircle2 size={16} className="text-brand-ink" />
                        )}
                      </div>
                      <p className="text-[11px] text-ink-mute leading-snug">
                        معلم مواد دراسية ومجموعات تعليمية.
                      </p>
                    </button>
                  </div>
                </div>

                {/* كلمة المرور */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <KeyRound size={15} className="text-brand-ink" />
                      <span>كلمة مرور حساب المعلم *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPassword(generateRandomPassword())}
                      className="text-xs text-brand-ink font-bold hover:underline"
                    >
                      توليد عشوائي
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••"
                      className="field !pl-20 !text-base font-mono font-bold"
                    />

                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="icon-btn rounded-lg text-ink-mute hover:text-ink"
                        title={showPassword ? "إخفاء" : "إظهار"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(password, "كلمة المرور")}
                        className="p-1.5 text-ink-mute hover:text-brand-ink rounded-lg"
                        title="نسخ كلمة المرور"
                      >
                        {copiedField === "كلمة المرور" ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-mute mt-1.5">
                    الحد الأدنى 6 أحرف. يمكنك نسخها وإرسالها للمعلم بعد اكتمال التسجيل.
                  </p>
                </div>
              </m.div>
            )}

            {/* ─── الخطوة 5: شاشة النجاح وعرض بيانات الدخول ── */}
            {currentStep === 5 && createdTeacher && (
              <m.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center py-2"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-ink">تم تسجيل المعلم بنجاح!</h3>
                  <p className="text-xs text-ink-mute mt-1">
                    تم إنشاء الحساب وتوليد اسم المستخدم للدخول تلقائياً
                  </p>
                </div>

                {/* كارت بيانات الدخول الجاهزة للنسخ */}
                <div className="bg-bg-alt/70 border border-line rounded-2xl p-4 text-right space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-ink-mute">اسم المعلم:</span>
                    <span className="font-extrabold text-ink">{createdTeacher.full_name}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-ink-mute">اسم المستخدم (Username):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-brand-ink text-sm">
                        {createdTeacher.username}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdTeacher.username, "اسم المستخدم")}
                        className="p-1 hover:bg-brand-soft rounded-lg text-ink-mute hover:text-brand-ink transition-colors"
                        title="نسخ اسم المستخدم"
                      >
                        {copiedField === "اسم المستخدم" ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-ink-mute">كلمة المرور (Password):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-ink text-sm">
                        {createdTeacher.plainPassword}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdTeacher.plainPassword, "كلمة المرور")}
                        className="p-1 hover:bg-brand-soft rounded-lg text-ink-mute hover:text-brand-ink transition-colors"
                        title="نسخ كلمة المرور"
                      >
                        {copiedField === "كلمة المرور" ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-mute">نوع المعلم:</span>
                    <span className="font-bold text-ink">
                      {createdTeacher.teacher_type === "group" ? "معلم حلقة" : "معلم عادي"}
                    </span>
                  </div>
                </div>

                {/* زر نسخ الكل للواتساب */}
                <Button
                  onClick={() => {
                    const message = `مرحباً أستاذ ${createdTeacher.full_name}، تم إنشاء حسابكم على المنصة بنجاح:\n- اسم المستخدم: ${createdTeacher.username}\n- كلمة المرور: ${createdTeacher.plainPassword}`;
                    copyToClipboard(message, "بيانات الدخول كاملة");
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>نسخ بيانات الدخول كاملة (للإرسال بالواتساب)</span>
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* أزرار التنقل السفلية */}
        <div className="p-4 sm:p-6 pt-3 border-t border-line flex items-center justify-between bg-surface/50">
          {currentStep <= totalSteps ? (
            <>
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack} disabled={loading} className="gap-1.5">
                  <ArrowRight size={16} />
                  <span>السابق</span>
                </Button>
              ) : (
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  إلغاء
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={!canGoNext() || loading}
                loading={loading}
                className="gap-1.5"
              >
                <span>{currentStep === totalSteps ? "إتمام التسجيل" : currentStep === 3 && !phone ? "تخطي" : "التالي"}</span>
                <ArrowLeft size={16} />
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setFullName("");
                  setNationalId("");
                  setPhone("");
                  setPassword(generateRandomPassword());
                  setCreatedTeacher(null);
                }}
                className="flex-1"
              >
                إضافة معلم آخر
              </Button>
              <Button onClick={onClose} className="flex-1">
                تم وإغلاق
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
