import * as T from '../engine/three.js';
import {makeMaterials} from './materials.js';
import {pipe,ring} from './shapes.js';
import {ComponentScene} from '../components/visual/ComponentScene.js';
import {campaignEnvironment} from './CampaignEnvironment.js';
export class CampaignScene {
 constructor(host,session,audio){
  this.host=host;this.session=session;this.scene=new T.Scene();this.scene.background=new T.Color(session.definition.theme==='garden'?'#768475':'#797c6c');
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('aria-label',session.definition.title+'؛ برای حرکت روی زمین بزن');host.append(this.renderer.domElement);
  this.camera=new T.OrthographicCamera(-10,10,7,-7,.1,100);this.offset=new T.Vector3(8,13,19);this.target=new T.Vector3(0,.6,0);
  this.raycaster=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.materials=makeMaterials();
  this.environment=campaignEnvironment(this.scene,this.materials,session.definition);
  this.entities=new ComponentScene(this.scene,this.materials,session.world,audio);
  this.scene.add(new T.HemisphereLight('#ffe6b9','#495c51',2.7));const sun=new T.DirectionalLight('#ffdfa2',3);sun.position.set(-5,9,5);this.scene.add(sun);
  this.marker=ring(this.scene,this.materials.brass,0,.06,0,.3,.022);this.marker.rotation.x=-Math.PI/2;this.marker.visible=false;
  this.wires=new T.Group();this.scene.add(this.wires);this.wireKey='';this.overview=false;
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
 }
 resize(){
  this.width=this.host.clientWidth;this.height=this.host.clientHeight;if(!this.width||!this.height)return;
  this.mobile=this.width<680||this.height<480;const aspect=this.width/this.height;
  const half=this.mobile&&!this.overview?(this.height<300?2.8:this.height<480?4.8:6.2):Math.max(7.3,9.4/aspect);
  Object.assign(this.camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});this.camera.updateProjectionMatrix();this.renderer.setSize(this.width,this.height,false);
 }
 toggleOverview(){this.overview=!this.overview;this.resize();}
 project(id,labelHeight){
  const e=this.session.world.get(id);if(!e)return null;const carried=id==='battery'&&e.state.holder==='ray',p=carried?this.entities.views.get(id).root.position:e.state.position;
  if(carried&&typeof labelHeight!=='number')labelHeight=.4;
  const v=new T.Vector3(p.x,p.y+(typeof labelHeight==='number'?labelHeight:e.config.labelHeight??.85),p.z).project(this.camera);
  return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height,visible:Math.abs(v.x)<.98&&Math.abs(v.y)<.95&&v.z>-1&&v.z<1};
 }
 pick(clientX,clientY){
  const r=this.renderer.domElement.getBoundingClientRect();this.raycaster.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),this.camera);
  for(const hit of this.raycaster.intersectObjects(this.entities.root.children,true)){
   let node=hit.object;while(node){if(node.userData.interaction){const e=this.session.world.get(node.userData.interaction);if(e&&e.config.interactive!==false&&!e.config.hidden&&!e.state.collected&&e.state.visible)return {id:e.id==='ray'?'battery':e.id};}node=node.parent;}
  }
  this.plane.constant=-this.session.ray.state.position.y;
  const p=this.raycaster.ray.intersectPlane(this.plane,new T.Vector3());return p?{point:{x:p.x,z:p.z}}:{};
 }
 updateWires(){
  const w=this.session.world,pairs=[...w.connections].map(([id,c])=>[w.sourceFor(c)?.id,id]).filter(([id])=>id);
  const key=JSON.stringify(pairs.map(([a,b])=>[a,b,w.get(a).state.position,w.get(b).state.position,w.get(b).state.powered]));
  if(key===this.wireKey)return;this.wireKey=key;
  for(const child of [...this.wires.children]){child.geometry.dispose();this.wires.remove(child);}
  for(const [a,b] of pairs){const p=w.get(a).state.position,q=w.get(b).state.position;
   pipe(this.wires,w.get(b).state.powered?this.materials.live:this.materials.cable,[[p.x,p.y+.35,p.z],[(p.x+q.x)/2,.065,(p.z+q.z)/2+.25],[q.x,q.y+.25,q.z]],.026);
  }
 }
 render(time,dt,selected,moving){
  const s=this.session,ray=s.ray,p=ray.state.position;ray.state.mode=moving?'follow':'idle';this.entities.update(dt,time);
  for(const view of this.entities.views.values())if(view.entity.config.hidden)view.root.visible=false;
  const battery=this.entities.views.get('battery');if(battery){const carried=s.world.get('battery').state.holder==='ray';battery.root.scale.setScalar(carried?.45:1);if(carried){battery.root.visible=true;battery.root.position.set(p.x-.43,p.y+.55,p.z+.12);}}
  this.environment.update(s.definition.obstacles?.(s.world,s.ctx)??[],s.world);this.updateWires();
  const target=this.mobile&&!this.overview?new T.Vector3(T.MathUtils.clamp(p.x*.75,-4,4),.8+p.y*.3,p.z*.35):new T.Vector3(0,.7,0);
  this.target.lerp(target,Math.min(1,dt*7||1));this.camera.position.copy(this.target).add(this.offset);this.camera.lookAt(this.target);this.camera.updateMatrixWorld();
  const chosen=s.world.get(selected);this.marker.visible=!!chosen&&!chosen.state.collected;if(chosen)this.marker.position.set(chosen.state.position.x,chosen.state.position.y+.055,chosen.state.position.z);
  this.renderer.render(this.scene,this.camera);
 }
 dispose(){
  this.observer.disconnect();this.entities.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();
  this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)[o.material].flat().forEach(m=>materials.add(m));});Object.values(this.materials).forEach(m=>materials.add(m));
  for(const m of materials){Object.values(m).filter(v=>v?.isTexture).forEach(t=>textures.add(t));m.dispose();}geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());this.renderer.dispose();this.renderer.domElement.remove();
 }
}
