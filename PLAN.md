# خطة المشروع — Familist (CPS Family Advocate)

> إعادة بناء الموقع الثابت (`design-source/familist-original.html`) إلى تطبيق حيّ بلوحة تحكم،
> على نفس معمارية **SoundHeart** (`~/Documents/soundheart`) ونفس استضافة GoDaddy cPanel.
> موعد التسليم (مستقل): **19 سبتمبر 2026**.

## القرارات المعتمدة
- **المعمارية**: React (Vite) SPA → Laravel 13 REST API → MySQL. Laravel يخدم الواجهة والـ API من نفس الدومين (بلا CORS).
  - السبب: الاستضافة مشتركة (PHP + MySQL، بلا Node)، وإعادة استخدام كود SoundHeart (المغلّف، المصادقة، المقالات، الإعدادات، Stripe، اللوحة).
- **الواجهة العامة**: CSS التصميم الأصلي يُنقل كما هو (`src/site/styles/familist-original.css` + `additions.css`) بنفس أسماء الكلاسات → مطابقة طبق الأصل بلا مخاطرة. Tailwind للوحة التحكم فقط.
- **الهوية**: نفس الألوان والخطوط الحالية (Playfair Display + DM Sans) كـ CSS variables — تُبدَّل من مكان واحد عند وصول الدرجات من العميل.
- **المحتوى الوهمي**: حذف عدّاد "Limited Availability". الشهادات/دراسات الحالة/فيديوهات الشهادات تُدار من اللوحة بمفتاح إظهار/إخفاء، **مخفية افتراضياً** حتى يضيف العميل محتوى حقيقياً.
- **Word**: لا يوجد ملف لـ Familist بعد → مستورد `.docx` داخل اللوحة (مقالات + حقول SEO + صور)، يُختبر على ملف SoundHeart.
- **SEO مع SPA**: Laravel يحقن `<title>`/meta/OG/JSON-LD/canonical لكل مسار (والمقالات تُحقن بمحتواها داخل `#root`)، مع `sitemap.xml` و`robots.txt` ديناميكيين.

## مطابقة طلبات العميل
| الطلب | التنفيذ |
|---|---|
| إعادة بناء الواجهة | React components بنفس الماركب/CSS الأصلي، مع إصلاح أخطاء المراجعة |
| لوحة تحكم لغير التقني | `/admin`: نصوص وصور الصفحة، المقالات، البودكاست، الأسعار، الشهادات، المنتجات، الأسئلة الشائعة، الإعدادات، الطلبات، العملاء المحتملون |
| استيراد Word | `POST /api/v1/admin/import/docx` — يقسّم المقالات، يستخرج Title/Meta/Keywords، يحفظ الصور |
| Stripe | Checkout Session من الخادم فقط (المفتاح السري في `.env`)، webhook موقّع يؤكد الدفع — الاستشارة $150 والتدريب $99 |
| واتساب/اتصال | من الإعدادات، زر عائم + روابط `tel:` |
| Spotify | حلقات البودكاست برابط Spotify → iframe embed |
| GA4 + كوكيز | Consent Mode v2 (رفض افتراضي)، لافتة قبول/رفض، معرّف GA4 من اللوحة |
| SSL | AutoSSL في cPanel + إجبار HTTPS و HSTS (`.htaccess` + middleware) |
| الألوان والخطوط | tokens في `:root` — تعديل مركزي |

## البنية
```
cpsfamilyadvocate/
├── backend-familist/          # Laravel 13 API (مشتق من backend-soundheart ومقلَّم)
├── frontend-react-familist/   # Vite + React 19 + TS
├── design-source/             # التصميم الأصلي (المصدر الوحيد للحقيقة)
└── deploy-package/            # (غير متتبَّع) حزمة الرفع لـ cPanel
```
المنافذ: الواجهة **3030** · الـ API **8035** · MySQL 3306 (قاعدة `familist`).

## نموذج البيانات
- `settings` (site / pricing / integrations) · `pages` (JSON: hero, sections, images, lists)
- `categories` · `articles` (+ `image_url`, `seo_title`)
- `podcast_episodes` · `testimonials` (kind: text | video | case_study، visible، sort)
- `faqs` · `products` · `orders` (consultation | training، حالة الدفع) · `leads` (أدلة مجانية/نشرة)

## المراحل
- [x] **1 — الخلفية** (13/9): هيكل Laravel، الهجرات، النماذج، الـ API العامة والإدارية، seeders من محتوى التصميم.
- [x] **2 — أساس الواجهة** (14/9): Vite/React، الخطوط، `lib/api`، الراوتر، CSS الأصلي.
- [x] **3 — الصفحة الرئيسية** (14–15/9): كل الأقسام + النوافذ (حجز، تدريب، أدلة) مربوطة بالـ API، مع معاينة ومقارنة بالأصل.
- [x] **4 — لوحة التحكم** (16/9): كل الشاشات أعلاه.
- [x] **5 — التكاملات** (17/9): Stripe + webhook، Spotify، GA4 + كوكيز، البريد، مستورد Word.
- [x] **6 — SEO والصفحات القانونية** (17/9): حقن meta، sitemap/robots، JSON-LD، الخصوصية/الشروط/إخلاء المسؤولية، المدونة والبودكاست.
- [~] **7 — الجودة والنشر** (18/9): ✓ اختبارات (18)، ✓ حزمة cPanel مجرَّبة محلياً، ✓ `.htaccess` + CSP بـ nonce، ✓ `DEPLOY-GUIDE.md` · ⏳ الرفع الفعلي وSSL ومفاتيح Stripe/SMTP، ثم التسليم (19/9).

## ما يحتاجه المشروع من العميل
- مفاتيح Stripe (secret + webhook secret) · معرّف GA4 · رابط برنامج Spotify · بيانات SMTP للبريد
- ملف Word الخاص بـ Familist · درجات الألوان/الخطوط إن تغيّرت · نصوص سياسة الخصوصية والشروط (أو اعتماد مسودة)

## ملاحظات نشر
- Laravel 13 يتطلب **PHP 8.3+** — تأكد من إصدار PHP للدومين في cPanel (MultiPHP Manager).
- لا تُرفع أي أسرار إلى المستودع — فقط `.env.example`. غيّر كلمة سر الأدمن بعد أول دخول.
- التثبيت بلا shell: Cron مؤقت يشغّل `php artisan familist:install` (آمن للتكرار) — التفاصيل في `DEPLOY-GUIDE.md`.
- قاعدة التطوير المحلية (SQLite) فيها مقالات SoundHeart مستوردة للاختبار فقط؛ لا تدخل في الحزمة.
