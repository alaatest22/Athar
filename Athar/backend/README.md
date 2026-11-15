# Real Estate API — Node.js + Express + MongoDB

باك إند مستقل لموقع عقارات. جميع البيانات تجريبية وغير تابعة لشركة رتال، والصور placeholders وليست صور مشاريع حقيقية. الأسعار بالريال السعودي والمساحات بالمتر المربع، والإحداثيات تقريبية للمدن.

## التشغيل

تحتاج Node.js 22 أو أحدث وMongoDB يعمل محليًا، أو رابط MongoDB Atlas.

```bash
npm ci
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

انسخ المفتاح الناتج إلى `ADMIN_API_KEY` داخل `.env` المرفق، بدل القيمة `CHANGE_ME...`. السيرفر لن يبدأ بالمفتاح الافتراضي. اضبط `MONGODB_URI` لو تستخدم Atlas. أضف عنوان الفرونت إلى `CORS_ORIGIN`؛ افصل العناوين بفواصل بدون شرطة مائلة أخيرة.

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/real_estate
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
ADMIN_API_KEY=CHANGE_ME_GENERATE_A_RANDOM_64_CHARACTER_KEY
```

بعد تشغيل MongoDB:

```bash
npm run seed
npm run dev
```

للعمل بدون watch: `npm start`. العنوان: `http://localhost:5000/api/projects`.

`npm run seed` يضيف 8 مشاريع و6 وحدات لكل مشروع (48 وحدة). آمن لإعادة التشغيل: لا يمسح أو يستبدل البيانات الموجودة. `totalUnits` إجمالي الوحدات المخطط لها وليس حسابًا آليًا من سجلات Unit.

## المسارات

| Method | Path | الوصول | الوظيفة |
|---|---|---|---|
| GET | /api/health | عام | فحص استجابة الخدمة |
| GET | /api/projects | عام | مشاريع مع فلترة وبحث وترقيم صفحات |
| GET | /api/projects/:slug | عام | تفاصيل المشروع |
| GET | /api/projects/:id/units | عام | وحدات المشروع، بترقيم صفحات |
| POST | /api/inquiries | عام | حفظ استفسار |
| GET | /api/inquiries | إدارة | الاستفسارات مع بيانات المشروع |
| POST | /api/projects | إدارة | إنشاء مشروع |
| PUT | /api/projects/:id | إدارة | تحديث الحقول المرسلة فقط |
| DELETE | /api/projects/:id | إدارة | حذف مشروع غير مرتبط بوحدات أو استفسارات |

الإدارة تستخدم `Authorization: Bearer YOUR_ADMIN_API_KEY`. المفتاح سر خاص بالخادم؛ لا تضعه داخل React أو متغيرات VITE أو JavaScript المنشور. هذا ليس نظام حسابات مستخدمين أو تسجيل دخول؛ لتشغيل لوحة إدارة عامة، أضف جلسات دخول وصلاحيات مستخدمين من الخادم.

الحذف يرجع 409 إذا كان للمشروع وحدات أو استفسارات، حفاظًا على السجلات؛ يمكن تعديل الحالة إلى `sold_out`. لا توجد APIs لتعديل الوحدات لأنها خارج المسارات المطلوبة، ويمكن إدارتها حاليًا من MongoDB أو seed. الاستفسار لا يحجز وحدة ولا يغيّر حالتها.

### الفلاتر

`city` مطابق لاسم المدينة العربي، `type` و`status` مطابقان للقيم أدناه. البحث الجزئي في الاسم باستخدام `name` أو `search` (الأولوية لـ name)، مع escaping لتعامل النص حرفيًا وليس regex من العميل.

```text
GET /api/projects?city=الدمام&type=villa&status=ready&name=نساج&page=1&limit=12
GET /api/projects/nesaj-demo
GET /api/projects/PROJECT_OBJECT_ID/units?page=1&limit=12
GET /api/inquiries?projectId=PROJECT_OBJECT_ID&page=1&limit=20
```

كل القوائم تُرجع `{success:true,data:[],pagination:{page,limit,total,pages}}`، الحد الأعلى للصفحة 100. التفاصيل والتعديلات `{success:true,data:{...}}`. استخدم `_id` من استجابة المشروع للوحدات والاستفسارات والتعديلات، و`slug` للتفاصيل فقط.

### القيم المتاحة

- Project.type: `villa`, `apartment`, `townhouse`, `mixed`.
- Project.status: `upcoming`, `under_construction`, `ready`, `sold_out`.
- Unit.type: `villa`, `apartment`, `townhouse`.
- Unit.status: `available`, `reserved`, `sold`.
- slug: حروف إنجليزية صغيرة وأرقام وشرطات، فريد.
- location: كائن `address`, `latitude`, `longitude`.
- email اختياري في الاستفسار؛ بقية الحقول مطلوبة. أرسل الأرقام كـ JSON numbers.

### إنشاء مشروع — curl

ضع المفتاح في متغير shell محلي `ADMIN_API_KEY` قبل تشغيل المثال:

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"name":"مشروع جديد","slug":"new-project","city":"جدة","type":"villa","status":"upcoming","priceFrom":1500000,"totalUnits":20,"image":"https://placehold.co/1200x800","description":"وصف المشروع","location":{"address":"جدة، حي تجريبي","latitude":21.54,"longitude":39.17},"features":["حدائق","مواقف"]}'
```

### إرسال استفسار من React

```js
const response = await fetch('http://localhost:5000/api/inquiries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'مصطفى', phone: '+966500000000',
    email: 'mostafa@example.com',
    projectId: project._id,
    message: 'أرغب في معرفة تفاصيل الوحدات المتاحة'
  })
});
const result = await response.json();
if (!response.ok) throw new Error(result.message);
```

### التعديل والحذف

```bash
curl -X PUT http://localhost:5000/api/projects/PROJECT_OBJECT_ID \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H 'Content-Type: application/json' -d '{"status":"sold_out"}'
curl http://localhost:5000/api/inquiries -H "Authorization: Bearer $ADMIN_API_KEY"
curl -X DELETE http://localhost:5000/api/projects/PROJECT_OBJECT_ID \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

## الاختبارات والأخطاء

```bash
npm test
```

الاختبارات تشغل MongoDB مؤقتًا عبر mongodb-memory-server، وقد تحمل binary من fastdl.mongodb.org أول مرة؛ لا تتصل بقاعدة بياناتك.

400: بيانات أو ID غير صالح. 401: مفتاح إدارة مفقود/خاطئ. 403: CORS غير مسموح. 404: غير موجود. 409: slug مكرر أو مشروع مرتبط بسجلات. 413: body كبير. 429: تجاوز معدل الطلبات. 500: خطأ داخلي دون كشف التفاصيل.

Helmet، حد JSON بحجم 32KB، التحقق من الحقول، pagination، unique indexes وrate limiting مفعلة. الحد العام 300 طلب/15 دقيقة/IP، والاستفسارات 10/15 دقيقة/IP. المحدد داخل ذاكرة كل process؛ عند التوسع لعدة سيرفرات استخدم مخزنًا مشتركًا مثل Redis واضبط trust proxy حسب بنية الاستضافة الفعلية. لا تُفعّل trust proxy عشوائيًا. عمليات فحص العلاقات والحذف ليست transaction؛ في بيئة ذات كتابة متزامنة كثيفة طبّق soft delete أو معاملات مناسبة قبل اعتماد حذف المشاريع المرتبطة بالعملاء. استخدم HTTPS ومفتاحًا خاصًا وMongoDB بصلاحيات محدودة عند النشر.

## الملفات

- src/server.js: الاتصال بقاعدة البيانات وتشغيل الخدمة والإغلاق المنظم.
- src/app.js: المسارات والحماية والأخطاء.
- src/models/: الموديلات الثلاثة.
- src/validation.js: فحص المدخلات والفلترة.
- src/seed.js: بيانات تجريبية قابلة لإعادة التشغيل.
- .env و.env.example: إعدادات التشغيل، بلا أسرار حقيقية.
- test/api.test.js: اختبار دورة APIs على MongoDB مؤقت.
- package-lock.json: نسخ الحزم المثبتة لتشغيل `npm ci`.
