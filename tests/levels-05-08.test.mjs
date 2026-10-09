import assert from 'node:assert/strict';
import {CampaignSession} from '../src/campaign/levels/runtime/CampaignSession.js';
import flooded from '../src/campaign/levels/05-flooded-square.js';
import shelter from '../src/campaign/levels/06-night-shift.js';
import depot from '../src/campaign/levels/07-magnetic-depot.js';
import rooftop from '../src/campaign/levels/08-radio-rooftop.js';
function build(factory){const d=factory(),messages=[],session=new CampaignSession(d,(text,tone)=>messages.push({text,tone})),w=session.world,ctx=session.ctx;session.started=true;
 return {d,w,ctx,session,messages,act(id,actionId){assert.ok(session.commands(id).some(x=>x.id===actionId),`${d.id}/${id}/${actionId}`);session.execute(id,actionId);return messages.at(-1)?.text;},tick(seconds){for(let t=0;t<seconds-1e-8;t+=.05)session.update(Math.min(.05,seconds-t));},dropBattery(){session.drop('battery');}};}

for(const factory of [flooded,shelter,depot,rooftop]){
 const a=build(factory),b=build(factory);assert.equal(a.d.ready(a.w,a.ctx),false);assert.equal(new Set(a.d.components.map(e=>e.id)).size,a.d.components.length);
 assert.ok(a.d.components.every(e=>e.label));a.ctx.flags.test=true;assert.equal(b.ctx.flags.test,undefined);
 assert.ok(a.d.hint(a.w,a.ctx).steps.length);const saved=a.w.snapshot();a.w.restore(saved);assert.deepEqual(a.w.snapshot(),saved);
}
// Pumping the same water around changes no level. One correctly plumbed pump is a full valid route.
{
 const g=build(flooded);g.act('hose1','intake');g.act('hose1','return');g.w.get('pump1').act('toggle',true);g.tick(2);assert.equal(g.w.get('basin').state.level,1);assert.equal(g.ctx.flags.fountain,true);
 g.act('hose1','drain');g.tick(10);const water=g.w.get('basin').state.level;assert.ok(water<.8&&water>.7);
 g.act('hose1','detach');g.tick(2);assert.equal(g.w.get('basin').state.level,water);
 g.act('hose1','intake');g.act('hose1','drain');g.tick(31);assert.equal(g.d.ready(g.w,g.ctx),true);assert.ok(g.ctx.flags.drained);
}
// Incorrect simultaneous startup trips protection, preserves water, and staggered starts recover.
{
 const g=build(flooded);for(const n of ['1','2']){g.act('hose'+n,'intake');g.act('hose'+n,'drain');}
 g.w.get('pump1').act('toggle',true);g.tick(1.1);g.w.get('pump2').act('toggle',true);g.tick(.1);assert.equal(g.w.get('supply').state.tripped,true);
 const water=g.w.get('basin').state.level;g.tick(.2);assert.equal(g.w.get('basin').state.level,water);
 g.w.get('lamp').act('toggle',false);g.w.get('supply').act('reset');g.w.get('pump1').act('toggle',true);g.tick(1.1);g.w.get('pump2').act('toggle',true);g.tick(1.1);g.w.get('lamp').act('toggle',true);g.tick(.1);
 assert.equal(g.w.get('supply').state.tripped,false);assert.ok(g.w.get('pump1').state.powered&&g.w.get('pump2').state.powered);g.tick(20);assert.equal(g.d.ready(g.w,g.ctx),true);
}
// Moving an already-running pump to Ray's 12 W battery must require 18 W startup again.
{
 const g=build(flooded);g.w.get('pump1').act('toggle',true);g.tick(2);g.w.connect('battery','pump1');g.tick(.1);assert.equal(g.w.get('battery').state.tripped,true);assert.equal(g.w.get('pump1').state.powered,false);
}
function blackout(g){for(const id of ['lamp','fan','radio'])g.w.get(id).act('toggle',true);g.tick(1.3);assert.equal(g.ctx.flags.blackout,true);assert.equal(g.w.get('supply').state.tripped,true);}
// Shelter first solution: retain actual 6 W lamp, run ventilation at 3 W and radio at 3 W.
{
 const g=build(shelter);blackout(g);g.w.get('fan').act('speed',0);g.w.get('supply').act('reset');g.tick(3.2);assert.equal(g.d.ready(g.w,g.ctx),true);assert.equal(g.w.get('supply').maxWatts,12);
}
// Second solution requires physically carrying and installing the efficient lamp. Missing radio never passes.
{
 const g=build(shelter);blackout(g);g.act('table','install-lamp');assert.equal(g.w.get('ecoLamp').state.installed,undefined);g.dropBattery();g.act('ecoLamp','carry-lamp');g.act('table','install-lamp');assert.equal(g.w.get('ecoLamp').state.installed,true);
 g.w.get('radio').act('toggle',false);g.w.get('supply').act('reset');g.tick(4);assert.equal(g.d.ready(g.w,g.ctx),false);
 g.w.get('radio').act('toggle',true);g.tick(3.2);assert.equal(g.d.ready(g.w,g.ctx),true);assert.equal(g.w.get('lamp').state.powered,false);assert.equal(g.w.get('fan').state.speed,1);
}
function finishDepot(g){g.act('wood','load-wood');if(g.w.get('conveyor').state.direction!==-1)g.act('conveyor','reverse');if(!g.w.get('conveyor').state.enabled)g.w.get('conveyor').act('toggle');g.tick(3.2);assert.ok(g.w.get('wood').state.locked,JSON.stringify({flags:g.ctx.flags,wood:g.w.get('wood').state,conveyor:g.w.get('conveyor').state,source:g.w.get('supply').state}));assert.equal(g.d.ready(g.w,g.ctx),false);g.dropBattery();g.act('transmitter','take-transmitter');assert.equal(g.d.ready(g.w,g.ctx),true);}
// Rail route, including actual source overload and safe release.
{
 const g=build(depot);g.act('magnet','toggle');g.tick(.1);assert.equal(g.w.get('metal').state.holder,'magnet');g.act('rail','move-out');g.tick(.1);assert.equal(g.w.get('supply').state.tripped,true);assert.equal(g.w.get('metal').state.holder,null);
 g.w.get('conveyor').act('toggle',false);g.w.get('supply').act('reset');g.tick(3.3);g.w.get('magnet').act('toggle',false);g.tick(.1);assert.equal(g.ctx.flags.metalClear,true);assert.equal(g.ctx.flags.route,'crane');finishDepot(g);
}
// Conveyor route never moves the rail; the tray visibly travels under the load and carries it away.
{
 const g=build(depot);g.w.get('conveyor').act('toggle',false);g.act('magnet','toggle');g.tick(.1);g.w.connect('battery','conveyor');g.w.get('conveyor').act('toggle',true);g.tick(2);
 assert.ok(Math.abs(g.w.get('tray').state.position.x)<1e-6);g.w.get('conveyor').act('toggle',false);g.w.get('magnet').act('toggle',false);g.tick(.1);assert.equal(g.w.get('metal').state.holder,'tray');
 g.w.get('conveyor').act('toggle',true);g.tick(2);assert.equal(g.ctx.flags.metalClear,true);assert.equal(g.ctx.flags.route,'conveyor');assert.equal(g.w.get('rail').state.progress,0);assert.ok(Math.abs(g.w.get('battery').state.energy-48)<1e-5);
 g.w.connect('supply','conveyor');finishDepot(g);
}
function mount(g){g.dropBattery();g.act('transmitter','take-transmitter');g.act('receiver','mount');g.act('antenna','direction');g.act('antenna','lock');}
function install(g,id,slot){g.act(id,'carry-resistor');g.act('divider','install-'+slot);}
// Loaded divider: 24/12 yields 4 V open, 2.4 V loaded; only a true loaded 4 V message wins.
{
 const g=build(rooftop);mount(g);install(g,'r24a','top');install(g,'r12b','bottom');g.tick(.1);assert.ok(Math.abs(g.w.get('divider').state.output-4)<1e-5);assert.equal(g.d.ready(g.w,g.ctx),false);
 g.act('receiver','connect-load');g.tick(.1);assert.ok(Math.abs(g.w.get('divider').state.output-2.4)<1e-5);assert.equal(g.d.ready(g.w,g.ctx),false);
 g.act('divider','remove-top');install(g,'r12a','top');g.tick(.1);assert.ok(Math.abs(g.w.get('divider').state.output-4)<1e-5);assert.equal(g.d.ready(g.w,g.ctx),true);
}
// Real alternative: two independent 24 ohm resistors in parallel, receiver connected from the start.
{
 const g=build(rooftop);mount(g);g.act('receiver','connect-load');install(g,'r24a','top');install(g,'r24b','top');install(g,'r12a','bottom');g.tick(.2);assert.equal(g.d.ready(g.w,g.ctx),true);assert.equal(g.w.get('divider').state.top.length,2);
 g.act('antenna','lock');g.act('antenna','direction');g.act('antenna','lock');g.tick(3.2);assert.equal(g.ctx.flags.secret,true);
}
console.log('Levels 05-08: both routes, physical assembly, overload recovery and false-success rejection passed.');
// Runtime integration: one inventory slot is enforced by actual command handlers.
{
 const g=build(rooftop);g.act('transmitter','take-transmitter');assert.equal(g.w.get('transmitter').state.holder,null);
 assert.equal(g.w.get('battery').state.holder,'ray');g.act('battery','drop');g.act('r12a','carry-resistor');assert.equal(g.w.get('r12a').state.holder,'ray');
 g.act('r24a','carry-resistor');assert.equal(g.w.get('r24a').state.holder,null);g.act('divider','install-top');assert.equal(g.w.get('r12a').state.holder,'divider');
 g.act('r24a','carry-resistor');assert.equal(g.w.get('r24a').state.holder,'ray');
 const saved=g.session.snapshot(),restored=build(rooftop);restored.session.restore(saved);assert.deepEqual(restored.session.snapshot(),saved);
 assert.equal(restored.session.inventory.carried.length,1);assert.equal(restored.session.inventory.carried[0].id,'r24a');
}
// Source capacity is already 12 W immediately after restore, before a simulation frame.
{
 const g=build(shelter);blackout(g);const saved=g.session.snapshot(),restored=build(shelter);restored.session.restore(saved);
 assert.equal(restored.w.get('supply').maxWatts,12);assert.equal(restored.w.get('supply').state.backup,true);
 restored.w.get('fan').act('speed',0);restored.act('supply','reset');restored.tick(3.2);assert.equal(restored.d.ready(restored.w,restored.ctx),true);
 assert.equal(restored.session.completed,false,'Ready does not finish remotely');restored.session.ray.state.position={...restored.d.exit};restored.tick(.05);assert.equal(restored.session.completed,true);
}
// Partly drained water and routed hoses survive exact save/load; hidden receipt stays hidden until earned.
{
 const g=build(flooded);assert.equal(g.w.get('receipt').state.visible,false);g.act('hose1','intake');g.act('hose1','drain');g.act('pump1','toggle');g.tick(5);
 const saved=g.session.snapshot(),restored=build(flooded);restored.session.restore(saved);assert.deepEqual(restored.session.snapshot(),saved);
 const water=restored.w.get('basin').state.level;restored.tick(1);assert.ok(restored.w.get('basin').state.level<water);assert.equal(restored.w.get('receipt').state.visible,false);
 restored.tick(35);assert.equal(restored.w.get('receipt').state.visible,true);assert.equal(restored.session.completed,false);
 restored.session.ray.state.position={...restored.d.exit};restored.tick(.05);assert.equal(restored.session.completed,true);
}
// Every initial actionable object has a physically reachable approach point, including overhead crane controls.
for(const factory of [flooded,shelter,depot,rooftop]){
 const g=build(factory),navigation=g.session.navigation,ray=g.session.ray.state.position;
 for(const e of g.w.all()){
  if(e.id==='ray'||!e.state.visible||e.state.collected||e.config.interactive===false||!g.session.commands(e.id).length)continue;
  const candidates=e.config.walkPoint?[e.config.walkPoint]:Array.from({length:16},(_,i)=>({x:e.state.position.x+Math.cos(i*Math.PI/8)*.95,z:e.state.position.z+Math.sin(i*Math.PI/8)*.95}));
  assert.ok(Math.hypot(e.state.position.x-ray.x,e.state.position.z-ray.z)<1.45||candidates.some(p=>navigation.walkable(p,{})&&navigation.findPath(ray,p,{}).length),`${g.d.id}: no approach to ${e.id}`);
 }
}
console.log('CampaignSession integration: inventory, exact restores, immediate backup capacity, reachable controls and physical exits passed.');
