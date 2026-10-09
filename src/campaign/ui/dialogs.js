import {workshopHelp} from './help.js';
import {icon} from './icons.js';
import {powered} from '../workshop/electricity.js';
import {NAMES,LOADS} from '../workshop/layout.js';
const fa=n=>n.toLocaleString('fa-IR');
export function dialogContent(kind,s,saved=true){
  if(kind==='bag')return '<span class="story-kicker">کیف تعمیرکار</span><h2>چیزهایی که همراهت هستند</h2><div class="story-items">'+
    '<article>'+icon('battery')+'<div><b>باتری رِی</b><p>'+fa(Math.ceil(s.energy))+' از ۷۲ ژول · خروجی ۱۲ ولت</p></div></article>'+
    '<article>'+icon('cable')+'<div><b>'+(s.reel?'کابل بلند تعمیرگاه':'کابل کوتاه رِی')+'</b><p>'+(s.reel?'پریز را به یک وسیلهٔ دور وصل می‌کند.':'برای وصل‌کردن وسایل، به آن‌ها نزدیک شو.')+'</p></div></article>'+
    (s.receipt?'<article class="story-receipt">'+icon('receipt')+'<div><b>رسید پاک‌رو</b><p>«یک شارژر سازگار… برای پیکو. باتری را برمی‌گردانم.»</p></div></article>':'')+
    (s.secret?'<article>'+icon('sound')+'<div><b>برچسب «شیفت صبح»</b><p>چراغ و رادیو را با هم بیدار کردی.</p></div></article>':'')+'</div>';
  if(kind==='circuit')return '<span class="story-kicker">بررسی مدار · زمان متوقف است</span><h2>برق از کجا می‌آید؟</h2>'+
    '<div class="story-source-line"><span>باتری رِی<br><b>'+fa(Math.ceil(s.energy))+' ژول</b></span><span>پریز تعمیرگاه<br><b>۱۲ ولت / ۲۴ وات</b></span></div>'+
    '<div class="story-circuit-branches">'+Object.keys(LOADS).map(id=>'<article class="'+(powered(s,id)?'live':'')+'">'+icon(id==='lamp'?'hint':id==='radio'?'sound':'socket')+'<b>'+NAMES[id]+'</b><p>'+(s.connections[id]?NAMES[s.connections[id]]:'اتصال ندارد')+'</p><strong>'+(powered(s,id)?'۱۲':'۰')+' V</strong></article>').join('')+'</div>'+
    '<p>کابل‌ها دو رشته‌ای‌اند و مسیر رفت و برگشت برق را با هم برقرار می‌کنند. ضامن پس از یک ثانیه مکانیکی باز می‌ماند و دیگر مصرف ندارد.</p><p>برای تغییر اتصال، به صحنه برگرد و ابزار کابل را انتخاب کن.</p>';
  if(kind==='reset')return '<span class="story-kicker">بازچینی تعمیرگاه</span><h2>چطور دوباره شروع کنیم؟</h2><p>بازچینی وسایل، رسید و ضامنِ بازشده را نگه می‌دارد. شروع تازه، پیشرفت همین مرحله را پاک می‌کند.</p><div class="story-dialog-actions"><button data-story-action="recover">فقط بازچینی وسایل</button><button data-story-action="restart">شروع تازه</button></div>';
  if(kind==='complete')return '<span class="story-kicker">مرحلهٔ ۰۱ تمام شد</span><h2>یک در باز شد.<br>یک داستان شروع شد.</h2><p>رد پاک‌رو به کوچه می‌رسد. تو رسید را پیدا کردی و با '+(s.route==='mains'?'کابل بلند تعمیرگاه':'برق خود رِی')+' کرکره را باز کردی.</p>'+
    (s.secret?'<p class="story-reward">♫ یادگاری این مرحله: شیفت صبح</p>':'<p>یک موسیقی کوچک هنوز در تعمیرگاه پنهان است…</p>')+
    '<p class="story-subtle">رد پاک‌رو از کانال کوچه می‌گذرد.</p><div class="story-dialog-actions"><button data-story-action="next">ادامه؛ بادِ خلاف</button><button data-story-action="levels">مسیر داستان</button><button data-story-action="restart">دوباره بازی کن</button><button data-story-action="lab">بازگشت به آزمایشگاه</button></div>';
  return workshopHelp(s,saved);
}
