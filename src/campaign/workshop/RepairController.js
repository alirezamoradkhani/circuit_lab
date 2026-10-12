import {connect} from './actions.js';
import {InteractionController} from './InteractionController.js';
import {editRepair,measureRepair,testRepair,repairHint,REPAIR_WALK} from './RepairCircuit.js';
export const CABINET_WALK=REPAIR_WALK;
export class RepairController extends InteractionController {
 constructor(game){super(game);this.cable={start:null,begin:id=>this.beginCable(id)};this.hovered=null;}
 beginCable(id){if(id?.startsWith('repair-pin:')){this.cable.start=id.slice(11);this.selected=id;}}
 cancelCable(){this.cable.start=null;this.game.scene.cableStart=null;this.selected=null;}
 setTool(tool){super.setTool(tool);if(this.cable)this.cancelCable();}
 open(){const g=this.game;if(g.state.cart<1){g.hud.message('چرخ‌دستی راه تابلو را بسته؛ اول آن را عقب بکش.');return;}g.movement.go(CABINET_WALK,()=>{g.movement.clear();g.scene.editing=true;g.scene.resizeRepair();g.hud.showRepair('دو خرابی در تابلو هست: چراغ خاموش است و مقاومت تازه‌نصب‌شده باید بررسی شود.');});}
 result(r){if(this.game.scene.editing){this.game.hud.showRepair(r.message,r.ok?'info':'error');this.game.audio.play(r.sound);this.game.save();}else super.result(r);}
 object(id){
  if(id==='cabinet'){this.open();return;}
  const g=this.game,s=g.state;
  if(!g.scene.editing)return super.object(id);
  if(!id.startsWith('repair-'))return;
  if(this.tool==='cable'){
   if(!id.startsWith('repair-pin:'))return;
   if(!this.cable.start){this.beginCable(id);return;}
   const from=this.cable.start,to=id.slice(11);this.cancelCable();this.result(editRepair(s,'connect',from,to));return;
  }
  if(this.tool==='meter'&&id.startsWith('repair-part:')){this.selected=id;this.result(measureRepair(s,id.slice(12)));return;}
  if(this.tool==='hand'){this.selected=id;if(id==='repair-part:switch')this.result(editRepair(s,'switch'));}
 }
 nearest(){if(this.game.scene.editing)return null;const p=this.game.state.player;if(this.game.state.cart>=1&&Math.hypot(p.x-CABINET_WALK.x,p.z-CABINET_WALK.z)<1.25)return 'cabinet';return super.nearest();}
 hint(){if(this.game.state.repair&&!this.game.state.door&&this.game.state.cart>=1){const text=repairHint(this.game.state);if(this.game.scene.editing)this.game.hud.showRepair(text);else this.game.hud.message(text,'info',10);return;}super.hint();}
 action(action){
  const g=this.game,s=g.state;
  if(action==='repair-close'){g.scene.editing=false;this.setTool('hand');return;}
  if(action==='repair-source:battery'||action==='repair-source:mains'){const source=action.split(':')[1];return this.result(connect(s,source,'latch'));}
  if(action==='repair-switch')return this.result(editRepair(s,'switch'));
  if(action==='repair-test')return this.result(testRepair(s));
  if(action==='repair-reset')return this.result(editRepair(s,'reset-protector'));
  if(action==='repair-remove'&&this.selected?.startsWith('repair-wire:')){this.result(editRepair(s,'remove',this.selected.slice(12)));this.selected=null;return;}
  if(action==='repair-cancel'){this.cancelCable();return;}
  if(action.startsWith('repair-resistor:'))return this.result(editRepair(s,'resistor',action.split(':')[1]));
 }
}
