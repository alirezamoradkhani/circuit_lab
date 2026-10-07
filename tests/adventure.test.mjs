import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {measureCircuit} from '../src/city/CircuitMeter.js';
import {CityProgress} from '../src/city/Progress.js';

const gate=new AdventureSession(0);
assert.equal(gate.current,0,'broken return carries no current');
assert.equal(gate.test(),false);
gate.pin('p3:1');gate.pin('p1:1');assert.equal(gate.test(),true);
assert.equal(gate.current,1);assert.equal(gate.stars,2);
const snapshot=gate.board.snapshot();gate.removeWire(0);assert.equal(gate.board.snapshot(),snapshot,'won repair is immutable');

const shop=new AdventureSession(1);
assert.ok(Math.abs(shop.current-.8)<1e-9);assert.equal(shop.test(),false);assert.equal(shop.tripped,true);
shop.install(24);assert.equal(shop.test(),false,'tripped protector must be reset');
shop.resetFuse();assert.equal(shop.test(),true);assert.equal(shop.spent,25);
assert.equal(shop.stars,2);
const broke=new AdventureSession(1);broke.install(36);broke.install(24);
const resistance=broke.board.parts.find(p=>p.type==='resistor').value;
broke.install(12);assert.equal(broke.board.parts.find(p=>p.type==='resistor').value,resistance,'cannot spend unavailable credit');assert.equal(broke.credits,5);

const street=new AdventureSession(2);
assert.ok(Math.abs(street.current-1/3)<1e-9);
assert.deepEqual(Object.values(measureCircuit(street.board).volts).map(v=>Math.round(v)),[4,4,4]);
while(street.board.wires.length)street.removeWire(0);
street.pin('p1:0');street.pin('p2:0');
for(const p of ['p3','p4','p5']){street.pin('p2:1');street.pin(p+':0');street.pin(p+':1');street.pin('p1:1');}
assert.equal(street.test(),true);assert.equal(street.current,3);assert.equal(street.credits,16);
const short=new AdventureSession(0);short.pin('p2:1');short.pin('p1:1');assert.equal(measureCircuit(short.board).short,true);assert.equal(short.test(),false);assert.equal(short.tripped,true);
short.removeWire(short.board.wires.length-1);short.resetFuse();assert.equal(short.current,0);

const clinic=new AdventureSession(3);
assert.equal(clinic.power,18);assert.equal(clinic.test(),false,'capacity alone is not enough; essential loads must run');
clinic.toggleLoad(1);assert.equal(clinic.test(),false);assert.equal(clinic.tripped,true);
clinic.toggleLoad(3);clinic.toggleLoad(2);clinic.resetFuse();assert.equal(clinic.power,18);assert.equal(clinic.test(),true);

const station=new AdventureSession(4);
station.toggleSwitch();assert.ok(Math.abs(station.current-.8)<1e-9,'bypass defeats open switch');
station.install(12);assert.equal(station.test(),false,'resistance alone cannot fix a bypass');
station.removeWire(station.board.wires.length-1);assert.equal(station.current,0,'removing bypass restores switch control');
station.toggleSwitch();assert.equal(station.current,.5);assert.equal(station.test(),true);
const observations=new AdventureSession(0);observations.tool='meter';observations.inspect('source');observations.inspect('source');assert.equal(observations.notes.length,1);
const store=new Map([['circuit-lab.city.v1',JSON.stringify({gate:3})]]);
const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
const progress=new CityProgress(storage,'circuit-lab.adventure.v1');assert.equal(progress.unlocked(1),false,'new game does not inherit old circuit-only victories');
progress.complete('gate',0);assert.equal(new CityProgress(storage,'circuit-lab.adventure.v1').unlocked(1),true);
console.log('PASS: five adventure repairs, DC measurements, fuse recovery, resource limits, essential loads, immutable victory and separate progress.');
