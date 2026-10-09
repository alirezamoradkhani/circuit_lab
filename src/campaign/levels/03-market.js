import {p,spec,action,clue,baseComponents,setupBase,collectible} from './chapter1/shared.js';
const start=p(-4,2.5),exit=p(5,-2.7);
export default function createDefinition(){return {
 id:'03-market',number:3,title:'بازارِ جاروها',theme:'market',intro:'نگهبان نظافتچی راه پیشخوان را می‌بندد. با کاغذها یا جایگاه شارژ برایش کاری پیدا کن؛ کلید بارانداز پشت پیشخوان است.',start,exit,bounds:{minX:-6,maxX:6,minZ:-4,maxZ:4},
 components:[...baseComponents(start,exit),
 spec('sign','sign','تابلوی جشن · ۳ وات',-1,1.5,{confettiTarget:'papers',portable:false}),
 spec('fan','fan','فن جمع‌آوری کاغذ · ۶ وات',-2,0,{speeds:[6],direction:1,portable:false}),
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
  if(guard.state.mode==='cleaning'&&!ctx.flags.cleaningSeen){ctx.flags.cleaningSeen=true;ctx.say('نگهبان: «آشغال شناسایی شد!» مسیر پیشخوان را زیر نظر بگیر.');}
  if(guard.state.mode==='charging'&&!ctx.flags.chargingSeen){ctx.flags.chargingSeen=true;ctx.say('نگهبان به جایگاه شارژ می‌رود؛ حالا پشت پیشخوان را بررسی کن.');}
 },
 actions(w,id,ctx){
  if(id==='key')return [action('take-key','برداشتن کلید بارانداز',()=>{const g=w.get('guard'),key=w.get('key');if(g.state.mode==='patrol'||Math.hypot(g.state.position.x-key.state.position.x,g.state.position.z-key.state.position.z)<2.4)return 'نگهبان هنوز جلوی پیشخوان است؛ کاغذها را دور کن یا او را به شارژ بفرست.';collectible(w,'key','key',ctx,'');w.get('main-receipt').collect();ctx.flags.mainReceipt=true;return 'کلید برداشته شد. فروشنده رسید «شارژر سازگار» پاک‌رو را هم به تو داد.';})];
  if(id==='fan')return [action('fan-direction',w.get('fan').state.direction?'باد به سمت فضای خالی ورودی':'باد به سمت پیشخوان',()=>{w.get('fan').act('direction');return w.get('fan').state.direction?'این جهت کاغذها را از مسیر نگهبان دور نمی‌کند.':'کاغذها به فضای خالی کنار ورودی می‌روند.';}),action('fan-toggle',w.get('fan').state.enabled?'خاموش':'روشن',()=>{w.get('fan').act('toggle');}),action('fan-disconnect','جدا کردن کابل',()=>w.disconnect('fan'))];
  if(id==='sign')return [action('sign-toggle',w.get('sign').state.enabled?'پایان جشن':'شروع جشن',()=>{w.get('sign').act('toggle');}),action('sign-party','جشن دوباره و کاغذ تازه',()=>{if(!w.get('sign').state.powered)return 'اول برق تابلو را وصل و آن را روشن کن.';const papers=w.get('papers');papers.state.locked=false;papers.state.collected=false;papers.state.visible=true;papers.state.progress=0;papers.state.position={...papers.initial.position};return 'یک مشت کاغذ تازه از تابلو بیرون پرید!';}),action('sign-disconnect','جدا کردن کابل',()=>w.disconnect('sign'))];
  if(id==='dock')return [action('dock-toggle',w.get('dock').state.enabled?'خاموش کردن جایگاه':'روشن کردن جایگاه',()=>{w.get('dock').act('toggle');}),action('dock-recall','چرخهٔ شارژ دوباره',()=>{if(!w.get('dock').state.powered)return 'برق جایگاه شارژ را وصل کن.';w.get('guard').state.cooldown=0;return 'جایگاه دوباره نگهبان را صدا می‌زند؛ تابلو را خاموش کن تا کاغذ تازه نریزد.';})];
  if(id==='receipt-a'||id==='receipt-b')return [action('read-receipt','خواندن و برداشتن رسید',()=>collectible(w,id,id,ctx,id==='receipt-a'?'رسید: «یک پتوی کوچک برای مسافر خسته.»':'رسید: «شارژر قبلی به ربات کوچک نمی‌خورد.»'))];
  if(id==='vendor')return [action('vendor-talk','گفت‌وگو',()=>ctx.flags.key?'دنبال شارژر سازگار بود. عجله داشت؛ انگار کسی منتظرش بود.':'باهاش دعوا نکن؛ یه کاری بده دستش. کاغذها رو ببر کنار ورودی یا جایگاه شارژ رو روشن کن.')];
  if(['guard','papers','counter','main-receipt','door'].includes(id))return [];
  return null;
 },
 ready(w,ctx){return !!(ctx.flags.key&&w.get('latch').state.complete);},
 objective(w,ctx){return !ctx.flags.key?'نگهبان را از پیشخوان دور کن و کلید بارانداز را بردار.':!w.get('latch').state.complete?'کلید همراهت است؛ ضامن در خدمات را برق بده.':'از در خدمات وارد بارانداز شو.';},
 hint(w,ctx){
  if(ctx.flags.key)return clue('door','کلید امن است','نگهبان کلید را پس نمی‌گیرد.','در خدمات یک پالس برق جدا می‌خواهد.',['منبع یا باتری را به ضامن در خدمات وصل کن.','یک ثانیه صبر کن و از خروج بگذر.']);
  const guard=w.get('guard');
  if(guard.state.mode!=='patrol')return clue('guard-away','حواس نگهبان پرت شده','او به کاغذ یا شارژر توجه می‌کند.','صبر کن از پیشخوان دور شود و کلید را بردار.',['از سمت پوشیدهٔ پیشخوان نزدیک کلید شو.','وقتی نگهبان دور شد کلید را بردار.','اگر فرصت تمام شد جشن یا چرخهٔ شارژ را تکرار کن.']);
  return clue('distraction','برای نگهبان کار بساز','نگهبان آشغال و شارژ را به نگهبانی ترجیح می‌دهد.','کاغذها باید کنار ورودی جمع شوند، دور از کلید.',['تابلو و فن را به منبع وصل کن.','جهت فن را به فضای خالی ورودی تنظیم کن.','راه دیگر: تابلو را خاموش و جایگاه شارژ را روشن کن.']);
 },
 obstacles(w,ctx){return [{x:2.8,z:-1,w:1.4,d:.65},...(!ctx.flags.key||!w.get('latch').state.complete?[{x:4,z:-2.7,w:.4,d:2.6}]:[])];}
};}
