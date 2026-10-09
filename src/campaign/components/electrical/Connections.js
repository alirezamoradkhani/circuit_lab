import {Entity} from '../core/Entity.js';
export class Switch extends Entity {
  constructor(o = {}) { super(o, {closed: o.closed ?? true}); }
  act(action, value) { if (action !== 'toggle') return false; this.state.closed = value ?? !this.state.closed; return true; }
}
export class Breaker extends Switch {
  constructor(o = {}) { super(o); this.state.tripped = false; this.initial = structuredClone(this.state); }
  get closed() { return this.state.closed && !this.state.tripped; }
  act(action, value) { if (action === 'reset') { this.state.tripped = false; return true; } return super.act(action, value); }
}
export class SourceSelector extends Entity {
  constructor(o = {}) { super(o, {selected: null}); }
  act(action, id) {
    if (action !== 'select' || id !== null && !this.config.sources?.includes(id)) return false;
    this.state.selected = id; return true;
  }
}
export class Cable extends Entity {
  constructor(o = {}) { super(o, {from: null, to: null, damaged: o.damaged ?? false}); }
  connect(a, b, distance = 0) {
    if (!a || !b || a === b || distance > (this.config.length ?? Infinity)) return false;
    this.state.from = a; this.state.to = b; return true;
  }
  disconnect() { this.state.from = null; this.state.to = null; }
}
export class Hose extends Cable {
  connect(a,b,distance=0){
    if(!a||!b||distance>(this.config.length??Infinity))return false;
    this.state.from=a;this.state.to=b;return true;
  }
}
export class Socket extends Entity {
  constructor(o = {}) { super(o, {item: null}); }
  accepts(entity) { return !this.config.accepts || this.config.accepts.includes(entity.kind); }
  insert(entity) {
    if (this.state.item || entity.state.holder || !this.accepts(entity) || entity.state.locked) return false;
    this.state.item = entity.id; entity.state.holder = this.id; entity.state.position = {...this.state.position}; return true;
  }
  remove(world) {
    const entity = world.get(this.state.item); if (entity) entity.state.holder = null;
    this.state.item = null; return entity;
  }
}
