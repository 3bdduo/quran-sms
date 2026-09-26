// ============================================================================
// egyptianNid.ts — أداة تحليل الرقم القومي المصري واستخراج البيانات تلقائياً
// ============================================================================

export interface EgyptianNidData {
  century: number;
  year: number;
  month: number;
  day: number;
  birthDateFormatted: string; // مثال: "15 مايو 2001"
  birthDateIso: string;       // مثال: "2001-05-15"
  age: number;                // السن بالسنوات
  governorateCode: string;
  governorateName: string;    // اسم المحافظة بالعربية
  gender: "ذكر" | "أنثى";
  genderEnglish: "male" | "female";
}

export interface ParseNidResult {
  valid: boolean;
  error?: string;
  data?: EgyptianNidData;
}

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const GOVERNORATES_MAP: Record<string, string> = {
  "01": "القاهرة",
  "02": "الإسكندرية",
  "03": "بورسعيد",
  "04": "السويس",
  "11": "دمياط",
  "12": "الدقهلية",
  "13": "الشرقية",
  "14": "القليوبية",
  "15": "كفر الشيخ",
  "16": "الغربية",
  "17": "المنوفية",
  "18": "البحيرة",
  "19": "الإسماعيلية",
  "21": "الجيزة",
  "22": "بني سويف",
  "23": "الفيوم",
  "24": "المنيا",
  "25": "أسيوط",
  "26": "سوهاج",
  "27": "قنا",
  "28": "أسوان",
  "29": "الأقصر",
  "31": "البحر الأحمر",
  "32": "الوادي الجديد",
  "33": "مطروح",
  "34": "شمال سيناء",
  "35": "جنوب سيناء",
  "88": "مواليد خارج الجمهورية",
  "99": "حالات خاصة",
};

/**
 * تحليل الرقم القومي المصري واستخراج جميع البيانات (تاريخ الميلاد، السن، المحافظة، النوع)
 */
export function parseEgyptianNationalId(rawNid: string): ParseNidResult {
  const nid = (rawNid || "").replace(/\D/g, "").trim();

  if (nid.length !== 14) {
    return {
      valid: false,
      error: `الرقم القومي يتكون من 14 رقماً (تم إدخال ${nid.length} أرقام)`,
    };
  }

  const centuryCode = nid.charAt(0);
  if (centuryCode !== "2" && centuryCode !== "3") {
    return {
      valid: false,
      error: "الرقم القومي غير صحيح (أول رقم يجب أن يكون 2 أو 3)",
    };
  }

  const century = centuryCode === "2" ? 1900 : 2000;
  const yearStr = nid.substring(1, 3);
  const monthStr = nid.substring(3, 5);
  const dayStr = nid.substring(5, 7);

  const year = century + parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) {
    return { valid: false, error: "الرقم القومي غير صحيح (شهر الميلاد غير صالح)" };
  }

  if (day < 1 || day > 31) {
    return { valid: false, error: "الرقم القومي غير صحيح (يوم الميلاد غير صالح)" };
  }

  // التحقق من صحة اليوم داخل الشهر (مثلاً فبراير، الأشهر ذات الـ 30 يوماً)
  const testDate = new Date(year, month - 1, day);
  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== month - 1 ||
    testDate.getDate() !== day
  ) {
    return { valid: false, error: "تاريخ الميلاد المستخرج من الرقم القومي غير حقيقي" };
  }

  const govCode = nid.substring(7, 9);
  const governorateName = GOVERNORATES_MAP[govCode];
  if (!governorateName) {
    return { valid: false, error: "رمز المحافظة في الرقم القومي غير مسجل" };
  }

  // الرقم قبل الأخير يحدد النوع: فردي = ذكر، زوجي = أنثى
  const genderDigit = parseInt(nid.charAt(12), 10);
  const isMale = genderDigit % 2 !== 0;

  // حساب السن الدقيق
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }

  const birthDateFormatted = `${day} ${ARABIC_MONTHS[month - 1]} ${year}`;
  const birthDateIso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    valid: true,
    data: {
      century,
      year,
      month,
      day,
      birthDateFormatted,
      birthDateIso,
      age: Math.max(0, age),
      governorateCode: govCode,
      governorateName,
      gender: isMale ? "ذكر" : "أنثى",
      genderEnglish: isMale ? "male" : "female",
    },
  };
}

/**
 * توليد كلمة مرور عشوائية سهلة وقوية
 */
export function generateRandomPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pwd = "Q#";
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}
