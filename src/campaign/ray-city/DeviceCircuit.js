import {measurePart} from '../../city/ComponentMeter.js';
import {deviceForPart,deviceReadings} from './devices.js';
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,t,cls='schematic-name')=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" ${cls==='schematic-value'?'direction="ltr"':''}>${esc(t)}</text>`;

function switchSymbol(x,y,closed,attributes,id,label){
 return `<g data-ray-switch="${id}" ${attributes} role="button" tabindex="0" aria-label="${esc(label)}: ${closed?'بسته':'باز'}" aria-pressed="${closed}"><title>${esc(label)} · برای باز و بسته کردن بزن</title><rect class="ray-switch-touch" x="${x-36}" y="${y-38}" width="72" height="76" fill="transparent"/><rect class="ray-switch-hit" x="${x-22}" y="${y-22}" width="44" height="44" rx="5"/><path class="ray-switch-line" d="M${x-16} ${y}L${x+16} ${closed?y:y-13}"/><circle class="ray-switch-dot" cx="${x-16}" cy="${y}" r="3"/><circle class="ray-switch-dot" cx="${x+16}" cy="${y}" r="3"/></g>`;
}

function branchSwitch(s,d,p){
 if(s.street&&p.type==='lamp')return {closed:!s.street.isolated.has(p.id),attributes:`data-street-isolate="${p.id}"`};
 const c=s.challenge,i=c?.parts?.indexOf(p),key=String(i);
 if(!c||i<0||!d.keys.includes(key))return null;
 const row=c.modern?c.controls.find(r=>r.key===key):null;
 const binary=row?row.options.length===2&&row.options.every(([v])=>v===0||v===1):c.states&&!(s.mission.id==='backup'&&i===1);
 if(!binary)return null;
 const closed=Boolean(row?row.value:c.states[i]);
 return {closed,attributes:`data-challenge="${key}" data-value="${closed?0:1}"`};
}

export function deviceCircuit(s,d,devices){
 if(s.mission.id==='clinic'&&d.id==='supply')return `<svg class="city-schematic ray-branch-circuit" viewBox="0 0 540 230"><g data-ray-meter="supply" role="button" tabindex="0"><rect class="schematic-body schematic-source" x="140" y="70" width="260" height="90" rx="6"/>${text(270,101,'مولد مشترک درمانگاه')}${text(270,132,'12 V · 18 W','schematic-value')}</g>${text(270,194,'مصرف فعلی: '+s.power+' W','schematic-value')}</svg>`;
 if(d.loadIndex!==undefined){
  const r=deviceReadings(s,d),closed=s.loads[d.loadIndex];
  return `<svg class="city-schematic ray-branch-circuit" viewBox="0 0 540 300" aria-label="مدار مستقل ${esc(d.label)}"><g class="schematic-wires"><path d="M95 70H169M201 70H270V126M270 186V250H95V70"/></g>${switchSymbol(185,70,closed,`data-load="${d.loadIndex}"`,d.id,'کلید شاخه')}${text(185,35,'کلید شاخه','ray-switch-caption')}<g class="schematic-part"><rect class="schematic-body schematic-source" x="28" y="110" width="134" height="65" rx="6"/>${text(95,134,'منبع مشترک')}${text(95,157,'12 V','schematic-value')}</g><g class="schematic-part" data-ray-meter="${d.id}" role="button" tabindex="0"><rect class="schematic-body" x="195" y="126" width="150" height="60" rx="6"/>${text(270,146,d.label)}${text(270,172,d.power+' W · '+(closed?'وصل':'قطع'),'schematic-value')}</g>${text(390,220,'این شاخه: '+r.current.toFixed(2)+' A','schematic-value')}</svg>`;
 }
 const selected=new Set(d.partIds),local=s.board.parts.filter(p=>selected.has(p.id));
 const height=110+local.length*114,positions=new Map(),boundary=new Map(),switches=new Map();
 local.forEach((p,i)=>{const y=110+i*114;positions.set(p.id+':0',[180,y]);positions.set(p.id+':1',[360,y]);const control=branchSwitch(s,d,p);if(control)switches.set(p.id,control);});
 const addBoundary=id=>{if(boundary.has(id)||selected.has(id.split(':')[0]))return;const part=s.board.parts.find(p=>p.id===id.split(':')[0]);if(!part)return;const i=boundary.size,x=i%2?458:74,y=55+Math.floor(i/2)*96;boundary.set(id,{x,y,part});positions.set(id,[x,y+24]);};
 if(d.id!=='supply'){addBoundary('p2:1');addBoundary('p1:1');}
 const wires=s.board.wires.map((pair,index)=>({pair,index})).filter(({pair})=>pair.some(pin=>selected.has(pin.split(':')[0])));
 wires.forEach(({pair})=>pair.forEach(addBoundary));
 const editable=['gate','street','station'].includes(s.mission.id);
 const pin=(id,x,y,label)=>`<g data-pin="${id}" ${s.street?`data-shop-drag="street:${id}" data-shop-drop="street:${id}"`:''} role="button" tabindex="0" aria-label="${esc(label)}"><circle cx="${x}" cy="${y}" r="20" fill="transparent"/><circle class="schematic-terminal" cx="${x}" cy="${y}" r="8" style="fill:${s.pending===id?'#d5b55b':'#e1eee5'}"/></g>`;
 const hasSwitch=id=>id.endsWith(':0')&&switches.has(id.split(':')[0]);
 const lines=wires.map(({pair:[a,b],index})=>{
  const p=positions.get(a),q=positions.get(b);if(!p||!q)return '';
  const lead=(id,pos)=>hasSwitch(id)?110:pos[0]===180?155:pos[0]===360?385:pos[0];
  // External connectors leave below their label, never through its rectangle.
  const lane=boundary.has(a)||boundary.has(b)?Math.max(p[1],q[1]):Math.max(p[1],q[1])+42+(index%3)*7;
  const start=hasSwitch(a)?`M${p}H158M126 ${p[1]}H110`:`M${p}H${lead(a,p)}`;
  const end=hasSwitch(b)?`V${q[1]}H126M158 ${q[1]}H180`:`V${q[1]}H${q[0]}`;
  const path=`${start}V${lane}H${lead(b,q)}${end}`;
  return `<g ${editable?`data-wire="${index}" role="button" tabindex="0" aria-label="برداشتن سیم"`:''}><path d="${path}" stroke="transparent" stroke-width="20" fill="none"/><path class="ray-wire" d="${path}"/></g>`;
 }).join('');
 const parts=local.map((p,i)=>{
  const y=110+i*114,control=switches.get(p.id);
  const label=(p.type==='resistor'&&d.partIds.length>1&&s.mission.id!=='bridge')?'مقاومت سری':p.label||({battery:'منبع',switch:'کلید اصلی',lamp:d.label,resistor:'مقاومت'}[p.type]);
  const value=p.type==='battery'?p.value+' V':p.value+' Ω'+(p.disconnected?' · قطع':'');
  const body=p.type==='switch'?`${text(270,y-35,'کلید اصلی')}${switchSymbol(270,y,p.closed,'data-action="switch"',p.id,'کلید اصلی')}<path class="ray-wire" d="M195 ${y}H254M286 ${y}H345"/>${text(270,y+38,p.closed?'بسته':'باز','ray-switch-caption')}`:`<g class="schematic-part ${p.disconnected?'is-open':''}" ${s.tool==='meter'?`data-measure-part="${p.id}" role="button" tabindex="0"`:''}><rect class="schematic-body ${p.type==='battery'?'schematic-source':''}" x="195" y="${y-29}" width="150" height="58" rx="6"/>${text(270,y-7,label)}${text(270,y+17,value,'schematic-value')}</g>`;
  return `${body}<path class="ray-wire" d="M180 ${y}H195M345 ${y}H360"/>${pin(p.id+':0',180,y,label+' پایانه ۱')}${pin(p.id+':1',360,y,label+' پایانه ۲')}${control?switchSymbol(142,y,control.closed,control.attributes,p.id,'کلید شاخه')+text(270,y+52,'کلید شاخه: '+(control.closed?'بسته':'باز'),'ray-switch-caption'):''}`;
 }).join('');
 const boundaries=[...boundary].map(([id,{x,y,part}])=>{const owner=deviceForPart(devices,part.id);const label=id==='p2:1'?'خروجی مثبت تابلو':id==='p1:1'?'برگشت منفی منبع':(owner?.label||part.label||'دستگاه دیگر')+' · '+(Number(id.split(':')[1])+1);return `<rect class="ray-connector-body" x="${x-60}" y="${y-17}" width="120" height="35" rx="5"/>${text(x,y+4,label,'ray-connector-text')}${pin(id,x,y+24,label)}`;}).join('');
 return `<svg class="city-schematic ray-branch-circuit" viewBox="0 0 540 ${Math.max(height,55+Math.ceil(boundary.size/2)*96)}" role="group" aria-label="مدار مستقل ${esc(d.label)}">${lines}${boundaries}${parts}</svg>`;
}
