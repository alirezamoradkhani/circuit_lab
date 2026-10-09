import * as T from '../../engine/three.js';
import {box,cylinder,ball,rod,ring,group,socket,mesh} from '../../visual/shapes.js';
import {plaque} from '../../visual/materials.js';
function locate(root,position={x:0,y:0,z:0},origin=null){
 if(origin)for(const child of root.children)child.position.sub(new T.Vector3(...origin));
 root.position.set(position.x??0,position.y??0,position.z??0);
}
export function createCart(parent,m,{id='cart',position}={}){
  const cart=group(parent,id);
  box(cart,m.rust,0,.28,0,3.6,.14,1.35);
  for(const x of [-1.4,1.4])for(const z of [-.5,.5]){
    const wheel=cylinder(cart,m.dark,x,.15,z,.15,.13);wheel.rotation.x=Math.PI/2;
    ball(cart,m.brass,x,.15,z+.075,.048);
  }
  box(cart,m.wood,-.25,.82,0,1.4,.96,1.14);
  for(const y of [.45,.73,1.04,1.26])box(cart,m.dark,-.25,y,.575,1.42,.028,.016);
  box(cart,m.green,1.1,.64,-.15,.75,.6,.9);
  box(cart,m.blue,-1.25,.61,0,.65,.54,1.1);
  box(cart,m.brass,-.25,1.34,0,1.43,.05,1.15);
  for(const x of [-1.13,1.13])rod(cart,m.dark,[x,.3,.48],[x,1.36,.48],.035);
  rod(cart,m.dark,[-1.13,1.36,.48],[1.13,1.36,.48],.04);
  mesh(cart,new T.PlaneGeometry(.55,.37),plaque('↓'),-.25,.91,.59);
  locate(cart,position,null);return {root:cart};
}
export function createReel(parent,m,{id='reel',position}={}){
  const reel=group(parent,id);reel.position.set(-4.55,.48,-2.55);
  cylinder(reel,m.dark,0,0,0,.22,.43).rotation.x=Math.PI/2;
  for(const z of [-.23,.23])cylinder(reel,m.wood,0,0,z,.38,.045).rotation.x=Math.PI/2;
  locate(reel,position,null);return {root:reel};
}
export function createReceipt(parent,m,{id='receipt',position}={}){
  const receipt=group(parent,id);receipt.position.set(3.65,.065,2.85);receipt.rotation.x=-Math.PI/2;receipt.rotation.z=.24;
  box(receipt,m.paper,0,0,0,.37,.5,.01);
  for(let i=0;i<5;i++)box(receipt,m.wood,0,-.16+i*.065,.008,.27-(i%2)*.05,.013,.002);
  locate(receipt,position,null);return {root:receipt};
}
export function createLamp(parent,m,{id='lamp',position}={}){
  const lamp=group(parent,id);
  cylinder(lamp,m.green,4.1,1.2,1.05,.29,.06);
  rod(lamp,m.brass,[4.1,1.23,1.05],[4.3,1.88,.9],.033);
  rod(lamp,m.brass,[4.3,1.88,.9],[3.9,2.2,1.12],.035);
  ball(lamp,m.rust,4.3,1.88,.9,.075);
  const shade=cylinder(lamp,m.green,3.9,2.12,1.12,.12,.3,.31);shade.rotation.z=-.22;
  const bulb=ball(lamp,m.light,3.87,1.97,1.12,.1);bulb.material=m.light.clone();
  socket(lamp,m,id,4.1,1.48,1.36);
  const light=new T.PointLight('#ffca79',0,6,2);light.position.set(3.8,1.9,1.5);lamp.add(light);
  locate(lamp,position,[4.1,1.2,1.05]);return {root:lamp,bulb,light};
}
export function createRadio(parent,m,{id='radio',position}={}){
  const radio=group(parent,id);box(radio,m.wood,5.25,1.45,1.05,.76,.57,.38);
  box(radio,m.dark,5.07,1.49,1.253,.29,.35,.02);
  for(let i=0;i<6;i++)box(radio,m.brass,4.95+i*.047,1.49,1.273,.014,.3,.012);
  cylinder(radio,m.brass,5.46,1.56,1.29,.055,.035).rotation.x=Math.PI/2;
  const dial=box(radio,m.glass,5.44,1.39,1.263,.25,.07,.025);dial.material=m.glass.clone();
  rod(radio,m.dark,[5.5,1.73,1.05],[5.65,2.2,1.05],.012);
  socket(radio,m,id,5.25,1.24,1.35);
  locate(radio,position,[5.25,1.45,1.05]);return {root:radio,dial};
}
