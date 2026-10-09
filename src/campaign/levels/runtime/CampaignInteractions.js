import {Device,Source,SourceSelector} from '../../components/index.js';
import {ComponentInteraction} from '../../engine/ComponentInteraction.js';
import {equipmentStatus} from '../../ui/CampaignHUD.js';
export class CampaignInteractions extends ComponentInteraction {
 constructor(game){super(game.session.world);this.game=game;}
 setTool(tool){const ok=super.setTool(tool);if(ok){this.game.hud.setTool(tool);this.game.movement.clear();}return ok;}
 object(id){
  const g=this.game,e=this.world.get(id);if(!e||e.config.interactive===false||e.config.hidden||e.state.collected||!e.state.visible)return;
  if(this.tool==='meter'){g.hud.message((e.config.label??id)+' · '+equipmentStatus(e,this.world),'meter',8);return;}
  if(this.tool==='hand'){
   this.selected=id;
   if(id==='battery'&&e.state.holder==='ray')return;
   g.goNear(id,()=>{const text=g.session.definition.interact?.(this.world,id,g.session.ctx);if(text)g.hud.message(text);if(id==='exit'&&!g.session.definition.ready(this.world,g.session.ctx))g.hud.message(g.session.objective(),'info',7);});return;
  }
  if(!(e instanceof Source||e instanceof SourceSelector||e instanceof Device)){g.hud.message('کابل را بین یک منبع و یک وسیلهٔ برقی وصل کن.','error');return;}
  const first=this.world.get(this.selected);
  if(!first){this.selected=id;g.hud.message((e.config.label??id)+' انتخاب شد؛ سر دیگر کابل را بزن.');return;}
  const target=first instanceof Source||first instanceof SourceSelector?e:first,source=target===e?first:e;
  const connect=()=>{this.selected=first.id;const result=super.select(id);g.hud.message(result.ok?(result.disconnected?'کابل جدا شد.':'کابل وصل شد؛ اثرش را روی وسیله ببین.'):'این دو سر به هم وصل نمی‌شوند.','info',5);g.save();};
  if(source.id==='battery'&&source.state.holder==='ray'&&Math.hypot(source.state.position.x-target.state.position.x,source.state.position.z-target.state.position.z)>2.65)g.goNear(target.id,connect);
  else connect();
 }
 nearest(){
  const p=this.game.session.ray.state.position;let result=null,best=1.5;
  for(const e of this.world.all())if(e.id!=='ray'&&e.config.interactive!==false&&!e.config.hidden&&e.config.label&&e.state.visible&&!e.state.collected){const d=Math.hypot(e.state.position.x-p.x,e.state.position.z-p.z);if(d<best&&e.state.holder!=='ray'){best=d;result=e.id;}}
  return result;
 }
 unplug(){this.disconnect();this.game.hud.message('اتصال جدا شد.');this.game.save();}
}
