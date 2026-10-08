import assert from 'node:assert/strict';
import {freshState,restoreState,snapshot,resetObjects,tick} from '../src/campaign/workshop/state.js';
import {connect,disconnect,interact,measure} from '../src/campaign/workshop/actions.js';
import {findPath,walkable,movePlayer} from '../src/campaign/engine/navigation.js';
import {walkPoint} from '../src/campaign/workshop/layout.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6, a+' != '+b);
const make=()=>Object.assign(freshState(),{started:true});
const pull=s=>{s.player=walkPoint('cart',s);assert.ok(interact(s,'cart').ok);tick(s,1.8);assert.equal(s.cart,1);assert.ok(walkable(s.player,s));};
const moveTo=(s,id)=>{const goal=walkPoint(id,s),path=findPath(s.player,goal,s);assert.ok(path.length||Math.hypot(s.player.x-goal.x,s.player.z-goal.z)<.3,'Reachable: '+id);s.player={...goal};};
const exit=s=>{disconnect(s,'battery');moveTo(s,'exit');tick(s,.1);assert.equal(s.completed,true);};

{
 const s=make();assert.equal(s.door,false);assert.equal(s.completed,false);
 assert.equal(findPath(s.player,walkPoint('latch',s),s).length,0,'Cart physically blocks rear aisle');
 assert.equal(connect(s,'mains','latch').ok,false,'Cannot use inaccessible socket');
 pull(s);assert.ok(findPath(s.player,walkPoint('mains',s),s).length);
 assert.ok(findPath(s.player,walkPoint('latch',s),s).length);
 moveTo(s,'receipt');interact(s,'receipt');
 moveTo(s,'latch');assert.ok(connect(s,'battery','latch').ok);
 tick(s,.4);assert.equal(s.door,false);near(s.energy,69.6);
 tick(s,.6);assert.equal(s.door,true);near(s.energy,66);
 tick(s,20);near(s.energy,66);assert.equal(s.completed,false,'Opening alone does not win');
 exit(s);assert.equal(s.route,'battery');
}
{
 const s=make();s.energy=0;pull(s);moveTo(s,'reel');assert.ok(interact(s,'reel').ok);
 assert.ok(connect(s,'mains','latch').ok);tick(s,1);assert.ok(s.door);near(s.energy,0);
 assert.equal(connect(s,'mains','lamp').ok,false,'One long cable, no duplicated resource');
 moveTo(s,'receipt');interact(s,'receipt');exit(s);assert.equal(s.route,'mains');
}
{
 const s=make();pull(s);moveTo(s,'lamp');
 assert.ok(connect(s,'battery','lamp').ok);assert.ok(connect(s,'battery','radio').ok);
 const before=snapshot(s);assert.match(measure(s,'lamp'),/۱۲/);assert.deepEqual(snapshot(s),before,'Meter is read-only');
 tick(s,2);assert.ok(s.secret);near(s.energy,60);
 tick(s,10);near(s.energy,0);assert.equal(s.door,false);
 disconnect(s,'battery');moveTo(s,'mains');assert.ok(connect(s,'mains','battery').ok);
 tick(s,3);near(s.energy,72);assert.equal(connect(s,'battery','lamp').ok,false,'No charge/discharge shortcut');
 disconnect(s,'battery');moveTo(s,'latch');connect(s,'battery','latch');tick(s,1);assert.ok(s.door);
}
{
 for(const dt of [.01,.25,3]){
  const s=make();pull(s);moveTo(s,'latch');connect(s,'battery','latch');
  for(let t=0;t<3-1e-7;t+=dt)tick(s,dt);
  near(s.energy,66);assert.ok(s.door,'Time-step independent latch');
 }
 const s=make();pull(s);moveTo(s,'latch');s.energy=3;
 connect(s,'battery','latch');tick(s,1);assert.equal(s.door,false);near(s.energy,0);
 disconnect(s,'battery');moveTo(s,'mains');connect(s,'mains','battery');tick(s,3);
 disconnect(s,'battery');moveTo(s,'latch');connect(s,'battery','latch');tick(s,1);assert.ok(s.door);
}
{
 const s=make();pull(s);moveTo(s,'lamp');connect(s,'battery','lamp');
 const before={...s.player};
 for(let i=0;i<100;i++)movePlayer(s,-.1,0);
 assert.ok(Math.hypot(s.player.x-4.1,s.player.z-1.35)<=2.65+1e-8,'Cable constrains walking');
 disconnect(s,'lamp');assert.ok(findPath(s.player,walkPoint('latch',s),s).length);
 assert.notDeepEqual(s.player,before);
}
{
 const s=make();pull(s);moveTo(s,'reel');interact(s,'reel');moveTo(s,'receipt');interact(s,'receipt');
 connect(s,'mains','latch');tick(s,1);
 const restored=restoreState(snapshot(s));assert.equal(restored.door,true);assert.equal(restored.receipt,true);
 assert.equal(restored.connections.latch,'mains');assert.ok(walkable(restored.player,restored));
 resetObjects(restored);assert.equal(restored.reel,true);assert.equal(restored.receipt,true);assert.equal(restored.door,true);
 assert.deepEqual(restored.connections,{lamp:null,radio:null,latch:null});assert.ok(walkable(restored.player,restored));
 assert.equal(restoreState({version:1,energy:-10,completed:true,player:{x:NaN,z:999}}).completed,false);
 assert.deepEqual(restoreState({version:999}),freshState());
}
console.log('PASS: workshop physical route, both complete solutions, exact energy, secret, recharge recovery, cable tether, read-only meter and checkpoint restoration.');
