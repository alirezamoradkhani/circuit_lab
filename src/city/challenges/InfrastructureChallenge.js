import {fail,finish} from './common.js';
import {measureCircuit} from '../CircuitMeter.js';
export class InfrastructureChallenge {
 constructor(s){this.s=s;this.modern=true;this.phase=0;const b=s.board;b.parts=[];b.wires=[];b.serial=0;this.source=b.add('battery');this.main=b.add('switch');this.main.closed=true;b.connect(this.source.id+':0',this.main.id+':0');this.parts=[];}
 add(label,value){const p=this.s.board.add('resistor');p.label=label;p.value=value;this.parts.push(p);return p;}
 wire(a,b){this.s.board.connect(a,b);}
 parallel(p,start=this.main.id+':1'){this.wire(start,p.id+':0');this.wire(p.id+':1',this.source.id+':1');}
 get measured(){return measureCircuit(this.s.board);}
 get power(){return this.measured.current*this.source.value;}
 get status(){return this.s.tripped?'محافظ قطع است':`مصرف ${this.power.toFixed(1)} وات · ${this.main.closed?'مدار وصل':'کلید اصلی باز'}`;}
 get step(){return this.s.mission.objective;}
 get testLabel(){return 'آزمون تحویل';}
 edit(){if(this.s.won)return false;return true;}
 toggleMain(){this.main.closed=!this.main.closed;}
 accepted(){return finish(this.s);}
 reject(message){return fail(this.s,message);}
}
