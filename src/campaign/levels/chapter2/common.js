import {componentSpec} from '../../components/index.js';
export const point=(x,z,y=0)=>({x,y,z});
export const spec=(preset,id,label,x,z,extra={})=>componentSpec(preset,id,{label,position:point(x,z),...extra});
export const action=(id,label,run)=>({id,label,run});
export const hint=(key,title,reason,clue,steps)=>({key,title,reason,clue,steps});
export const powered=(world,id)=>!!world.get(id)?.state.powered;
export const common=(exit=point(5,2.8))=>[
 spec('ray','ray','رِی',-5,2.7),spec('battery','battery','باتری رِی · ۷۲ ژول',-5,2.7),
 spec('mains','supply','منبع برق و محافظ',-4,-2.6),
 spec('charger','charger','ایستگاه شارژ',-4,0,{target:'battery',watts:12}),
 spec('landing','exit','مسیر خروج',exit.x,exit.z,{portable:false})
];
export function setupCommon(world){world.get('battery').state.holder='ray';}
export const bounds={minX:-6,maxX:6,minZ:-4,maxZ:4};
export function disconnectAction(world,id){return action('disconnect','جدا کردن کابل',()=>{world.disconnect(id);return 'کابل جدا شد.';});}
export function toggleAction(world,id){return action('toggle',world.get(id).state.enabled?'خاموش':'روشن',()=>{world.get(id).act('toggle');return world.get(id).state.enabled?'کلید روشن شد.':'کلید خاموش شد.';});}
export function carried(world){return world.all().find(e=>e.id!=='battery'&&e.state.holder==='ray');}
