import * as T from '../engine/three.js';
import {WorkshopScene} from './WorkshopScene.js';
import {RepairBench,CABINET} from './RepairBench.js';
export class RepairWorkshopScene extends WorkshopScene {
 constructor(host){super(host);this.repairBench=new RepairBench(this.scene,this.materials);this.repairCamera=new T.OrthographicCamera(-2,2,1.6,-1.6,.1,50);this.repairCamera.position.set(CABINET.x,CABINET.y,CABINET.z+4);this.repairCamera.lookAt(CABINET.x,CABINET.y,CABINET.z);}
 resize(){super.resize();if(this.repairCamera)this.resizeRepair();}
 resizeRepair(){
  const aspect=this.width/this.height,side=this.width>=850?Math.min(310,this.width*.25):0;
  const halfH=this.width<850?Math.max(1.65,1.65/aspect):Math.max(1.4,1.5/aspect);
  const halfW=halfH*aspect;
  Object.assign(this.repairCamera,{left:-halfW+side/this.width*halfW,right:halfW+side/this.width*halfW,top:halfH-(this.width<650?halfH*.33:0),bottom:-halfH-(this.width<650?halfH*.33:0)});this.repairCamera.updateProjectionMatrix();
 }
 project(id,s){if(id==='cabinet'){const v=new T.Vector3(CABINET.x,CABINET.y,CABINET.z).project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height,visible:Math.abs(v.x)<.96&&Math.abs(v.y)<.93};}return super.project(id,s);}
 pick(x,y){
  if(!this.benchOpen){const result=super.pick(x,y);return result;}
  const rect=this.renderer.domElement.getBoundingClientRect();
  for(const id of Object.keys(this.repairBench.pins)){const p=this.pinScreen(id);if(Math.hypot(x-rect.left-p.x,y-rect.top-p.y)<18)return {id:'repair-pin:'+id};}
  this.raycaster.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),this.repairCamera);
  for(const hit of this.raycaster.intersectObject(this.repairBench.root,true)){let n=hit.object;if(!n.visible)continue;let visible=true;for(let a=n.parent;a;a=a.parent)if(!a.visible)visible=false;if(!visible)continue;while(n){if(n.userData.interaction)return {id:n.userData.interaction};n=n.parent;}}
  return {};
 }
 pinScreen(id){const v=this.repairBench.pinWorld(id).project(this.repairCamera);return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height};}
 render(s,time,moving,intro,selected,dt){
  super.render(s,time,moving,intro,selected==='cabinet'?null:selected,dt);
  this.benchOpen=!!this.editing;this.repairBench.update(s,{open:this.benchOpen,start:this.cableStart,hovered:this.hovered,selected:this.repairSelected});
  if(this.benchOpen){this.resizeRepair();const hidden=[];for(const node of this.scene.children){if(node!==this.repairBench.root&&!node.isLight&&node.visible){hidden.push(node);node.visible=false;}}this.renderer.render(this.scene,this.repairCamera);for(const node of hidden)node.visible=true;}
 }
 dispose(){this.repairBench.dispose();super.dispose();}
}
