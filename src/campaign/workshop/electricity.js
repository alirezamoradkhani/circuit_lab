import {LOADS} from './layout.js';
export function powered(s,id){return s.connections[id]==='mains'||(s.connections[id]==='battery'&&s.energy>1e-8);}
export function totalBatteryLoad(s){return Object.keys(LOADS).reduce((sum,id)=>sum+(s.connections[id]==='battery'&&!(id==='latch'&&s.door)?LOADS[id]:0),0);}
export function advanceElectricity(s,dt,events){
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
      s.energy=Math.max(0,s.energy-load*slice);
      if(s.energy<1e-8){s.energy=0;events.push('empty');}
    }
    if(latchActive){
      s.latchTime+=slice;
      if(s.latchTime>=1-1e-8){s.latchTime=1;s.door=true;s.route=s.connections.latch;events.push('door');}
    }else if(!s.door)s.latchTime=0;
    s.musicTime=music?s.musicTime+slice:0;
    if(!s.secret&&s.musicTime>=2){s.secret=true;events.push('secret');}
    remaining-=slice;
  }
  if(s.charging)s.energy=Math.min(72,s.energy+24*dt);
}
