import {FrameGame} from './engine/FrameGame.js';
import {GameAudio} from './engine/GameAudio.js';
import {Movement} from './engine/Movement.js';
import {bindGameInput} from './engine/GameInput.js';
import {CampaignStore} from './engine/CampaignStore.js';
import {ProgressiveHints} from './engine/ProgressiveHints.js';
import {CampaignSession} from './levels/runtime/CampaignSession.js';
import {CampaignInteractions} from './levels/runtime/CampaignInteractions.js';
import {disconnectEntity} from './levels/runtime/LevelActions.js';
import {CampaignHUD} from './ui/CampaignHUD.js';
import {CampaignScene} from './visual/CampaignScene.js';
export class CampaignGame extends FrameGame {
 constructor(root,definition,options={}){
  super(root);this.options=options;this.definition=definition;this.time=0;this.saveTime=0;this.intro=9;
  let storage;try{storage=window.localStorage;}catch{}this.store=new CampaignStore(storage);
  this.session=new CampaignSession(definition,(text,tone)=>this.hud?.message(text,tone,7));
  if(!options.fresh)this.store.load(this.session,{replay:options.replay});
  this.saved=this.store.available;this.hints=new ProgressiveHints(()=>this.session.hint());
  const session=this.session;this.state={get player(){return session.ray.state.position;},set player(p){session.ray.state.position=p;},get energy(){return session.world.get('battery')?.state.energy??0;},get charging(){return session.world.get('battery')?.state.charging;},get started(){return session.started;},get completed(){return session.completed;}};
  this.hud=new CampaignHUD(root,a=>this.action(a),session,()=>options.completed?.()??[]);
  this.audio=new GameAudio();this.scene=new CampaignScene(this.hud.world,session,this.audio);this.movement=new Movement(this,session.navigation);
  this.interactions=new CampaignInteractions(this);this.interactions.setTool('hand');bindGameInput(this,{isUnlocked:()=>session.started&&!session.completed});this.save();
 }
 save(){if(!this.session)return;this.saved=this.store.save(this.session,{replay:this.options.replay});}
 setActive(active){this.stopFrames();this.movement.clear();if(active){this.scene.resize();this.startFrames();if(this.session.completed)this.hud.showDialog('complete',this.state,this.saved);}else{this.save();this.audio.suspend();if(this.hud.dialog.open)this.hud.closeDialog();}}
 goNear(id,arrive){
  const e=this.session.world.get(id);if(!e)return;
  const p=e.state.position,ray=this.state.player;
  if(Math.hypot(p.x-ray.x,p.z-ray.z)<(id==='exit'?.1:1.45)){arrive?.();return;}
  const direct=id==='exit'?p:e.config.walkPoint;
  const candidates=direct?[direct]:Array.from({length:16},(_,i)=>({x:p.x+Math.cos(i*Math.PI/8)*.95,z:p.z+Math.sin(i*Math.PI/8)*.95}));
  candidates.sort((a,b)=>Math.hypot(a.x-ray.x,a.z-ray.z)-Math.hypot(b.x-ray.x,b.z-ray.z));
  const goal=candidates.find(q=>this.session.navigation.walkable(q,this.state)&&this.session.navigation.findPath(ray,q,this.state).length);
  if(goal)this.movement.go(goal,arrive);else this.hud.message('راه بسته است یا کابل کوتاه مانع حرکت شده؛ مسیر و اتصال رِی را بررسی کن.','error',7);
 }
 action(action){
  if(!this.active)return;this.audio.unlock();
  if(action==='close'){this.hud.closeDialog();return;}
  if(action.startsWith('stage:')){this.options.onStage?.(Number(action.slice(6)));return;}
  if(action==='next'){this.options.onNext?.();return;}
  if(action==='replay'||action==='restart'){this.options.onRestart?.(action==='replay');return;}
  if(action==='begin'){this.session.started=true;this.hud.message('رِی با نشان «شما» مشخص است؛ روی زمین بزن تا حرکت کند.','info',7);this.save();return;}
  if(action==='view'){this.scene.toggleOverview();return;}
  if(action==='sound'){const on=this.audio.toggle();this.root.querySelector('[data-story-action="sound"]').setAttribute('aria-pressed',String(!on));return;}
  if(['help','reset','bag','circuit','levels'].includes(action)){this.movement.clear();this.save();this.hud.showDialog(action,this.state,this.saved);return;}
  if(action==='hint'){if(this.hud.dialog.open)this.hud.closeDialog();this.hud.message(this.hints.next(this.session),'info',12);return;}
  if(action==='recover'){
   this.hud.closeDialog();disconnectEntity(this.session.world,'battery');this.session.ray.state.position={...this.definition.start};this.movement.clear();this.hud.message('رِی به ورودی برگشت؛ پیشرفت معما حفظ شد.');this.save();return;
  }
  if(!this.session.started||this.session.completed||this.hud.dialog.open)return;
  if(['hand','cable','meter'].includes(action)){this.interactions.setTool(action);return;}
  if(action==='battery'){this.interactions.setTool('hand');this.interactions.object('battery');return;}
  if(action==='wire-object'){const id=this.interactions.selected;this.interactions.setTool('cable');if(id)this.interactions.object(id);return;}
  if(action==='disconnect'){this.interactions.unplug();return;}
  if(action==='interact'){const id=this.interactions.nearest();if(id)this.interactions.object(id);return;}
  if(action==='cancel-cable'){this.interactions.cancelCable();return;}
  if(action.startsWith('unplug:')){this.interactions.unplug(action.slice(7));return;}
  if(action.startsWith('op:'))this.interactions.command(action.slice(3));
 }
 step(dt){
  const paused=this.hud.dialog.open||!this.session.started||this.focusPaused;this.session.paused=paused;
  if(!paused){
   this.time+=dt;if(!this.session.inTransit())this.movement.update(dt);else this.movement.clear();const events=this.session.update(dt);
   for(const event of events){
    const e=this.session.world.get(event.id);
    if(event.type==='overload')this.hud.message((e?.config.label??'منبع')+' اضافه‌بار دارد؛ یک مصرف‌کننده را قطع کن و محافظ را برگردان.','error',8);
    if(event.type==='empty')this.hud.message((e?.config.label??'بسته')+' انرژی کافی ندارد؛ از جایگاه شارژ استفاده کن.','error',7);
    if(event.type==='stage-complete'){this.movement.clear();this.options.onComplete?.(this.definition.number);this.save();this.hud.showDialog('complete',this.state,this.saved);}
   }
   this.saveTime+=dt;if(this.saveTime>1.5){this.save();this.saveTime=0;}
  }
  this.scene.feedback?.update(this.interactions,this.time);
  this.scene.render(this.time,paused?0:dt,this.interactions.selected,this.movement.moving);
  this.hud.update(this.state,this.scene,this.interactions.tool,this.interactions.selected,this.interactions.nearest(),9,paused?0:dt,this.interactions);
 }
 dispose(){this.setActive(false);super.dispose();this.scene.dispose();this.audio.dispose();this.hud.dispose();}
}
