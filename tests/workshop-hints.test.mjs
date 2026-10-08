import assert from 'node:assert/strict';
import {freshState,tick} from '../src/campaign/workshop/state.js';
import {workshopHint,HintProgress} from '../src/campaign/workshop/hints.js';
import {InteractionController} from '../src/campaign/workshop/InteractionController.js';
import {workshopHelp} from '../src/campaign/ui/help.js';
const make=changes=>Object.assign(freshState(),{started:true,cart:1},changes);
const cases=[
 [{started:false},'begin'],
 [{completed:true},'complete'],
 [{cart:.5,pushing:true},'pushing'],
 [{cart:0},'cart'],
 [{cart:0,connections:{lamp:'battery',radio:null,latch:null}},'cart-tether'],
 [{charging:true,energy:2},'charging'],
 [{charging:true,energy:72},'charged'],
 [{connections:{lamp:'battery',radio:null,latch:null}},'loads-tether'],
 [{energy:0},'low-battery'],
 [{energy:0,reel:true},'low-with-reel'],
 [{energy:0,reel:true,connections:{lamp:'mains',radio:null,latch:null}},'mains-occupied'],
 [{},'latch'],
 [{reel:true},'latch-with-reel'],
 [{energy:6,connections:{lamp:null,radio:null,latch:'battery'}},'latch-powered'],
 [{energy:0,reel:true,connections:{lamp:null,radio:null,latch:'mains'}},'latch-powered'],
 [{energy:2,latchTime:.8,connections:{lamp:null,radio:null,latch:'battery'}},'latch-powered'],
 [{energy:2,latchTime:.2,connections:{lamp:null,radio:null,latch:'battery'}},'low-battery'],
 [{door:true,energy:0,connections:{lamp:null,radio:null,latch:'battery'}},'door-tether'],
 [{door:true,receipt:true,charging:true},'door-tether'],
 [{door:true},'receipt'],
 [{door:true,receipt:true,connections:{lamp:null,radio:null,latch:'mains'}},'exit']
];
for(const [changes,key] of cases){
 const s=make(changes),before=structuredClone(s),h=workshopHint(s);
 assert.equal(h.key,key);assert.ok(h.steps.length);assert.ok(workshopHelp(s,true).includes(h.clue));
 assert.deepEqual(s,before,'Advice is read-only: '+key);
}
const progress=new HintProgress(),s=make({cart:0});
assert.equal(progress.next(s),workshopHint(s).clue);
assert.equal(progress.next(s),workshopHint(s).steps[0]);
s.cart=1;assert.equal(progress.next(s),workshopHint(s).clue,'New obstacle starts with gentle hint');
progress.next(s);progress.reset();
assert.equal(progress.next(s),workshopHint(s).clue,'Restart resets hint progression');
const game={state:s,hud:{message(text){assert.ok(text);}}};
const controller=new InteractionController(game);
controller.tool='cable';controller.selected='battery';
const before=structuredClone(s);controller.hint();controller.hint();
assert.equal(controller.selected,'battery','Hint must preserve first cable endpoint');
assert.equal(controller.tool,'cable');assert.deepEqual(s,before);
const powered=make({energy:6,connections:{lamp:null,radio:null,latch:'battery'}});
assert.equal(workshopHint(powered).key,'latch-powered');tick(powered,1);
assert.equal(powered.door,true,'Wait advice actually opens latch with exact minimum charge');
assert.equal(workshopHint(powered).key,'door-tether');
assert.match(workshopHelp(s,false),/در دسترس نیست/);
console.log('PASS contextual help: 21 puzzle states, minimum energy, progressive hints, reset and read-only cable selection.');
