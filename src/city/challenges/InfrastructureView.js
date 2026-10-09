import {challengeSchematic} from './CircuitSchematic.js';
export function infrastructurePanel(s){
 const c=s.challenge;
 return `<div class="infrastructure-panel"><p class="cabinet-help">${c.step}</p><output class="challenge-status">${c.status}</output>${c.controls.map(row=>`<fieldset class="infrastructure-setting"><legend>${row.label}</legend><div>${row.options.map(([v,label])=>`<button data-challenge="${row.key}" data-value="${v}" aria-pressed="${row.value===v}">${label}</button>`).join('')}</div></fieldset>`).join('')}<details open><summary>مدار و اندازه‌گیری مستقیم قطعات</summary>${challengeSchematic(s)}<small>مولتی‌متر را انتخاب کن؛ سپس روی قطعه بزن.</small></details></div>`;
}
