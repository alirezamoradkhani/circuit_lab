import {point,spec,action,hint,common,bounds,setupCommon,carried} from './chapter2/common.js';
export default function createDefinition(){
 const exit=point(5,2.7);
 return {id:'08-radio-rooftop',number:8,title:'صدایی روی پشت‌بام',theme:'rooftop',start:point(-5,2.7),exit,bounds,
 intro:'پیام پاک‌رو بریده‌بریده است. فرستنده را روی میز نصب کن، آنتن را قفل کن و برق گیرنده را در حالت متصل اندازه بگیر.',
 components:[...common(exit),spec('divider','divider','میز تقسیم ولتاژ · دو پایهٔ بالا، یک پایین',.7,-.3,{inputVoltage:12,receiver:'receiver',portable:false}),
 spec('receiver','receiver','گیرنده · بار ۱۲ اهم، ورودی ۴ ولت',2.3,-.3,{divider:'divider',antenna:'antenna',connected:false,targetVoltage:4,tolerance:.08,direction:0,portable:false}),
 spec('antenna','antenna','آنتن و ضامن جهت',3.5,-2.5,{stops:2,portable:false}),spec('transmitter','transmitter','فرستندهٔ نجات‌یافته',-3,1.7,{portable:true}),
 spec('resistor','r12a','مقاومت ۱۲ اهم · الف',-2.7,-1.5,{ohms:12,rating:6,portable:true}),
 spec('resistor','r12b','مقاومت ۱۲ اهم · ب',-1.8,-1.5,{ohms:12,rating:6,portable:true}),
 spec('resistor','r24a','مقاومت ۲۴ اهم · الف',-2.7,-.5,{ohms:24,rating:6,portable:true}),
 spec('resistor','r24b','مقاومت ۲۴ اهم · ب',-1.8,-.5,{ohms:24,rating:6,portable:true}),
 spec('resistor','r6','مقاومت ۶ اهم',-2.7,.5,{ohms:6,rating:6,portable:true}),
 spec('resistor','r36','مقاومت ۳۶ اهم',-1.8,.5,{ohms:36,rating:6,portable:true}),
 spec('sign','beacon','چراغ چشمک‌زن ساختمان دور',4.8,-3.5,{portable:false,interactive:false})],connections:[],
 setup(w){setupCommon(w);w.connect('supply','divider');w.connect('supply','beacon');w.get('antenna').state.direction=1;},
 update(w,dt,ctx){const f=ctx.flags,antenna=w.get('antenna'),receiver=w.get('receiver'),divider=w.get('divider');
  f.wind=(f.wind??0)+dt;if(!antenna.state.locked&&f.wind>=8){f.wind=0;antenna.act('direction',1-antenna.state.direction);ctx.say('باد آنتن آزاد را چرخاند؛ جهت مناسب را با ضامن ثابت کن.');}
  if(!f.mounted){receiver.state.connected=false;receiver.state.received=false;}
  for(const slot of ['top','bottom'])divider.state[slot].forEach((id,i)=>{w.get(id).state.position=point(.35+i*.65,slot==='top'?-.8:.3,.65);});
  if(receiver.state.quality==='alternate'){f.cooking=(f.cooking??0)+dt;if(f.cooking>=3&&!f.secret){f.secret=true;ctx.say('رادیوی آشپزی: «نمک برای مدار توصیه نمی‌شود!» دستور سوپ پیچ‌ومهره ثبت شد.');}}
  if(f.mounted&&receiver.state.quality==='clear'&&!f.message){f.message=true;ctx.say('پاک‌رو: «اسمش پیکو است. باتری را برای نجاتش بردم؛ شارژر سازگار پیدا نکردم… ما در باغ هستیم.»');}
  const voltage=divider.state.output;
  if(receiver.state.connected&&voltage>0&&Math.abs(voltage-4)>.08&&!f.loadClue){f.loadClue=true;ctx.say(`با وصل شدن گیرنده، خروجی ${voltage.toFixed(2)} ولت شد. گیرنده خودش بخشی از مدار است.`,'warning');}
 },
 actions(w,id,ctx){
  if(id.startsWith('r')&&/^r(12|24|6|36)/.test(id))return w.get(id).state.holder==='divider'?[]:[action('carry-resistor','برداشتن مقاومت',()=>ctx.take(id)?'مقاومت را به میز تقسیم ولتاژ ببر.':'دست رِی پر است؛ وسیلهٔ همراه را روی زمین بگذار.')];
  if(id==='divider')return [action('install-top','گذاشتن در شاخهٔ بالا',()=>install(w,ctx,'top')),action('install-bottom','گذاشتن در شاخهٔ پایین',()=>install(w,ctx,'bottom')),
   action('remove-top','برگرداندن قطعهٔ بالایی به سینی',()=>remove(w,'top')),action('remove-bottom','برگرداندن قطعهٔ پایینی به سینی',()=>remove(w,'bottom'))];
  if(id==='receiver')return [action('mount','نصب فرستندهٔ همراه',()=>{const t=w.get('transmitter');if(ctx.flags.mounted)return 'فرستنده نصب شده است.';if(t.state.holder!=='ray')return 'فرستندهٔ نجات‌یافته را همراه بیاور.';ctx.place('transmitter',point(2.3,-.3,.8));t.state.locked=true;ctx.flags.mounted=true;return 'فرستنده در پایه جا افتاد؛ حالا گیرنده را به خروجی وصل کن.';}),
   action('connect-load',w.get(id).state.connected?'جدا کردن بار گیرنده':'وصل کردن بار گیرنده',()=>{if(!ctx.flags.mounted)return 'اول فرستنده را روی پایه نصب کن.';w.get(id).state.connected=!w.get(id).state.connected;return w.get(id).state.connected?'گیرندهٔ ۱۲ اهمی به شاخهٔ پایین وصل شد.':'گیرنده جدا شد؛ مولتی‌متر خروجی بی‌بار را می‌بیند.';}),
   action('listen','شنیدن پیام',()=>w.get(id).state.quality==='clear'?'پاک‌رو: «پیکو در باغ است؛ برای نجاتش کمک می‌خواهم.»':w.get(id).state.quality==='alternate'?'برنامهٔ آشپزی: نمک برای مدار توصیه نمی‌شود!':'«باتری را… بردم…» باقی پیام در نویز گم شده است.')];
  if(id==='antenna')return [action('direction','چرخاندن به توقف دیگر',()=>{if(w.get(id).state.locked)return 'اول ضامن آنتن را باز کن.';w.get(id).act('direction',1-w.get(id).state.direction);return w.get(id).state.direction===0?'آنتن رو به چراغ دوردست است.':'آنتن رو به ایستگاه آشپزی است.';}),action('lock',w.get(id).state.locked?'باز کردن ضامن':'قفل کردن جهت',()=>{w.get(id).act('lock');return w.get(id).state.locked?'جهت آنتن ثابت شد.':'آنتن آزاد شد و باد می‌تواند آن را بچرخاند.';})];
  if(id==='transmitter')return ctx.flags.mounted?[]:[action('take-transmitter','برداشتن فرستنده',()=>ctx.take(id)?'فرستنده را به پایهٔ گیرنده ببر.':'دست رِی پر است؛ باتری را کنار بگذار.')];
  return null;
 },ready:(w,ctx)=>!!ctx.flags.message&&!!ctx.flags.mounted,
 objective(w,ctx){return ctx.flags.message?'مقصد باغ معلوم شد؛ از درگاه خدمات خارج شو.':!ctx.flags.mounted?'فرستنده را روی پایهٔ گیرنده نصب کن.':`پیام را واضح کن · خروجی ${w.get('divider').state.output.toFixed(2)} ولت${w.get('receiver').state.connected?' زیر بار':' بی‌بار'}`;},
 hint(w,ctx){if(!ctx.flags.mounted)return hint('mount','فرستنده هنوز نصب نشده','گیرنده بدون وسیلهٔ نجات‌یافته پیام ندارد.','باتری را کنار بگذار؛ فرستنده را به پایهٔ گیرنده حمل کن.',['روی پایه، نصب فرستنده را بزن.']);
  if(!w.get('receiver').state.connected)return hint('load','عدد بی‌بار کافی نیست','گیرنده یک مقاومت ۱۲ اهمی به مدار اضافه می‌کند.','بار گیرنده را وصل کن و دوباره خروجی را بخوان.',['۲۴ بالا و ۱۲ پایین بدون بار ۴ ولت است، ولی با گیرنده ۲٫۴ ولت می‌شود.']);
  if(Math.abs(w.get('divider').state.output-4)>.08)return hint('divider','گیرنده با مقاومت پایین موازی است','ولتاژ باید در حالت متصل حدود ۴ ولت باشد.','۱۲ پایین با بار ۱۲، معادل ۶ اهم می‌شود.',['یک ۱۲ اهم در بالا و یک ۱۲ اهم در پایین نصب کن.','راه دیگر: دو ۲۴ اهم در پایه‌های موازی بالا، یک ۱۲ اهم پایین.','قطعهٔ اضافی را به سینی برگردان؛ قطعات از بین نمی‌روند.']);
  return hint('antenna','برق مناسب است؛ جهت پیام را پیدا کن','آنتن باید رو به ساختمان چشمک‌زن و قفل باشد.','ضامن را باز کن، جهت را تنظیم کن، دوباره قفل کن.',['جهت دیگر برنامهٔ آشپزی می‌گیرد و راز اختیاری دارد.']);
 },obstacles(){return [];}
 };
}
function install(w,ctx,slot){const piece=carried(w),divider=w.get('divider');if(!piece||piece.kind!=='Resistor')return 'یک مقاومت را از سینی بردار و همراه بیاور.';if(divider.state[slot].length>=(slot==='top'?2:1))return 'این شاخه پر است؛ ابتدا یک قطعه را به سینی برگردان.';ctx.place(piece.id,{...divider.state.position});if(!divider.install(slot,piece.id,w))return 'این قطعه در جایگاه نصب نمی‌شود.';return slot==='top'?'مقاومت در شاخهٔ بالایی نصب شد؛ دو پایهٔ بالا با هم موازی‌اند.':'مقاومت در شاخهٔ پایینی نصب شد.';}
function remove(w,slot){const divider=w.get('divider'),id=divider.state[slot].at(-1);if(!id)return 'این شاخه خالی است.';divider.remove(id,w);w.get(id).state.position={...w.get(id).initial.position};return 'قطعه سالم به سینی برگشت.';}
