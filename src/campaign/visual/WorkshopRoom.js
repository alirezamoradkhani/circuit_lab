import * as T from '../engine/three.js';
import {box,cylinder,ball,rod,pipe,ring,group,socket,mesh} from './shapes.js';
import {plaque} from './materials.js';
function wallDetails(root,m){
  for(let x=-6;x<6.5;x+=1.2){
    if(x>1&&x<3.6)continue;
    box(root,m.wood,x,.48,-4.78,1.14,.8,.05);
    for(const y of [.15,.8])ball(root,m.dark,x,y,-4.73,.025);
  }
  pipe(root,m.rust,[[-6.35,3.65,3.8],[-6.35,3.65,-4.5],[-4.3,3.65,-4.5],[-4.3,1.7,-4.5]],.075);
  pipe(root,m.blue,[[6.2,.1,-4.6],[6.2,4.1,-4.6],[-1,4.1,-4.6],[-1,2.8,-4.6]],.055);
  for(const x of [-5.4,-3.4,-1.4,4.2,5.8])box(root,m.brass,x,4.13,-4.6,.12,.23,.13);
  const clock=group(root);cylinder(clock,m.rust,-1.8,2.9,-4.62,.48,.12).rotation.x=Math.PI/2;
  cylinder(clock,m.paper,-1.8,2.9,-4.53,.41,.035).rotation.x=Math.PI/2;
  rod(clock,m.dark,[-1.8,2.9,-4.49],[-1.8,3.2,-4.49],.018);
  rod(clock,m.dark,[-1.8,2.9,-4.48],[-1.58,2.78,-4.48],.022);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ball(clock,m.dark,-1.8+Math.sin(a)*.35,2.9+Math.cos(a)*.35,-4.48,.017);}
  mesh(root,new T.PlaneGeometry(2.2,.46),plaque('تعمیرگاه نورا'),-4.5,4.05,-4.55);
  mesh(root,new T.PlaneGeometry(1.5,.4),plaque('R–7  /  SERVICE'),4.9,3.55,-4.57);
}
function buildWindow(root,m){
  box(root,m.dark,-6.5,2.6,-.3,.16,2.65,2.25);
  box(root,m.glass,-6.39,2.6,-.3,.025,2.37,1.98);
  for(const z of [-1.34,-.3,.74])box(root,m.rust,-6.34,2.6,z,.12,2.55,.075);
  for(const y of [1.36,2.6,3.85])box(root,m.rust,-6.34,y,-.3,.12,.07,2.2);
  box(root,m.wood,-6.28,1.3,-.3,.48,.12,2.4);
  const beamMat=new T.MeshBasicMaterial({color:'#f2dca0',transparent:true,opacity:.035,depthWrite:false,side:T.DoubleSide});
  const beam=new T.Mesh(new T.PlaneGeometry(5.7,1.7),beamMat);
  beam.rotation.set(-.68,0,-.35);beam.position.set(-3.6,1.25,0);root.add(beam);
}
function furniture(root,m){
  const rack=group(root);
  for(const x of [-6.3,-3.2])for(const z of [-4.5,-3.75])box(rack,m.rust,x,1.1,z,.075,2.2,.075);
  for(const y of [.35,1.05,1.85])box(rack,m.wood,-4.75,y,-4.12,3.2,.09,.84);
  for(let i=0;i<8;i++){
    const x=-5.9+(i%4)*.74,z=-4.12,y=i<4?.66:1.38;
    box(rack,i%2?m.green:m.rust,x,y,z,.52,.5,.48);
    box(rack,m.paper,x,y,z+.25,.22,.17,.012);
  }
  for(const [x,w] of [[-4.7,3.5],[3.9,6]]){
    box(root,m.green,x,.52,-.65,w,1.04,1.35);
    box(root,m.wood,x,1.09,-.65,w+.08,.1,1.43);
    for(let a=x-w/2+.35;a<x+w/2;a+=.65){box(root,m.dark,a,.54,.04,.025,.75,.02);box(root,m.brass,a+.15,.79,.055,.14,.04,.035);}
  }
  const desk=group(root);
  box(desk,m.wood,4.75,1.08,1.08,3.2,.16,1.15);
  for(const x of [3.35,6.15])for(const z of [.7,1.45])box(desk,m.dark,x,.54,z,.1,1.08,.1);
  box(desk,m.green,5.65,.73,1.08,.75,.6,.88);
  box(desk,m.brass,5.65,.8,1.55,.19,.04,.04);
  for(let i=0;i<3;i++)rod(root,m.rust,[3.6+i*.16,1.18,.9],[3.75+i*.16,1.18,1.1],.025);
  const cabinet=group(root);
  box(cabinet,m.blue,5.8,1.0,-3.5,.8,2,1.5);
  for(const y of [.4,1,1.6]){
    box(cabinet,m.dark,5.8,y,-2.72,.67,.035,.02);
    box(cabinet,m.brass,5.8,y+.15,-2.69,.21,.045,.04);
  }
  const stool=group(root);
  cylinder(stool,m.wood,5.7,.46,3.15,.36,.12);
  for(const [x,z] of [[5.45,3],[5.95,3],[5.7,3.4]])rod(stool,m.rust,[5.7,.45,3.15],[x,.03,z],.04);
}
export function buildRoom(scene,m){
  const root=group(scene);box(root,m.dark,0,-.23,-.1,13.7,.45,10);
  box(root,m.floor,0,0,-.1,13.4,.06,9.8);
  for(let x=-6;x<=6;x+=1.2)box(root,m.dark,x,.033,-.1,.014,.004,9.6);
  for(let z=-4.3;z<4.8;z+=1.15)box(root,m.dark,0,.034,z,13.35,.004,.013);
  box(root,m.plaster,-2.83,2.45,-4.9,7.96,4.9,.23);
  box(root,m.plaster,5.08,2.45,-4.9,3.44,4.9,.23);
  box(root,m.plaster,2.35,4.1,-4.9,2.4,1.6,.23);
  box(root,m.plaster,-6.8,2.45,-.1,.23,4.9,9.8);
  box(root,m.wood,0,.08,4.8,13.7,.16,.12);
  wallDetails(root,m);buildWindow(root,m);furniture(root,m);
  const door=group(root,'exit');
  box(door,m.ink,2.35,1.55,-4.83,2.36,3.1,.08);
  const curtain=group(door);
  for(let i=0;i<17;i++)box(curtain,i%3?m.green:m.blue,2.35,.1+i*.178,-4.68,2.12,.165,.11);
  for(const x of [1.2,3.5])box(door,m.rust,x,1.6,-4.57,.14,3.35,.2);
  const roll=cylinder(door,m.dark,2.35,3.27,-4.61,.19,2.5);roll.rotation.z=Math.PI/2;
  mesh(door,new T.PlaneGeometry(1.3,.36),plaque('خروج'),2.35,3.8,-4.54);
  const latch=group(root,'latch');
  box(latch,m.blue,.75,1.1,-4.32,.57,.75,.28);
  socket(latch,m,'latch',.75,1.1,-4.15);
  pipe(root,m.rust,[[.75,1.5,-4.31],[.75,2.05,-4.31],[1.12,2.05,-4.31]],.028);
  mesh(root,new T.PlaneGeometry(.64,.24),plaque('۱۲V / ۶W'),.75,1.65,-4.28);
  const mains=group(root,'mains');
  box(mains,m.cream,-5.45,1.2,-3.6,.65,.8,.25);
  socket(mains,m,'mains',-5.45,1.2,-3.44);
  pipe(root,m.dark,[[-5.45,1.62,-3.65],[-5.45,2.5,-4.52],[-6.3,2.5,-4.52]],.035);
  mesh(root,new T.PlaneGeometry(.74,.23),plaque('۱۲V / ۲۴W'),-5.45,1.77,-3.48);
  // Track makes the cart's available motion visible before the player pushes it.
  for(const x of [-2.4,.4])box(root,m.rust,x,.045,.9,.055,.04,4.25);
  return {root,curtain};
}
