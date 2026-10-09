import assert from 'node:assert/strict';
import {CampaignSession} from '../src/campaign/levels/runtime/CampaignSession.js';
import passage from '../src/campaign/levels/09-capacitor-passage.js';
import garden from '../src/campaign/levels/10-quiet-garden.js';
import rescue from '../src/campaign/levels/11-rescue.js';
import finale from '../src/campaign/levels/12-lights-return.js';
const make=f=>{const s=new CampaignSession(f());s.started=true;return s;};
const st=(s,id)=>s.world.get(id).state;
const step=(s,t)=>{for(let i=0;i<Math.ceil(t/.02);i++)s.update(Math.min(.02,t-i*.02));};
const action=(s,id,name)=>assert.equal(s.execute(id,name),true,`Missing ${s.id}/${id}/${name}`);
const connect=(s,source,target)=>assert.equal(s.world.connect(source,target),true);
const move=(s,x,z)=>{st(s,'ray').position={x,y:0,z};s.inventory.update();};
const ready=s=>s.definition.ready(s.world,s.ctx);
const near=(a,b)=>assert.ok(Math.abs(a-b)<.04,`${a} ~= ${b}`);
function openedPassage(route){const s=make(passage);action(s,'cart',route==='battery'?'shelf':'clear');
 if(route==='capacitor'){action(s,'battery','drop');assert.ok(s.take('capacitor'));s.ctx.place('capacitor',{x:-4,y:0,z:-1.6});action(s,'capCharger','charge-cap');step(s,2.25);near(st(s,'capacitor').energy,72);action(s,'capCharger','release-cap');assert.ok(s.take('capacitor'));move(s,.1,-1.6);action(s,'capDock','dock-cap');}
 else{move(s,.2,2.1);action(s,'batteryDock','dock-battery');}
 connect(s,route,'holder');action(s,'holder','toggle');step(s,1);assert.ok(st(s,'door').amount>.9);return s;
}
for(const route of ['capacitor','battery']){const s=openedPassage(route);assert.equal(ready(s),false);move(s,3.1,-1.4);action(s,'lever','latch');step(s,.1);assert.equal(ready(s),true);assert.ok(st(s,'capacitor').collected);}
{
 const s=make(passage);connect(s,'supply','holder');action(s,'holder','toggle');step(s,.1);assert.equal(s.world.connections.has('holder'),false);assert.equal(ready(s),false);
 st(s,'battery').energy=0;if(st(s,'battery').holder!=='ray'){for(const e of s.inventory.carried)s.ctx.place(e.id,{x:-3,y:0,z:-2});assert.ok(s.take('battery'));}move(s,-4,-2.7);action(s,'charger','charge');step(s,3);near(st(s,'battery').energy,72);
}
{
 const s=openedPassage('capacitor');step(s,8);assert.equal(st(s,'holder').powered,false);assert.equal(st(s,'door').latched,false);assert.equal(ready(s),false);
}
function litGarden(alternate=false){const s=make(garden);action(s,'battery','drop');assert.ok(s.take('module'));for(const id of ['lamp1','lamp2']){action(s,id,'aim-right');connect(s,'supply',id);}connect(s,'supply','fan');
 if(alternate){action(s,'lamp3','aim-right');connect(s,'supply','lamp3');}else{action(s,'mirror1','horizontal');action(s,'mirror2','vertical');}
 step(s,.2);assert.ok(['sensor1','sensor2','sensor3'].every(id=>st(s,id).lit));move(s,4,1);action(s,'bench','install');return s;
}
{
 const s=litGarden();connect(s,'supply','bench');step(s,6.1);assert.equal(ready(s),true);assert.equal(st(s,'supply').tripped,false);assert.ok(s.world.systems.some(sys=>sys.beams?.length>0));
}
{
 const s=litGarden(true);connect(s,'supply','bench');step(s,.1);assert.ok(st(s,'supply').tripped);assert.equal(st(s,'bench').complete,false);s.world.disconnect('bench');s.world.get('supply').act('reset');assert.ok(s.take('battery'));move(s,3.8,1.8);action(s,'bench','battery-dock');connect(s,'battery','bench');const energy=st(s,'battery').energy;step(s,6.3);assert.equal(ready(s),true);near(energy-st(s,'battery').energy,36);
}
{
 const s=litGarden();connect(s,'supply','bench');step(s,2);s.world.disconnect('fan');step(s,.2);assert.equal(st(s,'sensor3').lit,false);assert.equal(st(s,'bench').elapsed,0);assert.equal(ready(s),false);connect(s,'supply','fan');step(s,6.3);assert.equal(ready(s),true);
}
function prepareRescue(alternative=false){const s=make(rescue);action(s,'battery','drop');assert.ok(s.take('module'));move(s,-2,-1);action(s,'picoDock','install');connect(s,'supply','picoDock');step(s,1.1);assert.ok(st(s,'picoDock').complete);
 if(alternative){connect(s,'supply','magnet');step(s,.1);assert.ok(s.take('jack'));move(s,.4,0);action(s,'lid','place-jack');assert.ok(st(s,'jack').locked);s.world.disconnect('magnet');}
 else{assert.ok(s.take('battery'));move(s,.4,1);action(s,'battery','drop');connect(s,'battery','magnet');}connect(s,'supply','lift');step(s,.1);return s;
}
for(const alternate of [false,true]){
 const s=prepareRescue(alternate);const e=st(s,'battery').energy;action(s,'lift','rescue');step(s,4.1);assert.equal(s.flags.rescued,true);assert.ok(st(s,'lift').progress>=1);assert.equal(st(s,'supply').tripped,false);if(!alternate)assert.ok(e-st(s,'battery').energy>=48&&e-st(s,'battery').energy<50);else near(e,st(s,'battery').energy);
 assert.equal(ready(s),false);st(s,'pico').position={x:3,y:0,z:-1};action(s,'pico','stay');move(s,3.4,1.7);connect(s,'supply','bridgeLatch');step(s,.1);action(s,'bridgeLatch','pulse');step(s,1.2);assert.ok(st(s,'bridge').latched);move(s,5,2);step(s,.1);assert.equal(ready(s),false);action(s,'pico','follow');step(s,4);assert.equal(s.completed,true);
}
{
 const s=prepareRescue();connect(s,'supply','magnet');step(s,.05);action(s,'lift','rescue');step(s,1.2);assert.ok(st(s,'supply').tripped);assert.equal(s.flags.rescued,undefined);assert.equal(s.flags.sequence,false);
}
function preparedFinale(){const s=make(finale);action(s,'battery','drop');action(s,'cart','move-cart');action(s,'isolation','isolate');action(s,'reel','carry');assert.equal(st(s,'reel').holder,'ray');move(s,-.5,.1);action(s,'panel','install-reel');step(s,.05);assert.ok(s.flags.bypass);return s;}
for(const route of ['capacitor','battery','battery-services']){
 const s=preparedFinale();if(route==='capacitor'){action(s,'capCharger','charge-cap');step(s,2.25);action(s,'capCharger','release-cap');assert.ok(s.take('capacitor'));move(s,1,0);action(s,'capacitor','drop');connect(s,'capacitor','holder');for(const id of ['fan','gardenCharger'])connect(s,'garden',id);}
 else if(route==='battery'){assert.ok(s.take('battery'));move(s,1,0);action(s,'battery','drop');connect(s,'battery','holder');for(const id of ['fan','gardenCharger'])connect(s,'garden',id);}
 else{assert.ok(s.take('battery'));move(s,2.5,-.4);action(s,'battery','drop');connect(s,'garden','holder');for(const id of ['fan','gardenCharger'])connect(s,'battery',id);}
 step(s,.05);action(s,'panel','start');step(s,5.1);assert.equal(s.flags.locked,true,route);assert.equal(st(s,'supply').tripped,false);assert.equal(ready(s),false);
 for(const id of ['fan','gardenCharger','light1','light2','light3','light4'])connect(s,'supply',id);step(s,2.1);assert.equal(ready(s),true,route);assert.equal(st(s,'supply').tripped,false);
 const saved=s.snapshot(),restored=make(finale);restored.restore(saved);assert.equal(ready(restored),true);
 connect(s,'battery','light1');step(s,.1);assert.equal(ready(s),false,'Temporary battery light cannot win');
}
{
 const s=preparedFinale();for(const id of ['fan','gardenCharger','holder'])connect(s,'garden',id);step(s,.1);action(s,'panel','start');step(s,.2);assert.ok(st(s,'garden').tripped);assert.equal(s.flags.locked,undefined);assert.equal(s.flags.operation,false);
 st(s,'battery').energy=0;if(st(s,'battery').holder!=='ray'){for(const e of s.inventory.carried)s.ctx.place(e.id,{x:-3,y:0,z:-2});assert.ok(s.take('battery'));}move(s,-4,-2.7);action(s,'charger','charge');step(s,3);near(st(s,'battery').energy,72);
}
{
 const s=openedPassage('capacitor');move(s,.7,-1);action(s,'holder','planned-crossing');step(s,3.6);assert.ok(st(s,'door').latched);assert.equal(ready(s),true);
}
{
 const s=litGarden(true);connect(s,'battery','bench');step(s,.1);assert.equal(s.world.connections.has('bench'),false,'Battery must physically reach the isolated bench input');assert.equal(ready(s),false);
}
{
 const s=openedPassage('battery');move(s,3.1,-1.4);st(s,'battery').energy=0;step(s,1);assert.equal(st(s,'door').amount,0);action(s,'lever','latch');step(s,.1);assert.equal(ready(s),true,'The far-side mechanical lever always permits escape');
}
// Actual runtime navigation must reach each first-action object without teleporting.
for(const [factory,ids] of [[passage,['cart','capacitor','capCharger','charger']],[garden,['mirror1','mirror2','lamp1','lamp2','lamp3','fan','module']],[rescue,['module','picoDock','jack','lid','lift']],[finale,['cart','isolation','capCharger','panel']]]){
 const s=make(factory),from=st(s,'ray').position;
 for(const id of ids){const p=st(s,id).position,candidates=Array.from({length:16},(_,i)=>({x:p.x+Math.cos(i*Math.PI/8)*.95,z:p.z+Math.sin(i*Math.PI/8)*.95}));assert.ok(candidates.some(q=>s.navigation.walkable(q,{})&&s.navigation.findPath(from,q,{}).length),`${s.id}/${id} must be reachable through real navigation`);}
}
console.log('Chapter three: physical capacitor/battery, ray-traced garden, both rescues, three finale source routes and recovery passed.');
