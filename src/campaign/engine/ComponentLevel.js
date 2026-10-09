import {createComponent,ComponentWorld,OpticsSystem} from '../components/index.js';
export class BaseLevel {
 constructor(id){if(new.target===BaseLevel)throw new TypeError('BaseLevel requires an implementation');this.id=id;this.paused=false;}
 update(){throw new Error('Level must implement update(dt)');}
 snapshot(){throw new Error('Level must implement snapshot()');}
 restore(){throw new Error('Level must implement restore(snapshot)');}
}
export class ComponentLevel extends BaseLevel {
 constructor(definition){
  super(definition.id);this.definition=definition;
  this.world=new ComponentWorld(definition.components.map(createComponent),[new OpticsSystem()]);
  this.world.canWalk=definition.canWalk;this.world.findPath=definition.findPath;
  this.completedGoals=new Set();
  for(const wire of definition.connections??[])if(!this.world.connect(wire.source,wire.target,wire.options))throw new Error('Invalid level connection');
 }
 update(dt){
  if(this.paused)return [];
  const events=this.world.tick(dt);
  for(const goal of this.definition.goals??[])if(!this.completedGoals.has(goal.id)&&goal.test(this.world)){
   this.completedGoals.add(goal.id);events.push({type:'goal',id:goal.id});
  }
  return events;
 }
 act(id,action,value){if(this.paused)return false;return this.world.get(id)?.act(action,value)??false;}
 snapshot(){return {version:1,id:this.id,world:this.world.snapshot(),goals:[...this.completedGoals]};}
 restore(saved){if(saved?.version!==1||saved.id!==this.id||!Array.isArray(saved.goals))throw new TypeError('Wrong level save');this.world.restore(saved.world);this.completedGoals=new Set(saved.goals.filter(id=>this.definition.goals?.some(g=>g.id===id)));}
}
