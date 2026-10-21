import {appliances,replacements} from '../../city/adventureData.js';
import {measurePart} from '../../city/ComponentMeter.js';
import {repairHint} from './WorldHints.js';
const names={battery:'باتری',switch:'کلید اصلی',lamp:'لامپ',resistor:'مقاومت'};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function circuitParts(s,devices){
 const loads=s.board.parts.filter(p=>!['battery','switch'].includes(p.type));
 return s.board.parts.map(p=>{
  const owner=devices.find(d=>d.partIds.includes(p.id)),i=loads.indexOf(p);
  let position=p.type==='battery'?{x:-4,z:1.6}:p.type==='switch'?{x:-4,z:-1.6}:{x:-.8+(i%3)*2.5,z:i<3?-1.6:1.6};
  if(s.mission.id==='gate'&&p.type==='lamp')position={x:1.8,z:.2};
  const label=p.label||(['battery','switch'].includes(p.type)?names[p.type]:s.street?.cable===p?'اتصال فرسوده':p.type==='resistor'&&['shop','station'].includes(s.mission.id)?'مقاومت سری':owner?.label||names[p.type]);
  return {id:p.id,part:p,label,position,walk:{x:position.x,z:position.z+.95},kind:p.type,owner};
 });
}
export class WorldCircuit {
 constructor(session,devices){this.s=session;this.canRewire=['gate','street','station'].includes(session.mission.id);
  if(session.mission.id==='clinic'){const b=session.board;while(b.parts.length<6)b.add('resistor');b.wires=[];b.connect('p1:0','p2:0');appliances.forEach((load,i)=>{const p=b.parts[i+2];p.label=load.name;p.value=144/load.power;p.disconnected=!session.loads[i];b.connect('p2:1',p.id+':0');b.connect(p.id+':1','p1:1');});devices=devices.map((d,i)=>i?{...d,partIds:[b.parts[i+1].id]}:{...d,partIds:['p1','p2']});}
  this.parts=circuitParts(session,devices);this.start=null;this.selected=null;this.choice=null;this.hintTarget=null;this.hintStep=0;this.didConnect=false;this.didMeasure=false;this.routes=[];}
 terminals(){return this.parts.filter(d=>this.s.board.parts.includes(d.part)).flatMap(d=>[0,1].map(side=>({id:'pin:'+d.id+':'+side,pin:d.id+':'+side,label:d.label+' · '+(d.kind==='battery'?(side?'−':'+'):side+1),type:'pin',position:{x:d.position.x+(side?.83:-.83),z:d.position.z+.25}})));}
 targets(){return [...this.parts.filter(d=>this.s.board.parts.includes(d.part)).map(d=>({id:'part:'+d.id,type:'part',label:d.label,position:d.walk,device:d})),...this.terminals(),...this.routes.map(r=>({id:'wire:'+r.index,type:'wire',label:'مسیر '+(r.index+1),position:r.center,route:r}))];}
 nearby(player,type=null){return this.targets().filter(t=>(!type||t.type===type)&&this.range(t,player)<1.25).sort((a,b)=>this.range(a,player)-this.range(b,player));}
 range(t,p){if(t.type!=='wire')return distance(t.position,p);return Math.min(...t.route.points.slice(1).map((b,i)=>{const a=t.route.points[i],dx=b.x-a.x,dz=b.z-a.z,k=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return distance(p,{x:a.x+k*dx,z:a.z+k*dz});}));}
 selectNearby(player,cycle=false,type=null){const list=this.nearby(player,type);if(!list.length){this.selected=null;this.lockAt=null;return null;}const old=list.findIndex(t=>t.id===this.selected),locked=this.lockAt&&distance(player,this.lockAt)<.22;const index=cycle?(old+1)%list.length:!type&&locked&&old>=0?old:0;const target=list[index];this.selected=target.id;if(cycle||type)this.lockAt={...player};else if(!locked)this.lockAt=null;return target;}
 target(){return this.targets().find(t=>t.id===this.selected);}
 connect(pin){
  if(this.s.won)return 'این مأموریت تمام شده است.';
  if(!this.canRewire)return 'مسیرهای این مرحله ثابت‌اند؛ قطعه‌ها را اندازه بگیر و تنظیم کن.';
  if(!this.start){this.start=pin;return 'سر اول انتخاب شد؛ کنار پایانهٔ مقصد برو و E بزن. Esc: رها کردن.';}
  const a=this.start;if(a===pin){this.start=null;return 'سر سیم رها شد.';}
  this.s.pending=null;this.s.pin(a);this.s.pin(pin);this.start=null;this.didConnect=true;return 'اتصال: '+this.s.message.replace('برای برداشتن سیم روی خط آن بزن.','برای برداشتن مسیر، کنار آن Q و سپس X بزن.');
 }
 disconnect(){const t=this.target();if(!t||t.type!=='wire')return 'کنار مسیر بایست؛ با Q خود مسیر را انتخاب کن و X بزن.';if(this.s.won)return 'تعمیر تأیید شده است.';if(!this.canRewire)return 'مسیر این مرحله ثابت است؛ کلید شاخه را قطع کن.';this.s.removeWire(t.route.index);this.selected=null;this.start=null;return this.s.message;}
 measure(){const t=this.target();if(!t)return 'کنار یک قطعه یا پایانه بایست و M بزن.';if(t.type==='wire'){this.didMeasure=true;return this.s.tripped?'محافظ قطع است؛ ابتدا علت خرابی را اصلاح کن.':'مسیر رسانای ایده‌آل · افت ولتاژ دو سر مسیر: 0.00 V';}const id=t.device?.id||t.pin?.split(':')[0]||this.s.board.wires[t.route?.index]?.[0]?.split(':')[0];const r=measurePart(this.s,id);this.didMeasure=true;return r?r.name+' · '+(r.voltage===null?'ولتاژ نامشخص':r.voltage.toFixed(2)+' V')+(r.current==null?'':' · '+r.current.toFixed(3)+' A')+(r.error?' · '+r.error:''):'این نقطه اندازه‌گیری ندارد.';}
 options(d){
  const s=this.s,c=s.challenge,p=d.part,out=[];const option=(label,run)=>out.push({label,run});
  if(s.won)return out;
  if(p.type==='switch'){
   if(c?.controls?.some(x=>x.key==='main'))for(const [v,l] of [[0,'قطع'],[1,'وصل']])option(l,()=>c.act('main',v));
   else option(p.closed?'باز کردن کلید':'بستن کلید',()=>s.toggleSwitch());
  }
  if(s.mission.id==='clinic'&&d.owner?.loadIndex!==undefined)option(s.loads[d.owner.loadIndex]?'خاموش کردن':'روشن کردن',()=>{s.toggleLoad(d.owner.loadIndex);p.disconnected=!s.loads[d.owner.loadIndex];});
  if(c){
   const index=c.parts?.indexOf(p)??-1;
   const key=p===c.top?'top':p===c.bottom?'bottom':p===c.trim?'trim':p===c.line?'cable':index>=0?String(index):null;
   let controls=c.controls?.filter(control=>control.key===key||p.type==='battery'&&control.key==='source')||[];
   if(['backup','pumps'].includes(s.mission.id)&&index>=0){const i=Number(key),max=s.mission.id==='backup'&&i===1?2:1;controls=[{key,options:Array.from({length:max+1},(_,v)=>[v,v===0?'خاموش':v===2?'دور زیاد':'روشن / دور کم'])}];}
   if(s.mission.id==='radio'&&['top','bottom'].includes(key))controls=[{key,options:[6,12,24,36,48].map(v=>[v,v+' Ω'])}];
   for(const control of controls)for(const [value,label] of control.options)option(label,()=>c.act(control.key,value));
   if(s.mission.id==='isolation'&&c.parts.includes(p)){const i=c.parts.indexOf(p);option('تعویض طبق پلاک',()=>c.act('repair',i));}
  }
  if(s.street?.lamps.includes(p)){option(s.street.isolated.has(p.id)?'وصل شاخه':'قطع شاخه',()=>s.street.isolate(p.id));option('لامپ جایگزین · ۵ اعتبار',()=>s.street.replace(p.id));}
  if(s.street?.cable===p)option('برداشتن اتصال فرسوده · ۳ اعتبار',()=>s.street.removeCable());
  if(p.type==='resistor'&&['shop','station'].includes(s.mission.id)){
   if(s.shop&&!s.shop.empty)option('خارج کردن مقاومت',()=>s.shop.remove());
   else for(const r of replacements)option(r.value+' Ω · '+r.cost+' اعتبار',()=>s.install(r.value));
  }
  return out;
 }
 hint(){
  const s=this.s;this.hintStep++;
  if(s.mission.id==='gate'){
   const missing=!s.board.wires.some(w=>w.includes('p3:1')&&w.includes('p1:1'));
   this.hintTarget=missing?'pin:p3:1':'part:p2';
   return missing?(this.hintStep===1?'جریان باید یک حلقهٔ کامل بسازد. دو پایانهٔ بدون مسیر را روی زمین پیدا کن.':this.hintStep===2?'سر آزاد چراغ، مسیر برگشت ندارد. کنار پایانهٔ ۲ چراغ برو و E بزن.':'سر دوم چراغ را با E بردار؛ سپس کنار پایانهٔ منفی باتری برو و E بزن. F نتیجه را آزمایش می‌کند.'):'مسیر برگشت کامل است؛ اگر کلید بسته است F بزن. اگر باز است، کنار آن E بزن.';
  }
  if(s.tripped){this.hintTarget='part:p2';return 'محافظ قطع است؛ علت اضافه‌بار را با M بررسی کن. بعد از اصلاح، R محافظ را بازنشانی می‌کند.';}
  if(s.street){const id=s.street.failed.size?[...s.street.failed][0]:s.street.cable?.id;this.hintTarget=id?'part:'+id:null;return s.street.failed.size?'لامپی که ولتاژ دارد اما جریان ندارد خراب است. M روی چراغ‌ها بخوان؛ E برای تعویض.':s.street.cable?'روی مقاومت اتصال فرسوده M بزن؛ افت ولتاژ آن را با چراغ کم‌نور مقایسه کن.':'هر سه چراغ را آزمایش کن؛ بعد یکی را با E قطع کن و استقلال دو شاخهٔ دیگر را با F بسنج.';}
  return repairHint(this);
 }
}
