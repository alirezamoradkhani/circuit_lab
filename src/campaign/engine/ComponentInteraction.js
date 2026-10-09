import {Source} from '../components/electrical/Source.js';
import {Device} from '../components/core/Device.js';
import {SourceSelector} from '../components/electrical/Connections.js';
export class ComponentInteraction {
 constructor(world,onResult=()=>{}){this.onResult=onResult;this.world=world;this.tool='hand';this.selected=null;}
 object(id){const result=this.select(id);this.onResult(result);return result;}
 setTool(tool){if(!['hand','cable','meter'].includes(tool))return false;this.tool=tool;this.selected=null;return true;}
 select(id){
  const entity=this.world.get(id);if(!entity)return {ok:false,reason:'missing'};
  if(this.tool==='meter')return {ok:true,measurement:this.world.measure(id)};
  if(this.tool==='hand'){this.selected=id;return {ok:true,entity};}
  if(!this.selected){this.selected=id;return {ok:true,pending:id};}
  const a=this.world.get(this.selected);this.selected=null;
  const isSource=e=>e instanceof Source||e instanceof SourceSelector;
  const source=isSource(a)?a:isSource(entity)?entity:null,target=source===a?entity:a;
  if(!source||!(target instanceof Device))return {ok:false,reason:'source-to-load-required'};
  if(this.world.connections.get(target.id)?.source===source.id){this.world.disconnect(target.id);return {ok:true,disconnected:true};}
  return {ok:this.world.connect(source.id,target.id)};
 }
 act(action,value){if(this.tool!=='hand')return false;return this.world.get(this.selected)?.act(action,value)??false;}
 disconnect(){
  if(this.tool!=='cable'||!this.selected)return false;
  const id=this.selected;
  for(const [target,connection] of [...this.world.connections])if(target===id||connection.source===id)this.world.disconnect(target);
  this.selected=null;return true;
 }
}
