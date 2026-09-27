import type { MetadataRoute } from "next";
import { blogApi } from "@/lib/resources";
import { SITE_URL } from "@/lib/site";

// الصفحات العامة الثابتة بس — لوحة التحكم (/dashboard) محمية بتسجيل دخول أصلًا،
// فمش منطقي ولا مفيد إنها تتفهرس في جوجل (متمنوعة كمان في robots.ts).
const staticRoutes: {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/curriculum", priority: 0.8, changeFrequency: "monthly" },
  { path: "/teachers", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/media", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/register", priority: 0.9, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // مقالات المدونة بتتجاب من الباك إند وقت بناء السايت ماب.
  // لو الباك إند مش متاح لأي سبب، السايت ماب بيرجع بالصفحات الثابتة بس من غير ما يفشل الـ build.
  try {
    const posts = await blogApi.list();
    for (const post of posts) {
      if (!post.published) continue;
      entries.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.published_at || post.created_at || Date.now()),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // تجاهل — الصفحات الثابتة كفاية في الحالة دي
  }

  return entries;
}