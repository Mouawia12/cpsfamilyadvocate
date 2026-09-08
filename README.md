# Familist — CPS Family Advocate

الموقع الحيّ: https://cpsfamilyadvocate.com

## المصدر
نسخة طبق الأصل من ملفات الموقع على الاستضافة (GoDaddy cPanel — حساب `uqtio5tn7gt5`)،
سُحبت بتاريخ 2026-09-08 من:

```
public_html/cpsfamilyadvocate.com
```

## النشر (تحديث الموقع الحيّ)

الاستضافة مشتركة بلا shell — الرفع يتم عبر SFTP/SCP بمفتاح `cps-hosting`:

```bash
scp index.html cps-hosting:public_html/cpsfamilyadvocate.com/
# أو المجلد كاملاً
scp -r ./*.html ./*.pdf cps-hosting:public_html/cpsfamilyadvocate.com/
```

موقع ثابت (HTML/CSS/JS فقط) — لا يحتاج بناء ولا خادم تطبيقات.
