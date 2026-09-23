export type UserRole = "admin" | "teacher" | "student";

export interface AuthUser {
  role: UserRole;
  username: string;
  groupId?: string | null;
  eduGroupId?: string | null;
  studentId?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: "فوائد قرآنية" | "تجويد" | "تربية" | "أخبار المدرسة";
  author: string;
  cover_image?: string;
  published: boolean;
  published_at?: string;
  created_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  track: "تحفيظ" | "تفسير وتجويد" | "علوم شرعية" | "لغة عربية";
  level?: string;
  teacher_name?: string;
  is_live: boolean;
  published: boolean;
  created_at: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  photo_url?: string;
  specialty?: string;
  ijazahs: string[];
  bio?: string;
  display_order: number;
}

export interface Student {
  id: string;
  name: string;
  national_id: string;
  date_of_birth: string;
  age: number;
  phone?: string;
  memorized_amount: string;
  group_id: string;
  notes?: string;
  monthly_fee: number;
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

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  target: string;
  created_at: string;
  isRead?: boolean;
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
