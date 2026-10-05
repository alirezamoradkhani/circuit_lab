import assert from 'node:assert/strict';
import {Board,evaluate,missions} from '../src/builder/Board.js';
function series(m){const b=new Board();for(const [type,count] of Object.entries(m.parts))for(let i=0;i<count;i++)b.add(type);b.parts.find(p=>p.type==='switch').closed=true;for(let i=0;i<b.parts.length;i++)b.connect(b.parts[i].id+':1',b.parts[(i+1)%b.parts.length].id+':0');return b;}
for(const m of missions.slice(0,3)){const b=series(m);assert.equal(evaluate(b,m).ok,true,m.id);b.wires.pop();assert.equal(evaluate(b,m).ok,false,'open loop');}
const m=missions[3],b=new Board();const battery=b.add('battery'),sw=b.add('switch'),l1=b.add('lamp'),l2=b.add('lamp');sw.closed=true;
b.connect(battery.id+':0',sw.id+':0');for(const l of [l1,l2]){b.connect(sw.id+':1',l.id+':0');b.connect(l.id+':1',battery.id+':1');}
assert.equal(evaluate(b,m).ok,true,'parallel');assert.equal(evaluate(b,missions[2]).ok,false,'parallel is not series');
sw.closed=false;assert.equal(evaluate(b,m).ok,false,'open switch');sw.closed=true;
const save=b.snapshot();b.wires.push([battery.id+':0',battery.id+':1']);assert.equal(evaluate(b,m).ok,false,'short');b.restore(save);
b.wires.push([sw.id+':0',sw.id+':1']);assert.equal(evaluate(b,m).ok,false,'bypassed switch');b.restore(save);
b.parts[2].x+=200;b.parts[2].rotation=90;assert.equal(evaluate(b,m).ok,true,'geometry does not change wiring');
assert.equal(b.connect(battery.id+':0',battery.id+':0'),false);assert.equal(b.connect(battery.id+':0',sw.id+':0'),false);
b.remove(l1.id);assert.equal(b.wires.some(w=>w.some(t=>t.startsWith(l1.id+':'))),false);assert.equal(evaluate(b,m).ok,false,'deleted load');
const current=series(missions[1]);current.parts.find(p=>p.type==='resistor').value=6;assert.equal(evaluate(current,missions[1]).ok,false,'wrong current');
console.log('PASS: four mission solutions, open wires, short circuit, bypassed/open switch, topology mismatch, move/rotation, duplicates, deletion, current target.');

import {wirePath} from '../src/builder/wirePath.js';
const routeBoard=series(missions[0]);
routeBoard.parts.forEach((p,i)=>{p.x=190+i*235;p.y=140;});
const endpoint=id=>{const [idp,n]=id.split(':');const p=routeBoard.parts.find(x=>x.id===idp);return {x:p.x+(n==='0'?-60:60),y:p.y};};
const occupied=new Set();
for(const [a,b] of routeBoard.wires){const d=wirePath(routeBoard,a,b,endpoint,occupied);assert.ok(d.startsWith('M'));assert.ok(!d.includes('NaN'));assert.ok(d.endsWith(`${endpoint(b).x} ${endpoint(b).y}`));}
console.log('PASS: routed wires retain their terminal endpoints.');
