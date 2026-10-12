import {WorkshopGame} from './WorkshopGame.js';
import {RepairHUD} from './ui/RepairHUD.js';
import {RepairWorkshopScene} from './visual/RepairWorkshopScene.js';
import {RepairController} from './workshop/RepairController.js';
import {freshState,restoreState} from './workshop/state.js';
import {freshRepair,restoreRepair,REPAIR_SAVE_KEY} from './workshop/RepairCircuit.js';
export class RepairWorkshopGame extends WorkshopGame {
 constructor(root,options={}){super(root,{...options,saveKey:REPAIR_SAVE_KEY});}
 fresh(){return {...freshState(),repair:freshRepair()};}
 restore(value){const repair=restoreRepair(value?.repair);const s=restoreState(value?{...value,repair}:value);s.repair=repair;if(!s.repair.accepted){s.door=false;s.completed=false;s.latchTime=0;}return s;}
 createHUD(root,onAction){return new RepairHUD(root,onAction);}
 createScene(host){return new RepairWorkshopScene(host);}
 createInteractions(){return new RepairController(this);}
 action(action){
  if(!this.active)return;
  if(action.startsWith('repair-')){this.audio.unlock();return this.interactions.action(action);}
  if(['restart','recover'].includes(action)){this.scene.editing=false;this.interactions.cancelCable();}
  if(action==='circuit'&&this.state.started&&this.intro>=4.6&&!this.state.completed){this.interactions.open();return;}
  if(this.scene.editing&&['bag','reset','levels','help'].includes(action)){this.scene.editing=false;this.interactions.cancelCable();}
  if(this.scene.editing&&action==='interact')return this.interactions.action('repair-test');
  super.action(action);
 }
 events(events){
  if(events.includes('repair-trip')){
   const text='محافظ قطع کرد: جریان بیش از ۰٫۶۵ آمپر است. کلید را باز کن و مقاومت سری را بررسی کن.';
   if(this.scene.editing)this.hud.showRepair(text,'error');else this.hud.message(text,'error',7);
  }
  super.events(events.filter(e=>e!=='repair-trip'));
 }
 step(dt){
  this.scene.cableStart=this.interactions.cable.start;this.scene.hovered=this.interactions.hovered;this.scene.repairSelected=this.interactions.selected;
  // Looking at the cabinet does not pause electrical simulation; a live fault still trips protection.
  if(this.scene.editing)this.movement.clear();
  super.step(dt);
  if(this.scene.editing&&this.state.door){this.scene.editing=false;this.interactions.cancelCable();this.hud.message('مدار تعمیر شد؛ جریان ۰٫۵ آمپر و عملکرد کلید تأیید شد. کرکره باز است.','success',7);}
 }
}
