import * as T from '../../engine/three.js';
import {box,cylinder,ball,rod,ring,group,socket} from '../../visual/shapes.js';
export function electricalAsset(root,m,e){
 const type=e.kind,parts={};
 const casing=(w=.7,h=.9,d=.45)=>box(root,m.green,0,h/2,0,w,h,d);
 if(['Fan','Pump','Motor','Conveyor','Platform'].includes(type)){
  if(type==='Fan'){
   cylinder(root,m.rust,0,.1,0,.38,.12);rod(root,m.brass,[0,.1,0],[0,1.1,0],.06);
   const head=group(root);head.position.y=1.25;parts.head=head;
   ring(head,m.dark,0,0,0,.55,.055);const rotor=group(head);parts.rotor=rotor;
   for(let i=0;i<4;i++){const blade=box(rotor,m.green,0,.24,0,.17,.46,.04);const pivot=group(rotor);rotor.remove(blade);pivot.add(blade);pivot.rotation.z=i*Math.PI/2;}
   ball(head,m.brass,0,0,.04,.1);
   for(let i=-2;i<=2;i++)rod(head,m.dark,[-.43,i*.15,.08],[.43,i*.15,.08],.013);
  }else if(type==='Pump'){
   cylinder(root,m.blue,0,.35,0,.28,.55).rotation.z=Math.PI/2;
   box(root,m.dark,0,.06,0,.8,.12,.55);ring(root,m.brass,-.42,.35,0,.15,.04).rotation.y=Math.PI/2;
   rod(root,m.blue,[.3,.35,0],[.3,.65,0],.09);ring(root,m.brass,.3,.7,0,.13,.035).rotation.x=Math.PI/2;
   parts.rotor=cylinder(root,m.rust,.4,.35,0,.18,.08);parts.rotor.rotation.z=Math.PI/2;
  }else if(type==='Conveyor'){
   box(root,m.dark,0,.4,0,2,.2,.8);parts.rotor=group(root);
   for(let i=0;i<8;i++)cylinder(parts.rotor,m.wood,-.85+i*.24,.54,0,.085,.8).rotation.x=Math.PI/2;
   for(const x of [-.8,.8])box(root,m.rust,x,.2,0,.12,.4,.65);
  }else if(type==='Platform'){
   box(root,m.rust,0,.12,0,1.7,.24,1.35);for(const x of [-.75,.75]){rod(root,m.brass,[x,.2,-.58],[x,1,-.58],.04);}
   rod(root,m.brass,[-.75,1,-.58],[.75,1,-.58],.04);
   cylinder(root,m.dark,0,.2,-.7,.22,.12).rotation.x=Math.PI/2;
  }else{casing();parts.rotor=cylinder(root,m.brass,0,.5,.35,.25,.3);parts.rotor.rotation.x=Math.PI/2;}
 }else if(type==='Magnet'){
  box(root,m.dark,0,.5,0,.9,.25,.5);for(const x of [-.32,.32])box(root,m.rust,x,.2,0,.22,.5,.45);
  for(let i=0;i<5;i++)ring(root,m.brass,0,.38+i*.04,0,.19,.023).rotation.x=Math.PI/2;
 }else if(['Battery','Capacitor'].includes(type)){
  if(type==='Battery')casing(.65,.75,.4);else for(const x of [-.16,.16])cylinder(root,m.blue,x,.4,0,.16,.8);
  for(const x of [-.19,.19])cylinder(root,m.brass,x,.82,0,.06,.12);
  for(let i=0;i<3;i++)box(root,m.brass,0,.22+i*.16,.23,.25,.035,.015);
 }else if(type==='BeamLamp'){
  cylinder(root,m.dark,0,.1,0,.3,.15);rod(root,m.brass,[0,.1,0],[0,.8,0]);
  parts.head=group(root);parts.head.position.y=.8;
  cylinder(parts.head,m.green,0,0,0,.25,.4).rotation.x=Math.PI/2;parts.glow=ball(parts.head,m.light,0,0,.22,.2);
 }else if(type==='Heater'){
  cylinder(root,m.rust,0,.18,0,.4,.3);cylinder(root,m.brass,0,.5,0,.26,.4);ring(root,m.dark,.3,.55,0,.16,.035).rotation.y=Math.PI/2;
 }else if(type==='Antenna'){
  cylinder(root,m.dark,0,.08,0,.35,.1);rod(root,m.rust,[0,.1,0],[0,1.4,0],.04);
  parts.head=group(root);parts.head.position.y=1.25;
  rod(parts.head,m.brass,[-.8,0,0],[.8,0,0],.02);for(const x of [-.5,0,.5])rod(parts.head,m.brass,[x,0,-.3],[x,0,.3],.015);
 }else if(type==='Resistor'){
  cylinder(root,m.cream,0,.18,0,.14,.55).rotation.z=Math.PI/2;
  for(const x of [-.15,0,.15])ring(root,m.rust,x,.18,0,.145,.022).rotation.y=Math.PI/2;
  rod(root,m.brass,[-.5,.18,0],[-.28,.18,0],.025);rod(root,m.brass,[.28,.18,0],[.5,.18,0],.025);
 }else if(type==='Sign'){
  box(root,m.rust,0,.8,0,1.2,.65,.15);parts.glow=box(root,m.glass,0,.8,.09,1,.45,.025);
  for(const x of [-.5,.5])rod(root,m.dark,[x,0,0],[x,.6,0],.035);
 }else{
  casing(type==='Divider'||type==='RepairBench'?1.2:.7,type==='RepairBench'?.7:.9);
  if(type==='RepairBench'){box(root,m.wood,0,.8,0,1.5,.15,.9);for(const x of [-.5,.5])box(root,m.dark,x,.35,0,.08,.7,.6);}
  if(type==='Divider')for(const x of [-.35,.35]){box(root,m.cream,x,.65,.3,.27,.15,.13);socket(root,m,e.id,x,.3,.3);}
  if(['Switch','Breaker','SourceSelector','PulseLatch'].includes(type)){parts.lever=rod(root,m.brass,[0,.4,.28],[0,.7,.43],.04);}
  if(type==='Source')for(let i=0;i<4;i++)box(root,m.dark,0,.25+i*.09,.24,.42,.028,.018);
  parts.glow=ball(root,m.light,.2,.75,.25,.045);
 }
 if(!['Resistor','Antenna'].includes(type))socket(root,m,e.id,0,.22,.34);
 return parts;
}
