import {renderTown} from './scene.js';
import {adventures} from './adventureData.js';
import {AdventureSession} from './AdventureSession.js';
import {renderAdventure} from './AdventureView.js?v=adventure2';
import {CityProgress} from './Progress.js';

export class CityGame {
  constructor(root){
    this.root=root;this.index=null;this.active=false;this.sessions=new Map();
    let storage;try{storage=window.localStorage;}catch{}
    // New gameplay has separate completion records from the old circuit-only mode.
    this.progress=new CityProgress(storage,'circuit-lab.adventure.v1');
    root.innerHTML=`<div class="city-home"><section class="city-overview"><div><span class="eyebrow">داستان تعاملی · بازگشت روشنایی</span><h1>یک شهر منتظر توست</h1><p>با مردم گفت‌وگو کن، خرابی‌ها را پیدا کن و زندگی را به محله برگردان.</p></div><div class="city-meter"><b data-progress></b><span>مکان بازسازی‌شده</span><progress max="5" value="0" aria-label="پیشرفت بازسازی شهر"></progress></div></section><div class="city-map" aria-label="نقشهٔ شهر"></div><p class="city-save" data-save></p><div class="campaign-ending" hidden><h2>محله دوباره روشن است!</h2><p>از یک چراغ خاموش تا بازگرداندن برق یک محله؛ کار تیم تعمیرات تمام شد. می‌توانی برای ستاره‌های بیشتر به مکان‌ها برگردی.</p></div></div><div class="adventure-layout" hidden><aside class="adventure-sidebar"><button data-action="map">→ بازگشت به خیابان</button><details class="adventure-missions" open><summary>مأموریت‌های محله</summary><nav data-missions aria-label="مأموریت‌های شهر"></nav></details><p>بررسی ← اندازه‌گیری ← تعمیر ← آزمایش</p></aside><main class="adventure-work" data-stage></main></div>`;
    root.addEventListener('click',e=>this.handle(e));
    root.addEventListener('keydown',e=>{
      if(['Enter',' '].includes(e.key)&&e.target.matches('svg [role="button"]')){e.preventDefault();this.handle(e);}
    });
    this.renderMap();
  }
  el(selector){return this.root.querySelector(selector);}
  setActive(active){this.active=active;}
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
  renderGame(){
    const notesOpen=!!this.el('.field-notes')?.open;
    this.el('[data-stage]').innerHTML=renderAdventure(this.sessions.get(this.index));
    this.el('.field-notes').open=notesOpen;
  }
  showMap(){
    this.el('.city-home').hidden=false;this.el('.adventure-layout').hidden=true;this.renderMap();
    this.el(`.city-map [data-mission="${this.index??0}"]`).focus({preventScroll:true});this.root.scrollIntoView({block:'start'});
  }
  handle(e){
    if(!this.active)return;
    const button=e.target.closest('[data-mission],[data-action],[data-tool],[data-target],[data-pin],[data-wire],[data-resistor],[data-load]');
    if(!button||button.disabled)return;
    if(button.dataset.mission!==undefined){this.start(Number(button.dataset.mission));return;}
    const action=button.dataset.action;
    if(action==='map'){this.showMap();return;}
    const s=this.sessions.get(this.index);if(!s)return;
    if(action==='next'){this.index<4?this.start(this.index+1):this.showMap();return;}
    if(action==='restart'){this.sessions.set(this.index,new AdventureSession(this.index));this.renderGame();this.el('[data-stage] h1').focus({preventScroll:true});return;}
    if(button.dataset.tool){s.tool=button.dataset.tool;s.message=s.tool==='meter'?'برای اندازه‌گیری، منبع یا مصرف‌کننده را در صحنه انتخاب کن.':'با انتخاب آدم‌ها و وسایل، سرنخ‌های خرابی را پیدا کن.';}
    if(button.dataset.target)s.inspect(button.dataset.target);
    if(button.dataset.pin)s.pin(button.dataset.pin);
    if(button.dataset.wire!==undefined)s.removeWire(Number(button.dataset.wire));
    if(button.dataset.resistor)s.install(Number(button.dataset.resistor));
    if(button.dataset.load!==undefined)s.toggleLoad(Number(button.dataset.load));
    if(action==='test'&&s.test())this.progress.complete(s.mission.id,3-s.stars);
    if(action==='hint')s.hint();
    if(action==='switch')s.toggleSwitch();
    if(action==='reset-fuse')s.resetFuse();
    if(action==='close-panel')s.panel=false;
    if(action==='cancel-wire')s.pending=null;
    const focusSelector=Object.entries(button.dataset).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    this.renderGame();this.renderMap();
    this.el('[data-stage]').querySelector(focusSelector)?.focus({preventScroll:true});
  }
}
