import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // صيغ أخف + كاش أطول للصور
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
  },
  experimental: {
    // بيستورد من المكتبات الكبيرة الأجزاء المستخدمة بس (حجم JS أقل)
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
