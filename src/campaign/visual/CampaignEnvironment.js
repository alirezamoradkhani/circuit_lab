import * as T from '../engine/three.js';
import {box,cylinder,rod,ball,group} from './shapes.js';
export function campaignEnvironment(scene,m,definition){
 const root=group(scene),theme=definition.theme;
 let serviceLadder=null,originalLadder=null;
 // Cut the ground mesh itself: water below an unbroken floor is invisible.
 const banks=theme==='alley'?[[-7,.15],[1.45,7]]:[[-7,7]];
 for(const [left,right] of banks)box(root,['garden','square'].includes(theme)?m.floor:m.dark,(left+right)/2,-.16,0,right-left,.25,10);
 for(let x=-6;x<=6;x+=1.2)for(let z=-4;z<=4;z+=1.2)for(const [left,right] of banks){
  const a=Math.max(left,x-.57),b=Math.min(right,x+.57);
  if(b>a)box(root,m.floor,(a+b)/2,-.027,z,b-a,.035,1.14);
 }
 const building=(x,width,height,color)=>{
  box(root,color,x,height/2,-5.4,width,height,1.4);box(root,m.rust,x,height,-5.4,width+.25,.18,1.6);
  for(let y=.9;y<height-.3;y+=1.25)for(let dx=-width/2+.5;dx<width/2-.3;dx+=1.1){box(root,m.ink,x+dx,y,-4.67,.53,.64,.045);box(root,m.brass,x+dx,y-.35,-4.6,.64,.07,.14);}
  rod(root,m.rust,[x+width/2-.15,.1,-4.58],[x+width/2-.15,height-.2,-4.58],.055);
 };
 const indoor=['shelter','depot','passage','elevator'].includes(theme);
 if(indoor){
  box(root,m.plaster,0,1.8,-4.8,13.5,3.6,.25);
  for(const x of [-6.5,0,6.5])rod(root,m.rust,[x,0,-4.5],[x,3.8,-4.5],.13);
  for(let x=-5;x<=5;x+=2)box(root,m.ink,x,2.5,-4.64,1.25,.8,.05);
 }else{building(-4.8,3,3.5,m.plaster);building(-1.1,3.8,5,m.wood);building(3.5,4.8,3.9,m.plaster);}
 if(theme==='market')for(const x of [-5,0,5]){
  box(root,m.wood,x,.55,-3.2,2.6,1.1,.9);const awning=box(root,m.green,x,2,-3,2.9,.1,1.4);awning.rotation.x=.14;
  for(const side of [-1.3,1.3])rod(root,m.brass,[x+side,0,-2.6],[x+side,2,-2.6],.04);
  for(let i=0;i<5;i++)cylinder(root,m.rust,x-1+i*.45,1.2,-3.1,.14,.25);
 }
 if(theme==='garden')for(const x of [-5.8,5.8])for(let z=-3.5;z<=3.5;z+=1.4){
  cylinder(root,m.rust,x,.25,z,.32,.5);rod(root,m.green,[x,.5,z],[x,1.2,z],.04);
  for(const dx of [-.17,.17]){const leaf=ball(root,m.green,x+dx,.95,z,.2);leaf.scale.set(1,.35,.7);}
 }
 if(theme==='rooftop'){
  for(const x of [-6.7,6.7])box(root,m.plaster,x,.5,0,.25,1,9);
  for(const x of [-5,5]){rod(root,m.dark,[x,0,-3.8],[x,3,-3.8],.03);rod(root,m.brass,[x-.8,2.6,-3.8],[x+.8,2.6,-3.8],.018);}
 }
 if(theme==='depot'){
  for(const z of [-3.8,3.8]){for(const x of [-6,6])rod(root,m.dark,[x,0,z],[x,3.3,z],.1);rod(root,m.rust,[-6,3.3,z],[6,3.3,z],.09);}
 }
 if(theme==='elevator'){
  // The two stops are separated in depth as well as height; guide rails follow that actual track.
  const lift=definition.components.find(c=>c.id==='lift'),from=lift?.from??{x:0,y:0,z:2},to=lift?.to??{x:0,y:3,z:-2};
  for(const side of [-1.05,1.05]){
   rod(root,m.rust,[from.x+side,from.y+.05,from.z],[to.x+side,to.y+.05,to.z],.07);
   rod(root,m.dark,[to.x+side,0,to.z],[to.x+side,4.1,to.z],.08);
  }
  rod(root,m.rust,[-1.15,4.1,-2],[1.15,4.1,-2],.08);
  // Leave the centre shaft open, with a real upper landing around its sides and rear.
  const decks=[[-7,-1.05,-5,-.55],[1.05,7,-5,-.55],[-1.05,1.05,-5,-2.95]];
  for(const [left,right,back,front] of decks){
   const slab=box(root,m.floor,(left+right)/2,2.86,(back+front)/2,right-left,.28,front-back);slab.name='upper-floor';
   box(root,m.rust,(left+right)/2,2.68,front,right-left,.13,.13);
  }
  for(const x of [-5.7,5.7])rod(root,m.dark,[x,0,-.6],[x,2.72,-.6],.12);
  // Edges have handrails, while side exits from the lift and the service ladder remain open.
  for(const [a,b] of [[-6.7,-3.6],[-2.4,-1.15],[1.15,6.7]]){
   rod(root,m.brass,[a,3.7,-.6],[b,3.7,-.6],.032);
   for(const x of [a,b])rod(root,m.rust,[x,3,-.6],[x,3.7,-.6],.04);
  }
  serviceLadder=group(root);serviceLadder.name='service-ladder';
  for(const x of [-3.32,-2.68])rod(serviceLadder,m.rust,[x,0,.55],[x,3,-.6],.04);
  for(let i=0;i<=10;i++){const t=i/10;rod(serviceLadder,m.brass,[-3.32,t*3,.55-t*1.15],[-2.68,t*3,.55-t*1.15],.024);}
 }
 if(theme==='rescue'){
  const platform=definition.components.find(c=>c.type==='Platform');const x=platform?.position?.x??0,z=platform?.position?.z??-1;
  for(const side of [-1.1,1.1])rod(root,m.rust,[x+side,0,z-.8],[x+side,4.6,z-.8],.09);
  rod(root,m.dark,[x-1.1,4.6,z-.8],[x+1.1,4.6,z-.8],.07);
 }
 if(theme==='alley'){
  const water=box(root,m.blue,.8,-.17,0,1.3,.05,10);water.name='alley-channel';water.material=m.blue.clone();water.material.roughness=.32;
  for(const x of [.15,1.45]){box(root,m.rust,x,-.15,0,.09,.3,10);box(root,m.brass,x,-.005,0,.055,.035,10);}
  // Crate rails run across the canal; their end stops communicate a permanent mechanical lock.
  for(const z of [-.62,.62]){rod(root,m.dark,[-2.1,-.025,z],[1.65,-.025,z],.035);box(root,m.rust,1.65,.08,z,.1,.2,.16);}
  for(const x of [-.05,1.7])box(root,m.wood,x,-.025,-2,.4,.06,1.1);
 }else if(theme==='water'){
  const water=box(root,m.blue,0,.012,0,12,.035,1.25);water.material=m.blue.clone();water.material.roughness=.35;
  for(const z of [-.72,.72])box(root,m.rust,0,.025,z,12,.07,.1);
 }
 if(theme==='square')for(const x of [-5.7,5.7])for(const z of [-3,3]){
  cylinder(root,m.rust,x,1,z,.06,2);box(root,m.dark,x,2,z,.35,.45,.3);
 }
 const barriers=group(scene),warning=m.rust.clone();warning.transparent=true;warning.opacity=.5;
 let last='',crateView=null;
 const crateConfig=definition.components.find(c=>c.id==='crate'&&c.visualScale);
 return {
  update(obstacles,world){
   if(serviceLadder){
    const deployed=!!world?.get('ladder')?.state.latched;serviceLadder.scale.y=deployed?1:.25;serviceLadder.position.y=deployed?0:2.25;
    if(!originalLadder)scene.traverse(o=>{if(!originalLadder&&o.userData.interaction==='ladder')originalLadder=o;});
    if(originalLadder){
     serviceLadder.visible=false;originalLadder.visible=true;originalLadder.rotation.x=-Math.atan2(1.15,3);
     originalLadder.scale.set(1,Math.hypot(3,1.15)/2*(deployed?1:.25),1);
     originalLadder.position.set(-3,deployed?0:2.25,deployed?.55:-.3125);
    }
   }
   // Apply a stage-owned visual override, retaining the shared crate behavior and moving node.
   if(crateConfig){
    if(!crateView)scene.traverse(o=>{if(!crateView&&o.userData.interaction==='crate')crateView=o;});
    if(crateView){const v=crateConfig.visualScale;crateView.scale.set(v.x,v.y,v.z);crateView.position.y=crateConfig.visualOffsetY??0;}
   }
   const key=JSON.stringify(obstacles);if(key===last)return;last=key;
   for(const mesh of [...barriers.children]){mesh.geometry.dispose();barriers.remove(mesh);}
   for(const o of obstacles)if(o.visible!==false&&theme!=='alley')box(barriers,warning,o.x,theme==='elevator'&&o.z<-.6?3.025:.025,o.z,o.w,.05,o.d);
  },root,barriers,
 };
}
