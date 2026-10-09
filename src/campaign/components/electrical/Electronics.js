import {Entity} from '../core/Entity.js';
import {Device} from '../core/Device.js';
export class Resistor extends Entity {
  constructor(o = {}) {
    super(o, {ohms: o.ohms ?? 12});
    if (!(this.state.ohms > 0)) throw new RangeError('Resistance must be positive');
    this.rating = o.rating ?? 6;
  }
}
export function dividerOutput(input, top, bottom, load = null) {
  const parallel = values => 1 / values.reduce((sum,r) => sum + 1/r,0);
  if (!top.length || !bottom.length || [...top,...bottom,...(load===null?[]:[load])].some(r=>!Number.isFinite(r)||r<=0)) return {voltage:0,watts:0,topPower:[],bottomPower:[]};
  const upper=parallel(top), lower=parallel(load===null?bottom:[...bottom,load]);
  const current=input/(upper+lower), voltage=current*lower;
  return {voltage,watts:input*current,topPower:top.map(r=>(input-voltage)**2/r),bottomPower:bottom.map(r=>voltage**2/r)};
}
export class Divider extends Device {
  constructor(o = {}) { super(o, {output:0, safe:true, top:o.top??[], bottom:o.bottom??[]}); }
  install(slot,id,world){
    if(!['top','bottom'].includes(slot)||!(world.get(id) instanceof Resistor))return false;
    if(world.get(id).state.holder||this.state.top.includes(id)||this.state.bottom.includes(id)||this.state[slot].length>=(slot==='top'?2:1))return false;
    this.state[slot].push(id);world.get(id).state.holder=this.id;return true;
  }
  remove(id,world){
    for(const slot of ['top','bottom'])this.state[slot]=this.state[slot].filter(value=>value!==id);
    if(world.get(id)?.state.holder===this.id)world.get(id).state.holder=null;
  }
  solution(world) {
    const top=this.state.top.map(id=>world.get(id)),bottom=this.state.bottom.map(id=>world.get(id));
    if(new Set([...this.state.top,...this.state.bottom]).size!==top.length+bottom.length||[...top,...bottom].some(r=>!(r instanceof Resistor)))return {voltage:0,watts:0,safe:false};
    const receiver=world.get(this.config.receiver);
    const solved=dividerOutput(this.config.inputVoltage??12,top.map(r=>r.state.ohms),bottom.map(r=>r.state.ohms),receiver?.state.connected?receiver.resistance:null);
    return {...solved,safe:solved.topPower.every((w,i)=>w<=top[i].rating+1e-8)&&solved.bottomPower.every((w,i)=>w<=bottom[i].rating+1e-8)};
  }
  demand(world) { return this.state.enabled ? this.solution(world).watts : 0; }
  update(dt,world) { const r=this.solution(world);this.state.output=this.state.powered&&r.safe?r.voltage:0;this.state.safe=r.safe; }
}
export class Antenna extends Entity {
  constructor(o = {}) { super(o, {direction:0,locked:false}); }
  act(action,value) {
    if(action==='lock'){this.state.locked=!this.state.locked;return true;}
    if(action==='direction'&&!this.state.locked&&Number.isInteger(value)&&value>=0&&value<(this.config.stops??2)){this.state.direction=value;return true;}
    return false;
  }
}
export class Receiver extends Entity {
  constructor(o = {}) { super(o, {connected:o.connected??true,quality:'off',received:false});this.resistance=o.resistance??12; }
  update(dt,world) {
    const divider=world.get(this.config.divider),antenna=world.get(this.config.antenna);
    const volts=divider?.state.output??0;
    const ready=this.state.connected&&Math.abs(volts-(this.config.targetVoltage??4))<=(this.config.tolerance??.08)&&antenna?.state.locked;
    this.state.quality=!this.state.connected||!volts?'off':!ready?'noise':antenna.state.direction===(this.config.direction??0)?'clear':'alternate';
    if(this.state.quality==='clear')this.state.received=true;
  }
}
