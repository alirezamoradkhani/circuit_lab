import {Entity} from '../core/Entity.js';
export class Actor extends Entity {
  constructor(o = {}) { super({weight: 1, ...o}, {mode: 'idle', waypoint: 0, waiting: false, expression: 'neutral'}); }
  walkTo(target, dt, world) {
    const goal=target,p0=this.state.position;
    if(world?.findPath){
      const key=JSON.stringify([Math.round(goal.x*5),Math.round(goal.z*5)]);
      if(key!==this.pathKey||!this.path?.length){this.pathKey=key;this.path=world.findPath(p0,goal,this);}
      while(this.path?.length&&Math.hypot(this.path[0].x-p0.x,this.path[0].z-p0.z)<.07)this.path.shift();
      if(this.path?.length)target=this.path[0];
      else if(Math.hypot(goal.x-p0.x,goal.z-p0.z)>.1){this.state.waiting=true;return false;}
    }
    const p = this.state.position, d = Math.hypot(target.x-p.x, target.z-p.z), step = Math.min(d, (this.config.speed ?? 1.4) * dt);
    if (d < .03) return Math.hypot(goal.x-p.x,goal.z-p.z)<.1;
    const next = {...p, x:p.x+(target.x-p.x)*step/d, z:p.z+(target.z-p.z)*step/d};
    this.state.waiting = world?.canWalk ? !world.canWalk(next, this) : false;
    if (!this.state.waiting) this.state.position = next;else this.path=null;
    return false;
  }
}
export class Companion extends Actor {
  act(action, id) {
    if (!['follow','stay'].includes(action)) return false;
    this.state.mode = action; this.state.follow = action === 'follow' ? id : null; return true;
  }
  update(dt, world) {
    const target = world?.get(this.state.follow);
    if (this.state.mode === 'follow' && target && Math.hypot(target.state.position.x-this.state.position.x,target.state.position.z-this.state.position.z) > (this.config.spacing ?? .7))
      this.walkTo(target.state.position, dt, world);
  }
}
export class Guard extends Actor {
  constructor(o={}){super(o);Object.assign(this.state,{dwell:0,cooldown:0});this.initial=structuredClone(this.state);}

  update(dt, world) {
    const litter = world?.get(this.config.litter), charger = world?.get(this.config.charger);
    this.state.cooldown=Math.max(0,this.state.cooldown-dt);
    const active = litter?.state.visible && !litter.state.collected ? litter : charger?.state.powered&&this.state.cooldown===0 ? charger : null;
    const route = this.config.route ?? [];
    this.state.mode = active === litter && active ? 'cleaning' : active ? 'charging' : 'patrol';
    const target = active?.state.position ?? route[this.state.waypoint];
    if (target && this.walkTo(target,dt,world)) {
      if(!active)this.state.waypoint=(this.state.waypoint+1)%route.length;
      else {this.state.dwell+=dt;if(this.state.dwell>=(this.config.dwell??4)){if(active===litter)litter.collect();else this.state.cooldown=this.config.cooldown??8;this.state.dwell=0;}}
    }else this.state.dwell=0;
  }
}
export class PathRide extends Entity {
  constructor(o = {}) { super(o, {active: false, elapsed: 0, complete: false}); }
  act(action) { if (action !== 'start') return false; this.state.active=true;this.state.elapsed=0;this.state.complete=false;return true; }
  update(dt, world) {
    if (!this.state.active) return;
    const actor=world.get(this.config.actor), points=this.config.points;
    if (!actor || !points || points.length<2) return;
    this.state.elapsed=Math.min(this.config.duration??2,this.state.elapsed+dt);
    const t=this.state.elapsed/(this.config.duration??2), f=t*(points.length-1), i=Math.min(points.length-2,Math.floor(f)), local=f-i;
    for (const k of ['x','y','z']) actor.state.position[k]=(points[i][k]??0)+((points[i+1][k]??0)-(points[i][k]??0))*local;
    if(t===1){this.state.active=false;this.state.complete=true;world.emit('arrival',this.id);}
  }
}
