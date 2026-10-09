import {ComponentLevel} from '../../engine/ComponentLevel.js';
import {Inventory,Battery} from '../../components/index.js';
import {createNavigation} from '../../engine/createNavigation.js';
import {defaultActions,disconnectEntity} from './LevelActions.js';
export class CampaignSession extends ComponentLevel {
 constructor(definition,onMessage=()=>{}){
  super({...definition,goals:definition.goals??[]});this.flags={};this.started=false;this.completed=false;this.message=onMessage;
  this.inventory=new Inventory(this.world,'ray',1);
  this.ctx={flags:this.flags,say:(text,tone='info')=>this.message(text,tone),take:id=>this.take(id),place:(id,p)=>this.inventory.place(id,p)};
  definition.setup?.(this.world,this.ctx);
  this.navigation=createNavigation({bounds:definition.bounds??{minX:-6,maxX:6,minZ:-4,maxZ:4},obstacles:()=>definition.obstacles?.(this.world,this.ctx)??[],tetherAllows:p=>this.tetherAllows(p),blocked:()=>this.completed||this.inTransit()});
  this.world.canWalk=(p)=>this.navigation.walkable(p,{});
  this.world.findPath=(from,to)=>this.navigation.findPath(from,to,{});
 }
 get ray(){return this.world.get('ray');}
 inTransit(){return this.world.all().some(e=>e.kind==='PathRide'&&e.state.active&&e.config.actor==='ray')||!!this.flags.movementLocked||!!this.flags.scriptedMovement;}
 tetherAllows(p){
  const battery=this.world.get('battery');
  if(battery?.state.holder!=='ray')return true;
  if(battery.state.charging){const charger=this.world.all().find(e=>e.kind==='Charger'&&e.config.target==='battery');if(charger&&Math.hypot(p.x-charger.state.position.x,p.z-charger.state.position.z)>1.6)return false;}
  return [...this.world.connections].every(([id,c])=>c.source!=='battery'||Math.hypot(p.x-this.world.get(id).state.position.x,p.z-this.world.get(id).state.position.z)<=2.65);
 }
 take(id){const e=this.world.get(id);if(e instanceof Battery)disconnectEntity(this.world,id);return this.inventory.take(id);}
 drop(id){
  const p=this.ray.state.position;
  const success=this.inventory.place(id,{x:p.x+.5,y:p.y,z:p.z});
  return success?'وسیله روی زمین قرار گرفت.':'این وسیله در دست رِی نیست.';
 }
 charge(id='charger'){
  const charger=this.world.get(id),target=this.world.get(charger?.config.target);
  if(!charger||!(target instanceof Battery))return 'این جایگاه بستهٔ قابل شارژ ندارد.';
  const p=target.state.holder==='ray'?this.ray.state.position:target.state.position;
  if(Math.hypot(p.x-charger.state.position.x,p.z-charger.state.position.z)>1.8||Math.abs(p.y-charger.state.position.y)>1)return 'بسته را کنار همین جایگاه بیاور؛ کابل شارژ به آن نمی‌رسد.';
  disconnectEntity(this.world,target.id);target.state.charging=true;charger.state.enabled=true;
  if(!this.world.connections.has(id))this.world.connect(charger.config.source??'supply',id);
  return 'شارژ شروع شد؛ پرشدن انرژی را ببین و بعد کابل شارژ را جدا کن.';
 }
 commands(id){return this.definition.actions?.(this.world,id,this.ctx)??defaultActions(this,id);}
 execute(id,action){const command=this.commands(id).find(c=>c.id===action);if(!command)return false;const result=command.run();if(typeof result==='string')this.message(result);return true;}
 update(dt){
  if(this.paused||!this.started||this.completed)return [];
  this.inventory.update();const events=super.update(dt);this.definition.update?.(this.world,dt,this.ctx);this.inventory.update();
  const exit=this.definition.exit??this.world.get('exit')?.state.position;
  if(exit&&this.definition.ready(this.world,this.ctx)&&Math.hypot(this.ray.state.position.x-exit.x,this.ray.state.position.z-exit.z)<.7){
   this.completed=true;events.push({type:'stage-complete',id:this.id});
  }
  return events;
 }
 objective(){return this.definition.objective(this.world,this.ctx);}
 hint(){return this.definition.hint(this.world,this.ctx);}
 snapshot(){return {...super.snapshot(),flags:structuredClone(this.flags),started:this.started,completed:this.completed};}
 restore(saved){super.restore(saved);
  // Fixed infrastructure follows the current scene layout; movable puzzle objects retain their saved positions.
  for(const e of this.world.all())if(['Source','Charger'].includes(e.kind))e.state.position={...e.initial.position};this.flags=structuredClone(saved.flags??{});this.ctx.flags=this.flags;this.started=saved.started===true;this.completed=saved.completed===true;}
}
