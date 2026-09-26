// ============================================================================
// قواعد التحقق (Validation) لكل الحقول في الموقع — بتشتغل مع مكوّن FormValidator.
// القواعد بتتحدد تلقائيًا من: نوع الحقل + الخصائص (required/min/max/pattern/minLength)
// + نص الـ label (مثلًا "الرقم القومي" → 14 رقم، "الهاتف" → رقم موبايل مصري، "رابط" → URL).
// ولو عايز تجبر قاعدة معينة أو تتخطى الحقل: حط على الحقل data-vrule="nid|phone|email|url|username|name|none"
// أو data-vskip (تخطي كامل) أو data-vrule="loose" (مطلوب فقط). وعشان تغيّر حد أدنى لكلمة المرور عدّل PASSWORD_MIN تحت.
// ============================================================================

export type FieldEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export const PASSWORD_MIN = 6;

const SKIP_TYPES = new Set(["hidden", "checkbox", "radio", "file", "submit", "button", "reset", "range", "color", "image", "search"]);

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** بيحوّل الأرقام العربية/الفارسية لأرقام إنجليزية عشان التحقق */
export function normalizeDigits(v: string): string {
  return v
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function isPhone(v: string) {
  const n = normalizeDigits(v).replace(/[\s\-().]/g, "").replace(/^(\+?20|0020)/, "0");
  // رقم مصري فقط: 01 + (0,1,2,5) + 8 أرقام = 11 رقم إجمالاً
  return /^01[0125]\d{8}$/.test(n);
}

export function isNationalId(v: string) {
  const n = normalizeDigits(v).trim();
  if (!/^\d{14}$/.test(n)) return false;
  // أول رقم 2 (مواليد 1900s) أو 3 (مواليد 2000s)
  if (n[0] !== "2" && n[0] !== "3") return false;
  // شهر صحيح 01-12
  const month = parseInt(n.substring(3, 5), 10);
  if (month < 1 || month > 12) return false;
  // يوم صحيح 01-31
  const day = parseInt(n.substring(5, 7), 10);
  if (day < 1 || day > 31) return false;
  // كود محافظة معروف
  const validGov = new Set(["01","02","03","04","11","12","13","14","15","16","17","18","19","21","22","23","24","25","26","27","28","29","31","32","33","34","35","88","99"]);
  return validGov.has(n.substring(7, 9));
}

/** الاسم الرباعي: 4 كلمات على الأقل، أحرف عربية فقط */
export function isEgyptianName(v: string) {
  const trimmed = v.trim();
  if (/[^\u0600-\u06FF\s]/.test(trimmed)) return false; // أحرف غير عربية
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts.length >= 4 && parts.every((p) => p.length >= 2);
}

export function isUrl(v: string) {
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** بيلاقي الـ label بتاع الحقل (الأقرب قبله في نفس المجموعة) */
export function findLabel(el: FieldEl): HTMLLabelElement | null {
  if (el.id) {
    const byFor = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(el.id)}"]`);
    if (byFor) return byFor;
  }
  let node: HTMLElement | null = el;
  for (let depth = 0; depth < 3 && node; depth++) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    const labels = Array.from(parent.children).filter((c): c is HTMLLabelElement => c.tagName === "LABEL");
    // آخر label بييجي قبل الحقل في ترتيب الصفحة
    const before = labels.filter((l) => l.compareDocumentPosition(node as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (before.length) return before[before.length - 1];
    node = parent;
  }
  return null;
}

export interface LabelInfo {
  raw: string;
  clean: string;
  starred: boolean;
  optional: boolean;
}

export function getLabelInfo(el: FieldEl): LabelInfo {
  const label = findLabel(el);
  const raw = (label?.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
  const starred = /\*\s*$/.test(raw) || /\*/.test(raw);
  const optional = /اختياري/.test(raw);
  const clean = raw
    .replace(/\([^)]*\)/g, "")
    .replace(/[*:؟?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { raw, clean, starred, optional };
}

function isSearchLike(el: FieldEl) {
  const ph = el.getAttribute("placeholder") || "";
  return el.getAttribute("type") === "search" || el.getAttribute("role") === "searchbox" || /^ابحث/.test(ph);
}

export function shouldValidate(el: FieldEl): boolean {
  if (el.disabled || (el as HTMLInputElement).readOnly) return false;
  if (el.hasAttribute("data-vskip") || el.closest("[data-vskip]")) return false;
  const type = (el as HTMLInputElement).type;
  if (el instanceof HTMLInputElement && SKIP_TYPES.has(type)) return false;
  if (isSearchLike(el)) return false;
  return true;
}

const num = (s: string | null | undefined) => (s === null || s === undefined || s === "" ? null : Number(s));

/** بيرجّع رسالة الخطأ (بالعربي) أو null لو الحقل سليم */
export function validateField(el: FieldEl): string | null {
  // خانات الاختيار: بس لو كانت required ومش متعلّم عليها
  if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
    if (el.disabled || el.hasAttribute("data-vskip")) return null;
    return el.required && !el.checked ? "هذا الخيار مطلوب" : null;
  }
  if (!shouldValidate(el)) return null;

  const info = getLabelInfo(el);
  const name = info.clean || el.getAttribute("placeholder") || "هذا الحقل";
  const type = el instanceof HTMLInputElement ? el.type : el.tagName.toLowerCase();
  const isPassword = type === "password";
  const value = isPassword ? el.value : el.value.trim();
  const rule = el.getAttribute("data-vrule") || "";
  if (rule === "none") return null;

  const required = el.required || (info.starred && !info.optional) || el.hasAttribute("data-vrequired");

  // ---------- فاضي ----------
  if (value === "") {
    if (!required) return null;
    if (el instanceof HTMLSelectElement || type === "date" || type === "month" || type === "time") {
      return /^اختر|^اختار/.test(name) ? `${name} مطلوب` : `من فضلك اختر ${name}`;
    }
    return `${name} مطلوب`;
  }

  // loose = تحقق من "مطلوب" بس من غير أي قواعد شكل (زي كلمة مرور تسجيل الدخول)
  if (rule === "loose") return null;

  // ---------- طول ----------
  const textEl = el as HTMLInputElement | HTMLTextAreaElement; // select مالوش minLength/maxLength (بترجع undefined)
  const minLen = textEl.minLength > 0 ? textEl.minLength : 0;
  const maxLen = textEl.maxLength > 0 ? textEl.maxLength : 0;
  if (minLen && value.length < minLen) return `${name} لازم يكون ${minLen} أحرف على الأقل`;
  if (maxLen && value.length > maxLen) return `${name} لا يزيد عن ${maxLen} حرف`;

  // ---------- بريد ----------
  if (type === "email" || rule === "email") {
    return isEmail(value) ? null : "اكتب بريدًا إلكترونيًا صحيحًا (مثال: name@email.com)";
  }

  // ---------- أرقام ----------
  if (type === "number") {
    const n = Number(normalizeDigits(value));
    if (Number.isNaN(n)) return `${name}: اكتب رقمًا صحيحًا`;
    const min = num(el.getAttribute("min"));
    const max = num(el.getAttribute("max"));
    if (min !== null && !Number.isNaN(min) && n < min) {
      return max !== null && !Number.isNaN(max) ? `${name} لازم يكون بين ${min} و ${max}` : `${name} لا يقل عن ${min}`;
    }
    if (max !== null && !Number.isNaN(max) && n > max) {
      return min !== null && !Number.isNaN(min) ? `${name} لازم يكون بين ${min} و ${max}` : `${name} لا يزيد عن ${max}`;
    }
    return null;
  }

  // ---------- تواريخ ----------
  if (type === "date" || type === "month") {
    const min = el.getAttribute("min");
    const max = el.getAttribute("max");
    if (min && value < min) return `${name} قبل التاريخ المسموح`;
    if (max && value > max) return `${name} بعد التاريخ المسموح`;
    return null;
  }

  // ---------- الرقم القومي ----------
  const isNid = rule === "nid" || (!rule && /الرقم القومي/.test(info.clean) && !isPassword);
  if (isNid) {
    const nv = normalizeDigits(value).trim();
    if (!/^\d+$/.test(nv)) return "الرقم القومي أرقام فقط";
    if (nv.length !== 14) return `الرقم القومي لازم يكون 14 رقم (المكتوب ${nv.length})`;
    if (nv[0] !== "2" && nv[0] !== "3") return "الرقم القومي غير صحيح (أول رقم لازم 2 أو 3)";
    const month = parseInt(nv.substring(3, 5), 10);
    if (month < 1 || month > 12) return "الرقم القومي غير صحيح (الشهر خاطئ)";
    const day = parseInt(nv.substring(5, 7), 10);
    if (day < 1 || day > 31) return "الرقم القومي غير صحيح (اليوم خاطئ)";
    const validGov = new Set(["01","02","03","04","11","12","13","14","15","16","17","18","19","21","22","23","24","25","26","27","28","29","31","32","33","34","35","88","99"]);
    if (!validGov.has(nv.substring(7, 9))) return "الرقم القومي غير صحيح (رمز المحافظة غير معروف)";
    return null;
  }

  // ---------- الهاتف ----------
  const isPhoneField = rule === "phone" || type === "tel" || (!rule && /هاتف|موبايل|جوال|تليفون/.test(info.clean));
  if (isPhoneField) {
    return isPhone(value) ? null : "رقم الهاتف غير صحيح — لازم يكون رقم مصري مثل: 01012345678";
  }

  // ---------- الروابط ----------
  const isUrlField = rule === "url" || type === "url" || (!rule && /^رابط/.test(info.clean));
  if (isUrlField) {
    return isUrl(value) ? null : "الرابط غير صحيح — لازم يبدأ بـ https://";
  }

  // ---------- كلمة المرور ----------
  if (isPassword) {
    const min = minLen || PASSWORD_MIN;
    return value.length >= min ? null : `كلمة المرور لازم تكون ${min} أحرف على الأقل`;
  }

  // ---------- اسم المستخدم ----------
  if (rule === "username" || (!rule && /اسم المستخدم/.test(info.clean))) {
    if (/\s/.test(value)) return "اسم المستخدم من غير مسافات";
    return value.length >= 3 ? null : "اسم المستخدم لازم يكون 3 أحرف على الأقل";
  }

  // ---------- الأسماء ----------
  const isNameField = rule === "name" || (!rule && /^(ال)?اسم (ال)?(طالب|ولي|معلم|شيخ|كامل)|^الاسم/.test(info.clean));
  if (isNameField && el instanceof HTMLInputElement) {
    if (/[^\u0600-\u06FF\s]/.test(value)) return `${name} لازم يكون بالعربي فقط بدون أرقام أو رموز`;
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 4) return `${name} لازم يكون رباعياً على الأقل (تم كتابة ${parts.length} ${parts.length === 1 ? "كلمة" : "كلمات"})`;
    if (parts.some((p) => p.length < 2)) return "كل جزء في الاسم لازم يكون حرفين على الأقل";
  }

  // ---------- pattern ----------
  const pattern = el instanceof HTMLInputElement ? el.pattern : "";
  if (pattern) {
    try {
      if (!new RegExp(`^(?:${pattern})$`).test(value)) return `${name}: الصيغة غير صحيحة`;
    } catch {
      /* pattern غير صالح — تجاهله */
    }
  }

  return null;
}

export function validateForm(form: HTMLFormElement): { el: FieldEl; message: string }[] {
  const errors: { el: FieldEl; message: string }[] = [];
  form.querySelectorAll<FieldEl>("input, textarea, select").forEach((el) => {
    const message = validateField(el);
    if (message) errors.push({ el, message });
  });
  return errors;
}
