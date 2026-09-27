import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // لوحة التحكم محمية بتسجيل دخول أصلًا — مفيش داعي تتفهرس أو تتزحف في جوجل
        disallow: ["/dashboard/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}