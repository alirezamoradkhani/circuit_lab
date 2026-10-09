import {ObjectInspector} from './ObjectInspector.js';
import {CampaignLayout} from './CampaignLayout.js';
import {icon} from './icons.js';
import {SceneHUD} from './SceneHUD.js';
import {Device,Source,SourceSelector} from '../components/index.js';
import {campaignCatalog} from '../levels/catalog.js';
export {equipmentStatus} from './EquipmentStatus.js';
import {escapeHTML,equipmentStatus} from './EquipmentStatus.js';
const fa=n=>Number(n).toLocaleString('fa-IR',{maximumFractionDigits:2});
export function stageMenu(active,completed=[]){
 return '<span class="story-kicker">مدار گمشده · دوازده ایستگاه</span><h2>مسیر داستان</h2><p>هر مرحله معمای خودش را دارد. بازپخش، ذخیرهٔ مسیر اصلی را جایگزین نمی‌کند.</p><div class="campaign-stage-list">'+campaignCatalog.map(e=>'<button data-story-action="stage:'+e.number+'" '+(e.number===active?'aria-current="step"':'')+'><span>'+fa(e.number)+'</span><b>'+e.title+'</b><small>'+(completed.includes(e.number)?'✓ تمام شده':e.number===active?'اینجا هستی':'ورود به مرحله')+'</small></button>').join('')+'</div>';
}
function content(kind,session,saved,completed){
 const d=session.definition,w=session.world;
 if(kind==='levels')return stageMenu(d.number,completed());
 if(kind==='complete')return '<span class="story-kicker">مرحلهٔ '+fa(d.number)+' تمام شد</span><h2>'+escapeHTML(d.title)+'</h2><p>'+escapeHTML(d.outro??(d.number===12?'چراغ‌های محله روشن شدند؛ رِی و دوستانش دوباره کنار هم هستند.':'مسیر باز شد. وقت دنبال‌کردن ادامهٔ داستان است.'))+'</p><div class="story-dialog-actions">'+(d.number<12?'<button data-story-action="next">مرحلهٔ بعد</button>':'')+'<button data-story-action="levels">مسیر داستان</button><button data-story-action="replay">بازپخش این مرحله</button></div>';
 if(kind==='reset')return '<h2>دوباره امتحان کنیم؟</h2><p>بازگشت به ورودی فقط رِی و کابل همراه را آزاد می‌کند. شروع تازه، وضعیت همین مرحله را از نو می‌سازد.</p><div class="story-dialog-actions"><button data-story-action="recover">برگشت به ورودی</button><button data-story-action="restart">شروع تازه</button></div>';
 if(kind==='bag')return '<h2>کیف رِی</h2><div class="story-items">'+w.all().filter(e=>e.state.collected||e.state.holder==='ray').map(e=>'<article><div><b>'+escapeHTML(e.config.label??e.id)+'</b><p>'+escapeHTML(equipmentStatus(e,w))+'</p></div></article>').join('')+'</div>';
 if(kind==='circuit')return '<span class="story-kicker">زمان متوقف است</span><h2>اتصال‌های فعلی</h2><div class="campaign-circuit-list">'+[...w.connections].map(([target,c])=>'<p><b>'+escapeHTML(w.get(c.source)?.config.label??c.source)+' ← '+escapeHTML(w.get(target)?.config.label??target)+'</b><br>'+escapeHTML(equipmentStatus(w.get(target),w))+'</p>').join('')+'</div><p>برای تغییر اتصال، به صحنه برگرد و ابزار کابل را انتخاب کن.</p>';
 const h=session.hint();return '<span class="story-kicker">دفتر نورا · '+escapeHTML(d.title)+'</span><h2>'+escapeHTML(h.title)+'</h2><p>'+escapeHTML(h.reason)+'</p><div class="story-hint-note"><b>سرنخ همین حالا</b><p>'+escapeHTML(h.clue)+'</p></div><details class="story-help-details"><summary>راهنمای دقیق‌تر</summary><ol>'+h.steps.map(s=>'<li>'+escapeHTML(s)+'</li>').join('')+'</ol></details><details class="story-help-details"><summary>کنترل‌ها</summary><p>روی زمین بزن تا رِی راه برود. با ابزار دست، وسیله را انتخاب کن و از فهرست کنار صحنه کاری را انتخاب کن؛ رِی نزدیک می‌شود و انجام می‌دهد. کابل: بین منبع و مصرف‌کننده بکش یا دو سر را کلیک کن. برای جداکردن از فهرست اتصال‌ها استفاده کن. Esc کابل ناتمام را لغو می‌کند. ولت‌متر فقط می‌خواند.</p><p>WASD حرکت · E تعامل · C کابل · M ولت‌متر · H سرنخ</p></details><p class="story-subtle">'+(saved?'پیشرفت ذخیره می‌شود.':'ذخیرهٔ دائمی در دسترس نیست؛ بازی در این نشست ادامه دارد.')+' زمان در دفتر متوقف است.</p><div class="story-dialog-actions"><button data-story-action="hint">سرنخ روی صحنه</button></div>';
}
export class CampaignHUD extends SceneHUD {
 constructor(root,onAction,session,completed){
  const names=Object.fromEntries(session.world.all().filter(e=>e.config.interactive!==false&&!e.config.hidden&&!['Sequence','PathRide','Fog'].includes(e.kind)&&e.id!=='ray').map(e=>[e.id,e.config.label??e.id]));
  super(root,onAction,{
   safeInsets:{top:26,bottom:26},messagesOutsideScene:true,
   names,pins:session.world.all().filter(e=>e instanceof Device||e instanceof Source||e instanceof SourceSelector).map(e=>e.id),
   labels:{chapter:'مدار گمشده / مرحلهٔ '+fa(session.definition.number),title:session.definition.title,introChapter:'ایستگاه '+fa(session.definition.number),introTitle:session.definition.title,introText:session.definition.intro},
   available:(id)=>{const e=session.world.get(id);return e.state.visible&&!e.state.collected;},goal:()=>session.definition.ready(session.world,session.ctx)?'exit':session.definition.focus?.(session.world,session.ctx)??null,objective:()=>session.objective(),
   canUnplug:(s,id)=>session.world.connections.has(id)||[...session.world.connections.values()].some(c=>c.source===id),
   interactionLabel:(s,id)=>names[id]??'بررسی وسیله',
   visible:(id,s,{tool,selected,nearest,goal,pin})=>tool==='hand'?id===selected||id===nearest||id===goal:pin,
   dialogContent:(kind,s,saved)=>content(kind,session,saved,completed),
  });
  this.session=session;this.stage.classList.add('campaign-stage');
  const begin=root.querySelector('[data-story-action="begin"]');begin.textContent='ورود به ماموریت';
  const nav=document.createElement('button');nav.dataset.storyAction='levels';nav.title='انتخاب مرحله';nav.setAttribute('aria-label','انتخاب مرحله');nav.textContent='☷';root.querySelector('.story-small-tools').prepend(nav);
  this.panel=document.createElement('section');this.panel.className='campaign-object-tools';this.panel.hidden=true;this.panel.setAttribute('aria-label','ابزارهای وسیلهٔ انتخاب‌شده');this.panel.innerHTML='<header><b></b><p></p></header><div></div>';this.stage.append(this.panel);
  for(const [id,node]of Object.entries(this.nodes)){const e=session.world.get(id),kind=e.kind;const role=kind==='Source'?'source':kind==='Battery'?'battery':kind==='Charger'||e.config.visual==='charger'?'charger':kind==='Guard'?'guard':null;if(role){node.dataset.role=role;node.querySelector('svg').outerHTML=icon(role); }node.title=e.config.label??id;}
  this.layout=new CampaignLayout(this);this.inspector=new ObjectInspector(this);
 }
 update(s,scene,tool,selected,nearest,intro,dt,interactions){
  super.update(s,scene,tool,selected,nearest,intro,dt);
  this.root.querySelector('.story-context').hidden=true;this.root.querySelector('.story-unplug').hidden=true;
  this.inspector.update(s,tool,selected,interactions);
  this.layout.update(scene,selected,this.config.goal(s),interactions);
 }
}
