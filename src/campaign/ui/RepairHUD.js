import {WorkshopHUD} from './WorkshopHUD.js';
import {circuitReading,REPAIR_NAMES,VALUES} from '../workshop/RepairCircuit.js';
import {dialogContent} from './dialogs.js';
import {repairHint} from '../workshop/RepairCircuit.js';
import {available} from '../workshop/layout.js';
export class RepairHUD extends WorkshopHUD {
 constructor(root,onAction){
  super(root,onAction);
  this.config={...this.config,dialogContent:(kind,s,saved)=>kind==='help'?'<h2>عیب‌یابی تابلو کرکره</h2><p>'+repairHint(s)+'</p><p>تابلو را با ابزار دست باز کن. سیم‌ها را با ابزار سیم بین پایانه‌های مسی جابه‌جا کن. برای تغییر قطعه، کلید را باز کن و با ابزار دست روی مقاومت بزن. با مولتی‌متر، ولتاژ و جریان قطعه را بخوان.</p><p>پلاک چراغ: ۱۲ اهم، جریان مطلوب ۰٫۵ آمپر. مسیر رفت و برگشت، جریان درست و قطع کلید باید هر سه تأیید شوند.</p><p>'+(saved?'پیشرفت همین دستگاه خودکار ذخیره می‌شود.':'ذخیره‌سازی مرورگر در دسترس نیست؛ پیشرفت فقط در این نشست می‌ماند.')+'</p>':dialogContent(kind,s,saved),names:{...this.config.names,cabinet:'تابلو کنترل کرکره'},
   available:(id,s)=>id==='cabinet'?s.cart>=1:available(id,s),
   goal:s=>s.cart<1?'cart':!s.door?'cabinet':!s.receipt?'receipt':'exit',
   objective:s=>s.cart<1?'راه چرخ‌دستی را باز کن تا به تابلو برسی.':!s.door?'تابلو کرکره را عیب‌یابی کن؛ جریان مجاز چراغ کنترل ۰٫۵ آمپر است.':!s.receipt?'تعمیر تأیید شد؛ رسید کنار میز را بردار.':'کابل رِی را جدا کن و از در بیرون برو.'};
  this.root.querySelector('.story-dock [data-story-action="meter"] span').textContent='مولتی‌متر';
  this.root.querySelector('.story-heading h1').textContent='تعمیرگاه خاموش';
  this.root.querySelector('.story-intro p').textContent='کرکره خراب است. رِی باید سیم‌کشی و جریان تابلو را تعمیر کند تا از تعمیرگاه بیرون برود.';
  const hot=document.createElement('button');hot.dataset.storyObject='cabinet';hot.type='button';hot.innerHTML='▤<span>تابلو کرکره</span>';hot.setAttribute('aria-label','تابلو کرکره');root.querySelector('.story-hotspots').append(hot);this.nodes.cabinet=hot;
  const panel=document.createElement('section');panel.className='repair-tools';panel.hidden=true;panel.setAttribute('aria-label','ابزار تعمیر تابلو');
  panel.innerHTML='<div class="repair-tools-heading"><strong>تابلو کرکره</strong><button data-story-action="repair-close" aria-label="برگشت به اتاق">↙</button></div><p class="repair-plate">پلاک چراغ: <b dir="ltr">12 Ω · 0.5 A</b><br>منبع: <b dir="ltr">12 V</b> · محافظ: <b dir="ltr">0.65 A</b></p><div class="repair-tool-row">'+[['hand','دست'],['cable','سیم'],['meter','مولتی‌متر']].map(([id,label])=>'<button data-story-action="'+id+'" aria-pressed="false">'+label+'</button>').join('')+'</div><p class="repair-context-text" data-repair-context></p><div class="repair-value-list" hidden>'+VALUES.map(v=>'<button data-story-action="repair-resistor:'+v+'" aria-pressed="false"><span dir="ltr">'+v+' Ω</span></button>').join('')+'</div><div class="repair-source-options" hidden><button data-story-action="repair-source:battery">کابل باتری رِی</button><button data-story-action="repair-source:mains">کابل بلند پریز</button></div><div class="repair-source-status" data-repair-source></div><div class="repair-commands"><button data-story-action="repair-switch">کلید تابلو</button><button data-story-action="repair-test">آزمایش مدار</button><button data-story-action="repair-reset" hidden>بازنشانی محافظ</button><button data-story-action="repair-remove" hidden>جدا کردن سیم</button><button data-story-action="repair-cancel" hidden>لغو سیم</button></div><output class="repair-reading" hidden></output><p class="repair-feedback" aria-live="polite"></p><div class="repair-proofs"><span data-proof="off">قطع کلید</span><span data-proof="meter">اندازه‌گیری جریان</span><span data-proof="on">کارکرد روشن</span></div><button class="repair-hint" data-story-action="hint">سرنخ همین وضعیت</button>';
  this.stage.append(panel);this.repairPanel=panel;
 }
 showRepair(text,tone='info'){const el=this.repairPanel.querySelector('.repair-feedback');el.textContent=text;el.dataset.tone=tone;}
 update(s,scene,tool,selected,nearest,intro,dt){
  super.update(s,scene,tool,selected,nearest,intro,dt);
  const open=!!scene.editing;this.stage.classList.toggle('repair-editing',open);this.repairPanel.hidden=!open;
  if(!open)return;
  for(const b of Object.values(this.nodes))b.hidden=true;
  const r=circuitReading(s),sw=s.repair.board.parts.find(p=>p.id==='switch');
  this.repairPanel.querySelector('[data-story-action="repair-switch"]').textContent='کلید: '+(sw.closed?'بسته ●':'باز ○');
  this.repairPanel.querySelector('[data-story-action="repair-reset"]').hidden=!s.repair.tripped;
  this.repairPanel.querySelector('[data-story-action="repair-remove"]').hidden=!selected?.startsWith('repair-wire:')||tool!=='hand';
  this.repairPanel.querySelector('[data-story-action="repair-cancel"]').hidden=!scene.cableStart;
  this.repairPanel.querySelector('.repair-source-options').hidden=selected!=='repair-part:source'||tool!=='hand';
  this.repairPanel.querySelector('[data-repair-source]').textContent=s.repair.tripped?'محافظ: قطع بر اثر اضافه‌جریان':r.source?'ورودی برق: ۱۲ ولت':'ورودی برق: قطع؛ روی ورودی بزن تا کابل منبع را وصل کنی.';
  const values=this.repairPanel.querySelector('.repair-value-list');values.hidden=selected!=='repair-part:resistor'||tool!=='hand';
  values.querySelectorAll('button').forEach(b=>{b.disabled=sw.closed;b.setAttribute('aria-pressed',String(Number(b.dataset.storyAction.split(':')[1])===s.repair.board.parts.find(p=>p.id==='resistor').value));});
  this.repairPanel.querySelectorAll('.repair-tool-row button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.storyAction===tool)));
  this.repairPanel.querySelector('[data-repair-context]').textContent=tool==='cable'?(scene.cableStart?'پایانه اول انتخاب شد؛ سر دوم را بزن یا سیم را تا آن بکش.':'از یک پایانه مسی به پایانه دیگر بکش؛ دو کلیک هم کار می‌کند.'):
    tool==='meter'?'روی بدنه قطعه بزن؛ مولتی‌متر ولتاژ دو سر و جریان آن را نشان می‌دهد.':selected?.startsWith('repair-wire:')?'سیم انتخاب شد؛ با «جدا کردن سیم» آن را بردار.':selected==='repair-part:resistor'?'مقدار مقاومت جایگزین را انتخاب کن.':'روی سیم یا قطعه بزن تا ابزار مربوط به آن نمایش داده شود.';
  const reading=this.repairPanel.querySelector('.repair-reading');reading.hidden=!s.repair.reading;
  if(s.repair.reading){const m=s.repair.reading;reading.innerHTML='<span>'+REPAIR_NAMES[m.id]+'</span><b dir="ltr">'+m.voltage.toFixed(2)+' V · '+m.current.toFixed(2)+' A</b>';}
  this.repairPanel.querySelector('[data-proof="off"]').classList.toggle('done',s.repair.offTest);
  this.repairPanel.querySelector('[data-proof="meter"]').classList.toggle('done',s.repair.measured);
  this.repairPanel.querySelector('[data-proof="on"]').classList.toggle('done',s.repair.onTest);
 }
}
