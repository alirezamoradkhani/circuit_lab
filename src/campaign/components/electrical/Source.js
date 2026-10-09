import {Entity, nonnegative} from '../core/Entity.js';
export class Source extends Entity {
  constructor(options = {}, initial = {}) {
    super(options, {enabled: true, tripped: false, ...initial});
    this.voltage = nonnegative(options.voltage ?? 12, 'voltage');
    this.maxWatts = nonnegative(options.maxWatts ?? 24, 'maxWatts');
  }
  available() { return this.state.enabled && !this.state.tripped; }
  energyAvailable() { return Infinity; }
  consume() {}
  resetBreaker() { this.state.tripped = false; }
  act(action) {
    if (action === 'reset') { this.resetBreaker(); return true; }
    if (action === 'toggle') { this.state.enabled = !this.state.enabled; return true; }
    return false;
  }
}
export class Battery extends Source {
  constructor(options = {}) {
    const capacity = nonnegative(options.capacity ?? 72, 'capacity');
    super({maxWatts: 12, ...options}, {energy: Math.min(capacity, nonnegative(options.energy ?? capacity, 'energy')), charging: false});
    this.capacity = capacity;
  }
  validateState(state) { if(state.energy<0||state.energy>this.capacity)throw new RangeError('Saved energy outside capacity'); }
  energyAvailable() { return this.state.charging ? 0 : Math.max(0, this.state.energy); }
  available() { return super.available() && this.energyAvailable() > 1e-8; }
  consume(joules) { this.state.energy = Math.max(0, this.state.energy - nonnegative(joules, 'energy')); }
  charge(joules) { this.state.energy = Math.min(this.capacity, this.state.energy + nonnegative(joules, 'charge')); }
}
export class Capacitor extends Battery {
  constructor(options = {}) {
    const capacitance = options.capacitance ?? 1, voltage = options.voltage ?? 12, cutoff = options.cutoff ?? 6;
    if (!(capacitance > 0 && cutoff >= 0 && cutoff < voltage)) throw new RangeError('Invalid capacitor specification');
    super({...options, voltage, capacity: .5 * capacitance * voltage ** 2});
    this.capacitance = capacitance; this.cutoff = cutoff;
    this.efficiency = options.efficiency ?? .9;
    if (!(this.efficiency > 0 && this.efficiency <= 1)) throw new RangeError('Invalid efficiency');
  }
  get inputVoltage() { return Math.sqrt(2 * this.state.energy / this.capacitance); }
  validateState(state) { if(state.energy<0||state.energy>this.capacity)throw new RangeError('Saved energy outside capacity'); }
  energyAvailable() { return this.state.charging ? 0 : Math.max(0, this.state.energy - .5 * this.capacitance * this.cutoff ** 2) * this.efficiency; }
  consume(joules) { super.consume(nonnegative(joules, 'energy') / this.efficiency); }
}
