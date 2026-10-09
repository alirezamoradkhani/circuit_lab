import {point,spec,action,hint,common,bounds,setupCommon,powered,toggleAction,disconnectAction} from './chapter2/common.js';
export default function createDefinition(){
 const exit=point(5,2.7),home=point(0,-.7),park=point(2,-.7);
 return {id:'07-magnetic-depot',number:7,title:'انبار وارونه',theme:'depot',start:point(-5,2.7),exit,bounds,
 intro:'فرستنده زیر جعبهٔ فلزی گیر کرده. بار را با جرثقیل یا سینی نوار کنار ببر؛ جعبهٔ چوبی باید راه خروج را بسازد.',
 components:[...common(exit),
 spec('craneRail','rail','ریل جرثقیل · شروع ۱۲، حرکت ۶ وات',0,-.7,{from:point(0,-.7,2.4),to:point(2,-.7,2.4),riders:['magnet'],portable:false}),
 spec('magnet','magnet','آهن‌ربا · ۱۲ وات',0,-.7,{position:point(0,-.7,2.4),enabled:false,target:'metal',reach:.8,safeDrops:[home,park]}),
 spec('metalCrate','metal','جعبهٔ فلزی · قابل جذب',0,-.7,{portable:false,lockAtEnd:false}),
 spec('woodCrate','wood','جعبهٔ چوبی · غیرمغناطیسی',1,1.7,{from:point(1,1.7),to:point(4.3,1.7),portable:false}),
 spec('conveyor','conveyor','نوار نقاله · ۶ وات',1,.1,{enabled:true,cargo:['tray'],speed:1,axis:'x',min:-2,max:2}),
 spec('landing','tray','سینی دریافت بار',-2,-.7,{portable:false}),spec('bumper','bumper','ضربه‌گیر ایمن',2,-.7,{portable:false}),
 spec('transmitter','transmitter','فرستندهٔ پاک‌رو',0,-1.5,{portable:true}),
 spec('spoon','spoon','قاشق رِی',-.5,-.7,{portable:false}),
 spec('spoon','scrap1','قطعهٔ آدمک · سر',-3,1,{portable:true}),spec('spoon','scrap2','قطعهٔ آدمک · دست',-3,.4,{portable:true}),spec('spoon','scrap3','قطعهٔ آدمک · پا',-3,-.2,{portable:true}),
 spec('table','art','پایهٔ آدمک یادگاری',-4,1.4,{portable:false})],connections:[],
 setup(w){setupCommon(w);for(const id of ['rail','magnet','conveyor'])w.connect('supply',id);w.get('transmitter').state.locked=true;},
 update(w,dt,ctx){const f=ctx.flags,metal=w.get('metal'),tray=w.get('tray'),magnet=w.get('magnet');
  if(magnet.state.cargo){f.lifted=true;w.get('spoon').state.position=point(magnet.state.position.x-.4,-.7,1.4);w.get('ray').state.expression='surprised';}
  else w.get('spoon').state.position.y=0;
  // A released load lands on an actual tray only while the tray is physically beneath it.
  if(f.lifted&&!f.metalClear&&!metal.state.holder&&Math.abs(metal.state.position.x)<.15&&Math.abs(tray.state.position.x)<.55){metal.state.holder='tray';f.trayLoaded=true;}
  if(!f.metalClear&&((metal.state.holder==='tray'&&tray.state.position.x>=1.95)||(!metal.state.holder&&metal.state.position.x>=1.95))){
   f.metalClear=true;f.route=metal.state.holder==='tray'?'conveyor':'crane';metal.state.holder=null;metal.state.position={...park};metal.state.locked=true;w.get('transmitter').state.locked=false;ctx.say('بار روی ضربه‌گیر نشست. برچسب فرستنده با رسید پاک‌رو یکی است!');
  }
  if(f.woodLoaded&&f.metalClear&&powered(w,'conveyor')&&w.get('conveyor').state.direction===-1)w.get('wood').advance(dt/3);
  if(w.get('wood').state.locked&&!f.platform){f.platform=true;ctx.say('جعبهٔ چوبی سکوی خروج شد؛ فرستنده را همراه ببر.');}
  if(f.metalClear&&w.get('transmitter').state.holder==='ray')f.transmitterTaken=true;
 },
 actions(w,id,ctx){const f=ctx.flags;
  if(id==='rail')return [action('move-out','حرکت به ایستگاه کناری',()=>{w.get('rail').act('move',1);return 'ریل فرمان حرکت گرفت؛ هنگام شروع، نوار نباید روی همان منبع روشن باشد.';}),action('move-home','بازگشت جرثقیل',()=>{w.get('rail').act('move',0);return 'جرثقیل به ایستگاه اول برمی‌گردد.';}),disconnectAction(w,id)];
  if(id==='magnet')return [toggleAction(w,id),action('try-wood','آزمودن جنس چوب',()=>{w.get('ray').state.expression='confused';return 'چوب جذب نمی‌شود! این جعبه را باید با نوار جابه‌جا کرد.';}),disconnectAction(w,id)];
  if(id==='conveyor')return [toggleAction(w,id),action('reverse','برعکس کردن جهت نوار',()=>{w.get(id).act('reverse');return w.get(id).state.direction===-1?'نوار در جهت سکوی خروج حرکت می‌کند.':'نوار در جهت سینی دریافت حرکت می‌کند.';}),disconnectAction(w,id)];
  if(id==='wood')return [action('load-wood','هل دادن روی نوار برگشت',()=>{if(!f.metalClear)return 'ابتدا جعبهٔ فلزی را از مسیر بردار.';f.woodLoaded=true;return 'جعبه روی مسیر برگشت قرار گرفت؛ جهت نوار را عوض کن.';})];
  if(id==='transmitter')return [action('take-transmitter','برداشتن فرستنده',()=>{if(!f.metalClear)return 'جعبهٔ فلزی هنوز راه سینی را بسته است.';return ctx.take(id)?'فرستنده همراه رِی است؛ از سکوی چوبی به خروج برو.':'ابتدا وسیلهٔ همراه یا باتری را کنار بگذار.';}),action('put-transmitter','گذاشتن ایمن روی سینی',()=>{if(w.get(id).state.holder!=='ray')return 'فرستنده همراه رِی نیست.';ctx.place(id,point(0,-1.5));return 'فرستنده روی سینی محفوظ است.';})];
  if(id==='art')return [action('assemble','اضافه کردن قطعهٔ آدمک',()=>{const piece=['scrap1','scrap2','scrap3'].map(x=>w.get(x)).find(e=>e.state.holder==='ray');if(!piece)return 'یکی از سه قطعهٔ فلزی کنار پایه را بیاور.';ctx.place(piece.id,point(-4,1.4,.5+(f.scraps??0)*.3));piece.state.locked=true;f.scraps=(f.scraps??0)+1;if(f.scraps===3){f.secret=true;return 'آدمک کامل شد؛ جرثقیل تعظیم می‌کند. عکس یادگاری ثبت شد!';}return 'یک قطعه روی آدمک قرار گرفت.';})];
  if(['metal','tray','bumper','spoon'].includes(id))return [];
  return null;
 },ready:(w,ctx)=>!!ctx.flags.metalClear&&w.get('wood').state.locked&&w.get('transmitter').state.holder==='ray',
 objective(w,ctx){return !ctx.flags.metalClear?'جعبهٔ فلزی را از روی فرستنده کنار ببر.':!w.get('wood').state.locked?'جعبهٔ چوبی را با نوار برگشت به سکوی خروج برسان.':'فرستنده را همراه ببر و از خروجی بالا برو.';},
 hint(w,ctx){if(w.get('supply').state.tripped)return hint('overload','شروع ریل اضافه‌بار ایجاد کرد','آهن‌ربا ۱۲ + شروع ریل ۱۲ + نوار ۶ = ۳۰ وات.','نوار را خاموش کن و محافظ را برگردان.',['مجموع آهن‌ربا و شروع ریل دقیقاً ۲۴ وات است.','اگر بار افتاد، روی ضربه‌گیر امن مانده است.']);
  if(!ctx.flags.metalClear)return hint('metal','فرستنده زیر فلز است','آهن‌ربا فلز را می‌گیرد؛ چوب را نه.','نوار را متوقف و آهن‌ربا را روشن کن.',['راه جرثقیل: با نوار خاموش، ریل را به کنار ببر و آهن‌ربا را خاموش کن.','راه سینی: ریل را ثابت نگه دار؛ نوار را دو ثانیه حرکت بده تا سینی زیر بار برسد. بار را رها کن، سپس دو ثانیهٔ دیگر نوار را حرکت بده.']);
  if(!w.get('wood').state.locked)return hint('wood','سکوی خروج هنوز آماده نیست','جعبهٔ چوبی به آهن‌ربا واکنش ندارد.','جعبه را روی نوار برگشت هل بده.',['جهت نوار را برعکس کن و آن را روشن نگه دار.','جعبه در انتهای مسیر قفل می‌شود.']);
  return hint('carry','فرستنده باید همراهت باشد','باز شدن راه به‌تنهایی کافی نیست.','باتری را کنار بگذار و فرستنده را بردار.',['از سکوی چوبی به خروجی برو.']);
 },obstacles(w){return w.get('magnet').state.cargo?[{x:w.get('metal').state.position.x,z:-.7,w:1.1,d:1.1}]:[];}
 };
}
