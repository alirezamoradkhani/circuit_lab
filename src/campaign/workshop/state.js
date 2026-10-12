import {START,LOADS,PORTS,distance,portPosition} from './layout.js';
import {walkable} from '../engine/navigation.js';
import {advanceElectricity} from './electricity.js';
export {powered,totalBatteryLoad} from './electricity.js';
export const SAVE_KEY='circuit-lab.story.workshop.v1';
export function freshState(){
  return {version:1,started:false,player:{...START},energy:72,cart:0,pushing:false,
    reel:false,receipt:false,door:false,latchTime:0,connections:{lamp:null,radio:null,latch:null},
    charging:false,completed:false,secret:false,musicTime:0,route:null};
}
export function restoreState(value){
  const s=freshState();
  if(!value||value.version!==1)return s;
  for(const key of ['started','reel','receipt','door','secret'])s[key]=value[key]===true;
  const finite=(n,fallback)=>typeof n==='number'&&Number.isFinite(n)?n:fallback;
  s.energy=Math.max(0,Math.min(72,finite(value.energy,72)));
  s.cart=Math.max(0,Math.min(1,finite(value.cart,0)));
  s.pushing=s.cart>0&&s.cart<1;
  if(s.cart<0.95)s.reel=false;
  const p={x:finite(value.player?.x,START.x),z:finite(value.player?.z,START.z)};
  if(walkable(p,s))s.player=p;
  if(value.repair)s.repair=value.repair;
  let mainsUsed=false;
  for(const id of Object.keys(LOADS)){
    const source=value.connections?.[id];
    if(source==='battery'&&distance(s.player,portPosition(id,s))<=2.65)s.connections[id]=source;
    if(source==='mains'&&s.reel&&!mainsUsed){s.connections[id]=source;mainsUsed=true;}
  }
  s.charging=value.charging===true&&s.cart>0.95&&distance(s.player,PORTS.mains)<=2.65
    &&!Object.values(s.connections).includes('battery');
  s.route=['battery','mains'].includes(value.route)?value.route:null;
  s.completed=value.completed===true&&s.door&&s.receipt&&s.player.z<-4.05
    &&Math.abs(s.player.x-2.35)<1&&!Object.values(s.connections).includes('battery')&&!s.charging;
  if(s.door)s.latchTime=1;
  return s;
}
export function tick(s,dt){
  if(!s.started||s.completed)return [];
  const events=[];
  if(s.pushing){
    s.cart=Math.min(1,s.cart+dt/1.8);
    s.player={x:-1,z:0.55+2.7*s.cart};
    if(s.cart===1){s.pushing=false;events.push('cart');}
  }
  advanceElectricity(s,dt,events);
  if(s.door&&s.receipt&&s.player.z<-4.05&&Math.abs(s.player.x-2.35)<1
    &&!Object.values(s.connections).includes('battery')&&!s.charging){
    s.completed=true;events.push('complete');
  }
  return events;
}
export function snapshot(s){
  return JSON.parse(JSON.stringify(s));
}
export function resetObjects(s){
  s.connections={lamp:null,radio:null,latch:null};s.charging=false;
  s.player={...START};s.cart=s.reel?1:0;s.pushing=false;s.latchTime=s.door?1:0;
  s.completed=false;
}
