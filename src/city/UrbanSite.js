import {urbanBackdrop} from './UrbanArt.js';
import {sceneMessage} from './SceneMessage.js';
import {challengeSceneControls} from './challenges/ChallengeView.js';
export function renderUrbanSite(s){
 const reading=s.street?.readings();
 return `<div class="adventure-site urban-site site-${s.mission.id} ${s.won?'powered restored':''} ${s.tripped?'power-tripped':''}"><div class="urban-site-visual">${urbanBackdrop(s.mission.id,s.won,s.challenge??{s})}<div class="urban-site-caption"><span>محل عملیات / ${s.mission.title}</span><b>${s.tripped?'محافظ قطع':s.won?'تحویل شد':'در دست بررسی'}</b></div></div>
 ${reading?`<div class="urban-lamps">${reading.map((r,i)=>`<button data-street-inspect="${r.id}" class="${r.brightness>.8?'lit':''}"><i></i>چراغ ${(i+1).toLocaleString('fa-IR')}<small>${r.voltage?.toFixed(1)??'—'} V</small></button>`).join('')}</div>`:''}
 <nav class="urban-site-actions" aria-label="بررسی محل">${[['person','گزارش خرابی'],['load','پلاک تجهیزات'],['source','مشخصات منبع'],['cabinet','باز کردن تابلو']].map(([id,label])=>`<button data-target="${id}" aria-pressed="${s.focus===id}">${label}</button>`).join('')}</nav>
 ${challengeSceneControls(s)}<div class="urban-feedback">${sceneMessage(s)||'<p>از گزارش خرابی شروع کن؛ اندازه‌گیری، تعمیر و آزمون هرکدام نتیجهٔ جداگانه دارند.</p>'}</div></div>`;
}
