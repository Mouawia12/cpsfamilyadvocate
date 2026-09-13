# Familist — دليل النشر على GoDaddy cPanel (بلا SSH)

التطبيق حزمة واحدة: Laravel يخدم الواجهة (React) والـ API على نفس الدومين `www.cpsfamilyadvocate.com`.
التثبيت والتحديث يتمان عبر **Cron Job** مؤقت بدل الـ shell.

---

## 0) بناء الحزمة (على جهازك)

```bash
./scripts/build-deploy.sh
```

الناتج: `deploy-package/familist-app.zip` (يبني React، يشغّل الاختبارات، يثبّت vendor للإنتاج، بلا أسرار وبلا قاعدة بيانات).

## 1) نسخة احتياطية من الموقع الحالي

cPanel → **File Manager** → `public_html/cpsfamilyadvocate.com` → حدّد الكل → **Compress** → نزّل الملف المضغوط.

## 2) إصدار PHP

cPanel → **MultiPHP Manager** → `cpsfamilyadvocate.com` → **PHP 8.3** (Laravel 13 لا يعمل على 8.2).
cPanel → **Select PHP Version / Extensions**: تأكد من تفعيل `pdo_mysql`, `mbstring`, `xml`, `dom`, `zip`, `fileinfo`, `openssl`, `curl`.

## 3) رفع التطبيق

1. File Manager → مجلد **home** (`/home/uqtio5tn7gt5`) — **ليس** داخل `public_html`.
2. Upload → `familist-app.zip` → كليك يمين → **Extract** → يُنشأ `familist-app/`.

## 4) قاعدة البيانات

cPanel → **MySQL Databases**:
1. أنشئ قاعدة: `familist` → الاسم الكامل `uqtio5t_familist`.
2. أنشئ مستخدماً بكلمة سر قوية → `uqtio5t_familist_user`.
3. **Add User To Database** → **ALL PRIVILEGES**.

## 5) ملف الإعدادات `.env`

File Manager → `familist-app/` → انسخ `.env.example` باسم `.env` → **Edit**، وعدّل:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://www.cpsfamilyadvocate.com
APP_KEY=            # ولّده على جهازك: php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=uqtio5t_familist
DB_USERNAME=uqtio5t_familist_user
DB_PASSWORD=...

FRONTEND_URL=https://www.cpsfamilyadvocate.com
CORS_ALLOWED_ORIGINS=https://www.cpsfamilyadvocate.com
SANCTUM_STATEFUL_DOMAINS=www.cpsfamilyadvocate.com

# البريد (مثال: بريد GoDaddy / Microsoft 365 / أي SMTP)
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS="familist@cpsfamilyadvocate.com"
CONTACT_TO_EMAIL="familist@cpsfamilyadvocate.com"

# Stripe (اتركها فارغة حتى تصل المفاتيح — الطلبات تُحفظ وتُرسل بالبريد)
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=

# للتثبيت الأول فقط — احذف ADMIN_PASSWORD بعده
ADMIN_EMAIL=admin@cpsfamilyadvocate.com
ADMIN_PASSWORD=كلمة-سر-قوية
```

> `.env` لا يُرفع إلى Git أبداً. بعد التثبيت اضبط صلاحياته على **600**.

## 6) التثبيت عبر Cron (مرة واحدة)

cPanel → **Cron Jobs** → Common Settings: **Once Per Minute** → Command:

```bash
cd /home/uqtio5tn7gt5/familist-app && /opt/cpanel/ea-php83/root/usr/bin/php artisan familist:install >> storage/logs/install.log 2>&1
```

1. انتظر دقيقتين، ثم افتح `familist-app/storage/logs/install.log` — يجب أن ترى `Installed.`
2. **احذف الـ Cron Job** واحذف سطر `ADMIN_PASSWORD` من `.env`.

> الأمر آمن لو بقي يعمل بالخطأ: يطبّق الهجرات الجديدة فقط ولا يلمس المحتوى الذي عدّله المالك.
> إن لم يوجد المسار `/opt/cpanel/ea-php83/...` جرّب `/usr/local/bin/ea-php83`.

## 7) توجيه الدومين

cPanel → **Domains** → `cpsfamilyadvocate.com` → **Manage** → Document Root:

```
familist-app/public
```

> الـ `.htaccess` القديم في `public_html/cpsfamilyadvocate.com` لن يُطبَّق بعد التغيير. التطبيق يرسل
> سياسة CSP الخاصة به (تسمح بـ Google Analytics وSpotify وYouTube). إن أُضيف CSP آخر على مستوى الحساب فأزِله.

الصلاحيات: `storage/` و`bootstrap/cache/` و`public/uploads/` على **755** (أو 775 عند خطأ رفع الصور).

## 8) SSL

cPanel → **SSL/TLS Status** → تأكد أن AutoSSL يغطي `cpsfamilyadvocate.com` **و** `www.cpsfamilyadvocate.com` → **Run AutoSSL** إن لزم.
الـ `.htaccess` يحوّل كل الزيارات إلى `https://www.`.

## 9) Stripe (عند وصول المفاتيح)

1. Stripe Dashboard → **Developers → API keys** → انسخ **Secret key** (live) إلى `STRIPE_SECRET`.
2. **Developers → Webhooks → Add endpoint**:
   - URL: `https://www.cpsfamilyadvocate.com/api/v1/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`
   - انسخ **Signing secret** إلى `STRIPE_WEBHOOK_SECRET`.
3. جرّب حجزاً ببطاقة حقيقية بمبلغ صغير (أو بمفاتيح test أولاً)، وتأكد أن الطلب صار **Paid** في اللوحة.

المفتاح السري لا يصل إلى المتصفح أبداً: الخادم ينشئ جلسة Checkout ويحوّل الزائر لصفحة Stripe.

## 10) الاختبار بعد النشر

- [ ] `https://www.cpsfamilyadvocate.com` يفتح، والقفل (SSL) ظاهر
- [ ] `/login` → تسجيل الدخول → `/admin` → **Overview** وقائمة الإعداد
- [ ] تعديل نص في **Page text & images** → Save → يظهر في الموقع
- [ ] **Import from Word** → معاينة → استيراد
- [ ] نموذج الأدلة المجانية → يظهر في **Sign-ups** ويصل بريد
- [ ] الحجز → يصل بريد، ومع Stripe يحوّل للدفع
- [ ] `/sitemap.xml` و`/robots.txt` يعملان
- [ ] Google Search Console: أضف الموقع وأرسل `sitemap.xml`
- [ ] Settings → أدخل GA4 Measurement ID → تظهر لافتة الكوكيز

## التحديثات لاحقاً

1. `./scripts/build-deploy.sh` على جهازك.
2. ارفع الـ zip واستخرجه فوق `familist-app/` (لا تحذف `.env` ولا `public/uploads/` ولا `storage/`).
3. شغّل الـ Cron من الخطوة 6 مرة واحدة (لتطبيق أي هجرات جديدة) ثم احذفه.

## أخطاء شائعة

| العرض | السبب والحل |
|---|---|
| صفحة 500 | `.env` (APP_KEY / بيانات DB) أو صلاحيات `storage/`. آخر خطأ في `storage/logs/laravel.log` |
| 503 "Frontend build missing" | الحزمة لم تُبنَ بالسكربت — `public/index.html` غير موجود |
| الـ API يرجّع HTML | Document Root ليس `familist-app/public` |
| رفع الصور يفشل | صلاحيات `public/uploads/` أو امتداد `fileinfo` معطّل |
| لا تصل رسائل البريد | `MAIL_MAILER` ما زال `log` أو بيانات SMTP خاطئة |
