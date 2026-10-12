import assert from 'node:assert/strict';
import {freshState,tick,restoreState,snapshot} from '../src/campaign/workshop/state.js';
import {connect,disconnect} from '../src/campaign/workshop/actions.js';
import {freshRepair,editRepair,circuitReading,measureRepair,testRepair,repairReady,restoreRepair} from '../src/campaign/workshop/RepairCircuit.js';
const make=()=>({...freshState(),started:true,cart:1,reel:true,repair:freshRepair()});
const close=s=>editRepair(s,'switch');
const wire=s=>editRepair(s,'connect','lamp:1','source:1');
const prepare=s=>{wire(s);editRepair(s,'resistor',12);s.connections.latch='mains';};
{
 const s=make();s.connections.latch='mains';tick(s,2);assert.equal(s.door,false,'Old single cable must not solve repair');
 assert.equal(s.repair.accepted,false);assert.ok(wire(s).ok);close(s);tick(s,.1);
 assert.equal(s.repair.tripped,true,'Original 6 ohm resistor trips protection at 2/3 A');
 assert.equal(editRepair(s,'resistor',12).ok,false,'Live replacements are refused');
 assert.equal(s.door,false);
 close(s);assert.equal(editRepair(s,'reset-protector').ok,true);editRepair(s,'resistor',12);assert.equal(testRepair(s).ok,true,'Healthy open switch test');
 close(s);assert.ok(Math.abs(circuitReading(s).lampCurrent-.5)<1e-8);assert.equal(testRepair(s).ok,false,'Measurement proof needed');
 const before=JSON.stringify(s.repair.board);measureRepair(s,'lamp');assert.equal(JSON.stringify(s.repair.board),before,'Meter never edits board');
 assert.ok(testRepair(s).ok);assert.ok(repairReady(s));tick(s,1);assert.ok(s.door);
}
{
 const s=make();prepare(s);close(s);measureRepair(s,'lamp');assert.equal(testRepair(s).ok,false,'Need open switch proof');close(s);assert.equal(testRepair(s).ok,true);close(s);assert.equal(testRepair(s).ok,true);
 const value=snapshot(s);const restored=restoreRepair(value.repair);assert.equal(restored.accepted,true);assert.deepEqual(restored.board,s.repair.board);
}
{
 const s=make();prepare(s);assert.ok(editRepair(s,'connect','source:0','resistor:0').ok);assert.equal(testRepair(s).ok,false,'Bypassed switch is not a repair');
 assert.equal(editRepair(s,'connect','junk','lamp:1').ok,false,'Invalid terminals rejected');
}
{
 const s=make();prepare(s);editRepair(s,'connect','source:0','lamp:1');close(s);tick(s,.1);assert.equal(s.repair.tripped,true,'Short circuit trips protection');assert.equal(s.door,false);
}
{
 const s=make();prepare(s);testRepair(s);close(s);measureRepair(s,'lamp');testRepair(s);close(s);assert.ok(editRepair(s,'remove',3).ok);assert.equal(s.repair.accepted,false);assert.equal(s.repair.measured,false);assert.equal(s.repair.offTest,false);
 assert.deepEqual(restoreRepair({version:1,board:{parts:[],wires:[]}}),freshRepair());
}
{
 const s=make();prepare(s);s.connections.latch='battery';s.player={x:-.9,z:-3.1};testRepair(s);close(s);measureRepair(s,'lamp');testRepair(s);
 tick(s,1.5);assert.equal(s.door,true);assert.ok(Math.abs(s.energy-63)<1e-8,'The 6 W board still consumes energy after the mechanical latch opens');
 disconnect(s,'battery');tick(s,3);assert.ok(Math.abs(s.energy-63)<1e-8,'Disconnecting stops consumption');
}
console.log('PASS workshop repair: two faults, DC current, live-edit guard, overcurrent/short protection, measurement and switch proof, wire removal and saved board.');
