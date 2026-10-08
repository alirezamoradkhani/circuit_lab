import {buildingArt} from './scene.js';
import {appliances,replacements} from './adventureData.js';
import {character} from './characters.js';
import {sceneMessage} from './SceneMessage.js?v=ui5';
import {shopWorkbench} from './ShopWorkbench.js?v=shop3';
import {streetWorkbench} from './StreetWorkbench.js?v=street3';
const fa=n=>n.toLocaleString('fa-IR');
export function renderSite(s){
  const street=s.mission.id==='street';
  const art=street?[250,410,570].map((x,i)=>`<g><path d="M${x} 340V110Q${x} 85 ${x+25} 85" fill="none" stroke="#486975" stroke-width="10"/><path style="fill:${s.street.readings()[i].brightness>.05?'#ffe184':'#70878a'}" class="town-light" d="M${x+10} 85h40l10 22h-60Z"/><path style="opacity:${s.street.readings()[i].brightness*.65}" class="light-beam" d="M${x-5} 107L${x-55} 340H${x+100}L${x+55} 107Z"/></g>`).join(''):buildingArt(s.mission.id).replace('<svg ','<svg x="180" y="25" width="460" height="380" ');
  return `<div class="adventure-site site-${s.mission.id} ${s.won?'powered restored':''} ${s.tripped?'power-tripped':''}" ${s.shop?`style="--sign-light:${s.shop.brightness}"`:''}>
    <svg class="site-art" viewBox="0 0 800 460" aria-hidden="true"><defs><linearGradient id="siteSky" x2="0" y2="1"><stop stop-color="#b4e0ec"/><stop offset="1" stop-color="#eef4cf"/></linearGradient></defs><rect width="800" height="460" fill="url(#siteSky)"/><circle cx="690" cy="65" r="32" fill="#fff0a5"/><path d="M0 210Q160 140 300 215T800 180V390H0" fill="#b7d5ad"/><path d="M0 340H800V460H0" fill="#e3d9ba"/><path d="M0 421H800" stroke="#93a8a5" stroke-width="44"/><path d="M0 421H800" stroke="#e7ead4" stroke-width="3" stroke-dasharray="28 24"/>${art}
    ${s.mission.id==='shop'?'<g class="shop-sign"><rect x="240" y="85" width="340" height="62" rx="14" fill="#ffe187"/><text x="410" y="128" text-anchor="middle" font-size="32" fill="#795b20">سپید</text></g><g class="site-shutter"><rect x="470" y="225" width="80" height="125" fill="#849798"/><path d="M473 242h74m-74 20h74m-74 20h74m-74 20h74m-74 20h74" stroke="#b3c2bd" stroke-width="4"/></g>':''}
    ${s.mission.id==='gate'?`<path d="M323 345V195M356 345V183M390 345V183M422 345V195" stroke="#4f7680" stroke-width="8" class="site-gate-bars"/>`:''}
    <g transform="translate(675 220)"><rect width="62" height="98" rx="8" fill="#506e70"/><rect x="9" y="10" width="44" height="60" rx="4" fill="#8aa99f"/><path d="M35 20L20 45H33L27 61L44 36H33Z" fill="#ffdd81"/><circle cx="46" cy="82" r="5" fill="${s.tripped?'#e16b5a':s.won?'#f9e680':'#adc0b0'}"/></g>
    <g transform="translate(64 292)"><rect width="64" height="47" rx="6" fill="#5c8583"/><path d="M17 0V-8H48V0" fill="none" stroke="#395963" stroke-width="6"/><text x="32" y="31" text-anchor="middle" fill="#fff5c4" font-size="18">12V</text></g>
    ${character(s.mission.id)}
    ${s.mission.id==='clinic'?'<g class="clinic-fan" transform="translate(470 250)"><circle r="23" fill="#eef3d9" stroke="#649185" stroke-width="4"/><g class="fan-blades"><path d="M0 -20V20M-20 0H20" stroke="#639387" stroke-width="7"/></g></g>':''}
    ${s.won?`<g class="site-traveller">${character('visitor',{x:35,y:392,scale:.45})}${street?'<circle cx="15" cy="443" r="16" fill="none" stroke="#48626c" stroke-width="4"/><circle cx="64" cy="443" r="16" fill="none" stroke="#48626c" stroke-width="4"/><path d="M15 443L31 419L45 443H15M45 443L58 419L64 443M55 416H68" fill="none" stroke="#bc6b49" stroke-width="4"/>':''}</g>`:''}</svg>
    <div class="site-label">${s.won?'✓ برق برقرار است':s.tripped?'محافظ قطع شده':s.shop?.brightness?'تابلو کم‌نور است':'محل مأموریت · '+s.mission.title}</div>
    ${[['person','گفت‌وگو',25,58],['load',street?'چراغ‌های کوچه':'پلاک مصرف‌کننده',51,38],['source','منبع برق',10,83],['cabinet','جعبه‌برق',87,62]].map(([id,title,x,y])=>`<button class="site-hotspot ${s.focus===id?'selected':''}" style="--x:${x}%;--y:${y}%" data-target="${id}" aria-label="${title}"><span>${id==='cabinet'?'⚒':id==='person'?'…':s.tool==='meter'?'V':'⌕'}</span><b>${title}</b></button>`).join('')}
    ${street?[250,410,570].map((x,i)=>`<button class="site-hotspot street-lamp-hotspot" style="--x:${(x+25)/8}%;--y:27%" data-street-inspect="p${i+3}" aria-label="بررسی چراغ ${i+1}"><span>${i+1}</span></button>`).join(''):''}
    ${sceneMessage(s)}
  </div>`;
}

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
  return `<p class="cabinet-help">از یک پایانه به دیگری سیم بکش یا دو پایانه را انتخاب کن؛ برای برداشتن سیم روی خط آن بزن. هر سیم: ۲ اعتبار.</p><div class="circuit-diagram-scroll"><svg class="repair-wiring" viewBox="0 0 400 ${loads.length>3?355:265}" role="group" aria-label="اتصال‌های جعبه‌برق">${wires}${s.board.parts.map(p=>{
    const [x,y]=positions[p.id];return `<g><rect x="${x-26}" y="${y-20}" width="52" height="40" rx="8" fill="#f8efd9" stroke="#b5b49e"/><text x="${x}" y="${y-28}" text-anchor="middle">${names[p.type]}${p.type==='lamp'?' '+fa(loads.indexOf(p)+1):''}</text><text x="${x}" y="${y+5}" text-anchor="middle">${p.type==='battery'?'12V':p.type==='switch'?(p.closed?'بسته':'باز'):p.type==='resistor'?p.value+'Ω':'⊗'}</text>${[0,1].map(end=>{const id=p.id+':'+end,[px,py]=pt(id);return `<g role="button" tabindex="0" data-pin="${id}" ${s.street?`data-shop-drag="street:${id}" data-shop-drop="street:${id}"`:''} aria-label="${names[p.type]} ${p.id} پایانه ${end+1}">${s.street?`<circle cx="${px}" cy="${py}" r="27" fill="transparent"/>`:""}<circle cx="${px}" cy="${py}" r="14" fill="${s.pending===id?'#e7b950':'#d7eff1'}" stroke="#467e87" stroke-width="2"/><text x="${px}" y="${py+4}" text-anchor="middle" pointer-events="none">${p.type==='battery'||(s.street&&p.type==='lamp')?(end===0?'+':'−'):end+1}</text></g>`;}).join('')}</g>`;
  }).join('')}</svg></div>${s.pending?'<button data-action="cancel-wire">لغو اتصال</button>':''}`;
}
export function renderCabinet(s,expanded=false){
  let content='';
  if(s.shop)content=shopWorkbench(s);
  else if(s.street)content=streetWorkbench(s,wirePanel(s));
  else if(s.mission.id==='clinic')content=`<p class="cabinet-help">کلید هر مصرف‌کننده را تنظیم کن. هر سه وسیلهٔ ضروری باید روشن باشند.</p><div class="power-budget"><b>${fa(s.power)} / ۱۸ وات</b><meter min="0" max="30" optimum="18" low="1" high="18" value="${s.power}"></meter></div><div class="appliance-list">${appliances.map((p,i)=>`<button data-load="${i}" aria-pressed="${s.loads[i]}"><span><b>${p.name}</b><small>${fa(p.power)} وات · ${p.essential?'ضروری':'غیرضروری'}</small></span><span class="load-toggle">${s.loads[i]?'روشن':'خاموش'}</span></button>`).join('')}</div>`;
  else {
    if(['gate','street','station'].includes(s.mission.id))content+=wirePanel(s);
    if(['shop','station'].includes(s.mission.id))content+=`<div class="resistor-slot"><span>مقاومت نصب‌شده</span><b dir="ltr">${s.board.parts.find(p=>p.type==='resistor').value} Ω</b></div><p class="cabinet-help">جایگزینی مقاومت:</p><div class="spare-parts">${replacements.map(p=>`<button data-resistor="${p.value}" aria-pressed="${s.board.parts.find(part=>part.type==='resistor').value===p.value}" ${s.credits<p.cost?'disabled':''}><b dir="ltr">${p.value} Ω</b><small>${fa(p.cost)} اعتبار</small></button>`).join('')}</div>`;
    const sw=s.board.parts.find(p=>p.type==='switch');content+=`<button class="cabinet-switch" data-action="switch" aria-pressed="${sw.closed}">کلید اصلی: ${sw.closed?'بسته ●':'باز ○'}</button>`;
  }
  return `<section class="cabinet-panel" aria-label="داخل جعبه‌برق"><header><strong>${expanded?'نمای بزرگ مدار':'جعبه‌برق'}</strong><div class="cabinet-header-actions">${expanded?'':'<button class="expand-circuit" data-action="expand-circuit" title="بزرگ‌نمایی مدار" aria-label="باز کردن مدار در پنجرهٔ بزرگ">⛶</button>'}<button data-action="${expanded?'close-circuit':'close-panel'}" aria-label="${expanded?'بستن نمای بزرگ':'بستن جعبه‌برق'}">×</button></div></header>${sceneMessage(s,true)}${content}</section>`;
}

export function renderAdventure(s){
  return `<header class="adventure-heading"><div><span class="eyebrow">مأموریت ${fa(s.index+1)} · ${s.mission.skill}</span><h1 tabindex="-1">${s.mission.title}</h1><p>${s.mission.objective}</p></div><div class="adventure-wallet"><b>${fa(s.credits)}</b><small>اعتبار قطعات</small></div></header>
    <div class="adventure-toolbar" aria-label="کیف ابزار"><div class="tool-choice">${[['inspect','⌕','بررسی'],['meter','V','مولتی‌متر']].map(([id,icon,title])=>`<button data-tool="${id}" aria-pressed="${s.tool===id}"><b>${icon}</b> ${title}</button>`).join('')}</div><button data-action="hint" title="راهنمای مرحله‌ای" aria-label="راهنمای مرحله‌ای">?</button><button data-action="restart" title="شروع دوباره" aria-label="شروع دوباره">↻</button><button class="energize" data-action="test" ${s.won?'disabled':''}>⚡ ${s.street?(s.street.verified&&!s.street.isolated.size?'آزمایش نهایی':s.street.isolated.size?'آزمایش استقلال شاخه‌ها':'آزمایش روشنایی'):'وصل و آزمایش برق'}</button></div>
    <div class="adventure-scene ${s.panel&&!s.won&&!s.circuitExpanded?'with-cabinet':''}">${renderSite(s)}${s.panel&&!s.won&&!s.circuitExpanded?renderCabinet(s):''}</div>
    ${s.circuitExpanded&&!s.won?`<dialog class="circuit-dialog" aria-label="نمای بزرگ مدار">${renderCabinet(s,true)}<footer class="circuit-dialog-footer"><span>تغییرات مستقیماً روی همین مدار اعمال می‌شوند.</span><button data-action="test">⚡ آزمایش مدار</button><button data-action="close-circuit">بازگشت به مأموریت</button></footer></dialog>`:''}
    ${s.won?`<section class="adventure-victory" role="status"><div><span class="earned-stars">${'★'.repeat(s.stars)}${'☆'.repeat(3-s.stars)}</span><h2>این بخش شهر دوباره زنده شد</h2><p>${s.mission.lesson}</p><small>${fa(s.mistakes)} آزمایش ناموفق · ${fa(s.hints)} راهنما · ${fa(s.spent)} اعتبار مصرف‌شده</small></div><button data-action="next">${s.index===4?'جشن روشنایی شهر':'رفتن به مأموریت بعد'} ←</button></section>`:''}
    <details class="field-notes"><summary>دفتر عیب‌یابی · ${fa(s.notes.length)} یادداشت</summary>${s.notes.length?'<ul>'+s.notes.map(n=>`<li>${n}</li>`).join('')+'</ul>':'<p>با بررسی پلاک‌ها و اندازه‌گیری، شواهد اینجا ثبت می‌شوند.</p>'}<small>مدل آموزشی کم‌ولتاژ DC؛ امتیاز بهتر با آزمایش ناموفق و راهنمای کمتر. بازگشت به خیابان تعمیر نیمه‌تمام را نگه می‌دارد.</small></details>`;
}
