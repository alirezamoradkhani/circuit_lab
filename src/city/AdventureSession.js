import {Board,evaluate} from '../builder/Board.js';
import {cityMissions,seedMission} from './missions.js';
import {adventures,appliances,replacements} from './adventureData.js';
import {measureCircuit} from './CircuitMeter.js?v=shop1';
import {StreetRepair} from './StreetRepair.js?v=street4';
import {ShopRepair} from './ShopRepair.js';

// Game state and electrical rules live outside the DOM so repairs can be tested.
export class AdventureSession {
  constructor(index){
    this.index=index;this.mission=adventures[index];this.board=new Board();
    seedMission(this.board,cityMissions[index]);
    this.tool='inspect';this.focus='person';this.panel=false;this.pending=null;
    this.credits=this.mission.budget;this.spent=0;this.mistakes=0;this.hints=0;
    this.tripped=false;this.won=false;this.notes=[];this.loads=[true,false,false,true];
    this.message=this.mission.request;
    if(this.mission.id==='shop')this.shop=new ShopRepair(this);
    if(this.mission.id==='street')this.street=new StreetRepair(this);
  }
  get power(){return appliances.reduce((sum,p,i)=>sum+(this.loads[i]?p.power:0),0);}
  get current(){
    if(this.tripped)return 0;
    if(this.mission.id==='clinic')return this.power/12;
    return measureCircuit(this.board).current;
  }
  note(text){if(!this.notes.includes(text))this.notes.push(text);this.message=text;}
  inspect(target){
    this.focus=target;this.pending=null;
    if(target==='cabinet'){this.panel=!this.won;this.message=this.won?'این تعمیر تمام شده است؛ برای امتحان یک راه دیگر، مأموریت را از نو شروع کن.':'جعبه‌برق باز است. قطعه یا مسیر سیم را بررسی و تعمیر کن.';return;}
    if(target==='person'){this.message=this.won?this.mission.success:this.shop?.brightness?'نور تابلو برگشته، اما هنوز کم‌نور است. مقدار قطعه را دوباره بررسی کن.':this.mission.request;return;}
    if(this.tool==='meter'){
      if(this.shop){this.panel=true;this.message='پراب قرمز و مشکی را روی دو نقطهٔ جعبه‌برق قرار بده؛ نمایشگر اختلاف ولتاژ آن‌ها را نشان می‌دهد.';return;}
      const text=this.reading(target);this.note(text);return;
    }
    this.note(target==='source'?this.mission.source:this.mission.plate);
  }
  reading(target){
    if(target==='source')return 'اندازه‌گیری منبع: ۱۲٫۰۰ V؛ منبع سالم است.';
    if(this.mission.id==='clinic')return `بارهای انتخاب‌شده: ${this.power} W؛ جریان ${this.tripped?'۰ (محافظ قطع است)':(this.power/12).toFixed(2)} A؛ ظرفیت ۱۸ W.`;
    if(this.tripped)return 'محافظ قطع است؛ ابتدا آن را بازنشانی کن.';
    const measured=measureCircuit(this.board);if(measured.short)return 'اتصال کوتاه در منبع؛ مسیر سیم‌ها را اصلاح کن.';
    if(this.street)return this.street.readings().map((r,i)=>`چراغ ${i+1}: ${r.voltage===null?'نامشخص':r.voltage.toFixed(2)+' V'} / ${r.current.toFixed(2)} A`).join('؛ ');
    const lamps=this.board.parts.filter(p=>p.type==='lamp').map(p=>measured.volts[p.id]===null?'شناور':measured.volts[p.id].toFixed(2)+' V');
    return `جریان منبع: ${measured.current.toFixed(2)} A؛ ولتاژ چراغ‌ها: ${lamps.join(' / ')}.`;
  }
  spend(amount){if(this.credits<amount){this.message='اعتبار قطعات کافی نیست. می‌توانی مأموریت را از نو شروع کنی.';return false;}this.credits-=amount;this.spent+=amount;return true;}
  install(value){
    if(this.shop){this.shop.install(value);return;}
    if(this.won)return;
    const item=replacements.find(p=>p.value===value),part=this.board.parts.find(p=>p.type==='resistor');
    if(!item||!part||!['shop','station'].includes(this.mission.id))return;
    if(part.value===value){this.message='همین قطعه نصب است.';return;}
    if(!this.spend(item.cost))return;
    part.value=value;this.message=`مقاومت ${value} اهم نصب شد. حالا نتیجه را آزمایش کن.`;
  }
  pin(id){
    if(this.won||!['gate','street','station'].includes(this.mission.id))return;
    if(!this.board.parts.some(p=>id===p.id+':0'||id===p.id+':1'))return;
    if(!this.pending){this.pending=id;this.message='سر دیگر سیم را انتخاب کن.';return;}
    const start=this.pending;this.pending=null;
    if(start===id)return;
    if(this.board.wires.some(w=>w.includes(start)&&w.includes(id))){this.message='این اتصال از قبل وجود دارد.';return;}
    if(start.split(':')[0]===id.split(':')[0]){this.message='دو سر یک قطعه را با سیم دور نزن؛ پایانهٔ قطعهٔ دیگر را انتخاب کن.';return;}
    if(this.credits<2){this.message='برای یک سیم به ۲ اعتبار نیاز داری؛ مأموریت را از نو شروع کن.';return;}
    const before=this.board.wires.length;this.board.connect(start,id);
    if(this.board.wires.length>before){this.street?.invalidate();this.spend(2);this.message='سیم نصب شد. برای برداشتن سیم روی خط آن بزن.';}
  }
  removeWire(index){if(this.won)return;if(this.board.wires[index]){this.board.wires.splice(index,1);this.street?.invalidate();this.pending=null;this.message='سیم برداشته شد؛ حالا می‌توانی مسیر درست را بسازی.';}}
  toggleLoad(index){if(this.won||!appliances[index])return;this.loads[index]=!this.loads[index];this.message=`توان انتخاب‌شده: ${this.power} از ۱۸ وات.`;}
  toggleSwitch(){if(this.won)return;const p=this.board.parts.find(p=>p.type==='switch');p.closed=!p.closed;this.street?.invalidate();this.message=p.closed?'کلید بسته شد.':'کلید باز شد؛ می‌توانی اثر آن را با مولتی‌متر بررسی کنی.';}
  hint(){if(this.won)return;this.message=this.mission.hints[Math.min(this.hints,2)];this.hints=Math.min(this.hints+1,3);}
  resetFuse(){this.tripped=false;this.message='محافظ بازنشانی شد. پیش از آزمایش دوباره، علت قطع‌شدن را رفع کن.';}
  test(){
    if(this.won)return true;
    if(this.tripped){this.message='محافظ قطع است؛ ابتدا بازنشانی کن.';return false;}
    if(this.street)return this.street.test();
    let ok=false,reason='';
    if(this.mission.id==='clinic'){
      this.tripped=this.power>18;ok=!this.tripped&&this.loads.slice(0,3).every(Boolean);
      reason=this.tripped?'اضافه‌بار! محافظ مولد قطع شد. توان وسایل فعال از ۱۸ وات بیشتر است.':'هنوز همهٔ مصرف‌کننده‌های ضروری فعال نیستند.';
    }else{
      if(this.shop?.empty){this.mistakes++;this.message='سوکت خالی است؛ مسیر مدار هنوز قطع است.';return false;}
      if(this.shop)this.shop.preview=true;
      const result=evaluate(this.board,cityMissions[this.index]);ok=result.ok;reason=result.message;
      if(measureCircuit(this.board).short){this.tripped=true;reason='اتصال کوتاه! محافظ قطع شد؛ سیم اتصال مستقیم دو قطب را بردار.';}
      if(this.mission.id==='shop'&&this.current>.4){this.tripped=true;reason='جریان بیش از ۰٫۴ آمپر شد و محافظ تابلو قطع کرد؛ مقاومت مناسب‌تری نصب کن.';}
    }
    if(ok){this.won=true;this.message=this.mission.success;}else{this.mistakes++;this.message=reason;}
    return ok;
  }
  get stars(){return Math.max(1,3-Math.min(2,this.hints+this.mistakes));}
}
