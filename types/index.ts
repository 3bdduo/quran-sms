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
  participantsCount?: number;
  resultsPublished?: boolean;
  participants?: string[];
  results?: { student_id: string; score: number; rank: number; notes?: string }[];
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
