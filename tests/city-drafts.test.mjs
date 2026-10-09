import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {adventures} from '../src/city/adventureData.js';
const make=id=>new AdventureSession(adventures.findIndex(m=>m.id===id));
import {CityDrafts} from '../src/city/CityDrafts.js';
let saved=null;const storage={getItem:()=>saved,setItem:(k,v)=>saved=v};
for(const id of adventures.map(m=>m.id)){
 const s=new CityDrafts(storage).attach(make(id),{fresh:true});s.inspect('source');s.hint();
 if(id==='feeder'){s.challenge.act('main',0);s.challenge.act('cable',.5);}
 if(id==='isolation'){s.challenge.act('2',0);s.challenge.act('repair',2);}
 if(id==='transfer'){s.challenge.act('1',1);s.test();s.challenge.act('source','off');}
 if(id==='bridge')s.challenge.act('trim',200);
 if(id==='street'){s.street.replace('p4');s.street.removeCable();s.pin('p2:1');s.pin('p5:0');}
 if(id==='shop'){s.toggleSwitch();s.shop.remove();s.install(24);}
 if(id==='radio'){s.challenge.act('top',24);s.test();}
 if(id==='pumps')s.challenge.act('0',1);
 const resumed=new CityDrafts(storage).attach(make(id));assert.equal(resumed.board.snapshot(),s.board.snapshot(),id+' board restored');assert.equal(resumed.credits,s.credits);assert.equal(resumed.hints,s.hints);assert.equal(resumed.spent,s.spent);assert.deepEqual(resumed.notes,s.notes);
 if(s.challenge)assert.equal(resumed.challenge.status,s.challenge.status,id+' live refs restored');
}
const bad=new CityDrafts({getItem:()=>JSON.stringify({version:1,logs:{feeder:[['session','constructor',[]]]}}),setItem(){}});assert.doesNotThrow(()=>bad.attach(make('feeder')));
console.log('PASS deterministic draft restoration across all 12 missions, including removed parts and multi-phase source state.');
