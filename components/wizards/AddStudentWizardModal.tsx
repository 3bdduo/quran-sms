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
  Calendar,
  MapPin,
  User,
  Phone,
  Clock,
  IdCard,
  BookOpen,
  Users,
  Send,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { studentsApi } from "@/lib/resources";
import { isEgyptianName, isPhone, normalizeDigits } from "@/lib/validation";
import { parseEgyptianNationalId } from "@/lib/egyptianNid";

interface GroupOption {
  id: string;
  name: string;
  teacherName?: string;
  teacherUsername?: string;
}

interface AddStudentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: any) => void;
  groups?: GroupOption[];
  defaultGroupId?: string;
  isTeacherRole?: boolean;
}

export function AddStudentWizardModal({
  isOpen,
  onClose,
  onSuccess,
  groups = [],
  defaultGroupId,
  isTeacherRole = false,
}: AddStudentWizardModalProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // الخطوات:
  // 1: الاسم رباعي
  // 2: الرقم القومي (14 رقم مصري مع استخراج البيانات)
  // 3: هاتف ولي الأمر (مصري)
  // [4: اختيار الحلقة — فقط لو كان هناك أكثر من حلقة والأدمن]
  // الأخيرة: المستوى القرآني (السورة الحالية وعدد الأجزاء)
  const hasGroupStep = groups.length > 1 && !isTeacherRole;
  const totalSteps = hasGroupStep ? 5 : 4;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [groupId, setGroupId] = useState(defaultGroupId || (groups[0]?.id || ""));
  const [currentSurah, setCurrentSurah] = useState("غير محدد");
  const [memorizedAmount, setMemorizedAmount] = useState("0");

  const [loading, setLoading] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // تحليل فوري للرقم القومي
  const nidAnalysis = parseEgyptianNationalId(nationalId);

  // التحقق من الاسم الرباعي
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const isNameValid = isEgyptianName(name);

  // التحقق من رقم الهاتف
  const isPhoneValid = isPhone(phone);

  // التركيز التلقائي عند تغير الخطوة
  useEffect(() => {
    if (isOpen && currentStep <= totalSteps) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [currentStep, isOpen, totalSteps]);

  // إعادة التعيين عند الفتح
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setName("");
      setNationalId("");
      setPhone("");
      setGroupId(defaultGroupId || (groups[0]?.id || ""));
      setCurrentSurah("غير محدد");
      setMemorizedAmount("0");
      setCreatedStudent(null);
      setCopiedField(null);
    }
  }, [isOpen, defaultGroupId, groups]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`تم نسخ ${fieldName} بنجاح`, "success");
    setTimeout(() => setCopiedField(null), 2500);
  };

  // التحقق قبل الانتقال
  const canGoNext = () => {
    if (currentStep === 1) return isNameValid;
    if (currentStep === 2) return nidAnalysis.valid;
    if (currentStep === 3) return isPhoneValid;
    if (hasGroupStep && currentStep === 4) return !!groupId;
    if (currentStep === (hasGroupStep ? 5 : 4)) return currentSurah.trim().length > 0;
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

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        nationalId: nationalId.trim(),
        phone: phone.trim(),
        groupId: groupId || undefined,
        currentSurah: currentSurah.trim() || "غير محدد",
        memorizedAmount: memorizedAmount.trim() || "0",
      };

      const res = await studentsApi.create(payload);

      setCreatedStudent({
        name: name.trim(),
        national_id: nationalId.trim(),
        phone: phone.trim(),
        current_surah: currentSurah.trim(),
        memorized_amount: memorizedAmount.trim(),
        groupName: groups.find((g) => g.id === groupId)?.name || "الحلقة",
      });

      setCurrentStep(totalSteps + 1); // شاشة النجاح
      onSuccess(res);
      showToast("تم تسجيل الطالب بنجاح", "success");
    } catch (err: any) {
      showToast(err.message || "تعذر إضافة الطالب، يرجى مراجعة البيانات", "error");
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
        if (e.target === e.currentTarget && currentStep !== totalSteps + 1) onClose();
      }}
    >
      <div className="bg-surface rounded-3xl w-full max-w-lg sh-float border border-line relative overflow-hidden my-auto">
        {/* شريط العنوان */}
        <div className="p-5 sm:p-6 pb-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-soft text-brand-ink flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-ink">تسجيل طالب جديد</h2>
              <p className="text-xs text-ink-mute">
                {currentStep <= totalSteps
                  ? `الخطوة ${currentStep} من ${totalSteps}: إدخال ميسّر ودقيق`
                  : "تم التسجيل بنجاح"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-mute hover:text-ink hover:bg-bg-alt transition-colors"
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
              {hasGroupStep && (
                <span className={currentStep >= 4 ? "text-brand-ink" : ""}>الحلقة</span>
              )}
              <span className={currentStep >= (hasGroupStep ? 5 : 4) ? "text-brand-ink" : ""}>
                المستوى القرآني
              </span>
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
                    <label className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <User size={16} className="text-brand-ink" />
                      <span>اسم الطالب رباعي باللغة العربية *</span>
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="مثال: يوسف أحمد محمد عبد الرحمن"
                    className="field !text-base sm:!text-lg font-bold py-3.5"
                    dir="rtl"
                  />
                </div>

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
                        يجب إدخال اسم الطالب كاملاً (<strong>رباعي على الأقل</strong>) باللغة
                        العربية فقط كما هو بشهادة الميلاد.
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
                    <label className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <IdCard size={16} className="text-brand-ink" />
                      <span>الرقم القومي للطالب (14 رقم) *</span>
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
                    onChange={(e) =>
                      setNationalId(normalizeDigits(e.target.value).replace(/\D/g, ""))
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
                          أدخل الرقم القومي لشهادة ميلاد أو بطاقة الطالب المكون من 14 رقماً مصرياً.
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
                    <label className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <Phone size={16} className="text-brand-ink" />
                      <span>رقم هاتف ولي الأمر للتواصل (مصري) *</span>
                    </label>
                    <span className="text-xs text-ink-mute font-medium">
                      010 / 011 / 012 / 015
                    </span>
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
                        يجب إدخال رقم هاتف مصري صحيح (11 رقم) لتلقي إشعارات الحفظ والغياب والرسائل.
                      </p>
                    )}
                  </div>
                </div>
              </m.div>
            )}

            {/* ─── الخطوة 4: اختيار الحلقة (لو الأدمن ولديه أكثر من حلقة) ──── */}
            {hasGroupStep && currentStep === 4 && (
              <m.div
                key="step4-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-bold text-ink block mb-2 flex items-center gap-1.5">
                    <Users size={16} className="text-brand-ink" />
                    <span>تسكين الطالب في حلقة قرآنية *</span>
                  </label>

                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="field field-select !text-base py-3"
                  >
                    <option value="">-- اضغط لاختيار الحلقة المناسبة --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.teacherName ? `أ. ${g.teacherName}` : g.teacherUsername || "بدون معلم"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-bg-alt/70 border border-line text-xs text-ink-mute flex items-start gap-2.5">
                  <BookOpen size={16} className="text-brand-ink shrink-0 mt-0.5" />
                  <p>
                    اختر الحلقة التي سينضم إليها الطالب لمتابعة الحفظ والحضور مع شيخ الحلقة.
                  </p>
                </div>
              </m.div>
            )}

            {/* ─── الخطوة الأخيرة: المستوى القرآني ──────────── */}
            {currentStep === (hasGroupStep ? 5 : 4) && (
              <m.div
                key="step-quran"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-bold text-ink block mb-2 flex items-center gap-1.5">
                    <BookOpen size={16} className="text-brand-ink" />
                    <span>السورة الحالية التي يحفظ فيها الطالب *</span>
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentSurah}
                    onChange={(e) => setCurrentSurah(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="مثال: سورة البقرة، سورة النبأ، سورة مريم"
                    className="field !text-base font-bold py-3"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-ink block mb-2 flex items-center gap-1.5">
                    <BookMarked size={16} className="text-gold-ink" />
                    <span>عدد الأجزاء المحفوظة سابقاً</span>
                  </label>
                  <input
                    type="text"
                    value={memorizedAmount}
                    onChange={(e) => setMemorizedAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="مثال: 3 أجزاء، جزء عم، صفر"
                    className="field !text-base py-3"
                  />
                </div>
              </m.div>
            )}

            {/* ─── شاشة النجاح والتأكيد (بعد الحفظ) ──────────── */}
            {currentStep === totalSteps + 1 && createdStudent && (
              <m.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center py-2"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-ink">تم تسجيل الطالب بنجاح!</h3>
                  <p className="text-xs text-ink-mute mt-1">
                    أصبح الطالب مقيداً في المنظومة ويسجل دخوله بالرقم القومي
                  </p>
                </div>

                {/* كارت بيانات الطالب */}
                <div className="bg-bg-alt/70 border border-line rounded-2xl p-4 text-right space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-ink-mute">اسم الطالب:</span>
                    <span className="font-extrabold text-ink">{createdStudent.name}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-ink-mute">الرقم القومي (لتسجيل الدخول):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-brand-ink text-sm">
                        {createdStudent.national_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdStudent.national_id, "الرقم القومي")}
                        className="p-1 hover:bg-brand-soft rounded-lg text-ink-mute hover:text-brand-ink transition-colors"
                        title="نسخ الرقم القومي"
                      >
                        {copiedField === "الرقم القومي" ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-ink-mute">هاتف ولي الأمر:</span>
                    <span className="font-mono font-bold text-ink">{createdStudent.phone}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-ink-mute">الحلقة:</span>
                    <span className="font-bold text-ink">{createdStudent.groupName}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-mute">السورة الحالية:</span>
                    <span className="font-bold text-ink">{createdStudent.current_surah}</span>
                  </div>
                </div>

                {/* زر نسخ بطاقة الطالب لإرسالها بالواتساب */}
                <Button
                  onClick={() => {
                    const message = `السلام عليكم ورحمة الله،\nتم تسجيل الطالب: ${createdStudent.name} بنجاح في مجمع القرآن الكريم.\n- الرقم القومي (لتسجيل الدخول): ${createdStudent.national_id}\n- الحلقة: ${createdStudent.groupName}\n- السورة الحالية: ${createdStudent.current_surah}\nنسأل الله له التوفيق والتفوق.`;
                    copyToClipboard(message, "بيانات الطالب");
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>نسخ بيانات الطالب كاملة (للإرسال لولي الأمر بالواتساب)</span>
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
                <span>{currentStep === totalSteps ? "إتمام التسجيل" : "التالي"}</span>
                <ArrowLeft size={16} />
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setName("");
                  setNationalId("");
                  setPhone("");
                  setCurrentSurah("غير محدد");
                  setMemorizedAmount("0");
                  setCreatedStudent(null);
                }}
                className="flex-1"
              >
                إضافة طالب آخر
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
