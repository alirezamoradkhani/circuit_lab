import * as T from '../engine/three.js';
import {box,ball,pipe,group,rod} from './shapes.js';
import {plaque} from './materials.js';
import {circuitReading,REPAIR_NAMES,PARTS,REPAIR_CABINET} from '../workshop/RepairCircuit.js';
export const CABINET=REPAIR_CABINET;
const centers={source:[-.77,.48],switch:[.65,.48],resistor:[.65,-.48],lamp:[-.77,-.48]};
export class RepairBench {
 constructor(scene,m){
  this.m=m;this.root=group(scene,'cabinet');this.root.position.set(CABINET.x,CABINET.y,CABINET.z);
  box(this.root,m.dark,0,0,-.12,2.65,2.05,.18);box(this.root,m.green,0,0,-.005,2.5,1.9,.08);
  this.lid=box(this.root,m.dark,0,0,.08,2.5,1.92,.07);this.lid.userData.interaction='cabinet';
  const title=plaque('تابلو کنترل کرکره');this.resources=[title];box(this.lid,title,0,0,.045,1.9,.38,.02);
  this.parts=new T.Group();this.root.add(this.parts);this.pins={};this.bodies={};this.labels={};
  this.pinMaterial=new T.MeshStandardMaterial({color:'#cca263',emissive:'#bf8c37',emissiveIntensity:.15,roughness:.5});this.resources.push(this.pinMaterial);
  for(const id of PARTS){
   const [x,y]=centers[id],g=group(this.parts,'repair-part:'+id);g.position.set(x,y,.075);
   if(id==='source'){box(g,m.ink,0,0,0,.45,.32,.17);box(g,m.brass,0,.055,.105,.21,.1,.015);}
   if(id==='switch'){box(g,m.cream,0,0,0,.4,.32,.1);this.arm=rod(g,m.brass,[-.13,-.055,.12],[.13,.08,.17],.045);}
   if(id==='resistor'){box(g,m.cream,0,0,.015,.37,.18,.14);for(const [i,color] of ['#865738','#212b27','#b2945b'].entries()){const band=new T.MeshStandardMaterial({color});this.resources.push(band);box(g,band,(i-1)*.09,0,.093,.025,.18,.012);}}
   if(id==='lamp'){const mat=m.light.clone();this.resources.push(mat);this.bulb=ball(g,mat,0,0,.09,.16);box(g,m.brass,0,-.15,.045,.21,.1,.1);}
   const lab=plaque(REPAIR_NAMES[id]);this.resources.push(lab);box(g,lab,0,.27,0,.78,.13,.025);
   const val=plaque(id==='source'?'12 V':id==='lamp'?'12 Ω / 0.5 A':id==='resistor'?'6 Ω':'کلید باز');this.resources.push(val);this.labels[id]=box(g,val,0,-.27,0,.78,.13,.025);
   for(const end of [0,1]){
    const px=x+(end===0?-.29:.29)*(id==='switch'?1:-1),py=y;
    const pin=ball(this.parts,this.pinMaterial,px,py,.125,.065);pin.userData.interaction=`repair-pin:${id}:${end}`;
    this.pins[id+':'+end]=new T.Vector3(px,py,.15);
    const sign=plaque(id==='source'?(end===0?'+':'−'):String(end+1));this.resources.push(sign);box(this.parts,sign,px,py-.13,.1,.1,.08,.01);
   }
   this.bodies[id]=g;
  }
  this.wires=new T.Group();this.parts.add(this.wires);this.preview=new T.Group();this.root.add(this.preview);this.key='';this.labelKey='';
 }
 pinWorld(id){return this.root.localToWorld(this.pins[id].clone());}
 drawWire(a,b,index,mat,owner){
  const p=this.pins[a],q=this.pins[b];if(!p||!q)return;
  const points=[p.toArray(),[p.x,p.y,.24+index*.017],[(p.x+q.x)/2,(p.y+q.y)/2,.32+index*.015],[q.x,q.y,.24+index*.017],q.toArray()];
  const wire=pipe(owner,mat,points,.018);wire.userData.interaction='repair-wire:'+index;
  const hit=pipe(owner,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),points,.055);hit.userData.interaction='repair-wire:'+index;
 }
 clear(owner){for(const c of [...owner.children]){c.geometry.dispose();if(c.material?.opacity===0)c.material.dispose();owner.remove(c);}}
 update(s,{open=false,start=null,hovered=null,selected=null}={}){
  this.lid.visible=!open;this.parts.visible=open;
  const r=circuitReading(s);this.bulb.material.emissiveIntensity=!s.repair.tripped?Math.min(3,r.lampCurrent*5):0;
  this.bulb.material.color.set(r.lampCurrent>.01?'#eadb9e':'#545d4d');
  const sw=s.repair.board.parts.find(p=>p.id==='switch');this.arm.rotation.z=sw.closed?-.45:.3;
  const key=JSON.stringify([s.repair.board.wires,s.repair.tripped,r.lampCurrent>0,selected]);
  if(key!==this.key){this.key=key;this.clear(this.wires);s.repair.board.wires.forEach(([a,b],i)=>this.drawWire(a,b,i,selected==='repair-wire:'+i?this.m.brass:r.lampCurrent>0&&!s.repair.tripped?this.m.live:this.m.cable,this.wires));}
  const labelKey=JSON.stringify([sw.closed,s.repair.board.parts.find(p=>p.id==='resistor').value]);
  if(labelKey!==this.labelKey){this.labelKey=labelKey;for(const id of ['switch','resistor']){const label=this.labels[id];label.material.map?.dispose();label.material.dispose();const material=plaque(id==='switch'?(sw.closed?'کلید بسته':'کلید باز'):s.repair.board.parts.find(p=>p.id===id).value+' Ω');label.material=material;}}
  this.clear(this.preview);
  if(start&&hovered?.startsWith('repair-pin:')){const end=hovered.slice(11);if(this.pins[start]&&this.pins[end])this.drawWire(start,end,0,this.m.brass,this.preview);}
 }
 dispose(){this.clear(this.preview);this.clear(this.wires);}
}
