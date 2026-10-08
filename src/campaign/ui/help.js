import {workshopHint} from '../workshop/hints.js';

export function workshopHelp(s,saved){
  const h=workshopHint(s);
  return '<span class="story-kicker">دفتر نورا · مرحلهٔ ۰۱ / تعمیرگاه</span>'+
    '<h2>'+h.title+'</h2><p>'+h.reason+'</p>'+
    '<div class="story-hint-note"><b>سرنخ همین حالا</b><p>'+h.clue+'</p></div>'+
    '<details class="story-help-details"><summary>راهنمای قدم‌به‌قدم این بخش</summary><ol>'+
    h.steps.map(step=>'<li>'+step+'</li>').join('')+'</ol></details>'+
    '<details class="story-help-details"><summary>کنترل‌ها و ابزارها</summary><ul>'+
    '<li>حرکت: روی زمین بزن، از WASD و جهت‌ها یا دستهٔ لمسی استفاده کن.</li>'+
    '<li>تعامل: ابزار دست و سپس وسیله را بزن؛ رِی خودش کنارش می‌رود.</li>'+
    '<li>کابل: یک منبع و یک مصرف‌کننده را انتخاب کن. تکرار همان اتصال، کابل را جدا می‌کند.</li>'+
    '<li>ولت‌متر فقط اندازه می‌گیرد و مدار را عوض نمی‌کند.</li></ul>'+
    '<p>C کابل · M ولت‌متر · Tab کیف · H سرنخ بعدی</p></details>'+
    '<p class="story-subtle">زمان در راهنما متوقف است. '+
    (saved?'پیشرفت همین دستگاه خودکار ذخیره می‌شود.':'ذخیره‌سازی مرورگر در دسترس نیست؛ پیشرفت فقط در این نشست می‌ماند.')+
    '</p><div class="story-dialog-actions"><button data-story-action="hint">سرنخ روی صحنه</button></div>';
}
