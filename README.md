# Familist — CPS Family Advocate

الموقع الحيّ: https://www.cpsfamilyadvocate.com

تطبيق حيّ بلوحة تحكم، أُعيد بناؤه من التصميم الثابت الأصلي (`design-source/familist-original.html`)
على نفس معمارية مشروع SoundHeart: **React (Vite) → Laravel 13 REST API → MySQL**.

## البنية
```
cpsfamilyadvocate/
├── backend-familist/          # Laravel 13 API + يخدم الواجهة المبنية (SEO من الخادم)
├── frontend-react-familist/   # React 19 + TS — src/site (CSS التصميم الأصلي) و src/admin (Tailwind)
├── design-source/             # التصميم المعتمد — المصدر الوحيد للحقيقة
├── scripts/build-deploy.sh    # يبني deploy-package/familist-app.zip
├── PLAN.md                    # القرارات والمراحل
└── DEPLOY-GUIDE.md            # النشر على GoDaddy cPanel بلا SSH
```

## التشغيل المحلي

المنافذ: الواجهة **3030** · الـ API **8035** (قاعدة SQLite محلياً، MySQL في الإنتاج).

```bash
cd backend-familist
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
ADMIN_PASSWORD=choose-one php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8035
```

```bash
cd frontend-react-familist
npm install
npm run dev
```

افتح http://localhost:3030 · اللوحة: http://localhost:3030/login

## الاختبارات
```bash
cd backend-familist && php artisan test
```
```bash
cd frontend-react-familist && npx tsc -b && npx oxlint
```

## لوحة التحكم (`/admin`)
- **Page text & images** — كل نصوص وصور الصفحة الرئيسية وحقول SEO
- **Articles / Categories / Import from Word** — مقالات بحقول SEO، ومستورد `.docx` بمعاينة قبل الحفظ
- **Podcast** — حلقات بروابط Spotify
- **Testimonials / FAQs / Store products / Legal pages**
- **Bookings & payments** — طلبات الاستشارة والتدريب وحالة الدفع (Stripe)
- **Sign-ups** — المشتركون في الأدلة المجانية مع تصدير CSV
- **Settings & prices** — الأسعار، بيانات التواصل، شريط الأزمات، GA4، Spotify، الشبكات، كلمة السر

## الأمان
- مفتاح Stripe السري على الخادم فقط؛ الدفع عبر Stripe Checkout مع webhook موقّع (مع حماية من إعادة الإرسال).
- السعر يُقرأ من الإعدادات على الخادم، لا من المتصفح.
- CSP بـ nonce لكل طلب، HSTS، honeypot + rate limit على النماذج، لا تخزين لتفاصيل القضايا.
- Google Analytics لا يُحمَّل إلا بعد موافقة الزائر على الكوكيز.
