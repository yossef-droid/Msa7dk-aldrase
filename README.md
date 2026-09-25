# مكتبة القسم

منصة عربية RTL لإدارة المحتوى الدراسي بحسب المرحلة والفصل والمادة والسنة والدفعة ونوع المحتوى. الواجهة الموجودة الآن صالحة للتشغيل، وتحتوي طبقة Supabase للرفع الآمن والمراجعة.

## المتطلبات

- Node.js 20 أو أحدث
- مشروع Supabase جديد

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env.local` وضع رابط مشروع Supabase ومفتاح `anon`.
2. ثبّت الحزم: `npm install`.
3. من SQL Editor في Supabase، شغّل محتوى `supabase/migrations/20260925_initial_schema.sql`.
4. شغّل `npm run dev` ثم افتح `http://localhost:3000`.

## إعداد Supabase

ينشئ ملف الهجرة الجداول التالية: `profiles`, `academic_years`, `batches`, `stages`, `semesters`, `subjects`, `files`, `file_reviews`, `downloads`, `notifications`, و`activity_logs`، بالإضافة إلى bucket خاص باسم `study-files` وسياسات RLS.

لإنشاء أول مدير، سجّل المستخدم أولاً ثم نفّذ في SQL Editor (باستبدال البريد):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

أضف السنوات والمراحل والفصول والمواد من SQL Editor أو لوحة الإدارة عند إكمال صفحاتها. الملفات تبقى `pending` حتى يغيّرها مدير إلى `approved` أو `rejected`. لا تُحفظ الملفات داخل PostgreSQL؛ تحفظ في Supabase Storage بينما تحفظ بياناتها الوصفية فقط في جدول `files`.

## الأمان

- الرفع يتحقق خادميًا من المصادقة، MIME type، الاسم، والحجم (50MB).
- لا يمكن للعميل تعيين الدور؛ الدور محمي في `profiles` عبر RLS.
- الملفات المنشورة فقط ظاهرة للعامة في البيانات، وصلاحيات المراجعة مقتصرة على `admin` و`moderator`.
- استخدم روابط موقعة من الخادم لتنزيل الملفات في بيئة الإنتاج، ولا تجعل bucket عامًا.

## النشر على Vercel

ارفع المستودع إلى GitHub واربطه بـVercel، ثم أضف متغيري البيئة الموجودين في `.env.example` إلى إعدادات المشروع. شغّل SQL migration قبل النشر. لا تضع مفاتيح service-role في متغيرات `NEXT_PUBLIC_*`.

## ملاحظة معمارية

طبقة العرض في `app/` و`components/`، تكامل Supabase في `lib/supabase/`، العمليات الحساسة في `app/actions/`، ومخطط البيانات وسياساته في `supabase/migrations/`. هذا الفصل يسمح باستبدال الواجهة أو تطوير لوحة الإدارة دون المساس بالضوابط الأمنية أو تخزين الملفات.
