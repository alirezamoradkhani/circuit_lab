import {Entity} from './Entity.js';
export const matches=(world,conditions=[])=>conditions.every(c=>world.get(c.id)?.state[c.field]===(c.value??true));
export class Sequence extends Entity {
  constructor(o={}){super(o,{active:false,index:0,elapsed:0,complete:false,interrupted:false});}
  act(action){if(action!=='start')return false;Object.assign(this.state,{active:true,index:0,elapsed:0,complete:false,interrupted:false});return true;}
  update(dt,world){
    if(!this.state.active)return;
    if(!matches(world,this.config.requires)){this.state.active=false;this.state.interrupted=true;world.emit('interrupted',this.id);return;}
    let remaining=dt;
    while(this.state.active&&remaining>1e-8){
      const step=this.config.steps?.[this.state.index];
      if(!step){this.state.active=false;this.state.complete=true;world.emit('complete',this.id);break;}
      if(!matches(world,step.requires)){this.state.active=false;this.state.interrupted=true;break;}
      const slice=Math.min(remaining,Math.max(0,(step.seconds??1)-this.state.elapsed));this.state.elapsed+=slice;remaining-=slice;
      if(this.state.elapsed>=(step.seconds??1)-1e-8){
        for(const a of step.actions??[])world.get(a.id)?.act(a.action,a.value);
        this.state.index++;this.state.elapsed=0;
        if(this.state.index===this.config.steps.length){this.state.active=false;this.state.complete=true;world.emit('complete',this.id);}
      }
    }
  }
}
