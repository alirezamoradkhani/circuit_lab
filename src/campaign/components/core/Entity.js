export const copy = value => structuredClone(value);
export function nonnegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
  return value;
}
export class Entity {
  constructor(options = {}, initial = {}) {
    if (!options.id) throw new TypeError('Every component needs a stable id');
    this.id = options.id;
    this.kind = options.kind || this.constructor.name;
    this.config = copy(options);
    this.state = {position: {x: 0, y: 0, z: 0, ...options.position}, visible: true, holder: null, ...copy(initial)};
    if(!['x','y','z'].every(k=>Number.isFinite(this.state.position[k])))throw new TypeError('Invalid component position');
    this.initial = copy(this.state);
  }
  reset() { this.state = copy(this.initial); }
  snapshot() { return {id: this.id, kind: this.kind, state: copy(this.state)}; }
  restore(value) {
    if (value?.id !== this.id || value.kind !== this.kind || !value.state) throw new TypeError('Component snapshot mismatch');
    const check = v => {
      if (typeof v === 'number' && !Number.isFinite(v)) throw new TypeError('Non-finite saved value');
      if (v && typeof v === 'object') Object.values(v).forEach(check);
    };
    check(value.state);
    const restored={...copy(this.initial),...copy(value.state)};
    if(!restored.position||!['x','y','z'].every(k=>Number.isFinite(restored.position[k])))throw new TypeError('Invalid saved position');
    for(const [key,initial] of Object.entries(this.initial))if(initial!==null&&(typeof restored[key]!==typeof initial||Array.isArray(initial)!==Array.isArray(restored[key])))throw new TypeError('Invalid saved field: '+key);
    this.validateState(restored);this.state=restored;
  }
  validateState() {}
  act() { return false; }
  update() {}
}
