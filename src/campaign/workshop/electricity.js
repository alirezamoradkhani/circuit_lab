import {Battery} from '../components/electrical/Source.js';
import {PulseLatch} from '../components/electrical/Loads.js';
const models=new WeakMap();
function components(s){
 if(!models.has(s))models.set(s,{battery:new Battery({id:'battery'}),latch:new PulseLatch({id:'latch'})});
 const m=models.get(s);m.battery.state.energy=s.energy;m.latch.state.elapsed=s.latchTime;m.latch.state.complete=s.door;return m;
}
import {LOADS} from './layout.js';
import {repairReady,tickRepair,circuitReading} from './RepairCircuit.js';
export function powered(s,id){if(id==='latch'&&s.repair&&!repairReady(s))return false;return s.connections[id]==='mains'||(s.connections[id]==='battery'&&s.energy>1e-8);}
export function totalBatteryLoad(s){return Object.keys(LOADS).reduce((sum,id)=>sum+(s.connections[id]==='battery'&&!(id==='latch'&&s.door&&!s.repair)?(id==='latch'&&s.repair?Math.max(0,circuitReading(s).current??0)*12:LOADS[id]):0),0);}
export function advanceElectricity(s,dt,events){
  if(s.repair)tickRepair(s,events);
  const {battery,latch}=components(s);
  let remaining=dt;
  while(remaining>1e-8){
    const load=totalBatteryLoad(s);
    const latchActive=!s.door&&powered(s,'latch');
    const hasEnergy=s.energy>1e-8;
    let slice=remaining;
    if(latchActive)slice=Math.min(slice,1-s.latchTime);
    if(load&&hasEnergy)slice=Math.min(slice,s.energy/load);
    const music=powered(s,'lamp')&&powered(s,'radio');
    if(load&&hasEnergy){
      battery.consume(load*slice);s.energy=battery.state.energy;
      if(s.energy<1e-8){s.energy=0;events.push('empty');}
    }
    if(latchActive){
      latch.setPower(true,12);latch.update(slice);s.latchTime=latch.state.elapsed;
      if(s.latchTime>=1-1e-8){s.latchTime=1;s.door=true;s.route=s.connections.latch;events.push('door');}
    }else if(!s.door){s.latchTime=0;latch.state.elapsed=0;}
    s.musicTime=music?s.musicTime+slice:0;
    if(!s.secret&&s.musicTime>=2){s.secret=true;events.push('secret');}
    remaining-=slice;
  }
  if(s.charging){battery.charge(24*dt);s.energy=battery.state.energy;}
}
