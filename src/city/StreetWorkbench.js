const fa=n=>n.toLocaleString("fa-IR");
function streetWiring(s){
  const positions={p1:[110,60],p2:[390,60]};
  const loads=s.board.parts.filter(p=>!['battery','switch'].includes(p.type));
  loads.forEach((p,i)=>positions[p.id]=[110+(i%3)*230,260+Math.floor(i/3)*150]);
  if(s.street.cable)positions[s.street.cable.id]=[570,410];
  const pt=id=>{const [p,end]=id.split(':');const [x,y]=positions[p];return [x+(end==='0'?-45:45),y];};
  const names={battery:'باتری',switch:'کلید',lamp:'چراغ',resistor:s.street?'اتصال فرسوده':'مقاومت'};
  const wires=s.board.wires.map(([a,b],i)=>{
    const [x1,y1]=pt(a),[x2,y2]=pt(b),bend=y1===y2?y1+38+(i%3)*12:125+i*12;
    return `<g role="button" tabindex="0" data-wire="${i}" aria-label="برداشتن سیم ${fa(i+1)}"><path d="M${x1} ${y1}V${bend}H${x2}V${y2}" fill="none" stroke="transparent" stroke-width="18"/><path d="M${x1} ${y1}V${bend}H${x2}V${y2}" fill="none" stroke="#80c7ca" stroke-width="4" pointer-events="none"/></g>`;
  }).join('');
  return `<p class="cabinet-help">از یک پایانه به دیگری سیم بکش یا دو پایانه را انتخاب کن؛ برای برداشتن سیم روی خط آن بزن. هر سیم: ۲ اعتبار.</p><svg class="street-board" viewBox="0 0 700 ${loads.length>3?475:340}" role="group" aria-label="اتصال‌های جعبه‌برق">${wires}${s.board.parts.map(p=>{
    const [x,y]=positions[p.id];return `<g><rect x="${x-26}" y="${y-20}" width="52" height="40" rx="8" fill="#f8efd9" stroke="#b5b49e"/><rect x="${x-70}" y="${y-61}" width="140" height="27" rx="8" fill="#dfe9de"/><text x="${x}" y="${y-42}" text-anchor="middle">${names[p.type]}${p.type==='lamp'?' '+fa(loads.indexOf(p)+1):''}</text><text x="${x}" y="${y+5}" text-anchor="middle">${p.type==='battery'?'12V':p.type==='switch'?(p.closed?'بسته':'باز'):p.type==='resistor'?p.value+'Ω':'⊗'}</text>${[0,1].map(end=>{const id=p.id+':'+end,[px,py]=pt(id);return `<g role="button" tabindex="0" data-pin="${id}" ${s.street?`data-shop-drag="street:${id}" data-shop-drop="street:${id}"`:''} aria-label="${names[p.type]} ${p.id} پایانه ${end+1}">${s.street?`<circle cx="${px}" cy="${py}" r="27" fill="transparent"/>`:""}<circle cx="${px}" cy="${py}" r="23" fill="${s.pending===id?'#e7b950':'#d7eff1'}" stroke="#467e87" stroke-width="2"/><text x="${px}" y="${py+4}" text-anchor="middle" pointer-events="none">${p.type==='battery'||(s.street&&p.type==='lamp')?(end===0?'+':'−'):end+1}</text></g>`;}).join('')}</g>`;
  }).join('')}</svg>${s.pending?'<button data-action="cancel-wire">لغو اتصال</button>':''}`;
}
export function streetWorkbench(s){
 return `<section class="street-workbench street-workspace" aria-label="نمای بزرگ سیم‌کشی"><header><div><h2>مسیر سیم‌های کوچه</h2><p>چراغ‌ها را به مسیر مستقل وصل کن.</p></div><button data-action="close-panel">بازگشت به کوچه ←</button></header><p class="street-pan-help">در گوشی برای دیدن ادامهٔ مسیر، برد را به چپ و راست بکش.</p><div class="street-board-scroll" tabindex="0" role="region" aria-label="برد سیم‌کشی قابل پیمایش">${streetWiring(s)}</div><div class="street-board-actions"><button data-action="switch">کلید اصلی: ${s.board.parts.find(p=>p.type==='switch').closed?'بسته':'باز'}</button>${s.street.cable?'<button data-street-cable="remove">برداشتن اتصال قدیمی · ۳ اعتبار</button>':''}</div>${s.messageTarget?`<p class="street-feedback" role="status">${s.message}</p>`:''}${s.tripped?'<button data-action="reset-fuse">بازنشانی محافظ</button>':''}</section>`;
}
