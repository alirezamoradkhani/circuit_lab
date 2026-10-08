import {icon} from './icons.js';
import {dialogContent} from './dialogs.js';
import {NAMES,available} from '../workshop/layout.js';
export class WorkshopHUD {
  constructor(root,onAction){
    this.root=root;this.onAction=onAction;
    const button=(action,name,label)=>'<button type="button" data-story-action="'+action+'" title="'+label+'" aria-label="'+label+'">'+icon(name)+'</button>';
    root.innerHTML='<div class="story-stage"><div class="story-world"></div><div class="story-vignette"></div>'+
      '<header class="story-hud"><div class="story-heading"><span class="story-kicker">مدار گمشده / فصل اول</span><h1>بیداری در تعمیرگاه</h1><p data-objective>رد باتری را پیدا کن.</p></div>'+
      '<div class="story-instruments"><button class="story-battery" data-story-action="battery" title="باتری رِی؛ اتصال یا جداکردن کابل">'+icon('battery')+'<span><b data-energy>۷۲</b><small>ژول / ۷۲</small></span><i><em data-energy-bar></em></i></button>'+
      '<div class="story-small-tools">'+button('help','hint','دفتر راهنما')+button('view','view','نمای کامل اتاق')+button('sound','sound','قطع و وصل صدا')+button('reset','reset','شروع دوباره')+'</div></div></header>'+
      '<div class="story-hotspots" aria-label="وسایل تعمیرگاه"></div><div class="story-bubble" role="status" aria-live="polite" hidden></div>'+
      '<div class="story-context"><button type="button" data-story-action="interact">'+icon('hand')+'<span data-interaction>تعامل</span><kbd>E</kbd></button></div>'+
      '<nav class="story-dock" aria-label="ابزارهای رِی">'+[['hand','hand','تعامل'],['cable','cable','کابل'],['meter','meter','ولت‌متر'],['bag','bag','کیف'],['circuit','eye','مدار']].map(([action,name,label])=>'<button type="button" data-story-action="'+action+'" aria-label="'+label+'" aria-pressed="false">'+icon(name)+'<span>'+label+'</span></button>').join('')+'</nav>'+
      '<button type="button" class="story-unplug" data-story-action="disconnect" hidden>جدا کردن کابل</button><p class="story-tool-caption" data-tool-caption></p><button class="story-joystick" aria-label="دستهٔ حرکت لمسی"><i></i></button>'+
      '<div class="story-intro"><span class="story-kicker">۰۱ / تعمیرگاه نورا</span><h2>صبحِ بعد از خاموشی</h2><p>یک ربات کوچک. یک باتری گمشده.<br>و دری که منتظر یک جرقه است.</p><button type="button" data-story-action="begin">بیدار شو '+icon('arrow')+'</button></div>'+
      '<button class="story-skip" data-story-action="skip" hidden>ردکردن مقدمه</button>'+
      '<dialog class="story-dialog"><button class="story-dialog-close" aria-label="بستن" data-story-action="close">'+icon('close')+'</button><div data-dialog-content></div></dialog></div>';
    this.stage=root.querySelector('.story-stage');this.world=root.querySelector('.story-world');
    this.dialog=root.querySelector('dialog');this.bubble=root.querySelector('.story-bubble');
    this.nodes={};
    for(const [id,label] of Object.entries(NAMES)){
      const b=document.createElement('button');b.type='button';b.dataset.storyObject=id;b.setAttribute('aria-label',label);
      b.innerHTML=icon(id==='battery'?'battery':id==='cart'?'cart':id==='receipt'?'receipt':id==='reel'?'cable':id==='exit'?'arrow':'socket')+'<span>'+label+'</span>';
      root.querySelector('.story-hotspots').append(b);this.nodes[id]=b;
    }
    root.addEventListener('click',e=>{const b=e.target.closest('[data-story-action]');if(b)onAction(b.dataset.storyAction);});
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();onAction('close');});
  }
  setTool(tool){
    this.stage.dataset.tool=tool;
    this.root.querySelectorAll('.story-dock button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.storyAction===tool)));
    this.root.querySelector('[data-tool-caption]').textContent=tool==='cable'?'یک سر کابل → سر دیگر · تکرار اتصال برای جداکردن':tool==='meter'?'فقط اندازه‌گیری؛ روی سوکت یک وسیله بزن.':'روی زمین بزن و راه برو';
  }
  message(text,tone='info',duration=5){
    this.bubble.textContent=text;this.bubble.dataset.tone=tone;this.messageRemaining=duration;this.bubble.hidden=false;
  }
  showDialog(kind,s,saved){
    this.previousFocus=document.activeElement;this.kind=kind;
    this.root.querySelector('[data-dialog-content]').innerHTML=dialogContent(kind,s,saved);
    if(!this.dialog.open)this.dialog.showModal();
    this.dialog.querySelector('button').focus({preventScroll:true});
  }
  closeDialog(){this.dialog.close();this.kind=null;this.previousFocus?.focus?.({preventScroll:true});}
  update(s,scene,tool,selected,nearest,intro,dt){
    this.root.querySelector('.story-intro').hidden=s.started;
    this.root.querySelector('.story-skip').hidden=!s.started||intro>=4.6;
    this.stage.classList.toggle('story-playing',s.started&&intro>=4.6);
    this.root.querySelector('[data-energy]').textContent=Math.ceil(s.energy).toLocaleString('fa-IR');
    this.root.querySelector('[data-energy-bar]').style.width=(s.energy/72*100)+'%';
    this.root.querySelector('.story-battery').classList.toggle('charging',s.charging);
    this.root.querySelector('.story-battery').classList.toggle('low',s.energy<12);
    const goal=s.cart<1?'cart':!s.door?'latch':!s.receipt?'receipt':'exit';
    const text=s.cart<1?'چرخ‌دستی راه را بسته؛ عقبش بکش.':!s.door?'ضامن کنار کرکره را برق بده.':!s.receipt?'رسید پاک‌رو را کنار میز بردار.':'کابل رِی را جدا کن و از در بیرون برو.';
    this.root.querySelector('[data-objective]').textContent=s.completed?'رد پاک‌رو به کوچه می‌رسد.':text;
    const unplug=this.root.querySelector('.story-unplug');
    unplug.hidden=tool!=='cable'||!selected||!(s.connections[selected]||selected==='battery'&&(s.charging||Object.values(s.connections).includes('battery'))||selected==='mains'&&(s.charging||Object.values(s.connections).includes('mains')));
    const context=this.root.querySelector('.story-context');
    context.hidden=!s.completed&&(!nearest||tool!=='hand'||s.pushing||intro<4.6);
    this.root.querySelector('[data-interaction]').textContent=s.completed?'پایان مرحله':nearest==='cart'?'عقب کشیدن چرخ‌دستی':nearest==='receipt'?'برداشتن رسید':nearest==='reel'?'برداشتن کابل بلند':NAMES[nearest]||'تعامل';
    for(const [id,b] of Object.entries(this.nodes)){
      const point=scene.project(id,s),pin=['battery','mains','latch','lamp','radio'].includes(id);
      const shown=available(id,s)&&(tool==='hand'?id===(selected||nearest)||id===goal||(id==='reel'&&s.cart>=1):pin);
      b.hidden=!shown||!s.started||intro<4.6;
      if(b.hidden||!point)continue;
      // Off-screen goal remains an edge marker in portrait mode; tapping it walks there.
      const top=scene.height<480?70:132,bottom=scene.height<480?95:168;
      b.classList.toggle('offscreen',!point.visible||point.y<top||point.y>scene.height-bottom);
      b.dataset.edge=point.x<85?'left':point.x>scene.width-85?'right':'center';
      b.style.left=Math.max(24,Math.min(scene.width-24,point.x))+'px';
      b.style.top=Math.max(top,Math.min(scene.height-bottom,point.y))+'px';
      b.classList.toggle('selected',id===selected);b.classList.toggle('story-goal',id===goal);
    }
    if(!this.bubble.hidden){
      this.messageRemaining-=dt;if(this.messageRemaining<=0)this.bubble.hidden=true;
      const p=scene.project('battery',s);
      this.bubble.style.left=Math.max(145,Math.min(scene.width-145,p.x))+'px';
      this.bubble.style.top=Math.max(135,Math.min(scene.height-230,p.y-75))+'px';
    }
  }
}
