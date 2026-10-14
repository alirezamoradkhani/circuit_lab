import {appliances} from '../../city/adventureData.js';
import {measurePart} from '../../city/ComponentMeter.js';

const places=[[-4.1,-2.4],[-2.1,1.7],[.2,-2.6],[2.1,2.4],[4.4,-2.4],[4.5,2.5]];
const types={lamp:'lamp',resistor:'cabinet',battery:'source',switch:'source'};
export function missionDevices(s){
 const parts=s.board.parts,device=(id,label,partIds,keys=[],kind='cabinet',extra={})=>({id,label,partIds,keys,kind,...extra});
 const supply=device('supply','تابلو منبع',s.mission.id==='clinic'?[]:parts.slice(0,2).map(p=>p.id),['main','source'],'source');
 let loads;
 if(s.mission.id==='clinic')loads=appliances.map((p,i)=>device('load-'+i,p.name,[],[String(i)],['lamp','fan','radio','heater'][i],{loadIndex:i,power:p.power}));
 else if(s.mission.id==='gate')loads=[device('guard-lamp','چراغ نگهبانی',['p3'],[],'lamp')];
 else if(s.mission.id==='shop')loads=[device('shop-sign','تابلوی فروشگاه',['p3','p4'],[],'sign')];
 else if(s.mission.id==='station')loads=[device('status-lamp','چراغ وضعیت',['p3','p4'],[],'lamp')];
 else if(s.street)loads=s.street.lamps.map((p,i)=>device('street-'+i,'چراغ '+(i+1),[p.id,...(i===2&&s.street.cable?[s.street.cable.id]:[])],[],'lamp'));
 else if(s.mission.id==='bridge')loads=[device('left-arm','بازوی چپ پل',['p3','p4']),device('right-arm','بازوی راست پل',['p5','p6'],['trim']),device('sensor','حسگر مخزن',['p7'],[],'sensor')];
 else if(s.mission.id==='feeder')loads=[device('line','کابل مسیر',['p3'],['cable']),device('lighting','روشنایی',['p4'],[],'lamp'),device('services','بار خدمات',['p5'],[],'cabinet')];
 else loads=parts.slice(2).map((p,i)=>device('device-'+i,p.label||({backup:['چراغ','تهویه','بی‌سیم','گرم‌کن'],pumps:['پمپ اول','پمپ دوم','روشنایی'],radio:['مقاومت بالا','مقاومت پایین','گیرنده']}[s.mission.id]?.[i])||'دستگاه '+(i+1),[p.id],[s.mission.id==='radio'?['top','bottom','receiver'][i]:String(i),...(s.mission.id==='isolation'?['repair']:[])],s.mission.id==='pumps'?(i<2?'pump':'lamp'):s.mission.id==='backup'?['lamp','fan','radio','heater'][i]:s.mission.id==='transfer'?['lamp','radio','heater'][i]:types[p.type]));
 return [supply,...loads].map((d,i)=>{const [x,z]=places[i];return {...d,position:{x,z},walk:{x,z:z+(z<0?-.95:.95)},order:i};});
}
export function deviceReadings(s,d){
 if(s.mission.id==='clinic'&&d.id==='supply')return {on:!s.tripped,voltage:12,current:s.current};
 if(d.loadIndex!==undefined){const on=s.loads[d.loadIndex]&&!s.tripped;return {on,voltage:on?12:0,current:on?d.power/12:0};}
 const readings=d.partIds.map(id=>measurePart(s,id)).filter(Boolean);
 if(d.id==='supply')return {on:!s.tripped&&s.board.parts[1].closed&&s.board.parts[0].value>0,voltage:s.board.parts[0].value,current:s.current};
 const currents=readings.map(r=>r.current??0);const on=!s.tripped&&currents.some(v=>v>.001);
 return {on,voltage:readings.at(-1)?.voltage??0,current:Math.max(0,...currents)};
}
export function deviceForPart(devices,id){return devices.find(d=>d.partIds.includes(id));}
export function canReachDevice(player,d){return Math.hypot(player.x-d.walk.x,player.z-d.walk.z)<1.4;}
