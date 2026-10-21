import {WorkshopScene} from '../visual/WorkshopScene.js';
import * as T from '../engine/three.js';
import {box,cylinder,ball,rod,ring,group,mesh} from '../visual/shapes.js';
import {plaque} from '../visual/materials.js';
import {animateRobot} from '../visual/Robot.js';
import {measurePart} from '../../city/ComponentMeter.js';
import {routeTracks} from './WorldRoutes.js';
const copper=['#b6a16a','#7a9a87','#b58058','#8697a0','#a8aa7c'];
export class CityRayScene extends WorkshopScene {
 constructor(host,world){
  super(host,{empty:true});this.world=world;this.partViews=new Map();this.terminalViews=new Map();this.connectionViews=[];this.key='';
  this.scene.background=new T.Color('#343f37');this.renderer.domElement.setAttribute('aria-label','درون مدار؛ WASD حرکت، E تعامل، Q انتخاب، X قطع مسیر، M اندازه‌گیری');
  this.cameraOffset.set(0,10,8);this.cameraTarget.set(0,0,0);this.ray.root.scale.setScalar(.69);this.ray.root.userData.interaction=null;
  this.hintMarker=ring(this.scene,this.materials.brass.clone(),0,.11,0,.55,.025);this.hintMarker.rotation.x=-Math.PI/2;this.hintMarker.visible=false;this.floor=group(this.scene);this.floor.name='circuit-substrate';this.tracks=group(this.scene);this.preview=group(this.scene);this.build();this.resize();
 }
 resize(){
  this.width=this.host.clientWidth;this.height=this.host.clientHeight;if(!this.width||!this.height)return;
  this.mobile=this.width<680;this.renderer.setSize(this.width,this.height,false);const aspect=this.width/this.height;
  const half=this.mobile&&!this.overview?3.1:Math.max(3.55,6.05/aspect);
  Object.assign(this.camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});this.camera.updateProjectionMatrix();
 }
 label(parent,text,x,y,z,width=1.15,height=.26){const label=mesh(parent,new T.PlaneGeometry(width,height),plaque(text,'#a9aa88','#333f35',512,100),x,y,z);label.rotation.x=-Math.PI/2;label.castShadow=false;return label;}
 build(){
  const m=this.materials,substrate=m.green.clone();substrate.color.set('#63705e');substrate.roughness=.97;box(this.floor,m.dark,0,-.23,0,28,.4,22);box(this.floor,substrate,0,-.005,0,28,.06,22);
  // A worn circuit substrate, without the previous room, furniture or schematic grid.
  for(const x of [-5.65,5.65])for(const z of [-3.7,3.7]){cylinder(this.floor,m.brass,x,.06,z,.1,.05);box(this.floor,m.ink,x,.089,z,.12,.008,.018);}
  for(let i=0;i<55;i++){const x=((i*37)%113)/10-5.5,z=((i*19)%73)/10-3.5;box(this.floor,m.dark,x,.028,z,.012,.002,.1+(i%5)*.025);}
  this.label(this.floor,'R–07   /   CIRCUIT SERVICE',0,.035,-3.65,2.9,.25);
  const etch=m.blue.clone();etch.color.set('#566857');for(const x of [-5.2,5.2]){box(this.floor,etch,x,.03,0,.025,.003,6.7);for(let i=0;i<8;i++)box(this.floor,etch,x+(x>0?.12:-.12),.031,-3+i*.8,.24,.003,.018);}
  for(const d of this.world.parts){
   const p=d.part,g=group(this.floor,'part:'+d.id);g.position.set(d.position.x,.045,d.position.z);
   box(g,m.dark,0,.06,0,1.3,.09,.94);let light=null,lever=null;
   if(p.type==='battery'){
    for(const x of [-.19,.19]){cylinder(g,m.blue,x,.31,0,.18,.48);cylinder(g,m.brass,x,.56,0,.11,.04);}
    this.label(g,'+     12 V     −',0,.09,-.55,1.25,.21);
   }else if(p.type==='switch'){
    box(g,m.wood,0,.19,0,.6,.2,.45);for(const x of [-.22,.22])cylinder(g,m.brass,x,.32,0,.07,.07);
    lever=group(g);lever.position.set(-.22,.36,0);rod(lever,m.brass,[0,0,0],[.44,0,0],.046);ball(lever,m.cream,.43,0,0,.09);
   }else if(p.type==='lamp'||p.label==='چراغ'||p.label==='روشنایی'){
    cylinder(g,m.brass,0,.19,0,.23,.2);light=ball(g,m.light.clone(),0,.46,0,.27);light.scale.y=1.2;
    ring(g,m.dark,0,.55,0,.3,.023).rotation.x=Math.PI/2;
   }else{
    const body=cylinder(g,m.cream,0,.27,0,.18,.69);body.rotation.z=Math.PI/2;
    for(const x of [-.23,0,.2]){const band=cylinder(g,x===0?m.dark:m.rust,x,.27,0,.185,.07);band.rotation.z=Math.PI/2;}
   }
   for(const x of [-.72,.72])rod(g,m.brass,[x,.11,.25],[x<0?-.4:.4,.18,0],.024);
   this.label(g,d.label,0,.12,.7,1.3,.23);const value=this.label(g,'',0,.12,-.65,1.18,.22);
   this.partViews.set(d.id,{root:g,light,lever,value,valueKey:''});
  }
  for(const t of this.world.terminals()){
   const g=group(this.floor,t.id);g.position.set(t.position.x,.09,t.position.z);cylinder(g,m.ink,0,0,0,.17,.035);
   const solder=m.brass.clone();solder.color.set('#b9b8a1');solder.metalness=.62;solder.roughness=.48;const node=cylinder(g,solder,0,.025,0,.12,.035);ring(g,m.cream,0,.05,0,.15,.012).rotation.x=-Math.PI/2;
   this.label(g,t.pin.startsWith('p1:')?(t.pin.endsWith(':0')?'+':'−'):(t.pin.endsWith(':0')?'1':'2'),0,.07,.24,.16,.15);this.terminalViews.set(t.id,{...t,root:g,node});
  }
 }
 clear(root){for(const child of [...root.children]){root.remove(child);child.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat())m.dispose();});}}
 strip(parent,a,b,material,y=.09,width=.12){
  const length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.001)return null;const o=box(parent,material,(a.x+b.x)/2,y,(a.z+b.z)/2,length,.035,width);o.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);o.castShadow=false;return o;
 }
 connections(){
  const key=JSON.stringify([this.world.s.board.wires,this.world.s.board.parts.map(p=>p.id)]);if(key===this.key)return;this.key=key;this.clear(this.tracks);
  this.world.routes=routeTracks(this.world.s.board,this.world.parts.filter(d=>this.world.s.board.parts.includes(d.part)),this.world.terminals());this.connectionViews=[];
  for(const route of this.world.routes){const root=group(this.tracks,'wire:'+route.index),material=this.materials.brass.clone();material.color.set(copper[route.index%copper.length]);material.emissive=new T.Color('#bb9c61');material.emissiveIntensity=.07;
   for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];this.strip(root,a,b,this.materials.ink.clone(),.055,.19);this.strip(root,a,b,material,.09+route.index*.003,.105);}
   // A small raised insulated crossover makes intersections distinct from solder junctions.
   for(const older of this.connectionViews)for(let i=1;i<route.points.length;i++)for(let j=1;j<older.route.points.length;j++){
    const a=route.points[i-1],b=route.points[i],c=older.route.points[j-1],d=older.route.points[j];
    if(Math.abs(a.z-b.z)<.001&&Math.abs(c.x-d.x)<.001&&c.x>Math.min(a.x,b.x)+.12&&c.x<Math.max(a.x,b.x)-.12&&a.z>Math.min(c.z,d.z)+.12&&a.z<Math.max(c.z,d.z)-.12){box(root,this.materials.ink.clone(),c.x,.13,a.z,.38,.08,.25);rod(root,material,[c.x-.18,.15,a.z],[c.x+.18,.15,a.z],.045);}
    if(Math.abs(a.x-b.x)<.001&&Math.abs(c.z-d.z)<.001&&a.x>Math.min(c.x,d.x)+.12&&a.x<Math.max(c.x,d.x)-.12&&c.z>Math.min(a.z,b.z)+.12&&c.z<Math.max(a.z,b.z)-.12){box(root,this.materials.ink.clone(),a.x,.13,c.z,.25,.08,.38);rod(root,material,[a.x,.15,c.z-.18],[a.x,.15,c.z+.18],.045);}
   }
   this.connectionViews.push({root,material,route,color:copper[route.index%copper.length]});
  }
 }
 project(id){const t=this.world.targets().find(t=>t.id===id),p=t?.device?.position||t?.position;if(!p)return null;const v=new T.Vector3(p.x,.6,p.z).project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(.5-v.y*.5)*this.height,visible:Math.abs(v.x)<1&&Math.abs(v.y)<1};}
 render(s,time,moving,intro,selected,dt){
  this.connections();const w=this.world,p=s.player;this.ray.root.position.set(p.x,.03,p.z);
  if(moving&&this.previous){const dx=p.x-this.previous.x,dz=p.z-this.previous.z;if(Math.hypot(dx,dz)>.001)this.ray.root.rotation.y=Math.atan2(dx,dz);}this.previous={...p};animateRobot(this.ray,time,moving,!!w.start||s.working);
  for(const d of w.parts){const v=this.partViews.get(d.id),part=d.part;v.root.visible=w.s.board.parts.includes(part);if(!v.root.visible)continue;
   const reading=measurePart(w.s,d.id),value=part.type==='switch'?(part.closed?'بسته':'باز'):part.value+(part.type==='battery'?' V':' Ω');
   if(v.valueKey!==value){v.value.material.map?.dispose();v.value.material.dispose();v.value.material=plaque(value,'#a9aa88','#333f35',512,100);v.valueKey=value;}
   if(v.lever)v.lever.rotation.z=part.closed?0:.7;
   if(v.light){const on=!w.s.tripped&&(reading?.current||0)>.001;v.light.material.color.set(on?'#edd6a0':'#5c6654');v.light.material.emissiveIntensity=on?Math.min(2.5,(reading.voltage/12)**2*2.2):.02;}
  }
  for(const [id,v] of this.terminalViews){v.root.visible=w.s.board.parts.some(p=>v.pin.startsWith(p.id+':'));const active=w.selected===id||w.start===v.pin,hint=w.hintTarget===id;v.node.material.color.set(active?'#f0ce78':hint?'#aebf8d':'#b9b8a1');v.node.material.emissive.set('#bb9950');v.node.material.emissiveIntensity=active?1.1:hint?.4+.35*Math.sin(time*3):.04;}
  for(const v of this.connectionViews){const active=w.selected==='wire:'+v.route.index;v.material.color.set(active?'#f0ce78':v.color);v.material.emissiveIntensity=active?.9:.07;}
  this.clear(this.preview);if(w.start){const a=this.terminalViews.get('pin:'+w.start)?.position;if(a){const target=this.terminalViews.get(w.selected)?.position||p;const material=this.materials.brass.clone();material.transparent=true;material.opacity=.65;this.strip(this.preview,a,{x:a.x,z:target.z},material,.19,.08);this.strip(this.preview,{x:a.x,z:target.z},target,material,.19,.08);}}
  const ht=w.targets().find(t=>t.id===w.hintTarget),hp=ht?.device?.position||ht?.position;this.hintMarker.visible=!!hp;if(hp){this.hintMarker.position.set(hp.x,.11,hp.z);this.hintMarker.scale.setScalar((ht?.type==='part'?1.4:.5)*(1+.08*Math.sin(time*3)));}
  const t=w.target(),pos=t?.device?.position||t?.position;this.marker.visible=!!pos;if(pos){this.marker.position.set(pos.x,.17,pos.z);this.marker.scale.setScalar(t.type==='part'?2.8:1);}
  const target=this.mobile&&!this.overview?new T.Vector3(T.MathUtils.clamp(p.x,-3,3),0,p.z*.4):new T.Vector3(w.s.mission.id==='gate'?-1.1:0,0,.1);this.cameraTarget.lerp(target,Math.min(1,dt*4));this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);this.camera.lookAt(this.cameraTarget);this.camera.updateMatrixWorld();this.renderer.render(this.scene,this.camera);
 }
}
