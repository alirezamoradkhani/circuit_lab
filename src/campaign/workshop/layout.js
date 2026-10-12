import {REPAIR_INPUT,REPAIR_WALK} from './RepairCircuit.js';
import {presets} from '../components/presets.js';
export const ROOM = {minX:-6.15,maxX:6.15,minZ:-4.4,maxZ:4.05};
export const START = {x:1.3,z:2.8};
export const PORTS = {
  mains:{x:-5.45,y:1.2,z:-3.45},
  latch:{x:0.75,y:1.1,z:-4.25},
  lamp:{x:4.1,y:1.48,z:1.35},
  radio:{x:5.25,y:1.35,z:1.35},
};
export const NAMES = {battery:'باتری رِی',mains:'پریز تعمیرگاه',latch:'ضامن کرکره',lamp:'چراغ میز',radio:'رادیوی قدیمی',cart:'چرخ‌دستی',reel:'قرقرهٔ کابل',receipt:'رسید پاک‌رو',exit:'درِ خروج'};
export const LOADS = {lamp:presets.lamp.watts,radio:presets.radio.watts,latch:presets.latch.watts};
export const STATIC_OBSTACLES = [
  {x:5.7,z:3.15,w:0.6,d:0.6},
  {x:-4.75,z:-4.12,w:3.15,d:0.75},
  {x:-4.7,z:-0.65,w:3.5,d:1.35},
  {x:3.9,z:-0.65,w:6.0,d:1.35},
  {x:4.75,z:1.08,w:3.0,d:1.0},
  {x:5.8,z:-3.5,w:0.7,d:1.5},
];
export function cartPosition(s){return {x:-1,z:-0.65+2.7*s.cart};}
export function obstacles(s){
  return [...STATIC_OBSTACLES,{...cartPosition(s),w:3.6,d:1.35},
    ...(!s.door?[{x:2.35,z:-4.45,w:2.25,d:0.7}]:[])];
}
export function portPosition(id,s){
  if(id==='latch'&&s.repair)return REPAIR_INPUT;
  return id==='battery'?{...s.player,y:0.85}:PORTS[id];
}
export function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
export function walkPoint(id,s){
  if(id==='latch'&&s.repair)return REPAIR_WALK;
  const points={mains:{x:-5.4,z:-2.65},reel:{x:-4.55,z:-2.55},
    latch:{x:0.7,z:-3.35},lamp:{x:3.0,z:1.75},radio:{x:4.8,z:2.25},
    receipt:{x:3.65,z:2.85},exit:{x:2.35,z:s.door?-4.3:-3.65}};
  if(id==='cart')return {...cartPosition(s),z:0.55+2.7*s.cart};
  if(id==='battery')return s.player;
  return points[id];
}
export function interactionPosition(id,s){
  if(id==='cart')return {...cartPosition(s),y:1.15};
  if(id==='receipt')return {x:3.65,y:0.08,z:2.85};
  if(id==='reel')return {x:-4.55,y:0.52,z:-2.55};
  if(id==='exit')return {x:2.35,y:0.45,z:-4.25};
  return portPosition(id,s);
}
export function available(id,s){
  if(id==='receipt')return !s.receipt;
  if(id==='reel')return s.cart>0.95&&!s.reel;
  if(id==='cart')return s.cart<1;
  return true;
}
