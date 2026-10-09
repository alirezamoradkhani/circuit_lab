import {point,spec,action,hint,common,bounds,setupCommon,powered,toggleAction,disconnectAction} from './chapter2/common.js';
const services=w=>(w.get('lamp').state.installed!==false&&powered(w,'lamp')||w.get('ecoLamp').state.installed&&powered(w,'ecoLamp'))&&powered(w,'fan')&&powered(w,'radio');
export default function createDefinition(){
 const exit=point(5,2.7);
 return {id:'06-night-shift',number:6,title:'شیفت شب',theme:'shelter',start:point(-5,2.7),exit,bounds,
 intro:'مسئول پناهگاه: نور میز، هوا و بی‌سیم را برگردان. گرم‌کن چای را هم اگر شد… مردم منتظرند.',
 components:[...common(exit),spec('workLamp','lamp','چراغ میز · ۶ وات',.5,-1.7,{enabled:false}),
 spec('lamp','ecoLamp','چراغ کم‌مصرف · ۳ وات',-3,-2,{enabled:false,portable:true}),
 spec('ventilation','fan','تهویه · ۳ / ۶ / ۹ وات',2,-2.6,{enabled:false,speed:1}),
 spec('radio','radio','بی‌سیم · ۳ وات',2,.8,{enabled:false}),spec('heater','heater','گرم‌کن چای · ۱۲ وات',-.7,1.5,{enabled:false}),
 spec('table','table','میز اصلی و پایهٔ چراغ',.5,-.4,{portable:false}),spec('worker','chief','مسئول پناهگاه',3.7,.3,{portable:false}),
 spec('latch','flask','قفل فلاسک گرم · ۶ وات',3,2.7,{enabled:true}),spec('papers','papers','کاغذهای روی میز',1,-1,{portable:false}),
 spec('table','backup','باتری ثابت پشتیبان · ۱۲ وات',-4,-3.4,{portable:false,visual:'battery'})],connections:[],
 setup(w){setupCommon(w);const source=w.get('supply');source.state.backup=false;Object.defineProperty(source,'maxWatts',{configurable:true,enumerable:true,get:()=>source.state.backup?12:24});for(const id of ['lamp','fan','radio','heater'])w.connect('supply',id);},
 update(w,dt,ctx){const f=ctx.flags,s=w.get('supply');
  s.state.backup=!!f.blackout;
  if(!f.blackout&&services(w)){f.initialStable=(f.initialStable??0)+dt;if(f.initialStable>=1){f.blackout=true;s.state.backup=true;ctx.say('برق شهر قطع شد! باتری پشتیبان وارد مدار شد: فقط ۱۲ وات برای نور، هوا و بی‌سیم داریم.','warning');}}
  else if(!f.blackout)f.initialStable=0;
  // The three essential services share the shelter bus; Ray's battery is for the optional flask.
  if(f.blackout)for(const id of ['lamp','ecoLamp','fan','radio','heater']){const c=w.connections.get(id);if(c&&c.source!=='supply')w.connect('supply',id);}
  if(f.blackout&&services(w)&&!s.state.tripped&&total(w)<=12){f.stable=(f.stable??0)+dt;if(f.stable>=3&&!f.message){f.message=true;ctx.say('بی‌سیم: «…شارژر… سازگار نیست…» مسئول کلید انبار را به رِی داد.');}}
  else if(!f.message)f.stable=0;
  const windy=powered(w,'fan')&&w.get('fan').state.speed===2;
  w.get('chief').state.expression=windy?'surprised':services(w)?'happy':'worried';
  w.get('papers').state.position=windy?point(3.5,.3,1.5):point(1,-1,.6);
  if(windy&&!f.paperJoke){f.paperJoke=true;ctx.say('کاغذها به صورت مسئول چسبیدند: «چای را فراموش نکن!»');}
  if(w.get('flask').state.complete&&!f.secret){f.secret=true;ctx.say('فلاسک باز شد؛ چای از قبل گرم بود! رِی یک فنجان تعارف کرد.');}
 },
 actions(w,id,ctx){
  if(id==='ecoLamp')return w.get(id).state.installed?[toggleAction(w,id),disconnectAction(w,id)]:[action('carry-lamp','برداشتن چراغ',()=>ctx.take(id)?'چراغ را به میز اصلی ببر.':'دست رِی پر است؛ باتری یا وسیلهٔ همراه را کنار بگذار.')];
  if(id==='table')return [action('install-lamp','نصب چراغ کم‌مصرف',()=>{const lamp=w.get('ecoLamp');if(lamp.state.holder!=='ray')return 'چراغ کم‌مصرف را از قفسه همراه بیاور.';ctx.place('ecoLamp',point(.5,-1.7,.9));lamp.state.installed=true;lamp.state.locked=true;w.disconnect('lamp');w.get('lamp').act('toggle',false);w.get('lamp').state.installed=false;w.get('lamp').state.position=point(-2,-1.7);w.connect('supply','ecoLamp');lamp.act('toggle',true);return 'چراغ ۳ واتی نصب شد؛ چراغ قدیمی کنار گذاشته شد.';})];
  if(id==='chief')return [action('talk','گفت‌وگو',()=>ctx.flags.blackout?'برای هر سه خدمت فقط ۱۲ وات داریم؛ خاموش‌کردن بی‌سیم یا هوا راه‌حل نیست.':'نور میز، گردش هوا و بی‌سیم را روشن کن.')];
  if(id==='backup'||id==='papers')return [];
  return null;
 },ready:(w,ctx)=>!!ctx.flags.message,
 objective(w,ctx){return ctx.flags.message?'پیام دریافت شد؛ با کلید به انبار برو.':ctx.flags.blackout?'روی پشتیبان ۱۲ واتی، نور + هوا + بی‌سیم را پایدار نگه دار.':'نور میز، تهویه و بی‌سیم را برقرار کن.';},
 hint(w,ctx){if(ctx.flags.message)return hint('exit','کلید انبار آماده است','پیام ضروری دریافت شد.','از خروجی سالن عبور کن.',['قفل فلاسک با باتری رِی یک راز اختیاری است.']);
  if(w.get('supply').state.tripped)return hint('overload','ظرفیت پشتیبان پر شده','چراغ ۶ + تهویهٔ میانه ۶ + بی‌سیم ۳ = ۱۵ وات.','گرم‌کن را خاموش کن و دور تهویه را کم کن، سپس محافظ را برگردان.',['چراغ ۶ + تهویهٔ کم ۳ + بی‌سیم ۳ = ۱۲ وات.','یا چراغ ۳ واتی را از قفسه به میز حمل و نصب کن.']);
  if(ctx.flags.blackout)return hint('backup','سه خدمت، ۱۲ وات','پشتیبان نصف مولد اصلی توان دارد.','همهٔ بارهای غیرضروری را قطع کن.',['با چراغ اصلی، تهویه باید دور کم باشد.','با چراغ کم‌مصرف نصب‌شده، دور میانه مجاز است.']);
  return hint('restore','پناهگاه را بیدار کن','مردم به روشنایی میز، هوا و پیام نیاز دارند.','کلید چراغ، تهویه و بی‌سیم را روشن کن.',['هر سه از منبع اصلی سیم دارند.','گرم‌کن چای ضروری نیست.']);
 },obstacles(){return [{x:.5,z:-.4,w:1.2,d:.65}];}
 };
}
function total(w){return ['lamp','ecoLamp','fan','radio','heater'].reduce((sum,id)=>sum+(powered(w,id)?w.get(id).demand(w):0),0);}
