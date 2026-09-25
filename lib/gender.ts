/**
 * تحديد نوع الطالب (شباب / بنات) بناءً على الرقم القومي والاسم
 * في الرقم القومي المصري المكون من 14 رقم:
 * الرقم قبل الأخير (الخانة 13): الفردي ذكر (شباب)، والزوجي أنثى (بنات)
 */
export function getStudentGender(student: {
  gender?: string | null;
  national_id?: string;
  name?: string;
}): "male" | "female" {
  if (student.gender === "female" || student.gender === "male") {
    return student.gender;
  }

  // فحص الرقم القومي المصري (14 رقم)
  const nid = student.national_id?.trim();
  if (nid && nid.length === 14) {
    const digit = parseInt(nid.charAt(12), 10);
    if (!isNaN(digit)) {
      return digit % 2 === 0 ? "female" : "male";
    }
  }

  // فحص الأسماء المؤنثة الشائعة
  const name = (student.name || "").trim();
  const firstWord = name.split(/\s+/)[0] || "";

  const femaleNames = new Set([
    "فاطمة", "مريم", "عائشة", "خديجة", "زينب", "سارة", "آية", "نور", "ملك",
    "حبيبة", "جنى", "سلمى", "هدى", "ندى", "ياسمين", "رحمة", "إسراء", "دعاء",
    "شيماء", "هاجر", "منة", "أمنية", "ميار", "روان", "شهد", "ريتاج", "بسملة",
    "إيمان", "نجلاء", "رنا", "ريهام", "هبة", "وفاء", "صفاء", "منى", "رشا",
    "سناء", "سمية", "أروى", "تسنيم", "سندس", "جود", "فريدة", "يارا", "رضوى",
    "أسماء", "أميرة", "سلوى", "نهى", "شروق", "بسمة", "عبير", "لمياء", "تقى",
    "إكرام", "ضحى", "بشرى", "أبرار", "سما", "رنيم", "جودي", "ليلى", "نوران",
  ]);

  if (femaleNames.has(firstWord) || (firstWord.endsWith("ة") && !["حمزة", "طلحة", "أسامة", "قتادة", "عكرمة", "عبيدة", "حذيفة"].includes(firstWord))) {
    return "female";
  }

  return "male";
}

export function getGenderLabel(gender: "male" | "female"): string {
  return gender === "female" ? "بنات" : "شباب";
}
