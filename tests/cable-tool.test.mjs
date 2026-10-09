import test from 'node:test';
import assert from 'node:assert/strict';
import {CableTool} from '../src/campaign/engine/CableTool.js';
import {CampaignSession} from '../src/campaign/levels/runtime/CampaignSession.js';
import market from '../src/campaign/levels/03-market.js';
const setup=()=>{const s=new CampaignSession(market());return {w:s.world,t:new CableTool(s.world)};};
test('draft and cancellation never mutate a circuit',()=>{
 const {w,t}=setup(),before=w.snapshot();assert.equal(t.begin('supply'),true);assert.equal(t.assess('fan').ok,true);assert.deepEqual(w.snapshot(),before);t.cancel();assert.equal(t.start,null);assert.deepEqual(w.snapshot(),before);
});
test('both wiring orders work; duplicate connection is idempotent and invalid target retains draft',()=>{
 const {w,t}=setup();t.begin('fan');assert.equal(t.commit('sign').ok,false);assert.equal(t.start,'fan');assert.equal(t.commit('supply').ok,true);assert.equal(w.connections.get('fan').source,'supply');
 t.begin('supply');assert.equal(t.commit('fan').existing,true);assert.equal(w.connections.get('fan').source,'supply');
 t.begin('battery');assert.equal(t.commit('fan').replacing,true);assert.equal(w.connections.get('fan').source,'battery');assert.equal(t.start,null);
});
test('cannot wire a source to itself, another source, scenery or its own charger',()=>{
 const {w,t}=setup();assert.equal(t.begin('vendor'),false);t.begin('supply');for(const id of ['supply','battery','vendor'])assert.equal(t.assess(id).ok,false);
 t.begin('battery');assert.equal(t.assess('charger').ok,false);w.get('fan').state.visible=false;assert.equal(t.assess('fan').ok,false);
});
