import type { Metadata } from "next";
import { Tajawal, Amiri } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
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

export const metadata: Metadata = {
  title: {
    default: "مدرسة التربية بالقرآن الكريم",
    template: "%s | مدرسة التربية بالقرآن الكريم",
  },
  description:
    "منصة تعليمية شاملة لتحفيظ القرآن الكريم والتفسير والتجويد والعلوم الشرعية واللغة العربية، مع متابعة مستمرة لتقدم الطلاب.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${amiri.variable}`}>
      <body className="bg-cream-50 text-emerald-950 antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
