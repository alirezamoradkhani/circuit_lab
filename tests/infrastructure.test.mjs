import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {adventures} from '../src/city/adventureData.js';
import {measurePart} from '../src/city/ComponentMeter.js';
import {CityProgress} from '../src/city/Progress.js';
const make=id=>new AdventureSession(adventures.findIndex(m=>m.id===id));
assert.equal(adventures.length,12);
for(const id of ['feeder','isolation','transfer','bridge']){const s=make(id);assert.equal(s.test(),false,id+' starts unsolved');const before=s.board.snapshot();s.challenge.act('invalid','wrong');assert.equal(s.board.snapshot(),before);}
const f=make('feeder'),c=f.challenge;c.act('cable',.5);assert.equal(c.line.value,3,'cannot change a live cable');c.act('main',0);c.act('cable',.5);assert.equal(f.credits,0);assert.equal(f.test(),false,'power must be restored');c.act('main',1);assert.ok(Math.abs(c.voltage-12*8/8.5)<1e-9);assert.equal(f.test(),true);c.act('main',0);assert.equal(c.main.closed,true,'won state immutable');
const cheap=make('feeder');cheap.challenge.act('main',0);cheap.challenge.act('cable',1);cheap.challenge.act('main',1);assert.equal(cheap.test(),false,'cheap cable fails at full load');cheap.challenge.act('main',0);cheap.challenge.act('cable',.5);assert.equal(cheap.challenge.line.value,1,'cannot overspend');
const i=make('isolation'),ic=i.challenge;assert.equal(measurePart(i,ic.parts[2].id).current,24);ic.act('repair',2);assert.equal(ic.repaired,false);assert.equal(i.test(),false);assert.equal(i.tripped,true);ic.act('2',0);ic.act('repair',2);i.resetFuse();assert.equal(i.test(),false,'all services must return');ic.act('2',1);assert.equal(ic.power,24);assert.equal(i.test(),true);
const t=make('transfer'),tc=t.challenge;tc.act('source','battery');assert.equal(tc.selector,'grid','break before make interlock');tc.act('1',1);assert.equal(t.test(),false);assert.equal(tc.phase,1);assert.equal(tc.source.value,0,'grid outage is real');tc.act('source','off');tc.act('source','battery');assert.equal(t.test(),false,'battery overloaded');tc.act('2',0);t.resetFuse();assert.equal(t.test(),true);assert.equal(tc.power,9);
const b=make('bridge'),bc=b.challenge;bc.act('main',0);assert.equal(b.test(),false,'zero signal from an unpowered sensor is not calibration');bc.act('main',1);bc.act('trim',150);assert.equal(b.test(),false);bc.act('trim',200);assert.ok(measurePart(b,bc.sensor.id).voltage<1e-10);assert.equal(b.test(),true);
const p=new CityProgress(null,'test',adventures,{openAccess:true});assert.equal(p.unlocked(11),true);assert.equal(p.unlocked(12),false);assert.equal(p.unlocked(-1),false);
console.log('PASS 4 distinct infrastructure missions: real DC readings, live-edit rejection, budget, fault recovery, interlock/outage, bridge calibration and immutable completion.');

