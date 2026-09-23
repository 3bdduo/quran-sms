# 🕌 موقع مدرسة التربية بالقرآن الكريم — الفرونت إند

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion، متصل بالكامل بالباك إند
(NestJS) اللي بنيناه، بهوية بصرية بين الكريمي والأخضر، ودعم كامل لاتجاه RTL.

---

## ⚙️ التشغيل محليًا

```bash
npm install
cp .env.example .env.local   # وحطي فيه رابط الباك إند بتاعك
npm run dev
```

الموقع هيشتغل على `http://localhost:3000`.

**متغير البيئة المطلوب** (`.env.local`):
```
NEXT_PUBLIC_API_URL=https://quran-school-nest-js.vercel.app/api/v1
```

---

## 🗺️ خريطة الموقع الكاملة (Site Map)

### صفحات عامة (بدون تسجيل دخول)
| المسار | الوصف | مصدر البيانات |
|---|---|---|
| `/` | الصفحة الرئيسية — Hero، المميزات، معاينة المناهج، إحصائيات، معاينة المعلمين، آراء، معاينة المدونة، دعوة تسجيل | `GET /teacher-profiles`, `GET /blog` |
| `/about` | عن المدرسة — رسالة، رؤية، قيم | محتوى ثابت |
| `/curriculum` | تفاصيل المسارات التعليمية الأربعة | محتوى ثابت |
| `/teachers` | كل المعلمين ببروفايلاتهم | `GET /teacher-profiles` |
| `/blog` | كل المقالات مع فلترة حسب التصنيف | `GET /blog?category=` |
| `/blog/[slug]` | صفحة مقال فردي | `GET /blog/slug/:slug` |
| `/media` | مكتبة الفيديوهات والبث المباشر مع فلترة حسب المسار | `GET /media?track=` |
| `/contact` | نموذج تواصل معنا | `POST /contact` |
| `/register` | نموذج طلب تسجيل طالب جديد (يُرسل كطلب للإدارة) | `POST /contact` |
| `/login` | تسجيل الدخول (طالب / معلم / إدارة) | `POST /auth/login` |

### لوحات التحكم (محمية — محتاجة تسجيل دخول)
| المسار | لمين | المحتوى |
|---|---|---|
| `/dashboard` | أي مستخدم مسجل | إعادة توجيه تلقائي حسب الدور |
| `/dashboard/student` | الطالب | إجمالي الحفظ، نسبة الحضور، سجل التسميع، حالة الاشتراكات الشهرية، الإشعارات |
| `/dashboard/teacher` | المعلم | قائمة طلاب الحلقة، الإشعارات |
| `/dashboard/admin` | الإدارة | إحصائيات عامة، تحميل تقارير Word/Excel جاهزة، عدد رسائل التواصل غير المقروءة، الإشعارات |

الحماية بتشتغل على مستويين: `middleware.ts` (فحص أولي سريع للتوكن ومطابقة الدور مع المسار)، والباك إند نفسه (الحماية الحقيقية والنهائية في كل endpoint).

---

## 🎨 الهوية البصرية

- **الألوان**: تدرج بين الكريمي (`cream-50` إلى `cream-900`) والأخضر (`emerald-50` إلى `emerald-950`)، مع لمسة ذهبية (`gold-400/500`) للتفاصيل.
- **الخطوط**: [Tajawal](https://fonts.google.com/specimen/Tajawal) للنصوص العامة، [Amiri](https://fonts.google.com/specimen/Amiri) للنصوص القرآنية/الكلاسيكية (`.quran-text`)، محمّلين عبر `next/font/google` (بدون طلبات خارجية بطيئة).
- **الحركة**: Framer Motion لحركات دخول ناعمة (fade/slide) عند التمرير، بدون مبالغة.
- **الأيقونات**: [Lucide React](https://lucide.dev) — مكتبة أيقونات SVG خفيفة وسريعة (tree-shakeable).
- **الصور**: `next/image` في كل مكان — تحسين وتحميل كسول (lazy loading) تلقائي من Next.js نفسه.

---

## 📁 بنية المشروع

```
app/
  layout.tsx              الـ layout الرئيسي (خطوط، RTL، Providers)
  globals.css              نظام الألوان والخطوط
  (site)/                  مجموعة الصفحات العامة (بها Header + Footer)
    page.tsx                الرئيسية
    about/ curriculum/ teachers/ blog/ blog/[slug]/ media/ contact/ register/ login/
  dashboard/                لوحات التحكم المحمية (layout خاص بيها)
    student/ teacher/ admin/
middleware.ts               حماية مسارات /dashboard
lib/
  api.ts                    عميل HTTP أساسي (fetch wrapper + توكن)
  resources.ts               دوال مطابقة لكل endpoint في الباك إند
  download.ts                 تحميل ملفات Word/Excel المحمية بتوكن
contexts/
  AuthContext.tsx             حالة تسجيل الدخول على مستوى التطبيق كله
components/
  ui/                        مكونات عامة (Button, Container, Loader, Toast...)
  sections/                   أقسام الصفحة الرئيسية والـ Header/Footer
  dashboard/                  مكونات لوحات التحكم (StatCard, NotificationsList)
types/                       أنواع TypeScript مطابقة لشكل بيانات الباك إند
```

---

## ⚠️ نواقص في الباك إند (لازم تتعرف عليها)

1. **لا يوجد تسجيل ذاتي مباشر للطلاب**: `POST /students` حاليًا مقصور على الأدمن/المعلم بس. صفحة `/register` حاليًا بترسل "طلب تسجيل" عن طريق `POST /contact` (نفس نظام رسائل التواصل)، والإدارة بعد كده بتنشئ حساب الطالب الحقيقي يدويًا من لوحة التحكم. لو عايزين تسجيل ذاتي حقيقي (يُنشئ حساب فورًا)، محتاجين endpoint جديد مخصص لكده.
2. **آراء أولياء الأمور (Testimonials)**: مفيش موديول لها في الباك إند، فحاليًا بيانات ثابتة (Static) في الكود. لو عايزين تتغير من لوحة التحكم، محتاجة موديول جديد بسيط زي `blog`.
3. **صفحة معلم فردية تفصيلية**: موجود `GET /teacher-profiles/:id` جاهز فعلًا في الباك إند، بس مبنيتش صفحة `/teachers/[id]` منفصلة في الفرونت إند دلوقتي (فقط شبكة عامة). سهل نضيفها لاحقًا لو حبيت.
4. **لوحة تحكم المعلم مبسّطة**: بتعرض قائمة الطلاب بس حاليًا. لو عايز المعلم يقدر يسجّل حضور/تسميع مباشرة من لوحة التحكم بدل النظام الإداري المنفصل، ده محتاج شاشات إضافية (الـ endpoints بتاعتها كلها جاهزة فعلًا في الباك إند — `POST /attendance`, `POST /memorization/:studentId`).

---

## 🚀 النشر على Vercel

1. ادفعي المشروع على GitHub repo منفصل عن الباك إند.
2. من Vercel: New Project → اختاري الـ repo → Framework Preset: **Next.js** (بيتكتشف أوتوماتيك، من غير أي تعديلات زي الباك إند).
3. ضيفي Environment Variable: `NEXT_PUBLIC_API_URL` = رابط الباك إند بتاعك + `/api/v1`.
4. Deploy.
5. ارجعي لمشروع الباك إند على Vercel وضيفي رابط الفرونت إند الجديد في متغير `CORS_ORIGINS` (وافصليه بفاصلة عن أي روابط تانية موجودة).
