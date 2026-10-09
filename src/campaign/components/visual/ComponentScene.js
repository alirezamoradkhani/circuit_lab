import * as T from '../../engine/three.js';
import {ComponentView} from './ComponentView.js';
export class ComponentScene {
 constructor(parent,materials,world,audio=null){
  this.world=world;this.audio=audio;this.root=new T.Group();parent.add(this.root);
  this.views=new Map(world.all().map(e=>[e.id,new ComponentView(this.root,materials,e)]));
  this.beams=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color:'#e9cd79',transparent:true,opacity:.45}));this.root.add(this.beams);
 }
 update(dt,time){
  for(const [id,view] of this.views){view.update(dt,time,this.world);const e=view.entity;
   if(['Fan','Pump','Conveyor','Platform'].includes(e.kind))this.audio?.equipment(id,e.kind,dt>0&&e.state.powered?(e.strength??.6):0);
  }
  const points=this.world.systems.flatMap(s=>s.beams??[]).flatMap(b=>[b.from.x,.7,b.from.z,b.to.x,.7,b.to.z]);
  const key=JSON.stringify(points);
  if(key!==this.beamKey){this.beamKey=key;this.beams.geometry.dispose();this.beams.geometry=new T.BufferGeometry();this.beams.geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));}
 }
 dispose(){for(const [id,view] of this.views){this.audio?.equipment(id,'',0);view.dispose();}this.beams.geometry.dispose();this.beams.material.dispose();this.root.removeFromParent();}
}
