import {sceneMessage} from './SceneMessage.js';
import {challengeSceneControls} from './challenges/ChallengeView.js';
import {challengeSchematic} from './challenges/CircuitSchematic.js';
import {renderWirePanel} from './CircuitBoard.js';
import {componentMeterView} from './ComponentMeter.js?v=missions9';
import {appliances,replacements} from './adventureData.js?v=missions9';

const fa=n=>n.toLocaleString('fa-IR');

function centralMeter(s){return s.panel?'':componentMeterView(s);}

function clinicCircuit(s){
 return `<div class="urban-circuit-panel urban-clinic-board" aria-label="برد مدار درمانگاه">${centralMeter(s)}<div class="urban-circuit-title"><strong>برد مدار</strong><small>مصرف‌کننده‌های ضروری را زیر ظرفیت منبع نگه دار.</small></div><div class="power-budget"><b>${fa(s.power)} / ۱۸ وات</b><meter min="0" max="30" optimum="18" low="1" high="18" value="${s.power}"></meter></div><div class="appliance-list">${appliances.map((p,i)=>`<button data-load="${i}" aria-pressed="${s.loads[i]}"><span><b>${p.name}</b><small>${fa(p.power)} وات · ${p.essential?'ضروری':'غیرضروری'}</small></span><span class="load-toggle">${s.loads[i]?'روشن':'خاموش'}</span></button>`).join('')}</div></div>`;
}

function resistorActions(s){
 if(!['shop','station'].includes(s.mission.id))return '';
 const part=s.board.parts.find(p=>p.type==='resistor');
 return `<div class="urban-board-extra"><div><span>مقاومت نصب‌شده</span><b dir="ltr">${part.value} Ω</b></div><div class="spare-parts">${replacements.map(p=>`<button data-resistor="${p.value}" aria-pressed="${part.value===p.value}" ${s.credits<p.cost?'disabled':''}><b dir="ltr">${p.value} Ω</b><small>${fa(p.cost)} اعتبار</small></button>`).join('')}</div>${s.mission.id==='station'?`<button class="cabinet-switch" data-action="switch" aria-pressed="${s.board.parts.find(p=>p.type==='switch').closed}">کلید اصلی: ${s.board.parts.find(p=>p.type==='switch').closed?'بسته ●':'باز ○'}</button>`:''}</div>`;
}

function centralCircuit(s){
 if(s.challenge){
  if(s.panel){
   const preview=challengeSchematic({...s,tool:'inspect'}).replace('city-schematic','city-schematic-preview');
   return `<div class="urban-circuit-panel urban-challenge-board" aria-label="مدار مأموریت"><div class="urban-circuit-title"><strong>مدار مأموریت</strong><small>تنظیمات در جعبه‌برق باز است؛ اینجا نمای مدار را می‌بینی.</small></div>${preview}</div>`;
  }
  return `<div class="urban-circuit-panel urban-challenge-board" aria-label="مدار مأموریت">${centralMeter(s)}<div class="urban-circuit-title"><strong>مدار مأموریت</strong><small>برای تنظیمات و آزمایش، جعبه‌برق را باز کن.</small></div><details open><summary>مدار و نقاط اندازه‌گیری</summary>${challengeSchematic({...s,tool:'inspect'})}</details><p class="cabinet-help urban-challenge-note">برای تنظیمات و آزمایش، از دکمهٔ «باز کردن تابلو» پایین صفحه استفاده کن.</p></div>`;
 }
 if(s.mission.id==='clinic')return clinicCircuit(s);
 return `<div class="urban-circuit-panel urban-wire-board" aria-label="برد مدار قابل حل">${centralMeter(s)}<div class="urban-circuit-title"><strong>برد مدار</strong><small>پایانه‌ها را انتخاب کن و مسیر رفت و برگشت را کامل بساز.</small></div>${renderWirePanel(s)}${resistorActions(s)}</div>`;
}

export function renderUrbanSite(s){
 const reading=s.street?.readings();
 return `<div class="adventure-site urban-site site-${s.mission.id} ${s.won?'powered restored':''} ${s.tripped?'power-tripped':''}"><div class="urban-site-visual urban-circuit-visual">${centralCircuit(s)}<div class="urban-site-caption"><span>محل عملیات / ${s.mission.title}</span><b>${s.tripped?'محافظ قطع':s.won?'تحویل شد':'در دست بررسی'}</b></div></div>
 ${reading?`<div class="urban-lamps">${reading.map((r,i)=>`<button data-street-inspect="${r.id}" class="${r.brightness>.8?'lit':''}"><i></i>چراغ ${(i+1).toLocaleString('fa-IR')}<small>${r.voltage?.toFixed(1)??'—'} V</small></button>`).join('')}</div>`:''}
 <section class="urban-brief" aria-label="اطلاعات عملیات">
  <div class="urban-brief-heading"><div><span>اطلاعات عملیات</span><small>همهٔ سرنخ‌های این محل در یک نگاه</small></div><button data-target="cabinet" class="urban-cabinet-cta">باز کردن تابلو <b>↗</b></button></div>
  <div class="urban-brief-grid">
   <article class="urban-brief-card"><header><span class="brief-icon">!</span><div><b>گزارش خرابی</b><small>${s.mission.person}</small></div></header><p>${s.mission.request}</p></article>
   <article class="urban-brief-card"><header><span class="brief-icon">▤</span><div><b>پلاک تجهیزات</b><small>مقادیر نامی و بارها</small></div></header><p>${s.mission.plate}</p></article>
   <article class="urban-brief-card"><header><span class="brief-icon">ϟ</span><div><b>مشخصات منبع</b><small>محدودیت تغذیه</small></div></header><p>${s.mission.source}</p></article>
  </div>
 </section>
 ${challengeSceneControls(s)}<div class="urban-feedback">${sceneMessage(s)||'<p>پس از مرور اطلاعات، تابلو را باز کن و اندازه‌گیری و تعمیر را انجام بده.</p>'}</div></div>`;
}
