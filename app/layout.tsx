import type { Metadata, Viewport } from "next";
import { Tajawal, Amiri, Aref_Ruqaa } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { MotionProvider } from "@/components/ui/MotionProvider";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal-var",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri-var",
  display: "swap",
});

// خط الرقعة — للعناوين الكبيرة فقط (font-ruqaa)
const ruqaa = Aref_Ruqaa({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-ruqaa-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مدرسة التربية بالقرآن الكريم",
    template: "%s | مدرسة التربية بالقرآن الكريم",
  },
  description:
    "منصة تعليمية شاملة لتحفيظ القرآن الكريم والتفسير والتجويد والعلوم الشرعية واللغة العربية، مع متابعة مستمرة لتقدم الطلاب.",
  applicationName: "مدرسة التربية بالقرآن الكريم",
  appleWebApp: { capable: true, title: "مدرسة التربية", statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
};

// viewport-fit=cover عشان الـ safe-area يشتغل صح في الآيفون والأندرويد (الـ notch وشريط الجيستشر)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// بيضبط المود قبل أول رسمة للصفحة — بيمنع الوميض (flash) الأبيض في الدارك مود
const themeInitScript = `(function(){try{var s=localStorage.getItem("qs-theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d){document.documentElement.classList.add("dark");}var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute("content",d?"#0d0b09":"#ecf0de");}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable} ${amiri.variable} ${ruqaa.variable}`}
    >
      <head>
        <meta name="theme-color" content="#ecf0de" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-bg text-ink antialiased">
        <MotionProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
