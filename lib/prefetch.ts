import type { AuthUser } from "@/types";
import {
  studentsApi, groupsApi, eduGroupsApi, teachersApi, competitionsApi, blogApi, mediaApi,
  teacherProfilesApi, salariesApi, paymentsApi, settingsApi, contactApi, reportsApi,
  attendanceApi, memorizationApi, examsApi, filesVaultApi,
} from "@/lib/resources";
import { prefetchData } from "@/hooks/useData";

// ============================================================================
// تسخين الكاش الفوري: أول ما الموقع يفتح أو المستخدم يسجّل دخول، بنبعت طلبات كل صفحات لوحته
// وتتخزن في الكاش المتزامن — فأي صفحة يدخلها تفتح على Frame 0 بدون لودر ولا انتظار.
// ============================================================================

const currentMonthKey = () => new Date().toISOString().slice(0, 7);

/** الصفحات اللي كل دور بيستخدمها — بنحمّل كودها مقدمًا */
export const ROLE_ROUTES: Record<string, string[]> = {
  admin: [
    "/dashboard/admin",
    "/dashboard/admin/students",
    "/dashboard/admin/waiting",
    "/dashboard/admin/teachers",
    "/dashboard/admin/groups",
    "/dashboard/admin/attendance",
    "/dashboard/admin/payments",
    "/dashboard/admin/salaries",
    "/dashboard/admin/competitions",
    "/dashboard/admin/content",
    "/dashboard/admin/messages",
    "/dashboard/admin/settings",
    "/dashboard/admin/files",
  ],
  teacher: [
    "/dashboard/teacher",
    "/dashboard/teacher/students",
    "/dashboard/teacher/attendance",
    "/dashboard/teacher/memorization",
    "/dashboard/teacher/edu-groups",
    "/dashboard/teacher/salary",
  ],
  student: [
    "/dashboard/student",
    "/dashboard/student/attendance",
    "/dashboard/student/memorization",
    "/dashboard/student/payments",
  ],
};

/** الطلبات الحيوية التي تبدأ فورًا عند تسجيل الدخول */
function essentialCalls(user: AuthUser): Promise<unknown>[] {
  const month = currentMonthKey();
  if (user.role === "admin") {
    return [
      prefetchData(`admin:dashboard:${month}`, () => reportsApi.dashboard(month)),
      prefetchData("admin:messages:unread", () => contactApi.listForAdmin("unread")),
      prefetchData("admin:students", () => studentsApi.list()),
      prefetchData("admin:teachers", () => teachersApi.list()),
    ];
  }
  if (user.role === "teacher") {
    return [
      prefetchData("teacher:students", () => studentsApi.listMine()),
      prefetchData("teacher:groups", () => groupsApi.mine()),
    ];
  }
  const id = user.studentId;
  return id
    ? [
        prefetchData(`student:report:${id}`, () => reportsApi.student(id)),
        prefetchData(`student:attendance:${id}`, () => attendanceApi.byStudent(id)),
      ]
    : [];
}

/** باقي البيانات تتحمل في الخلفية بسلاسة بدون إجهاد */
function backgroundCalls(user: AuthUser): (() => Promise<unknown>)[] {
  const month = currentMonthKey();
  if (user.role === "admin") {
    return [
      () => prefetchData("admin:groups", () => groupsApi.list()),
      () => prefetchData("admin:eduGroups", () => eduGroupsApi.list()),
      () => prefetchData("admin:students:waiting", () => studentsApi.listWaiting()),
      () => prefetchData("admin:messages:all", () => contactApi.listForAdmin()),
      () => prefetchData(`admin:payments:${month}`, () => paymentsApi.summary(month)),
      () => prefetchData(`admin:salaries:${month}`, () => salariesApi.byMonth(month)),
      () => prefetchData("admin:salaries:teachers", () => salariesApi.teachers()),
      () => prefetchData("admin:competitions", () => competitionsApi.list()),
      () => prefetchData("admin:blog", () => blogApi.adminAll()),
      () => prefetchData("admin:media", () => mediaApi.adminAll()),
      () => prefetchData("admin:teacherProfiles", () => teacherProfilesApi.adminAll()),
      () => prefetchData("admin:settings", () => settingsApi.get()),
      () => prefetchData("admin:files", () => filesVaultApi.list()),
    ];
  }
  if (user.role === "teacher") {
    return [
      () => prefetchData("teacher:salary:me", () => salariesApi.me()),
      ...(user.username
        ? [() => prefetchData(`teacher:salary:history:${user.username}`, () => salariesApi.history(user.username!))]
        : []),
      ...(user.eduGroupId
        ? [
            () => prefetchData(`teacher:eduGroup:${user.eduGroupId}`, () => eduGroupsApi.byId(user.eduGroupId as string)),
            () => prefetchData(`teacher:exams:${user.eduGroupId}`, () => examsApi.findByEduGroup(user.eduGroupId as string)),
          ]
        : []),
    ];
  }
  const id = user.studentId;
  return id
    ? [
        () => prefetchData(`student:attendanceRate:${id}`, () => attendanceApi.rate(id)),
        () => prefetchData(`student:payments:${id}`, () => paymentsApi.byStudent(id)),
        () => prefetchData(`student:memorization:${id}`, () => memorizationApi.findByStudent(id)),
      ]
    : [];
}

const idle = (fn: () => void, timeout = 300) => {
  if (typeof window === "undefined") return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
    .requestIdleCallback;
  if (ric) ric(fn, { timeout });
  else window.setTimeout(fn, 100);
};

let warmedFor = "";

/** اطلب المهم فورًا، وكمّل الباقي في الخلفية. آمن تتنادى أكتر من مرة. */
export function prefetchForUser(user: AuthUser) {
  const sig = `${user.role}:${user.username}`;
  if (warmedFor === sig) return;
  warmedFor = sig;

  // إطلاق الحزمة الأساسية فوراً
  essentialCalls(user);

  // إطلاق الحزم الباقية على دفعات بدون تجميد المتصفح
  const rest = backgroundCalls(user);
  const BATCH = 3;
  const run = (i: number) => {
    if (i >= rest.length) return;
    rest.slice(i, i + BATCH).forEach((fn) => fn());
    idle(() => run(i + BATCH), 400);
  };
  idle(() => run(0), 400);
}

export function resetPrefetch() {
  warmedFor = "";
}

/** بيانات الموقع العام (المدونة، الوسائط، المعلمين) */
export function prefetchPublic() {
  idle(() => {
    prefetchData("public:blog", () => blogApi.list());
    prefetchData("public:media", () => mediaApi.list());
    prefetchData("public:teachers", () => teacherProfilesApi.list());
  }, 500);
}
