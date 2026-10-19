import {CityGame} from '../../city/CityGame.js';
import {renderCabinet} from '../../city/AdventureView.js';
import {deviceCircuit} from './DeviceCircuit.js';
import {deviceReadings} from './devices.js';
import {organizeDevicePanel} from './DevicePanelLayout.js';
export class DeviceBoardController extends CityGame {
 constructor(root,session,devices,onChange,options={}){super(root);this.index=session.index;this.sessions.set(this.index,session);this.devices=devices;this.onChange=onChange;this.onClose=options.onClose;this.focusKey=null;this.root.innerHTML='<div data-stage></div>';this.active=false;
  this.dragAbort=new AbortController();const listenerOptions={signal:this.dragAbort.signal};
  root.addEventListener('pointerdown',e=>{const s=this.sessions.get(this.index),pin=e.target.closest('[data-pin]');if(!this.active||!pin||s.street||s.tool==='meter'||s.won||e.button!==0)return;this.wireDrag={pin:pin.dataset.pin,x:e.clientX,y:e.clientY};pin.setPointerCapture(e.pointerId);},listenerOptions);
  root.addEventListener('pointerup',e=>{const drag=this.wireDrag;this.wireDrag=null;if(!drag||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-pin]');if(!end)return;const s=this.sessions.get(this.index);s.pending=null;s.pin(drag.pin);s.pin(end.dataset.pin);this.renderGame();},listenerOptions);
  root.addEventListener('pointercancel',()=>this.wireDrag=null,listenerOptions);
  root.addEventListener('keydown',e=>this.handleKeyboard(e),{signal:this.dragAbort.signal,capture:true});
 }
 renderMap(){}
 setDevice(device){this.device=device;const s=this.sessions.get(this.index);s.pending=null;s.meteredPart=null;s.meteredWire=null;s.messageTarget=null;s.panel=true;s.circuitExpanded=false;this.active=true;this.renderGame();}
 renderGame(){
  if(!this.device)return;const s=this.sessions.get(this.index),d=this.device;
  const scroll=this.root.scrollTop;
  const editor=this.el('[data-stage]');editor.classList.toggle('meter-mode',s.tool==='meter');editor.innerHTML=renderCabinet(s,true);
  editor.querySelector('.cabinet-panel>header')?.remove();editor.querySelectorAll('.scene-message').forEach(n=>n.remove());
  const schematic=deviceCircuit(s,d,this.devices);
  if(!s.shop||d.id==='supply'){
   const old=editor.querySelector('.circuit-diagram-scroll,svg.shop-circuit');
   if(old){const replacement=document.createElement('div');replacement.className='ray-local-diagram';replacement.innerHTML=schematic;old.replaceWith(replacement);}
   else editor.querySelector('.cabinet-panel').insertAdjacentHTML('afterbegin','<div class="ray-local-diagram">'+schematic+'</div>');
  }
  if(s.shop&&d.id==='supply')editor.querySelectorAll('.probe-meter,.removed-part-tray,.spare-parts').forEach(n=>n.remove());
  // Only the selected physical device exposes changeable controls. Common-source
  // connectors still refer to the original board; no private circuit copy is made.
  editor.querySelectorAll('.challenge-setting,.infrastructure-setting').forEach(row=>{
   const buttons=[...row.querySelectorAll('[data-challenge]')];
   if(!buttons.some(b=>d.keys.includes(b.dataset.challenge))){row.remove();return;}
   if(s.mission.id==='isolation')buttons.filter(b=>b.dataset.challenge==='repair'&&!d.keys.includes(b.dataset.value)).forEach(b=>b.remove());
  });
  editor.querySelectorAll('.street-branches article').forEach(row=>{if(!row.querySelector('[data-street-inspect]')||!d.partIds.includes(row.querySelector('[data-street-inspect]').dataset.streetInspect))row.remove();});
  if(s.street&&d.id!=='street-2')editor.querySelector('.street-cable')?.remove();
  editor.querySelectorAll('.appliance-list>[data-load]').forEach(b=>{if(Number(b.dataset.load)!==d.loadIndex)b.remove();});
  if(d.id!=='supply'&&!s.shop)editor.querySelectorAll('.cabinet-switch,[data-challenge="main"],[data-challenge="source"]').forEach(n=>n.remove());
  if(d.id==='supply'){
   editor.querySelectorAll('.street-branches,.resistor-slot,.spare-parts,.appliance-list').forEach(n=>n.remove());
   if(!s.challenge&&s.mission.id!=='clinic'&&!editor.querySelector('.cabinet-switch'))editor.querySelector('.cabinet-panel').insertAdjacentHTML('beforeend','<button data-action="switch">کلید منبع: '+(s.board.parts[1].closed?'بسته':'باز')+'</button>');
  }
  editor.querySelectorAll('[data-action="expand-circuit"],[data-action="close-circuit"],[data-action="close-panel"]').forEach(n=>n.remove());
  const actions=document.createElement('footer');actions.className='ray-board-actions';actions.innerHTML='<button data-tool="inspect" aria-pressed="'+(s.tool==='inspect')+'">تعمیر</button><button data-tool="meter" aria-pressed="'+(s.tool==='meter')+'">مولتی‌متر</button>'+(!s.won?'<button data-action="test">'+(s.challenge?.testLabel||'آزمایش شبکه')+'</button>':'<button data-story-action="next">مأموریت بعد</button>')+(s.tripped?'<button data-action="reset-fuse">بازنشانی محافظ</button>':'')+'<button data-action="hint">سرنخ</button>';editor.append(actions);
  const feedback=document.createElement('div');feedback.className='ray-board-feedback';feedback.setAttribute('role','status');feedback.textContent=s.won?s.mission.success+' '+s.mission.lesson:s.message;editor.append(feedback);
  const budget=document.createElement('p');budget.className='ray-shared-note';budget.textContent='مدار '+d.label+' · اتصال‌های علامت‌گذاری‌شده به تابلو یا دستگاه‌های دیگر مشترک‌اند. اعتبار باقی‌مانده: '+s.credits.toLocaleString('fa-IR');editor.prepend(budget);
  const plate=document.createElement('p');plate.className='ray-device-plate';plate.textContent=s.mission.plate;editor.querySelector('.cabinet-panel').append(plate);
  if(s.mission.id==='clinic'&&s.tool==='meter'){
   const r=deviceReadings(s,d);editor.querySelector('.component-meter')?.remove();editor.querySelector('.cabinet-panel').insertAdjacentHTML('afterbegin','<div class="component-meter"><strong>'+d.label+'</strong><output dir="ltr">'+r.voltage.toFixed(2)+' V</output><span dir="ltr">I = '+r.current.toFixed(2)+' A</span></div>');
  }
  organizeDevicePanel(editor, s, d);
  const touch=document.createElement('nav');touch.className='ray-touch-controls';touch.setAttribute('aria-label','کنترل لمسی مدار');touch.innerHTML='<button data-ray-key="previous" aria-label="هدف قبلی">‹</button><button data-ray-key="activate" aria-label="اجرای هدف انتخاب‌شده">انتخاب</button><button data-ray-key="next" aria-label="هدف بعدی">›</button><button data-ray-key="meter" aria-label="فعال‌کردن مولتی‌متر">V</button>';editor.append(touch);
  this.root.scrollTop=scroll;
  this.onChange?.(s);
  if(this.focusKey)this.focusCircuitTarget(this.focusKey);
 }
 focusKeyFor(el){if(!el)return null;const d=el.dataset;return d.rayRobot?'robot:'+d.rayRobot:d.raySwitch?'switch:'+d.raySwitch:d.raySelect?'select:'+d.raySelect:d.measurePart?'measure:'+d.measurePart:d.pin?'pin:'+d.pin:null;}
 focusCircuitTarget(key=this.focusKey){if(!key)return;const parts=key.split(':'),kind=parts.shift(),value=parts.join(':');const selectors={robot:'[data-ray-robot="'+value+'"]',switch:'[data-ray-switch="'+value+'"]',select:'[data-ray-select="'+value+'"]',measure:'[data-measure-part="'+value+'"]',pin:'[data-pin="'+value+'"]'};this.root.querySelector(selectors[kind])?.focus({preventScroll:true});}
 circuitTargets(){const s=this.sessions.get(this.index),ordered=s?.tool==='meter'?[...this.root.querySelectorAll('[data-measure-part],[data-ray-select]')]:[...this.root.querySelectorAll('[data-ray-robot]'),...this.root.querySelectorAll('[data-ray-switch]'),...this.root.querySelectorAll('[data-ray-select]'),...this.root.querySelectorAll('[data-measure-part]'),...this.root.querySelectorAll('[data-pin]')];return ordered.filter((el,i)=>ordered.indexOf(el)===i);}
 focusFirstTarget(){const targets=this.circuitTargets();if(!targets.length)return;this.focusKey=this.focusKeyFor(targets[0]);targets[0].focus({preventScroll:true});}
 focusNext(direction=1){const targets=this.circuitTargets();if(!targets.length)return;const current=document.activeElement,index=targets.indexOf(current),base=index<0?0:index+direction;const next=targets[(base+targets.length)%targets.length];this.focusKey=this.focusKeyFor(next);next.focus({preventScroll:true});}
 activateFocused(){let el=document.activeElement;if(!this.focusKeyFor(el)&&this.focusKey){this.focusCircuitTarget(this.focusKey);el=this.root.querySelector('[data-ray-robot],[data-ray-switch],[data-ray-select],[data-measure-part],[data-pin]:focus');}if(el&&this.root.contains(el)&&this.focusKeyFor(el)){this.focusKey=this.focusKeyFor(el);this.handle({target:el});}}
 handleKeyboard(e){
  if(!this.active)return;
  const s=this.sessions.get(this.index),code=e.code;
  if(code==='Escape'){e.preventDefault();e.stopPropagation();this.onClose?.();return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(code)){e.preventDefault();e.stopPropagation();this.focusNext(code==='ArrowLeft'||code==='ArrowUp'?-1:1);return;}
  if(e.repeat)return;
  if(code==='KeyM'){e.preventDefault();e.stopPropagation();s.tool='meter';s.pending=null;this.focusKey=null;this.renderGame();this.focusNext(1);return;}
  if(code==='KeyI'){e.preventDefault();e.stopPropagation();s.tool='inspect';s.pending=null;this.renderGame();this.focusNext(1);return;}
  if(code==='KeyB'&&this.device?.id==='guard-lamp'){e.preventDefault();e.stopPropagation();if(s.tool!=='meter'){s.toggleRobotContact();this.renderGame();}return;}
  if(code==='KeyT'){e.preventDefault();e.stopPropagation();s.test();this.onChange?.(s);this.renderGame();return;}
  if(code==='KeyH'){e.preventDefault();e.stopPropagation();s.hint();this.renderGame();return;}
  if(code==='KeyR'&&s.tripped){e.preventDefault();e.stopPropagation();s.resetFuse();this.renderGame();return;}
  if(code==='Enter'||code==='Space'||code==='KeyE'){e.preventDefault();e.stopPropagation();this.activateFocused();}
 }
 handle(e){
  const s=this.sessions.get(this.index),touchKey=e.target.closest('[data-ray-key]')?.dataset.rayKey;
  if(touchKey){if(touchKey==='previous'||touchKey==='next'){this.focusNext(touchKey==='previous'?-1:1);}else if(touchKey==='activate'){this.activateFocused();}else if(touchKey==='meter'){s.tool='meter';s.pending=null;this.focusKey=null;this.renderGame();this.focusFirstTarget();}return;}
  const target=e.target.closest('[data-ray-robot],[data-ray-select],[data-ray-meter]');
  if(target)this.focusKey=this.focusKeyFor(target);
  const robot=e.target.closest('[data-ray-robot]');
  if(robot){if(s.tool==='meter'){s.message='رِی خودش قطعه نیست؛ برای اندازه‌گیری یک قطعه را انتخاب کن.';}else{s.toggleRobotContact();}this.renderGame();return;}
  const select=e.target.closest('[data-ray-select]');
  if(select){s.tool='meter';s.meteredPart=select.dataset.raySelect;s.meteredWire=null;this.renderGame();return;}
  if(e.target.closest('[data-ray-meter]')){s.tool='meter';s.meteredPart=this.device?.loadIndex!==undefined?null:this.device?.partIds?.[0]||null;this.renderGame();return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(['restart','map','next','close-circuit','close-panel'].includes(action))return;
  const switchId=e.target.closest('[data-ray-switch]')?.dataset.raySwitch;
  super.handle(e);
  if(switchId)this.root.querySelector('[data-ray-switch="'+switchId+'"]')?.focus({preventScroll:true});
 }
 close(){this.shopInteractions.cancel();this.active=false;const s=this.sessions.get(this.index);s.pending=null;}
 dispose(){this.close();this.dragAbort.abort();this.root.innerHTML='';}
}
