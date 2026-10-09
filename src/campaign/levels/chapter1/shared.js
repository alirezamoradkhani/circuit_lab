import {componentSpec} from '../../components/presets.js';
export const p=(x,z,y=0)=>({x,y,z});
export const spec=(preset,id,label,x,z,options={})=>componentSpec(preset,id,{label,position:p(x,z),...options});
export const action=(id,label,run)=>({id,label,run});
export const near=(a,b,r=1.6)=>Math.hypot(a.state.position.x-b.state.position.x,a.state.position.z-b.state.position.z)<=r;
export const clue=(key,title,reason,clue,steps)=>({key,title,reason,clue,steps});
export const collectible=(world,id,flag,ctx,text)=>{world.get(id).collect();ctx.flags[flag]=true;return text;};
export function baseComponents(start,exit,maxWatts=24){return [
 spec('ray','ray','رِی',start.x,start.z,{position:start,portable:false}),
 spec('battery','battery','باتری همراه · ۷۲ ژول',start.x,start.z),
 spec('landing','exit','مسیر خروج',exit.x,exit.z,{position:exit,portable:false}),
 spec('mains','supply',`منبع ثابت · ${maxWatts} وات`,-5,-2.5,{maxWatts,portable:false}),
 spec('charger','charger','جایگاه شارژ باتری',-4.5,-2.5,{watts:Math.min(12,maxWatts),target:'battery',portable:false})
];}
export function setupBase(world){world.get('battery').state.holder='ray';world.connect('supply','charger');}
