import {SceneHUD} from './SceneHUD.js';
import {Device,Source,SourceSelector} from '../components/index.js';
import {campaignCatalog} from '../levels/catalog.js';
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>Number(n).toLocaleString('fa-IR',{maximumFractionDigits:2});
export function stageMenu(active,completed=[]){
 return '<span class="story-kicker">مدار گمشده · دوازده ایستگاه</span><h2>مسیر داستان</h2><p>هر مرحله معمای خودش را دارد. بازپخش، ذخیرهٔ مسیر اصلی را جایگزین نمی‌کند.</p><div class="campaign-stage-list">'+campaignCatalog.map(e=>'<button data-story-action="stage:'+e.number+'" '+(e.number===active?'aria-current="step"':'')+'><span>'+fa(e.number)+'</span><b>'+e.title+'</b><small>'+(completed.includes(e.number)?'✓ تمام شده':e.number===active?'اینجا هستی':'ورود به مرحله')+'</small></button>').join('')+'</div>';
}
export function equipmentStatus(e,world){
 if(e instanceof Source)return (e.state.tripped?'محافظ قطع است':e.available()?'منبع آماده':'منبع خاموش')+' · '+fa(e.voltage)+' ولت · سقف '+fa(e.maxWatts)+' وات'+(Number.isFinite(e.state.energy)?' · '+fa(e.state.energy)+' ژول':'');
 if(e.kind==='Divider')return 'خروجی تقسیم‌کننده: '+fa(e.state.output)+' ولت'+(e.state.safe?'':' · توان نامی قطعه کافی نیست');
 if(e.kind==='Receiver')return ({off:'خاموش',noise:'پیام بریده؛ ولتاژ یا آنتن را بررسی کن',clear:'پیام واضح',alternate:'برنامهٔ دیگری دریافت می‌شود'})[e.state.quality];
 if(e instanceof Device){const d=e.measure(world);return (e.state.complete?'کار کامل شده':e.state.powered?'برق برقرار':'برق قطع')+' · '+fa(d.voltage)+' ولت · '+fa(d.watts)+' وات';}
 if(e.kind==='Resistor')return fa(e.state.ohms)+' اهم';
 if(e.kind==='WaterBasin')return 'سطح آب: '+fa(e.state.level*100)+'٪';
 if(e.kind==='PressurePlate')return e.state.pressed?'صفحه پایین است':'صفحه آزاد است';
 if(e.state.collected)return 'در کیف نگه داشته شده';
 if(e.state.locked||e.state.latched)return 'در جای خود قفل شده';
 if(e.state.holder==='ray')return 'همراه رِی';
 return e.config.description??'';
}
function content(kind,session,saved,completed){
 const d=session.definition,w=session.world;
 if(kind==='levels')return stageMenu(d.number,completed());
 if(kind==='complete')return '<span class="story-kicker">مرحلهٔ '+fa(d.number)+' تمام شد</span><h2>'+escapeHTML(d.title)+'</h2><p>'+escapeHTML(d.outro??(d.number===12?'چراغ‌های محله روشن شدند؛ رِی و دوستانش دوباره کنار هم هستند.':'مسیر باز شد. وقت دنبال‌کردن ادامهٔ داستان است.'))+'</p><div class="story-dialog-actions">'+(d.number<12?'<button data-story-action="next">مرحلهٔ بعد</button>':'')+'<button data-story-action="levels">مسیر داستان</button><button data-story-action="replay">بازپخش این مرحله</button></div>';
 if(kind==='reset')return '<h2>دوباره امتحان کنیم؟</h2><p>بازگشت به ورودی فقط رِی و کابل همراه را آزاد می‌کند. شروع تازه، وضعیت همین مرحله را از نو می‌سازد.</p><div class="story-dialog-actions"><button data-story-action="recover">برگشت به ورودی</button><button data-story-action="restart">شروع تازه</button></div>';
 if(kind==='bag')return '<h2>کیف رِی</h2><div class="story-items">'+w.all().filter(e=>e.state.collected||e.state.holder==='ray').map(e=>'<article><div><b>'+escapeHTML(e.config.label??e.id)+'</b><p>'+escapeHTML(equipmentStatus(e,w))+'</p></div></article>').join('')+'</div>';
 if(kind==='circuit')return '<span class="story-kicker">زمان متوقف است</span><h2>اتصال‌های فعلی</h2><div class="campaign-circuit-list">'+[...w.connections].map(([target,c])=>'<p><b>'+escapeHTML(w.get(c.source)?.config.label??c.source)+' ← '+escapeHTML(w.get(target)?.config.label??target)+'</b><br>'+escapeHTML(equipmentStatus(w.get(target),w))+'</p>').join('')+'</div><p>برای تغییر اتصال، به صحنه برگرد و ابزار کابل را انتخاب کن.</p>';
 const h=session.hint();return '<span class="story-kicker">دفتر نورا · '+escapeHTML(d.title)+'</span><h2>'+escapeHTML(h.title)+'</h2><p>'+escapeHTML(h.reason)+'</p><div class="story-hint-note"><b>سرنخ همین حالا</b><p>'+escapeHTML(h.clue)+'</p></div><details class="story-help-details"><summary>راهنمای دقیق‌تر</summary><ol>'+h.steps.map(s=>'<li>'+escapeHTML(s)+'</li>').join('')+'</ol></details><details class="story-help-details"><summary>کنترل‌ها</summary><p>روی زمین بزن تا رِی راه برود. با ابزار دست، وسیله را انتخاب کن و از ابزارهای کنارش استفاده کن. کابل: منبع و مصرف‌کننده را بزن؛ تکرار اتصال آن را جدا می‌کند. ولت‌متر فقط می‌خواند.</p><p>WASD حرکت · E تعامل · C کابل · M ولت‌متر · H سرنخ</p></details><p class="story-subtle">'+(saved?'پیشرفت ذخیره می‌شود.':'ذخیرهٔ دائمی در دسترس نیست؛ بازی در این نشست ادامه دارد.')+' زمان در دفتر متوقف است.</p><div class="story-dialog-actions"><button data-story-action="hint">سرنخ روی صحنه</button></div>';
}
export class CampaignHUD extends SceneHUD {
 constructor(root,onAction,session,completed){
  const names=Object.fromEntries(session.world.all().filter(e=>e.config.interactive!==false&&!e.config.hidden&&!['Sequence','PathRide','Fog'].includes(e.kind)&&e.id!=='ray').map(e=>[e.id,e.config.label??e.id]));
  super(root,onAction,{
   names,pins:session.world.all().filter(e=>e instanceof Device||e instanceof Source||e instanceof SourceSelector||e.kind==='Resistor').map(e=>e.id),
   labels:{chapter:'مدار گمشده / مرحلهٔ '+fa(session.definition.number),title:session.definition.title,introChapter:'ایستگاه '+fa(session.definition.number),introTitle:session.definition.title,introText:session.definition.intro},
   available:(id)=>{const e=session.world.get(id);return e.state.visible&&!e.state.collected;},goal:()=>session.definition.ready(session.world,session.ctx)?'exit':null,objective:()=>session.objective(),
   canUnplug:(s,id)=>session.world.connections.has(id)||[...session.world.connections.values()].some(c=>c.source===id),
   interactionLabel:(s,id)=>names[id]??'بررسی وسیله',
   visible:(id,s,{tool,selected,nearest,goal,pin})=>tool==='hand'?id===selected||id===nearest||id===goal:pin,
   dialogContent:(kind,s,saved)=>content(kind,session,saved,completed),
  });
  this.session=session;this.stage.classList.add('campaign-stage');
  const begin=root.querySelector('[data-story-action="begin"]');begin.textContent='ورود به ماموریت';
  const nav=document.createElement('button');nav.dataset.storyAction='levels';nav.title='انتخاب مرحله';nav.setAttribute('aria-label','انتخاب مرحله');nav.textContent='☷';root.querySelector('.story-small-tools').prepend(nav);
  this.panel=document.createElement('section');this.panel.className='campaign-object-tools';this.panel.hidden=true;this.panel.setAttribute('aria-label','ابزارهای وسیلهٔ انتخاب‌شده');this.panel.innerHTML='<b></b><p></p><div></div>';this.stage.append(this.panel);
 }
 update(s,scene,tool,selected,nearest,intro,dt){
  super.update(s,scene,tool,selected,nearest,intro,dt);
  this.root.querySelector('.story-context').hidden=true;
  const e=this.session.world.get(selected),near=e&&Math.hypot(e.state.position.x-s.player.x,e.state.position.z-s.player.z)<1.7;
  this.panel.hidden=tool!=='hand'||!e||e.state.collected||!s.started||s.completed;
  if(!this.panel.hidden){
   const commands=near?this.session.commands(selected):[],status=near?equipmentStatus(e,this.session.world):'رِی دارد نزدیک می‌شود…';
   this.panel.querySelector('b').textContent=e.config.label??e.id;this.panel.querySelector('p').textContent=status;
   const html=commands.map(c=>'<button data-story-action="op:'+escapeHTML(c.id)+'">'+escapeHTML(c.label)+'</button>').join('');
   if(html!==this.panelContent){this.panelContent=html;this.panel.querySelector('div').innerHTML=html;}
   const p=scene.project(selected),height=this.panel.offsetHeight;
   if(p){this.panel.style.left=Math.max(130,Math.min(scene.width-130,p.x))+'px';this.panel.style.top=Math.max(scene.height<480?76:145,Math.min(scene.height-height-140,p.y-height-25))+'px';}
  }
  if(!this.bubble.hidden){this.bubble.style.left=(scene.width/2)+'px';this.bubble.style.top=Math.max(150,scene.height-250)+'px';}
 }
}
