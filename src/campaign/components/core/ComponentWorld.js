import {Source} from '../electrical/Source.js';
import {Device} from './Device.js';
import {SourceSelector,Cable,Switch} from '../electrical/Connections.js';
import {nonnegative,copy} from './Entity.js';
export class ComponentWorld {
  constructor(entities=[],systems=[]){
    this.entities=new Map();this.connections=new Map();this.events=[];this.systems=systems;
    for(const entity of entities){if(this.entities.has(entity.id))throw new Error('Duplicate component: '+entity.id);this.entities.set(entity.id,entity);}
  }
  get(id){return this.entities.get(id);}
  all(){return [...this.entities.values()];}
  emit(type,id){this.events.push({type,id});}
  sourceFor(connection){
    let source=this.get(connection?.source);
    if(source instanceof SourceSelector)source=this.get(source.state.selected);
    return source;
  }
  connect(sourceId,targetId,options={}){
    const source=this.get(sourceId),target=this.get(targetId);
    if(!(source instanceof Source||source instanceof SourceSelector)||!(target instanceof Device))return false;
    if(sourceId===target.config.target)return false;
    if(source instanceof SourceSelector&&source.config.sources?.includes(target.config.target))return false;
    const cable=options.cable?this.get(options.cable):null;
    if(options.cable&&!(cable instanceof Cable))return false;
    if(!(options.switches??[]).every(id=>this.get(id) instanceof Switch))return false;
    if(cable){
      if([...this.connections.entries()].some(([id,c])=>id!==targetId&&c.cable===cable.id))return false;
      const a=source.state.position,b=target.state.position;
      if(!cable.connect(sourceId,targetId,Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)))return false;
    }
    this.disconnect(targetId);
    if(cable)cable.connect(sourceId,targetId,Math.hypot(source.state.position.x-target.state.position.x,source.state.position.y-target.state.position.y,source.state.position.z-target.state.position.z));
    this.connections.set(targetId,{...copy(options),source:sourceId});return true;
  }
  disconnect(targetId){
    const old=this.connections.get(targetId);if(old?.cable)this.get(old.cable)?.disconnect();
    this.connections.delete(targetId);this.get(targetId)?.setPower?.(false,0);
  }
  passes(device,connection){
    if(!connection)return false;
    if(connection.cable&&this.get(connection.cable)?.state.damaged)return false;
    if(!(connection.switches??[]).every(id=>{const s=this.get(id)?.state;return s?.closed&&!s.tripped;}))return false;
    return (device.config.requires??[]).every(r=>this.get(r.id)?.state[r.field]===(r.value??true));
  }
  solve(){
    const groups=new Map();
    for(const device of this.all().filter(e=>e instanceof Device)){
      const connection=this.connections.get(device.id),source=this.sourceFor(connection);
      const passes=source instanceof Source&&this.passes(device,connection);
      const active=passes&&source.available()&&device.state.enabled;
      if(!active){device.setPower(false,0);continue;}
      if(device.state.poweredBy!==source.id){device.setPower(false,0);device.state.poweredBy=source.id;}
      if(!groups.has(source.id))groups.set(source.id,{source,loads:[],watts:0});
      const group=groups.get(source.id),watts=device.demand(this);
      group.loads.push(device);group.watts+=watts;
    }
    const branchLoads=new Map();
    for(const group of groups.values())for(const device of group.loads)
      for(const id of this.connections.get(device.id).switches??[])branchLoads.set(id,(branchLoads.get(id)??0)+device.demand(this));
    for(const [id,watts] of branchLoads){const branch=this.get(id);if('tripped' in branch.state&&watts>(branch.config.maxWatts??Infinity)+1e-8){branch.state.tripped=true;this.emit('overload',id);}}
    for(const group of groups.values()){
      group.loads=group.loads.filter(device=>{if(this.passes(device,this.connections.get(device.id)))return true;device.setPower(false,0);return false;});
      group.watts=group.loads.reduce((sum,e)=>sum+e.demand(this),0);

      const {source,loads,watts}=group;
      if(watts>source.maxWatts+1e-8){source.state.tripped=true;this.emit('overload',source.id);}
      for(const device of loads)device.setPower(source.available()&&device.demand(this)>0,source.voltage);
      if(source.state.tripped)group.watts=0;
    }
    return groups;
  }
  tick(dt){
    nonnegative(dt,'dt');this.events=[];let remaining=dt;
    while(remaining>1e-8){
      const groups=this.solve();let slice=Math.min(remaining,.05);
      for(const {source,watts} of groups.values())if(watts>0)slice=Math.min(slice,source.energyAvailable()/watts);
      for(const e of this.all())if(e instanceof Device){const t=e.boundary(this);if(t>1e-8)slice=Math.min(slice,t);}
      if(slice<1e-10)throw new Error('Power simulation did not advance');
      for(const {source,watts} of groups.values())if(watts>0){const before=source.energyAvailable();source.consume(watts*slice);if(before>1e-8&&source.energyAvailable()<1e-8)this.emit('empty',source.id);}
      for(const system of this.systems)system.update(this,slice);
      for(const e of this.all())e.update(slice,this);
      remaining-=slice;
    }
    this.solve();return this.events;
  }
  resetObjects(ids,{preserve=['energy','collected','complete']}={}){
    if(ids.some(id=>!this.get(id)))throw new TypeError('Unknown reset component');
    const selected=new Set(ids);
    for(const [id,connection] of [...this.connections])if(selected.has(id)||selected.has(connection.source)||selected.has(connection.cable))this.disconnect(id);
    for(const id of ids){
      const entity=this.get(id),saved=entity.snapshot().state;entity.reset();
      for(const key of preserve)if(key in saved)entity.state[key]=saved[key];
      if(entity.state.collected)entity.state.visible=false;
    }
  }
  measure(id){const e=this.get(id);if(!e)return null;return e instanceof Source?{voltage:e.available()?e.voltage:0,maxWatts:e.maxWatts,energy:e.energyAvailable()}:e.measure?.()??copy(e.state);}
  snapshot(){return {version:1,entities:this.all().map(e=>e.snapshot()),connections:[...this.connections.entries()].map(copy)};}
  restore(saved){
    if(saved?.version!==1||!Array.isArray(saved.entities)||saved.entities.length!==this.entities.size)throw new TypeError('Invalid world snapshot');
    const previous=this.snapshot();
    try{
      const ids=new Set();for(const value of saved.entities){if(ids.has(value.id)||!this.get(value.id))throw new TypeError('Unknown or duplicate saved component');ids.add(value.id);this.get(value.id).restore(value);}
      this.connections.clear();
      for(const [id,c] of saved.connections){if(this.connections.has(id)||!this.connect(c.source,id,c))throw new TypeError('Invalid saved connection');}
      // Restoring a wire must not reset a running motor's saved startup phase.
      for(const value of saved.entities)this.get(value.id).restore(value);
    }catch(error){for(const v of previous.entities)this.get(v.id).restore(v);this.connections=new Map(previous.connections);throw error;}
  }
}
