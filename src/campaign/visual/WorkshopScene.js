import * as T from '../engine/three.js';
import {makeMaterials} from './materials.js';
import {buildRoom} from './WorkshopRoom.js';
import {buildProps} from './WorkshopProps.js';
import {characterAsset} from '../components/visual/CharacterAssets.js';
import {animateRobot} from './Robot.js';
import {pipe,ring} from './shapes.js';
import {cartPosition,portPosition,interactionPosition} from '../workshop/layout.js';
import {powered} from '../workshop/electricity.js';
export class WorkshopScene {
  constructor(host){
    this.host=host;this.scene=new T.Scene();this.scene.background=new T.Color('#72796b');
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.22;
    this.renderer.domElement.setAttribute('aria-label','تعمیرگاه سه‌بعدی رِی؛ برای حرکت روی زمین بزن');
    this.renderer.domElement.tabIndex=0;host.prepend(this.renderer.domElement);
    this.camera=new T.OrthographicCamera(-10,10,7,-7,.1,100);this.cameraOffset=new T.Vector3(8,13,19);
    this.cameraTarget=new T.Vector3(0,1,-.3);this.raycaster=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);
    this.materials=makeMaterials();this.room=buildRoom(this.scene,this.materials);this.props=buildProps(this.scene,this.materials);
    this.indicators=[];this.scene.traverse(o=>{if(o.userData.powerIndicator)this.indicators.push(o);});
    this.ray=characterAsset(this.scene,this.materials,{id:'ray',kind:'Actor',config:{}});this.pakro=characterAsset(this.scene,this.materials,{id:'pakro',kind:'Companion',config:{}});
    this.scene.add(new T.HemisphereLight('#e4e5cc','#555246',2.7));
    const sun=new T.DirectionalLight('#ffe0a7',3.0);sun.position.set(-5,9,5);sun.castShadow=true;
    Object.assign(sun.shadow.camera,{left:-10,right:10,top:9,bottom:-9,near:.1,far:35});
    sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;this.scene.add(sun);
    this.scene.add(new T.AmbientLight('#a6b7b1',.5));
    this.cables=new T.Group();this.scene.add(this.cables);this.wireKey='';
    this.marker=ring(this.scene,this.materials.brass,0,.07,0,.27,.017);this.marker.rotation.x=-Math.PI/2;this.marker.visible=false;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
  }
  resize(){
    this.width=this.host.clientWidth;this.height=this.host.clientHeight;
    if(!this.width||!this.height)return;
    this.mobile=this.width<680||this.height<480;this.renderer.setSize(this.width,this.height,false);
    const aspect=this.width/this.height;
    const half=this.mobile&&!this.overview?(this.height<480?4.6:6.7):Math.max(7.1,9.4/aspect);
    Object.assign(this.camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});
    this.camera.updateProjectionMatrix();
  }
  toggleOverview(){this.overview=!this.overview;this.resize();}
  project(id,s){
    const p=interactionPosition(id,s);if(!p)return null;
    const v=new T.Vector3(p.x,p.y+.24,p.z).project(this.camera);
    return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<.96&&Math.abs(v.y)<.93};
  }
  pick(clientX,clientY){
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),this.camera);
    const hits=this.raycaster.intersectObjects(this.scene.children,true);
    for(const hit of hits){
      let node=hit.object;
      while(node){if(node.userData.interaction)return {id:node.userData.interaction};node=node.parent;}
      if(!hit.object.material?.transparent)break;
    }
    const p=this.raycaster.ray.intersectPlane(this.plane,new T.Vector3());
    return p?{point:{x:p.x,z:p.z}}:{};
  }
  updateCables(s){
    const key=JSON.stringify([s.connections,s.charging,Math.round(s.player.x*50),Math.round(s.player.z*50),s.energy>0]);
    if(key===this.wireKey)return;this.wireKey=key;
    for(const child of [...this.cables.children]){child.geometry.dispose();this.cables.remove(child);}
    const pairs=Object.entries(s.connections).filter(([,source])=>source).map(([id,source])=>[source,id]);
    if(s.charging)pairs.push(['mains','battery']);
    for(const [source,id] of pairs){
      const a=portPosition(source,s),b=portPosition(id,s);let points;
      if(source==='mains'&&id!=='battery'){
        points=[[a.x,a.y,a.z+.1],[a.x,.09,-2],[-1,.075,-2],[b.x,.12,b.z+.3],[b.x,b.y,b.z+.08]];
      }else points=[[a.x,a.y,a.z+.06],[(a.x+b.x)/2,.15,(a.z+b.z)/2+.2],[b.x,b.y,b.z+.06]];
      pipe(this.cables,source==='mains'||s.energy>0?this.materials.live:this.materials.cable,points,.032);
    }
  }
  render(s,time,moving,intro=9,selected=null,dt=.016){
    const p=cartPosition(s);this.props.cart.position.set(p.x,0,p.z);
    this.props.reel.visible=!s.reel;this.props.receipt.visible=!s.receipt&&intro>1;
    const open=s.door||(intro>0&&intro<4.3);
    if(this.doorAmount===undefined)this.doorAmount=open?1:0;
    this.doorAmount=T.MathUtils.damp(this.doorAmount,open?1:0,5,dt);
    this.room.curtain.scale.y=Math.max(.015,1-this.doorAmount);
    this.room.curtain.position.y=3.08*this.doorAmount;
    this.props.bulb.material.emissiveIntensity=powered(s,'lamp')?2.7:0;
    this.props.bulb.material.color.set(powered(s,'lamp')?'#ffe5ab':'#646853');
    for(const led of this.indicators){const on=led.userData.powerIndicator==='mains'||powered(s,led.userData.powerIndicator);led.material.emissiveIntensity=on?1.5:0;led.material.color.set(on?'#edd7a0':'#4d5546');}
    this.props.light.intensity=powered(s,'lamp')?14:0;
    this.props.dial.material.emissiveIntensity=powered(s,'radio')?1.2:0;
    this.props.dial.material.color.set(powered(s,'radio')?'#b4cc90':'#565e4e');
    const previous=this.ray.root.position.clone();this.ray.root.position.set(s.player.x,0,s.player.z);
    const dx=s.player.x-previous.x,dz=s.player.z-previous.z;
    if(moving&&(Math.abs(dx)+Math.abs(dz))>.0001){
      const desired=Math.atan2(dx,dz);
      const diff=T.MathUtils.euclideanModulo(desired-this.ray.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;
      this.ray.root.rotation.y+=diff*Math.min(1,dt*14);
    }
    animateRobot(this.ray,time,moving,powered(s,'lamp')&&s.connections.lamp==='battery'&&!moving);
    this.pakro.root.visible=intro<4.6;
    const t=Math.min(1,Math.max(0,(intro-.45)/3.3));
    const hop=t>.22&&t<.62?Math.sin((t-.22)/.4*Math.PI)*1.4:0;
    this.pakro.root.position.set(4.6+(2.35-4.6)*t,hop,2.25-7*t);this.pakro.root.rotation.y=Math.PI+.12;
    animateRobot(this.pakro,time,t>0&&t<1);
    const target=this.mobile&&!this.overview?new T.Vector3(T.MathUtils.clamp(s.player.x*.78,-3.4,3.4),.8,s.player.z*.26-.3):new T.Vector3(0,1,-.3);
    this.cameraTarget.lerp(target,Math.min(1,dt*5));
    this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);this.camera.lookAt(this.cameraTarget);this.camera.updateMatrixWorld();
    const pos=selected&&interactionPosition(selected,s);this.marker.visible=!!pos;
    if(pos)this.marker.position.set(pos.x,.06,pos.z);
    this.updateCables(s);this.renderer.render(this.scene,this.camera);
  }
  dispose(){
    this.resizeObserver.disconnect();const geometries=new Set(),materials=new Set(),textures=new Set();
    this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of [o.material].flat())materials.add(m);});
    for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}
    for(const g of geometries)g.dispose();for(const t of textures)t.dispose();
    this.renderer.dispose();this.renderer.domElement.remove();
  }
}
