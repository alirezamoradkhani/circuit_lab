import {urbanBackdrop} from './UrbanArt.js';
import {sceneMessage} from './SceneMessage.js';
import {challengeSceneControls} from './challenges/ChallengeView.js';
export function renderUrbanSite(s){
 const reading=s.street?.readings();
 return `<div class="adventure-site urban-site site-${s.mission.id} ${s.won?'powered restored':''} ${s.tripped?'power-tripped':''}"><div class="urban-site-visual">${urbanBackdrop(s.mission.id,s.won,s.challenge??{s})}<div class="urban-site-caption"><span>محل عملیات / ${s.mission.title}</span><b>${s.tripped?'محافظ قطع':s.won?'تحویل شد':'در دست بررسی'}</b></div></div>
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
