export type UserRole = "admin" | "teacher" | "student";

export interface AuthUser {
  role: UserRole;
  username: string;
  teacherId?: string | null;
  teacherType?: "group" | "edu" | "other" | null;
  groupIds?: string[];
  groupId?: string | null; // For legacy
  eduGroupId?: string | null;
  studentId?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface Teacher {
  id: string;
  full_name: string;
  national_id: string;
  username: string;
  phone?: string;
  // نوع المعلم: "group" معلم حلقة (يقدر يكون عنده طلاب) — "other" معلم عادي (بدون طلاب) — null لسه محددش
  teacher_type?: "group" | "other" | null;
  groups?: { id: string; name: string }[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: "فوائد قرآنية" | "تجويد" | "تربية" | "أخبار المدرسة" | string;
  author: string;
  cover_image?: string;
  published: boolean;
  published_at?: string;
  created_at?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  track: "تحفيظ" | "تفسير وتجويد" | "علوم شرعية" | string;
  level?: string;
  teacher_name?: string;
  is_live: boolean;
  published: boolean;
  created_at?: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  photo_url?: string;
  specialty?: string;
  ijazahs: string[];
  bio?: string;
  linked_username?: string;
  display_order: number;
  published?: boolean;
}

export interface Student {
  id: string;
  name: string;
  national_id: string;
  date_of_birth: string;
  age: number;
  phone?: string;
  parent_name?: string;
  memorized_amount: string;
  current_surah: string;
  group_id: string;
  notes?: string;
  monthly_fee: number;
  is_waiting?: boolean;
  gender?: "male" | "female" | null;
  attendanceRecords?: { date: string; status: string }[];
  memorizationLog?: MemorizationEntry[];
  payment?: { monthlyFee: number; months: Record<string, PaymentMonth> };
}

export interface MemorizationEntry {
  id: string;
  date: string;
  added_amount: string;
  total_after: string;
  teacher_note?: string;
}

export interface PaymentMonth {
  status: "paid" | "unpaid" | "exempt";
  amount?: number;
  paidDate?: string;
  note?: string;
}

export interface GroupItem {
  id: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  teacherUsername?: string;
  studentsCount?: number;
  students?: Student[];
}

export interface EduGroupItem {
  id: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  teacherUsername: string;
  teacherNationalId?: string;
  teacherPhone?: string;
  studentsCount?: number;
  students?: {
    studentId: string;
    studentName?: string;
    studentNationalId?: string;
    studentPhone?: string;
    groupName?: string;
    gender?: "male" | "female" | string;
    attendanceRecords?: { date: string; status: string }[];
    examRecords?: { id: string; name: string; score: number; max_score: number; date: string }[];
  }[];
}

export interface AttendanceGroupRecord {
  student_id: string;
  student_name: string;
  status: string;
}

export interface ExamItem {
  examId: string;
  name: string;
  maxScore: number;
  date: string;
  results: { student_id: string; student_name?: string; score: number }[];
}

export interface CompetitionItem {
  id: string;
  name: string;
  description?: string;
  year: string;
  competition_type: "external" | "internal";
  max_score: number;
  participantsCount?: number;
  resultsPublished?: boolean;
  participants?: string[];
  results?: { student_id: string; score: number; rank: number; notes?: string }[];
}

export interface SingleCompetitionResult {
  competitionId: string;
  competitionName: string;
  competitionType: "external" | "internal";
  year: string;
  maxScore: number;
  score: number;
  rank: number;
  percentage: number;
  celebrationLevel: "gold" | "silver" | "bronze" | "pass" | "good";
  title: string;
  message: string;
  ayah: string;
  notes?: string;
}

export interface CompetitionPublicResult {
  hasResult: boolean;
  student: { id?: string; name: string; national_id?: string };
  competition?: { id: string; name: string; year: string; max_score: number; competition_type?: "external" | "internal" };
  result?: SingleCompetitionResult;
  results?: SingleCompetitionResult[];
}

export interface TeacherSalaryConfig {
  id?: string;
  username: string;
  full_name?: string;
  national_id?: string;
  base_salary: number;
  notes?: string;
}

export interface TeacherSalaryRecord {
  id?: string;
  username: string;
  full_name?: string;
  national_id?: string;
  baseSalary: number;
  incentiveAmount?: number;
  incentiveReason?: string;
  deductionAmount?: number;
  deductionReason?: string;
  netSalary?: number;
  status: "paid" | "unpaid" | "advance";
  amount: number;
  paidDate?: string;
  paidBy?: string;
  note?: string;
}

export interface SalaryMonthSummary {
  monthKey: string;
  totalTeachers: number;
  paidCount: number;
  unpaidCount: number;
  advanceCount: number;
  totalPaidAmount: number;
  teachers: TeacherSalaryRecord[];
}

export interface SchoolSettings {
  schoolName: string;
  schoolPhone: string;
  schoolAddress: string;
  monthlyFee: number;
  adminPassword?: string;
}

export interface ActivityLogItem {
  id: string;
  actor_role: string;
  actor_username: string;
  action: string;
  method?: string;
  path?: string;
  timestamp: string;
}

export interface ContactMessageItem {
  id: string;
  name: string;
  phone?: string;
  message: string;
  status: "unread" | "read";
  created_at: string;
}


export interface DashboardStats {
  totalGroups: number;
  totalEduGroups: number;
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  presentCount: number;
  totalAttendanceRecords: number;
  paidThisMonth: number;
}

// مركز الملفات والمستندات (Files Vault)
export type FileCategory =
  | "documents"
  | "spreadsheets"
  | "images"
  | "audio"
  | "archives"
  | "other";

export interface StoredFileItem {
  _id: string;
  name: string;
  original_name: string;
  mime_type: string;
  extension: string;
  category: FileCategory;
  size_bytes: number;
  gridfs_id: string;
  year: string;
  month: string;
  date_str: string;
  uploaded_by: string;
  download_count: number;
  is_public: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilesVaultFolderCategory {
  count: number;
  sizeBytes: number;
  years: Record<string, { count: number; months: Record<string, number> }>;
}

export interface FilesVaultData {
  files: StoredFileItem[];
  stats: {
    totalFiles: number;
    totalSizeBytes: number;
    totalDownloads: number;
  };
  foldersTree: Record<string, FilesVaultFolderCategory>;
}

export const FILE_CATEGORIES: {
  key: FileCategory;
  label: string;
  iconName: string;
  color: string;
  badge: string;
  border: string;
}[] = [
  {
    key: "documents",
    label: "المستندات والكتب",
    iconName: "FileText",
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    key: "spreadsheets",
    label: "الجداول والبيانات",
    iconName: "FileSpreadsheet",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  {
    key: "images",
    label: "الصور والوسائط",
    iconName: "Image",
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  {
    key: "audio",
    label: "التسجيلات والصوتيات",
    iconName: "Music",
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  {
    key: "archives",
    label: "الملفات المضغوطة",
    iconName: "Archive",
    color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  {
    key: "other",
    label: "ملفات أخرى",
    iconName: "Folder",
    color: "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800",
    badge: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-700",
  },
];
