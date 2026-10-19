import {WorkshopScene} from '../visual/WorkshopScene.js';
import * as T from '../engine/three.js';
import {box,cylinder,ball,rod,pipe,group} from '../visual/shapes.js';
import {deviceReadings} from './devices.js';
import {animateRobot} from '../visual/Robot.js';
import {plaque} from '../visual/materials.js';

export class CityRayScene extends WorkshopScene {
 constructor(host,session,devices){
  super(host);
  this.citySession=session;this.devices=devices;this.deviceViews=new Map();this.wireViews=[];
  this.room.root.visible=false;
  const hiddenRoots=new Set();
  for(const node of Object.values(this.props)){
   if(!node)continue;
   let root=node;
   while(root.parent&&root.parent!==this.scene)root=root.parent;
   hiddenRoots.add(root);
  }
  for(const root of hiddenRoots)root.visible=false;
  this.pakro.root.visible=false;this.cables.visible=false;
  this.scene.background=new T.Color('#4e5b50');
  this.cameraOffset.set(0,11,8);this.cameraTarget.set(0,.1,0);
  this.ray.root.scale.setScalar(.68);
  this.boardRoot=group(this.scene);this.boardRoot.name='miniature-circuit-board';
  this.buildBoard();
 }
 resize(){
  super.resize();
  if(!this.width||!this.height)return;
  const aspect=this.width/this.height,half=Math.max(5.2,6.2/aspect);
  Object.assign(this.camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});
  this.camera.updateProjectionMatrix();
 }
 buildBoard(){
  const m=this.materials;
  box(this.boardRoot,m.dark,0,-.2,0,12.2,.35,8.5);
  box(this.boardRoot,m.green,0,.01,0,11.9,.06,8.2);
  for(let x=-5.5;x<=5.5;x+=.55)box(this.boardRoot,m.dark,x,.045,0,.012,.012,7.8);
  for(let z=-3.6;z<=3.6;z+=.55)box(this.boardRoot,m.dark,0,.046,z,11.7,.012,.012);
  const railMat=m.brass.clone();railMat.emissive=new T.Color('#2c2415');railMat.emissiveIntensity=.15;
  const positiveRail=pipe(this.boardRoot,railMat,[[-5.1,.09,3.1],[5.1,.09,3.1]],.045);
  const negativeRail=pipe(this.boardRoot,railMat,[[-5.1,.09,-3.1],[5.1,.09,-3.1]],.045);
  positiveRail.userData.label='+';negativeRail.userData.label='−';
  const railPlus=box(this.boardRoot,plaque('+  تغذیه', '#d7c88f','#403b30',256,64),-5.25,.12,3.1,.82,.025,.2);
  const railMinus=box(this.boardRoot,plaque('−  برگشت', '#c7d1bf','#34493c',256,64),-5.25,.12,-3.1,.82,.025,.2);
  for(const d of this.devices){
   const view=this.makeDevice(d);this.deviceViews.set(d.id,view);
  }
  const source=this.devices[0];
  const accents=['#6e9a8a','#c39a54','#9b6b5c','#71899f','#8c9b6a','#b37955'];
  const count=Math.max(1,this.devices.length-1);
  for(const [index,d] of this.devices.slice(1).entries()){
   const a=source.position,b=d.position;
   const lane=2.28+index*.15,lower=-2.28-index*.15;
   const accent=accents[index%accents.length];
   const plus=m.cable.clone(),minus=m.cable.clone();
   plus.color.set(accent);minus.color.set(accent);
   plus.emissive=new T.Color(accent);minus.emissive=new T.Color(accent);
   plus.emissiveIntensity=.06;minus.emissiveIntensity=.06;
   const sourceOffset=(index-(count-1)/2)*.16,targetOffset=(index%2?-.14:.14);
   const wires=[
    pipe(this.boardRoot,plus,[[a.x+sourceOffset,.18,a.z+.28],[a.x+sourceOffset,.18,lane],[b.x+targetOffset,.18,lane],[b.x+targetOffset,.18,b.z+.28]],.045),
    pipe(this.boardRoot,minus,[[a.x-sourceOffset,.2,a.z-.28],[a.x-sourceOffset,.2,lower],[b.x-targetOffset,.2,lower],[b.x-targetOffset,.2,b.z-.28]],.045)
   ];
   const dimAccent=new T.Color(accent).multiplyScalar(.58);
   this.wireViews.push({id:d.id,wires,plus,minus,accent,dimAccent});
  }
 }
 makeDevice(d){
  const m=this.materials,root=group(this.boardRoot,'city-device:'+d.id);root.position.set(d.position.x,.08,d.position.z);
  const base=box(root,m.dark,0,.03,0,.86,.06,.58);base.castShadow=false;
  const label=box(root,plaque(d.label,'#d8c99a','#3b4037',256,58),0,.085,.54,.9,.024,.2);
  let led=ball(root,m.light.clone(),0,.38,.25,.055),rotating=null;
  if(d.kind==='source'){
   box(root,m.blue,-.18,.29,0,.12,.45,.3);box(root,m.blue,.18,.29,0,.12,.45,.3);
   rod(root,m.brass,[-.11,.52,0],[-.11,.71,0],.025);rod(root,m.brass,[.11,.52,0],[.11,.71,0],.025);
   led.position.set(0,.27,.25);
  }else if(d.kind==='lamp'||d.kind==='sign'){
   cylinder(root,m.brass,0,.28,0,.2,.22);root.children[root.children.length-1].rotation.z=Math.PI/2;
   led=ball(root,m.light.clone(),0,.28,.18,.14);
   ball(root,led.material,0,.28,.18,.14);
  }else if(d.kind==='fan'){
   const hub=cylinder(root,m.blue,0,.28,0,.17,.18);hub.rotation.z=Math.PI/2;rotating=group(root);rotating.position.set(0,.28,.1);
   for(let i=0;i<3;i++){const blade=box(rotating,m.brass,0,.2,0,.08,.35,.025);blade.rotation.z=i*Math.PI*2/3;blade.position.set(Math.sin(i*Math.PI*2/3)*.17,Math.cos(i*Math.PI*2/3)*.17,0);}
   led=ball(root,m.light.clone(),0,.28,.27,.045);
  }else if(d.kind==='pump'){
   cylinder(root,m.blue,0,.28,0,.25,.35);pipe(root,m.rust,[[-.34,.28,0],[-.56,.28,0]],.06);pipe(root,m.blue,[[.34,.28,0],[.56,.28,0]],.06);
   led=ball(root,m.light.clone(),0,.48,.2,.045);
  }else{
   box(root,m.wood,0,.28,0,.72,.38,.36);
   for(let i=0;i<4;i++)box(root,m.brass,-.24+i*.16,.28,.2,.04,.28,.025);
   led=ball(root,m.light.clone(),0,.5,.2,.045);
  }
  cylinder(root,m.brass,0,.1,.33,.08,.025);
  return {root,led,rotating};
 }
 project(id,s){
  if(!id.startsWith('city-device:'))return super.project(id,s);
  const d=this.devices.find(item=>item.id===id.slice(12));if(!d)return null;
  const v=new T.Vector3(d.position.x,.65,d.position.z).project(this.camera);
  return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height,visible:Math.abs(v.x)<.96&&Math.abs(v.y)<.92&&v.z>-1&&v.z<1};
 }
 render(s,time,moving,intro,selected,dt){
  const previous=this.ray.root.position.clone();
  this.ray.root.position.set(s.player.x,.11,s.player.z);
  const dx=s.player.x-previous.x,dz=s.player.z-previous.z;
  if(moving&&(Math.abs(dx)+Math.abs(dz))>.0001){
   const desired=Math.atan2(dx,dz),diff=T.MathUtils.euclideanModulo(desired-this.ray.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;
   this.ray.root.rotation.y+=diff*Math.min(1,dt*14);
  }
  animateRobot(this.ray,time,moving,false);
  for(const d of this.devices){
   const view=this.deviceViews.get(d.id),r=deviceReadings(this.citySession,d),on=!!r.on&&!s.tripped;
   view.led.material.emissiveIntensity=on?Math.max(.2,Math.min(2.4,1.8*(r.voltage/12)**2)):0;
   view.led.material.color.set(on?'#efd8a0':'#565e4a');
   if(view.rotating&&on)view.rotating.rotation.z+=dt*5;
   const branch=this.wireViews.find(w=>w.id===d.id);
   if(branch)for(const wire of branch.wires){wire.material.color.set(on?branch.accent:branch.dimAccent);wire.material.emissiveIntensity=on?.7:.08;}
  }
  const target=new T.Vector3(T.MathUtils.clamp(s.player.x*.35,-1.6,1.6),0,s.player.z*.18);
  this.cameraTarget.lerp(target,Math.min(1,dt*4));
  this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);this.camera.lookAt(this.cameraTarget);this.camera.updateMatrixWorld();
  const pos=selected&&this.devices.find(d=>selected==='city-device:'+d.id)?.position;this.marker.visible=!!pos;
  if(pos)this.marker.position.set(pos.x,.13,pos.z);
  this.renderer.render(this.scene,this.camera);
 }
}
