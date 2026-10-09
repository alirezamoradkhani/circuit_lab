import {icon} from './icons.js';
import {layoutHotspots} from './HotspotLayout.js';
const NS='http://www.w3.org/2000/svg';
export class CampaignLayout {
 constructor(hud){
  this.hud=hud;const stage=hud.stage;stage.classList.add('campaign-framed');
  this.viewport=document.createElement('div');this.viewport.className='campaign-viewport';stage.append(this.viewport);
  for(const selector of ['.story-world','.story-vignette','.story-hotspots','.story-joystick','.story-intro'])this.viewport.append(stage.querySelector(selector));
  this.leaders=document.createElementNS(NS,'svg');this.leaders.classList.add('campaign-leaders');this.leaders.setAttribute('aria-hidden','true');this.viewport.insertBefore(this.leaders,stage.querySelector('.story-hotspots'));
  this.playerTag=document.createElement('span');this.playerTag.className='campaign-player-tag';this.playerTag.textContent='رِی · شما';this.viewport.append(this.playerTag);
  this.lines=new Map();for(const id of Object.keys(hud.nodes)){const line=document.createElementNS(NS,'line');this.leaders.append(line);this.lines.set(id,line);}
  const console=document.createElement('footer');console.className='campaign-console';stage.append(console);
  const messages=document.createElement('div');messages.className='campaign-message-slot';console.append(messages);messages.append(hud.bubble);
  this.placeholder=document.createElement('p');this.placeholder.className='campaign-message-idle';this.placeholder.textContent='روی زمین حرکت کن؛ برای شناخت هر وسیله روی آن بزن.';messages.append(this.placeholder);
  stage.append(hud.panel);
  this.idle=document.createElement('div');this.idle.className='campaign-equipment-legend';this.idle.innerHTML=[['source','منبع ثابت','برق پیوسته'],['battery','باتری','انرژی همراه'],['charger','شارژر','پرکردن باتری']].map(([id,name,detail])=>'<span data-role="'+id+'">'+icon(id)+'<b>'+name+'</b><small>'+detail+'</small></span>').join('');console.append(this.idle);
  const tools=document.createElement('div');tools.className='campaign-tools-row';console.append(tools);
  for(const selector of ['.story-dock','.story-unplug','.story-tool-caption'])tools.append(stage.querySelector(selector));
  this.tools=tools;
  this.draft=document.createElementNS(NS,'path');this.draft.classList.add('campaign-cable-draft');this.leaders.append(this.draft);
  this.hoverLabel=document.createElement('span');this.hoverLabel.className='campaign-hover-label';this.hoverLabel.hidden=true;this.viewport.append(this.hoverLabel);
 }
 update(scene,selected,goal,interactions){
  const hud=this.hud;this.placeholder.hidden=!hud.bubble.hidden;this.idle.hidden=true;
  const caption=hud.root.querySelector('.story-tool-caption');caption.textContent=hud.stage.dataset.tool==='cable'?'کابل مستقل · کشیدن یا دو کلیک':hud.stage.dataset.tool==='meter'?'اندازه‌گیری':'انتخاب و انجام';
  const i=interactions,cable=i?.cable;
  const hover=i?.hovered&&scene.project(i.hovered),entity=hud.session.world.get(i?.hovered);
  this.hoverLabel.hidden=!hover?.visible||!entity;
  if(!this.hoverLabel.hidden){this.hoverLabel.textContent=entity.config.label;this.hoverLabel.style.left='12px';this.hoverLabel.style.top='12px';}
  for(const [id,node] of Object.entries(hud.nodes)){
   node.classList.toggle('cable-compatible',!!(cable?.start&&cable.assess(id).ok));
   node.classList.toggle('cable-origin',id===cable?.start);
  }
  const from=cable?.start&&scene.project(cable.start),to=i?.pointer;
  this.draft.style.display=from&&to?'':'none';
  if(from&&to){const assessment=cable.assess(i.hovered);this.draft.dataset.valid=assessment.ok?'true':'false';this.draft.setAttribute('d',`M ${from.x} ${from.y} Q ${(from.x+to.x)/2} ${Math.max(from.y,to.y)+45} ${to.x} ${to.y}`);}

  const candidates=Object.entries(hud.nodes).filter(([,b])=>!b.hidden).map(([id])=>{const p=scene.project(id),anchor={x:Math.max(26,Math.min(scene.width-26,p.x)),y:Math.max(26,Math.min(scene.height-26,p.y))};return {id,...p,anchor,x:p.x+(p.x>scene.width-80?-40:40),y:p.y-18,priority:id===selected?3:id===goal?2:0};});
  const stick=hud.root.querySelector('.story-joystick'),blocked=getComputedStyle(stick).display==='none'?[]:[{x:12,y:scene.height-98,w:94,h:88}];
  const player=scene.project('ray',1.5);this.playerTag.hidden=!player?.visible||!hud.stage.classList.contains('story-playing');if(player){this.playerTag.style.left=player.x+'px';this.playerTag.style.top=player.y+'px';if(!this.playerTag.hidden)blocked.push({x:player.x-34,y:player.y-26,w:68,h:26});}
  for(const e of hud.session.world.all())if(['Actor','Guard','Companion'].includes(e.kind)&&e.state.visible&&!e.state.collected){const head=scene.project(e.id,1.7),feet=scene.project(e.id,0);if(head.visible||feet.visible)blocked.push({x:Math.min(head.x,feet.x)-26,y:head.y-3,w:Math.abs(head.x-feet.x)+52,h:Math.max(30,feet.y-head.y+5)});}
  for(const e of hud.session.world.all())if((['Source','Charger','Battery'].includes(e.kind)||e.config.visual==='charger')&&e.state.visible&&!e.state.collected){
   const height=e.kind==='Source'?1.6:e.kind==='Battery'&&e.state.holder==='ray'?.5:1.05,top=scene.project(e.id,height),base=scene.project(e.id,0);
   if(top.visible||base.visible)blocked.push({x:Math.min(top.x,base.x)-22,y:top.y-3,w:Math.abs(top.x-base.x)+44,h:Math.max(22,base.y-top.y+6)});
  }
  const key=JSON.stringify([scene.width,scene.height,candidates.map(p=>[p.id,Math.round(p.x),Math.round(p.y),p.priority]),blocked]);
  if(key!==this.layoutKey){this.layoutKey=key;this.positions=layoutHotspots(candidates,scene.width,scene.height,blocked);}
  const positions=this.positions,ids=new Set(positions.map(p=>p.id));
  for(const [id,line]of this.lines){line.style.display='none';if(!ids.has(id))hud.nodes[id].hidden=true;}
  for(const p of positions){
   const node=hud.nodes[p.id];node.style.left=p.x+'px';node.style.top=p.y+'px';node.dataset.edge=p.x<85?'left':p.x>scene.width-85?'right':'center';
   const line=this.lines.get(p.id);if(p.visible&&Math.hypot(p.x-p.anchor.x,p.y-p.anchor.y)>14){line.style.display='';line.setAttribute('x1',p.anchor.x);line.setAttribute('y1',p.anchor.y);line.setAttribute('x2',p.x);line.setAttribute('y2',p.y);}
  }
 }
}
