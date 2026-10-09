import {icon} from './icons.js';
export class SceneHUD {
  constructor(root,onAction,config){
    this.config=config;
    this.root=root;this.onAction=onAction;
    const button=(action,name,label)=>'<button type="button" data-story-action="'+action+'" title="'+label+'" aria-label="'+label+'">'+icon(name)+'</button>';
    root.innerHTML='<div class="story-stage"><div class="story-world"></div><div class="story-vignette"></div>'+
      '<header class="story-hud"><div class="story-heading"><span class="story-kicker"></span><h1></h1><p data-objective></p></div>'+
      '<div class="story-instruments"><button class="story-battery" data-story-action="battery" title="باتری رِی؛ اتصال یا جداکردن کابل">'+icon('battery')+'<span><b data-energy>۷۲</b><small>ژول / ۷۲</small></span><i><em data-energy-bar></em></i></button>'+
      '<div class="story-small-tools">'+button('help','hint','دفتر راهنما')+button('view','view','نمای کامل اتاق')+button('sound','sound','قطع و وصل صدا')+button('reset','reset','شروع دوباره')+'</div></div></header>'+
      '<div class="story-hotspots" aria-label="وسایل صحنه"></div><div class="story-bubble" role="status" aria-live="polite" hidden></div>'+
      '<div class="story-context"><button type="button" data-story-action="interact">'+icon('hand')+'<span data-interaction>تعامل</span><kbd>E</kbd></button></div>'+
      '<nav class="story-dock" aria-label="ابزارهای رِی">'+[['hand','hand','تعامل'],['cable','cable','کابل'],['meter','meter','ولت‌متر'],['bag','bag','کیف'],['circuit','eye','مدار']].map(([action,name,label])=>'<button type="button" data-story-action="'+action+'" aria-label="'+label+'" aria-pressed="false">'+icon(name)+'<span>'+label+'</span></button>').join('')+'</nav>'+
      '<button type="button" class="story-unplug" data-story-action="disconnect" hidden>جدا کردن کابل</button><p class="story-tool-caption" data-tool-caption></p><button class="story-joystick" aria-label="دستهٔ حرکت لمسی"><i></i></button>'+
      '<div class="story-intro"><span class="story-kicker"></span><h2></h2><p></p><button type="button" data-story-action="begin">بیدار شو '+icon('arrow')+'</button></div>'+
      '<button class="story-skip" data-story-action="skip" hidden>ردکردن مقدمه</button>'+
      '<dialog class="story-dialog"><button class="story-dialog-close" aria-label="بستن" data-story-action="close">'+icon('close')+'</button><div data-dialog-content></div></dialog></div>';
    const labels=config.labels;
    root.querySelector('.story-heading .story-kicker').textContent=labels.chapter;
    root.querySelector('.story-heading h1').textContent=labels.title;
    root.querySelector('.story-intro .story-kicker').textContent=labels.introChapter;
    root.querySelector('.story-intro h2').textContent=labels.introTitle;
    root.querySelector('.story-intro p').textContent=labels.introText;
    this.stage=root.querySelector('.story-stage');this.world=root.querySelector('.story-world');
    this.dialog=root.querySelector('dialog');this.bubble=root.querySelector('.story-bubble');
    this.nodes={};
    for(const [id,label] of Object.entries(this.config.names)){
      const b=document.createElement('button');b.type='button';b.dataset.storyObject=id;b.setAttribute('aria-label',label);
      b.innerHTML=icon(id==='battery'?'battery':id==='cart'?'cart':id==='receipt'?'receipt':id==='reel'?'cable':id==='exit'?'arrow':id==='key'?'key':'socket')+'<span>'+label+'</span>';
      root.querySelector('.story-hotspots').append(b);this.nodes[id]=b;
    }
    this.onRootClick=e=>{const b=e.target.closest('[data-story-action]');if(b)onAction(b.dataset.storyAction);};root.addEventListener('click',this.onRootClick);
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
    this.root.querySelector('[data-dialog-content]').innerHTML=this.config.dialogContent(kind,s,saved);
    if(!this.dialog.open)this.dialog.showModal();
    this.dialog.querySelector('button').focus({preventScroll:true});
  }
  dispose(){this.root.removeEventListener('click',this.onRootClick);if(this.dialog.open)this.dialog.close();}
  closeDialog(){this.dialog.close();this.kind=null;this.previousFocus?.focus?.({preventScroll:true});}
  update(s,scene,tool,selected,nearest,intro,dt){
    this.root.querySelector('.story-intro').hidden=s.started;
    this.root.querySelector('.story-skip').hidden=!s.started||intro>=4.6;
    this.stage.classList.toggle('story-playing',s.started&&intro>=4.6);
    this.root.querySelector('[data-energy]').textContent=Math.ceil(s.energy).toLocaleString('fa-IR');
    this.root.querySelector('[data-energy-bar]').style.width=(s.energy/72*100)+'%';
    this.root.querySelector('.story-battery').classList.toggle('charging',s.charging);
    this.root.querySelector('.story-battery').classList.toggle('low',s.energy<12);
    const goal=this.config.goal(s);
    const text=this.config.objective(s);
    this.root.querySelector('[data-objective]').textContent=text;
    const unplug=this.root.querySelector('.story-unplug');
    unplug.hidden=tool!=='cable'||!selected||!this.config.canUnplug(s,selected);
    const context=this.root.querySelector('.story-context');
    context.hidden=!s.completed&&(!nearest||tool!=='hand'||s.pushing||intro<4.6);
    this.root.querySelector('[data-interaction]').textContent=this.config.interactionLabel(s,nearest);
    for(const [id,b] of Object.entries(this.nodes)){
      const point=scene.project(id,s),pin=this.config.pins.includes(id);
      const shown=this.config.available(id,s)&&this.config.visible(id,s,{tool,selected,nearest,goal,pin});
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
