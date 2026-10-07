import assert from 'node:assert/strict';
import {Board,evaluate} from '../src/builder/Board.js';
import {cityMissions,seedMission} from '../src/city/missions.js';
import {CityProgress} from '../src/city/Progress.js';
import {CircuitBuilder} from '../src/builder/CircuitBuilder.js';
const repair=(b,m)=>{
 const battery=b.parts.find(p=>p.type==='battery'),sw=b.parts.find(p=>p.type==='switch');
 const loads=b.parts.filter(p=>['lamp','resistor'].includes(p.type));
 if(m.id==='gate') b.connect(loads[0].id+':1',battery.id+':1');
 if(m.id==='shop')loads[0].value=24;
 if(m.topology==='parallel'){
   b.wires=[];b.connect(battery.id+':0',sw.id+':0');
   for(const p of loads){b.connect(sw.id+':1',p.id+':0');b.connect(p.id+':1',battery.id+':1');if(m.id==='clinic')p.value=24;}
 }
 if(m.id==='station'){
   b.wires=b.wires.filter(w=>!w.every(t=>t.startsWith(sw.id+':')));loads[0].value=12;
 }
};
for(const m of cityMissions){
 const b=new Board();seedMission(b,m);
 assert.equal(evaluate(b,m).ok,false,`${m.id} starts broken`);
 repair(b,m);assert.equal(evaluate(b,m).ok,true,`${m.id} has a reachable solution`);
 b.parts.find(p=>p.type==='battery').value=6;
 assert.equal(evaluate(b,m).ok,false,`${m.id} cannot bypass fixed source`);
}
const clinic=cityMissions[3],board=new Board();seedMission(board,clinic);repair(board,clinic);
const station=new Board();seedMission(station,cityMissions[4]);
station.parts.find(p=>p.type==='resistor').value=12;
assert.equal(evaluate(station,cityMissions[4]).ok,false,'fixing resistance alone must not repair bypassed switch');
const loads=board.parts.filter(p=>p.type==='resistor');
loads[0].value=18;loads[1].value=30;assert.equal(evaluate(board,clinic).ok,true,'alternative clinic solution');
loads.forEach(p=>p.value=12);assert.equal(evaluate(board,clinic).ok,false,'reject overload');
loads.forEach(p=>p.value=60);assert.equal(evaluate(board,clinic).ok,false,'reject insufficient branch current');
let saved='{}';const storage={getItem:()=>saved,setItem:(key,value)=>{saved=value;}};
const progress=new CityProgress(storage);assert.equal(progress.unlocked(1),false);
progress.complete('gate',0);assert.equal(progress.unlocked(1),true);
progress.complete('gate',3);assert.equal(progress.stars.gate,3,'replay never lowers best stars');
assert.equal(new CityProgress(storage).stars.gate,3,'reload restores progress');
const corrupt=new CityProgress({getItem:()=>'{broken'});assert.deepEqual(corrupt.stars,{});
const denied=new CityProgress({getItem:()=>null,setItem(){throw Error('denied');}});
denied.complete('gate',2);assert.equal(denied.saved,false);assert.equal(denied.unlocked(1),true);
const editor=Object.create(CircuitBuilder.prototype);
Object.assign(editor,{board:new Board(),history:[],moves:0,onChange(){},render(){}});
const resistor=editor.board.add('resistor');resistor.value=3;
editor.inlineAction('resistor-up',resistor.id);assert.equal(resistor.value,6);
editor.action('undo');assert.equal(editor.board.parts[0].value,3,'undo captures value before inline edit');
console.log('PASS: five broken city missions, reachable repairs, multiple clinic solutions, load limits, progression, storage recovery and value undo.');
