// Keep the diagram and the controls in two independent columns: diagram height
// must never stretch a progress badge, help message or component control.
export function organizeDevicePanel(editor, s, d){
 const panel=editor.querySelector('.cabinet-panel');
 const diagram=panel.querySelector('.ray-local-diagram,svg.shop-circuit');
 if(!diagram)return;
 if(s.shop&&d.id!=='supply'){
  const hit=document.createElementNS('http://www.w3.org/2000/svg','g');
  hit.setAttribute('data-action','switch');hit.setAttribute('data-ray-switch','main');
  hit.setAttribute('role','button');hit.setAttribute('tabindex','0');
  hit.setAttribute('aria-label','کلید اصلی: '+(s.shop.switch.closed?'بسته':'باز'));
  hit.setAttribute('aria-pressed',String(s.shop.switch.closed));
  hit.innerHTML='<title>برای باز و بسته کردن کلید بزن</title><rect x="18" y="64" width="48" height="44" rx="5" fill="transparent"/>';
  diagram.append(hit);
 }
 diagram.remove();
 // Flatten only the legacy layout shells. Keep actual control groups intact.
 panel.querySelectorAll('.challenge-panel,.infrastructure-panel,.street-workbench,.street-wiring,.shop-workbench,details').forEach(shell=>{
  shell.querySelector(':scope > summary')?.remove();
  shell.replaceWith(...shell.childNodes);
 });
 const switches=[...diagram.querySelectorAll('[data-ray-switch]')];
 // Branch switching belongs to the schematic, rather than a duplicate button.
 for(const control of switches){
  if(control.hasAttribute('data-street-isolate'))panel.querySelector('[data-street-isolate="'+control.dataset.streetIsolate+'"]')?.remove();
  if(control.hasAttribute('data-load'))panel.querySelector('[data-load="'+control.dataset.load+'"]')?.remove();
  if(control.hasAttribute('data-challenge'))panel.querySelectorAll('[data-challenge="'+control.dataset.challenge+'"]').forEach(n=>n.closest('.challenge-setting,.infrastructure-setting')?.remove());
 }
 const controls=document.createElement('aside');controls.className='ray-device-controls';controls.setAttribute('aria-label','اطلاعات و ابزار تعمیر');
 controls.append(...panel.childNodes);
 const board=document.createElement('div');board.className='ray-device-board';board.append(diagram);
 const help=document.createElement('p');help.className='ray-diagram-help';help.textContent=s.tool==='meter'?'مولتی‌متر فعال است؛ کلیک روی قطعه یا کلید فقط اندازه‌گیری می‌کند.':switches.length?'برای باز و بسته کردن مدار، روی کلید داخل شکل بزن.':'برای کار با مدار، قطعه یا پایانهٔ آن را انتخاب کن.';
 board.append(help);panel.append(board,controls);
}
