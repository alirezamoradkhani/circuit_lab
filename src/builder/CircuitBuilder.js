import {wirePath} from './wirePath.js';
import {Board,evaluate,names} from './Board.js';
export class CircuitBuilder {
  constructor(svg,controls,onChange,onWin){
    Object.assign(this,{svg,controls,onChange,onWin,active:false});
    svg.addEventListener('pointerdown',e=>this.down(e));
    svg.addEventListener('pointermove',e=>this.move(e));
    svg.addEventListener('pointerup',e=>this.up(e));
    svg.addEventListener('pointercancel',()=>{this.drag=null;});
    svg.addEventListener('dragover',e=>{if(this.active)e.preventDefault();});
    svg.addEventListener('drop',e=>{if(!this.active)return;e.preventDefault();const type=e.dataTransfer.getData('text/plain');if(names[type]){const p=this.point(e);this.add(type,p.x,p.y);}});
    controls.addEventListener('dragstart',e=>{const b=e.target.closest('[data-add]');if(this.active&&b)e.dataTransfer.setData('text/plain',b.dataset.add);});
    controls.addEventListener('click',e=>{if(!this.active)return;const b=e.target.closest('button');if(!b)return;if(b.dataset.add)this.add(b.dataset.add);else if(b.dataset.tool)this.action(b.dataset.tool);});
    controls.addEventListener('change',e=>{if(!this.active)return;if(e.target.id==='wireSelect'){this.selectedWire=e.target.value===''?null:Number(e.target.value);this.selected=null;this.pending=null;this.render();return;}if(e.target.id!=='partResistance')return;this.save();const p=this.selectedPart();p.value=Number(e.target.value);this.changed();});
    document.addEventListener('keydown',e=>{if(!this.active||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape'){this.pending=null;this.render();}if(e.key==='Delete')this.action(this.selectedWire!==null?'delete-wire':'delete');});
  }
  load(mission){this.active=true;this.mission=mission;this.board=new Board();this.selected=null;this.selectedWire=null;this.pending=null;this.drag=null;this.history=[];this.moves=0;this.result=null;this.message='قطعات را از جعبهٔ ابزار بکش و روی میز رها کن؛ یا برای افزودن روی نام قطعه بزن.';this.render();}
  point(e){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(this.svg.getScreenCTM().inverse());return {x:Math.max(85,Math.min(815,p.x)),y:Math.max(75,Math.min(350,p.y))};}
  save(){this.history.push(this.board.snapshot());if(this.history.length>40)this.history.shift();}
  selectedPart(){return this.board.parts.find(p=>p.id===this.selected);}
  add(type,x,y){if(this.board.parts.filter(p=>p.type===type).length>=(this.mission.parts[type]||0)){this.message='تعداد این قطعه برای مأموریت کافی است.';this.render();return;}this.save();const n=this.board.parts.length;this.selected=this.board.add(type,x??(190+(n%3)*235),y??(140+Math.floor(n/3)*160)).id;this.changed();}
  changed(){this.selectedWire=null;this.moves++;this.result=null;this.message='برای سیم‌کشی، یک پایانه را بزن و بعد پایانهٔ مقصد را انتخاب کن. سیم با جابه‌جایی قطعه همراه آن حرکت می‌کند.';this.onChange();this.render();}
  terminal(id){const [part,end]=id.split(':');const p=this.board.parts.find(p=>p.id===part);const offset=Number(end)===0?-60:60;return {x:p.x+(p.rotation?0:offset),y:p.y+(p.rotation?offset:0)};}
  down(e){
    if(!this.active||e.button!==0)return;
    const pin=e.target.closest('[data-pin]');
    if(pin){e.preventDefault();const id=pin.dataset.pin;if(this.pending===id)this.pending=null;else if(this.pending){this.save();if(this.board.connect(this.pending,id))this.changed();else this.message='دو پایانهٔ متفاوت از دو قطعه انتخاب کن؛ سیم تکراری ساخته نمی‌شود.';this.pending=null;}else{this.pending=id;this.message='اکنون پایانهٔ مقصد را انتخاب کن. برای انشعاب می‌توانی دوباره از همین پایانه سیم بگیری.';}this.render();return;}
    const wire=e.target.closest('[data-wire]');if(wire){e.preventDefault();this.selectedWire=Number(wire.dataset.wire);this.selected=null;this.pending=null;this.message='سیم انتخاب شد؛ دکمهٔ «حذف سیم انتخاب‌شده» یا کلید Delete را بزن.';this.render();return;}
    const part=e.target.closest('[data-part]');if(part){e.preventDefault();this.selectedWire=null;this.selected=part.dataset.part;const p=this.selectedPart(),at=this.point(e);this.drag={id:e.pointerId,dx:at.x-p.x,dy:at.y-p.y,start:at,snapshot:this.board.snapshot(),moved:false};this.svg.setPointerCapture(e.pointerId);this.render();}
  }
  move(e){if(!this.active||!this.drag||this.drag.id!==e.pointerId)return;const at=this.point(e);if(Math.hypot(at.x-this.drag.start.x,at.y-this.drag.start.y)>4)this.drag.moved=true;if(!this.drag.moved)return;const p=this.selectedPart();p.x=Math.max(85,Math.min(815,Math.round((at.x-this.drag.dx)/10)*10));p.y=Math.max(75,Math.min(350,Math.round((at.y-this.drag.dy)/10)*10));this.renderSvg();}
  up(e){if(!this.drag||this.drag.id!==e.pointerId)return;if(this.drag.moved){this.history.push(this.drag.snapshot);this.moves++;}this.drag=null;if(this.svg.hasPointerCapture(e.pointerId))this.svg.releasePointerCapture(e.pointerId);this.render();}
  action(tool){
    if(tool==='delete-wire'){if(this.selectedWire===null||!this.board.wires[this.selectedWire])return;this.save();this.board.wires.splice(this.selectedWire,1);this.pending=null;this.changed();this.message='سیم حذف شد. برای بازگرداندن آن، «برگشت یک حرکت» را بزن.';this.render();return;}
    if(tool==='test'){this.result=evaluate(this.board,this.mission);this.message=this.result.message;if(this.result.ok)this.onWin();this.render();return;}
    if(tool==='cancel'){this.pending=null;this.render();return;}
    if(tool==='undo'){const saved=this.history.pop();if(saved){this.board.restore(saved);this.selected=null;this.pending=null;this.changed();}return;}
    const p=this.selectedPart();if(!p)return;this.save();
    if(tool==='delete'){this.board.remove(p.id);this.selected=null;this.pending=null;}
    if(tool==='rotate')p.rotation=p.rotation?0:90;
    if(tool==='switch'&&p.type==='switch')p.closed=!p.closed;
    this.changed();
  }
  render(){this.renderSvg();this.renderControls();this.onChange(this);}
  renderSvg(){
    const ok=this.result?.ok;
    let s='<defs><pattern id="boardGrid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#38516d"/></pattern></defs><rect width="900" height="440" rx="16" fill="url(#boardGrid)"/>';
    if(!this.board.parts.length)s+='<text x="450" y="200" text-anchor="middle" fill="#acbed1" font-size="22">میز طراحی تو — قطعه‌ها را اینجا بچین</text><text x="450" y="242" text-anchor="middle" fill="#acbed1" font-size="16">کشیدن قطعه • اتصال پایانه‌ها • آزمایش مدار</text>';
    const used=new Set();
    this.board.wires.forEach(([a,b],i)=>{const d=wirePath(this.board,a,b,id=>this.terminal(id),used);s+=`<g data-wire="${i}" style="cursor:pointer"><title>انتخاب سیم؛ سپس حذف از فهرست یا با Delete</title><path d="${d}" fill="none" stroke="transparent" stroke-width="24" pointer-events="stroke"/><path d="${d}" fill="none" stroke="${this.selectedWire===i?'#ffbc6a':ok?'#64edbd':'#81bbf8'}" stroke-width="4"/></g>`;});
    for(const p of this.board.parts){
      let symbol='';
      if(p.type==='battery')symbol='<path d="M-60 0H-10 M10 0H60 M-10 -27V27 M10 -15V15"/><text x="-24" y="-33" fill="#ffdb82" stroke="none" font-size="19">+</text><text x="18" y="-26" fill="#ffdb82" stroke="none" font-size="19">−</text>';
      if(p.type==='resistor')symbol='<path d="M-60 0H-38 L-30 -14 -18 14 -6 -14 6 14 18 -14 30 14 38 0 H60"/>';
      if(p.type==='lamp')symbol=`<path d="M-60 0H-24 M24 0H60"/><circle r="24" fill="${ok?'#ffe190':'#152a43'}"/><path d="M-15 -15L15 15 M15 -15L-15 15"/>`;
      if(p.type==='switch')symbol=`<path d="M-60 0H-25 M25 0H60 M-25 0L25 ${p.closed?0:-25}"/><circle cx="-25" r="4"/><circle cx="25" r="4"/>`;
      s+=`<g data-part="${p.id}" transform="translate(${p.x} ${p.y})" style="cursor:grab"><rect x="-73" y="-63" width="146" height="126" rx="12" fill="#142c45" fill-opacity=".94" stroke="${this.selected===p.id?'#ffd468':'#365875'}" stroke-width="2"/><g transform="rotate(${p.rotation})" fill="none" stroke="#e1edf8" stroke-width="3">${symbol}</g><text x="0" y="${p.rotation?79:49}" text-anchor="middle" fill="#d5e7f7" font-size="13" pointer-events="none">${names[p.type]} ${p.id.slice(1)} · ${p.type==='switch'?(p.closed?'بسته':'باز'):p.type==='battery'?'12 V':p.value+' Ω'}</text></g>`;
    }
    for(const p of this.board.parts)for(const end of [0,1]){const id=p.id+':'+end,at=this.terminal(id);s+=`<g data-pin="${id}" style="cursor:crosshair"><title>پایانهٔ ${end+1} ${names[p.type]}</title><circle cx="${at.x}" cy="${at.y}" r="17" fill="transparent"/><circle cx="${at.x}" cy="${at.y}" r="8" fill="${this.pending===id?'#ffd468':'#92d6ff'}" stroke="#102338" stroke-width="3"/></g>`;}
    this.svg.innerHTML=s;
  }
  renderControls(){
    const p=this.selectedPart();
    const endpoint=id=>{const [part,end]=id.split(':');const item=this.board.parts.find(x=>x.id===part);return `${names[item.type]} ${part.slice(1)} / ${item.type==='battery'?(end==='0'?'+':'−'):Number(end)+1}`;};
    const wireList=`<div class="wire-list"><label for="wireSelect">سیم‌های مدار (${this.board.wires.length}) — اگر کلیک روی سیم سخت است، از این فهرست انتخاب کن</label><select id="wireSelect"><option value="">یک سیم انتخاب کن…</option>${this.board.wires.map(([a,b],i)=>`<option value="${i}" ${this.selectedWire===i?'selected':''}>سیم ${i+1}: ${endpoint(a)} ↔ ${endpoint(b)}</option>`).join('')}</select><button type="button" data-tool="delete-wire" ${this.selectedWire===null?'disabled':''}>حذف سیم انتخاب‌شده</button></div>`;
    this.controls.innerHTML=`<div class="builder-tools"><strong>جعبهٔ قطعات — بکش یا کلیک کن</strong><div class="builder-palette">${Object.entries(this.mission.parts).map(([type,count])=>`<button type="button" draggable="true" data-add="${type}">${names[type]} <small>${this.board.parts.filter(p=>p.type===type).length}/${count}</small></button>`).join('')}</div><p>۱. قطعه بچین　۲. پایانه‌های آبی را دو به دو وصل کن　۳. کلید را ببند و آزمایش کن</p><p>کلیک روی سیم: انتخاب؛ سپس حذف • کشیدن بدنه: جابه‌جایی • انشعاب: چند سیم از یک پایانه • تقاطع خطوط، گره نیست</p><div class="builder-inspector"><b>${p?names[p.type]+' انتخاب شده':'برای ویرایش، بدنهٔ یک قطعه را انتخاب کن'}</b>${p?'<button data-tool="rotate">چرخش ۹۰°</button><button data-tool="delete">حذف قطعه</button>':''}${p?.type==='switch'?`<button data-tool="switch">${p.closed?'باز کردن کلید':'بستن کلید'}</button>`:''}${p?.type==='resistor'?`<label>مقاومت <select id="partResistance">${[3,6,9,12,15,18,24,30].map(v=>`<option value="${v}" ${p.value===v?'selected':''}>${v} Ω</option>`).join('')}</select></label>`:''}</div>${wireList}<div class="builder-actions"><button data-tool="test" class="primary-button">آزمایش مدار من</button><button data-tool="undo" ${this.history.length?'':'disabled'}>برگشت یک حرکت</button><button data-tool="cancel" ${this.pending?'':'disabled'}>لغو سیم‌کشی</button></div><small>مدل آموزشی DC: باتری ۱۲ ولت، سیم و کلید ایدئال؛ هر لامپ مقاومت ثابت ۱۲ اهم دارد. مدارهای مأموریت‌های سری و موازی بررسی می‌شوند.</small></div>`;
  }
}
