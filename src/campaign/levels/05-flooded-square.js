import {point,spec,action,hint,common,bounds,setupCommon,powered} from './chapter2/common.js';
export default function createDefinition(){
 const exit=point(4.9,-2.7);
 return {id:'05-flooded-square',number:5,title:'میدانِ زیر آب',theme:'water',
 intro:'دوچرخه‌سوار پشت آب گیر کرده. مکش و خروجی پمپ را درست ببند؛ میدان که خشک شود راه پناهگاه باز می‌شود.',start:point(-5,2.7),exit,bounds,
 components:[...common(exit),spec('basin','basin','میدان آب‌گرفته',2,0,{level:1,portable:false}),
 spec('pump','pump1','پمپ اول · شروع ۱۸، کار ۶ وات',-1.6,-1.9,{enabled:false,hose:'hose1',basin:'basin',drain:'drain',rate:.025}),
 spec('pump','pump2','پمپ دوم · شروع ۱۸، کار ۶ وات',-1.6,1.5,{enabled:false,hose:'hose2',basin:'basin',drain:'drain',rate:.025}),
 spec('hose','hose1','شلنگ پمپ اول',-2.5,-1.4),spec('hose','hose2','شلنگ پمپ دوم',-2.5,1.3),
 spec('pipe','drain','خروجی تخلیهٔ میدان',-.5,-3,{portable:false}),spec('lamp','lamp','چراغ کار · ۳ وات',-3,2.6),
 spec('worker','cyclist','دوچرخه‌سوار',-4,3,{portable:false}),spec('worker','child','صاحب قایق',-5,-1,{portable:false}),
 spec('boat','boat','قایق اسباب‌بازی',-.7,.3),spec('hat','hat','کلاه دوچرخه‌سوار',.6,.8,{portable:false}),
 spec('receipt','receipt','رسید پاک‌رو',-4,3,{visible:false})],connections:[],
 setup(w){setupCommon(w);w.connect('supply','lamp');w.connect('supply','pump1');w.connect('supply','pump2');w.get('receipt').state.visible=false;},
 update(w,dt,ctx){
  const water=w.get('basin'),f=ctx.flags;
  if(w.get('supply').state.tripped){for(const id of ['pump1','pump2'])w.get(id).act('toggle',false);}
  const wrong=['1','2'].some(n=>powered(w,'pump'+n)&&w.get('hose'+n).state.to==='basin');
  w.get('hat').state.position.y=wrong?1.6+Math.sin((f.time=(f.time??0)+dt)*3)*.2:0;
  w.get('cyclist').state.expression=wrong?'surprised':water.state.level===0?'happy':'worried';
  if(wrong&&!f.fountain){f.fountain=true;ctx.say('شلنگ آب را برمی‌گرداند! کلاه دوچرخه‌سوار روی فواره گیر کرد.');}
  if(water.state.level===0&&!f.drained){f.drained=true;w.get('receipt').state.visible=true;ctx.say('میدان خشک شد! دوچرخه‌سوار رسید پاک‌رو را در سبدش پیدا کرد.');}
  if(f.drained){w.get('cyclist').state.position.x=Math.min(4,w.get('cyclist').state.position.x+dt);}
  if(!w.get('boat').state.holder&&!w.get('boat').state.collected)w.get('boat').state.position.y=water.state.level*.55;
 },
 actions(w,id,ctx){
  if(id.startsWith('hose')){const hose=w.get(id);return [
   action('intake','وصل مکش به آب',()=>{hose.state.from='basin';return 'مکش به حوضچه وصل شد؛ حالا مقصد خروجی را انتخاب کن.';}),
   action('drain','خروجی به تخلیهٔ میدان',()=>{if(hose.state.from!=='basin')return 'ابتدا مکش را به آب وصل کن.';hose.connect('basin','drain');return 'آب از میدان خارج خواهد شد.';}),
   action('return','خروجی به حوضچه',()=>{if(hose.state.from!=='basin')return 'مکش هنوز وصل نیست.';hose.connect('basin','basin');return 'آب به همان حوضچه برمی‌گردد.';}),
   action('detach','جدا کردن شلنگ',()=>{hose.disconnect();return 'هر دو سر شلنگ آزاد شد.';})];}
  if(id==='child')return [action('return-boat','پس دادن قایق',()=>{const boat=w.get('boat');if(boat.state.holder!=='ray')return 'قایق کنار لبهٔ آب است؛ آن را همراه بیاور.';boat.state.holder=null;boat.collect();ctx.flags.secret=true;return 'کودک برچسب قایق را به رِی داد!';})];
  if(id==='cyclist')return [action('talk','گفت‌وگو',()=>ctx.flags.drained?'رسید پاک‌رو را بردار؛ راه پناهگاه باز است.':'مسیرم اون‌ور آبه. با دوچرخه شنا بلد نیستم!')];
  if(id==='receipt')return w.get(id).state.visible?[action('collect-receipt','برداشتن رسید',()=>{w.get(id).collect();ctx.flags.receipt=true;return 'نشانی پناهگاه روی رسید ثبت شد.';})]:[];
  if(['basin','drain','hat'].includes(id))return [];
  return null;
 },ready:w=>w.get('basin').state.level===0,
 objective(w){return w.get('basin').state.level===0?'راه پناهگاه باز است؛ از میدان عبور کن.':`آب میدان را تخلیه کن · ${Math.ceil(w.get('basin').state.level*100)}٪ باقی مانده`;},
 hint(w){if(w.get('supply').state.tripped)return hint('overload','محافظ قطع شده','دو موتور برای شروع توان بیشتری می‌خواهند.','چراغ و پمپ دوم را خاموش کن؛ محافظ را برگردان.',['پمپ اول را روشن کن و یک ثانیه منتظر بمان.','چراغ را خاموش کن، پمپ دوم را روشن کن و بعد چراغ را برگردان.']);
  if(w.get('basin').state.level===0)return hint('exit','میدان خشک شد','مسیر عبور باز است.','به خروجی پناهگاه برو.',['رسید دوچرخه‌سوار را هم می‌توانی برداری.']);
  const correct=['1','2'].find(n=>{const h=w.get('hose'+n).state;return h.from==='basin'&&h.to==='drain';});
  if(!correct)return hint('hose','آب باید از میدان خارج شود','خروجی رو به حوضچه آب را دور می‌زند.','روی شلنگ: مکش به آب، خروجی به تخلیهٔ میدان.',['سپس پمپ همان شلنگ را روشن کن.','یک پمپ به‌تنهایی کافی است.']);
  return hint('pumping','توان شروع با توان کار فرق دارد','هر پمپ شروع ۱۸ وات و سپس ۶ وات می‌خواهد.','پمپ درست را از منبع ثابت روشن نگه دار.',['باتری ۱۲ واتی پمپ را راه نمی‌اندازد.','برای دو پمپ ابتدا اولی را راه بینداز؛ چراغ را هنگام شروع دومی قطع کن.']);
 },obstacles(w){return w.get('basin').state.level>0?[{x:2.7,z:0,w:5.2,d:4.8}]:[];}
 };
}
