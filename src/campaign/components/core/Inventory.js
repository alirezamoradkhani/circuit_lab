export class Inventory {
  constructor(world,owner,capacity=1){this.world=world;this.owner=owner;this.capacity=capacity;}
  get carried(){return this.world.all().filter(e=>e.state.holder===this.owner);}
  take(id){
    const entity=this.world.get(id);
    if(!entity||entity.state.collected||entity.state.holder||entity.state.locked||entity.config.portable===false||this.carried.length>=this.capacity)return false;
    entity.state.holder=this.owner;return true;
  }
  place(id,position){const entity=this.world.get(id);if(entity?.state.holder!==this.owner)return false;entity.state.holder=null;entity.state.position={...position};return true;}
  update(){const owner=this.world.get(this.owner);if(owner)for(const e of this.carried)e.state.position={...owner.state.position,y:owner.state.position.y+.8};}
}
