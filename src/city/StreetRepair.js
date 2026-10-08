import {measureCircuit} from './CircuitMeter.js';
import {evaluate} from '../builder/Board.js';
import {cityMissions} from './missions.js';

// The damaged cable is a real series resistance, not a scripted dimming effect.
export class StreetRepair {
  constructor(session){
    this.session=session;this.failed=new Set(['p4']);this.isolated=new Set();
    this.ready=false;this.verified=false;
    const b=session.board;
    this.cable=b.add('resistor',0,0);this.cable.value=12;
    b.wires=[];
    for(const [a,z] of [['p1:0','p2:0'],['p2:1','p3:0'],['p3:1','p1:1'],['p2:1','p4:0'],['p4:1','p1:1'],['p2:1',this.cable.id+':0'],[this.cable.id+':1','p5:0'],['p5:1','p1:1']])b.connect(a,z);
    this.sync();
  }
  get lamps(){return this.session.board.parts.filter(p=>p.type==='lamp');}
  sync(){for(const p of this.lamps)p.disconnected=this.failed.has(p.id)||this.isolated.has(p.id);}
  invalidate(){this.ready=false;this.verified=false;}
  topology(){
    const s=this.session,b=s.board;
    if(!this.cable)return evaluate(b,cityMissions[s.index]);
    // An unused old connection must not force a particular repair sequence.
    const terminals=[this.cable.id+':0',this.cable.id+':1'];
    const aliases=new Map(terminals.map(t=>[t,b.wires.flatMap(w=>w.includes(t)?w.filter(x=>!terminals.includes(x)):[])[0]]));
    const wires=b.wires.map(w=>w.map(t=>aliases.has(t)?aliases.get(t):t)).filter(w=>w.every(Boolean)&&w[0]!==w[1]);
    return evaluate({parts:b.parts.filter(p=>p!==this.cable),wires},cityMissions[s.index]);
  }
  readings(){
    const s=this.session,m=measureCircuit(s.board);
    return this.lamps.map(p=>{
      const a=m.terminals?.[p.id+':0'],b=m.terminals?.[p.id+':1'];
      const voltage=s.tripped||m.short?0:a==null||b==null?null:Math.abs(a-b);
      const current=p.disconnected?0:(voltage??0)/p.value;
      return {id:p.id,voltage,current,brightness:Math.min(1,(current*p.value/12)**2)};
    });
  }
  inspect(id){
    const s=this.session,r=this.readings().find(p=>p.id===id);if(!r)return;
    this.selected=id;
    const n=this.lamps.findIndex(p=>p.id===id)+1;
    s.note(s.tool==='meter'?`چراغ ${n}: ولتاژ دو سر سوکت ${r.voltage===null?'نامشخص':r.voltage.toFixed(2)+' V'}؛ جریان لامپ ${r.current.toFixed(2)} A.`:`چراغ ${n}: ۱۲ ولت، ۱۲ اهم؛ جریان نامی ۱ آمپر. برای تشخیص خرابی، ولتاژ سوکت و جریان را مقایسه کن.`);
  }
  replace(id){
    const s=this.session;if(s.won||!this.lamps.some(p=>p.id===id)||!s.spend(5))return;
    this.failed.delete(id);this.sync();this.invalidate();s.message='لامپ نو نصب شد (۵ اعتبار). نتیجه را اندازه بگیر؛ تعویض لامپ، سیم معیوب را تعمیر نمی‌کند.';
  }
  removeCable(){
    const s=this.session;if(s.won||!this.cable||!s.spend(3))return;
    s.board.remove(this.cable.id);this.cable=null;s.pending=null;this.invalidate();
    s.message=this.readings().every(r=>Math.abs(r.current-1)<.01)?'اتصال فرسوده برداشته شد؛ مسیر جدید هر سه چراغ برقرار است. حالا آزمایش روشنایی را بزن.':'اتصال فرسوده برداشته شد. اگر چراغ ۳ خاموش است، از خروجی مثبت کلید به پایانهٔ + چراغ سیم بکش.';
  }
  isolate(id){
    const s=this.session;if(s.won||!this.lamps.some(p=>p.id===id))return;
    this.isolated.has(id)?this.isolated.delete(id):this.isolated.add(id);this.sync();
    s.message='کلید شاخه تغییر کرد؛ با «آزمایش برق» اثر آن را بررسی کن.';
  }
  test(){
    const s=this.session,m=measureCircuit(s.board);
    const fail=text=>{s.mistakes++;s.message=text;return false;};
    if(m.short){s.tripped=true;this.invalidate();return fail('اتصال کوتاه! محافظ قطع شد؛ اتصال مستقیم دو ریل را بردار.');}
    if(this.failed.size)return fail('لامپ چراغ ۲ هنوز خراب است؛ ولتاژ سوکت و جریان آن را بررسی کن و لامپ را تعویض کن.');
    if(this.cable&&Math.abs(m.volts[this.cable.id]??0)>.01)return fail('اتصال قدیمی هنوز جریان می‌کشد. مسیر چراغ ۳ را اصلاح کن؛ می‌توانی اتصال قدیمی را برداری یا یک مسیر مستقیم جایگزین بسازی.');
    const topology=this.topology();
    if(!topology.ok){this.invalidate();return fail(topology.message);}
    const readings=this.readings(),full=r=>Math.abs((r.voltage??0)-12)<.01&&Math.abs(r.current-1)<.01;
    if(this.isolated.size){
      if(!this.ready)return fail('ابتدا هر سه شاخه را وصل کن و روشنایی کامل را آزمایش کن.');
      if(this.isolated.size!==1||!readings.every(r=>this.isolated.has(r.id)?r.current===0:full(r)))return fail('فقط یک شاخه را قطع کن؛ دو چراغ دیگر باید با جریان کامل روشن بمانند.');
      this.verified=true;s.message='استقلال شاخه‌ها تأیید شد! شاخهٔ قطع‌شده را وصل کن و آزمایش نهایی را بزن.';return false;
    }
    if(!readings.every(full))return fail('هر سه چراغ باید ۱۲ ولت و جریان ۱ آمپر داشته باشند.');
    this.ready=true;
    if(!this.verified){s.message='✓ تعمیر انجام شد؛ هر سه چراغ درست روشن‌اند. فقط آزمایش پایانی مانده: «قطع شاخه» یکی از چراغ‌ها را بزن، سپس «آزمایش استقلال شاخه‌ها» را بزن. دو چراغ دیگر باید روشن بمانند.';return false;}
    s.won=true;s.message=s.mission.success;return true;
  }
}
