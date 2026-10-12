# Circuit Lab Web

آزمایشگاه مدار با HTML، CSS، JavaScript و SVG، به‌همراه بازی پازل سه‌بعدی با Three.js.

## داستان رِی — کمپین دوازده‌مرحله‌ای

از بالای صفحه «داستان رِی» را انتخاب کنید یا به `/#workshop` بروید. مرحله اول، مسئله‌های تعمیر شهر روشن را در تعمیرگاه سه‌بعدی اجرا می‌کند: رِی چرخ‌دستی را جابه‌جا می‌کند، تابلو کرکره را باز می‌کند، سیم برگشت را وصل و مقاومت نامناسب را تعویض می‌کند. جریان واقعی و قطع کلید باید با مولتی‌متر و آزمایش تأیید شوند تا ضامن آزاد شود. باتری رِی و پریز دو مسیر تأمین برق‌اند. [روند و معماری تعمیر تابلو](docs/workshop-repair.md)؛ جمع‌کردن رسید، راز رادیو و ذخیره خودکار نیز باقی‌اند.

کنترل با کلیک/لمس، WASD یا کلیدهای جهت است؛ ابزار کابل، ولت‌متر، کیف و بررسی مدار در نوار پایین قرار دارند. از آیکون فهرست بالای صحنه می‌توان هر ۱۲ مرحله را باز کرد. مراحل ۲ تا ۱۲ شامل باد، نگهبان، آسانسور، آب، خاموشی، آهن‌ربا، گیرنده، خازن، آینه‌ها، نجات همراهان و برق‌رسانی محله هستند. پیشرفت هر مرحله جدا ذخیره می‌شود؛ بازپخش نیز جایگاه ذخیرهٔ جدا دارد.

[گزارش کمپین و آزمون‌ها](docs/campaign-implementation.md) · [جزئیات اجرا و معماری مرحلهٔ اول](docs/workshop-implementation.md) · [داستان و پلن ۱۲ مرحله](docs/game-plan/README.md)

## موضوعات و مراحل

همهٔ موضوعات از منوی سمت چپ قابل دسترسی هستند و مرحله‌ها قفل نیستند:

- مبانی مدار: جریان و ولتاژ، مدار باز و بسته، قطبش
- قانون اهم و توان: مقاومت، جریان، توان و انرژی
- آرایش مدار: سری، موازی و مقاومت معادل
- قانون جریان کیرشهف (KCL)
- قانون ولتاژ کیرشهف (KVL)
- تحلیل گره‌ای
- تحلیل مش
- خطی‌بودن و سوپرپوزیشن
- تونن و نورتن
- خازن و سلف
- دیود و ترانزیستور
- کارگاه طراحی مدار

نسخهٔ فعلی ۱۸۰ مرحله دارد؛ هر مبحث حداقل ۱۵ مرحله دارد و از مرحلهٔ پنجم به بعد، تمرین‌ها چندمرحله‌ای و محاسباتی‌تر می‌شوند.

## شهر روشن — مأموریت‌های قبلی

از نوار بالای صفحه «شهر روشن» را انتخاب کنید. هشت مأموریت موجود شامل تعمیر سیم چراغ نگهبانی، تنظیم مقاومت تابلوی فروشگاه، سیم‌کشی موازی کوچه، مدیریت توان درمانگاه و عیب‌یابی تابلوی اصلی، برق پشتیبان، پمپ و برج رادیویی هستند.

هر ساختمان پس از تعمیر روشن می‌شود و مأموریت بعدی باز می‌شود. راهنمای سه‌مرحله‌ای و ستاره‌ها وجود دارند؛ بهترین نتیجه در همین مرورگر با localStorage ذخیره می‌شود. طرح نیمه‌تمام مدار با بارگذاری مجدد صفحه ذخیره نمی‌شود. مدل مصرف‌کننده‌ها فعلاً DC و مقاومتی است؛ فروشگاه از مدل لامپ استفاده می‌کند، نه LED واقعی.

داده‌ها، پیشرفت، کنترل بازی و ظاهر این بخش در `src/city/` قرار دارند و از موتور مشترک `src/builder/` استفاده می‌کنند. آزمون‌های پنج مأموریت و محدودیت توان با `npm test` اجرا می‌شوند.

## اجرای محلی

روش Node.js، بدون نیاز به build:

```powershell
cd D:\uni_project\circuit_lab_web
npm start
```

سپس `http://localhost:8080/#workshop` را باز کنید. فایل‌های Three.js همراه پروژه هستند.

روش قبلی با Python یا `run.bat` نیز کار می‌کند:

```powershell
cd D:\uni_project\circuit_lab_web
python -m http.server 5173
```

سپس `http://localhost:5173` را باز کن. برای استفاده از ماژول‌های JavaScript، اجرای پروژه از طریق سرور لازم است.

## ساختار

- `index.html`: ساختار رابط
- `styles.css`: ظاهر واکنش‌گرا و رنگ‌ها
- `src/main.js`: مدیریت تب‌ها، مراحل و ورودی‌ها
- `src/data/levels.js`: موضوعات، زیرموضوعات و دادهٔ مراحل
- `src/game/CircuitState.js`: قوانین و محاسبات مدار
- `src/ui/CircuitRenderer.js`: رسم مدارها با SVG
- `src/campaign/`: بازی داستانی سه‌بعدی؛ مدل، حرکت، صحنه و رابط جدا
- `vendor/three/`: کتابخانهٔ سه‌بعدی محلی
- `assets/`: دارایی‌های مشترک سایت

هر زیرموضوع تعامل مستقل دارد: مدار پایه، جهت جریان، قطبش، قانون اهم، توان، سری/موازی، KCL و KVL.


## کارگاه طراحی مدار (۱۵ مرحله)

از منوی سمت چپ «کارگاه طراحی مدار» را انتخاب کنید. پانزده مأموریت مستقل از میز خالی شروع می‌شوند:
حلقه با لامپ، دو مقاومت برای جریان هدف، دو لامپ سری، دو شاخه موازی با کلید اصلی.

- قطعات را از جعبه ابزار روی میز بکشید؛ کلیک روی نام قطعه نیز آن را اضافه می‌کند.
- بدنه قطعه را بکشید تا جابه‌جا شود. سیم‌های متصل همراه آن حرکت می‌کنند.
- برای سیم‌کشی روی دو پایانه آبی کلیک کنید. از یک پایانه می‌توان چند انشعاب گرفت.
- کلیک روی سیم آن را حذف می‌کند. تقاطع ظاهری خطوط اتصال الکتریکی نیست.
- قطعه را انتخاب کنید تا چرخش، حذف، تغییر مقاومت یا باز/بسته‌کردن کلید در دسترس باشد.
- با «آزمایش مدار من» طرح بررسی می‌شود؛ صرف افزودن قطعه یا انتخاب آرایش، موفقیت نیست.
- برگشت یک حرکت، لغو سیم‌کشی و شروع دوباره در دسترس هستند.

این بخش یک مدل آموزشی DC با منبع ۱۲ ولت است. لامپ‌ها مقاومت ثابت ۱۲ اهم دارند؛
مدارهای سری/موازی مأموریت‌ها بررسی می‌شوند و شبیه‌سازی عمومی مدار دلخواه، AC یا مدل واقعی لامپ ارائه نمی‌شود.
پیشرفت فعلاً تا زمانی که صفحه باز است نگه داشته می‌شود.

معماری کارگاه: `src/builder/Board.js` مدل و ارزیابی اتصال‌ها را نگه می‌دارد؛
`src/builder/CircuitBuilder.js` تعامل ماوس، سیم‌کشی و رسم میز را مدیریت می‌کند.

تست منطق کارگاه: `npm test` یا `node tests/builder.test.mjs`.

## بازی شهر: بازگشت روشنایی

از کلید «شهر روشن» در سربرگ وارد نقشه شوید. هر ساختمان یک صحنهٔ قابل کاوش دارد:
گفت‌وگو با شخصیت، بررسی پلاک دستگاه و منبع، اندازه‌گیری با مولتی‌متر، و تعمیر در جعبه‌برق.
دروازه با ترمیم مسیر، فروشگاه با انتخاب مقاومت، کوچه با سیم‌کشی موازی، درمانگاه با مدیریت توان
و پست برق با رفع دو خرابی مستقل کامل می‌شوند. راهنما و آزمایش ناموفق از ستاره‌ها کم می‌کنند؛
سیم و مقاومت از اعتبار همان مأموریت مصرف می‌کنند. در صورت تمام‌شدن اعتبار می‌توان مرحله را از نو شروع کرد.
قطع محافظ با رفع علت و زدن «بازنشانی محافظ» قابل بازیابی است.

ستاره‌ها با کلید `circuit-lab.adventure.v1` در مرورگر ذخیره می‌شوند؛ پیشرفت نسخهٔ قدیمی مدارمحور
جدا می‌ماند. تعمیر نیمه‌تمام هنگام رفت‌وبرگشت بین شهر و مأموریت‌ها حفظ می‌شود، اما با بازخوانی صفحه از بین می‌رود.
مدل بازی DC با بارهای مقاومتی است؛ جریان‌ها و ولتاژهای مولتی‌متر از تحلیل گره‌ای همین مدل به دست می‌آیند.

ساختار بخش بازی:

- `src/city/CityGame.js`: جابه‌جایی نماها و اتصال رویدادها به مدل
- `src/city/AdventureSession.js`: وضعیت مأموریت، اعتبار، تعمیر، محافظ و امتیاز
- `src/city/CircuitMeter.js`: اندازه‌گیری ولتاژ و جریان شبکهٔ مقاومتی
- `src/city/adventureData.js`: داستان، هدف، وسایل و راهنماهای هر مکان
- `src/city/AdventureView.js`: صحنهٔ تعاملی، جعبه‌برق و دفتر شواهد
- `src/city/Progress.js` و `scene.js`: ذخیرهٔ ستاره‌ها و نمای نقشه

منطق این بازی به ویرایشگر `CircuitBuilder` وابسته نیست؛ فقط مدل اتصال و ارزیابی DC بین آن‌ها مشترک است.
تست‌های مستقل بازی: `node tests/adventure.test.mjs`؛ کل تست‌ها: `npm test`.

### تعمیر تعاملی فروشگاه

در جعبه‌برق فروشگاه دو پراب قابل‌کشیدن وجود دارد. قرمز را روی نقطهٔ اول و مشکی را روی
نقطهٔ دوم قرار دهید؛ نمایشگر اختلاف ولتاژ علامت‌دار را نشان می‌دهد. انتخاب رنگ و سپس لمس
نقطه، جایگزین کشیدن برای موبایل و صفحه‌کلید است.
برای تعویض مقاومت، کلید را باز کنید، قطعهٔ نصب‌شده را به محفظه بکشید، سپس قطعهٔ تازه را
از کیف روی سوکت خالی رها کنید. بیرون‌آوردن با دکمه و نصب با انتخاب قطعه و لمس سوکت نیز ممکن است.
اعتبار فقط هنگام نصب موفق کم می‌شود. بعد از آزمایش، مقاومت نامناسب می‌تواند تابلو را کم‌نور کند
یا باعث قطع محافظ شود؛ شدت نور در مدل مقاومتی با توان لامپ تغییر می‌کند.

`ShopRepair.js` وضعیت پراب و سوکت، `ShopWorkbench.js` نمای ابزار و `ShopInteractions.js`
رویدادهای کشیدن با ماوس، لمس و قلم را نگه می‌دارند. تست این روند: `node tests/shop.test.mjs`.




### Street repair mission

The alley has three independently simulated lamps: one healthy, one open-circuit lamp, and one dim lamp behind a 12-ohm damaged connection. Use the meter on individual lamps to compare socket voltage and lamp current. Replacing a lamp costs 5 credits, removing the damaged connection costs 3, and drawing a new wire costs 2. Wires support pointer dragging or selecting two terminals; select a wire to remove it.

Victory requires repairing both faults, restoring three full-brightness branches, testing with exactly one branch isolated, then reconnecting it and performing the final test. Editing wiring, replacing a lamp, or changing the main switch invalidates previous verification. This uses the DC solver; visual brightness follows calculated lamp power. Regression coverage: `tests/street.test.mjs`.

A direct replacement wire is also accepted when the old connection carries no current. Removing that unused connection is optional; full brightness leads to the explicit branch-isolation test without a failed-repair penalty.

Mission UI: the expand control opens a native modal with the same editable circuit. Escape or Close restores focus to its opener. Running a test closes the popup and displays a color-coded result on the mission scene. `tests/city-ui.browser.html` exercises modal editing, cancel/focus restoration, shop probes and scene feedback in a browser using disposable progress storage; `?popup=1` previews the expanded view.

Direct component measurements: select the V tool in the mission toolbar or cabinet header, then select a component body. The compact readout shows terminal voltage and calculated load current. Wiring edits are suppressed in meter mode. Measurements remain live after repairs, and open/floating terminals or shorts are reported explicitly.


### Additional city challenges (missions 6–8)

- **Backup clinic**: restore essential services on a 24 W generator, then adapt to a 12 W backup source. Low-speed ventilation preserves all three essential loads. Excess power trips the protector.
- **Pump station**: each motor needs 18 W to start but only 6 W to run. A 24 W supply forces temporary load shedding before starting the second motor. Each explicit test advances one pumping cycle; there is no wall-clock deadline. Completion needs a full tank, two running pumps, and restored lighting.
- **Radio tower**: tune a 12 V divider to 4 V without a load, then retune after a 12-ohm receiver is connected in parallel with its lower leg. Voltages come from the existing DC solver. Multiple valid tuning paths are accepted.

These challenges use separate model classes in `src/city/challenges/`, keep the existing compact panel and editable popup, and preserve previous adventure stars. The old five editor missions remain unchanged. Motor startup is an explicit educational power-demand model; running loads are resistive DC equivalents. Run `npm test` for model regressions. Open `tests/challenges.browser.html` through the project server for a complete UI walkthrough with isolated in-memory progress; query `?mission=6` previews the pump mission and `?mobile=1&mission=7` constrains the radio preview to 390 px.
