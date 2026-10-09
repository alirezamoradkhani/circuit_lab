import {challengePanel,challengeSceneControls} from './challenges/ChallengeView.js';
import {componentMeterView} from './ComponentMeter.js?v=missions9';
import {adventures,appliances,replacements} from './adventureData.js?v=missions9';
import {sceneMessage} from './SceneMessage.js?v=ui5';
import {shopWorkbench} from './ShopWorkbench.js?v=meter7';
import {streetWorkbench} from './StreetWorkbench.js?v=street3';
const fa=n=>n.toLocaleString('fa-IR');
export {renderUrbanSite as renderSite} from './UrbanSite.js';
import {renderUrbanSite as renderSite} from './UrbanSite.js';

function wirePanel(s){
  const positions={p1:[75,48],p2:[300,48]};
  const loads=s.board.parts.filter(p=>!['battery','switch'].includes(p.type));
  loads.forEach((p,i)=>positions[p.id]=[loads.length===1?190:70+(i%3)*125,205+Math.floor(i/3)*95]);
  const pt=id=>{const [p,end]=id.split(':');const [x,y]=positions[p];return [x+(end==='0'?-34:34),y];};
  const names={battery:'باتری',switch:'کلید',lamp:'چراغ',resistor:s.street?'اتصال فرسوده':'مقاومت'};
  const wires=s.board.wires.map(([a,b],i)=>{
    const [x1,y1]=pt(a),[x2,y2]=pt(b),bend=y1===y2?y1+38+(i%3)*12:115+(i%3)*16;
    return `<g role="button" tabindex="0" data-wire="${i}" aria-label="برداشتن سیم ${fa(i+1)}"><path d="M${x1} ${y1}V${bend}H${x2}V${y2}" fill="none" stroke="transparent" stroke-width="18"/><path d="M${x1} ${y1}V${bend}H${x2}V${y2}" fill="none" stroke="#448b99" stroke-width="3" pointer-events="none"/></g>`;
  }).join('');
  return `<p class="cabinet-help">${s.tool==='meter'?'روی قطعه بزن تا اندازه بگیری. برای سیم‌کشی، به ابزار بررسی برگرد.':'از یک پایانه به دیگری سیم بکش یا دو پایانه را انتخاب کن؛ برای برداشتن سیم روی خط آن بزن. هر سیم: ۲ اعتبار.'}</p><div class="circuit-diagram-scroll"><svg class="repair-wiring" viewBox="0 0 400 ${loads.length>3?355:265}" role="group" aria-label="اتصال‌های جعبه‌برق">${wires}${s.board.parts.map(p=>{
    const [x,y]=positions[p.id];return `<g><g ${s.tool==='meter'?`class="meter-component ${s.meteredPart===p.id?'meter-selected':''}" data-measure-part="${p.id}" role="button" tabindex="0" aria-label="اندازه‌گیری ${names[p.type]}">`:'>'}<rect x="${x-26}" y="${y-20}" width="52" height="40" rx="8" fill="#f8efd9" stroke="#b5b49e"/><text x="${x}" y="${y-28}" text-anchor="middle">${names[p.type]}${p.type==='lamp'?' '+fa(loads.indexOf(p)+1):''}</text><text x="${x}" y="${y+5}" text-anchor="middle">${p.type==='battery'?'12V':p.type==='switch'?(p.closed?'بسته':'باز'):p.type==='resistor'?p.value+'Ω':'⊗'}</text></g>${[0,1].map(end=>{const id=p.id+':'+end,[px,py]=pt(id);return `<g role="button" tabindex="0" data-pin="${id}" ${s.street?`data-shop-drag="street:${id}" data-shop-drop="street:${id}"`:''} aria-label="${names[p.type]} ${p.id} پایانه ${end+1}">${s.street?`<circle cx="${px}" cy="${py}" r="27" fill="transparent"/>`:""}<circle cx="${px}" cy="${py}" r="14" fill="${s.pending===id?'#e7b950':'#d7eff1'}" stroke="#467e87" stroke-width="2"/><text x="${px}" y="${py+4}" text-anchor="middle" pointer-events="none">${p.type==='battery'||(s.street&&p.type==='lamp')?(end===0?'+':'−'):end+1}</text></g>`;}).join('')}</g>`;
  }).join('')}</svg></div>${s.pending?'<button data-action="cancel-wire">لغو اتصال</button>':''}`;
}
export function renderCabinet(s,expanded=false){
  let content='';
  if(s.challenge)content=challengePanel(s);
  else if(s.shop)content=shopWorkbench(s);
  else if(s.street)content=streetWorkbench(s,wirePanel(s));
  else if(s.mission.id==='clinic')content=`<p class="cabinet-help">کلید هر مصرف‌کننده را تنظیم کن. هر سه وسیلهٔ ضروری باید روشن باشند.</p><div class="power-budget"><b>${fa(s.power)} / ۱۸ وات</b><meter min="0" max="30" optimum="18" low="1" high="18" value="${s.power}"></meter></div><div class="appliance-list">${appliances.map((p,i)=>`<button data-load="${i}" aria-pressed="${s.loads[i]}"><span><b>${p.name}</b><small>${fa(p.power)} وات · ${p.essential?'ضروری':'غیرضروری'}</small></span><span class="load-toggle">${s.loads[i]?'روشن':'خاموش'}</span></button>`).join('')}</div>`;
  else {
    if(['gate','street','station'].includes(s.mission.id))content+=wirePanel(s);
    if(['shop','station'].includes(s.mission.id))content+=`<div class="resistor-slot"><span>مقاومت نصب‌شده</span><b dir="ltr">${s.board.parts.find(p=>p.type==='resistor').value} Ω</b></div><p class="cabinet-help">جایگزینی مقاومت:</p><div class="spare-parts">${replacements.map(p=>`<button data-resistor="${p.value}" aria-pressed="${s.board.parts.find(part=>part.type==='resistor').value===p.value}" ${s.credits<p.cost?'disabled':''}><b dir="ltr">${p.value} Ω</b><small>${fa(p.cost)} اعتبار</small></button>`).join('')}</div>`;
    const sw=s.board.parts.find(p=>p.type==='switch');content+=`<button class="cabinet-switch" data-action="switch" aria-pressed="${sw.closed}">کلید اصلی: ${sw.closed?'بسته ●':'باز ○'}</button>`;
  }
  return `<section class="cabinet-panel ${s.tool==='meter'?'meter-mode':''}" aria-label="داخل جعبه‌برق"><header><strong>${expanded?'نمای بزرگ مدار':'جعبه‌برق'}</strong><div class="cabinet-header-actions">${expanded?`<button data-tool="${s.tool==='meter'?'inspect':'meter'}" aria-pressed="${s.tool==='meter'}" title="مولتی‌متر" aria-label="مولتی‌متر">V</button>`:''}${expanded?'':'<button class="expand-circuit" data-action="expand-circuit" title="بزرگ‌نمایی مدار" aria-label="باز کردن مدار در پنجرهٔ بزرگ">⛶</button>'}<button data-action="${expanded?'close-circuit':'close-panel'}" aria-label="${expanded?'بستن نمای بزرگ':'بستن جعبه‌برق'}">×</button></div></header>${componentMeterView(s)}${sceneMessage(s,true)}${content}</section>`;
}

export function renderAdventure(s){
  const challengeTest=s.challenge?.testLabel??(s.mission.id==='pumps'?'یک دور پمپاژ':s.mission.id==='backup'?(s.challenge.phase?'آزمایش باتری':'آزمایش مولد'):(s.challenge?.phase?'آزمایش زیر بار':'آزمایش بی‌بار'));
  return `<header class="adventure-heading"><div><span class="eyebrow">مأموریت ${fa(s.index+1)} · ${s.mission.skill}</span><h1 tabindex="-1">${s.mission.title}</h1><p>${s.mission.objective}</p></div><div class="adventure-wallet"><b>${fa(s.credits)}</b><small>اعتبار قطعات</small></div></header>
    <div class="adventure-toolbar" aria-label="کیف ابزار"><div class="tool-choice">${[['inspect','⌕','بررسی'],['meter','V','مولتی‌متر']].map(([id,icon,title])=>`<button data-tool="${id}" aria-pressed="${s.tool===id}"><b>${icon}</b> ${title}</button>`).join('')}</div><button data-action="hint" title="راهنمای مرحله‌ای" aria-label="راهنمای مرحله‌ای">?</button><button data-action="restart" title="شروع دوباره" aria-label="شروع دوباره">↻</button><button class="energize" data-action="test" ${s.won?'disabled':''}>${s.challenge?challengeTest:s.street?(s.street.verified&&!s.street.isolated.size?'آزمایش نهایی':s.street.isolated.size?'آزمایش استقلال شاخه‌ها':'آزمایش روشنایی'):'وصل و آزمایش برق'}</button></div>
    <div class="adventure-scene ${s.panel&&!s.won&&!s.circuitExpanded?'with-cabinet':''}">${renderSite(s)}${s.panel&&!s.won&&!s.circuitExpanded?renderCabinet(s):''}</div>
    ${s.circuitExpanded&&!s.won?`<dialog class="circuit-dialog" aria-label="نمای بزرگ مدار">${renderCabinet(s,true)}<footer class="circuit-dialog-footer"><span>تغییرات مستقیماً روی همین مدار اعمال می‌شوند.</span><button data-action="test">⚡ آزمایش مدار</button><button data-action="close-circuit">بازگشت به مأموریت</button></footer></dialog>`:''}
    ${s.won?`<section class="adventure-victory" role="status"><div><span class="earned-stars">کیفیت تحویل: ${fa(s.stars)} از ۳</span><h2>گزارش تحویل تأیید شد</h2><p>${s.mission.lesson}</p><small>${fa(s.mistakes)} آزمایش ناموفق · ${fa(s.hints)} راهنما · ${fa(s.spent)} اعتبار مصرف‌شده</small></div><button data-action="next">${s.index===adventures.length-1?'مرکز عملیات':'رفتن به مأموریت بعد'} ←</button></section>`:''}
    <details class="field-notes"><summary>دفتر عیب‌یابی · ${fa(s.notes.length)} یادداشت</summary>${s.notes.length?'<ul>'+s.notes.map(n=>`<li>${n}</li>`).join('')+'</ul>':'<p>با بررسی پلاک‌ها و اندازه‌گیری، شواهد اینجا ثبت می‌شوند.</p>'}<small>مدل آموزشی کم‌ولتاژ DC؛ امتیاز بهتر با آزمایش ناموفق و راهنمای کمتر. بازگشت به خیابان تعمیر نیمه‌تمام را نگه می‌دارد.</small></details>`;
}
