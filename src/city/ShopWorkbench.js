import {replacements} from './adventureData.js';
export const shopPoints=[
  ['p1:0',40,45,'مثبت منبع'],['p1:1',345,45,'منفی منبع'],
  ['p3:0',80,155,'ورودی مقاومت'],['p3:1',220,155,'خروجی مقاومت'],
  ['p4:0',220,260,'ورودی تابلو'],['p4:1',345,260,'برگشت تابلو'],
];
export function shopWorkbench(s){
  const repair=s.shop;
  return `<div class="shop-workbench"><div class="probe-meter"><span>ولتاژ DC · قرمز − مشکی</span><output dir="ltr" aria-live="polite">${repair.voltage===null?'— —':repair.voltage.toFixed(2)} V</output><small>پراب را بکش؛ یا رنگ پراب و سپس نقطهٔ تماس را لمس کن.</small></div>
    <svg class="shop-circuit" viewBox="0 0 400 400" role="group" aria-label="سوکت مقاومت و نقاط اندازه‌گیری تابلو">
    <path d="M40 45V74M40 98V100H80V155M220 155V260M345 45V260" fill="none" stroke="#7b9c8b" stroke-width="4"/><path d="M40 74L${repair.switch.closed&&!s.tripped?'40 98':'60 90'}" stroke="#b58d39" stroke-width="4"/><circle cx="40" cy="98" r="3" fill="#7b9c8b"/>
    <rect x="83" y="130" width="134" height="50" rx="10" class="shop-socket ${repair.empty?'empty':''}" data-shop-drop="socket" data-shop-action="socket" role="button" tabindex="0" aria-label="سوکت مقاومت"/>
    ${repair.empty?'<text x="150" y="160" text-anchor="middle" pointer-events="none">سوکت خالی</text>':`<g class="shop-draggable installed-resistor" data-shop-drag="installed" role="img" aria-label="مقاومت نصب‌شده ${repair.resistor.value} اهم"><path d="M83 155H113M187 155H217" stroke="#8b8266" stroke-width="5"/><rect x="113" y="139" width="74" height="32" rx="8" fill="#d9b87a" stroke="#a7844b"/><path d="M126 140V170M139 140V170M170 140V170" stroke="#73593c" stroke-width="6"/><text x="150" y="119" text-anchor="middle">${repair.resistor.value} Ω</text></g>`}
    <path d="M220 260H259M307 260H345" stroke="#7b9c8b" stroke-width="4"/><circle cx="283" cy="260" r="24" fill="#${repair.brightness?'ffe08a':'d8e2d1'}" stroke="#5a7967" stroke-width="3"/><path d="M268 245L298 275M298 245L268 275" stroke="#718064" stroke-width="2"/>
    ${shopPoints.map(([id,x,y,title])=>`<g role="button" tabindex="0" data-shop-point="${id}" data-shop-drop="point:${id}" aria-label="${title}"><circle cx="${x}" cy="${y}" r="23" fill="transparent"/><circle cx="${x}" cy="${y}" r="10" fill="#e2efe0" stroke="#648d78" stroke-width="3"/><text x="${x}" y="${y-23}" text-anchor="middle">${title}</text></g>`).join('')}
    ${['red','black'].map((color,i)=>{
      const end=shopPoints.find(p=>p[0]===repair.probes[color]),x=i?315:85,stroke=i?'#35454b':'#b44b3e';
      return `${end?`<path d="M${x} 350C${x} 300 ${end[1]} 320 ${end[1]} ${end[2]}" fill="none" stroke="${stroke}" stroke-width="3" pointer-events="none"/><circle cx="${end[1]}" cy="${end[2]}" r="5" fill="${stroke}" pointer-events="none"/>`:''}<g class="shop-draggable probe-handle" role="button" tabindex="0" data-probe="${color}" data-shop-drag="probe:${color}" aria-label="پراب ${i?'مشکی':'قرمز'}" aria-pressed="${repair.selectedProbe===color}"><rect x="${x-32}" y="325" width="64" height="60" rx="13" fill="${repair.selectedProbe===color?'#f6e8b6':'#e7eadb'}" stroke="#a8b59c"/><path d="M${x} 332V345" stroke="#899b91" stroke-width="4"/><rect x="${x-7}" y="344" width="14" height="23" rx="4" fill="${stroke}"/><text x="${x}" y="380" text-anchor="middle">${i?'مشکی':'قرمز'}</text></g>`;
    }).join('')}</svg>
    <button class="removed-part-tray" data-shop-drop="tray" data-shop-action="remove" ${repair.empty?'disabled':''}>${repair.empty?'قطعهٔ قبلی در محفظه است':'⏏ قطعه را اینجا بکش یا برای بیرون‌آوردن بزن'}</button>
    <p class="cabinet-help">تعویض قطعه با کلید باز انجام می‌شود. قطعهٔ تازه را روی سوکت بکش؛ یا قطعه و سپس سوکت را لمس کن.</p>
    <div class="spare-parts">${replacements.map(p=>`<button class="shop-draggable" data-shop-drag="spare:${p.value}" data-shop-spare="${p.value}" aria-pressed="${repair.selectedSpare===p.value}" ${s.credits<p.cost?'disabled':''}><b dir="ltr">${p.value} Ω</b><small>${p.cost.toLocaleString('fa-IR')} اعتبار</small></button>`).join('')}</div>
    <button class="cabinet-switch" data-action="switch" aria-pressed="${repair.switch.closed}">کلید اصلی: ${repair.switch.closed?'بسته ●':'باز ○'}</button></div>`;
}
