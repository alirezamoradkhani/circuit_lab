import {Entity} from '../core/Entity.js';
const clamp = n => n < 1e-8 ? 0 : n > 1 - 1e-8 ? 1 : n;
export class Prop extends Entity {
  constructor(o = {}) { super(o, {holder: null, collected: false, locked: false, progress: o.progress ?? 0}); }
  carry(holder) { if (this.state.locked || this.state.holder) return false; this.state.holder = holder; return true; }
  drop(position) { if (this.state.locked) return false; this.state.holder = null; this.state.position = {...position}; return true; }
  collect() { if (this.config.collectible === false) return false; this.state.collected = true; this.state.visible = false; return true; }
  update(dt, world) {
    const holder = world?.get(this.state.holder);
    if (holder) this.state.position = holder.attachmentPosition?.(this) ?? {...holder.state.position, y: holder.state.position.y + (this.config.carryHeight ?? .8)};
  }
}
export class RailCrate extends Prop {
  constructor(o={}){super({...o,position:o.position??o.from});}
  advance(amount) {
    if (this.state.locked) return;
    this.state.progress = clamp(this.state.progress + amount);
    const a = this.config.from ?? this.initial.position, b = this.config.to ?? a;
    this.state.position = Object.fromEntries(['x','y','z'].map(k => [k, (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * this.state.progress]));
    if (this.state.progress >= 1 && this.config.lockAtEnd !== false) this.state.locked = true;
  }
  update(dt, world) {
    super.update(dt, world);
    if(this.state.holder||this.state.collected)return;
    const fan = world?.get(this.config.fan);
    if (fan?.strength >= (this.config.threshold ?? 1) && fan.state.direction === (this.config.windDirection ?? 0))
      this.advance(dt / (this.config.travelSeconds ?? 4));
  }
  act(action, value) { if (action !== 'push') return false; this.advance(value ?? .25); return true; }
}
export class Cart extends RailCrate {}
export class WaterBasin extends Entity {
  constructor(o = {}) { super(o, {level: o.level ?? 1}); }
  drain(amount) { this.state.level = clamp(this.state.level - Math.max(0, amount)); }
  get band() { return this.state.level <= 0 ? 0 : this.state.level < .34 ? 1 : this.state.level < .67 ? 2 : 3; }
}
export class PressurePlate extends Entity {
  constructor(o = {}) { super(o, {pressed: false}); }
  update(dt, world) {
    this.state.pressed = world.all().some(e => e !== this && !e.state.collected && !e.state.holder &&
      (e.config.weight ?? 0) >= (this.config.minWeight ?? 1) &&
      Math.hypot(e.state.position.x - this.state.position.x, e.state.position.z - this.state.position.z) <= (this.config.radius ?? .6) &&
      Math.abs(e.state.position.y - this.state.position.y) < .4);
  }
}
export class Jack extends Prop {
  act(action) { if (action !== 'deploy' || this.state.holder) return false; this.state.locked = true; return true; }
}
export class Door extends Entity {
  constructor(o = {}) { super(o, {amount: 0, latched: false, blocked: false}); }
  act(action) { if (action !== 'latch') return false; this.state.latched = true; return true; }
  update(dt, world) {
    const trigger = world?.get(this.config.trigger), jack = world?.get(this.config.jack);
    const open = this.state.latched || trigger?.state.complete || trigger?.state.pressed || trigger?.state.lit || trigger?.state.powered || jack?.state.locked;
    if (this.state.blocked && !open) return;
    this.state.amount = clamp(this.state.amount + (open ? 1 : -1) * dt / (this.config.seconds ?? 1));
  }
}
export class Ladder extends Door {}
export class Canopy extends Door {}
export class Bridge extends Door {}

export class WindProp extends RailCrate {
  update(dt,world){
    const fan=world?.get(this.config.fan);
    if(this.state.holder||this.state.collected)return;
    super.update(dt,world);
    if(fan?.strength>0&&!this.state.locked)this.state.position.y+=(this.config.flutter??.08)*Math.sin(this.state.progress*Math.PI*6);
  }
}
