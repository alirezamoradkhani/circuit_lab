import * as T from '../engine/three.js';
import {ring} from './shapes.js';
// World-space cues explain physical effects without adding floating action menus.
export class SceneFeedback {
 constructor(scene,session){
  this.session=session;this.root=new T.Group();scene.add(this.root);
  this.hover=ring(this.root,new T.MeshBasicMaterial({color:'#eddaa5'}),0,.04,0,.55,.022);this.hover.rotation.x=-Math.PI/2;
  this.fans=new Map();this.guards=new Map();
  for(const e of session.world.all()){
   if(e.kind==='Fan'){const arrow=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(),1.8,0xdad2a1,.35,.22);this.root.add(arrow);this.fans.set(e.id,arrow);}
   if(e.kind==='Guard'){const arrow=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(),1,0xdeb376,.3,.22);this.root.add(arrow);this.guards.set(e.id,arrow);}
  }
 }
 update(interactions,time){
  const w=this.session.world,e=w.get(interactions.hovered);
  this.hover.visible=!!e&&e.state.visible&&!e.state.collected;if(e)this.hover.position.set(e.state.position.x,e.state.position.y+.04,e.state.position.z);
  for(const [id,arrow]of this.fans){
   const fan=w.get(id),p=fan.state.position,aim=fan.config.windTargets?.[fan.state.direction];
   const affected=w.all().find(o=>o.config.fan===id&&(o.config.windDirection??0)===fan.state.direction);
   const from=affected?.config.from,to=affected?.config.to;
   const direction=aim?new T.Vector3(aim.x-p.x,0,aim.z-p.z):from&&to?new T.Vector3(to.x-from.x,0,to.z-from.z):new T.Vector3(Math.sin(fan.directions[fan.state.direction]),0,Math.cos(fan.directions[fan.state.direction]));
   direction.normalize();arrow.setDirection(direction);arrow.position.set(p.x,p.y+.16,p.z);arrow.setLength(fan.state.powered?2.9+Math.sin(time*4)*.1:2.4,.3,.2);arrow.setColor(fan.state.powered?0x71e0cd:0xe1d7b0);arrow.visible=fan.state.visible;
  }
  for(const [id,arrow]of this.guards){
   const guard=w.get(id),mode=guard.state.mode,target=w.get(mode==='cleaning'?guard.config.litter:mode==='charging'?guard.config.charger:null),p=guard.state.position,q=target?.state.position;
   arrow.visible=!!q&&Math.hypot(q.x-p.x,q.z-p.z)>.6;
   if(q){arrow.position.set(p.x,p.y+.1,p.z);arrow.setDirection(new T.Vector3(q.x-p.x,0,q.z-p.z).normalize());arrow.setLength(Math.min(1.2,Math.hypot(q.x-p.x,q.z-p.z)),.25,.2);}
  }
 }
}
