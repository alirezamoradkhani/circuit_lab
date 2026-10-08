import {renderTown} from './scene.js';
import {adventures} from './adventureData.js';
import {AdventureSession} from './AdventureSession.js?v=meter8';
import {renderAdventure} from './AdventureView.js?v=meter8';
import {CityProgress} from './Progress.js';
import {ShopInteractions} from './ShopInteractions.js?v=meter8';

export class CityGame {
  constructor(root){
    this.root=root;this.index=null;this.active=false;this.sessions=new Map();
    let storage;try{storage=window.localStorage;}catch{}
    // New gameplay has separate completion records from the old circuit-only mode.
    this.progress=new CityProgress(storage,'circuit-lab.adventure.v1');
    root.innerHTML=`<div class="city-home"><section class="city-overview"><div><span class="eyebrow">داستان تعاملی · بازگشت روشنایی</span><h1>یک شهر منتظر توست</h1><p>با مردم گفت‌وگو کن، خرابی‌ها را پیدا کن و زندگی را به محله برگردان.</p></div><div class="city-meter"><b data-progress></b><span>مکان بازسازی‌شده</span><progress max="5" value="0" aria-label="پیشرفت بازسازی شهر"></progress></div></section><div class="city-map" aria-label="نقشهٔ شهر"></div><p class="city-save" data-save></p><div class="campaign-ending" hidden><h2>محله دوباره روشن است!</h2><p>از یک چراغ خاموش تا بازگرداندن برق یک محله؛ کار تیم تعمیرات تمام شد. می‌توانی برای ستاره‌های بیشتر به مکان‌ها برگردی.</p></div></div><div class="adventure-layout" hidden><aside class="adventure-sidebar"><button data-action="map">→ بازگشت به خیابان</button><details class="adventure-missions" open><summary>مأموریت‌های محله</summary><nav data-missions aria-label="مأموریت‌های شهر"></nav></details><p>بررسی ← اندازه‌گیری ← تعمیر ← آزمایش</p></aside><main class="adventure-work" data-stage></main></div>`;
    this.shopInteractions=new ShopInteractions(root,()=>this.active?this.sessions.get(this.index):null,()=>this.renderGame());
    root.addEventListener('click',e=>this.handle(e));
    root.addEventListener('cancel',e=>{if(e.target.matches('.circuit-dialog')){e.preventDefault();this.closeCircuit();}},true);
    root.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&this.el('.circuit-dialog[open]'))return;
      if(e.key==='Escape'&&this.sessions.get(this.index)?.messageTarget){this.sessions.get(this.index).messageTarget=null;this.renderGame();this.el(`[data-target="${this.sessions.get(this.index).focus}"]`)?.focus({preventScroll:true});}
      if(['Enter',' '].includes(e.key)&&e.target.matches('svg [role="button"]')){e.preventDefault();this.handle(e);}
    });
    this.renderMap();
  }
  el(selector){return this.root.querySelector(selector);}
  setActive(active){this.active=active;if(!active)this.shopInteractions.cancel();}
  renderMap(){
    const count=Object.keys(this.progress.stars).length;
    this.el('[data-progress]').textContent=`${count.toLocaleString('fa-IR')} / ۵`;
    this.el('progress').value=count;
    this.el('.city-map').innerHTML=renderTown(adventures,this.progress,this.index);
    this.el('[data-save]').textContent=this.progress.saved?'ستاره‌ها در همین مرورگر ذخیره می‌شوند؛ تعمیر نیمه‌تمام تا زمان باز بودن صفحه حفظ می‌شود.':'ذخیره‌سازی مرورگر در دسترس نیست؛ پیشرفت فقط تا زمان بستن صفحه باقی می‌ماند.';
    this.el('.campaign-ending').hidden=count!==adventures.length;
    this.el('[data-missions]').innerHTML=adventures.map((m,i)=>`<button data-mission="${i}" ${this.progress.unlocked(i)?'':'disabled'} ${i===this.index?'aria-current="step"':''}><span>${(i+1).toLocaleString('fa-IR')}</span><div><b>${m.title}</b><small>${this.progress.stars[m.id]?'★'.repeat(this.progress.stars[m.id]):this.sessions.has(i)?'در حال تعمیر':this.progress.unlocked(i)?m.skill:'پس از مأموریت قبلی'}</small></div></button>`).join('');
  }
  start(index){
    if(!this.progress.unlocked(index))return;
    this.index=index;if(!this.sessions.has(index))this.sessions.set(index,new AdventureSession(index));
    this.el('.city-home').hidden=true;this.el('.adventure-layout').hidden=false;
    this.el('.adventure-missions').open=!window.matchMedia('(max-width:800px)').matches;
    this.renderMap();this.renderGame();this.el('[data-stage] h1').focus({preventScroll:true});
    this.root.scrollIntoView({block:'start'});
  }
  closeCircuit(){
    const s=this.sessions.get(this.index);if(!s)return;s.circuitExpanded=false;
    this.shopInteractions.cancel();this.renderGame();this.el('[data-action="expand-circuit"]')?.focus({preventScroll:true});
  }
  renderGame(){
    const dialogScroll=this.el('.circuit-dialog')?.scrollTop||0;
    const notesOpen=!!this.el('.field-notes')?.open;
    const panelScroll=this.el('.cabinet-panel')?.scrollTop||0;
    const diagramScroll=this.el('.circuit-diagram-scroll')?.scrollLeft||0;
    this.el('[data-stage]').classList.toggle('meter-mode',this.sessions.get(this.index).tool==='meter');
    this.el('[data-stage]').innerHTML=renderAdventure(this.sessions.get(this.index));
    this.el('.field-notes').open=notesOpen;
    if(this.el('.cabinet-panel'))this.el('.cabinet-panel').scrollTop=panelScroll;
    const dialog=this.el('.circuit-dialog');
    document.documentElement.classList.toggle('circuit-popup-open',!!dialog);
    if(dialog){dialog.showModal();dialog.scrollTop=dialogScroll;}
    if(this.el('.circuit-diagram-scroll'))this.el('.circuit-diagram-scroll').scrollLeft=diagramScroll;
  }
  showMap(){
    this.el('.city-home').hidden=false;this.el('.adventure-layout').hidden=true;this.renderMap();
    this.el(`.city-map [data-mission="${this.index??0}"]`).focus({preventScroll:true});this.root.scrollIntoView({block:'start'});
  }
  handle(e){
    if(!this.active)return;
    const button=e.target.closest('[data-mission],[data-action],[data-tool],[data-target],[data-pin],[data-wire],[data-resistor],[data-load],[data-probe],[data-shop-point],[data-shop-spare],[data-shop-action],[data-street-inspect],[data-street-replace],[data-street-isolate],[data-street-cable],[data-measure-part]');
    if(!button||button.disabled)return;
    if(button.dataset.mission!==undefined){this.start(Number(button.dataset.mission));return;}
    const action=button.dataset.action;
    if(action==='map'){this.showMap();return;}
    const s=this.sessions.get(this.index);if(!s)return;
    if(s.tool==='meter'){
      const d=button.dataset;
      const part=d.measurePart||d.pin?.split(':')[0]||d.streetInspect||d.streetReplace||d.streetIsolate||(d.streetCable?s.street?.cable?.id:null)||((d.resistor||d.shopSpare||d.shopAction)?s.board.parts.find(p=>p.type==='resistor')?.id:null)||(action==='switch'?s.board.parts.find(p=>p.type==='switch')?.id:null);
      if(part||d.wire!==undefined){s.meteredPart=part||null;s.meteredWire=d.wire===undefined?null:Number(d.wire);s.pending=null;s.messageTarget=null;if(d.streetInspect&&!s.panel){s.street.inspect(part);s.messageTarget="load";}this.renderGame();return;}
      if(d.load!==undefined){s.note(s.reading('load'));s.messageTarget='load';this.renderGame();return;}
    }
    if(action==='expand-circuit'){s.circuitExpanded=true;s.messageTarget=null;this.renderGame();return;}
    if(action==='close-circuit'){this.closeCircuit();return;}
    if(action==='dismiss-message'){s.messageTarget=null;this.renderGame();this.el(`[data-target="${s.focus}"]`)?.focus({preventScroll:true});return;}
    if(action==='next'){this.index<4?this.start(this.index+1):this.showMap();return;}
    if(action==='restart'){this.sessions.set(this.index,new AdventureSession(this.index));this.renderGame();this.el('[data-stage] h1').focus({preventScroll:true});return;}
    if(s.shop&&(button.dataset.probe||button.dataset.shopPoint||button.dataset.shopSpare||button.dataset.shopAction)){
      if(button.dataset.probe)s.shop.selectedProbe=button.dataset.probe;
      if(button.dataset.shopPoint)s.shop.placeProbe(s.shop.selectedProbe,button.dataset.shopPoint);
      if(button.dataset.shopSpare)s.shop.selectedSpare=Number(button.dataset.shopSpare);
      if(button.dataset.shopAction==='remove')s.shop.remove();
      if(button.dataset.shopAction==='socket'&&s.shop.selectedSpare)s.shop.install(s.shop.selectedSpare);
      s.messageTarget=button.dataset.shopAction?'cabinet':null;
      const selector=Object.entries(button.dataset).filter(([key])=>key!=='shopDrag').map(([key,value])=>`[data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${value}"]`).join('');
      this.renderGame();this.el('[data-stage]').querySelector(selector)?.focus({preventScroll:true});return;
    }
    if(s.street){
      if(button.dataset.streetInspect)s.street.inspect(button.dataset.streetInspect);
      if(button.dataset.streetReplace)s.street.replace(button.dataset.streetReplace);
      if(button.dataset.streetIsolate)s.street.isolate(button.dataset.streetIsolate);
      if(button.dataset.streetCable)s.street.removeCable();
    }
    if(button.dataset.tool){this.shopInteractions.cancel();s.tool=button.dataset.tool;s.pending=null;s.meteredWire=null;s.message=s.tool==='meter'?'برای اندازه‌گیری، منبع یا مصرف‌کننده را در صحنه انتخاب کن.':'با انتخاب آدم‌ها و وسایل، سرنخ‌های خرابی را پیدا کن.';}
    if(button.dataset.target)s.inspect(button.dataset.target);
    if(button.dataset.pin)s.pin(button.dataset.pin);
    if(button.dataset.wire!==undefined)s.removeWire(Number(button.dataset.wire));
    if(button.dataset.resistor)s.install(Number(button.dataset.resistor));
    if(button.dataset.load!==undefined)s.toggleLoad(Number(button.dataset.load));
    if(action==='test'){const before=s.mistakes;if(s.test())this.progress.complete(s.mission.id,3-s.stars);s.resultTone=s.won?'success':s.mistakes>before?'error':'info';s.circuitExpanded=false;}
    if(action==='hint')s.hint();
    if(action==='switch')s.toggleSwitch();
    if(action==='reset-fuse')s.resetFuse();
    if(action==='close-panel')s.panel=false;
    if(action==='cancel-wire')s.pending=null;
    s.messageTarget=button.dataset.target||(button.dataset.tool?'source':action==='hint'?'person':'cabinet');
    if(button.dataset.streetInspect)s.messageTarget=s.panel?'cabinet':'load';
    if(action==='close-panel')s.messageTarget=null;
    if(action==='test')s.messageTarget='result';
    if(s.shop&&button.dataset.tool==='meter'){s.panel=true;s.messageTarget=null;}
    const focusSelector=Object.entries(button.dataset).map(([key,value])=>`[data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${value}"]`).join('');
    this.renderGame();this.renderMap();
    if(action==='test')this.el('.scene-test-result')?.scrollIntoView({block:'nearest'});
    this.el('[data-stage]').querySelector(focusSelector)?.focus({preventScroll:true});
  }
}
