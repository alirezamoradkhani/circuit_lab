import {Board} from '../../builder/Board.js';
import {measureCircuit} from '../../city/CircuitMeter.js';

export const REPAIR_CABINET={x:-.95,y:1.7,z:-3.8};
export const REPAIR_WALK={x:-.9,z:-3.1};
export const REPAIR_INPUT={x:-1.72,y:2.18,z:-3.65};
export const REPAIR_SAVE_KEY='circuit-lab.story.workshop.repair.v1';
export const REPAIR_NAMES={source:'ورودی ۱۲ ولت',switch:'کلید تابلو',resistor:'مقاومت سری',lamp:'چراغ کنترل'};
export const PARTS=['source','switch','resistor','lamp'];
export const VALUES=[6,12,24,36];
export function freshRepair(){
 const b=new Board();
 for(const [id,type,value] of [['source','battery',12],['switch','switch',0],['resistor','resistor',6],['lamp','lamp',12]]){
  const p=b.add(type);p.id=id;p.value=value;p.closed=false;
 }
 // Two faults: the return conductor is missing and the installed resistor is too small.
 b.wires=[['source:0','switch:0'],['switch:1','resistor:0'],['resistor:1','lamp:0']];
 return {version:1,board:JSON.parse(b.snapshot()),tripped:false,measured:false,offTest:false,onTest:false,accepted:false,reading:null,moves:0};
}
function boardOf(s){const b=new Board();b.restore(JSON.stringify(s.repair.board));return b;}
export function sourcePresent(s){return s.connections.latch==='mains'||s.connections.latch==='battery'&&s.energy>1e-8;}
export function circuitReading(s,{raw=false,closed}={}){
 const b=boardOf(s);b.parts.find(p=>p.id==='source').value=sourcePresent(s)&&(raw||!s.repair.tripped)?12:0;
 if(closed!==undefined)b.parts.find(p=>p.id==='switch').closed=closed;
 const r=measureCircuit(b),lamp=b.parts.find(p=>p.id==='lamp');
 const lampVoltage=r.volts.lamp??0;
 return {...r,terminals:r.terminals??{},lampVoltage,lampCurrent:lampVoltage/lamp.value,source:sourcePresent(s),safe:!r.short&&Number.isFinite(r.current)&&r.current<=.65+1e-8};
}
export function repairReady(s){
 if(!s.repair)return true;
 const r=circuitReading(s);return !s.repair.tripped&&s.repair.accepted&&r.source&&r.safe&&Math.abs(r.lampCurrent-.5)<.005;
}
function invalidate(s){s.repair.accepted=false;s.repair.measured=false;s.repair.offTest=false;s.repair.onTest=false;s.repair.reading=null;s.latchTime=0;}
function result(ok,message,sound='click'){return {ok,message,sound};}
export function editRepair(s,action,a,b){
 if(s.completed||s.door)return result(false,'تعمیر تحویل شده؛ برای آزمایش دوباره، مرحله را از نو شروع کن.');
 const sw=s.repair.board.parts.find(p=>p.id==='switch');
 if(['connect','remove','resistor'].includes(action)&&sw.closed)return result(false,'اول کلید تابلو را باز کن؛ سیم و قطعه را در مدار قطع تغییر بده.');
 if(action==='switch'){
  sw.closed=!sw.closed;s.repair.accepted=false;s.latchTime=0;
  return result(true,sw.closed?'کلید بسته شد؛ جریان را با مولتی‌متر بررسی کن.':'کلید باز شد؛ اکنون می‌توانی سیم و مقاومت را تعمیر کنی.');
 }
 if(action==='reset-protector'){
  if(sw.closed)return result(false,'برای بازنشانی محافظ، کلید را باز کن.');
  s.repair.tripped=false;return result(true,'محافظ بازنشانی شد. علت اضافه‌جریان باید برطرف شده باشد.');
 }
 const board=boardOf(s);
 if(action==='connect'){
  const pins=board.parts.flatMap(p=>[p.id+':0',p.id+':1']);
  if(!pins.includes(a)||!pins.includes(b))return result(false,'سر سیم باید روی یکی از پایانه‌های مسی قرار بگیرد.');
  if(!board.connect(a,b))return result(false,'این اتصال موجود است یا دو پایانه متعلق به یک قطعه‌اند.');
 }else if(action==='remove'){
  const i=Number(a);if(!Number.isInteger(i)||!board.wires[i])return result(false,'سیمی انتخاب نشده است.');
  board.wires.splice(i,1);
 }else if(action==='resistor'){
  const value=Number(a);if(!VALUES.includes(value))return result(false,'این قطعه در کیف موجود نیست.');
  board.parts.find(p=>p.id==='resistor').value=value;
 }else return result(false,'عملیات نامعتبر است.');
 s.repair.board=JSON.parse(board.snapshot());s.repair.moves++;invalidate(s);
 return result(true,action==='resistor'?'مقاومت سری عوض شد. جریان را دوباره آزمایش کن.':action==='remove'?'سیم جدا شد؛ پایانه‌های آزاد را ببین.':'سیم وصل شد؛ اتصال ظاهری کافی نیست، مسیر کامل را آزمایش کن.',action==='remove'?'unplug':'plug');
}
export function measureRepair(s,id){
 const r=circuitReading(s),p=s.repair.board.parts.find(p=>p.id===id);
 if(!p)return result(false,'پراب را روی بدنه یک قطعه بگذار.');
 const voltage=id==='source'?(r.source&&!s.repair.tripped?12:0):id==='switch'?Math.abs((r.terminals['switch:0']??0)-(r.terminals['switch:1']??0)):(r.volts[id]??0);
 const current=id==='lamp'||id==='resistor'?voltage/p.value:(r.current??0);
 s.repair.reading={id,voltage:Number.isFinite(voltage)?voltage:0,current:Number.isFinite(current)?current:0};
 if(id==='lamp'&&Math.abs(r.lampCurrent-.5)<.005&&!s.repair.tripped)s.repair.measured=true;
 return result(true,`${REPAIR_NAMES[id]}: ${voltage.toFixed(2)} V · ${current.toFixed(2)} A`);
}
export function testRepair(s){
 const r=circuitReading(s),sw=s.repair.board.parts.find(p=>p.id==='switch');
 if(!r.source)return result(false,'ورودی برق ندارد. کابل رِی یا پریز را به سوکت ضامن وصل کن.');
 if(s.repair.tripped)return result(false,'محافظ قطع است؛ کلید را باز کن، ایراد را رفع کن و محافظ را بازنشانی کن.');
 if(!r.safe)return result(false,'اتصال کوتاه یا اضافه‌جریان؛ سیم‌ها و مقاومت سری را بررسی کن.');
 if(!sw.closed){
  const on=circuitReading(s,{closed:true});
  if(r.lampCurrent>.005)return result(false,'کلید دور زده شده است؛ با کلید باز هنوز جریان از چراغ می‌گذرد.');
  if(Math.abs(on.lampCurrent-.5)>.005)return result(false,'جریان صفر است، اما هنوز مدار سالم تأیید نشده. مسیر برگشت و مقاومت را بررسی کن.');
  s.repair.offTest=true;return result(true,'آزمون قطع درست: با کلید باز، جریان چراغ صفر است. حالا کلید را ببند و جریان کاری را بررسی کن.');
 }
 if(Math.abs(r.lampCurrent-.5)>.005)return result(false,`جریان چراغ ${r.lampCurrent.toFixed(2)} A است؛ روی پلاک، جریان کاری ۰٫۵ آمپر نوشته شده. مسیر برگشت و مقاومت سری را بررسی کن.`);
 s.repair.onTest=true;
 if(!s.repair.measured)return result(false,'مدار روشن است؛ با مولتی‌متر جریان چراغ کنترل را اندازه بگیر تا مقدار واقعی را تأیید کنی.');
 if(!s.repair.offTest)return result(false,'جریان درست است؛ یک‌بار با کلید باز هم آزمایش کن تا مطمئن شوی کلید مسیر را واقعاً قطع می‌کند.');
 s.repair.accepted=true;return result(true,'تحویل تعمیر: جریان ۰٫۵ آمپر و قطع کلید تأیید شد. مدار ۲۴ اهم است؛ ضامن اکنون برق می‌گیرد.','complete');
}
export function tickRepair(s,events){
 if(s.repair.tripped||s.door)return;
 const r=circuitReading(s,{raw:true});
 if(r.source&&!r.safe){s.repair.tripped=true;s.repair.accepted=false;s.latchTime=0;events.push('repair-trip');}
}
export function restoreRepair(value){
 const fresh=freshRepair();if(!value||value.version!==1||!value.board)return fresh;
 try{
  const b=new Board();b.restore(JSON.stringify(value.board));
  if(b.parts.length!==4||!PARTS.every(id=>b.parts.filter(p=>p.id===id).length===1))return fresh;
  if(!b.parts.every(p=>p.type===fresh.board.parts.find(f=>f.id===p.id).type))return fresh;
  if(b.parts.find(p=>p.id==='source').value!==12||b.parts.find(p=>p.id==='lamp').value!==12||!VALUES.includes(b.parts.find(p=>p.id==='resistor').value))return fresh;
  const pins=b.parts.flatMap(p=>[p.id+':0',p.id+':1']);
  if(!Array.isArray(b.wires)||b.wires.length>16||!b.wires.every(w=>Array.isArray(w)&&w.length===2&&w.every(p=>pins.includes(p))))return fresh;
  return {...fresh,board:JSON.parse(b.snapshot()),tripped:value.tripped===true,measured:value.measured===true,offTest:value.offTest===true,onTest:value.onTest===true,accepted:value.accepted===true,moves:Number.isFinite(value.moves)?value.moves:0};
 }catch{return fresh;}
}
export function repairHint(s){
 if(!sourcePresent(s))return 'تابلو ورودی ۱۲ ولت می‌خواهد. پس از بازکردن راه چرخ‌دستی، باتری رِی یا کابل بلند پریز را به ضامن وصل کن.';
 if(s.repair.tripped)return 'محافظ اضافه‌جریان را قطع کرده. کلید را باز کن؛ پلاک چراغ و مقدار مقاومت سری را مقایسه کن.';
 const r=circuitReading(s);
 if(!s.repair.board.wires.some(w=>w.includes('lamp:1')))return 'جریان یک مسیر رفت و برگشت می‌خواهد. پایانه دوم چراغ هنوز سیم برگشت ندارد؛ به قطب منفی منبع نگاه کن.';
 if(s.repair.board.parts.find(p=>p.id==='resistor').value!==12)return 'پلاک چراغ: ۱۲ اهم و جریان ۰٫۵ آمپر. برای منبع ۱۲ ولت، مقاومت کل لازم ۲۴ اهم است؛ سهم مقاومت سری چقدر می‌شود؟';
 if(!s.repair.offTest)return 'کلید را باز کن و مدار را آزمایش کن. جریان صفر باید نتیجه قطع کلید باشد، نه نتیجه سیم گمشده.';
 if(!s.repair.measured)return 'کلید را ببند؛ ابزار مولتی‌متر را انتخاب کن و روی چراغ کنترل بزن تا جریان را بخوانی.';
 if(!s.repair.accepted)return 'مدار را در حالت روشن آزمایش کن؛ جریان کاری و عملکرد کلید هر دو باید تأیید شوند.';
 return r.source?'تعمیر تأیید شده؛ ضامن آزاد می‌شود. کابل رِی را جدا کن، رسید را بردار و از در برو.':'ورودی را دوباره وصل کن.';
}
