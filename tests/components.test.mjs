import assert from 'node:assert/strict';
import * as C from '../src/campaign/components/index.js';
import {ComponentLevel,BaseLevel} from '../src/campaign/engine/ComponentLevel.js';
import {createNavigation} from '../src/campaign/engine/createNavigation.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const make=(preset,id,options={})=>C.createComponent(C.componentSpec(preset,id,options));
const world=(...entities)=>new C.ComponentWorld(entities);
for(const preset of Object.keys(C.presets)){
 const a=make(preset,'a'),b=make(preset,'b');const saved=a.snapshot();a.state.position.x=99;
 assert.equal(b.state.position.x,0);a.restore(saved);assert.deepEqual(a.snapshot(),saved);a.reset();
}
assert.throws(()=>C.createComponent({type:'Missing',id:'x'}));assert.throws(()=>new BaseLevel('x'));
// Same fan definition, different instances and speeds; overload is source-wide and recoverable.
{
 const source=make('limitedMains','source'),fan=make('fan','fan',{speed:1}),sign=make('sign','sign');
 const w=world(source,fan,sign);w.connect('source','fan');w.connect('source','sign');
 assert.ok(w.tick(.1).some(e=>e.type==='overload'));assert.equal(fan.state.powered,false);assert.equal(sign.state.powered,false);
 sign.act('toggle',false);source.act('reset');w.tick(.1);assert.equal(fan.strength,1);
 const snapshot=w.snapshot();assert.equal(w.measure('fan').watts,12);assert.deepEqual(w.snapshot(),snapshot,'Meter has no side effects');
 const crate=make('woodCrate','crate',{fan:'fan',from:{x:0,y:0,z:0},to:{x:2,y:0,z:0}});
 const w2=world(make('battery','battery'),make('fan','fan',{speed:1}),crate);w2.connect('battery','fan');w2.tick(4);
 assert.equal(crate.state.locked,true);near(crate.state.position.x,2);near(w2.get('battery').state.energy,24);
}
// Capacitor delivers only energy above cutoff with converter losses: 8.1 s at 6 W.
{
 const capacitor=make('capacitor','cap'),hold=make('holder','hold'),w=world(capacitor,hold);w.connect('cap','hold');w.tick(8.1);
 near(capacitor.inputVoltage,6);near(capacitor.energyAvailable(),0);assert.equal(hold.state.powered,false);
 capacitor.charge(1000);near(capacitor.state.energy,72);near(capacitor.energyAvailable(),48.6);
}
// Charging and output are mutually exclusive, including at full charge.
{
 const battery=make('battery','battery',{energy:0}),charger=make('charger','charger',{target:'battery'}),lamp=make('lamp','lamp');
 const w=world(make('mains','mains'),battery,charger,lamp);w.connect('mains','charger');w.connect('battery','lamp');
 battery.state.charging=true;w.tick(3);near(battery.state.energy,72);assert.equal(lamp.state.powered,false);
 battery.state.charging=false;w.tick(1);near(battery.state.energy,69);
 assert.equal(w.connect('battery','charger'),false);assert.equal(w.connect('battery','mains'),false);
}
// Motor startup cannot be bypassed by source transfer. Staggered pumps fit the budget.
{
 const source=make('mains','source'),first=make('pump','first'),second=make('pump','second'),lamp=make('lamp','lamp');
 const w=world(source,first,second,lamp);w.connect('source','first');w.connect('source','lamp');w.tick(1);
 w.connect('source','second');w.tick(.1);assert.equal(source.state.tripped,true);
 lamp.act('toggle',false);source.act('reset');second.act('toggle',false);w.tick(1);
 second.act('toggle',true);w.tick(1);lamp.act('toggle',true);w.tick(.1);assert.equal(source.state.tripped,false);
 const battery=make('battery','battery'),pump=make('pump','pump'),selector=make('selector','selector',{sources:['source','battery']});
 const other=world(make('mains','source'),battery,pump,selector);selector.act('select','source');other.connect('selector','pump');other.tick(2);
 selector.act('select','battery');other.tick(.1);assert.equal(battery.state.tripped,true,'Pump demands startup again after transfer');
}
// Hose routing changes actual water balance; reversing to the basin does not drain it.
{
 const basin=make('basin','basin'),hose=make('hose','hose'),pump=make('pump','pump',{hose:'hose',basin:'basin',drain:'out',rate:.2});
 const w=world(make('mains','source'),basin,hose,pump);w.connect('source','pump');hose.connect('basin','basin');w.tick(1);near(basin.state.level,1);
 hose.connect('basin','out');w.tick(2);near(basin.state.level,.6);hose.disconnect();w.tick(1);near(basin.state.level,.6);
}
// Lift stops safely, carries a real battery, and resumes from the stopped position.
{
 const battery=make('battery','battery'),lift=make('elevator','lift',{riders:['battery']}),source=make('mains','source');
 const w=world(source,lift,battery);w.connect('source','lift');lift.act('move',1);w.tick(1);
 const pos=lift.state.position.y;near(battery.state.position.y,pos);source.state.enabled=false;w.tick(1);near(lift.state.position.y,pos);assert.equal(lift.state.braked,true);
 source.state.enabled=true;w.tick(2);near(lift.state.progress,1);
}
// Magnets respect material and use safe landing pads on power loss.
{
 const item=make('metalCrate','item',{position:{x:0,y:0,z:0}}),magnet=make('magnet','magnet',{target:'item',position:{x:0,y:1,z:0},safeDrops:[{x:1,y:0,z:0}]});
 const w=world(make('mains','source'),magnet,item);w.connect('source','magnet');w.tick(.1);assert.equal(magnet.state.cargo,'item');near(item.state.position.y,.4);
 w.disconnect('magnet');w.tick(.1);assert.equal(item.state.holder,null);near(item.state.position.x,1);
 item.config.material='wood';item.state.position.x=0;w.connect('source','magnet');w.tick(.1);assert.equal(magnet.state.cargo,null);
}
// Loaded divider is solved electrically; equivalent parallel upper resistors also work.
{
 near(C.dividerOutput(12,[24],[12]).voltage,4);near(C.dividerOutput(12,[24],[12],12).voltage,2.4);
 near(C.dividerOutput(12,[12],[12],12).voltage,4);near(C.dividerOutput(12,[24,24],[12],12).voltage,4);
 const divider=make('divider','divider',{top:['a'],bottom:['b'],receiver:'receiver'}),receiver=make('receiver','receiver',{divider:'divider',antenna:'antenna'}),antenna=make('antenna','antenna');
 const w=world(make('mains','source'),make('resistor','a'),make('resistor','b'),divider,receiver,antenna);w.connect('source','divider');antenna.act('lock');w.tick(.1);assert.equal(receiver.state.quality,'clear');
 w.get('a').state.ohms=24;w.tick(.1);assert.equal(receiver.state.quality,'noise');
}
// Visible ray path, not an angle flag, determines the light sensor result.
{
 const lamp=make('beamLamp','lamp',{rays:1,spread:0}),mirror=make('mirror','mirror',{position:{x:2,y:0,z:0},angle:Math.PI/4}),sensor=make('sensor','sensor',{position:{x:2,y:0,z:2}});
 const optics=new C.OpticsSystem(),w=new C.ComponentWorld([make('mains','source'),lamp,mirror,sensor],[optics]);w.connect('source','lamp');w.tick(.1);assert.equal(sensor.state.lit,true);
 mirror.act('rotate',0);w.tick(.1);assert.equal(sensor.state.lit,false);
 mirror.act('rotate',Math.PI/4);const blocker=make('wall','wall',{from:{x:1,y:0,z:-1},to:{x:1,y:0,z:1}});w.entities.set(blocker.id,blocker);w.tick(.1);assert.equal(sensor.state.lit,false);
}
// Carried item identity, plate weight and companion wait behaviour.
{
 const actor=make('ray','ray'),item=make('battery','battery'),plate=make('plate','plate'),companion=make('companion','friend',{position:{x:2,y:0,z:0}});
 const w=world(actor,item,plate,companion),bag=new C.Inventory(w,'ray');assert.ok(bag.take('battery'));assert.equal(bag.take('battery'),false);
 actor.state.position.x=1;bag.update();near(item.state.position.x,1);assert.ok(bag.place('battery',{x:3,y:0,z:0}));
 actor.state.position.x=0;w.tick(.1);assert.equal(plate.state.pressed,true);w.canWalk=()=>false;companion.act('follow','ray');w.tick(1);near(companion.state.position.x,2);assert.equal(companion.state.waiting,true);
 companion.act('stay');assert.equal(companion.state.follow,null);
}
// One cable cannot serve two targets; damaged cables and open switches interrupt power.
{
 const cable=make('cable','cable'),sw=make('switch','switch'),lamp=make('lamp','lamp'),radio=make('radio','radio');
 const w=world(make('mains','source'),lamp,radio,cable,sw);assert.ok(w.connect('source','lamp',{cable:'cable',switches:['switch']}));assert.equal(w.connect('source','radio',{cable:'cable'}),false);
 w.tick(.1);assert.ok(lamp.state.powered);sw.act('toggle',false);w.tick(.1);assert.equal(lamp.state.powered,false);sw.act('toggle',true);cable.state.damaged=true;w.tick(.1);assert.equal(lamp.state.powered,false);
 w.disconnect('lamp');assert.equal(cable.state.to,null);
}
// Continuous timed work resets on interruption; latch retains completion without power.
{
 const source=make('battery','source',{energy:6}),latch=make('latch','latch'),w=world(source,latch);w.connect('source','latch');w.tick(1);assert.equal(latch.state.complete,true);near(source.state.energy,0);
 w.disconnect('latch');w.tick(1);assert.equal(latch.state.complete,true);
 const bench=make('bench','bench'),w2=world(make('mains','mains'),bench);w2.connect('mains','bench');w2.tick(3);w2.disconnect('bench');w2.tick(.1);near(bench.state.elapsed,0);
}
// Save/restore keeps motor phase and connections; malformed saves roll back atomically.
{
 const w=world(make('mains','source'),make('pump','pump'));w.connect('source','pump');w.tick(.4);const saved=w.snapshot();w.tick(2);w.restore(saved);assert.deepEqual(w.snapshot(),saved);
 const broken=structuredClone(saved);broken.connections[0][1].source='missing';assert.throws(()=>w.restore(broken));assert.deepEqual(w.snapshot(),saved);
 const w2=world(make('mains','source'),make('pump','pump'));w2.restore(saved);w.tick(.6);w2.tick(.2);w2.tick(.4);near(w.get('pump').state.runningTime,w2.get('pump').state.runningTime);
}
// A data-defined fixture uses the same engine without adding a campaign stage.
{
 const definition={id:'test-fixture',components:[C.componentSpec('battery','battery'),C.componentSpec('latch','latch')],connections:[{source:'battery',target:'latch'}],goals:[{id:'opened',test:w=>w.get('latch').state.complete}]};
 const level=new ComponentLevel(definition);level.paused=true;level.update(5);near(level.world.get('battery').state.energy,72);level.paused=false;level.update(1);assert.ok(level.completedGoals.has('opened'));
 const second=new ComponentLevel(definition);second.restore(level.snapshot());assert.deepEqual(second.snapshot(),level.snapshot());
}
// Navigation accepts another scene's geometry instead of importing workshop constants.
{
 const nav=createNavigation({bounds:{minX:0,maxX:4,minZ:0,maxZ:4},obstacles:()=>[{x:2,z:2,w:1,d:1}]});
 const s={player:{x:0,z:0}};assert.equal(nav.walkable({x:2,z:2},s),false);assert.ok(nav.findPath(s.player,{x:4,z:4},s).length);
}
console.log('PASS reusable components: catalog isolation, power/startup budgets, battery/capacitor, pumping, lift, magnet, loaded divider, optical occlusion, carry/companions, cable safety, persistence, pause and configurable navigation.');
