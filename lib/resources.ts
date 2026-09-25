import { api } from "./api";
import {
  AuthUser,
  BlogPost,
  DashboardStats,
  LoginResponse,
  MediaItem,
  Student,
  TeacherProfile,
  GroupItem,
  EduGroupItem,
  AttendanceGroupRecord,
  ExamItem,
  CompetitionItem,
  TeacherSalaryConfig,
  SalaryMonthSummary,
  SchoolSettings,
  ActivityLogItem,
  ContactMessageItem,
  MemorizationEntry,
} from "@/types";

// ============================================================================
// طبقة نداءات كل موديول من الباك إند — تغطية شاملة 100% لكل مسارات الـ API (21 Module)
// ============================================================================

// 1. المصادقة والجلسة
export const authApi = {
  login: (role: string, username: string, password?: string) =>
    api.post<LoginResponse>("/auth/login", { role, username, password }),
  me: () => api.get<AuthUser>("/auth/me", undefined, true),
  logout: () => api.post("/auth/logout", undefined, true),
};

// 2. الطلاب
export const studentsApi = {
  list: (groupId?: string) => api.get<Student[]>("/students", { groupId }, true),
  listMine: () => api.get<Student[]>("/students", undefined, true),
  listWaiting: () => api.get<Student[]>("/students/waiting", undefined, true),
  byId: (id: string) => api.get<Student>(`/students/${id}`, undefined, true),
  byNationalId: (nationalId: string) => api.get<Student>(`/students/by-national-id/${nationalId}`),
  publicRegister: (body: {
    name: string; phone: string; nationalId: string; memorizedAmount: string; currentSurah: string;
  }) => api.post<{ message: string; studentId: string }>("/students/public-register", body),
  create: (body: {
    groupId?: string;
    name: string;
    nationalId: string;
    phone?: string;
    memorizedAmount?: string;
    currentSurah?: string;
    password?: string;
  }) => api.post<Student>("/students", body, true),
  update: (
    id: string,
    body: {
      name?: string;
      nationalId?: string;
      phone?: string;
      memorizedAmount?: string;
      currentSurah?: string;
      groupId?: string;
      parentName?: string;
    }
  ) => api.put<Student>(`/students/${id}`, body, true),
  remove: (id: string) => api.delete(`/students/${id}`, true),
  updateMonthlyFee: (id: string, fee: number) =>
    api.patch<Student>(`/students/${id}/monthly-fee`, { fee }, true),
  moveFromWaiting: (id: string, groupId: string) =>
    api.patch<Student>(`/students/${id}/move-to-group`, { groupId }, true),
};

// 2.5 المعلمين
export const teachersApi = {
  list: () => api.get<any[]>("/teachers", undefined, true),
  byId: (id: string) => api.get<any>(`/teachers/${id}`, undefined, true),
  me: () => api.get<any>("/teachers/me", undefined, true),
  create: (body: any) => api.post<any>("/teachers", body, true),
  update: (id: string, body: any) => api.put<any>(`/teachers/${id}`, body, true),
  setType: (id: string, type: "group" | "other") =>
    api.patch<{ id: string; teacher_type: "group" | "other"; message: string }>(
      `/teachers/${id}/type`,
      { type },
      true
    ),
  remove: (id: string) => api.delete(`/teachers/${id}`, true),
  assignToGroup: (teacherId: string, groupId: string) =>
    api.post<{ message: string }>(`/teachers/${teacherId}/assign/${groupId}`, undefined, true),
  removeFromGroup: (teacherId: string, groupId: string) =>
    api.delete(`/teachers/${teacherId}/assign/${groupId}`, true),
};

// 3. حلقات التحفيظ العادية
export const groupsApi = {
  list: () => api.get<GroupItem[]>("/groups", undefined, true),
  mine: () => api.get<GroupItem[]>("/groups/mine", undefined, true),
  byId: (id: string) => api.get<GroupItem>(`/groups/${id}`, undefined, true),
  create: (body: { name: string; teacherId?: string }) =>
    api.post<GroupItem>("/groups", body, true),
  update: (
    id: string,
    body: { name?: string; teacherId?: string }
  ) => api.put<GroupItem>(`/groups/${id}`, body, true),
  remove: (id: string) => api.delete(`/groups/${id}`, true),
};

// 4. المجموعات التربوية والتعليمية
export const eduGroupsApi = {
  list: () => api.get<EduGroupItem[]>("/edu-groups", undefined, true),
  byId: (id: string) => api.get<EduGroupItem>(`/edu-groups/${id}`, undefined, true),
  create: (body: {
    name: string;
    teacherName?: string;
    nationalId?: string;
    phone?: string;
    teacherUsername?: string;
    teacherPassword?: string;
  }) => api.post<EduGroupItem>("/edu-groups", body, true),
  update: (
    id: string,
    body: {
      name?: string;
      teacherName?: string;
      nationalId?: string;
      phone?: string;
      teacherUsername?: string;
      teacherPassword?: string;
    }
  ) => api.put<EduGroupItem>(`/edu-groups/${id}`, body, true),
  remove: (id: string) => api.delete(`/edu-groups/${id}`, true),
  addStudent: (eduGroupId: string, studentId: string) =>
    api.post<{ message: string }>(`/edu-groups/${eduGroupId}/students`, { studentId }, true),
  bulkAddStudents: (eduGroupId: string, studentIds: string[]) =>
    api.post<{ message: string; count: number }>(`/edu-groups/${eduGroupId}/students/bulk`, { studentIds }, true),
  removeStudent: (eduGroupId: string, studentId: string) =>
    api.delete(`/edu-groups/${eduGroupId}/students/${studentId}`, true),
};

// 5. الحضور والغياب (حلقات القرآن)
export const attendanceApi = {
  markOne: (studentId: string, date: string, status: string) =>
    api.post<{ message: string }>("/attendance", { studentId, date, status }, true),
  markBulk: (date: string, entries: { studentId: string; status: string }[]) =>
    api.post<{ message: string; count: number }>("/attendance/bulk", { date, entries }, true),
  byStudent: (studentId: string, from?: string, to?: string) =>
    api.get<{ date: string; status: string }[]>("/attendance/student/" + studentId, { from, to }, true),
  byGroup: (groupId: string, date: string) =>
    api.get<AttendanceGroupRecord[]>(`/attendance/group/${groupId}`, { date }, true),
  rate: (studentId: string) =>
    api.get<{ rate: number; present: number; total: number }>(`/attendance/rate/${studentId}`, undefined, true),
};

// 6. الحضور والغياب (المجموعات التعليمية)
export const eduAttendanceApi = {
  record: (eduGroupId: string, date: string, records: { studentId: string; status: string }[]) =>
    api.post<{ message: string }>(`/edu-attendance/${eduGroupId}`, { date, records }, true),
  find: (eduGroupId: string, date?: string, studentId?: string) =>
    api.get<{ student_id: string; date: string; status: string }[]>(
      `/edu-attendance/${eduGroupId}`,
      { date, studentId },
      true
    ),
};

// 7. سجل التسميع والحفظ
export const memorizationApi = {
  findByStudent: (studentId: string) =>
    api.get<MemorizationEntry[]>(`/memorization/${studentId}`, undefined, true),
  create: (
    studentId: string,
    body: { date: string; addedAmount: string; totalAfter: string; teacherNote?: string }
  ) => api.post<MemorizationEntry>(`/memorization/${studentId}`, body, true),
  update: (
    studentId: string,
    entryId: string,
    body: { date?: string; addedAmount?: string; totalAfter?: string; teacherNote?: string }
  ) => api.put<MemorizationEntry>(`/memorization/${studentId}/${entryId}`, body, true),
  remove: (studentId: string, entryId: string) =>
    api.delete(`/memorization/${studentId}/${entryId}`, true),
};

// 8. الاشتراكات والمدفوعات
export const paymentsApi = {
  byStudent: (studentId: string) =>
    api.get<{ monthlyFee: number; months: Record<string, { status: "paid" | "unpaid" | "exempt"; amount?: number; paidDate?: string; note?: string }> }>(
      `/payments/student/${studentId}`,
      undefined,
      true
    ),
  updateMonth: (
    studentId: string,
    monthKey: string,
    body: { status: "paid" | "unpaid" | "exempt"; amount?: number; paidDate?: string; note?: string }
  ) => api.patch<any>(`/payments/student/${studentId}/month/${monthKey}`, body, true),
  summary: (monthKey: string) =>
    api.get<{ paid: number; unpaid: number; exempt: number; total: number; totalAmount: number }>(
      `/payments/summary/${monthKey}`,
      undefined,
      true
    ),
  byGroup: (groupId: string, monthKey: string) =>
    api.get<
      { student_id: string; student_name: string; status: "paid" | "unpaid" | "exempt"; amount?: number; paid_date?: string }[]
    >(`/payments/group/${groupId}/${monthKey}`, undefined, true),
};

// 9. الامتحانات
export const examsApi = {
  findByEduGroup: (eduGroupId: string) =>
    api.get<ExamItem[]>(`/exams/${eduGroupId}`, undefined, true),
  create: (
    eduGroupId: string,
    body: { name: string; maxScore: number; date: string; scores: { studentId: string; score: number }[] }
  ) => api.post<ExamItem>(`/exams/${eduGroupId}`, body, true),
  update: (
    eduGroupId: string,
    examId: string,
    body: { name?: string; maxScore?: number; date?: string; scores?: { studentId: string; score: number }[] }
  ) => api.put<{ message: string }>(`/exams/${eduGroupId}/${examId}`, body, true),
  remove: (eduGroupId: string, examId: string) =>
    api.delete(`/exams/${eduGroupId}/${examId}`, true),
};

// 10. المسابقات
export const competitionsApi = {
  list: () => api.get<CompetitionItem[]>("/competitions", undefined, true),
  byId: (id: string) => api.get<CompetitionItem>(`/competitions/${id}`, undefined, true),
  create: (body: { name: string; description?: string; year: string }) =>
    api.post<CompetitionItem>("/competitions", body, true),
  update: (id: string, body: { name?: string; description?: string; year?: string }) =>
    api.put<CompetitionItem>(`/competitions/${id}`, body, true),
  remove: (id: string) => api.delete(`/competitions/${id}`, true),
  addParticipant: (competitionId: string, studentId: string) =>
    api.post<{ message: string }>(`/competitions/${competitionId}/participants`, { studentId }, true),
  removeParticipant: (competitionId: string, studentId: string) =>
    api.delete(`/competitions/${competitionId}/participants/${studentId}`, true),
  saveResults: (
    competitionId: string,
    results: { studentId: string; score: number; rank?: number; notes?: string }[]
  ) => api.put<{ message: string; results: any[] }>(`/competitions/${competitionId}/results`, { results }, true),
};

// 11. الرواتب
export const salariesApi = {
  teachers: () => api.get<TeacherSalaryConfig[]>("/salaries/teachers", undefined, true),
  oneTeacher: (username: string) => api.get<TeacherSalaryConfig>(`/salaries/teacher/${username}`, undefined, true),
  me: () => api.get<{ username: string; base_salary: number; notes?: string }>("/salaries/me", undefined, true),
  setConfig: (username: string, body: { baseSalary: number; notes?: string }) =>
    api.put<TeacherSalaryConfig>(`/salaries/teacher/${username}/config`, body, true),
  history: (username: string) =>
    api.get<any[]>(`/salaries/teacher/${username}/history`, undefined, true),
  byMonth: (monthKey: string) =>
    api.get<SalaryMonthSummary>(`/salaries/month/${monthKey}`, undefined, true),
  setMonth: (
    username: string,
    monthKey: string,
    body: { status: "paid" | "unpaid" | "advance"; amount: number; paidDate?: string; note?: string; paidBy?: string }
  ) => api.put<any>(`/salaries/teacher/${username}/month/${monthKey}`, body, true),
  deleteMonth: (username: string, monthKey: string) =>
    api.delete(`/salaries/teacher/${username}/month/${monthKey}`, true),
};

// 12. التقارير
export const reportsApi = {
  dashboard: (monthKey?: string) => api.get<DashboardStats>("/reports/dashboard", { monthKey }, true),
  student: (id: string) => api.get<Student & { stats: any }>(`/reports/student/${id}`, undefined, true),
};

// 13. إعدادات المدرسة
export const settingsApi = {
  get: () => api.get<SchoolSettings>("/settings", undefined, true),
  update: (body: {
    schoolName?: string;
    schoolPhone?: string;
    schoolAddress?: string;
    monthlyFee?: number;
    adminPassword?: string;
  }) => api.patch<SchoolSettings>("/settings", body, true),
};

// 14. سجل الحركات والنشاطات
export const activityLogApi = {
  list: (params?: { role?: string; username?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    api.get<{ data: ActivityLogItem[]; total: number; page: number; limit: number }>("/activity-log", params, true),
};


// 16. المدونة
export const blogApi = {
  list: (category?: string) => api.get<BlogPost[]>("/blog", { category }),
  bySlug: (slug: string) => api.get<BlogPost>(`/blog/slug/${slug}`),
  adminAll: () => api.get<BlogPost[]>("/blog/admin/all", undefined, true),
  create: (body: {
    title: string;
    content: string;
    excerpt?: string;
    category: string;
    author?: string;
    coverImage?: string;
    published?: boolean;
  }) => api.post<BlogPost>("/blog", body, true),
  update: (
    id: string,
    body: {
      title?: string;
      content?: string;
      excerpt?: string;
      category?: string;
      author?: string;
      coverImage?: string;
      published?: boolean;
    }
  ) => api.put<BlogPost>(`/blog/${id}`, body, true),
  remove: (id: string) => api.delete(`/blog/${id}`, true),
};

// 17. مكتبة الوسائط
export const mediaApi = {
  list: (track?: string, level?: string) => api.get<MediaItem[]>("/media", { track, level }),
  one: (id: string) => api.get<MediaItem>(`/media/${id}`),
  adminAll: () => api.get<MediaItem[]>("/media/admin/all", undefined, true),
  create: (body: {
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    track: string;
    level?: string;
    teacherName?: string;
    isLive?: boolean;
    published?: boolean;
  }) => api.post<MediaItem>("/media", body, true),
  update: (
    id: string,
    body: {
      title?: string;
      description?: string;
      videoUrl?: string;
      thumbnailUrl?: string;
      track?: string;
      level?: string;
      teacherName?: string;
      isLive?: boolean;
      published?: boolean;
    }
  ) => api.put<MediaItem>(`/media/${id}`, body, true),
  remove: (id: string) => api.delete(`/media/${id}`, true),
};

// 18. بروفايلات المعلمين
export const teacherProfilesApi = {
  list: () => api.get<TeacherProfile[]>("/teacher-profiles"),
  one: (id: string) => api.get<TeacherProfile>(`/teacher-profiles/${id}`),
  adminAll: () => api.get<TeacherProfile[]>("/teacher-profiles/admin/all", undefined, true),
  create: (body: {
    name: string;
    photoUrl?: string;
    specialty?: string;
    ijazahs?: string[];
    bio?: string;
    linkedUsername?: string;
    displayOrder?: number;
    published?: boolean;
  }) => api.post<TeacherProfile>("/teacher-profiles", body, true),
  update: (
    id: string,
    body: {
      name?: string;
      photoUrl?: string;
      specialty?: string;
      ijazahs?: string[];
      bio?: string;
      linkedUsername?: string;
      displayOrder?: number;
      published?: boolean;
    }
  ) => api.put<TeacherProfile>(`/teacher-profiles/${id}`, body, true),
  remove: (id: string) => api.delete(`/teacher-profiles/${id}`, true),
};

// 19. رسائل التواصل
export const contactApi = {
  submit: (body: { name: string; phone?: string; message: string }) =>
    api.post<{ message: string }>("/contact", body),
  listForAdmin: (status?: string) =>
    api.get<ContactMessageItem[]>("/contact", { status }, true),
  markRead: (id: string) => api.patch<ContactMessageItem>(`/contact/${id}/read`, undefined, true),
  remove: (id: string) => api.delete(`/contact/${id}`, true),
};

// 20. فحص الصحة
export const healthApi = {
  check: () => api.get<{ status: string; database: string; timestamp: string }>("/health"),
};

// 21. المساعد الذكي
export interface AssistantReply {
  reply: string;
  navigateTo: string | null;
}
export const assistantApi = {
  ask: (body: {
    message: string;
    history?: { role: "user" | "assistant"; text: string }[];
    role?: "guest" | "admin" | "teacher" | "student";
    currentPath?: string;
  }) => api.post<AssistantReply>("/assistant/ask", body),
};
