import {p,spec,action,clue,baseComponents,setupBase,collectible} from './chapter1/shared.js';
const start=p(-4,2.5),exit=p(5,-2.7);
export function keyStatus(w,ctx){
 if(ctx.flags.key)return {ready:false,text:'کلید در کیف رِی است.'};
 const guard=w.get('guard'),key=w.get('key');
 if(!['cleaning','charging'].includes(guard.state.mode))return {ready:false,text:'نگهبان در حال گشت است و پیشخوان را زیر نظر دارد.'};
 if(Math.hypot(guard.state.position.x-key.state.position.x,guard.state.position.z-key.state.position.z)<2.4){
  if(guard.state.mode==='cleaning'&&w.get('papers').state.position.x>-2)return {ready:false,text:'نگهبان کاغذها را همین کنار کلید تمیز می‌کند؛ هنوز در دسترس اوست.'};
  return {ready:false,text:'نگهبان حواسش پرت شده ولی هنوز نزدیک کلید است؛ صبر کن کمی دورتر برود.'};
 }
 return {ready:true,text:'نگهبان از پیشخوان دور است؛ کلید در دسترس قرار گرفته.'};
}
function takeKey(w,ctx){
 const status=keyStatus(w,ctx);if(!status.ready)return status.text;
 collectible(w,'key','key',ctx,'');w.get('main-receipt').collect();ctx.flags.mainReceipt=true;
 return 'کلید برداشته شد و در کیف قرار گرفت. فروشنده رسید «شارژر سازگار» پاک‌رو را هم به تو داد.';
}
export default function createDefinition(){return {
 id:'03-market',number:3,title:'بازارِ جاروها',theme:'market',intro:'کلید بارانداز روی پیشخوان است و نگهبان هیچ‌کس را نزدیک آن راه نمی‌دهد. بازار تعطیل شده، اما دستگاه‌های جشن هنوز اینجا هستند.',start,exit,bounds:{minX:-6,maxX:6,minZ:-4,maxZ:4},
 components:[...baseComponents(start,exit,9),
 spec('sign','sign','تابلوی جشن · ۳ وات',-1,1.5,{confettiTarget:'papers',portable:false}),
 spec('fan','fan','فن جمع‌آوری کاغذ · ۶ وات',-2,0,{speeds:[6],direction:1,windTargets:[p(-4,1),p(2,1)],portable:false}),
 spec('papers','papers','تودهٔ کاغذ جشن',0,.7,{from:p(0,.7),to:p(-4,1),fan:'fan',windDirection:0,travelSeconds:2,threshold:1,lockAtEnd:true,portable:false}),
 spec('guardDock','dock','شارژر نگهبان · ۶ وات',-4,-2,{portable:false}),
 spec('guard','guard','نگهبان نظافتچی',2,-1.6,{litter:'papers',charger:'dock',route:[p(2,-1.6),p(2,1),p(.8,1),p(.8,-1.6)],speed:1.25,dwell:18,cooldown:4,portable:false}),
 spec('table','counter','پیشخوان فروشنده',2.8,-1,{portable:false}),
 spec('worker','vendor','فروشندهٔ بازار',3,-2.8,{portable:false}),
 spec('key','key','کلید بارانداز',2,-2.6,{portable:false}),
 spec('latch','latch','ضامن در خدمات · ۶ وات',4,-1.8,{portable:false}),
 spec('door','door','در خدمات',4,-2.7,{trigger:'latch',portable:false}),
 spec('receipt','receipt-a','رسید کنار ورودی',-4,2.8,{portable:false}),
 spec('receipt','receipt-b','رسید زیر تابلو',-.5,2.8,{portable:false}),
 spec('receipt','main-receipt','رسید شارژر سازگار',3,-2.5,{portable:false})],connections:[],
 setup(w){setupBase(w);w.get('papers').state.visible=false;w.get('main-receipt').state.visible=false;},
 update(w,dt,ctx){
  const guard=w.get('guard'),ray=w.get('ray'),papers=w.get('papers');
  if(papers.state.collected){papers.state.locked=false;}
  if(guard.state.mode==='patrol'&&Math.hypot(ray.state.position.x-guard.state.position.x,ray.state.position.z-guard.state.position.z)<.7&&!ctx.flags.key){ray.state.position=p(-.2,2);ctx.flags.stickers=(ctx.flags.stickers??0)+1;ctx.say('نگهبان برچسب «مانع موقت» به کفش رِی زد؛ رِی پشت پیشخوان پناه گرفت.');}
  if(guard.state.mode==='cleaning'&&!ctx.flags.cleaningSeen){ctx.flags.cleaningSeen=true;ctx.say('نگهبان: «آشغال شناسایی شد! نظافت در اولویت است.»');}
  if(guard.state.mode==='charging'&&!ctx.flags.chargingSeen){ctx.flags.chargingSeen=true;ctx.say('نگهبان: «وقت شارژ؛ گشت بعدی کمی بعد.»');}
 },
 actions(w,id,ctx){
  if(id==='key')return [action('take-key','برداشتن کلید بارانداز',()=>takeKey(w,ctx))];
  if(id==='fan')return [action('fan-direction',w.get('fan').state.direction?'تغییر جهت: به سمت ورودی':'تغییر جهت: به سمت پیشخوان',()=>{w.get('fan').act('direction');return w.get('fan').state.direction?'باد به سمت پیشخوان می‌وزد.':'کاغذها به فضای خالی کنار ورودی می‌روند.';}),action('fan-toggle',w.get('fan').state.enabled?'خاموش':'روشن',()=>{w.get('fan').act('toggle');}),action('fan-disconnect','جدا کردن کابل',()=>w.disconnect('fan'))];
  if(id==='sign')return [action('sign-toggle',w.get('sign').state.enabled?'پایان جشن':'شروع جشن',()=>{w.get('sign').act('toggle');}),action('sign-party','جشن دوباره و کاغذ تازه',()=>{if(!w.get('sign').state.powered)return 'اول برق تابلو را وصل و آن را روشن کن.';const papers=w.get('papers');papers.state.locked=false;papers.state.collected=false;papers.state.visible=true;papers.state.progress=0;papers.state.position={...papers.initial.position};return 'یک مشت کاغذ تازه از تابلو بیرون پرید!';}),action('sign-disconnect','جدا کردن کابل',()=>w.disconnect('sign'))];
  if(id==='dock')return [action('dock-toggle',w.get('dock').state.enabled?'خاموش کردن جایگاه':'روشن کردن جایگاه',()=>{w.get('dock').act('toggle');}),action('dock-recall','چرخهٔ شارژ دوباره',()=>{if(!w.get('dock').state.powered)return 'برق جایگاه شارژ را وصل کن.';w.get('guard').state.cooldown=0;return 'جایگاه دوباره نگهبان را صدا می‌زند؛ تابلو را خاموش کن تا کاغذ تازه نریزد.';})];
  if(id==='receipt-a'||id==='receipt-b')return [action('read-receipt','خواندن و برداشتن رسید',()=>collectible(w,id,id,ctx,id==='receipt-a'?'رسید: «یک پتوی کوچک برای مسافر خسته.»':'رسید: «شارژر قبلی به ربات کوچک نمی‌خورد.»'))];
  if(id==='vendor')return [action('vendor-talk','گفت‌وگو',()=>ctx.flags.key?'دنبال شارژر سازگار بود. عجله داشت؛ انگار کسی منتظرش بود.':'از وقتی جشن تمام شده فقط گشت می‌زند. حتی وسط حرف‌زدن هم اگر کاغذی ببیند می‌رود جارو کند. شارژش هم که تمام شود همه را معطل می‌کند!')];
  if(['guard','papers','counter','main-receipt','door'].includes(id))return [];
  return null;
 },
 interact(w,id,ctx){if(id==='key')return takeKey(w,ctx);},
 focus(w,ctx){return keyStatus(w,ctx).ready?'key':null;},
 status(w,id,ctx){
  if(id==='key')return keyStatus(w,ctx).text;
  if(id==='guard')return ({patrol:'در حال گشت',cleaning:'مشغول نظافت',charging:'در حال شارژ'})[w.get('guard').state.mode];
  if(id==='fan')return 'جهت فعلی باد: '+(w.get('fan').state.direction?'پیشخوان':'ورودی');
 },
 inspect(w,id,ctx){return {
  supply:'پلاک محافظ: ۹ وات. هر وسیله توان خودش را روی بدنه دارد؛ چراغ قطع نشان می‌دهد مجموع مصرف از ظرفیت گذشته.',
  sign:'روی بدنه تصویر کاغذرنگی است؛ زیر دهانه هنوز چند تکه کاغذ مانده.',
  fan:'پایهٔ فن می‌چرخد. فلش روی زمین جهت باد را نشان می‌دهد؛ جهت و برق دو تنظیم مستقل‌اند.',
  dock:'جایگاهی به شکل چرخ‌های نگهبان. روی تابلو نوشته: استراحت بین دو گشت.',
  guard:'چشم نگهبان پیشخوان را دنبال می‌کند. جارویش پر از کاغذرنگی جشن است.',
  key:'کلید روی لبهٔ پیشخوان قرار دارد؛ مانعی برای برداشتنش نیست، جز نگهبان.',
  papers:'کاغذها سبک‌اند و با باد حرکت می‌کنند. نگهبان هر تکه را دنبال می‌کند.',
  latch:'قفل مکانیکی و ضامن برقی جدا هستند؛ این در هم کلید می‌خواهد هم برق.'
 }[id];},
 ready(w,ctx){return !!(ctx.flags.key&&w.get('latch').state.complete);},
 objective(w,ctx){return this.ready(w,ctx)?'از در خدمات وارد بارانداز شو.':'کلید بارانداز را پیدا کن و در خدمات را باز کن.';},
 hint(w,ctx){
  if(w.get('supply').state.tripped)return clue('power-limit','محافظ پریده','مجموع مصرف از ظرفیت ۹ وات بیشتر شده.','برای هر بخش معما لازم نیست همهٔ وسایل روشن بمانند.',['یک مصرف‌کننده را با ابزار کابل جدا کن.','محافظ منبع را دوباره وصل کن.','برای ضامن در می‌توانی برق را جابه‌جا کنی یا از باتری کمک بگیری.']);
  if(ctx.flags.key)return clue('door','کلید امن است','نگهبان کلید را پس نمی‌گیرد.','در خدمات یک پالس برق جدا می‌خواهد.',['منبع یا باتری را به ضامن در خدمات وصل کن.','یک ثانیه صبر کن و از خروج بگذر.']);
  const status=keyStatus(w,ctx);
  if(status.ready)return clue('take-key','حالا کلید را بردار','نگهبان از پیشخوان دور شده است.',status.text,['ابزار دست را انتخاب کن.','کلید را انتخاب کن و «برداشتن کلید» را از فهرست کارها بزن.']);
  const guard=w.get('guard');
  if(['cleaning','charging'].includes(guard.state.mode))return clue('guard-away','حواس نگهبان پرت شده','او به کاغذ یا شارژر توجه می‌کند.',status.text,['از سمت پوشیدهٔ پیشخوان نزدیک کلید شو.','وقتی نگهبان دور شد کلید را بردار.','اگر فرصت تمام شد جشن یا چرخهٔ شارژ را تکرار کن.']);
  return clue('distraction','برای نگهبان کار بساز','نگهبان آشغال و شارژ را به نگهبانی ترجیح می‌دهد.','کاغذها باید کنار ورودی جمع شوند، دور از کلید.',['تابلو و فن را به منبع وصل کن.','جهت فن را به فضای خالی ورودی تنظیم کن.','راه دیگر: تابلو را خاموش و جایگاه شارژ را روشن کن.']);
 },
 obstacles(w,ctx){return [{x:2.8,z:-1,w:1.4,d:.65},...(!ctx.flags.key||!w.get('latch').state.complete?[{x:4,z:-2.7,w:.4,d:2.6}]:[])];}
};}
