import * as T from '../../engine/three.js';
import {group,pipe,ring} from '../../visual/shapes.js';
import {characterAsset} from './CharacterAssets.js';
import {animateRobot} from '../../visual/Robot.js';
import {createCart,createReel,createReceipt,createLamp,createRadio} from './WorkshopAssets.js';
import {electricalAsset} from './ElectricalAssets.js';
import {mechanicalAsset} from './MechanicalAssets.js';
import {propAsset} from './PropAssets.js';
const electrical=new Set(['Source','Battery','Capacitor','Lamp','Radio','Heater','Sign','TimedDevice','HoldingCoil','BeamLamp','PulseLatch','RepairBench','Charger','Motor','Fan','Pump','Switch','Breaker','SourceSelector','Resistor','Divider','Antenna','Receiver','Platform','Conveyor','Magnet']);
export class ComponentView {
 constructor(parent,materials,entity){
  this.sharedTextures=new Set(Object.values(materials).flatMap(m=>Object.values(m).filter(v=>v?.isTexture)));
  this.entity=entity;this.materials=Object.fromEntries(Object.entries(materials).map(([k,v])=>[k,v.clone()]));
  const m=this.materials,id=entity.id,type=entity.kind;this.parts={};
  const factory=type==='Cart'?createCart:type==='Lamp'?createLamp:type==='Radio'?createRadio:entity.config.visual==='reel'?createReel:entity.config.visual==='receipt'?createReceipt:null;
  if(factory){this.parts=factory(parent,m,{id});this.root=this.parts.root;}
  else if(['Actor','Companion','Guard'].includes(type)){
   this.robot=characterAsset(parent,m,entity);this.root=this.robot.root;this.root.userData.interaction=id;
  }else{
   this.root=group(parent,id);
   if(electrical.has(type))this.parts=electricalAsset(this.root,m,entity);
   else if(type==='Prop'||type==='WindProp')this.parts=propAsset(this.root,m,entity);
   else if(['Cable','Hose'].includes(type)){
    this.parts.coil=group(this.root);for(let i=0;i<4;i++)ring(this.parts.coil,type==='Hose'?m.blue:m.cable,0,.05+i*.03,0,.25,.024).rotation.x=Math.PI/2;
   }else if(!['Sequence','PathRide'].includes(type))this.parts=mechanicalAsset(this.root,m,entity);
  }
  this.indicators=[];this.root.traverse(o=>{if(o.userData.powerIndicator)this.indicators.push(o);});
  this.root.scale.setScalar(entity.config.scale??1);this.update(0,0);
 }
 update(dt,time,world){
  const s=this.entity.state,p=s.position,type=this.entity.kind;
  this.root.position.set(p.x,p.y,p.z);this.root.visible=s.visible&&!s.collected;
  const on=(this.entity.available?.()??false)||s.powered||s.lit||s.complete,parts=this.parts;
  for(const led of this.indicators){led.material.emissiveIntensity=on?1.5:0;led.material.color.set(on?'#edd7a0':'#4d5546');}
  if(parts.rotor&&s.powered){if(type==='Conveyor')parts.rotor.children.forEach(o=>o.rotation.y+=dt*5);else parts.rotor.rotation.z-=dt*(type==='Fan'?this.entity.strength*12:6);}
  if(parts.head)parts.head.rotation.y=type==='Mirror'?-s.angle:type==='BeamLamp'?Math.PI/2-s.direction:type==='Fan'?this.entity.directions[s.direction]:type==='Antenna'?s.direction*Math.PI/2:s.direction??0;
  if(type==='Fan'&&parts.head&&this.entity.config.windTargets){const aim=this.entity.config.windTargets[s.direction];parts.head.rotation.y=Math.atan2(aim.x-p.x,aim.z-p.z);}
  if(parts.panel){if(type==='PressurePlate')parts.panel.position.y=s.pressed?.08:.15;else if(type==='Bridge')parts.panel.rotation.x=-(s.amount??0)*Math.PI/2;else if(type==='Canopy')parts.panel.rotation.x=-Math.PI/2+(s.amount??0)*1.3;else parts.panel.scale.y=Math.max(.02,1-(s.amount??0));}
  if(parts.lever)parts.lever.rotation.x=s.tripped?-.8:s.closed===false?.7:0;
  if(parts.water)parts.water.position.y=.1+(s.level??0)*.3;
  if(parts.cloud)parts.cloud.visible=!s.cleared;
  for(const glow of [parts.glow,parts.bulb,parts.dial].filter(Boolean))glow.material.emissiveIntensity=on?1.8:0;
  if(parts.light)parts.light.intensity=on?14:0;
  if(this.robot)animateRobot(this.robot,time,s.mode==='follow'||s.mode==='patrol',false);
  if(['Cable','Hose'].includes(type)&&world)this.updateCable(world);
 }
 updateCable(world){
  const s=this.entity.state,a=world.get(s.from)?.state.position,b=world.get(s.to)?.state.position,key=JSON.stringify([a,b,s.damaged]);
  if(key===this.wireKey)return;this.wireKey=key;
  if(this.wire){this.wire.geometry.dispose();this.root.remove(this.wire);this.wire=null;}
  if(this.parts.coil)this.parts.coil.visible=!a||!b;
  if(!a||!b)return;
  const p=this.entity.state.position,points=[[a.x-p.x,a.y-p.y+.3,a.z-p.z],[(a.x+b.x)/2-p.x,.08-p.y,(a.z+b.z)/2-p.z],[b.x-p.x,b.y-p.y+.3,b.z-p.z]];
  this.wire=pipe(this.root,s.damaged?this.materials.red:this.entity.kind==='Hose'?this.materials.blue:this.materials.cable,points,.035);
 }
 dispose(){
  const geometries=new Set(),materials=new Set(Object.values(this.materials));
  this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)[o.material].flat().forEach(m=>materials.add(m));});
  geometries.forEach(g=>g.dispose());const ownedTextures=new Set();materials.forEach(m=>{Object.values(m).filter(v=>v?.isTexture&&!this.sharedTextures.has(v)).forEach(t=>ownedTextures.add(t));m.dispose();});ownedTextures.forEach(t=>t.dispose());this.root.removeFromParent();
 }
}
