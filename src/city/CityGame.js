import {renderTown,buildingArt} from './scene.js?v=city3';
import {CircuitBuilder} from '../builder/CircuitBuilder.js?v=city1';
import {cityMissions,seedMission} from './missions.js?v=city1';
import {CityProgress} from './Progress.js';

export class CityGame {
  constructor(root){
    this.root=root;this.index=null;this.hints=0;this.active=false;
    let storage;try{storage=window.localStorage;}catch{}
    this.progress=new CityProgress(storage);
    root.innerHTML=`<section class="city-overview"><div><span class="eyebrow">فصل اول · پس از خاموشی</span><h1>محلهٔ خاموش</h1><p>شهر منتظر توست! از دروازه وارد شو، خرابی‌ها را پیدا کن و روشنایی را به خیابان برگردان. روی ساختمان نشان‌دار بزن.</p></div><div class="city-meter"><b data-progress></b><span>نقطهٔ روشن</span><progress max="5" value="0" aria-label="پیشرفت روشن‌کردن محله"></progress></div></section>
    <div class="city-map" aria-label="نقشهٔ مأموریت‌های محله"></div>
    <p class="city-save" data-save></p>
    <section class="city-work" hidden>
      <div class="city-location" aria-hidden="true"></div><div class="city-brief"><span class="eyebrow" data-skill></span><h2 tabindex="-1" data-title></h2><p data-story></p><p class="city-objective" data-objective></p><small>مدل آموزشی DC · پایانه‌های آبی را دو به دو وصل کن؛ بدنهٔ قطعه را بکش؛ برای حذف سیم، روی آن بزن و از فهرست حذف کن.</small></div>
      <div class="city-toolbar" aria-label="ابزارهای تعمیر"><button data-action="map">← نقشه</button><button data-action="undo" aria-label="برگشت یک حرکت">↶</button><button data-action="hint">راهنمای مرحله‌ای</button><button data-action="restart">↻ شروع دوباره</button><div class="city-zoom" dir="ltr"><button data-action="zoom-out" aria-label="کوچک‌نمایی">−</button><output data-zoom></output><button data-action="zoom-in" aria-label="بزرگ‌نمایی">+</button><button data-action="zoom-reset" aria-label="بازگشت به اندازهٔ اصلی">⌂</button></div></div>
      <p class="city-feedback" role="status" data-feedback></p><p class="city-hint" data-hint hidden></p>
      <div class="city-victory" role="status" hidden><strong data-victory></strong><button data-action="next">مأموریت بعد ←</button></div>
      <svg class="builder-board city-board" id="cityCircuit" viewBox="0 0 1200 800" role="group" aria-label="مدار مأموریت شهر"></svg><div data-controls></div>
    </section>`;
    this.builder=new CircuitBuilder(this.el('#cityCircuit'),this.el('[data-controls]'),()=>this.sync(),()=>this.win());
    root.addEventListener('click',e=>{
      const mission=e.target.closest('[data-mission]');if(mission){this.start(Number(mission.dataset.mission));return;}
      const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
      if(action==='map')this.showMap();
      else if(action==='next'){if(this.index<4)this.start(this.index+1);else this.showMap();}
      else if(action==='restart')this.start(this.index);
      else if(action==='hint')this.hint();
      else this.builder.action(action);
    });
    this.renderMap();
  }
  el(selector){return this.root.querySelector(selector);}
  setActive(active){this.active=active;this.builder.active=active&&this.index!==null&&!this.el('.city-work').hidden;}
  renderMap(){
    const count=Object.keys(this.progress.stars).length;
    this.el('[data-progress]').textContent=`${count.toLocaleString('fa-IR')} / ۵`;
    this.el('progress').value=count;
    this.el('[data-save]').textContent=this.progress.saved?'پیشرفت در همین مرورگر ذخیره می‌شود. سه ستاره: بدون راهنما؛ دو ستاره: یک راهنما؛ یک ستاره: راهنمای بیشتر.':'ذخیره‌سازی مرورگر در دسترس نیست؛ پیشرفت فعلاً تا زمان بستن صفحه نگه داشته می‌شود.';
    this.el('.city-map').innerHTML=renderTown(cityMissions,this.progress,this.index);
  }
  start(index){
    if(!this.progress.unlocked(index))return;
    this.index=index;this.hints=0;this.won=false;
    const mission=cityMissions[index];
    this.el('.city-work').hidden=false;
    this.el('[data-title]').textContent=mission.title;
    this.el('.city-location').innerHTML=buildingArt(mission.id);
    this.el('.city-location').classList.remove('powered');
    this.el('[data-story]').textContent=mission.story;
    this.el('[data-skill]').textContent=`مأموریت ${(index+1).toLocaleString('fa-IR')} از ۵ · ${mission.skill}`;
    this.el('[data-objective]').textContent=mission.objective;
    this.el('[data-hint]').hidden=true;
    this.el('.city-victory').hidden=true;
    this.builder.load(mission);seedMission(this.builder.board,mission);
    this.builder.message='مدار هنوز تأیید نشده است. خرابی را برطرف کن و «آزمایش مدار من» را بزن.';
    this.builder.render();this.renderMap();
    this.el('[data-title]').focus({preventScroll:true});
    this.el('.city-work').scrollIntoView({block:'start',behavior:'smooth'});
  }
  sync(){
    if(!this.builder?.board)return;
    this.el('[data-feedback]').textContent=this.builder.message;
    this.el('[data-zoom]').textContent=`${Math.round(this.builder.zoom*100).toLocaleString('fa-IR')}٪`;
    this.el('[data-action="undo"]').disabled=!this.builder.history.length;
    if(!this.builder.result?.ok)this.el('.city-victory').hidden=true;
  }
  hint(){
    const mission=cityMissions[this.index];if(!mission)return;
    this.hints=Math.min(3,this.hints+1);
    this.el('[data-hint]').hidden=false;
    this.el('[data-hint]').textContent=`راهنمای ${this.hints.toLocaleString('fa-IR')} از ۳: ${mission.hints[this.hints-1]}`;
  }
  win(){
    const mission=cityMissions[this.index];
    if(!this.won){this.progress.complete(mission.id,this.hints);this.won=true;}
    this.renderMap();
    this.el('.city-location').classList.add('powered');
    this.el('.city-victory').hidden=false;
    this.el('[data-victory]').textContent=mission.restored;
    this.el('[data-action="next"]').textContent=this.index===4?'دیدن محلهٔ روشن ←':'مأموریت بعد ←';
  }
  showMap(){
    this.builder.active=false;this.el('.city-work').hidden=true;this.renderMap();
    const button=this.el(`[data-mission="${this.index??0}"]`);button.focus({preventScroll:true});
    this.el('.city-overview').scrollIntoView({block:'start',behavior:'smooth'});
  }
}
