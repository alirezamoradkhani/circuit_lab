import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {WorldCircuit} from '../src/campaign/ray-city/WorldCircuit.js';
import {routeTracks} from '../src/campaign/ray-city/WorldRoutes.js';
import {missionDevices} from '../src/campaign/ray-city/devices.js';
const fresh=i=>{const s=new AdventureSession(i);return new WorldCircuit(s,missionDevices(s));};
function act(w,id,label){const d=w.parts.find(d=>d.id===id);const option=w.options(d).find(o=>o.label===label);assert.ok(option,id+' '+label);option.run();}
for(let i=0;i<12;i++){
 const w=fresh(i),ts=w.terminals();assert.equal(ts.length,w.s.board.parts.length*2);assert.equal(new Set(ts.map(t=>t.pin)).size,ts.length);
 const routes=routeTracks(w.s.board,w.parts,ts);assert.equal(routes.length,w.s.board.wires.length);
 for(const r of routes){assert.deepEqual(r.points[0],ts.find(t=>t.pin===r.pair[0]).position);assert.deepEqual(r.points.at(-1),ts.find(t=>t.pin===r.pair[1]).position);for(let n=1;n<r.points.length;n++)assert.ok(Math.abs(r.points[n].x-r.points[n-1].x)<1e-8||Math.abs(r.points[n].z-r.points[n-1].z)<1e-8,'orthogonal trace');}
}
const g=fresh(0);const before=g.s.board.wires.length;g.connect('p3:1');assert.equal(g.s.board.wires.length,before,'draft does not mutate');g.connect('p1:1');assert.equal(g.s.board.wires.length,before+1);g.routes=routeTracks(g.s.board,g.parts,g.terminals());g.selected='wire:2';g.disconnect();assert.equal(g.s.board.wires.length,before);g.connect('p3:1');g.connect('p1:1');assert.equal(g.s.test(),true);
const shop=fresh(1);act(shop,'p2','باز کردن کلید');act(shop,'p3','خارج کردن مقاومت');act(shop,'p3','24 Ω · 25 اعتبار');act(shop,'p2','بستن کلید');assert.equal(shop.s.test(),true);
const clinic=fresh(3);assert.equal(clinic.parts.length,6);act(clinic,'p6','خاموش کردن');act(clinic,'p4','روشن کردن');act(clinic,'p5','روشن کردن');assert.equal(clinic.s.test(),true);
const backup=fresh(5);assert.equal(backup.options(backup.parts[0]).length,0);act(backup,'p6','خاموش');act(backup,'p4','دور زیاد');act(backup,'p5','روشن / دور کم');assert.equal(backup.s.test(),false);act(backup,'p4','روشن / دور کم');assert.equal(backup.s.test(),true);
const radio=fresh(7);act(radio,'p3','24 Ω');act(radio,'p4','12 Ω');assert.equal(radio.s.test(),false);act(radio,'p3','12 Ω');assert.equal(radio.s.test(),true);
const bridge=fresh(11);assert.equal(bridge.options(bridge.parts.find(d=>d.id==='p5')).length,0);act(bridge,'p6','200 Ω');assert.equal(bridge.s.test(),true);
const station=fresh(4);station.routes=routeTracks(station.s.board,station.parts,station.terminals());const bypass=station.s.board.wires.findIndex(pair=>pair.includes('p2:0')&&pair.includes('p2:1'));station.selected='wire:'+bypass;station.disconnect();act(station,'p3','12 Ω · 15 اعتبار');assert.equal(station.s.test(),true);
const street=fresh(2);act(street,'p4','لامپ جایگزین · ۵ اعتبار');act(street,'p6','برداشتن اتصال فرسوده · ۳ اعتبار');street.connect('p2:1');street.connect('p5:0');assert.equal(street.s.test(),false);act(street,'p3','قطع شاخه');assert.equal(street.s.test(),false);act(street,'p3','وصل شاخه');assert.equal(street.s.test(),true);
const pumps=fresh(6);act(pumps,'p5','خاموش');act(pumps,'p3','روشن / دور کم');act(pumps,'p4','روشن / دور کم');act(pumps,'p5','روشن / دور کم');assert.equal(pumps.s.test(),false);assert.equal(pumps.s.test(),true);
const feeder=fresh(8);act(feeder,'p2','قطع');act(feeder,'p3','۰٫۵ Ω · ۱۲ اعتبار');act(feeder,'p2','وصل');assert.equal(feeder.s.test(),true);
const isolation=fresh(9);act(isolation,'p5','قطع شاخه');act(isolation,'p5','تعویض طبق پلاک');act(isolation,'p5','وصل شاخه');assert.equal(isolation.s.test(),true);
const transfer=fresh(10);act(transfer,'p4','روشن');assert.equal(transfer.s.test(),false);act(transfer,'p1','قطع');act(transfer,'p5','خاموش');act(transfer,'p1','باتری');assert.equal(transfer.s.test(),true);
for(let i=0;i<12;i++){const w=fresh(i),before=w.s.board.snapshot();w.selected='part:p3';w.measure();assert.equal(w.s.board.snapshot(),before,'meter is read-only');assert.ok(w.hint());assert.ok(w.hintTarget);}
console.log('PASS all 12 physical layouts: exact terminal mapping, orthogonal routes, safe drafts, selected-wire removal and complete repairs through world controls.');
