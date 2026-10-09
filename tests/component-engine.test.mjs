import assert from 'node:assert/strict';
import * as C from '../src/campaign/components/index.js';
import {ComponentInteraction} from '../src/campaign/engine/ComponentInteraction.js';
import {ComponentLevel} from '../src/campaign/engine/ComponentLevel.js';
import {CampaignStore} from '../src/campaign/engine/CampaignStore.js';
import {FrameGame} from '../src/campaign/engine/FrameGame.js';
import {createNavigation} from '../src/campaign/engine/createNavigation.js';
const make=(preset,id,options={})=>C.createComponent(C.componentSpec(preset,id,options));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
{
 const ray=make('ray','ray'),ride=make('ride','ride',{actor:'ray',points:[{x:0,y:0,z:0},{x:1,y:2,z:0},{x:2,y:0,z:0}],duration:2});
 const w=new C.ComponentWorld([ray,ride]);ride.act('start');w.tick(1);near(ray.state.position.y,2);w.tick(1);near(ray.state.position.x,2);assert.ok(ride.state.complete);
 const jack=make('jack','jack'),door=make('door','door',{jack:'jack'});w.entities.set('jack',jack);w.entities.set('door',door);jack.act('deploy');w.tick(1);near(door.state.amount,1);
 jack.state.locked=false;door.state.blocked=true;w.tick(1);near(door.state.amount,1);door.state.blocked=false;w.tick(1);near(door.state.amount,0);
 door.act('latch');w.tick(1);near(door.state.amount,1);
}
{
 const item=make('woodCrate','item'),conveyor=make('conveyor','belt',{cargo:['item'],speed:.5,min:0,max:1}),source=make('mains','source');
 const w=new C.ComponentWorld([source,item,conveyor]);w.connect('source','belt');w.tick(4);near(item.state.position.x,1);conveyor.act('reverse');w.tick(1);near(item.state.position.x,.5);
 const plate=make('plate','plate',{position:{x:.5,y:0,z:0}});w.entities.set('plate',plate);w.disconnect('belt');w.tick(.1);assert.ok(plate.state.pressed);
}
{
 const breaker=make('breaker','branch',{maxWatts:3}),source=make('mains','source'),heater=make('heater','heater');
 const w=new C.ComponentWorld([source,breaker,heater]);w.connect('source','heater',{switches:['branch']});w.tick(.1);
 assert.ok(breaker.state.tripped);assert.equal(source.state.tripped,false);assert.equal(heater.state.powered,false);
 assert.equal(w.connect('source','heater',{switches:['missing']}),false);assert.equal(w.connect('source','heater',{cable:'source'}),false);
}
{
 const a=make('socket','a',{accepts:['Battery']}),b=make('socket','b'),battery=make('battery','battery'),w=new C.ComponentWorld([a,b,battery]);
 assert.ok(a.insert(battery));assert.equal(b.insert(battery),false);assert.equal(a.remove(w),battery);assert.ok(b.insert(battery));
 const divider=make('divider','divider'),r=make('resistor','r');w.entities.set(r.id,r);w.entities.set(divider.id,divider);
 assert.ok(divider.install('top','r',w));assert.equal(divider.install('bottom','r',w),false);divider.remove('r',w);assert.ok(divider.install('bottom','r',w));
}
{
 const source=make('mains','source'),fan=make('fan','fan'),w=new C.ComponentWorld([source,fan]),controls=new ComponentInteraction(w);
 controls.setTool('cable');controls.select('source');assert.ok(controls.select('fan').ok);w.tick(.1);
 const before=w.snapshot();controls.setTool('meter');assert.equal(controls.select('fan').measurement.watts,6);assert.equal(controls.act('toggle'),false);assert.deepEqual(w.snapshot(),before);
 controls.setTool('hand');controls.select('fan');controls.act('speed',1);w.tick(.1);assert.equal(w.measure('fan').watts,12);
 controls.setTool('cable');controls.select('fan');assert.ok(controls.select('source').disconnected);
}
{
 const papers=make('papers','papers'),guard=make('guard','guard',{litter:'papers',dwell:.2,route:[{x:0,y:0,z:0},{x:1,y:0,z:0}]}),w=new C.ComponentWorld([guard,papers]);
 w.tick(.25);assert.ok(papers.state.collected);w.tick(.1);assert.equal(guard.state.mode,'patrol');
 const fan=make('fan','fan',{speed:1}),hat=make('hat','hat',{fan:'fan',to:{x:2,y:0,z:0},travelSeconds:1}),source=make('mains','source');
 const wind=new C.ComponentWorld([fan,hat,source]);wind.connect('source','fan');wind.tick(1);near(hat.state.position.x,2);assert.ok(hat.state.locked);
}
{
 const friend=make('companion','friend'),ray=make('ray','ray',{position:{x:3,y:0,z:0}}),w=new C.ComponentWorld([friend,ray]);
 const navigation=createNavigation({bounds:{minX:-1,maxX:4,minZ:-2,maxZ:2},obstacles:()=>[{x:1.5,z:0,w:.5,d:1}]});
 w.canWalk=p=>navigation.walkable(p,{});w.findPath=(from,to)=>navigation.findPath(from,to,{});friend.act('follow','ray');w.tick(5);
 assert.ok(Math.hypot(friend.state.position.x-3,friend.state.position.z)<.8,'Companion navigates around obstacles');
}
{
 const latch=make('latch','latch'),sequence=make('sequence','sequence',{requires:[{id:'latch',field:'complete'}],steps:[{seconds:2},{seconds:3}]}),w=new C.ComponentWorld([sequence,latch]);
 sequence.act('start');w.tick(.1);assert.ok(sequence.state.interrupted);latch.state.complete=true;sequence.act('start');w.tick(5);assert.ok(sequence.state.complete);
}
{
 const definition={id:'fixture',components:[C.componentSpec('battery','battery'),C.componentSpec('latch','latch')],connections:[{source:'battery',target:'latch'}],goals:[]};
 const level=new ComponentLevel(definition),values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const store=new CampaignStore(storage);level.update(.3);assert.ok(store.save(level));const main=store.read().levels.fixture;level.update(.7);store.save(level,{replay:true});assert.deepEqual(store.read().levels.fixture,main);
 assert.ok(store.load(level));near(level.world.get('latch').state.elapsed,.3);
 const unavailable=new CampaignStore({getItem(){throw new Error('disabled');},setItem(){throw new Error('disabled');}});
 assert.equal(unavailable.save(level),false);level.update(.7);assert.ok(unavailable.load(level));near(level.world.get('latch').state.elapsed,.3);
}
{
 const old={raf:globalThis.requestAnimationFrame,caf:globalThis.cancelAnimationFrame,document:globalThis.document};let callback;
 globalThis.requestAnimationFrame=fn=>(callback=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
 try{
  class Demo extends FrameGame{step(dt){this.elapsed=(this.elapsed??0)+dt;}}
  const demo=new Demo(null);demo.startFrames();callback(demo.last+1000);near(demo.elapsed,.05);globalThis.document.hidden=true;callback(demo.last+1000);near(demo.elapsed,.05);demo.dispose();assert.equal(demo.active,false);
 }finally{globalThis.requestAnimationFrame=old.raf;globalThis.cancelAnimationFrame=old.caf;globalThis.document=old.document;}
}
{
 const battery=make('battery','battery'),w=new C.ComponentWorld([battery]),original=w.snapshot();
 const bad=structuredClone(original);bad.entities[0].state.energy=-1;assert.throws(()=>w.restore(bad));assert.deepEqual(w.snapshot(),original);
 const wrongPosition=structuredClone(original);wrongPosition.entities[0].state.position=null;assert.throws(()=>w.restore(wrongPosition));assert.deepEqual(w.snapshot(),original);
}
{
 const w=new C.ComponentWorld([make('battery','battery'),make('lamp','lamp')]),control=new ComponentInteraction(w);
 w.connect('battery','lamp');w.tick(1);control.setTool('cable');control.select('battery');assert.ok(control.disconnect());assert.equal(w.connections.size,0);
 w.connect('battery','lamp');w.resetObjects(['battery']);near(w.get('battery').state.energy,69);assert.equal(w.connections.size,0);
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},store=new CampaignStore(storage);
 const level=new ComponentLevel({id:'quota-test',components:[C.componentSpec('battery','battery')],goals:[]});store.save(level);
 storage.setItem=()=>{throw new Error('quota');};level.world.get('battery').consume(12);assert.equal(store.save(level),false);
 level.world.get('battery').consume(12);assert.ok(store.load(level));near(level.world.get('battery').state.energy,60);
}
console.log('PASS component engine: scripted traversal, safe gates, conveyors, branch protection, slot ownership, read-only tools, guard cycles, wind, routed companions, sequences, replay/session saves and frame lifecycle.');
