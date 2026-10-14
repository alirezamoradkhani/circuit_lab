import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {adventures} from '../src/city/adventureData.js';
import {missionDevices,deviceReadings,canReachDevice} from '../src/campaign/ray-city/devices.js';
import {deviceCircuit} from '../src/campaign/ray-city/DeviceCircuit.js';
import {createNavigation} from '../src/campaign/engine/createNavigation.js';
import {ROOM,STATIC_OBSTACLES} from '../src/campaign/workshop/layout.js';
for(let index=0;index<adventures.length;index++){
 const s=new AdventureSession(index),devices=missionDevices(s);
 assert.equal(devices[0].id,'supply');assert.equal(new Set(devices.map(d=>d.id)).size,devices.length);
 if(s.mission.id!=='clinic')for(const part of s.board.parts)assert.equal(devices.filter(d=>d.partIds.includes(part.id)).length,1,'Each actual component belongs to exactly one physical cabinet');
 const navigation=createNavigation({bounds:ROOM,obstacles:()=>[...STATIC_OBSTACLES,...devices.map(d=>({...d.position,w:1,d:.7}))],blocked:()=>false,tetherAllows:()=>true});
 for(const d of devices){
  assert.ok(navigation.findPath({x:0,z:3.45},d.walk,{}).length,'Reachable device: '+s.mission.id+'/'+d.label);
  assert.equal(canReachDevice(d.walk,d),true);const html=deviceCircuit(s,d,devices);assert.ok(html.includes('<svg'));
  const before=s.board.snapshot();deviceReadings(s,d);assert.equal(s.board.snapshot(),before,'Reading does not mutate shared circuit');
  for(const match of html.matchAll(/data-pin="([^"]+)"/g))assert.ok(s.board.parts.some(p=>match[1]===p.id+':0'||match[1]===p.id+':1'),'Only real network terminals are editable');
  for(const p of s.board.parts.filter(p=>!d.partIds.includes(p.id)))assert.equal(html.includes('data-measure-part="'+p.id+'"'),false,'Other device components are not rendered in this local circuit');
 }
}
const s=new AdventureSession(3),devices=missionDevices(s);assert.equal(devices.length,5);
assert.equal(deviceReadings(s,devices[2]).on,false);s.toggleLoad(1);assert.equal(deviceReadings(s,devices[2]).on,true);assert.equal(s.power,27);assert.equal(s.test(),false);assert.equal(s.tripped,true);assert.equal(devices.slice(1).some(d=>deviceReadings(s,d).on),false,'One overloaded branch trips shared source and all devices');
s.toggleLoad(3);s.toggleLoad(2);s.resetFuse();assert.equal(s.power,18);assert.equal(s.test(),true);
console.log('PASS all 12 original city missions: device partition, real terminals, read-only measurements, physically reachable cabinets and shared four-device overload.');
