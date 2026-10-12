import {LOADS,NAMES,PORTS,distance,walkPoint,portPosition} from './layout.js';
import {powered} from './state.js';
const result=(ok,message,sound='click')=>({ok,message,sound});
export function interact(s,id){
  const point=walkPoint(id,s);
  if(!point||distance(s.player,point)>1.35)return result(false,'اول به وسیله نزدیک شو.');
  if(id==='cart'){
    if(s.cart>=1)return result(true,'راه باز شد. پشت چرخ‌دستی را ببین.');
    if(Object.values(s.connections).includes('battery')||s.charging)return result(false,'قبل از هل‌دادن، کابل رِی را جدا کن.');
    s.pushing=true;return result(true,'رِی: یک… دو… بکش!','push');
  }
  if(id==='receipt'){s.receipt=true;return result(true,'«یک شارژر سازگار… برای پیکو» — پاک‌رو این را جا گذاشته.','paper');}
  if(id==='reel'){
    if(s.cart<0.95)return result(false,'چرخ‌دستی راه قرقره را بسته.');
    s.reel=true;return result(true,'کابل بلند برداشته شد؛ پریز می‌تواند مستقیم به ضامن برسد.','pickup');
  }
  if(id==='mains')return result(true,s.cart<0.95?'چرخ‌دستی راه پریز را بسته.':'برای شارژ، ابزار کابل را بزن و پریز را به رِی وصل کن.');
  if(id==='exit')return result(false,!s.door?'کرکره ضامن برقی دارد. جعبهٔ کوچک کنارش را ببین.':!s.receipt?'رسید پاک‌رو کنار میز جا مانده؛ شاید سرنخی باشد.':'کابل رِی را جدا کن و از آستانه رد شو.');
  return result(true,id==='latch'?'یک ثانیه برق، ضامن را آزاد می‌کند. کابل را بین منبع و ضامن بکش.':'با ابزار کابل، باتری رِی را به سوکت این وسیله وصل کن.');
}
export function connect(s,a,b){
  if(a===b)return result(false,'سر دوم کابل را روی یک سوکت دیگر بگذار.');
  if([a,b].includes('mains')&&s.cart<0.95)return result(false,'اول چرخ‌دستی را عقب بکش تا به پریز برسی.');
  if([a,b].includes('mains')&&[a,b].includes('battery')){
    if(s.charging){s.charging=false;return result(true,'کابل شارژ جدا شد.','unplug');}
    if(Object.values(s.connections).includes('battery'))return result(false,'اول کابل مصرف‌کننده‌ها را از رِی جدا کن.');
    if(distance(s.player,PORTS.mains)>2.65)return result(false,'برای شارژ کنار پریز برو؛ کابل رِی کوتاه است.');
    s.charging=true;return result(true,'شارژ از پریز؛ حلقهٔ باتری پر می‌شود.','plug');
  }
  const source=['battery','mains'].includes(a)?a:b;
  const target=source===a?b:a;
  if(!['battery','mains'].includes(source)||!Object.hasOwn(LOADS,target))return result(false,'یک سر کابل به منبع، سر دیگر به مصرف‌کننده وصل می‌شود.');
  if(s.connections[target]===source){s.connections[target]=null;return result(true,'کابل '+NAMES[target]+' جدا شد.','unplug');}
  if(source==='mains'&&!s.reel)return result(false,'کابل پریز کوتاه است. قرقرهٔ پشت چرخ‌دستی را بردار.');
  if(source==='mains'&&Object.entries(s.connections).some(([id,v])=>id!==target&&v==='mains'))return result(false,'قرقره یک کابل بلند دارد؛ اتصال قبلی آن را جدا کن.');
  if(source==='battery'&&s.charging)return result(false,'اول کابل شارژ را جدا کن.');
  if(source==='battery'&&distance(s.player,portPosition(target,s))>2.65)return result(false,'کابل کوتاه است؛ رِی را نزدیک '+NAMES[target]+' ببر.');
  s.connections[target]=source;
  return result(true,source==='battery'&&s.energy<=0?'کابل وصل است ولی باتری خالی است؛ پریز پشت چرخ‌دستی شارژت می‌کند.':'اتصال برقرار شد. برای جداکردن، دوباره همین دو سوکت را انتخاب کن.','plug');
}
export function disconnect(s,id){
  if(id==='battery'){s.charging=false;for(const key of Object.keys(LOADS))if(s.connections[key]==='battery')s.connections[key]=null;}
  else if(id==='mains'){s.charging=false;for(const key of Object.keys(LOADS))if(s.connections[key]==='mains')s.connections[key]=null;}
  else if(Object.hasOwn(LOADS,id))s.connections[id]=null;
  return result(true,'کابل جدا شد.','unplug');
}
export function measure(s,id){
  if(id==='battery')return 'باتری رِی · '+(s.energy>0?'۱۲':'۰')+' ولت · '+Math.ceil(s.energy).toLocaleString('fa-IR')+' ژول';
  if(id==='mains')return 'پریز تعمیرگاه · ۱۲ ولت · ظرفیت ۲۴ وات';
  if(Object.hasOwn(LOADS,id)){
    const on=powered(s,id),watts=id==='latch'&&s.door?0:LOADS[id];
    return NAMES[id]+' · '+(on?'۱۲':'۰')+' ولت · '+(on?watts/12:0).toLocaleString('fa-IR')+' آمپر'+(id==='latch'&&s.door?' · ضامن مکانیکی باز':'');
  }
  return 'پراب را روی سوکت یک وسیله بگذار.';
}
