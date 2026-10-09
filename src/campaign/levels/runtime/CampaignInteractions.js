import {ComponentInteraction} from '../../engine/ComponentInteraction.js';
import {CableTool} from '../../engine/CableTool.js';
import {equipmentStatus} from '../../ui/EquipmentStatus.js';
export class CampaignInteractions extends ComponentInteraction {
 constructor(game){super(game.session.world);this.game=game;this.cable=new CableTool(this.world);this.hovered=null;}
 setTool(tool){const ok=super.setTool(tool);if(ok){this.cable.cancel();this.game.hud.setTool(tool);this.game.movement.clear();}return ok;}
 object(id){
  const g=this.game,e=this.world.get(id);if(!e||e.config.interactive===false||e.config.hidden||e.state.collected||!e.state.visible)return;
  this.selected=id;
  if(this.tool==='meter'){g.hud.message((e.config.label??id)+' · '+equipmentStatus(e,this.world),'meter',8);return;}
  if(this.tool==='hand'){
   g.movement.clear();
   if(id==='exit')g.goNear(id,()=>{if(!g.session.definition.ready(this.world,g.session.ctx))g.hud.message('مسیر خروج هنوز بسته است.','info',5);});
   return;
  }
  if(!this.cable.endpoint(id)){g.hud.message('این شیء سوکت برق ندارد.','error');return;}
  if(!this.cable.start){this.cable.begin(id);return;}
  const result=this.cable.assess(id);
  if(!result.ok){g.hud.message(result.reason,'error');return;}
  const start=this.cable.start;
  const connect=()=>{
   if(this.tool!=='cable'||this.cable.start!==start)return;
   const done=this.cable.commit(id);
   g.hud.message(done.ok?(done.existing?'این کابل از قبل متصل است.':done.replacing?'منبع قبلی جدا و کابل تازه وصل شد.':'کابل وصل شد؛ اثرش را در صحنه ببین.'):done.reason,done.ok?'success':'error',5);g.save();
  };
  if(result.source.id==='battery'&&result.source.state.holder==='ray'&&Math.hypot(result.source.state.position.x-result.target.state.position.x,result.source.state.position.z-result.target.state.position.z)>2.65){g.hud.message('رِی سر کابل باتری را تا وسیله می‌برد…');g.goNear(result.target.id,connect);}
  else connect();
 }
 command(action){
  const g=this.game,id=this.selected,e=this.world.get(id);if(!e||this.tool!=='hand')return;
  g.movement.clear();
  const label=g.session.commands(id).find(c=>c.id===action)?.label;if(!label)return;
  this.pending={id,label};g.hud.message('رِی: '+label+'…','info',4);
  g.goNear(id,()=>{
   if(this.tool!=='hand'||this.selected!==id||e.state.collected)return;
   if(Math.hypot(e.state.position.x-g.state.player.x,e.state.position.z-g.state.player.z)>1.7){g.hud.message('وسیله جابه‌جا شد؛ دوباره انتخابش کن.','info');return;}
   const before=g.hud.bubble?.textContent;
   if(g.session.execute(id,action)){if(g.hud.bubble?.textContent===before)g.hud.message(label+' انجام شد.','success',4);g.audio.play('click');g.save();}this.pending=null;
  });
 }
 cancelCable(){this.cable.cancel();this.game.movement.clear();}
 nearest(){
  const p=this.game.session.ray.state.position;let result=null,best=1.5;
  for(const e of this.world.all())if(e.id!=='ray'&&e.config.interactive!==false&&!e.config.hidden&&e.config.label&&e.state.visible&&!e.state.collected){const d=Math.hypot(e.state.position.x-p.x,e.state.position.z-p.z);if(d<best&&e.state.holder!=='ray'){best=d;result=e.id;}}
  return result;
 }
 unplug(target){
  const id=target??this.selected;let count=0;
  for(const [to,c] of [...this.world.connections])if(to===id||(!target&&c.source===id)){this.world.disconnect(to);count++;}
  this.cancelCable();this.game.hud.message(count?'کابل جدا شد.':'این وسیله کابل متصل ندارد.');this.game.save();
 }
}
