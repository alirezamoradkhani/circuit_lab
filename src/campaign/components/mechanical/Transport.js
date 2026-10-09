import {Motor} from '../electrical/Motor.js';
import {Device} from '../core/Device.js';
export class Platform extends Motor {
  constructor(o = {}) {
    super({startWatts: 24, runningWatts: 18, ...o,position:o.position??o.from}, {progress: 0, target: 0, blocked: false, braked: true});
  }
  demand() { return this.state.blocked || Math.abs(this.state.target - this.state.progress) < 1e-8 ? 0 : super.demand(); }
  act(action, target) {
    if (action !== 'move' || ![0, 1].includes(target)) return super.act(action, target);
    this.state.target = target; return true;
  }
  update(dt, world) {
    super.update(dt);
    this.state.braked = !this.state.powered || !this.demand();
    if (this.state.braked) { this.state.runningTime = 0; return; }
    const before = this.state.progress;
    const direction = Math.sign(this.state.target - before);
    this.state.progress = Math.max(0, Math.min(1, before + direction * dt / (this.config.travelSeconds ?? 3)));
    if ((this.state.target - before) * (this.state.target - this.state.progress) <= 0) this.state.progress = this.state.target;
    const from = this.config.from ?? this.initial.position, to = this.config.to ?? {...from, y: (from.y ?? 0) + 3};
    const previous = {...this.state.position};
    for (const k of ['x','y','z']) this.state.position[k] = (from[k] ?? 0) + ((to[k] ?? 0) - (from[k] ?? 0)) * this.state.progress;
    for (const id of this.config.riders ?? []) {
      const rider = world?.get(id); if (rider) for (const k of ['x','y','z']) rider.state.position[k] += this.state.position[k] - previous[k];
    }
  }
}
export class Conveyor extends Motor {
  constructor(o = {}) { super({startWatts: 6, runningWatts: 6, ...o}, {direction: 1, distance: 0}); }
  act(action) { if (action === 'reverse') { this.state.direction *= -1; return true; } return super.act(action); }
  update(dt, world) {
    super.update(dt); if (!this.state.powered) return;
    const amount = this.state.direction * (this.config.speed ?? .5) * dt;
    this.state.distance += amount;
    for (const id of this.config.cargo ?? []) {
      const item = world?.get(id);
      if (!item || item.state.holder || item.state.locked) continue;
      const axis = this.config.axis ?? 'x', min = this.config.min ?? -5, max = this.config.max ?? 5;
      item.state.position[axis] = Math.max(min, Math.min(max, item.state.position[axis] + amount));
    }
  }
}
export class Magnet extends Device {
  constructor(o = {}) { super({watts: 12, ...o}, {cargo: null}); }
  attachmentPosition(){return {...this.state.position,y:this.state.position.y-.6};}
  update(dt, world) {
    if (!world) return;
    if (this.state.powered && !this.state.cargo) {
      const item = world.get(this.config.target);
      if (item?.config.material === 'metal' && !item.state.holder && !item.state.locked &&
        Math.hypot(item.state.position.x - this.state.position.x, item.state.position.z - this.state.position.z) <= (this.config.reach ?? .8)) {
        item.state.holder = this.id; this.state.cargo = item.id; world.emit('pickup', this.id);
      }
    }
    const item = world.get(this.state.cargo);
    if (item && this.state.powered) item.state.position = this.attachmentPosition();
    if (item && !this.state.powered) {
      item.state.holder = null;
      const pads = this.config.safeDrops ?? [item.initial.position];
      const distance = p => Math.hypot(p.x - item.state.position.x, p.z - item.state.position.z);
      item.state.position = {...[...pads].sort((a,b) => distance(a) - distance(b))[0]};
      this.state.cargo = null; world.emit('release', this.id);
    }
  }
}
