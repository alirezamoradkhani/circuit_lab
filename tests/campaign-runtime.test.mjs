import assert from 'node:assert/strict';
import {campaignCatalog,loadDefinition} from '../src/campaign/levels/catalog.js';
import {CampaignSession} from '../src/campaign/levels/runtime/CampaignSession.js';
import {equipmentStatus} from '../src/campaign/ui/CampaignHUD.js';
import {freshState,restoreState,snapshot,tick} from '../src/campaign/workshop/state.js';
import {workshopHint} from '../src/campaign/workshop/hints.js';

// Level 1 retains its legacy save format; levels 2–12 use ComponentLevel.
assert.equal(campaignCatalog.length,12);
assert.deepEqual(campaignCatalog.map(x=>x.number),Array.from({length:12},(_,i)=>i+1));
assert.equal(new Set(campaignCatalog.map(x=>x.id)).size,12);
await assert.rejects(loadDefinition(0));
await assert.rejects(loadDefinition(13));
{
 const s=freshState(),before=snapshot(s);assert.equal(s.completed,false);tick(s,2);assert.deepEqual(snapshot(s),before);
 assert.deepEqual(restoreState(snapshot(s)),s);
 const h=workshopHint(s);assert.ok(h);
 s.started=true;s.cart=1;s.door=true;s.latchTime=1;s.receipt=true;tick(s,.1);assert.equal(s.completed,false);
 s.player={x:2.35,z:-4.2};tick(s,.1);assert.equal(s.completed,true);
 assert.deepEqual(restoreState(snapshot(s)),s);
}
let objectsChecked=0,commandsChecked=0;
for(const entry of campaignCatalog.filter(x=>x.number>1)){
 const definition=await loadDefinition(entry.number),messages=[],session=new CampaignSession(definition,(text,tone)=>messages.push({text,tone}));
 const context=entry.id;
 assert.equal(definition.id,entry.id);assert.equal(definition.number,entry.number);
 assert.equal(session.started,false,context);assert.equal(session.completed,false,context);assert.equal(definition.ready(session.world,session.ctx),false,context+' opens solved');
 assert.ok(session.ray);assert.ok(session.world.get('battery'));assert.ok(session.world.get('exit'));
 assert.ok(session.navigation.walkable(definition.start,{}),context+' spawn is blocked');
 const initial=session.snapshot();session.update(2);assert.deepEqual(session.snapshot(),initial,context+' advances before intro is dismissed');
 function inspect(){
  const before=session.snapshot(),h=session.hint();
  for(const key of ['key','title','reason','clue'])assert.equal(typeof h[key],'string',context+' missing hint '+key);
  assert.ok(h.key.length&&h.title.length&&h.clue.length);assert.ok(Array.isArray(h.steps)&&h.steps.every(x=>typeof x==='string'));
  assert.equal(typeof session.objective(),'string');assert.ok(session.objective().length);
  for(const e of session.world.all()){
   objectsChecked++;assert.ok(e.config.label,context+'/'+e.id+' missing label');
   assert.ok(['x','y','z'].every(k=>Number.isFinite(e.state.position[k])),context+'/'+e.id+' invalid position');
   const commands=session.commands(e.id);assert.ok(Array.isArray(commands),context+'/'+e.id);
   assert.equal(new Set(commands.map(x=>x.id)).size,commands.length,context+'/'+e.id+' duplicate command ids');
   for(const c of commands){commandsChecked++;assert.equal(typeof c.id,'string');assert.ok(c.id);assert.equal(typeof c.label,'string');assert.ok(c.label);assert.equal(typeof c.run,'function');}
   assert.doesNotThrow(()=>equipmentStatus(e,session.world),context+'/'+e.id+' status or meter crashes');
  }
  assert.deepEqual(session.snapshot(),before,context+' reading hints, commands or meters mutates state');
 }
 inspect();session.started=true;session.update(.25);inspect();
 const running=session.snapshot(),restored=new CampaignSession(await loadDefinition(entry.number));restored.restore(running);
 assert.deepEqual(restored.snapshot(),running,context+' save/load loses state');assert.equal(restored.ctx.flags,restored.flags);
 session.paused=true;const paused=session.snapshot();session.update(30);assert.deepEqual(session.snapshot(),paused,context+' simulation advances while dialog paused');session.paused=false;
 session.completed=true;const completed=session.snapshot();session.update(30);assert.deepEqual(session.snapshot(),completed,context+' finished stage keeps advancing');session.completed=false;
 assert.equal(session.execute('not-an-object','not-an-action'),false);assert.equal(session.execute('battery','not-an-action'),false);
 // Isolate the common exit gate from each level's own puzzle solver. This is intentionally
 // an injected predicate, not a claim that any real puzzle can be solved by setting a flag.
 const gateDefinition=await loadDefinition(entry.number);gateDefinition.ready=()=>true;gateDefinition.update=undefined;
 const gate=new CampaignSession(gateDefinition);gate.started=true;gate.update(.05);
 assert.equal(gate.completed,false,context+' ready predicate finishes remotely');
 gate.ray.state.position={...gateDefinition.exit};const events=gate.update(.05);
 assert.equal(gate.completed,true,context+' physical exit does not complete');assert.ok(events.some(e=>e.type==='stage-complete'));
 assert.equal(gate.update(.1).length,0,context+' completion repeats');
 const clone=new CampaignSession(await loadDefinition(entry.number));assert.equal(clone.completed,false);assert.equal(clone.definition.ready(clone.world,clone.ctx),false,context+' instance state leaked');
 console.log(context+': runtime contracts passed');
}
console.log(`All 12 campaign entries covered; ${objectsChecked} status reads and ${commandsChecked} command contracts checked.`);
// Charging is a physical interaction, including when the battery is carried above ground.
{
 const make=async()=>{const s=new CampaignSession(await loadDefinition(6));s.started=true;s.world.get('battery').state.energy=0;return s;};
 const far=await make(),before=far.snapshot();far.charge();assert.deepEqual(far.snapshot(),before,'Remote charging must leave energy, charging flag and wires unchanged');
 const high=await make(),charger=high.world.get('charger');high.ray.state.position={...charger.state.position,y:3};const elevated=high.snapshot();high.charge();assert.deepEqual(high.snapshot(),elevated,'Battery held above the charger cannot charge through floors');
 const near=await make();near.ray.state.position={...near.world.get('charger').state.position};near.charge();assert.equal(near.world.get('battery').state.charging,true);assert.equal(near.world.connections.get('charger')?.source,'supply');near.update(.5);assert.equal(near.world.get('battery').state.energy,6);
 const leftBehind=await make();leftBehind.ray.state.position={...leftBehind.world.get('charger').state.position};leftBehind.world.get('battery').state.holder=null;leftBehind.world.get('battery').state.position={x:5,y:0,z:3};const detached=leftBehind.snapshot();leftBehind.charge();assert.deepEqual(leftBehind.snapshot(),detached,'Standing by charger cannot recharge a battery left across the room');
}
console.log('Charging integration: remote, elevated and abandoned batteries rejected; nearby carried battery charges.');
