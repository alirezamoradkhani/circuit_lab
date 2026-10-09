import {Device} from '../core/Device.js';
export class Lamp extends Device {
  constructor(o) { super({watts: 3, ...o}); }
  get brightness() { return this.state.powered ? 1 : 0; }
}
export class Radio extends Device { constructor(o) { super({watts: 3, ...o}); } }
export class Heater extends Device { constructor(o) { super({watts: 12, ...o}); } }
export class Sign extends Lamp {
  constructor(o) { super(o); this.state.celebrating = false; this.initial = structuredClone(this.state); }
  update(dt,world) {
    this.state.celebrating=this.state.powered&&!!this.config.confetti;
    const papers=world?.get(this.config.confettiTarget);
    if(this.state.celebrating&&!this.state.emitted&&papers){papers.state.visible=true;papers.state.collected=false;papers.state.progress=0;papers.state.position={...papers.initial.position};this.state.emitted=true;}
    if(!this.state.celebrating)this.state.emitted=false;
  }
}
export class HoldingCoil extends Device { constructor(o) { super({watts: 6, ...o}); } }
export class TimedDevice extends Device {
  constructor(o = {}) {
    super({watts: 6, ...o}, {elapsed: 0, complete: false});
    this.duration = o.duration ?? 1;
    if (!(this.duration > 0)) throw new RangeError('Duration must be positive');
  }
  demand() { return this.state.complete ? 0 : super.demand(); }
  boundary() { return this.state.powered && !this.state.complete ? this.duration - this.state.elapsed : Infinity; }
  update(dt, world) {
    if (this.state.complete) return;
    if (!this.state.powered) { if (!this.config.resume) this.state.elapsed = 0; return; }
    this.state.elapsed = Math.min(this.duration, this.state.elapsed + dt);
    if (this.state.elapsed >= this.duration - 1e-8) {
      this.state.complete = true; world?.emit('complete', this.id);
    }
  }
}
export class PulseLatch extends TimedDevice { constructor(o) { super({duration: 1, ...o}); } }
export class RepairBench extends TimedDevice { constructor(o) { super({duration: 6, ...o}); } }
export class Charger extends Device {
  constructor(o) { super({watts: 24, ...o}); }
  demand(world) {
    const target = world?.get(this.config.target);
    return target && target.state.charging && target.state.energy < target.capacity ? super.demand() : 0;
  }
  boundary(world) {
    const target = world.get(this.config.target);
    return this.state.powered && this.demand(world) > 0 ? (target.capacity - target.state.energy) / this.watts : Infinity;
  }
  update(dt, world) {
    const target = world?.get(this.config.target);
    if (this.state.powered && target?.state.charging) target.charge(this.watts * dt);
  }
}
