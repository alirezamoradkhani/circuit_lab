import {componentSpec} from '../../components/index.js';
export const pos=(x,z,y=0)=>({x,y,z});
export const spec=(preset,id,label,x,z,extra={})=>componentSpec(preset,id,{label,position:pos(x,z),...extra});
export const close=(a,b,r=1.5)=>Math.hypot(a.x-b.x,a.z-b.z)<=r;
export const state=(w,id)=>w.get(id).state;
export const act=(id,label,run)=>({id,label,run});
export const hint=(key,title,reason,clue,...steps)=>({key,title,reason,clue,steps});
export function essentials(start,exit){return [spec('ray','ray','رِی',start.x,start.z),spec('battery','battery','باتری همراه',start.x,start.z),spec('mains','supply','برق خدمات ۲۴ وات',-5,-2.7),spec('charger','charger','شارژ باتری',-4,-2.7,{target:'battery'}),spec('landing','exit','راه خروج',exit.x,exit.z,{portable:false})];}
export function setupBattery(w){state(w,'battery').holder='ray';}
export function dock(w,ctx,id,at){if(state(w,id).holder!=='ray')return 'اول همین وسیله را بردار و تا جایگاه حمل کن.';ctx.place(id,at);return 'وسیله روی جایگاه قرار گرفت.';}
export function recharge(w,id,charger){for(const [target,c] of [...w.connections])if(c.source===id)w.disconnect(target);state(w,id).charging=true;w.get('supply').act('reset');w.connect('supply',charger);return 'شارژ شروع شد؛ پیش از استفاده خروجی را از شارژ جدا کن.';}
export function released(w,id){state(w,id).charging=false;}
export const fixedSource=(w,id)=>['supply','garden'].includes(w.connections.get(id)?.source)&&state(w,id).powered;

export function enforcePortableLeads(w,ctx){for(const [id,wire] of [...w.connections]){if(!['battery','spare','capacitor'].includes(wire.source))continue;const source=w.get(wire.source),target=w.get(id);if(!close(source.state.position,target.state.position,2.65)){w.disconnect(id);ctx.say('کابل کوتاه نمی‌رسد؛ بسته را تا کنار مصرف‌کننده حمل کن.','warning');}}}
