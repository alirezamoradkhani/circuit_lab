import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {adventures} from '../src/city/adventureData.js';
import {CityProgress} from '../src/city/Progress.js';
import {measurePart} from '../src/city/ComponentMeter.js';
import {renderAdventure} from '../src/city/AdventureView.js';
import {renderTown} from '../src/city/scene.js';
const create=id=>new AdventureSession(adventures.findIndex(m=>m.id===id));

const backup=create('backup'),c=backup.challenge;
assert.equal(backup.test(),false,'initial loads omit essential services');
c.act('1',2);c.act('2',1);assert.equal(c.power,30);assert.equal(backup.test(),false);assert.equal(backup.tripped,true);
c.act('3',0);assert.equal(backup.test(),false,'protector needs explicit reset');backup.resetFuse();
const mistakes=backup.mistakes;assert.equal(backup.test(),false);assert.equal(c.phase,1);assert.equal(c.capacity,12);assert.equal(backup.mistakes,mistakes,'phase transition is not a failure');
assert.equal(backup.test(),false,'18 W cannot run from 12 W backup');backup.resetFuse();c.act('1',1);
assert.equal(c.power,12);assert.equal(backup.current,1);assert.equal(backup.test(),true);
c.act('0',0);assert.equal(c.states[0],1,'won state is immutable');
const noFan=create('backup');noFan.challenge.act('3',0);noFan.challenge.act('2',1);assert.equal(noFan.test(),false,'cutting an essential fan is not accepted');

const pumps=create('pumps'),p=pumps.challenge;
assert.equal(pumps.test(),false);p.act('0',1);assert.equal(p.lastPeak,21);assert.equal(p.power,9);
p.act('1',1);assert.equal(p.lastPeak,27);assert.equal(pumps.tripped,true);assert.deepEqual(p.states,[0,0,1]);
p.act('0',1);assert.equal(p.states[0],0,'tripped motors cannot start');
p.act('2',0);pumps.resetFuse();p.act('0',1);p.act('1',1);assert.equal(p.lastPeak,24);assert.equal(p.power,12);
assert.equal(pumps.test(),false);assert.equal(p.tank,2);assert.equal(pumps.test(),false,'lights must return even with full tank');
p.act('2',1);assert.equal(pumps.current,1.25);assert.equal(pumps.test(),true);p.act('0',0);assert.equal(p.states[0],1);
const onePump=create('pumps');onePump.challenge.act('0',1);for(let i=0;i<5;i++)assert.equal(onePump.test(),false,'one pump alone cannot finish');

const radio=create('radio'),r=radio.challenge;
assert.equal(r.voltage,6);assert.equal(radio.test(),false);
r.act('top',24);assert.equal(r.voltage,4);assert.equal(radio.test(),false);assert.equal(r.phase,1);
assert.ok(Math.abs(r.voltage-2.4)<1e-9);assert.equal(radio.test(),false,'no-load success does not guarantee loaded success');
r.act('top',12);assert.equal(r.voltage,4);assert.ok(Math.abs(measurePart(radio,r.receiver.id).current-1/3)<1e-9);assert.equal(radio.test(),true);assert.equal(radio.spent,4);
const value=r.top.value;r.act('top',48);assert.equal(r.top.value,value);
const poor=create('radio');poor.credits=0;poor.challenge.act('top',24);assert.equal(poor.challenge.top.value,12);poor.challenge.act('wrong',24);poor.challenge.act('top',NaN);assert.equal(poor.spent,0);
const alternative=create('radio');alternative.challenge.act('top',12);alternative.challenge.act('bottom',6);assert.equal(alternative.test(),false);assert.equal(alternative.challenge.phase,1);alternative.challenge.act('bottom',12);assert.equal(alternative.test(),true,'alternative valid tuning route');

for(const id of ['backup','pumps','radio']){
 const s=create(id);assert.equal(s.won,false);s.challenge.act('99',999);s.panel=true;s.tool='meter';
 const html=renderAdventure(s);assert.ok(!html.includes('undefined'));assert.ok(!html.includes('NaN'));assert.ok(html.includes('data-challenge='));assert.ok(html.includes('data-measure-part='));
 s.circuitExpanded=true;assert.ok(renderAdventure(s).includes('circuit-dialog'));
}
const old=Object.fromEntries(adventures.slice(0,5).map(m=>[m.id,3]));let saved=JSON.stringify(old);
const storage={getItem:()=>saved,setItem:(_,v)=>saved=v};const progress=new CityProgress(storage,'circuit-lab.adventure.v1',adventures);
assert.deepEqual(progress.stars,old);assert.equal(progress.unlocked(5),true);assert.equal(progress.unlocked(6),false);
progress.complete('backup',0);assert.equal(progress.unlocked(6),true);progress.complete('pumps',1);assert.equal(progress.unlocked(7),true);progress.complete('radio',0);
assert.equal(Object.keys(new CityProgress(storage,'circuit-lab.adventure.v1',adventures).stars).length,8);
const town=renderTown(adventures,progress,7);assert.ok(town.includes('expanded-town'));assert.ok(!town.includes('undefined'));assert.equal((town.match(/data-mission=/g)||[]).length,8);
console.log('PASS: three distinct challenges, phase transitions, overload recovery, startup sequence, loaded divider, alternative solution and old-save compatibility.');
