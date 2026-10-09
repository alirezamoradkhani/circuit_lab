import {Device} from '../core/Device.js';
export class Motor extends Device {
  constructor(o = {}, state = {}) {
    super({watts: o.runningWatts ?? 6, ...o}, {runningTime: 0, ...state});
    this.startWatts = o.startWatts ?? this.watts; this.startSeconds = o.startSeconds ?? 1;
  }
  demand() { return this.state.enabled ? (this.state.runningTime < this.startSeconds - 1e-8 ? this.startWatts : this.watts) : 0; }
  setPower(on, volts) { super.setPower(on, volts); if (!on) this.state.runningTime = 0; }
  boundary() { return this.state.powered && this.state.runningTime < this.startSeconds - 1e-8 ? this.startSeconds - this.state.runningTime : Infinity; }
  update(dt) { if (this.state.powered) this.state.runningTime += dt; }
}
export class Fan extends Motor {
  constructor(o = {}) {
    super(o, {speed: o.speed ?? 0, direction: o.direction ?? 0});
    this.speeds = o.speeds ?? [6, 12]; this.directions = o.directions ?? [0, Math.PI / 2];
    if (!this.speeds.length || this.speeds.some(w => !Number.isFinite(w) || w < 0)) throw new RangeError('Invalid fan speeds');
  }
  validateState(s){if(!Number.isInteger(s.speed)||s.speed<0||s.speed>=this.speeds.length||!Number.isInteger(s.direction)||s.direction<0||s.direction>=this.directions.length)throw new RangeError('Invalid saved fan setting');}
  demand() { return this.state.enabled ? this.speeds[this.state.speed] : 0; }
  boundary() { return Infinity; }
  get strength() { return this.state.powered ? this.speeds[this.state.speed] / Math.max(...this.speeds) : 0; }
  act(action, value) {
    if (action === 'speed' || action === 'direction') {
      const list = action === 'speed' ? this.speeds : this.directions;
      const next = value ?? (this.state[action] + 1) % list.length;
      if (!Number.isInteger(next) || next < 0 || next >= list.length) return false;
      this.state[action] = next; return true;
    }
    return super.act(action, value);
  }
}
export class Pump extends Motor {
  constructor(o) { super({startWatts: 18, runningWatts: 6, ...o}); }
  update(dt, world) {
    super.update(dt);
    const hose = world?.get(this.config.hose), basin = world?.get(this.config.basin);
    if (this.state.powered && hose && basin && hose.state.from === this.config.basin && hose.state.to === this.config.drain && !hose.state.damaged)
      basin?.drain((this.config.rate ?? .1) * dt);
  }
}
