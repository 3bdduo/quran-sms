import type { MetadataRoute } from "next";

// بيخلي الموقع يتثبّت على الشاشة الرئيسية بنفس الشكل في أندرويد وآيفون
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مدرسة التربية بالقرآن الكريم",
    short_name: "التربية بالقرآن",
    description: "منصة تعليمية شاملة لتحفيظ القرآن الكريم وعلومه",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#ecf0de",
    theme_color: "#ecf0de",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
