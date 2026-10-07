import {measureCircuit} from './CircuitMeter.js?v=shop1';
import {replacements} from './adventureData.js';

export class ShopRepair {
  constructor(session){this.session=session;this.probes={red:null,black:null};this.selectedProbe='red';this.selectedSpare=null;this.preview=false;}
  get resistor(){return this.session.board.parts.find(p=>p.type==='resistor');}
  get switch(){return this.session.board.parts.find(p=>p.type==='switch');}
  get empty(){return !!this.resistor.disconnected;}
  placeProbe(color,terminal){
    if(!['red','black'].includes(color)||!this.session.board.parts.some(p=>terminal===p.id+':0'||terminal===p.id+':1'))return;
    this.probes[color]=terminal;this.selectedProbe=color==='red'?'black':'red';
    if(this.voltage!==null)this.session.note(`اندازه‌گیری دو پراب: ${this.voltage.toFixed(2)} V (قرمز منهای مشکی).`);
  }
  get voltage(){
    const {red,black}=this.probes;if(!red||!black)return null;
    const s=this.session,board={parts:s.board.parts.map(p=>p.type==='switch'&&s.tripped?{...p,closed:false}:p),wires:s.board.wires};
    const reading=measureCircuit(board).terminals;
    if(!reading||reading[red]===null||reading[black]===null)return null;
    return reading[red]-reading[black];
  }
  remove(){
    const s=this.session;if(s.won||this.empty)return;
    if(this.switch.closed&&!s.tripped){s.message='اول کلید اصلی را باز کن؛ بعد قطعه را از سوکت بیرون بیاور.';return;}
    this.resistor.disconnected=true;this.preview=false;s.message='قطعه بیرون آمد. مقاومت تازه را از کیف روی سوکت خالی بگذار.';
  }
  install(value){
    const s=this.session,item=replacements.find(p=>p.value===value);if(s.won||!item)return;
    if(!this.empty){s.message='سوکت هنوز پر است؛ ابتدا قطعهٔ قبلی را بیرون بیاور.';return;}
    if(this.switch.closed&&!s.tripped){s.message='برای نصب قطعه، کلید اصلی را باز کن.';return;}
    if(!s.spend(item.cost))return;
    this.resistor.value=value;this.resistor.disconnected=false;this.selectedSpare=null;this.preview=false;
    s.message=`مقاومت ${value} اهم جا افتاد. کلید را ببند و برق تابلو را آزمایش کن.`;
  }
  get brightness(){
    const s=this.session;if(!this.preview||s.tripped||this.empty||!this.switch.closed)return 0;
    return Math.min(1,(s.current/(1/3))**2);
  }
}
