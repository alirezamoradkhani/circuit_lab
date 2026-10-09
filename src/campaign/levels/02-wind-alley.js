import {p,spec,action,clue,baseComponents,setupBase} from './chapter1/shared.js';
const start=p(-4,2),exit=p(5,-2);
export default function createDefinition(){return {
 id:'02-wind-alley',number:2,title:'بادِ خلاف',theme:'alley',
 intro:'پاک‌رو از کانال گذشت. پنکه می‌تواند راه بسازد؛ اما تابلو و دور تند با هم محافظ را می‌اندازند. کاغذها جهت باد را نشان می‌دهند.',start,exit,bounds:{minX:-6,maxX:6,minZ:-4,maxZ:4},
 components:[...baseComponents(start,exit,12),
 spec('fan','fan','پنکه · ۶ / ۱۲ وات',-2.7,-.8,{speed:1,direction:0,portable:false}),
 spec('sign','sign','تابلوی کوچه · ۳ وات',-4,0,{confetti:false,portable:false}),
 spec('woodCrate','crate','جعبهٔ پل روی ریل',-1.2,0,{from:p(-1.2,0),to:p(.8,0),fan:'fan',threshold:1,windDirection:0,travelSeconds:4,portable:false,visualScale:{x:2.12,y:.3,z:2},visualOffsetY:-.24}),
 spec('rail','rail','ریل جعبه',-.2,0,{portable:false}),
 spec('papers','papers','کاغذهای نشان‌دهندهٔ باد',-2,1,{from:p(-2,1),to:p(.3,1),fan:'fan',threshold:.1,windDirection:0,travelSeconds:2,portable:false}),
 spec('landing','launch','سکوی عبور با باد',-1.4,-2,{portable:false}),
 spec('ride','windRide','مسیر پرواز نرم',-1.4,-2,{actor:'ray',points:[p(-1.4,-2),p(.6,-2,1.5),p(2.4,-2)],duration:2,portable:false,hidden:true}),
 spec('worker','worker','تعمیرکار بی‌کلاه',-3.5,2.7,{portable:false}),
 spec('hat','hat','کلاه تعمیرکار',-3.5,2.7,{from:p(-3.5,2.7,1.5),to:p(3,2,1.5),fan:'fan',threshold:1,windDirection:0,travelSeconds:2,portable:false}),
 spec('statue','statue','مجسمهٔ کلاه‌دار',3,2,{portable:false}),
 spec('ladder','ladder','نردبان کانال',1.4,3,{portable:false})],connections:[],
 setup(w,ctx){setupBase(w);w.connect('supply','fan');w.connect('supply','sign');w.get('supply').state.tripped=true;ctx.flags.introOverload=true;},
 update(w,dt,ctx){
  const fan=w.get('fan'),ride=w.get('windRide'),ray=w.get('ray');
  if(w.get('crate').state.locked)ctx.flags.bridgeBuilt=true;
  if(ride.state.complete)ctx.flags.windCrossed=true;
  if(fan.strength>0){const papers=w.get('papers');if(papers.state.progress>=1){papers.state.progress=0;papers.state.position={...papers.initial.position};}}
  if(ride.state.active)ctx.flags.scriptedMovement=true;else ctx.flags.scriptedMovement=false;
  if(!ride.state.active&&!ctx.flags.bridgeBuilt&&ray.state.position.x>0&&ray.state.position.x<1.7){ray.state.position=p(-1.4,2.8);ctx.flags.falls=(ctx.flags.falls??0)+1;ctx.say('رِی از نردبان بالا آمد؛ اول پل را بساز یا از سکوی باد استفاده کن.');}
  if(w.get('hat').state.locked&&!ctx.flags.hatBlown){ctx.flags.hatBlown=true;ctx.say('کلاه تعمیرکار روی مجسمه نشست!');}
  if(w.connections.get('fan')?.source==='battery'&&w.get('battery').state.holder==='ray'&&Math.hypot(ray.state.position.x+2.7,ray.state.position.z+.8)>2.65){w.disconnect('fan');ctx.say('کابل کوتاه باتری جدا شد؛ برای چهار ثانیه کنار پنکه بمان.');}
 },
 actions(w,id,ctx){const fan=w.get('fan');
  if(id==='fan')return [action('fan-speed',fan.state.speed?'دور کم · ۶ وات':'دور تند · ۱۲ وات',()=>{fan.act('speed');return fan.state.speed?'دور تند انتخاب شد؛ مراقب بار تابلو باش.':'دور کم فقط کاغذها را حرکت می‌دهد.';}),action('fan-direction',fan.state.direction?'جهت: جعبهٔ پل':'جهت: سکوی فرود',()=>{fan.act('direction');return fan.state.direction?'باد رو به سکوی فرود است.':'باد رو به جعبه است.';}),action('fan-toggle',fan.state.enabled?'خاموش':'روشن',()=>{fan.act('toggle');}),action('fan-disconnect','جدا کردن کابل',()=>w.disconnect('fan'))];
  if(id==='launch')return [action('wind-ride','عبور با جریان باد',()=>{if(fan.strength<1||fan.state.direction!==1)return 'پنکه باید روشن، روی دور تند و رو به سکوی فرود باشد.';if(w.connections.get('fan')?.source!=='supply')return 'برای عبور خودت، پنکه را به منبع ثابت وصل کن؛ کابل باتری همراه کوتاه است.';w.get('windRide').act('start');ctx.flags.scriptedMovement=true;return 'رِی خودش را به باد سپرد…';})];
  if(id==='hat'||id==='statue')return [action('return-hat','برگرداندن کلاه تعمیرکار',()=>{if(!ctx.flags.hatBlown)return 'کلاه هنوز روی سر تعمیرکار است.';w.get('hat').state.position=p(-3.5,2.7,1.5);w.get('hat').state.locked=true;ctx.flags.hatReturned=true;w.get('ray').state.expression='proud';return 'کلاه برگشت؛ چهرهٔ «قهرمان باد» باز شد!';})];
  if(id==='crate'||id==='rail'||id==='papers'||id==='windRide')return [];
  if(id==='worker')return [action('worker-talk','گفت‌وگو',()=>ctx.flags.hatReturned?'دمت گرم! حالا خودت هم مثل قهرمان‌ها ژست بگیر.':'تابلو را خاموش کن؛ منبع از پس تابلو و پنکهٔ تند با هم برنمی‌آید.')];
  return null;
 },
 ready(w,ctx){return !!(w.get('crate').state.locked||ctx.flags.windCrossed);},
 objective(w,ctx){return ctx.flags.bridgeBuilt||ctx.flags.windCrossed?'از سمت دیگر کانال وارد بازار شو.':'با باد یک راه امن از کانال بساز.';},
 hint(w,ctx){
  if(ctx.flags.bridgeBuilt||ctx.flags.windCrossed)return clue('cross','راه باز است','جعبه قفل شده یا از باد عبور کرده‌ای.','از خروج کنار شیشهٔ بازار برو.',['اگر باتری به پنکه وصل است کابل را جدا کن.','از پل عبور کن و به نشان خروج برو.']);
  if(w.get('supply').state.tripped)return clue('overload','محافظ پریده است','تابلو ۳ وات و دور تند ۱۲ وات می‌خواهند؛ منبع فقط ۱۲ وات می‌دهد.','یک مصرف‌کنندهٔ غیرضروری را قطع کن.',['تابلو را خاموش یا کابلش را جدا کن.','محافظ منبع را بازنشانی کن.','پنکه را رو به جعبه و روی دور تند بگذار.']);
  if(w.connections.get('fan')?.source==='battery'&&w.get('battery').state.energy<48&&!w.get('crate').state.progress)return clue('charge','باتری برای کل مسیر کافی نیست','چهار ثانیه دور تند به ۴۸ ژول نیاز دارد.','باتری را شارژ کن یا منبع ثابت را به کار بگیر.',['پنکه را موقتاً خاموش کن.','کنار جایگاه شارژ باتری را شارژ کن.','شارژ را متوقف و باتری را دوباره به پنکه وصل کن.']);
  return clue('wind','باد را به کار بگیر','باد ضعیف فقط کاغذها را تکان می‌دهد.','جعبه باید چهار ثانیه باد تند بگیرد.',['برق پنکه را وصل کن.','جهت جعبه و دور تند را انتخاب کن.','تا قفل‌شدن جعبه صبر کن؛ یا جهت فرود را انتخاب و روی سکو عبور با باد را بزن.']);
 },
 obstacles(w,ctx){return w.get('crate').state.locked?[{x:.8,z:-2.5,w:1.3,d:3},{x:.8,z:2.5,w:1.3,d:3}]:[{x:.8,z:0,w:1.3,d:8}];}
};}
