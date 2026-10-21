import {FrameGame} from '../engine/FrameGame.js';
import {Movement} from '../engine/Movement.js';
import {createNavigation} from '../engine/createNavigation.js';
import {GameAudio} from '../engine/GameAudio.js';
import {bindGameInput} from '../engine/GameInput.js';
import {CityRayScene} from './CityRayScene.js';
import {CityRayHUD} from './CityRayHUD.js';
import {WorldCircuit} from './WorldCircuit.js';
import {missionDevices} from './devices.js';
export class CityRayGame extends FrameGame {
 constructor(root,session,options={}){
  super(root);this.session=session;this.options=options;this.devices=missionDevices(session);this.time=0;this.world=new WorldCircuit(session,this.devices);
  this.state={started:false,player:{x:0,z:3.05}};this.movementAxes='screen';this.audio=new GameAudio();
  this.hud=new CityRayHUD(root,a=>this.action(a),session);this.scene=new CityRayScene(this.hud.world,this.world);
  const nav=createNavigation({bounds:{minX:-5.55,maxX:5.55,minZ:-3.45,maxZ:3.45},obstacles:()=>this.world.parts.filter(d=>session.board.parts.includes(d.part)).map(d=>({...d.position,w:1.2,d:.8})),radius:.19});this.movement=new Movement(this,nav);
  try{this.storage=window.localStorage;const saved=JSON.parse(this.storage.getItem('circuit-lab.ray-city.world.v2.'+session.mission.id));if(saved?.started){this.state.started=true;if(nav.walkable(saved.player,this.state))this.state.player=saved.player;}}catch{}
  this.interactions={tool:'hand',selected:null,object:id=>this.selectObject(id),nearest:()=>this.world.selected};
  bindGameInput(this,{isUnlocked:()=>this.state.started&&!this.world.choice});
  window.addEventListener('keydown',e=>this.key(e),{capture:true,signal:this.abort.signal});
 }
 key(e){
  if(!this.active||this.hud.dialog.open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(!this.state.started){if(e.code==='Enter'){e.preventDefault();e.stopPropagation();this.action('begin');}return;}
  const commands={KeyE:'interact',Enter:'interact',Space:'interact',KeyQ:'cycle',KeyX:'cut',Delete:'cut',KeyC:'terminal',KeyM:'meter',KeyH:'hint',KeyF:'test',KeyT:'test',KeyR:'recover',KeyN:'next',Escape:'cancel',KeyL:'levels',KeyV:'view'};
  if(this.world.choice&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD'].includes(e.code)){e.preventDefault();e.stopPropagation();this.action(['ArrowLeft','ArrowUp','KeyA'].includes(e.code)?'option-prev':'option-next');return;}
  if(commands[e.code]){e.preventDefault();e.stopPropagation();if(!e.repeat)this.action(commands[e.code]);}
 }
 selectObject(id){const target=this.world.targets().find(t=>t.id===id);if(!target)return;if(this.world.range(target,this.state.player)>1.25){this.hud.message('رِی را با کلیدهای حرکت کنار همین قطعه یا مسیر ببر.');return;}this.world.selected=id;this.world.lockAt={...this.state.player};this.hud.message(target.label+' انتخاب شد؛ E تعامل، X قطع مسیر، M اندازه‌گیری.');}
 changed(){this.workUntil=this.time+.55;this.audio.play(this.session.won?'complete':'plug');this.hud.message(this.session.message,this.session.won?'success':this.session.tripped?'error':'info');if(this.session.won)this.options.onComplete?.(this.session);this.save();}
 openOptions(d){const options=this.world.options(d);if(!options.length){this.hud.message(this.world.measure());return;}this.movement.clear();this.world.choice={device:d,options,index:0};}
 action(a){
  if(!this.active)return;this.audio.unlock();const w=this.world;
  if(a==='begin'){this.state.started=true;this.hud.message(w.canRewire?'رِی داخل مدار است. به مسیرها نگاه کن؛ کنار پایانه E، کنار قطعه E، Q تغییر انتخاب.':'کنار قطعه E بزن تا تنظیمش کنی؛ M اندازه‌گیری و F آزمایش همین مدار است. مسیرهای این مرحله ثابت‌اند.');this.scene.renderer.domElement.focus({preventScroll:true});this.save();return;}
  if(a==='levels'){this.movement.clear();this.hud.showDialog(this.options.menu());return;}
  if(a.startsWith('mission:')){this.options.onMission?.(Number(a.split(':')[1]));return;}
  if(a==='close'){this.hud.closeDialog();return;}
  if(a==='next'){if(this.session.won)this.options.onNext?.();return;}
  if(a==='view'){this.scene.toggleOverview();return;}
  if(a==='sound'){this.audio.toggle();return;}
  if(a==='restart'){this.options.onRestart?.();return;}
  if(a==='reset'){this.hud.showDialog('<h2>شروع دوبارهٔ مأموریت؟</h2><button data-story-action="restart">شروع دوباره</button>');return;}
  if(a==='recover'){if(this.session.tripped){this.session.resetFuse();this.changed();}return;}
  if(a==='cancel'||a==='hand'){w.choice=null;w.start=null;this.hud.message('ابزار رها شد؛ حرکت آزاد.');return;}
  if(a==='option-prev'||a==='option-next'){const c=w.choice;if(c)c.index=(c.index+(a==='option-prev'?-1:1)+c.options.length)%c.options.length;return;}
  if(a==='hint'||a==='help'){this.hud.message(w.hint(),'hint');return;}
  if(a==='test'){if(this.session.board.parts.some(p=>p.type==='switch'&&!p.closed)){this.hud.message('کلید اصلی باز است؛ برای آزمون تعمیر، مدار باید تغذیه شود.');return;}this.session.test();this.changed();return;}
  if(a==='cycle'){w.selectNearby(this.state.player,true);return;}
  if(a==='cut'){w.choice=null;const before=this.session.board.wires.length;this.hud.message(w.disconnect());if(this.session.board.wires.length<before){this.audio.play('unplug');this.workUntil=this.time+.55;}this.save();return;}
  if(a==='terminal'||a==='cable'){w.selectNearby(this.state.player,false,'pin');this.hud.message(w.target()?.type==='pin'?'پایانه انتخاب شد؛ E برداشتن / اتصال.':'کنار یک پایانهٔ لحیم بایست.');return;}
  if(a==='meter'){this.hud.message(w.measure());return;}
  if(a==='interact'){
   if(w.choice){const c=w.choice;c.options[c.index].run();w.choice=null;this.changed();return;}
   const t=w.selectNearby(this.state.player);if(!t){this.hud.message('نزدیک‌تر برو؛ وقتی محدودهٔ طلایی دیده شد E بزن.');return;}
   if(t.type==='pin'){const before=this.session.board.wires.length;this.hud.message(w.connect(t.pin));if(this.session.board.wires.length>before){this.audio.play('plug');this.workUntil=this.time+.55;}this.save();}
   else if(t.type==='wire')this.hud.message('مسیر انتخاب شد؛ X برای قطع، Q انتخاب قطعه یا پایانهٔ کناری.');
   else this.openOptions(t.device);
  }
 }
 save(){try{this.storage?.setItem('circuit-lab.ray-city.world.v2.'+this.session.mission.id,JSON.stringify(this.state));}catch{}}
 setActive(active){this.movement.clear();if(active){this.scene.resize();this.startFrames();}else{this.stopFrames();this.hud.closeDialog();this.audio.suspend();this.save();}}
 step(dt){
  if(this.state.started&&!this.focusPaused&&!this.hud.dialog.open&&!this.world.choice){this.time+=dt;this.movement.update(dt);this.world.selectNearby(this.state.player);}
  this.state.working=this.time<(this.workUntil||0);
  this.scene.render(this.state,this.time,this.movement.moving,9,this.world.selected,dt);this.hud.update(this.state,this.scene,this.world);
 }
 dispose(){this.setActive(false);super.dispose();this.scene.dispose();this.audio.dispose();this.hud.dispose();}
}
