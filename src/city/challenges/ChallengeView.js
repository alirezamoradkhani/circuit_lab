const fa=n=>n.toLocaleString('fa-IR');
import {deviceLabels as labels} from './common.js';
export function challengePanel(s){
  const c=s.challenge;
  const controls=s.mission.id==='radio'?['top','bottom'].map((key,i)=>`<div class="challenge-setting"><span>${labels.radio[i]}</span><div class="challenge-options">${[6,12,24,36,48].map(v=>`<button data-challenge="${key}" data-value="${v}" aria-pressed="${c[key].value===v}" ${s.credits<2&&c[key].value!==v?'disabled':''}>${v} Ω</button>`).join('')}</div></div>`).join(''):c.states.map((v,i)=>`<div class="challenge-setting"><span>${labels[s.mission.id][i]} <small>${s.mission.id==='backup'?(i===1?'۳ / ۹ W':([6,9,3,12][i]+' W')):i<2?'شروع ۱۸ · کار ۶ W':'۳ W'}</small></span><div class="challenge-options">${(s.mission.id==='backup'&&i===1?[0,1,2]:[0,1]).map(n=>`<button data-challenge="${i}" data-value="${n}" aria-pressed="${v===n}">${n===0?'قطع':s.mission.id==='backup'&&i===1?(n===1?'دور کم':'دور زیاد'):'وصل'}</button>`).join('')}</div></div>`).join('');
  return `<div class="challenge-panel"><p class="cabinet-help">${c.step}</p><div class="challenge-status" role="status">${c.status}</div>${s.mission.id==='pumps'?`<progress max="4" value="${c.tank}" aria-label="پرشدن مخزن"></progress><p class="cabinet-help">آخرین توان راه‌اندازی: ${fa(c.lastPeak)} وات. هر آزمایش یک دور پمپاژ است؛ زمان واقعی محدود نیست.</p>`:''}${controls}<details open><summary>مدار و نقاط اندازه‌گیری</summary>${challengeCircuit(s)}</details>${s.mission.id==='radio'?'<small class="cabinet-help">هر تعویض: ۲ اعتبار · گیرنده معادل ۱۲ اهم · منبع ۱۲ ولت</small>':''}</div>`;
}
function challengeCircuit(s){
  const radio=s.mission.id==='radio',parts=s.board.parts;
  const pos=radio?{p1:[55,45],p2:[170,45],p3:[305,45],p4:[185,185],p5:[320,185]}:{p1:[60,45],p2:[285,45]};
  if(!radio)parts.slice(2).forEach((p,i)=>pos[p.id]=[55+i*95,190]);
  const point=t=>{const [id,end]=t.split(':');return [pos[id][0]+(end==='0'?-20:20),pos[id][1]];};
  const wires=s.board.wires.map(([a,b],i)=>{const [x,y]=point(a),[xx,yy]=point(b),lane=y===yy?y+28:95+(i%4)*13;return `<path d="M${x} ${y}V${lane}H${xx}V${yy}" fill="none" stroke="#67988b" stroke-width="2.5"/>`;}).join('');
  return `<div class="circuit-diagram-scroll"><svg class="repair-wiring challenge-circuit" viewBox="0 0 400 250" role="group" aria-label="مدار مأموریت">${wires}${parts.map((p,i)=>{const [x,y]=pos[p.id],label=i===0?'منبع':i===1?'محافظ':labels[s.mission.id][i-2];return `<g ${s.tool==='meter'?`class="meter-component" data-measure-part="${p.id}" role="button" tabindex="0" aria-label="اندازه‌گیری ${label}"`:''}><rect x="${x-25}" y="${y-22}" width="50" height="44" rx="8" fill="${p.disconnected?'#e1e3d8':'#f7e6b1'}" stroke="#91aa91"/><rect x="${x-41}" y="${y-44}" width="82" height="19" fill="#e9eedf"/><text x="${x}" y="${y-30}" text-anchor="middle">${label}</text><text x="${x}" y="${y+5}" text-anchor="middle">${i===0?'12V':i===1?(s.tripped?'قطع':'●'):p.disconnected?'قطع':radio?p.value+'Ω':'●'}</text></g>`;}).join('')}</svg></div>`;
}
export function challengeSceneControls(s){
  const c=s.challenge;if(!c)return '';
  const indices=s.mission.id==='radio'?[2]:s.mission.id==='backup'?[0,1,2]:[0,1,2];
  return `<div class="challenge-scene-devices">${indices.map(i=>{const id=s.board.parts[i+2].id,radio=s.mission.id==='radio',on=!s.tripped&&!s.board.parts[i+2].disconnected;return `<button ${radio?`data-challenge-measure="${id}"`:`data-challenge="${i}" data-value="${c.states[i]?0:1}"`} class="${on?'device-on':''}" aria-label="${labels[s.mission.id][i]}">${labels[s.mission.id][i]} <span>${on?'●':'○'}</span></button>`;}).join('')}</div>`;
}
