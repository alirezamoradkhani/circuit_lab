import * as T from '../engine/three.js';
export function mesh(parent,geometry,material,x=0,y=0,z=0){
  const object=new T.Mesh(geometry,material);object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
}
export const box=(p,m,x,y,z,w,h,d)=>mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);
export const cylinder=(p,m,x,y,z,r,h,r2=r)=>mesh(p,new T.CylinderGeometry(r,r2,h,16),m,x,y,z);
export const ball=(p,m,x,y,z,r)=>mesh(p,new T.SphereGeometry(r,12,8),m,x,y,z);
export function rod(p,m,from,to,r=.035){
  const a=new T.Vector3(...from),b=new T.Vector3(...to),v=b.clone().sub(a);
  const o=mesh(p,new T.CylinderGeometry(r,r,v.length(),8),m);
  o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
}
export function pipe(p,m,points,r=.06){
  const path=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)),false,'centripetal');
  return mesh(p,new T.TubeGeometry(path,Math.max(12,points.length*6),r,7,false),m);
}
export function ring(p,m,x,y,z,r=.18,thickness=.03){
  return mesh(p,new T.TorusGeometry(r,thickness,7,20),m,x,y,z);
}
export function group(parent,id){
  const g=new T.Group();if(id)g.userData.interaction=id;parent.add(g);return g;
}
export function socket(p,m,id,x,y,z){
  const g=group(p,id);ring(g,m.brass,x,y,z,.13,.04);
  cylinder(g,m.ink,x,y,z,.1,.065).rotation.x=Math.PI/2;
  const led=ball(g,m.light.clone(),x,y,z+.025,.045);led.userData.powerIndicator=id;return g;
}
