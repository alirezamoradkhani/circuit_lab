import {Device,Source,Battery,Capacitor,Fan,Switch,Breaker,Prop,Charger} from '../../components/index.js';
const command=(id,label,run)=>({id,label,run});
export function disconnectEntity(world,id){
 for(const [target,wire] of [...world.connections])if(target===id||wire.source===id)world.disconnect(target);
 const e=world.get(id);if(e instanceof Battery)e.state.charging=false;
}
export function defaultActions(session,id){
 const w=session.world,e=w.get(id);if(!e)return [];
 const actions=[];
 if(e instanceof Source){
  if(e.state.tripped)actions.push(command('reset','وصل محافظ',()=>{e.act('reset');w.solve();return e.state.tripped?'اضافه‌بار هنوز وجود دارد؛ یک شاخه را قطع کن.':'محافظ وصل شد.';}));
 }else if(e instanceof Switch){actions.push(command('toggle',e.state.closed?'قطع شاخه':'وصل شاخه',()=>{e.act('toggle');return e.state.closed?'شاخه وصل شد.':'شاخه قطع شد.';}));
  if(e instanceof Breaker&&e.state.tripped)actions.push(command('reset','بازنشانی محافظ',()=>e.act('reset')));
 }else if(e instanceof Device&&!['PulseLatch','RepairBench','Charger','TimedDevice'].includes(e.kind)){
  actions.push(command('toggle',e.state.enabled?'خاموش':'روشن',()=>{e.act('toggle');return e.state.enabled?'کلید روشن شد؛ اتصال برق را بررسی کن.':'وسیله خاموش شد.';}));
 }
 if(e instanceof Fan){
  actions.push(command('speed','دور: '+['کم','زیاد','بیشینه'][e.state.speed],()=>{e.act('speed');return 'توان انتخاب‌شده: '+e.demand().toLocaleString('fa-IR')+' وات';}));
  if(e.directions.length>1)actions.push(command('direction','تغییر جهت باد',()=>{e.act('direction');return 'جهت پنکه عوض شد؛ حرکت اشیا را ببین.';}));
 }
 if(e instanceof Charger)actions.push(command(e.state.enabled?'charge':'charge','شارژ باتری',()=>session.charge(id)));
 if(e instanceof Battery){
  if(e.state.charging)actions.push(command('uncharge','جداکردن شارژ',()=>{e.state.charging=false;return 'کابل شارژ جدا شد.';}));
  if(e.state.holder==='ray')actions.push(command('drop','گذاشتن روی زمین',()=>session.drop(id)));
  else if(!e.state.holder)actions.push(command('carry','برداشتن بسته',()=>session.take(id)?'بسته همراه رِی است.':'اول وسیلهٔ همراه را روی زمین بگذار.'));
 }
 if(e instanceof Prop&&e.config.portable!==false){
  if(e.config.visual==='receipt'||e.config.visual==='key')actions.push(command('collect','برداشتن',()=>{e.collect();return 'در کیف نگه داشته شد.';}));
  else if(e.state.holder==='ray')actions.push(command('drop','گذاشتن',()=>session.drop(id)));
  else if(!e.state.locked&&!e.state.holder)actions.push(command('carry','حمل وسیله',()=>session.take(id)?'وسیله همراه رِی است.':'دست رِی پر است؛ وسیلهٔ همراه را بگذار.'));
 }
 if(w.connections.has(id)||[...w.connections.values()].some(c=>c.source===id))actions.push(command('unplug','جداکردن کابل',()=>{disconnectEntity(w,id);return 'کابل جدا شد.';}));
 return actions;
}
