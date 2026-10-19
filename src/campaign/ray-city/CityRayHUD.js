import {SceneHUD} from '../ui/SceneHUD.js';
export class CityRayHUD extends SceneHUD {
 constructor(root,onAction,session,devices){
  const names=Object.fromEntries(devices.map(d=>['city-device:'+d.id,d.label]));names.exit='خروج به مأموریت بعد';
  super(root,onAction,{names,pins:[],labels:{chapter:'شهر روشن / مأموریت '+(session.index+1).toLocaleString('fa-IR'),title:session.mission.title,introChapter:'گزارش خرابی',introTitle:session.mission.title,introText:session.mission.request},
   available:id=>id!=='exit'||session.won,goal:()=>session.won?'exit':null,objective:()=>session.won?session.mission.success:session.mission.objective,
   canUnplug:()=>false,interactionLabel:(s,id)=>id==='exit'?'مأموریت بعد':'باز کردن مدار '+(names[id]||'دستگاه'),visible:()=>true,
   dialogContent:(kind)=>kind==='help'?'<h2>'+session.mission.title+'</h2><p>'+session.mission.request+'</p><p>'+session.mission.objective+'</p><p>کنار هر دستگاه برو و مدار خودش را باز کن. پایانه‌ها و سیم‌ها متعلق به همان شبکه مشترک‌اند. مدار دستگاه دیگر را از محل خودش باز کن.</p><button data-story-action="hint">سرنخ مرحله</button>':'',
  });
  this.stage.classList.add('ray-city-stage');this.root.querySelector('.story-battery').hidden=true;
  const levels=document.createElement('button');levels.dataset.storyAction='levels';levels.setAttribute('aria-label','مأموریت‌ها');levels.textContent='☷';root.querySelector('.story-small-tools').prepend(levels);
  levels.remove();
  root.querySelector('.story-dock').innerHTML='<button data-story-action="hand" aria-pressed="true">'+root.querySelector('.story-context svg').outerHTML+'<span>تعامل</span></button><button data-story-action="levels">☷<span>مأموریت‌ها</span></button><button data-story-action="hint">?<span>سرنخ</span></button><button data-story-action="test">ϟ<span>آزمایش شبکه</span></button>';
  const status=document.createElement('p');status.className='ray-field-message';status.setAttribute('role','status');status.setAttribute('aria-live','polite');this.stage.append(status);this.fieldMessage=status;
  const quick=document.createElement('aside');quick.className='ray-quick-start';quick.innerHTML='<strong>از اینجا شروع کن</strong><span>به یکی از قطعه‌های مدار نزدیک شو</span><span><kbd>E</kbd> یا <kbd>Enter</kbd> را بزن تا مدار همان قطعه باز شود</span>';quick.hidden=true;this.stage.append(quick);this.quickStart=quick;this.openedDevice=false;
  const keys=document.createElement('div');keys.className='ray-keyboard-legend';keys.setAttribute('aria-label','راهنمای کنترل بازی');keys.innerHTML='<span><kbd>W A S D</kbd> حرکت</span><span><kbd>E / Enter</kbd> باز کردن مدار</span><span><kbd>H</kbd> راهنمای مرحله</span><span><kbd>T</kbd> آزمایش مدار</span><span><kbd>Esc</kbd> بستن مدار';this.stage.append(keys);this.keyboardLegend=keys;
  const dialog=document.createElement('dialog');dialog.className='ray-device-dialog';dialog.setAttribute('aria-label','مدار دستگاه');dialog.innerHTML='<div class="ray-device-header"><div><small>مدار دستگاه</small><h2></h2></div><button data-story-action="device-close" aria-label="برگشت به محیط">×</button></div><div id="cityMode" class="ray-device-editor"></div>';
  this.stage.append(dialog);this.deviceDialog=dialog;
  dialog.addEventListener('cancel',e=>{e.preventDefault();onAction('device-close');});
 }
 message(text,tone='info'){this.fieldMessage.textContent=text;this.fieldMessage.dataset.tone=tone;}
 update(s,scene,tool,selected,nearest,intro,dt){super.update(s,scene,'hand',selected,nearest,9,dt);this.root.querySelector('.story-skip').hidden=true;this.quickStart.hidden=!s.started||this.openedDevice||this.deviceDialog.open;}
 openDevice(d){this.openedDevice=true;this.quickStart.hidden=true;this.deviceDialog.querySelector('h2').textContent=d.label;this.previousDeviceFocus=document.activeElement;if(!this.deviceDialog.open)this.deviceDialog.showModal();this.deviceDialog.querySelector('[data-story-action="device-close"]').focus({preventScroll:true});}
 closeDevice(){this.deviceDialog.close();this.previousDeviceFocus?.focus?.({preventScroll:true});}
 dispose(){this.closeDevice();super.dispose();}
}
