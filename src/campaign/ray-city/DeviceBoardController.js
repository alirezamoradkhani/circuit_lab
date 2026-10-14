import {CityGame} from '../../city/CityGame.js';
import {renderCabinet} from '../../city/AdventureView.js';
import {deviceCircuit} from './DeviceCircuit.js';
import {deviceReadings} from './devices.js';
import {organizeDevicePanel} from './DevicePanelLayout.js';
export class DeviceBoardController extends CityGame {
 constructor(root,session,devices,onChange){super(root);this.index=session.index;this.sessions.set(this.index,session);this.devices=devices;this.onChange=onChange;this.root.innerHTML='<div data-stage></div>';this.active=false;
  this.dragAbort=new AbortController();const options={signal:this.dragAbort.signal};
  root.addEventListener('pointerdown',e=>{const s=this.sessions.get(this.index),pin=e.target.closest('[data-pin]');if(!this.active||!pin||s.street||s.tool==='meter'||s.won||e.button!==0)return;this.wireDrag={pin:pin.dataset.pin,x:e.clientX,y:e.clientY};pin.setPointerCapture(e.pointerId);},options);
  root.addEventListener('pointerup',e=>{const drag=this.wireDrag;this.wireDrag=null;if(!drag||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-pin]');if(!end)return;const s=this.sessions.get(this.index);s.pending=null;s.pin(drag.pin);s.pin(end.dataset.pin);this.renderGame();},options);
  root.addEventListener('pointercancel',()=>this.wireDrag=null,options);
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
  this.root.scrollTop=scroll;
  this.onChange?.(s);
 }
 handle(e){
  if(e.target.closest('[data-ray-meter]')){const s=this.sessions.get(this.index);s.tool='meter';this.renderGame();return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(['restart','map','next','close-circuit','close-panel'].includes(action))return;
  const switchId=e.target.closest('[data-ray-switch]')?.dataset.raySwitch;
  super.handle(e);
  if(switchId)this.root.querySelector('[data-ray-switch="'+switchId+'"]')?.focus({preventScroll:true});
 }
 close(){this.shopInteractions.cancel();this.active=false;const s=this.sessions.get(this.index);s.pending=null;}
 dispose(){this.close();this.dragAbort.abort();this.root.innerHTML='';}
}
