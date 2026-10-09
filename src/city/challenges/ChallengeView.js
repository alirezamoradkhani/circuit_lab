import {challengeSchematic} from './CircuitSchematic.js';
import {infrastructurePanel} from './InfrastructureView.js';
const fa=n=>n.toLocaleString('fa-IR');
import {deviceLabels as labels} from './common.js';
export function challengePanel(s){
  const c=s.challenge;if(c.modern)return infrastructurePanel(s);
  const controls=s.mission.id==='radio'?['top','bottom'].map((key,i)=>`<div class="challenge-setting"><span>${labels.radio[i]}</span><div class="challenge-options">${[6,12,24,36,48].map(v=>`<button data-challenge="${key}" data-value="${v}" aria-pressed="${c[key].value===v}" ${s.credits<2&&c[key].value!==v?'disabled':''}>${v} Ω</button>`).join('')}</div></div>`).join(''):c.states.map((v,i)=>`<div class="challenge-setting"><span>${labels[s.mission.id][i]} <small>${s.mission.id==='backup'?(i===1?'۳ / ۹ W':([6,9,3,12][i]+' W')):i<2?'شروع ۱۸ · کار ۶ W':'۳ W'}</small></span><div class="challenge-options">${(s.mission.id==='backup'&&i===1?[0,1,2]:[0,1]).map(n=>`<button data-challenge="${i}" data-value="${n}" aria-pressed="${v===n}">${n===0?'قطع':s.mission.id==='backup'&&i===1?(n===1?'دور کم':'دور زیاد'):'وصل'}</button>`).join('')}</div></div>`).join('');
  return `<div class="challenge-panel"><p class="cabinet-help">${c.step}</p><div class="challenge-status" role="status">${c.status}</div>${s.mission.id==='pumps'?`<progress max="4" value="${c.tank}" aria-label="پرشدن مخزن"></progress><p class="cabinet-help">آخرین توان راه‌اندازی: ${fa(c.lastPeak)} وات. هر آزمایش یک دور پمپاژ است؛ زمان واقعی محدود نیست.</p>`:''}${controls}<details open><summary>مدار و نقاط اندازه‌گیری</summary>${challengeSchematic(s)}</details>${s.mission.id==='radio'?'<small class="cabinet-help">هر تعویض: ۲ اعتبار · گیرنده معادل ۱۲ اهم · منبع ۱۲ ولت</small>':''}</div>`;
}
export function challengeSceneControls(s){
  const c=s.challenge;if(!c||c.modern)return '';
  const indices=s.mission.id==='radio'?[2]:s.mission.id==='backup'?[0,1,2]:[0,1,2];
  return `<div class="challenge-scene-devices">${indices.map(i=>{const id=s.board.parts[i+2].id,radio=s.mission.id==='radio',on=!s.tripped&&!s.board.parts[i+2].disconnected;return `<button ${radio?`data-challenge-measure="${id}"`:`data-challenge="${i}" data-value="${c.states[i]?0:1}"`} class="${on?'device-on':''}" aria-label="${labels[s.mission.id][i]}">${labels[s.mission.id][i]} <span>${on?'●':'○'}</span></button>`;}).join('')}</div>`;
}
