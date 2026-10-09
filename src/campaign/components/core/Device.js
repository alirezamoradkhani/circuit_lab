import {Entity, nonnegative} from './Entity.js';
export class Device extends Entity {
  constructor(options = {}, initial = {}) {
    super(options, {enabled: options.enabled ?? true, powered: false, voltage: 0, ...initial});
    this.watts = nonnegative(options.watts ?? 0, 'watts');
  }
  demand() { return this.state.enabled ? this.watts : 0; }
  setPower(on, voltage = 0) { this.state.powered = !!on; this.state.voltage = on ? voltage : 0; }
  boundary() { return Infinity; }
  act(action, value) {
    if (action !== 'toggle') return false;
    this.state.enabled = value ?? !this.state.enabled; return true;
  }
  measure(world) { return {voltage: this.state.voltage, watts: this.state.powered ? this.demand(world) : 0}; }
}
