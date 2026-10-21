"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Trophy,
  Plus,
  Award,
  Users,
  FileText,
  Calendar,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  CheckCircle2,
  X,
  GraduationCap,
  Globe,
  School,
  Sparkles,
  Search,
  Filter,
  FileSpreadsheet,
  Upload,
  Download,
  Eye,
  Crown,
  Medal,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import {
  competitionsApi,
  examsApi,
  eduGroupsApi,
  studentsApi,
  groupsApi,
} from "@/lib/resources";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/components/ui/Toast";
import { Loader, Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { useData } from "@/hooks/useData";
import { CompetitionCelebrationModal } from "@/components/competitions/CompetitionCelebrationModal";
import type {
  CompetitionItem,
  EduGroupItem,
  Student,
  ExamItem,
  GroupItem,
  SingleCompetitionResult,
} from "@/types";

const ARABIC_ALPHABET = [
  "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر",
  "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف",
  "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي",
];

export default function AdminCompetitionsPage() {
  const [tab, setTab] = useState<"competitions" | "exams">("competitions");
  const [compFilterType, setCompFilterType] = useState<"all" | "external" | "internal">("all");

  // الكاش يعرض البيانات فوراً
  const {
    data: competitions = [],
    loading: compLoading,
    refetch: refetchCompetitions,
    mutate: setCompetitions,
  } = useData<CompetitionItem[]>(
    "admin:competitions",
    () => competitionsApi.list(),
    { initialData: [] }
  );

  const {
    data: eduGroups = [],
    loading: egLoading,
    refetch: refetchEduGroups,
  } = useData<EduGroupItem[]>(
    "admin:eduGroups",
    () => eduGroupsApi.list(),
    { initialData: [] }
  );

  const {
    data: allStudents = [],
    loading: sLoading,
    refetch: refetchStudents,
  } = useData<Student[]>(
    "admin:students",
    () => studentsApi.list(),
    { initialData: [] }
  );

  const {
    data: allGroups = [],
    refetch: refetchGroups,
  } = useData<GroupItem[]>(
    "admin:groups",
    () => groupsApi.list(),
    { initialData: [] }
  );

  const loading = compLoading || egLoading || sLoading;

  const [activeComp, setActiveComp] = useState<CompetitionItem | null>(null);

  // Modals for Competitions
  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<CompetitionItem | null>(null);
  const [compForm, setCompForm] = useState<{
    name: string;
    description: string;
    year: string;
    competition_type: "external" | "internal";
    max_score: number;
  }>({
    name: "",
    description: "",
    year: "2026",
    competition_type: "external",
    max_score: 100,
  });

  // Modal إضافة مشاركين (4 طرق: فردي، مجموعة كاملة، حرف، كل الطلاب)
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [participantMode, setParticipantMode] = useState<"single" | "group" | "letter" | "all">("single");
  const [selectedStudentForComp, setSelectedStudentForComp] = useState("");
  const [selectedGroupIdForComp, setSelectedGroupIdForComp] = useState("");
  const [selectedLetterForComp, setSelectedLetterForComp] = useState("أ");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  // Modal رصد الدرجات
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsEntries, setResultsEntries] = useState<
    { studentId: string; score: number; notes?: string }[]
  >([]);
  const [resultsSearchQuery, setResultsSearchQuery] = useState("");
  const [resultsFilterStatus, setResultsFilterStatus] = useState<"all" | "recorded" | "unrecorded">("all");
  const [quickScoreInput, setQuickScoreInput] = useState<number>(100);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedScoresText, setPastedScoresText] = useState("");

  // Modal معاينة التهنئة للأدمن
  const [previewCelebration, setPreviewCelebration] = useState<{
    studentName: string;
    results: SingleCompetitionResult[];
  } | null>(null);

  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // Exams state (المجموعات التعليمية)
  const [selectedEduGroupId, setSelectedEduGroupId] = useState("");
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [activeEduGroupStudents, setActiveEduGroupStudents] = useState<Student[]>([]);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "",
    maxScore: 100,
    date: new Date().toISOString().slice(0, 10),
    scores: [] as { studentId: string; score: number }[],
  });

  const { showToast } = useToast();

  useEffect(() => {
    if (eduGroups.length && !selectedEduGroupId) {
      setSelectedEduGroupId(eduGroups[0].id);
    }
  }, [eduGroups, selectedEduGroupId]);

  function loadData() {
    refetchCompetitions();
    refetchEduGroups();
    refetchStudents();
    refetchGroups();
  }

  // Exams loader
  useEffect(() => {
    if (tab === "exams" && selectedEduGroupId) {
      examsApi.findByEduGroup(selectedEduGroupId).then(setExams).catch(() => setExams([]));
      eduGroupsApi.byId(selectedEduGroupId).then((g) => {
        const studentIds = (g.students || []).map((s) => s.studentId);
        const enrolled = allStudents.filter((s) => studentIds.includes(s.id));
        setActiveEduGroupStudents(enrolled);
      });
    }
  }, [tab, selectedEduGroupId, allStudents]);

  async function viewCompDetails(id: string) {
    try {
      const details = await competitionsApi.byId(id);
      setActiveComp(details);
    } catch {
      showToast("تعذّر تحميل تفاصيل المسابقة", "error");
    }
  }

  // تصفية المسابقات المعروضة
  const filteredCompetitions = useMemo(() => {
    if (compFilterType === "all") return competitions;
    return competitions.filter((c) => (c.competition_type || "external") === compFilterType);
  }, [competitions, compFilterType]);

  // إنشاء مسابقة / اختبار
  async function handleCreateCompetition(e: React.FormEvent) {
    e.preventDefault();
    try {
      await competitionsApi.create(compForm);
      showToast(
        compForm.competition_type === "internal"
          ? "تم إنشاء الاختبار المدرسي بنجاح"
          : "تم إنشاء المسابقة الخارجية بنجاح",
        "success"
      );
      setShowAddCompModal(false);
      setCompForm({
        name: "",
        description: "",
        year: "2026",
        competition_type: "external",
        max_score: 100,
      });
      loadData();
    } catch {
      showToast("تعذّر إنشاء المسابقة", "error");
    }
  }

  // تعديل مسابقة
  async function handleUpdateCompetition(e: React.FormEvent) {
    e.preventDefault();
    if (!editingComp) return;
    try {
      await competitionsApi.update(editingComp.id, compForm);
      showToast("تم حفظ التعديلات بنجاح", "success");
      setEditingComp(null);
      if (activeComp?.id === editingComp.id) {
        viewCompDetails(editingComp.id);
      }
      loadData();
    } catch {
      showToast("تعذّر التحديث", "error");
    }
  }

  // حذف مسابقة
  async function handleDeleteCompetition(id: string, name: string) {
    if (!window.confirm(`هل أنت متأكد من حذف "${name}" وجميع نتائجها المسجلة؟`)) return;
    try {
      await competitionsApi.remove(id);
      showToast("تم الحذف بنجاح", "success");
      setCompetitions((prev) => prev.filter((c) => c.id !== id));
      if (activeComp?.id === id) setActiveComp(null);
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  // إضافة طالب فردي
  async function handleAddSingleParticipant() {
    if (!activeComp || !selectedStudentForComp) return;
    setIsBulkAdding(true);
    try {
      await competitionsApi.addParticipant(activeComp.id, selectedStudentForComp);
      showToast("تمت إضافة الطالب للمسابقة بنجاح", "success");
      setShowAddParticipantModal(false);
      setSelectedStudentForComp("");
      viewCompDetails(activeComp.id);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر إضافة الطالب", "error");
    } finally {
      setIsBulkAdding(false);
    }
  }

  // إضافة جماعية (مجموعة كاملة / حرف / كل الطلاب)
  async function handleBulkAdd(mode: "group" | "letter" | "all") {
    if (!activeComp) return;
    setIsBulkAdding(true);
    try {
      let body: any = { mode };
      if (mode === "group") {
        if (!selectedGroupIdForComp) {
          showToast("يرجى اختيار الحلقة أو المجموعة أولاً", "error");
          setIsBulkAdding(false);
          return;
        }
        body.groupId = selectedGroupIdForComp;
      } else if (mode === "letter") {
        if (!selectedLetterForComp) {
          showToast("يرجى اختيار الحرف أولاً", "error");
          setIsBulkAdding(false);
          return;
        }
        body.letter = selectedLetterForComp;
      }

      const res = await competitionsApi.bulkAddParticipants(activeComp.id, body);
      showToast(`تمت العملية بنجاح: أُضيف (${res.added}) طالب جديد للمسابقة`, "success");
      setShowAddParticipantModal(false);
      viewCompDetails(activeComp.id);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر إتمام الإضافة بالجملة", "error");
    } finally {
      setIsBulkAdding(false);
    }
  }

  // حذف مشارك
  async function handleRemoveParticipant(studentId: string) {
    if (!activeComp) return;
    if (!window.confirm("هل أنت متأكد من إزالة هذا الطالب من المسابقة؟")) return;
    try {
      await competitionsApi.removeParticipant(activeComp.id, studentId);
      showToast("تمت إزالة المشارك", "success");
      viewCompDetails(activeComp.id);
      loadData();
    } catch {
      showToast("تعذّر إزالة المشارك", "error");
    }
  }

  // فتح نافذة رصد الدرجات
  function openResultsModal() {
    if (!activeComp || !activeComp.participants) return;
    const initial = activeComp.participants.map((pid) => {
      const existing = (activeComp.results || []).find((r) => r.student_id === pid);
      return {
        studentId: pid,
        score: existing ? existing.score : 0,
        notes: existing?.notes || "",
      };
    });
    setResultsEntries(initial);
    setResultsSearchQuery("");
    setResultsFilterStatus("all");
    setShowResultsModal(true);
  }

  // حفظ ونشر النتائج
  async function handleSaveResults() {
    if (!activeComp) return;
    try {
      await competitionsApi.saveResults(
        activeComp.id,
        resultsEntries.map((e) => ({
          studentId: e.studentId,
          score: Number(e.score),
          notes: e.notes || undefined,
        }))
      );
      showToast("تم رصد ونشر نتائج المسابقة، وستظهر شاشة التهنئة للطلاب عند دخولهم!", "success");
      setShowResultsModal(false);
      viewCompDetails(activeComp.id);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ النتائج", "error");
    }
  }

  // تطبيق درجة موحدة على الجميع أو على غير المرصودين
  function applyScoreToEntries(score: number, onlyUnrecorded: boolean) {
    setResultsEntries((prev) =>
      prev.map((entry) => {
        if (onlyUnrecorded && entry.score > 0) return entry;
        return { ...entry, score };
      })
    );
    showToast(
      onlyUnrecorded
        ? `تم تطبيق درجة ${score} على الطلاب الذين لم تُرصد درجاتهم`
        : `تم تطبيق درجة ${score} على جميع المشاركين`,
      "success"
    );
  }

  // تطبيق لصق الدرجات من نص أو إكسل
  function handleApplyPastedScores() {
    if (!pastedScoresText.trim() || !activeComp) return;
    const lines = pastedScoresText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let updatedCount = 0;

    const newEntries = [...resultsEntries];

    lines.forEach((line) => {
      // تدعم: "اسم الطالب	درجة" أو "رقم قومي	درجة" أو فقط أرقام الدرجات سطر بسطر
      const parts = line.split(/[\t,;]+/).map((p) => p.trim());
      if (parts.length >= 2) {
        const identifier = parts[0];
        const val = Number(parts[1]);
        if (!isNaN(val)) {
          const idx = newEntries.findIndex((e) => {
            const st = allStudents.find((s) => s.id === e.studentId);
            return (
              e.studentId === identifier ||
              st?.national_id === identifier ||
              st?.name?.toLowerCase().includes(identifier.toLowerCase())
            );
          });
          if (idx !== -1) {
            newEntries[idx] = { ...newEntries[idx], score: val };
            updatedCount++;
          }
        }
      } else if (parts.length === 1 && !isNaN(Number(parts[0]))) {
        // سطر به رقم فقط -> نملأ الترتيب تسلسلياً
        if (updatedCount < newEntries.length) {
          newEntries[updatedCount] = { ...newEntries[updatedCount], score: Number(parts[0]) };
          updatedCount++;
        }
      }
    });

    setResultsEntries(newEntries);
    setShowPasteModal(false);
    setPastedScoresText("");
    showToast(`تم استيراد ورصد درجات (${updatedCount}) مشارك بنجاح!`, "success");
  }

  // تصدير كشف رصد إكسل CSV للملء
  function handleDownloadGradingTemplate() {
    if (!activeComp) return;
    const max = activeComp.max_score || 100;
    let csv = "\uFEFFاسم الطالب,الرقم القومي,الدرجة القصوى,الدرجة المرصودة,ملاحظات\n";
    (activeComp.participants || []).forEach((pid) => {
      const st = allStudents.find((s) => s.id === pid);
      const existing = (activeComp.results || []).find((r) => r.student_id === pid);
      csv += `"${st?.name || pid}","${st?.national_id || ""}","${max}","${existing?.score || 0}","${existing?.notes || ""}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `كشف-رصد-${activeComp.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("تم تنزيل كشف الرصد (CSV/Excel)", "success");
  }

  // تصدير وورد
  async function handleExportWord(comp: CompetitionItem) {
    setDownloadingDocId(comp.id);
    try {
      await downloadFile(`/exports/competitions/${comp.id}.docx`, `نتائج-${comp.name}.docx`);
      showToast("تم تنزيل تقرير النتائج الرسمي (Word)", "success");
    } catch {
      showToast("تعذّر تنزيل ملف الوورد", "error");
    } finally {
      setDownloadingDocId(null);
    }
  }

  // معاينة شاشة التهنئة لطالب معين
  function previewStudentCelebration(studentId: string) {
    if (!activeComp) return;
    const st = allStudents.find((s) => s.id === studentId);
    const existing = (activeComp.results || []).find((r) => r.student_id === studentId);
    const maxScore = activeComp.max_score || 100;
    const score = existing?.score || 0;
    const percentage = Math.round((score / maxScore) * 100);

    let celebrationLevel: "gold" | "silver" | "bronze" | "pass" | "good";
    let title: string;
    let message: string;
    let ayah: string;

    if ((existing?.rank && existing.rank === 1) || percentage >= 95) {
      celebrationLevel = "gold";
      title = "الوسام الذهبي الملكي 🏆 تاج الوقار";
      message = "مبارك الفوز الباهر والتميز الاستثنائي! رفعت رأس والديك ومعلميك، نسأل الله أن يجعلك من أهل القرآن الذين هم أهل الله وخاصته.";
      ayah = "وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ";
    } else if ((existing?.rank && (existing.rank === 2 || existing.rank === 3)) || percentage >= 85) {
      celebrationLevel = "silver";
      title = "وسام التفوق والامتياز الفضي 🥈";
      message = "هنيئاً لك هذا التفوق المشرف والإتقان العالي! قدوة طيبة ونبراس مبارك في طلب كتاب الله وسنة نبيه.";
      ayah = "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ";
    } else if (percentage >= 75) {
      celebrationLevel = "bronze";
      title = "وسام الجدارة والإنجاز البرونزي 🥉";
      message = "مبارك هذا الأداء المتميز والمثابرة المباركة! خطوة جليلة للأمام، واصل مسيرتك القرآنية بهمة وعزيمة.";
      ayah = "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ";
    } else if (percentage >= 50) {
      celebrationLevel = "pass";
      title = "وسام الاجتهاد والنجاح 🌸";
      message = "مبارك اجتيازك ونجاحك المبارك! أداء طيب ومبارك، ولك بكل حرف تتلوه حسنة والحسنة بعشر أمثالها.";
      ayah = "وَقُل رَّبِّ زِدْنِي عِلْمًا";
    } else {
      celebrationLevel = "good";
      title = "وسام شرف المحاولة والهمة القرآنية 📖";
      message = "تحية إجلال لمشاركتك وهمتك في كتاب الله! كل جهد مع القرآن فوز وأجر عظيم لا يضيع عند الله.";
      ayah = "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا";
    }

    setPreviewCelebration({
      studentName: st?.name || "الطالب",
      results: [
        {
          competitionId: activeComp.id,
          competitionName: activeComp.name,
          competitionType: activeComp.competition_type || "external",
          year: activeComp.year,
          maxScore,
          score,
          rank: existing?.rank || 1,
          percentage,
          celebrationLevel,
          title,
          message,
          ayah,
          notes: existing?.notes,
        },
      ],
    });
  }

  // حساب عدد الطلاب المطابقين للحرف المختار
  const matchingLetterStudentsCount = useMemo(() => {
    if (!selectedLetterForComp) return 0;
    const raw = selectedLetterForComp.trim();
    let reg: RegExp;
    if (["ا", "أ", "إ", "آ"].includes(raw)) {
      reg = /^[اأإآ]/i;
    } else {
      reg = new RegExp(`^${raw}`, "i");
    }
    return allStudents.filter((s) => reg.test(s.name) && !s.is_waiting).length;
  }, [allStudents, selectedLetterForComp]);

  // حساب عدد طلاب المجموعة المختارة
  const matchingGroupStudentsCount = useMemo(() => {
    if (!selectedGroupIdForComp) return 0;
    return allStudents.filter((s) => s.group_id === selectedGroupIdForComp && !s.is_waiting).length;
  }, [allStudents, selectedGroupIdForComp]);

  // Exams handlers (امتحانات المجموعات التعليمية)
  function openAddExam() {
    setExamForm({
      name: "",
      maxScore: 100,
      date: new Date().toISOString().slice(0, 10),
      scores: activeEduGroupStudents.map((s) => ({ studentId: s.id, score: 0 })),
    });
    setShowAddExamModal(true);
  }

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEduGroupId) return;
    try {
      await examsApi.create(selectedEduGroupId, examForm);
      showToast("تم تسجيل الامتحان ورصد درجات الطلاب بنجاح", "success");
      setShowAddExamModal(false);
      examsApi.findByEduGroup(selectedEduGroupId).then(setExams);
    } catch (err: any) {
      showToast(err.message || "تعذّر تسجيل الامتحان", "error");
    }
  }

  async function handleDeleteExam(examId: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا الامتحان؟")) return;
    try {
      await examsApi.remove(selectedEduGroupId, examId);
      showToast("تم حذف الامتحان", "success");
      setExams((prev) => prev.filter((e) => e.examId !== examId));
    } catch {
      showToast("تعذّر حذف الامتحان", "error");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* معاينة شاشة التهنئة */}
      {previewCelebration && (
        <CompetitionCelebrationModal
          studentName={previewCelebration.studentName}
          results={previewCelebration.results}
          isOpen={Boolean(previewCelebration)}
          onClose={() => setPreviewCelebration(null)}
        />
      )}

      {/* الرأس */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">المسابقات والاختبارات</h1>
          <p className="text-ink-mute text-sm mt-1">
            إدارة شاملة للمسابقات (خارج المدرسة) والاختبارات (داخل المدرسة) ورصد الدرجات والتهنئة
          </p>
        </div>

        <Button
          onClick={() => {
            if (tab === "competitions") {
              setCompForm({
                name: "",
                description: "",
                year: "2026",
                competition_type: compFilterType === "internal" ? "internal" : "external",
                max_score: 100,
              });
              setShowAddCompModal(true);
            } else {
              openAddExam();
            }
          }}
          className="flex items-center gap-2"
        >
          <Plus size={17} />
          <span>{tab === "competitions" ? "إضافة مسابقة / اختبار جديد" : "رصد امتحان للمجموعة"}</span>
        </Button>
      </div>

      {/* التبويب الرئيسي */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab("competitions")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "competitions"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Trophy size={18} />
          <span>المسابقات والاختبارات ({competitions.length})</span>
        </button>

        <button
          onClick={() => setTab("exams")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "exams"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <GraduationCap size={18} />
          <span>امتحانات المجموعات التعليمية</span>
        </button>
      </div>

      {tab === "competitions" ? (
        <>
          {/* شريط الفرز والتقسيم: خارج المدرسة / داخل المدرسة / الكل */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-line">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-ink-mute ml-2 flex items-center gap-1">
                <Filter size={14} />
                <span>عرض حسب:</span>
              </span>

              <button
                onClick={() => setCompFilterType("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  compFilterType === "all"
                    ? "bg-brand text-on-brand shadow-sm"
                    : "bg-bg-alt text-ink-soft hover:bg-line"
                }`}
              >
                الكل ({competitions.length})
              </button>

              <button
                onClick={() => setCompFilterType("external")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  compFilterType === "external"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-bg-alt text-ink-soft hover:bg-line"
                }`}
              >
                <Globe size={13} />
                <span>المسابقات (خارج المدرسة)</span>
                <span className="text-[11px] opacity-80">
                  ({competitions.filter((c) => (c.competition_type || "external") === "external").length})
                </span>
              </button>

              <button
                onClick={() => setCompFilterType("internal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  compFilterType === "internal"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-bg-alt text-ink-soft hover:bg-line"
                }`}
              >
                <School size={13} />
                <span>الاختبارات (داخل المدرسة)</span>
                <span className="text-[11px] opacity-80">
                  ({competitions.filter((c) => c.competition_type === "internal").length})
                </span>
              </button>
            </div>

            <span className="text-xs text-ink-mute font-medium self-end sm:self-auto">
              إجمالي المشاركين المسجلين في المنافسات:{" "}
              <span className="font-bold text-brand-ink">
                {competitions.reduce((acc, c) => acc + (c.participantsCount || 0), 0)}
              </span>
            </span>
          </div>

          {loading ? (
            <Loader size="lg" />
          ) : filteredCompetitions.length === 0 ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <Trophy size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">
                {compFilterType === "external"
                  ? "لا توجد مسابقات خارجية مسجلة حاليًا"
                  : compFilterType === "internal"
                  ? "لا توجد اختبارات داخلية مسجلة حاليًا"
                  : "لا توجد مسابقات أو اختبارات مسجلة"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setCompForm({
                    name: "",
                    description: "",
                    year: "2026",
                    competition_type: compFilterType === "internal" ? "internal" : "external",
                    max_score: 100,
                  });
                  setShowAddCompModal(true);
                }}
              >
                <Plus size={16} className="ml-1" />
                <span>إضافة جديدة</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompetitions.map((comp) => {
                const isInternal = comp.competition_type === "internal";
                const isPublished = comp.resultsPublished;
                return (
                  <div
                    key={comp.id}
                    className={`card !rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all border ${
                      activeComp?.id === comp.id ? "ring-2 ring-brand border-brand" : "border-line"
                    }`}
                  >
                    <div>
                      {/* Top Bar with Icon & Actions */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold ${
                            isInternal
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isInternal ? <School size={22} /> : <Trophy size={22} />}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingComp(comp);
                              setCompForm({
                                name: comp.name,
                                description: comp.description || "",
                                year: comp.year || "2026",
                                competition_type: comp.competition_type || "external",
                                max_score: comp.max_score ?? 100,
                              });
                            }}
                            title="تعديل البيانات"
                            className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center text-ink-mute hover:text-brand-ink hover:bg-brand-soft rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCompetition(comp.id, comp.name)}
                            title="حذف"
                            className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Type and Status Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            isInternal
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                              : "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300"
                          }`}
                        >
                          {isInternal ? <School size={12} /> : <Globe size={12} />}
                          <span>{isInternal ? "اختبار داخل المدرسة" : "مسابقة خارج المدرسة"}</span>
                        </span>

                        {isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            <Sparkles size={11} />
                            <span>النتائج منشورة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-bg-alt text-ink-mute">
                            <span>قيد الإعداد</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-lg text-ink">{comp.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-ink-mute mt-1">
                        <span>عام {comp.year}</span>
                        <span>•</span>
                        <span>النهاية العظمى: <b className="text-ink">{comp.max_score ?? 100}</b> درجة</span>
                      </div>

                      {comp.description && (
                        <p className="text-xs text-ink-soft mt-2 leading-relaxed line-clamp-2">
                          {comp.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Stats & Button */}
                    <div className="pt-4 mt-4 border-t border-line flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink-mute">
                        <Users size={15} />
                        <span>{comp.participantsCount || 0} مشارك</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportWord(comp)}
                          disabled={downloadingDocId === comp.id}
                          title="تنزيل كشف النتائج Word"
                          className="!p-2 text-ink-mute hover:text-ink"
                        >
                          {downloadingDocId === comp.id ? <Spinner size={14} /> : <FileText size={15} />}
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => viewCompDetails(comp.id)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span>إدارة ورصد</span>
                          <ChevronRight size={14} className="rotate-180" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* صندوق إدارة المسابقة المحددة والرصد */}
          {activeComp && (
            <div className="card !rounded-2xl p-6 space-y-6 border-2 border-brand/40 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activeComp.competition_type === "internal"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {activeComp.competition_type === "internal"
                        ? "اختبار داخل المدرسة 🏫"
                        : "مسابقة خارج المدرسة 🌐"}
                    </span>
                    <span className="text-xs text-ink-mute">
                      الدرجة القصوى: <b className="text-ink">{activeComp.max_score ?? 100}</b> درجة
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-ink">
                    إدارة مشاركي ونتائج: {activeComp.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      setParticipantMode("single");
                      setShowAddParticipantModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-brand text-on-brand"
                  >
                    <UserPlus size={16} />
                    <span>إضافة مشاركين (فردي / مجموعة / حرف / الكل)</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={openResultsModal}
                    disabled={!activeComp.participants?.length}
                    className="flex items-center gap-1.5 border-brand text-brand-ink"
                  >
                    <Award size={16} />
                    <span>رصد النتائج وإعلانها</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleDownloadGradingTemplate}
                    disabled={!activeComp.participants?.length}
                    title="تنزيل كشف Excel فارغ للرصد"
                    className="flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={16} />
                    <span>كشف Excel</span>
                  </Button>
                </div>
              </div>

              {/* جدول المشاركين والنتائج */}
              {!activeComp.participants || activeComp.participants.length === 0 ? (
                <div className="p-8 text-center text-ink-mute space-y-2">
                  <Users size={36} className="mx-auto text-ink-mute/50 mb-2" />
                  <p className="font-bold text-base">لا يوجد مشاركون مسجلون في هذه المسابقة بعد</p>
                  <p className="text-xs text-ink-soft">
                    اضغط زر &quot;إضافة مشاركين&quot; لاختيار طالب لوحده، أو مجموعة كاملة، أو طلاب يبدأ اسمهم بحرف معين، أو كل الطلاب دفعة واحدة!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-bg-alt/70 text-right text-ink-mute">
                        <th className="p-3 font-bold">م</th>
                        <th className="p-3 font-bold">اسم الطالب المشارك</th>
                        <th className="p-3 font-bold">الرقم القومي</th>
                        <th className="p-3 font-bold">الحلقة / المجموعة</th>
                        <th className="p-3 font-bold">الدرجة ({activeComp.max_score ?? 100})</th>
                        <th className="p-3 font-bold">النسبة</th>
                        <th className="p-3 font-bold">الترتيب والوسام</th>
                        <th className="p-3 font-bold text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeComp.participants.map((pid, idx) => {
                        const st = allStudents.find((s) => s.id === pid);
                        const group = allGroups.find((g) => g.id === st?.group_id);
                        const res = (activeComp.results || []).find((r) => r.student_id === pid);
                        const max = activeComp.max_score ?? 100;
                        const percentage = res ? Math.round((res.score / max) * 100) : null;

                        return (
                          <tr
                            key={pid}
                            className="border-b border-line last:border-0 hover:bg-bg-alt/40 transition-colors"
                          >
                            <td className="p-3 font-mono text-xs text-ink-mute">{idx + 1}</td>
                            <td className="p-3 font-bold text-ink">{st?.name || pid}</td>
                            <td className="p-3 font-mono text-xs text-ink-soft">
                              {st?.national_id || "-"}
                            </td>
                            <td className="p-3 text-xs text-ink-mute">
                              {group?.name || "بدون حلقة"}
                            </td>
                            <td className="p-3 font-bold text-brand-ink">
                              {res !== undefined ? `${res.score} درجة` : <span className="text-ink-mute">لم يرصد</span>}
                            </td>
                            <td className="p-3 font-bold text-xs">
                              {percentage !== null ? `${percentage}%` : "-"}
                            </td>
                            <td className="p-3">
                              {res?.rank ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    res.rank === 1
                                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm"
                                      : res.rank === 2
                                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                      : res.rank === 3
                                      ? "bg-amber-700/20 text-amber-700 dark:text-amber-400"
                                      : "bg-bg-alt text-ink-soft"
                                  }`}
                                >
                                  {res.rank === 1 && <Crown size={12} />}
                                  {res.rank === 2 && <Medal size={12} />}
                                  {res.rank === 3 && <Award size={12} />}
                                  <span>المركز {res.rank}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-ink-mute">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {res && (
                                  <button
                                    onClick={() => previewStudentCelebration(pid)}
                                    title="معاينة شاشة التهنئة كما يراها الطالب"
                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/15 transition-colors"
                                  >
                                    <Eye size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveParticipant(pid)}
                                  className="p-1.5 rounded-lg text-danger-ink hover:bg-danger-soft transition-colors"
                                  title="إزالة من المسابقة"
                                >
                                  <UserMinus size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* تبويب امتحانات المجموعات التعليمية */
        <div className="space-y-6">
          <div className="card !rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-ink-mute">اختر المجموعة التعليمية:</label>
              <select
                value={selectedEduGroupId}
                onChange={(e) => setSelectedEduGroupId(e.target.value)}
                className="field field-select text-sm py-2 min-w-56"
              >
                {eduGroups.map((eg) => (
                  <option key={eg.id} value={eg.id}>
                    {eg.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-bold text-ink-mute">
              عدد الاختبارات المرصودة: {exams.length}
            </span>
          </div>

          {!exams.length ? (
            <div className="card !rounded-2xl p-12 text-center text-ink-mute">
              <GraduationCap size={40} className="mx-auto text-ink-mute/50 mb-3" />
              <p className="font-bold text-lg">لا توجد اختبارات مسجلة لهذه المجموعة</p>
              <p className="text-xs mt-1">اضغط &quot;رصد امتحان للمجموعة&quot; لتسجيل درجات الطلاب</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((ex) => (
                <div key={ex.examId} className="card !rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div>
                      <h3 className="font-extrabold text-lg text-ink">{ex.name}</h3>
                      <p className="text-xs text-ink-mute mt-0.5">
                        التاريخ: {ex.date} — النهاية العظمى: {ex.maxScore} درجة
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(ex.examId)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-ink-mute hover:text-danger-ink hover:bg-danger-soft rounded-lg transition-colors"
                      title="حذف الامتحان"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ex.results.map((r) => (
                      <div
                        key={r.student_id}
                        className="bg-bg-alt/70 rounded-xl p-3 flex items-center justify-between"
                      >
                        <span className="text-sm font-bold text-ink">{r.student_name}</span>
                        <span className="font-extrabold text-brand-ink text-sm">
                          {r.score} / {ex.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: إنشاء / تعديل مسابقة أو اختبار                                    */}
      {/* ========================================================================= */}
      {(showAddCompModal || editingComp) && (
        <div className="modal-overlay">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-4">
              {editingComp ? "تعديل بيانات المسابقة / الاختبار" : "إنشاء مسابقة / اختبار جديد"}
            </h3>
            <form
              onSubmit={editingComp ? handleUpdateCompetition : handleCreateCompetition}
              className="space-y-4"
            >
              {/* اختيار نوع المنافسة: خارجية أم داخلية */}
              <div>
                <label className="field-label mb-1.5 block">تصنيف المنافسة *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCompForm({ ...compForm, competition_type: "external" })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-xs transition-all ${
                      compForm.competition_type === "external"
                        ? "border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-2 ring-sky-500/30"
                        : "border-line bg-bg-alt text-ink-soft hover:bg-line"
                    }`}
                  >
                    <Globe size={16} />
                    <span>مسابقة (خارج المدرسة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompForm({ ...compForm, competition_type: "internal" })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-xs transition-all ${
                      compForm.competition_type === "internal"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/30"
                        : "border-line bg-bg-alt text-ink-soft hover:bg-line"
                    }`}
                  >
                    <School size={16} />
                    <span>اختبار (داخل المدرسة)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="field-label">اسم المسابقة أو الاختبار *</label>
                <input
                  required
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  className="field"
                  placeholder={
                    compForm.competition_type === "internal"
                      ? "مثال: اختبار جزء عم الشهري / تقييم الحفظ الداخلي"
                      : "مثال: مسابقة الأوقاف السنوية / مسابقة الماهر بالقرآن"
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">النهاية العظمى للدرجة *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={compForm.max_score}
                    onChange={(e) => setCompForm({ ...compForm, max_score: Number(e.target.value) })}
                    className="field font-bold font-mono"
                    placeholder="100"
                  />
                  <span className="text-[11px] text-ink-mute mt-1 block">
                    الدرجة الكاملة (مثلاً: 100 أو 50)
                  </span>
                </div>

                <div>
                  <label className="field-label">العام الدراسي / السنة *</label>
                  <input
                    required
                    value={compForm.year}
                    onChange={(e) => setCompForm({ ...compForm, year: e.target.value })}
                    className="field font-mono"
                    placeholder="2026"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">الوصف وشروط المسابقة (اختياري)</label>
                <textarea
                  rows={3}
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  className="field resize-none"
                  placeholder="مستويات المسابقة، الأجزاء المقررة، شروط التسميع..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCompModal(false);
                    setEditingComp(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingComp ? "حفظ التعديلات" : "إنشاء وإضافة"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: إضافة مشاركين (فردي / مجموعة كاملة / أولهم حرف / كل الطلاب)     */}
      {/* ========================================================================= */}
      {showAddParticipantModal && activeComp && (
        <div className="modal-overlay">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-float border border-line max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-ink">إضافة مشاركين للمسابقة</h3>
                <p className="text-xs text-ink-mute">{activeComp.name}</p>
              </div>
              <button
                onClick={() => setShowAddParticipantModal(false)}
                className="icon-btn rounded-lg text-ink-mute hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* أزرار اختيار طريقة الإضافة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 p-1 rounded-2xl bg-bg-alt">
              <button
                type="button"
                onClick={() => setParticipantMode("single")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  participantMode === "single"
                    ? "bg-brand text-on-brand shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                👤 طالب فردي
              </button>

              <button
                type="button"
                onClick={() => setParticipantMode("group")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  participantMode === "group"
                    ? "bg-brand text-on-brand shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                👥 مجموعة كاملة
              </button>

              <button
                type="button"
                onClick={() => setParticipantMode("letter")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  participantMode === "letter"
                    ? "bg-brand text-on-brand shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                🔤 بالحرف الأول
              </button>

              <button
                type="button"
                onClick={() => setParticipantMode("all")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  participantMode === "all"
                    ? "bg-brand text-on-brand shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                🌐 كل الطلاب
              </button>
            </div>

            {/* طريقة 1: طالب لوحده */}
            {participantMode === "single" && (
              <div className="space-y-4">
                <div className="relative">
                  <label className="field-label">ابحث عن الطالب</label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none"
                    />
                    <input
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="ابحث بالاسم أو الرقم القومي..."
                      className="field pr-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">اختر الطالب من القائمة</label>
                  <select
                    value={selectedStudentForComp}
                    onChange={(e) => setSelectedStudentForComp(e.target.value)}
                    className="field field-select text-sm"
                    size={6}
                  >
                    {allStudents
                      .filter(
                        (s) =>
                          !activeComp.participants?.includes(s.id) &&
                          (!studentSearchQuery ||
                            s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                            (s.national_id && s.national_id.includes(studentSearchQuery)))
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id} className="py-1 px-2">
                          {s.name} — {s.memorized_amount || "بدون محفوظ"}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-line">
                  <Button variant="outline" onClick={() => setShowAddParticipantModal(false)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleAddSingleParticipant}
                    disabled={!selectedStudentForComp || isBulkAdding}
                  >
                    {isBulkAdding ? <Spinner size={16} /> : "إضافة الطالب للمسابقة"}
                  </Button>
                </div>
              </div>
            )}

            {/* طريقة 2: مجموعة كاملة */}
            {participantMode === "group" && (
              <div className="space-y-4">
                <div>
                  <label className="field-label">اختر الحلقة / المجموعة التعليمية</label>
                  <select
                    value={selectedGroupIdForComp}
                    onChange={(e) => setSelectedGroupIdForComp(e.target.value)}
                    className="field field-select text-sm"
                  >
                    <option value="">-- اختر حلقة --</option>
                    {allGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedGroupIdForComp && (
                  <div className="p-4 rounded-2xl bg-bg-alt/70 border border-line text-xs space-y-1">
                    <p className="font-bold text-ink">
                      إجمالي طلاب هذه المجموعة:{" "}
                      <span className="text-brand-ink text-sm">{matchingGroupStudentsCount}</span> طالب
                    </p>
                    <p className="text-ink-mute">
                      سيتم إضافة جميع الطلاب المسجلين بالحلقة تلقائياً وتخطي من تم إضافته سابقاً.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-line">
                  <Button variant="outline" onClick={() => setShowAddParticipantModal(false)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => handleBulkAdd("group")}
                    disabled={!selectedGroupIdForComp || isBulkAdding}
                  >
                    {isBulkAdding ? <Spinner size={16} /> : `إضافة طلاب المجموعة بالكامل (${matchingGroupStudentsCount})`}
                  </Button>
                </div>
              </div>
            )}

            {/* طريقة 3: بالحرف الأول */}
            {participantMode === "letter" && (
              <div className="space-y-4">
                <div>
                  <label className="field-label mb-2 block">
                    اضغط على الحرف المطلوب لإضافة كل من يبدأ اسمه به:
                  </label>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {ARABIC_ALPHABET.map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setSelectedLetterForComp(letter)}
                        className={`py-2 rounded-xl text-sm font-bold transition-all ${
                          selectedLetterForComp === letter
                            ? "bg-brand text-on-brand shadow-md scale-105"
                            : "bg-bg-alt text-ink-soft hover:bg-line"
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-bg-alt/70 border border-line text-xs space-y-1">
                  <p className="font-bold text-ink">
                    الحرف المختار: <span className="text-brand-ink text-base">({selectedLetterForComp})</span>
                  </p>
                  <p className="text-ink-soft font-semibold">
                    وجدنا <span className="font-black text-brand-ink text-sm">{matchingLetterStudentsCount}</span> طالب يبدأ اسمهم بهذا الحرف بالمدرسة.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-line">
                  <Button variant="outline" onClick={() => setShowAddParticipantModal(false)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => handleBulkAdd("letter")}
                    disabled={!selectedLetterForComp || matchingLetterStudentsCount === 0 || isBulkAdding}
                  >
                    {isBulkAdding ? <Spinner size={16} /> : `إضافة كل طلاب حرف (${selectedLetterForComp})`}
                  </Button>
                </div>
              </div>
            )}

            {/* طريقة 4: كل الطلاب */}
            {participantMode === "all" && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-brand/15 text-brand-ink flex items-center justify-center mx-auto mb-2">
                  <Users size={32} />
                </div>
                <h4 className="font-black text-lg text-ink">إضافة جميع طلاب المدرسة</h4>
                <p className="text-xs text-ink-mute max-w-sm mx-auto leading-relaxed">
                  سيتم إدراج جميع طلاب المدرسة النشطين (إجمالي: {allStudents.length} طالب) في هذه المسابقة دفعة واحدة وتخطي الطلاب المضافين مسبقاً.
                </p>

                <div className="flex justify-center gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddParticipantModal(false)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => handleBulkAdd("all")}
                    disabled={isBulkAdding}
                    className="bg-brand text-on-brand font-bold"
                  >
                    {isBulkAdding ? <Spinner size={16} /> : `تأكيد إضافة كل الطلاب (${allStudents.length})`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: رصد الدرجات السريع وبكل الطرق الميسرة للأدمن                       */}
      {/* ========================================================================= */}
      {showResultsModal && activeComp && (
        <div className="modal-overlay">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-float border border-line max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xl text-ink">رصد درجات المشاركين</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/15 text-brand-ink">
                    النهاية العظمى: {activeComp.max_score ?? 100}
                  </span>
                </div>
                <p className="text-xs text-ink-mute mt-0.5">
                  رصد مباشر وسريع باللوحة أو بالأزرار أو بنسخ كشف الدرجات
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPasteModal(true)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Upload size={14} />
                  <span>لصق درجات سريعة</span>
                </Button>

                <button
                  onClick={() => setShowResultsModal(false)}
                  className="icon-btn rounded-lg text-ink-mute hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar (درجات سريعة) */}
            <div className="p-3 rounded-2xl bg-bg-alt/80 border border-line mb-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-ink-mute">رصد سريع للباقين:</span>
                {[100, 95, 90, 85, 80, 75, 50, 0].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => applyScoreToEntries(sc, true)}
                    className="px-2 py-1 rounded-lg bg-surface hover:bg-line border border-line text-ink font-bold transition-colors"
                  >
                    {sc === 0 ? "غائب (0)" : sc}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyScoreToEntries(activeComp.max_score ?? 100, false)}
                  className="text-brand-ink hover:underline font-bold"
                >
                  تطبيق {activeComp.max_score ?? 100} للكل
                </button>
              </div>
            </div>

            {/* Filter and Search inside grading */}
            <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
              <div className="relative flex-1 max-w-xs">
                <Search
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none"
                />
                <input
                  value={resultsSearchQuery}
                  onChange={(e) => setResultsSearchQuery(e.target.value)}
                  placeholder="بحث عن طالب في كشف الرصد..."
                  className="field py-1.5 pr-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setResultsFilterStatus("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    resultsFilterStatus === "all" ? "bg-brand text-on-brand" : "text-ink-mute hover:text-ink"
                  }`}
                >
                  الكل ({resultsEntries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setResultsFilterStatus("recorded")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    resultsFilterStatus === "recorded" ? "bg-brand text-on-brand" : "text-ink-mute hover:text-ink"
                  }`}
                >
                  تم رصدهم ({resultsEntries.filter((e) => e.score > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setResultsFilterStatus("unrecorded")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    resultsFilterStatus === "unrecorded" ? "bg-brand text-on-brand" : "text-ink-mute hover:text-ink"
                  }`}
                >
                  غير مرصودين ({resultsEntries.filter((e) => !e.score || e.score === 0).length})
                </button>
              </div>
            </div>

            {/* List of Entries */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {resultsEntries
                .filter((entry) => {
                  const st = allStudents.find((s) => s.id === entry.studentId);
                  const matchesSearch =
                    !resultsSearchQuery ||
                    st?.name?.toLowerCase().includes(resultsSearchQuery.toLowerCase()) ||
                    (st?.national_id && st.national_id.includes(resultsSearchQuery));
                  if (!matchesSearch) return false;

                  if (resultsFilterStatus === "recorded") return entry.score > 0;
                  if (resultsFilterStatus === "unrecorded") return !entry.score || entry.score === 0;
                  return true;
                })
                .map((entry, idx) => {
                  const st = allStudents.find((s) => s.id === entry.studentId);
                  const max = activeComp.max_score ?? 100;
                  const pct = Math.round((Number(entry.score) / max) * 100);

                  let badgeInfo = { label: "مشاركة", color: "text-ink-mute bg-bg-alt" };
                  if (pct >= 95) badgeInfo = { label: "وسام ذهبي 🏆", color: "text-amber-600 bg-amber-500/15" };
                  else if (pct >= 85) badgeInfo = { label: "وسام فضي 🥈", color: "text-sky-600 bg-sky-500/15" };
                  else if (pct >= 75) badgeInfo = { label: "وسام برونزي 🥉", color: "text-amber-700 bg-amber-700/15" };
                  else if (pct >= 50) badgeInfo = { label: "ناجح 🌸", color: "text-emerald-600 bg-emerald-500/15" };

                  return (
                    <div
                      key={entry.studentId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-bg-alt/60 hover:bg-bg-alt transition-colors border border-line"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs text-ink-mute font-mono">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-ink">{st?.name || entry.studentId}</p>
                          <p className="text-[11px] font-mono text-ink-mute">{st?.national_id || "بدون رقم قومي"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Live celebration badge preview */}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeInfo.color}`}>
                          {badgeInfo.label} ({pct}%)
                        </span>

                        {/* Score Presets for this specific row */}
                        <div className="flex items-center gap-1">
                          {[max, Math.round(max * 0.95), Math.round(max * 0.85), 0].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                setResultsEntries((prev) =>
                                  prev.map((it) => (it.studentId === entry.studentId ? { ...it, score: val } : it))
                                );
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-surface hover:bg-line border border-line text-ink-soft font-bold"
                            >
                              {val === 0 ? "0" : val}
                            </button>
                          ))}
                        </div>

                        {/* Input */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={max}
                            value={entry.score}
                            onChange={(e) => {
                              const val = Math.min(max, Math.max(0, Number(e.target.value)));
                              setResultsEntries((prev) =>
                                prev.map((it) => (it.studentId === entry.studentId ? { ...it, score: val } : it))
                              );
                            }}
                            className="field w-20 text-center py-1 font-black text-sm"
                          />
                          <span className="text-xs text-ink-mute">/ {max}</span>
                        </div>

                        {/* Note Input */}
                        <input
                          type="text"
                          placeholder="ملاحظة..."
                          value={entry.notes || ""}
                          onChange={(e) => {
                            const note = e.target.value;
                            setResultsEntries((prev) =>
                              prev.map((it) => (it.studentId === entry.studentId ? { ...it, notes: note } : it))
                            );
                          }}
                          className="field w-32 py-1 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 pt-4 border-t border-line mt-4 shrink-0">
              <span className="text-xs text-ink-mute">
                سيتم احتساب الترتيب تلقائياً وتفعيل شاشات التهنئة للطلاب بالرقم القومي.
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowResultsModal(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveResults} className="bg-brand text-on-brand font-bold">
                  حفظ وإعلان النتائج للطلاب 🏆
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: لصق درجات سريعة من إكسل                                            */}
      {/* ========================================================================= */}
      {showPasteModal && (
        <div className="modal-overlay">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-float border border-line">
            <h3 className="font-extrabold text-lg text-ink mb-2">لصق درجات المشاركين</h3>
            <p className="text-xs text-ink-mute mb-4 leading-relaxed">
              انسخ عمود الدرجات من شيت إكسل والصقه هنا، أو الصق عمودين (اسم الطالب أو الرقم القومي، والدرجة).
            </p>

            <textarea
              rows={8}
              value={pastedScoresText}
              onChange={(e) => setPastedScoresText(e.target.value)}
              placeholder={`مثال لصق مباشر:\n100\n95\n92\n\nأو:\nأحمد محمد\t98\nمحمود علي\t95`}
              className="field font-mono text-xs resize-none"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-line mt-3">
              <Button variant="outline" onClick={() => setShowPasteModal(false)}>
                إلغاء
              </Button>
              <Button onClick={handleApplyPastedScores} disabled={!pastedScoresText.trim()}>
                تطبيق الدرجات الملصوقة
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: رصد امتحان جديد للمجموعة (Edu Groups)                             */}
      {/* ========================================================================= */}
      {showAddExamModal && (
        <div className="modal-overlay">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-float border border-line max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg text-ink mb-4">رصد امتحان جديد للمجموعة</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">اسم الامتحان *</label>
                  <input
                    required
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    className="field"
                    placeholder="مثال: امتحان أحكام النون الساكنة"
                  />
                </div>
                <div>
                  <label className="field-label">النهاية العظمى *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={examForm.maxScore}
                    onChange={(e) =>
                      setExamForm({ ...examForm, maxScore: Number(e.target.value) })
                    }
                    className="field font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">تاريخ الامتحان</label>
                <input
                  type="date"
                  required
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  className="field"
                />
              </div>

              <div className="pt-2">
                <label className="field-label mb-2 block">رصد درجات طلاب المجموعة:</label>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {examForm.scores.map((sc, i) => {
                    const st = activeEduGroupStudents.find((s) => s.id === sc.studentId);
                    return (
                      <div
                        key={sc.studentId}
                        className="flex items-center justify-between gap-3 bg-bg-alt/70 p-2.5 rounded-xl"
                      >
                        <span className="text-sm font-bold text-ink">{st?.name}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={examForm.maxScore}
                            value={sc.score}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setExamForm((prev) => ({
                                ...prev,
                                scores: prev.scores.map((s, idx) =>
                                  idx === i ? { ...s, score: val } : s
                                ),
                              }));
                            }}
                            className="field w-20 text-center py-1 font-bold"
                          />
                          <span className="text-xs text-ink-mute">/ {examForm.maxScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddExamModal(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">تسجيل الامتحان والدرجات</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
