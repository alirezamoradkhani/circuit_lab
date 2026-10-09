import assert from 'node:assert/strict';
import {layoutHotspots} from '../src/campaign/ui/HotspotLayout.js';
import {CampaignSession} from '../src/campaign/levels/runtime/CampaignSession.js';
import {loadDefinition} from '../src/campaign/levels/catalog.js';
for(const [width,height,count] of [[390,404,18],[844,176,18],[1440,600,24]]){
 const input=Array.from({length:count},(_,i)=>({id:String(i),x:i%2?width+10:-10,y:height/2,priority:i===0?3:0}));
 const boxes=layoutHotspots(input,width,height,[{x:12,y:height-98,w:94,h:88}]);assert.equal(boxes.length,count,'Every dense-scene target remains available');
 for(let i=0;i<boxes.length;i++){const a=boxes[i];assert.ok(a.x>=23&&a.x<=width-23&&a.y>=23&&a.y<=height-23);for(const b of boxes.slice(i+1))assert.ok(Math.abs(a.x-b.x)>=50||Math.abs(a.y-b.y)>=50,'Touch targets overlap');}
}
for(const n of [2,3,4]){
 const s=new CampaignSession(await loadDefinition(n)),w=s.world,a=w.get('supply').state.position,b=w.get('charger').state.position;assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>1.1,'Power cabinet and charging cradle must be separated');
 const old=s.snapshot(),charger=old.world.entities.find(e=>e.id==='charger'),battery=old.world.entities.find(e=>e.id==='battery');charger.state.position={...a};battery.state.position={x:1,y:0,z:2};battery.state.holder=null;
 s.restore(old);assert.deepEqual(w.get('charger').state.position,b);assert.deepEqual(w.get('battery').state.position,battery.state.position,'Movable puzzle objects retain the saved location');
}
console.log('PASS readable layouts: crowded edge targets, safe touch spacing, separated equipment and legacy-save placement migration.');
