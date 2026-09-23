import { api } from "./api";
import {
  AuthUser, BlogPost, DashboardStats, LoginResponse, MediaItem,
  NotificationItem, Student, TeacherProfile,
} from "@/types";

// ============================================================================
// طبقة نداءات كل موديول من الباك إند — كل دالة هنا بتقابل endpoint حقيقي
// ============================================================================

export const authApi = {
  login: (role: string, username: string, password?: string) =>
    api.post<LoginResponse>("/auth/login", { role, username, password }),
  me: () => api.get<AuthUser>("/auth/me", undefined, true),
  logout: () => api.post("/auth/logout", undefined, true),
};

export const blogApi = {
  list: (category?: string) => api.get<BlogPost[]>("/blog", { category }),
  bySlug: (slug: string) => api.get<BlogPost>(`/blog/slug/${slug}`),
};

export const mediaApi = {
  list: (track?: string, level?: string) => api.get<MediaItem[]>("/media", { track, level }),
  one: (id: string) => api.get<MediaItem>(`/media/${id}`),
};

export const teacherProfilesApi = {
  list: () => api.get<TeacherProfile[]>("/teacher-profiles"),
  one: (id: string) => api.get<TeacherProfile>(`/teacher-profiles/${id}`),
};

export const contactApi = {
  submit: (body: { name: string; email: string; phone?: string; message: string }) =>
    api.post<{ message: string }>("/contact", body),
  listForAdmin: (status?: string) =>
    api.get<{ id: string; name: string; email: string; phone?: string; message: string; status: string; created_at: string }[]>(
      "/contact",
      { status },
      true,
    ),
};

export const studentsApi = {
  byId: (id: string) => api.get<Student>(`/students/${id}`, undefined, true),
  byNationalId: (nationalId: string) => api.get<Student>(`/students/by-national-id/${nationalId}`),
  listMine: () => api.get<Student[]>("/students", undefined, true), // للمعلم/الأدمن
};

export const notificationsApi = {
  mine: () => api.get<NotificationItem[]>("/notifications/me", undefined, true),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count", undefined, true),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`, undefined, true),
};

export const reportsApi = {
  dashboard: (monthKey?: string) => api.get<DashboardStats>("/reports/dashboard", { monthKey }, true),
  student: (id: string) => api.get<Student & { stats: any }>(`/reports/student/${id}`, undefined, true),
};

export const attendanceApi = {
  byStudent: (studentId: string, from?: string, to?: string) =>
    api.get<{ date: string; status: string }[]>(`/attendance/student/${studentId}`, { from, to }, true),
  rate: (studentId: string) => api.get<{ rate: number; present: number; total: number }>(`/attendance/rate/${studentId}`, undefined, true),
};
