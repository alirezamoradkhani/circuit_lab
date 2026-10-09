import {box,cylinder,ball,rod,ring,group} from '../../visual/shapes.js';
export function mechanicalAsset(root,m,e){
 const type=e.kind,parts={};
 if(['Door','Canopy','Bridge'].includes(type)){
  for(const x of [-.65,.65])box(root,m.rust,x,.8,0,.12,1.6,.2);
  box(root,m.rust,0,1.6,0,1.4,.12,.2);parts.panel=group(root);
  for(let i=0;i<8;i++)box(parts.panel,type==='Bridge'?m.wood:m.green,0,.1+i*.2,0,1.2,.18,.1);
  if(type==='Canopy')parts.panel.position.y=1.6;
 }else if(type==='Ladder'){
  for(const x of [-.3,.3])rod(root,m.dark,[x,0,0],[x,2,0],.035);
  for(let i=0;i<8;i++)rod(root,m.brass,[-.3,.1+i*.25,0],[.3,.1+i*.25,0],.025);
 }else if(type==='RailCrate'){
  const material=e.config.material==='metal'?m.blue:m.wood;
  box(root,material,0,.4,0,.85,.8,.75);
  if(e.config.material==='metal')for(const x of [-.3,.3])box(root,m.brass,x,.4,.39,.04,.7,.025);
  else for(let i=0;i<5;i++)box(root,m.dark,0,.1+i*.15,.38,.86,.02,.02);
 }else if(type==='WaterBasin'){
  box(root,m.dark,0,-.2,0,2,.15,1.6);parts.water=box(root,m.blue,0,.1,0,1.85,.15,1.45);
  for(const x of [-1,1])box(root,m.rust,x,.2,0,.12,.6,1.7);
 }else if(type==='PressurePlate'){
  box(root,m.dark,0,.06,0,.85,.12,.85);parts.panel=box(root,m.brass,0,.15,0,.75,.08,.75);
 }else if(type==='Jack'){
  box(root,m.dark,0,.06,0,.7,.12,.4);rod(root,m.rust,[-.3,.1,0],[.3,.6,0],.05);rod(root,m.rust,[.3,.1,0],[-.3,.6,0],.05);box(root,m.brass,0,.65,0,.6,.1,.35);
 }else if(type==='Mirror'){
  cylinder(root,m.dark,0,.06,0,.3,.1);parts.head=group(root);parts.head.position.y=.65;
  box(parts.head,m.brass,0,0,0,.8,.9,.08);box(parts.head,m.glass,0,0,.05,.7,.8,.025);
 }else if(type==='LightSensor'){
  box(root,m.green,0,.3,0,.35,.6,.25);parts.glow=ball(root,m.light,0,.4,.15,.1);
 }else if(type==='Fog'){
  parts.cloud=group(root);for(let i=0;i<5;i++){const b=ball(parts.cloud,m.cream,(i-2)*.3,.45+(i%2)*.12,0,.3);b.material=m.glass;}
 }else if(type==='Socket'){
  ring(root,m.brass,0,.15,0,.2,.045).rotation.x=Math.PI/2;box(root,m.dark,0,.04,0,.6,.08,.6);
 }
 return parts;
}
