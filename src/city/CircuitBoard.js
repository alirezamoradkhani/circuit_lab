const fa=n=>n.toLocaleString('fa-IR');

export function renderWirePanel(s){
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
    const [x,y]=positions[p.id];return `<g><g ${s.tool==='meter'?`class="meter-component ${s.meteredPart===p.id?'meter-selected':''}" data-measure-part="${p.id}" role="button" tabindex="0" aria-label="اندازه‌گیری ${names[p.type]}">`:'>'}<rect x="${x-26}" y="${y-20}" width="52" height="40" rx="8" fill="#f8efd9" stroke="#b5b49e"/><text x="${x}" y="${y-28}" text-anchor="middle">${names[p.type]}${p.type==='lamp'?' '+fa(loads.indexOf(p)+1):''}</text><text x="${x}" y="${y+5}" text-anchor="middle">${p.type==='battery'?'12V':p.type==='switch'?(p.closed?'بسته':'باز'):p.type==='resistor'?p.value+'Ω':'⊗'}</text></g>${[0,1].map(end=>{const id=p.id+':'+end,[px,py]=pt(id);return `<g role="button" tabindex="0" data-pin="${id}" ${s.street?`data-shop-drag="street:${id}" data-shop-drop="street:${id}"`:''} aria-label="${names[p.type]} ${p.id} پایانه ${end+1}">${s.street?`<circle cx="${px}" cy="${py}" r="27" fill="transparent"/>`:''}<circle cx="${px}" cy="${py}" r="14" fill="${s.pending===id?'#e7b950':'#d7eff1'}" stroke="#467e87" stroke-width="2"/><text x="${px}" y="${py+4}" text-anchor="middle" pointer-events="none">${p.type==='battery'||(s.street&&p.type==='lamp')?(end===0?'+':'−'):end+1}</text></g>`;}).join('')}</g>`;
  }).join('')}</svg></div>${s.pending?'<button data-action="cancel-wire">لغو اتصال</button>':''}`;
}
