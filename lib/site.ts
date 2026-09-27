// رابط الموقع الأساسي (بدون / في الآخر) — بيتستخدم في السايت ماب، الـ robots، ومعاينة المشاركة (Open Graph).
// لازم تضيف القيمة الحقيقية في .env.local وفي إعدادات المتغيرات على Vercel:
//   NEXT_PUBLIC_SITE_URL=https://quran-sms.vercel.app/
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://quran-sms.vercel.app/").replace(/\/$/, "");