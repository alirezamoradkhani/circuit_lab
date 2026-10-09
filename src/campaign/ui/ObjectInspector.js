import {escapeHTML,equipmentStatus} from './EquipmentStatus.js';
const button=(action,label)=>'<button data-story-action="'+escapeHTML(action)+'">'+escapeHTML(label)+'</button>';
export class ObjectInspector {
 constructor(hud){this.hud=hud;}
 update(state,tool,selected,interactions){
  const {hud}=this,s=hud.session,w=s.world,e=w.get(selected),panel=hud.panel;
  panel.hidden=!state.started||state.completed;
  if(panel.hidden)return;
  let title='صحنه را بررسی کن',status='روی یک شیء کلیک کن؛ کارهای ممکن همین‌جا نمایش داده می‌شوند.',html='';
  if(tool==='cable'){
   const draft=interactions?.cable,start=w.get(draft?.start);
   title='ابزار کابل';status=start?'سر اول: '+start.config.label+'؛ یک سوکت با نوع دیگر انتخاب کن.':'از یک سوکت به سوکت دیگر بکش؛ یا دو سر را به‌ترتیب کلیک کن.';
   if(start)html+=button('cancel-cable','لغو کابل · Esc');
   if(e)html+='<p class="inspector-selection">'+escapeHTML(e.config.label)+'</p>';
   const wires=[...w.connections].filter(([id,c])=>!e||id===e.id||c.source===e.id);
   if(wires.length)html+='<small>اتصال‌های '+(e?'این وسیله':'صحنه')+'</small>'+wires.map(([id,c])=>'<div class="inspector-wire"><span>'+escapeHTML(w.get(c.source)?.config.label)+' ← '+escapeHTML(w.get(id)?.config.label)+'</span>'+button('unplug:'+id,'جداکردن')+'</div>').join('');
   else html+='<p>کابلی متصل نیست.</p>';
  }else if(tool==='meter'){
   title='ولت‌متر';status=e?equipmentStatus(e,w):'روی وسیله بزن تا ولتاژ، مصرف یا انرژی آن را بخوانی.';
   if(e)html='<p>'+escapeHTML(e.config.label)+'</p>';
  }else if(e&&!e.state.collected){
   title=e.config.label??e.id;
   status=[equipmentStatus(e,w),s.definition.status?.(w,e.id,s.ctx)].filter(Boolean).join(' · ');
   if(interactions?.pending?.id===e.id&&interactions.game.movement.arrive)status='در حال نزدیک‌شدن برای «'+interactions.pending.label+'»…';
   const observation=s.definition.inspect?.(w,e.id,s.ctx)??e.config.description;
   html=(observation?'<p class="inspector-observation">'+escapeHTML(observation)+'</p>':'')+s.commands(e.id).filter(c=>!/(disconnect|unplug)/.test(c.id)).map(c=>button('op:'+c.id,c.label)).join('');
   if(interactions?.cable.endpoint(e.id))html+=button('wire-object','کابل‌کشی…');
   if(!html)html='<p>این شیء فعلاً عمل مستقیمی ندارد؛ حرکت و واکنش آن را تماشا کن.</p>';
  }else html='<p>کلیک روی زمین: حرکت</p><p>انتخاب شیء: بررسی</p><p>انتخاب کار: نزدیک‌شدن و انجام</p><p>C کابل · M ولت‌متر · Esc لغو</p>';
  panel.querySelector('b').textContent=title;panel.querySelector('header p').textContent=status;
  if(this.html!==html){this.html=html;panel.querySelector(':scope>div').innerHTML=html;}
 }
}
