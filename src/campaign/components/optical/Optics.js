import {Entity} from '../core/Entity.js';
import {Lamp} from '../electrical/Loads.js';
export class BeamLamp extends Lamp {
  constructor(o={}){super({watts:6,...o});this.state.direction=o.direction??0;this.initial=structuredClone(this.state);}
  act(action,value){if(action==='direction'&&Number.isFinite(value)){this.state.direction=value;return true;}return super.act(action,value);}
}
export class Mirror extends Entity {
  constructor(o={}){super(o,{angle:o.angle??0});}
  act(action,value){if(action!=='rotate'||!Number.isFinite(value))return false;this.state.angle=value;return true;}
}
export class LightSensor extends Entity {constructor(o={}){super(o,{lit:false});}}
export class Fog extends Entity {
  constructor(o={}){super(o,{cleared:false});}
  update(dt,world){this.state.cleared=(world.get(this.config.fan)?.strength??0)>=(this.config.threshold??.5);}
}
const cross=(a,b)=>a.x*b.z-a.z*b.x;
function segmentHit(origin,dir,a,b){
 const line={x:b.x-a.x,z:b.z-a.z},offset={x:a.x-origin.x,z:a.z-origin.z},den=cross(dir,line);
 if(Math.abs(den)<1e-8)return null;
 const t=cross(offset,line)/den,u=cross(offset,dir)/den;
 return t>.0001&&u>=0&&u<=1?t:null;
}
export class OpticsSystem {
  constructor(){this.beams=[];}
  update(world){
    this.beams=[];const all=world.all(),sensors=all.filter(e=>e instanceof LightSensor);
    sensors.forEach(s=>s.state.lit=false);
    const surfaces=[];
    for(const e of all){
      if(e instanceof Mirror){const p=e.state.position,l=(e.config.length??1)/2,a=e.state.angle;
        surfaces.push({entity:e,a:{x:p.x-Math.cos(a)*l,z:p.z-Math.sin(a)*l},b:{x:p.x+Math.cos(a)*l,z:p.z+Math.sin(a)*l}});
      }else if(e.config.blocksLight&&!(e instanceof Fog&&e.state.cleared)) surfaces.push({entity:e,a:e.config.from,b:e.config.to});
    }
    for(const lamp of all.filter(e=>e instanceof BeamLamp&&e.state.powered)){
      const rays=lamp.config.rays??9,spread=lamp.config.spread??.35;
      for(let i=0;i<rays;i++){
        let angle=lamp.state.direction+(rays===1?0:(i/(rays-1)-.5)*spread),origin={...lamp.state.position},strength=1;
        let dir={x:Math.cos(angle),z:Math.sin(angle)};
        for(let bounce=0;bounce<=(lamp.config.reflections??2);bounce++){
          let length=lamp.config.range??20,hit=null;
          for(const surface of surfaces){if(!surface.a||!surface.b)continue;const d=segmentHit(origin,dir,surface.a,surface.b);if(d!==null&&d<length){length=d;hit=surface;}}
          for(const sensor of sensors){const p=sensor.state.position,dx=p.x-origin.x,dz=p.z-origin.z,t=dx*dir.x+dz*dir.z;
            if(t>=0&&t<length&&Math.abs(dx*dir.z-dz*dir.x)<=(sensor.config.radius??.25)&&strength>=(sensor.config.threshold??.3))sensor.state.lit=true;
          }
          const end={x:origin.x+dir.x*length,z:origin.z+dir.z*length};this.beams.push({from:origin,to:end,strength});
          if(!(hit?.entity instanceof Mirror))break;
          const a=hit.entity.state.angle,normal={x:-Math.sin(a),z:Math.cos(a)},dot=dir.x*normal.x+dir.z*normal.z;
          dir={x:dir.x-2*dot*normal.x,z:dir.z-2*dot*normal.z};origin={x:end.x+dir.x*.001,z:end.z+dir.z*.001};strength*=.8;
        }
      }
    }
  }
}
