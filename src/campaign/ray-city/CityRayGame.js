import {FrameGame} from '../engine/FrameGame.js';
import {Movement} from '../engine/Movement.js';
import {createNavigation} from '../engine/createNavigation.js';
import {GameAudio} from '../engine/GameAudio.js';
import {bindGameInput} from '../engine/GameInput.js';
import {ROOM} from '../workshop/layout.js';
import {freshState} from '../workshop/state.js';
import {CityRayScene} from './CityRayScene.js';
import {CityRayHUD} from './CityRayHUD.js';
import {DeviceBoardController} from './DeviceBoardController.js';
import {missionDevices,canReachDevice,deviceReadings} from './devices.js';
export class CityRayGame extends FrameGame {
 constructor(root,session,options={}){
  super(root);this.session=session;this.options=options;this.devices=missionDevices(session);this.time=0;this.intro=9;
  this.state={...freshState(),player:{x:0,z:3.45},cart:1,reel:true,door:session.won};
  try{this.storage=window.localStorage;const position=JSON.parse(this.storage.getItem('circuit-lab.ray-city.position.'+session.mission.id));if(position?.started)this.state.started=true;this.savedPosition=position?.player;}catch{}
  this.hud=new CityRayHUD(root,a=>this.action(a),session,this.devices);this.scene=new CityRayScene(this.hud.world,session,this.devices);this.audio=new GameAudio();
  const nav=createNavigation({bounds:ROOM,obstacles:()=>this.devices.map(d=>({...d.position,w:.65,d:.65})),blocked:()=>false,tetherAllows:()=>true});
  if(this.savedPosition&&Number.isFinite(this.savedPosition.x)&&Number.isFinite(this.savedPosition.z)&&nav.walkable(this.savedPosition,this.state))this.state.player={...this.savedPosition};
  this.movement=new Movement(this,nav);
  this.worldCable={active:false,start:null,hovered:null};
  this.interactions={tool:'hand',selected:null,object:id=>this.interact(id),nearest:()=>this.nearest()};
  this.board=new DeviceBoardController(this.hud.deviceDialog.querySelector('.ray-device-editor'),session,this.devices,s=>this.changed(s),{onClose:()=>this.action('device-close')});
  bindGameInput(this,{isUnlocked:()=>this.state.started&&!this.hud.deviceDialog.open});
  this.root.addEventListener('keydown',e=>{if(this.hud.deviceDialog.open)e.stopPropagation();},{signal:this.abort.signal});
  this.hud.root.querySelector('[data-story-action="begin"]').textContent='ورود به محیط';
 }
 nearest(){let best=1.4,id=null;for(const d of this.devices){const delta=Math.hypot(this.state.player.x-d.walk.x,this.state.player.z-d.walk.z);if(delta<best){best=delta;id='city-device:'+d.id;}}return id;}
 supportsWorldWiring(){return ['gate','street','station'].includes(this.session.mission.id);}
 nearestTerminal(){let best=1.05,id=null;for(const [terminalId,view] of this.scene.terminalViews){const delta=Math.hypot(this.state.player.x-view.position.x,this.state.player.z-view.position.z);if(delta<best){best=delta;id=terminalId;}}return id;}
 interact(id){if(id?.startsWith('city-terminal:')){this.selectWorldTerminal(id);return;}this.visit(id);}
 toggleWorldCable(){
  if(!this.supportsWorldWiring()){this.hud.message('این مأموریت با کلیدهای خود قطعات حل می‌شود؛ اتصال مستقیم برای این مرحله فعال نیست.');return;}
  this.worldCable.active=!this.worldCable.active;this.worldCable.start=null;this.worldCable.hovered=null;
  this.hud.message(this.worldCable.active?'حالت کابل فعال شد؛ کنار یک ترمینال بایست و E بزن. برای لغو دوباره C را بزن.':'حالت کابل لغو شد.');
 }
 selectWorldTerminal(id){
  if(!this.worldCable.active)this.toggleWorldCable();if(!this.worldCable.active)return;
  const terminal=this.scene.terminalViews.get(id);if(!terminal)return;
  if(!this.worldCable.start){this.worldCable.start=id;this.worldCable.hovered=id;this.hud.message('ترمینال اول انتخاب شد؛ به ترمینال مقصد برو و E بزن.');return;}
  if(this.worldCable.start===id){this.worldCable.start=null;this.worldCable.hovered=null;this.hud.message('انتخاب ترمینال لغو شد.');return;}
  const start=this.scene.terminalViews.get(this.worldCable.start);if(!start){this.worldCable.start=null;return;}
  const existing=this.session.board.wires.findIndex(w=>w.includes(start.pin)&&w.includes(terminal.pin));
  if(existing>=0)this.session.removeWire(existing);else{this.session.pin(start.pin);this.session.pin(terminal.pin);}
  this.worldCable.start=null;this.worldCable.hovered=null;this.changed(this.session);this.save();
 }
 visit(id){
  if(this.hud.deviceDialog.open)return;
  if(id==='exit'){if(!this.session.won){this.hud.message(this.session.mission.objective);return;}this.movement.go({x:2.35,z:-3.4},()=>this.options.onNext?.());return;}
  const d=this.devices.find(d=>id==='city-device:'+d.id);if(!d)return;this.interactions.selected=id;
  this.movement.go(d.walk,()=>{if(!canReachDevice(this.state.player,d))return;this.movement.clear();this.board.setDevice(d);this.hud.openDevice(d);this.board.focusFirstTarget();});
 }
 changed(s){this.hud.message(s.won?s.mission.lesson:s.message,s.won?'success':s.tripped?'error':'info');this.state.door=s.won;if(s.won)this.options.onComplete?.(s);}
 save(){try{this.storage?.setItem('circuit-lab.ray-city.position.'+this.session.mission.id,JSON.stringify({started:this.state.started,player:this.state.player}));}catch{}}
 setActive(active){this.movement.clear();if(active){this.scene.resize();this.startFrames();}else{this.stopFrames();this.board.close();this.hud.closeDevice();this.hud.closeDialog();this.audio.suspend();this.save();}}
 action(action){
  if(!this.active)return;this.audio.unlock();
  if(action==='begin'){this.state.started=true;this.save();return;}
  if(action==='device-close'){this.board.close();this.hud.closeDevice();this.interactions.selected=null;return;}
  if(action==='levels'){this.hud.showDialog('help',this.state,true);this.root.querySelector('[data-dialog-content]').innerHTML=this.options.menu();return;}
  if(action.startsWith('mission:')){this.options.onMission?.(Number(action.split(':')[1]));return;}
  if(action==='next'){if(this.session.won)this.options.onNext?.();return;}
  if(action==='close'){this.hud.closeDialog();return;}
  if(action==='view'){this.scene.toggleOverview();return;}
  if(action==='sound'){this.audio.toggle();return;}
  if(action==='restart'){this.options.onRestart?.();return;}
  if(action==='reset'){this.hud.showDialog('help',this.state,true);this.root.querySelector('[data-dialog-content]').innerHTML='<h2>شروع دوباره همین مأموریت؟</h2><button data-story-action="restart">شروع دوباره</button>';return;}
  if(action==='hint'){this.session.hint();this.hud.message(this.session.message);if(this.hud.deviceDialog.open)this.board.renderGame();return;}
  if(action==='test'){this.session.test();this.changed(this.session);return;}
  if(action==='help'){this.hud.showDialog('help',this.state,true);return;}
  if(action==='interact'){if(this.worldCable.active){const id=this.nearestTerminal();if(id)this.selectWorldTerminal(id);return;}const id=this.nearest();if(id)this.visit(id);return;}
  if(action==='cable'){this.toggleWorldCable();return;}
  if(action==='hand'){if(this.worldCable.active)this.toggleWorldCable();return;}
  if(['circuit','meter','bag','battery'].includes(action)){const id=this.interactions.selected||this.nearest();if(id)this.visit(id);return;}
 }
 step(dt){
  this.worldCable.hovered=this.worldCable.active?this.nearestTerminal():null;
  if(this.state.started&&!this.focusPaused&&!this.hud.dialog.open&&!this.hud.deviceDialog.open){this.time+=dt;this.movement.update(dt);}
  this.state.door=this.session.won;
  this.scene.render(this.state,this.time,this.movement.moving,9,this.interactions.selected,dt,this.worldCable);
  this.hud.update(this.state,this.scene,'hand',this.interactions.selected,this.nearest(),9,dt);
 }
 dispose(){this.setActive(false);super.dispose();this.board.dispose();this.scene.dispose();this.audio.dispose();this.hud.dispose();}
}
