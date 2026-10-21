import * as T from '../engine/three.js';
import {mesh,box as plainBox} from '../visual/shapes.js';

// Local art settings: other scenes keep their original lights and materials.
export function configureCircuitAppearance(scene){
 const {renderer,materials:m}=scene;
 renderer.toneMappingExposure=1.05;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 const palette={dark:'#303d38',ink:'#20352f',green:'#567462',blue:'#427d7c',cream:'#e8dfc5',wood:'#c5a477',rust:'#a86e4b',brass:'#ceaa68'};
 for(const [name,color] of Object.entries(palette)){
  const material=m[name];material.color.set(color);material.map=null;material.bumpMap=null;material.bumpScale=0;
  material.roughness=name==='brass'?.34:name==='blue'?.42:.67;material.metalness=name==='brass'?.52:name==='dark'?.18:.08;material.needsUpdate=true;
 }
 scene.scene.traverse(o=>{
  if(o.isHemisphereLight){o.color.set('#eff5ef');o.groundColor.set('#49594f');o.intensity=1.75;}
  if(o.isAmbientLight){o.color.set('#dbe8e6');o.intensity=.3;}
  if(o.isDirectionalLight){o.color.set('#fff1dd');o.intensity=2.3;o.position.set(-3,9,4);o.shadow.mapSize.set(2048,2048);o.shadow.normalBias=.014;o.shadow.bias=-.00015;}
 });
 const fill=new T.DirectionalLight('#b9d9e3',.75);fill.position.set(5,5,-4);scene.scene.add(fill);
}

export function substrateMaterial(renderer){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
 const c=canvas.getContext('2d'),pixels=c.createImageData(1024,1024);let seed=7919;
 for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=247+(seed%9);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=n;pixels.data[i+3]=255;}
 c.putImageData(pixels,0,0);
 const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(14,11);map.colorSpace=T.SRGBColorSpace;map.anisotropy=renderer.capabilities.getMaxAnisotropy();
 return new T.MeshStandardMaterial({color:'#5b715c',map,roughness:.8,metalness:.06});
}

export function plaque(text){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=200;const c=canvas.getContext('2d');
 c.fillStyle='#e0ddc9';c.fillRect(0,0,1024,200);c.strokeStyle='#7c8b74';c.lineWidth=3;c.strokeRect(5,5,1014,190);
 c.fillStyle='#26392f';c.textAlign='center';c.textBaseline='middle';c.direction=/[\u0600-\u06ff]/.test(text)?'rtl':'ltr';c.font='600 108px Tahoma';c.fillText(text,512,104,974);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=16;
 return new T.MeshBasicMaterial({map,side:T.DoubleSide,toneMapped:false});
}

export const cylinder=(parent,material,x,y,z,r,h,r2=r)=>mesh(parent,new T.CylinderGeometry(r,r2,h,40),material,x,y,z);
export const ball=(parent,material,x,y,z,r)=>mesh(parent,new T.SphereGeometry(r,32,20),material,x,y,z);
export function box(parent,material,x,y,z,w,h,d){
 if(Math.min(w,h,d)<.075||Math.max(w,h,d)>3)return plainBox(parent,material,x,y,z,w,h,d);
 const bevel=Math.min(w,h,d)*.11,shape=new T.Shape();
 shape.moveTo(-w/2+bevel,-h/2+bevel);shape.lineTo(w/2-bevel,-h/2+bevel);shape.lineTo(w/2-bevel,h/2-bevel);shape.lineTo(-w/2+bevel,h/2-bevel);shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth:d-2*bevel,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel,curveSegments:3});geometry.translate(0,0,-d/2+bevel);
 return mesh(parent,geometry,material,x,y,z);
}
