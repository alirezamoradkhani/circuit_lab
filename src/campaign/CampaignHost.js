import {campaignCatalog,loadDefinition} from './levels/catalog.js';
const META='circuit-lab.story.progress.v1';
export class CampaignHost {
 constructor(root){
  this.root=root;this.active=false;this.game=null;this.generation=0;this.meta={active:1,completed:[]};
  try{this.storage=window.localStorage;const saved=JSON.parse(this.storage.getItem(META));if(saved&&campaignCatalog.some(e=>e.number===saved.active))this.meta={active:saved.active,replay:saved.replay===true,completed:Array.isArray(saved.completed)?saved.completed:[]};}catch{}
 }
 saveMeta(){try{this.storage?.setItem(META,JSON.stringify(this.meta));}catch{}}
 async open(number,{fresh=false,replay=false}={}){
  if(!campaignCatalog.some(e=>e.number===number))return;
  const token=++this.generation;this.game?.dispose();this.game=null;this.root.innerHTML='<div class="story-loading" role="status">در حال ورود به '+campaignCatalog[number-1].title+'…</div>';
  const options={fresh,replay,completed:()=>this.meta.completed,onStage:n=>this.open(n,{replay:this.meta.completed.includes(n)}),onNext:()=>this.open(Math.min(12,number+1)),onRestart:asReplay=>this.open(number,{fresh:true,replay:asReplay||replay}),onComplete:n=>{if(!this.meta.completed.includes(n))this.meta.completed.push(n);this.saveMeta();}};
  try{
   let game;
   if(number===1){const {WorkshopGame}=await import('./WorkshopGame.js');if(token!==this.generation)return;game=new WorkshopGame(this.root,options);}
   else{const [{CampaignGame},definition]=await Promise.all([import('./CampaignGame.js'),loadDefinition(number)]);if(token!==this.generation)return;game=new CampaignGame(this.root,definition,options);}
   this.game=game;this.meta.active=number;this.meta.replay=replay;this.saveMeta();game.setActive(this.active);
  }catch(error){console.error('Campaign could not open:',error);if(token!==this.generation)return;
   this.root.innerHTML='<div class="story-loading"><h2>مرحله باز نشد</h2><p>بارگذاری را دوباره امتحان کن. پیشرفت قبلی نگه داشته شده است.</p><button data-campaign-retry>تلاش دوباره</button><button data-campaign-home>بازگشت به تعمیرگاه</button></div>';
   this.root.querySelector('[data-campaign-retry]').onclick=()=>this.open(number);this.root.querySelector('[data-campaign-home]').onclick=()=>this.open(1);
  }
 }
 setActive(active){this.active=active;if(this.game)this.game.setActive(active);else if(active)this.open(this.meta.active,{replay:this.meta.replay===true});}
}
