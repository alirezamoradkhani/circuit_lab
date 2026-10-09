import {p,spec,action,clue,baseComponents,setupBase,near} from './chapter1/shared.js';
const start=p(-3,2.5),exit=p(4,-2.7,3),bottom=p(0,2),top=p(0,-2,3);
function latchAllowed(w,ctx){const c=w.connections.get('latch');if(!c)return false;const lift=w.get('lift');if(lift.state.progress<.999||!lift.state.braked)return false;if(c.source==='battery')return w.get('battery').state.position.y>2.5&&!w.get('battery').state.charging;if(c.source==='supply')return !!ctx.flags.reel&&!w.connections.has('lift');return false;}
function drive(w,ctx,target){const lift=w.get('lift');if(w.connections.get('latch')?.source==='supply')return 'کابل سرویس به قفل بالا وصل است؛ پیش از حرکت آن را جدا کن.';if(!near(w.get('ray'),lift,1.8))return 'اول کنار سکوی آسانسور برو.';ctx.flags.riding=true;w.get('ray').state.position={...lift.state.position};lift.act('move',target);lift.state.enabled=true;return target?'رِی سوار شد؛ فرمان صعود ثبت شد.':'فرمان بازگشت به پایین ثبت شد.';}
export default function createDefinition(){return {
 id:'04-elevator',number:4,title:'آسانسور بی‌حوصله',theme:'elevator',intro:'بلندگو: «به پشت‌بام خوش آمدید!» نورا: «هنوز پایینیم؛ خود سکو را ببین.» باتری همراه برای موتور ضعیف است، اما قفل در بالا را باز می‌کند.',start,exit,bounds:{minX:-6,maxX:6,minZ:-4,maxZ:4},
 components:[...baseComponents(start,exit).map(c=>['supply','charger'].includes(c.id)?{...c,position:c.id==='charger'?p(-4,1.2):p(-5,2.5)}:c),
 spec('elevator','lift','سکوی آسانسور · شروع ۲۴ وات',0,2,{from:bottom,to:top,travelSeconds:3,portable:false}),
 spec('lamp','lamp','چراغ بارانداز · ۳ وات',-2,2.5,{portable:false}),
 spec('table','console','کنترل و محافظ آسانسور',-1.5,2,{portable:false}),
 spec('table','upper-console','کنترل طبقهٔ بالا',-1.5,-2,{position:p(-1.5,-2,3),portable:false}),
 spec('latch','latch','قفل مستقل در بالا · ۶ وات',2.7,-2,{position:p(2.7,-2,3),requires:[{id:'upper-permit',field:'latched'}],portable:false}),
 spec('door','upper-permit','اجازهٔ تغذیهٔ قفل',0,0,{portable:false,hidden:true}),
 spec('door','door','در پشت‌بام',3.5,-2.7,{position:p(3.5,-2.7,3),trigger:'latch',portable:false}),
 spec('ladder','ladder','نردبان سرویس',-3,0,{portable:false}),
 spec('reel','reel','قرقرهٔ کابل سرویس',1.6,2.6,{portable:false}),
 spec('toolbox','toolbox','جعبه‌ابزار گمشده',2.7,2.7),
 spec('radio','speaker','بلندگوی رسمی آسانسور',-2.7,1,{portable:false})],connections:[],
 setup(w,ctx){setupBase(w);w.connect('supply','lift');w.connect('supply','lamp');ctx.flags.floor=0;ctx.flags.lastLiftPosition={...bottom};},
 update(w,dt,ctx){
  const lift=w.get('lift'),ray=w.get('ray'),battery=w.get('battery');
  // A global recovery returns Ray to the entry, but preserves the platform and its cargo.
  if(ctx.flags.riding&&ray.state.position.z>1&&Math.hypot(ray.state.position.x-lift.state.position.x,ray.state.position.z-lift.state.position.z)>2.2)ctx.flags.riding=false;
  for(const id of ['battery','toolbox']){const e=w.get(id);if(e.state.holder==='lift')e.state.position={...lift.state.position,x:lift.state.position.x+(id==='battery'?.5:-.5),y:lift.state.position.y+.3};}
  if(ctx.flags.riding){ray.state.position={...lift.state.position};if(lift.state.progress===lift.state.target){ctx.flags.riding=false;ctx.flags.floor=lift.state.progress;ctx.flags.lastLiftPosition={...lift.state.position};if(lift.state.progress===1){ctx.flags.firstAscent=true;ctx.say('ترمز درگیر شد. بلندگو: «همکف!» نورا: «این بار هم اشتباه گفت.»');}}}
  ctx.flags.scriptedMovement=!!ctx.flags.riding;ctx.flags.movementLocked=!!ctx.flags.riding;
  if(!ctx.flags.riding&&Math.abs(ray.state.position.z)>.6)ctx.flags.floor=ray.state.position.z<0?1:0;
  if(ctx.flags.floor===1&&!ctx.flags.riding)ray.state.position.y=3;
  if(ctx.flags.floor===0&&!ctx.flags.riding)ray.state.position.y=0;
  if(battery.state.holder==='ray')battery.state.position={...ray.state.position,y:ray.state.position.y+.8};
  lift.state.blocked=w.connections.get('latch')?.source==='supply';
  w.get('upper-permit').state.latched=latchAllowed(w,ctx);
  if(ctx.flags.firstAscent&&w.get('toolbox').state.position.y>2.5){ctx.flags.honoraryPorter=true;}
 },
 actions(w,id,ctx){const lift=w.get('lift');
  if(id==='lift'&&ctx.flags.riding&&lift.state.progress!==lift.state.target)return [action('onboard-lamp','قطع چراغ بارانداز',()=>{w.get('lamp').act('toggle',false);return 'چراغ قطع شد؛ تمام توان منبع برای شروع موتور آزاد است.';}),action('onboard-reset','بازنشانی محافظ منبع',()=>{w.get('supply').resetBreaker();return 'محافظ بازنشانی شد؛ با اتصال صحیح موتور حرکت ادامه پیدا می‌کند.';}),action('onboard-power','وصل منبع ثابت به موتور',()=>{w.connect('supply','lift');return 'منبع ثابت دوباره به موتور وصل شد.';}),action('onboard-pause',w.connections.has('lift')?'توقف با ترمز مکانیکی':'ادامهٔ حرکت',()=>{if(w.connections.has('lift'))w.disconnect('lift');else w.connect('supply','lift');return 'ترمز و برق موتور تنظیم شد.';})];
  if(id==='lift')return [action('lift-up','سوار شو و بالا برو',()=>drive(w,ctx,1)),action('lift-down','سوار شو و پایین برو',()=>drive(w,ctx,0)),action('load-cargo','گذاشتن بار روی سکو',()=>{const cargo=w.all().find(e=>['battery','toolbox'].includes(e.id)&&e.state.holder==='ray');if(!cargo)return 'باتری یا جعبه‌ابزار را اول بردار.';if(cargo.state.charging)return 'ابتدا کابل شارژ را از باتری جدا کن.';for(const [target,c] of [...w.connections])if(c.source===cargo.id)w.disconnect(target);cargo.state.holder='lift';cargo.state.position={...lift.state.position,y:lift.state.position.y+.3};return `${cargo.config.label} روی سکو قرار گرفت.`;}),action('unload-cargo','برداشتن بار از سکو',()=>{const cargo=w.all().find(e=>e.state.holder==='lift');if(!cargo)return 'باری روی سکو نیست.';if(w.all().some(e=>e.state.holder==='ray'))return 'اول بار فعلی را زمین بگذار.';cargo.state.holder='ray';return `${cargo.config.label} برداشته شد.`;})];
  if(id==='console'||id==='upper-console')return [action('lamp-isolate',w.get('lamp').state.enabled?'قطع چراغ بارانداز':'روشن کردن چراغ بارانداز',()=>{w.get('lamp').act('toggle');return 'کلید چراغ تغییر کرد؛ موتور برای شروع تمام ۲۴ وات را لازم دارد.';}),action('reset-main','بازنشانی محافظ',()=>{w.get('supply').resetBreaker();return 'محافظ بازنشانی شد.';}),action('motor-isolate',w.connections.has('lift')?'ایزوله‌کردن موتور':'وصل منبع به موتور',()=>{if(w.connections.has('lift')){w.disconnect('lift');return 'موتور ایزوله شد؛ ترمز مکانیکی سکو را نگه می‌دارد.';}w.connect('supply','lift');return 'منبع ثابت به موتور وصل شد.';}),action('call-lift','فراخوانی سکو به این طبقه',()=>{if(w.connections.get('latch')?.source==='supply')return 'اول کابل سرویس قفل را جدا کن.';lift.act('move',id==='console'?0:1);return 'سکو با فرمان فراخوانی به این طبقه می‌آید.';})];
  if(id==='reel')return [action('take-reel','برداشتن کابل سرویس',()=>{ctx.flags.reel=true;w.get('reel').state.visible=false;return 'کابل سرویس برداشته شد؛ پس از توقف و ایزوله‌کردن موتور می‌توانی قفل بالا را از منبع برق بدهی.';})];
  if(id==='latch')return [action('battery-latch','وصل باتری همراه به قفل',()=>{if(w.get('battery').state.position.y<2.5)return 'باتری هنوز پایین است؛ آن را با سکو یا نردبان بالا بیاور.';w.connect('battery','latch');w.get('upper-permit').state.latched=latchAllowed(w,ctx);return 'باتری به قفل وصل شد؛ یک ثانیه برق کافی است.';}),action('service-latch','وصل کابل سرویس به قفل',()=>{if(!ctx.flags.reel)return 'قرقرهٔ سرویس را از پایین بردار.';if(w.connections.has('lift'))return 'ابتدا موتور را از پنل کنترل ایزوله کن.';if(lift.state.progress<1)return 'ابتدا سکو را به توقف بالا برسان.';w.connect('supply','latch',{cable:'reel'});w.get('upper-permit').state.latched=latchAllowed(w,ctx);return 'منبع ثابت از کابل سرویس به قفل متصل شد.';}),action('disconnect-latch','جدا کردن کابل قفل',()=>{w.disconnect('latch');lift.state.blocked=false;})];
  if(id==='ladder')return [action('open-ladder','بازکردن نردبان سرویس',()=>{if(!ctx.flags.firstAscent)return 'نردبان از بالا باز می‌شود؛ یک بار با سکو صعود کن.';w.get('ladder').act('latch');ctx.flags.ladder=true;return 'راه برگشت امن باز شد.';}),action('use-ladder',ctx.flags.floor?'برگشت به پایین':'بالارفتن از نردبان',()=>{if(!ctx.flags.ladder)return 'اول نردبان را از بالا باز کن.';ctx.flags.floor=ctx.flags.floor?0:1;w.get('ray').state.position=ctx.flags.floor?p(-3,-1.6,3):p(-3,1.6);return 'رِی از نردبان عبور کرد.';})];
  if(id==='speaker')return [action('speaker-talk','شنیدن اعلام طبقه',()=>lift.state.progress===0?'بلندگو: «پشت‌بام، منظرهٔ بی‌نظیر!» نورا: «فقط یک دیوار می‌بینم.»':'بلندگو: «همکف!» رِی به آسمان نگاه می‌کند.')];
  if(id==='upper-permit'||id==='door')return [];
  return null;
 },
 ready(w,ctx){return !!(ctx.flags.floor===1&&w.get('latch').state.complete&&ctx.flags.ladder);},
 objective(w,ctx){return !ctx.flags.firstAscent?'باتری را روی سکو ببر و با منبع ثابت صعود کن.':!w.get('latch').state.complete?'قفل مستقل در بالا را با باتری یا کابل سرویس برق بده.':!ctx.flags.ladder?'نردبان سرویس را باز کن تا راه برگشت امن بماند.':'از در پشت‌بام عبور کن.';},
 hint(w,ctx){
  if(w.get('supply').state.tripped)return clue('startup','موتور راه نیفتاد','شروع موتور ۲۴ وات و چراغ ۳ وات است؛ منبع فقط ۲۴ وات می‌دهد.','از کنترل، چراغ را قطع و محافظ را برگردان.',['چراغ بارانداز را ایزوله کن.','محافظ منبع را بازنشانی کن.','منبع ثابت باید به موتور متصل باشد؛ باتری تنها ۱۲ وات می‌دهد.']);
  if(!ctx.flags.firstAscent)return clue('cargo','باتری باید همراهت بالا بیاید','باتری برای موتور کافی نیست؛ قفل بالا به آن نیاز دارد.','بار را واقعاً روی سکو بگذار.',['کنار سکو «گذاشتن بار» را بزن.','چراغ را قطع و منبع ثابت را به موتور وصل کن.','روی سکو فرمان صعود بده.']);
  if(!w.get('latch').state.complete)return clue('upper-lock','قفل برق جدا می‌خواهد','ترمز بدون برق سکو را نگه می‌دارد.','باتری بالا را به قفل وصل کن؛ یا موتور را ایزوله کن.',['باتری را از سکو بردار و به قفل بالا وصل کن.','راه دیگر: قرقره را بردار، موتور را ایزوله و کابل سرویس را به قفل وصل کن.','اگر باتری پایین مانده نردبان را باز کن و برگرد.']);
  return clue('ladder','پیش از خروج، راه برگشت','در باز است؛ نردبان باید ایمن و باز بماند.','نردبان سرویس را باز کن.',['ابتدا کابل قفل را اگر به باتری همراه وصل است جدا کن.','نردبان را باز کن.','از در پشت‌بام خارج شو.']);
 },
 obstacles(w,ctx){return [{x:0,z:0,w:12,d:.6},...(!w.get('latch').state.complete?[{x:3.5,z:-2.7,w:.35,d:2}]:[])];}
};}
