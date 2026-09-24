import type { AuthUser } from "@/types";
import {
  studentsApi, groupsApi, eduGroupsApi, teachersApi, competitionsApi, blogApi, mediaApi,
  teacherProfilesApi, salariesApi, paymentsApi, settingsApi, contactApi, reportsApi,
  attendanceApi, memorizationApi, examsApi,
} from "@/lib/resources";

// ============================================================================
// تسخين الكاش: أول ما الموقع يفتح أو المستخدم يسجّل دخول، بنبعت طلبات كل صفحات لوحته
// في الخلفية — فأي زر يتضغط بعد كده بيفتح فورًا من الكاش من غير تحميل.
// الطلبات هي نفس نداءات lib/resources.ts بالظبط (نفس الـ endpoints والبارامترز).
// ============================================================================

const silent = (p: Promise<unknown>) => p.catch(() => undefined);
const currentMonthKey = () => new Date().toISOString().slice(0, 7);

/** الصفحات اللي كل دور بيستخدمها — بنحمّل كودها مقدمًا كمان */
export const ROLE_ROUTES: Record<string, string[]> = {
  admin: [
    "/dashboard/admin", "/dashboard/admin/students", "/dashboard/admin/waiting", "/dashboard/admin/teachers", "/dashboard/admin/groups",
    "/dashboard/admin/attendance", "/dashboard/admin/payments", "/dashboard/admin/salaries",
    "/dashboard/admin/competitions", "/dashboard/admin/content", "/dashboard/admin/messages", "/dashboard/admin/settings",
  ],
  teacher: [
    "/dashboard/teacher", "/dashboard/teacher/students", "/dashboard/teacher/attendance",
    "/dashboard/teacher/memorization", "/dashboard/teacher/edu-groups", "/dashboard/teacher/salary",
  ],
  student: [
    "/dashboard/student", "/dashboard/student/attendance", "/dashboard/student/memorization", "/dashboard/student/payments",
  ],
};

/** المهم الأول (بيتنفّذ فورًا وبالتوازي) */
function essentialCalls(user: AuthUser): Promise<unknown>[] {
  if (user.role === "admin") {
    return [
      reportsApi.dashboard(currentMonthKey()),
      contactApi.listForAdmin("unread"),
    ];
  }
  if (user.role === "teacher") {
    return [studentsApi.listMine()];
  }
  const id = user.studentId;
  return id ? [reportsApi.student(id)] : [];
}

/** الباقي بيتحمّل في الخلفية على دفعات صغيرة (عشان ما نضغطش على الباك إند) */
function backgroundCalls(user: AuthUser): (() => Promise<unknown>)[] {
  const month = currentMonthKey();
  if (user.role === "admin") {
    return [
      () => studentsApi.list(),
      () => groupsApi.list(),
      () => eduGroupsApi.list(),
      () => teachersApi.list(),
      () => contactApi.listForAdmin(),
      () => paymentsApi.summary(month),
      () => salariesApi.byMonth(month),
      () => salariesApi.teachers(),
      () => competitionsApi.list(),
      () => blogApi.adminAll(),
      () => mediaApi.adminAll(),
      () => teacherProfilesApi.adminAll(),
      () => settingsApi.get(),
    ];
  }
  if (user.role === "teacher") {
    return [
      () => groupsApi.mine(),
      () => salariesApi.me(),
      ...(user.username ? [() => salariesApi.history(user.username)] : []),
      ...(user.eduGroupId
        ? [() => eduGroupsApi.byId(user.eduGroupId as string), () => examsApi.findByEduGroup(user.eduGroupId as string)]
        : []),
    ];
  }
  const id = user.studentId;
  return id
    ? [
        () => attendanceApi.byStudent(id),
        () => attendanceApi.rate(id),
        () => paymentsApi.byStudent(id),
        () => memorizationApi.findByStudent(id),
      ]
    : [];
}

const idle = (fn: () => void, timeout = 400) => {
  if (typeof window === "undefined") return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
    .requestIdleCallback;
  if (ric) ric(fn, { timeout });
  else window.setTimeout(fn, 120);
};

let warmedFor = "";

/** اطلب المهم فورًا، وكمّل الباقي في الخلفية. آمن تتنادى أكتر من مرة. */
export function prefetchForUser(user: AuthUser) {
  const sig = `${user.role}:${user.username}`;
  if (warmedFor === sig) return;
  warmedFor = sig;

  essentialCalls(user).forEach(silent);

  const rest = backgroundCalls(user);
  const BATCH = 3;
  const run = (i: number) => {
    if (i >= rest.length) return;
    rest.slice(i, i + BATCH).forEach((fn) => silent(fn()));
    idle(() => run(i + BATCH), 600);
  };
  idle(() => run(0), 800);
}

export function resetPrefetch() {
  warmedFor = "";
}

/** بيانات الموقع العام (الصفحات اللي بتتحمّل من المتصفح) */
export function prefetchPublic() {
  idle(() => {
    silent(blogApi.list());
    silent(mediaApi.list());
    silent(teacherProfilesApi.list());
  }, 1500);
}
