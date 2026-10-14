import {adventures} from '../../city/adventureData.js';
import {AdventureSession} from '../../city/AdventureSession.js';
import {CityDrafts} from '../../city/CityDrafts.js';
import {CityProgress} from '../../city/Progress.js';
const KEY='circuit-lab.ray-city.route.v1';
export class CityRayHost {
 constructor(root){this.root=root;this.game=null;this.active=false;this.sessions=new Map();this.index=0;this.generation=0;try{this.storage=window.localStorage;const index=Number(this.storage.getItem(KEY));if(Number.isInteger(index)&&index>=0&&index<adventures.length)this.index=index;}catch{}
  this.drafts=new CityDrafts(this.storage,'circuit-lab.ray-city.repairs.v1');this.progress=new CityProgress(this.storage,'circuit-lab.ray-city.completed.v1',adventures,{openAccess:true});
 }
 menu(){return '<h2>مأموریت‌های شهر روشن</h2><p>در هر محل، با رِی کنار دستگاه‌ها برو و مدار همان دستگاه را تعمیر کن.</p><div class="campaign-stage-list">'+adventures.map((m,i)=>'<button data-story-action="mission:'+i+'" '+(i===this.index?'aria-current="step"':'')+'><span>'+(i+1).toLocaleString('fa-IR')+'</span><b>'+m.title+'</b><small>'+m.skill+'</small></button>').join('')+'</div>';}
 async open(index,{fresh=false}={}){
  if(!adventures[index])return;const token=++this.generation;this.game?.dispose();this.game=null;this.index=index;this.root.innerHTML='<div class="story-loading">ورود به '+adventures[index].title+'…</div>';const {CityRayGame}=await import('./CityRayGame.js');if(token!==this.generation)return;
  if(fresh||!this.sessions.has(index))this.sessions.set(index,this.drafts.attach(new AdventureSession(index),{fresh}));
  const session=this.sessions.get(index);this.game=new CityRayGame(this.root,session,{menu:()=>this.menu(),onMission:i=>this.open(i),onRestart:()=>this.open(index,{fresh:true}),onNext:()=>this.open(Math.min(adventures.length-1,index+1)),onComplete:s=>this.progress.complete(s.mission.id,3-s.stars)});
  try{this.storage?.setItem(KEY,String(index));}catch{}this.game.setActive(this.active);
 }
 setActive(active){this.active=active;if(this.game)this.game.setActive(active);else if(active)this.open(this.index);}
}
