import {WorkshopScene} from '../visual/WorkshopScene.js';
import * as T from '../engine/three.js';
import {box,cylinder,ball,rod,pipe,group,mesh} from '../visual/shapes.js';
import {plaque} from '../visual/materials.js';
import {deviceReadings} from './devices.js';
export class CityRayScene extends WorkshopScene {
 constructor(host,session,devices){
  super(host);this.citySession=session;this.devices=devices;this.deviceViews=new Map();
  this.hiddenProps=[this.props.cart,this.props.reel,this.props.receipt,this.props.radio,this.props.bulb.parent];
  this.room.root.traverse(n=>{if(['latch','mains'].includes(n.userData.interaction))this.hiddenProps.push(n);});
  const m=this.materials;
  for(const d of devices){
   const root=group(this.scene,'city-device:'+d.id);root.position.set(d.position.x,0,d.position.z);
   box(root,m.dark,0,.08,0,.95,.16,.75);const label=plaque(d.label);mesh(root,new T.PlaneGeometry(1.45,.23),label,0,1.8,.15);
   const ledMat=m.light.clone();const led=ball(root,ledMat,.38,1.25,.43,.055);let rotating=null;
   if(d.kind==='lamp'){
    cylinder(root,m.rust,0,.35,0,.12,.6);rod(root,m.brass,[0,.6,0],[0,1.35,0],.045);cylinder(root,m.green,0,1.45,0,.1,.32,.38);ball(root,ledMat,0,1.3,0,.14);
   }else if(d.kind==='fan'){
    box(root,m.green,0,.55,0,.5,.85,.45);const ring=cylinder(root,m.dark,0,1.18,0,.42,.12);ring.rotation.x=Math.PI/2;rotating=group(root);rotating.position.set(0,1.18,.1);for(let i=0;i<3;i++){const blade=box(rotating,m.brass,0,.21,0,.13,.42,.03);blade.rotation.z=i*Math.PI*2/3;blade.position.set(Math.sin(i*Math.PI*2/3)*.2,Math.cos(i*Math.PI*2/3)*.2,0);}
   }else if(d.kind==='pump'){
    cylinder(root,m.blue,0,.6,0,.36,.9);pipe(root,m.rust,[[-.4,.6,0],[-.7,.6,0],[-.7,.14,.4]],.09);pipe(root,m.blue,[[.3,.6,0],[.65,.6,0],[.65,1.3,0]],.08);box(root,m.green,0,.95,.3,.42,.25,.28);
   }else if(d.kind==='radio'){
    box(root,m.wood,0,.8,0,.85,.75,.4);for(let i=0;i<6;i++)box(root,m.dark,-.28+i*.1,.8,.21,.025,.45,.025);rod(root,m.brass,[.3,1.17,0],[.48,1.65,0],.02);
   }else if(d.kind==='heater'){
    box(root,m.dark,0,.7,0,.9,1.1,.35);for(let i=0;i<5;i++)box(root,m.rust,-.32+i*.16,.7,.2,.065,.85,.04);
   }else if(d.kind==='sign'){
    box(root,m.green,0,.9,0,1.3,1.0,.24);mesh(root,new T.PlaneGeometry(1.1,.5),plaque('فروشگاه سپید'),0,.98,.14);
   }else{
    box(root,d.kind==='source'?m.blue:m.green,0,.72,0,.9,1.28,.58);box(root,m.cream,0,.95,.305,.62,.26,.02);for(let i=0;i<3;i++)box(root,m.brass,-.25+i*.25,.58,.33,.1,.1,.035);
   }
   box(root,m.cream,0,.29,.42,.6,.24,.035);mesh(root,new T.PlaneGeometry(.53,.16),plaque('مدار دستگاه'),0,.29,.445);
   this.deviceViews.set(d.id,{root,led,rotating});
  }
  // Physical cable routes explain that the separate cabinets share one source.
  const source=devices[0].position;
  for(const d of devices.slice(1))pipe(this.scene,m.cable,[[source.x,.07,source.z],[source.x,.065,3.75],[d.position.x,.065,3.75],[d.position.x,.07,d.position.z]],.023);
 }
 project(id,s){
  if(!id.startsWith('city-device:'))return super.project(id,s);
  const d=this.devices.find(d=>d.id===id.slice(12));if(!d)return null;
  const v=new T.Vector3(d.position.x,1.6,d.position.z).project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height,visible:Math.abs(v.x)<.96&&Math.abs(v.y)<.92};
 }
 render(s,time,moving,intro,selected,dt){
  super.render(s,time,moving,9,null,dt);this.pakro.root.visible=false;for(const p of this.hiddenProps)p.visible=false;
  for(const d of this.devices){const view=this.deviceViews.get(d.id),r=deviceReadings(this.citySession,d);view.led.material.emissiveIntensity=r.on?Math.max(.12,Math.min(2,2*(r.voltage/12)**2)):0;view.led.material.color.set(r.on?'#efd8a0':'#565e4a');if(view.rotating&&r.on)view.rotating.rotation.z+=dt*5;}
  this.renderer.render(this.scene,this.camera);
 }
}
