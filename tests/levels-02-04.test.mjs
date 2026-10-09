import test from 'node:test';
import assert from 'node:assert/strict';
import {ComponentWorld,createComponent,Inventory} from '../src/campaign/components/index.js';
import wind from '../src/campaign/levels/02-wind-alley.js';
import market from '../src/campaign/levels/03-market.js';
import elevator from '../src/campaign/levels/04-elevator.js';
function game(factory){const d=factory(),w=new ComponentWorld(d.components.map(createComponent));const inventory=new Inventory(w,'ray');const ctx={flags:{},say(){},take:id=>inventory.take(id),place:(id,p)=>inventory.place(id,p)};d.setup(w,ctx);return {d,w,ctx,step(seconds){for(let t=0;t<seconds-1e-8;t+=.05){inventory.update();w.tick(.05);d.update(w,.05,ctx);inventory.update();}},act(id,a){const result=d.actions(w,id,ctx)?.find(x=>x.id===a);assert.ok(result,`${d.id}: ${id}/${a}`);return result.run();}};}
test('wind: low speed cannot create a bridge; overload recovers and high speed locks it',()=>{const g=game(wind),{w,d,ctx}=g;assert.equal(d.ready(w,ctx),false);w.get('supply').resetBreaker();g.step(.1);assert.equal(w.get('supply').state.tripped,true);w.get('sign').act('toggle',false);w.get('fan').act('speed',0);w.get('supply').resetBreaker();g.step(5);assert.equal(w.get('crate').state.progress,0);w.get('fan').act('speed',1);g.step(4);assert.equal(w.get('crate').state.locked,true);w.disconnect('fan');g.step(1);assert.equal(d.ready(w,ctx),true);assert.equal(w.get('crate').state.progress,1);});
test('wind: battery route consumes exactly 48 J and empty battery can recharge',()=>{const g=game(wind),{w}=g;w.get('ray').state.position={x:-3,y:0,z:-1};w.connect('battery','fan');g.step(4);assert.equal(w.get('crate').state.locked,true);assert.ok(Math.abs(w.get('battery').state.energy-24)<1e-6);w.disconnect('fan');w.get('battery').state.energy=0;w.get('battery').state.charging=true;w.get('sign').act('toggle',false);w.get('supply').resetBreaker();g.step(6);assert.equal(w.get('battery').state.energy,72);});
test('wind: alternate ride requires mains, speed and direction; crosses via scripted path',()=>{const g=game(wind),{w,d,ctx}=g;assert.match(g.act('launch','wind-ride'),/پنکه/);w.get('sign').act('toggle',false);w.get('supply').resetBreaker();w.get('fan').act('direction',1);g.step(.1);g.act('launch','wind-ride');g.step(2.1);assert.equal(ctx.flags.windCrossed,true);assert.equal(w.get('ray').state.position.x,2.4);assert.equal(d.ready(w,ctx),true);});
test('market: key cannot be taken on patrol; confetti wind creates genuine distraction',()=>{const g=game(market),{w,d,ctx}=g;assert.match(g.act('key','take-key'),/نگهبان/);assert.equal(ctx.flags.key,undefined);w.connect('supply','sign');w.connect('supply','fan');w.get('fan').act('direction',0);g.step(7);assert.equal(w.get('guard').state.mode,'cleaning');g.act('key','take-key');assert.equal(ctx.flags.key,true);assert.equal(ctx.flags.mainReceipt,true);assert.equal(d.ready(w,ctx),false);w.disconnect('fan');w.disconnect('sign');w.connect('supply','latch');g.step(1);assert.equal(d.ready(w,ctx),true);});
test('market: charger distracts without confetti and repeatable cycles recover missed opportunity',()=>{const g=game(market),{w,ctx}=g;w.connect('supply','dock');g.step(6);assert.equal(w.get('guard').state.mode,'charging');g.act('key','take-key');assert.equal(ctx.flags.key,true);w.get('guard').state.cooldown=3;g.act('dock','dock-recall');assert.equal(w.get('guard').state.cooldown,0);});
test('lift: startup overload, physical cargo, isolated upper lock and permanent return route',()=>{const g=game(elevator),{w,d,ctx}=g;w.get('ray').state.position={x:0,y:0,z:2};g.act('lift','load-cargo');assert.equal(w.get('battery').state.holder,'lift');g.act('lift','lift-up');g.step(.1);assert.equal(w.get('supply').state.tripped,true);assert.equal(w.get('lift').state.progress,0);g.act('console','lamp-isolate');g.act('console','reset-main');g.step(3.2);assert.equal(w.get('lift').state.progress,1);assert.equal(ctx.flags.floor,1);assert.ok(w.get('battery').state.position.y>=3);g.act('lift','unload-cargo');g.act('latch','battery-latch');g.step(1.1);assert.equal(w.get('latch').state.complete,true);assert.equal(d.ready(w,ctx),false);g.act('ladder','open-ladder');assert.equal(d.ready(w,ctx),true);g.act('ladder','use-ladder');assert.equal(ctx.flags.floor,0);g.act('ladder','use-ladder');assert.equal(ctx.flags.floor,1);});
test('lift: battery cannot start motor; mains cable route works without charged battery',()=>{const g=game(elevator),{w,ctx,d}=g;w.get('ray').state.position={x:0,y:0,z:2};w.connect('battery','lift');g.act('lift','lift-up');g.step(.1);assert.equal(w.get('lift').state.progress,0);assert.equal(w.get('battery').state.tripped,true);w.disconnect('lift');w.connect('supply','lift');w.get('lamp').act('toggle',false);w.get('battery').state.energy=0;g.act('reel','take-reel');g.step(3.2);assert.equal(ctx.flags.floor,1);assert.match(g.act('latch','service-latch'),/ایزوله/);g.act('upper-console','motor-isolate');g.act('latch','service-latch');g.step(1.1);assert.equal(w.get('latch').state.complete,true);assert.match(g.act('lift','lift-down'),/کابل سرویس/);g.act('ladder','open-ladder');assert.equal(d.ready(w,ctx),true);});
test('lift: power failure brakes midtravel and resumes without losing cargo',()=>{const g=game(elevator),{w,ctx}=g;w.get('ray').state.position={x:0,y:0,z:2};g.act('lift','load-cargo');w.get('lamp').act('toggle',false);g.act('lift','lift-up');g.step(1);const pos=w.get('lift').state.progress;w.disconnect('lift');g.step(1);assert.equal(w.get('lift').state.progress,pos);assert.equal(w.get('lift').state.braked,true);w.connect('supply','lift');g.step(2.2);assert.equal(ctx.flags.floor,1);assert.ok(w.get('battery').state.position.y>=3);});
test('all chapter-one definitions serialize live puzzle states and remain initially unsolved',()=>{for(const factory of [wind,market,elevator]){const g=game(factory);assert.equal(g.d.ready(g.w,g.ctx),false);const saved=g.w.snapshot();g.w.restore(saved);assert.deepEqual(g.w.snapshot(),saved);assert.ok(g.d.components.every(s=>s.label));assert.ok(g.d.hint(g.w,g.ctx).steps.length);}});

import {CampaignSession} from '../src/campaign/levels/runtime/CampaignSession.js';
function session(factory){const s=new CampaignSession(factory());s.started=true;return s;}
function advance(s,seconds){for(let t=0;t<seconds-1e-8;t+=.05)s.update(.05);}
function approach(s,id){
 const p=s.world.get(id).state.position,ray=s.ray.state.position;
 if(Math.hypot(p.x-ray.x,p.z-ray.z)<1.45)return;
 const candidates=Array.from({length:16},(_,i)=>({x:p.x+Math.cos(i*Math.PI/8)*.95,z:p.z+Math.sin(i*Math.PI/8)*.95}));
 candidates.sort((a,b)=>Math.hypot(a.x-ray.x,a.z-ray.z)-Math.hypot(b.x-ray.x,b.z-ray.z));
 const path=candidates.map(q=>s.navigation.findPath(ray,q,{})).find(path=>path.length);
 assert.ok(path,`no physical path to ${s.id}/${id}`);
 for(const point of path){s.ray.state.position={...s.ray.state.position,...point};s.update(.1);}
 assert.ok(Math.hypot(p.x-s.ray.state.position.x,p.z-s.ray.state.position.z)<=1.7,`not in reach of ${id}`);
}
function command(s,id,action){approach(s,id);assert.equal(s.execute(id,action),true,`${id}/${action}`);}
test('session wind: battery tether, saved partial bridge, inventory slot and real crossing',()=>{
 const s=session(wind);approach(s,'fan');s.world.connect('battery','fan');advance(s,2);
 assert.equal(s.navigation.tetherAllows({x:4,z:0}),false);
 assert.equal(s.take('hat'),false,'portable false / occupied inventory cannot take hat');
 const save=s.snapshot(),restored=session(wind);restored.restore(save);
 assert.equal(restored.world.get('battery').state.holder,'ray');assert.ok(restored.world.get('crate').state.progress>.49);
 advance(restored,2.1);assert.equal(restored.world.get('crate').state.locked,true);
 restored.execute('fan','fan-disconnect');const path=restored.navigation.findPath(restored.ray.state.position,restored.definition.exit,{});assert.ok(path.length,'completed bridge must create a walkable exit route');
 for(const point of path){restored.ray.state.position={...point,y:0};restored.update(.1);}assert.equal(restored.completed,true);
});
test('session market: real pathfinding moves guard and both routes permit reaching key and latch',()=>{
 for(const mode of ['paper','dock']){const s=session(market);if(mode==='paper'){s.world.connect('supply','sign');s.world.connect('supply','fan');s.world.get('fan').act('direction',0);}else s.world.connect('supply','dock');advance(s,7);
 command(s,'key','take-key');assert.equal(s.flags.key,true);approach(s,'latch');for(const id of ['fan','sign','dock'])s.world.disconnect(id);s.world.connect('supply','latch');advance(s,1.1);
 const restored=session(market);restored.restore(s.snapshot());assert.equal(restored.flags.key,true);assert.equal(restored.definition.ready(restored.world,restored.ctx),true);
 assert.ok(restored.navigation.findPath(restored.ray.state.position,restored.definition.exit,{}).length);
 }
});
test('session lift: one carried item, onboard overload recovery, physical cargo restore and upper-floor controls',()=>{
 const s=session(elevator);assert.equal(s.take('toolbox'),false);command(s,'lift','load-cargo');assert.equal(s.world.get('battery').state.holder,'lift');
 approach(s,'toolbox');assert.equal(s.take('toolbox'),true);command(s,'lift','lift-up');advance(s,.1);
 assert.equal(s.world.get('supply').state.tripped,true);assert.equal(s.inTransit(),true);
 command(s,'lift','onboard-lamp');command(s,'lift','onboard-reset');advance(s,1.1);
 const saved=s.snapshot(),restored=session(elevator);restored.restore(saved);advance(restored,2.1);assert.equal(restored.flags.floor,1);assert.equal(restored.flags.honoraryPorter,true);
 assert.equal(restored.world.get('toolbox').state.holder,'ray');restored.drop('toolbox');command(restored,'lift','unload-cargo');assert.equal(restored.world.get('battery').state.holder,'ray');
 command(restored,'latch','battery-latch');advance(restored,1.1);command(restored,'latch','disconnect-latch');command(restored,'ladder','open-ladder');
 assert.equal(restored.definition.ready(restored.world,restored.ctx),true);command(restored,'ladder','use-ladder');assert.equal(restored.flags.floor,0);assert.equal(restored.ray.state.position.y,0);
});
test('session lift: recovery return does not retain a false upper-floor height',()=>{
 const s=session(elevator);approach(s,'lift');s.world.get('lamp').act('toggle',false);command(s,'lift','lift-up');advance(s,3.2);assert.equal(s.flags.floor,1);
 s.ray.state.position={...s.definition.start};advance(s,.1);assert.equal(s.flags.floor,0);assert.equal(s.ray.state.position.y,0);
});

test('session elevator: lower supply and charger are reachable before first ascent',()=>{
 const s=session(elevator);approach(s,'supply');approach(s,'charger');s.world.get('battery').state.energy=0;s.world.get('lamp').act('toggle',false);s.charge();advance(s,6.1);assert.equal(s.world.get('battery').state.energy,72);
});
import * as T from '../src/campaign/engine/three.js';
import {campaignEnvironment} from '../src/campaign/visual/CampaignEnvironment.js';
function environment(factory){const scene=new T.Scene();const m=Object.fromEntries(['floor','dark','rust','brass','plaster','wood','ink','blue','green','cream'].map(id=>[id,new T.MeshBasicMaterial()]));return {scene,environment:campaignEnvironment(scene,m,factory())};}
test('alley geometry: open visible channel matches collision axis and crate spans the canal',()=>{
 const {scene,environment:env}=environment(wind);const crate=new T.Group();crate.userData.interaction='crate';scene.add(crate);env.update(wind().obstacles(new ComponentWorld(wind().components.map(createComponent)),{}));scene.updateMatrixWorld(true);
 const water=scene.getObjectByName('alley-channel');assert.equal(water.position.x,.8);assert.equal(water.geometry.parameters.width,1.3);assert.equal(water.geometry.parameters.depth,10);
 const hits=new T.Raycaster(new T.Vector3(.8,4,3),new T.Vector3(0,-1,0)).intersectObjects(env.root.children,true);assert.equal(hits[0].object.name,'alley-channel');
 assert.ok(crate.scale.x*.85>1.3);assert.equal(crate.position.y,-.24);
});
test('elevator geometry: upper landing is physically rendered at y=3 with a shaft opening',()=>{
 const {scene,environment:env}=environment(elevator);scene.updateMatrixWorld(true);
 const hits=new T.Raycaster(new T.Vector3(4,6,-2),new T.Vector3(0,-1,0)).intersectObjects(env.root.children,true);assert.equal(hits[0].object.name,'upper-floor');assert.ok(Math.abs(hits[0].point.y-3)<1e-6);
 const shaft=new T.Raycaster(new T.Vector3(0,3.5,-2),new T.Vector3(0,-1,0)).intersectObjects(env.root.children,true);assert.notEqual(shaft[0]?.object.name,'upper-floor');
});


test('market: key interaction explains blocked states and takes it only after guard moves away',()=>{
 const s=session(market),w=s.world,d=s.definition;
 const interact=()=>d.interact(w,'key',s.ctx);
 assert.match(interact(),/گشت/);assert.equal(s.flags.key,undefined);
 w.get('guard').state.mode='cleaning';w.get('guard').state.position={...w.get('key').state.position};
 assert.match(interact(),/کنار کلید/);assert.equal(d.focus(w,s.ctx),null);
 w.get('papers').state.position={x:-4,y:0,z:1};
 assert.match(interact(),/صبر/);assert.equal(s.flags.key,undefined);
 w.get('guard').state.position={x:-4,y:0,z:1};
 assert.equal(d.focus(w,s.ctx),'key');assert.equal(d.hint(w,s.ctx).key,'take-key');
 assert.match(interact(),/کلید برداشته شد/);assert.equal(w.get('key').state.collected,true);assert.equal(s.flags.mainReceipt,true);
 assert.equal(d.focus(w,s.ctx),null);assert.match(interact(),/کیف/);
 const restored=session(market);restored.restore(s.snapshot());assert.equal(restored.world.get('key').state.visible,false);assert.equal(restored.flags.key,true);
});


test('market: powering every route overloads; reallocation or a second source is required',()=>{
 const g=game(market),{w,ctx,d}=g;
 for(const id of ['sign','fan','dock'])w.connect('supply',id);
 g.step(.1);assert.equal(w.get('supply').state.tripped,true);assert.equal(ctx.flags.key,undefined);
 w.disconnect('dock');w.get('supply').resetBreaker();w.get('fan').act('direction',0);g.step(7);
 g.act('key','take-key');assert.equal(ctx.flags.key,true);
 w.connect('supply','latch');g.step(1.2);assert.equal(d.ready(w,ctx),false,'all-on must not open the exit');
 w.disconnect('sign');w.disconnect('fan');w.get('supply').resetBreaker();g.step(1.2);assert.equal(d.ready(w,ctx),true);
});
