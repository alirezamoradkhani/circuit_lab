import {measureCircuit} from '../CircuitMeter.js';
import {fail,finish,deviceLabels} from './common.js';
export class RadioChallenge {
  constructor(s){
    this.s=s;this.phase=0;const b=s.board;b.parts=[];b.wires=[];b.serial=0;
    const source=b.add('battery'),sw=b.add('switch');sw.closed=true;
    this.top=b.add('resistor');this.bottom=b.add('resistor');this.receiver=b.add('resistor');this.receiver.disconnected=true;[this.top,this.bottom,this.receiver].forEach((p,i)=>p.label=deviceLabels.radio[i]);
    for(const [a,z] of [[source.id+':0',sw.id+':0'],[sw.id+':1',this.top.id+':0'],[this.top.id+':1',this.bottom.id+':0'],[this.bottom.id+':1',source.id+':1'],[this.top.id+':1',this.receiver.id+':0'],[this.receiver.id+':1',source.id+':1']])b.connect(a,z);
  }
  get voltage(){return measureCircuit(this.s.board).volts[this.bottom.id]??0;}
  get status(){return this.phase?'گیرنده وصل است · هدف ۴ V':'آزمایش بی‌بار · هدف ۴ V';}
  get step(){return this.phase?'گیرندهٔ ۱۲ اهمی وصل شد؛ تقسیم ولتاژ را زیر بار دوباره تنظیم کن.':'با دو مقاومت، خروجی بی‌بار ۴ ولت بساز و آزمایش کن.';}
  act(key,value){
    if(this.s.won)return;const p=key==='top'?this.top:key==='bottom'?this.bottom:null,v=Number(value);
    if(!p||![6,12,24,36,48].includes(v)||p.value===v||!this.s.spend(2))return;
    p.value=v;this.s.message='مقاومت عوض شد؛ با ولت‌متر روی خروجی مدار بزن و سپس آزمایش کن.';
  }
  test(){
    if(Math.abs(this.voltage-4)>.08)return fail(this.s,'ولتاژ خروجی باید ۴ ولت باشد (تلرانس ۰٫۰۸ ولت). بار گیرنده را در محاسبهٔ مقاومت معادل حساب کن.');
    if(!this.phase){this.phase=1;this.receiver.disconnected=false;this.s.message='تنظیم بی‌بار درست بود. گیرندهٔ ۱۲ اهمی وصل شد و ولتاژ افت کرد؛ این بار خروجی را در حضور بار به ۴ ولت برسان.';return false;}
    return finish(this.s);
  }
}
