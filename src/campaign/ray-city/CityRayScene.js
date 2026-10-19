import {WorkshopScene} from '../visual/WorkshopScene.js';
import * as T from '../engine/three.js';
import {box,cylinder,ball,rod,pipe,group} from '../visual/shapes.js';
import {deviceReadings} from './devices.js';
import {animateRobot} from '../visual/Robot.js';
import {plaque} from '../visual/materials.js';

export class CityRayScene extends WorkshopScene {
 constructor(host,session,devices){
  super(host);
  this.citySession=session;this.devices=devices;this.deviceViews=new Map();this.terminalViews=new Map();this.partOwners=new Map();this.connectionRoot=group(this.scene);this.previewRoot=group(this.scene);this.connectionKey='';this.previewKey='';
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
  for(const d of this.devices)for(const partId of d.partIds||[])this.partOwners.set(partId,d.id);
 }
 makeDevice(d){
  const m=this.materials,root=group(this.boardRoot,'city-device:'+d.id);root.position.set(d.position.x,.08,d.position.z);
  const base=box(root,m.dark,0,.03,0,.86,.06,.58);base.castShadow=false;
  const label=box(root,plaque(d.label,'#d8c99a','#3b4037',256,58),0,.085,.54,.9,.024,.2);
  const terminals=[];
  for(const [side,x] of [['0',-.5],['1',.5]]){
   const id='city-terminal:'+d.id+':'+side,terminal=group(root,id);terminal.position.set(x,.22,0);
   const material=m.brass.clone();const node=ball(terminal,material,0,0,0,.105);
   const pin=(d.partIds?.[0]||'')+':'+side;const position={x:d.position.x+x,z:d.position.z};
   terminal.userData.pin=pin;this.terminalViews.set(id,{id,pin,root:terminal,node,position});terminals.push(id);
  }
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
  return {root,led,rotating,terminals};
 }
 connectionPosition(pin){
  const [partId,side]=String(pin||'').split(':');const owner=this.partOwners.get(partId);if(!owner)return null;
  const terminal=this.terminalViews.get('city-terminal:'+owner+':'+(side==='1'?'1':'0'));return terminal?.position||null;
 }
 clearConnections(){
  for(const mesh of this.connectionRoot.children.splice(0)){mesh.geometry?.dispose();mesh.material?.dispose();}
  this.connectionKey='';
 }
 renderConnections(){
  const wires=this.citySession?.board?.wires||[],key=JSON.stringify(wires);if(key===this.connectionKey)return;this.clearConnections();this.connectionKey=key;
  const colors=['#6e9a8a','#c39a54','#9b6b5c','#71899f','#8c9b6a','#b37955'];
  wires.forEach((pair,index)=>{const a=this.connectionPosition(pair[0]),b=this.connectionPosition(pair[1]);if(!a||!b)return;const z=(a.z+b.z)/2+(index%2?.22:-.22);const material=this.materials.cable.clone();material.color.set(colors[index%colors.length]);material.emissive=new T.Color(colors[index%colors.length]);material.emissiveIntensity=.18;pipe(this.connectionRoot,material,[[a.x,.32,a.z],[a.x,.32,z],[b.x,.32,z],[b.x,.32,b.z]],.055);});
 }
 renderPreview(cable){
  const start=cable?.start,end=cable?.hovered,key=JSON.stringify([start,end]);if(key===this.previewKey)return;
  for(const mesh of this.previewRoot.children.splice(0)){mesh.geometry?.dispose();mesh.material?.dispose();}
  this.previewKey=key;if(!start)return;const a=this.terminalViews.get(start)?.position,b=this.terminalViews.get(end)?.position||{x:this.ray.root.position.x,z:this.ray.root.position.z};if(!a||!b)return;const material=this.materials.brass.clone();material.transparent=true;material.opacity=.72;pipe(this.previewRoot,material,[[a.x,.42,a.z],[a.x,.42,(a.z+b.z)/2],[b.x,.42,(a.z+b.z)/2],[b.x,.42,b.z]],.06);
 }
 project(id,s){
  if(!id.startsWith('city-device:'))return super.project(id,s);
  const d=this.devices.find(item=>item.id===id.slice(12));if(!d)return null;
  const v=new T.Vector3(d.position.x,.65,d.position.z).project(this.camera);
  return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height,visible:Math.abs(v.x)<.96&&Math.abs(v.y)<.92&&v.z>-1&&v.z<1};
 }
 render(s,time,moving,intro,selected,dt,cable=null){
  const previous=this.ray.root.position.clone();
  this.ray.root.position.set(s.player.x,.11,s.player.z);
  const dx=s.player.x-previous.x,dz=s.player.z-previous.z;
  if(moving&&(Math.abs(dx)+Math.abs(dz))>.0001){
   const desired=Math.atan2(dx,dz),diff=T.MathUtils.euclideanModulo(desired-this.ray.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;
   this.ray.root.rotation.y+=diff*Math.min(1,dt*14);
  }
  animateRobot(this.ray,time,moving,false);
  this.renderConnections();this.renderPreview(cable);
  for(const [id,view] of this.terminalViews){const active=cable?.start===id,hovered=cable?.hovered===id;view.node.material.color.set(active?'#e3bd62':hovered?'#d5a96a':'#b8aa6b');view.node.material.emissiveIntensity=active?1.4:hovered?.8:.18;}
  for(const d of this.devices){
   const view=this.deviceViews.get(d.id),r=deviceReadings(this.citySession,d),on=!!r.on&&!s.tripped;
   view.led.material.emissiveIntensity=on?Math.max(.2,Math.min(2.4,1.8*(r.voltage/12)**2)):0;
   view.led.material.color.set(on?'#efd8a0':'#565e4a');
   if(view.rotating&&on)view.rotating.rotation.z+=dt*5;
  }
  const target=new T.Vector3(T.MathUtils.clamp(s.player.x*.35,-1.6,1.6),0,s.player.z*.18);
  this.cameraTarget.lerp(target,Math.min(1,dt*4));
  this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);this.camera.lookAt(this.cameraTarget);this.camera.updateMatrixWorld();
  const pos=selected&&this.devices.find(d=>selected==='city-device:'+d.id)?.position;this.marker.visible=!!pos;
  if(pos)this.marker.position.set(pos.x,.13,pos.z);
  this.renderer.render(this.scene,this.camera);
 }
}
