import {CircuitBuilder} from './builder/CircuitBuilder.js?v=city1';
import {levels,topics,topicForLevel} from './data/levels.js';
import {LessonSession} from './lessons/LessonSession.js';
import {Schematics} from './lessons/Schematics.js';
import {CityGame} from './city/CityGame.js?v=ui5';

const $=id=>document.getElementById(id);
const ui={svg:$('circuitSvg'),controls:$('levelControls'),feedback:$('feedbackText'),status:$('statusChip'),next:$('nextButton')};
const boardZoom=$('boardZoom'),zoomValue=$('zoomValue');
const diagrams=new Schematics(ui.svg);
const completed=new Set();
let mode='lab';
const city=new CityGame($('cityMode'));
let current=0,session,score=0,toastTimer;
const builder=new CircuitBuilder(ui.svg,ui.controls,()=>{
 if(!builder.active)return;
 setStatus(!!builder.result?.ok,builder.message,'میز طراحی');
 $('movesValue').textContent=builder.moves.toLocaleString('fa-IR');
 syncBoardZoom();
},()=>award());
function syncBoardZoom(){
 const active=builder.active;
 boardZoom.hidden=!active;
 if(active)zoomValue.textContent=`${Math.round((builder.zoom||1)*100).toLocaleString('fa-IR')}٪`;
}

function setStatus(ok,message,idle='در انتظار پاسخ'){
 ui.status.textContent=ok?'پاسخ تأیید شد':idle;
 ui.status.className='status-chip '+(ok?'on':'off');
 ui.feedback.textContent=message;
 document.querySelector('.feedback-icon').textContent=ok?'✅':'💡';
 ui.next.hidden=!ok;
 $('undoButton').disabled=!(builder.active&&builder.history?.length);
}
function award(){
 const level=levels[current];
 if(!completed.has(level.id)){completed.add(level.id);score+=Math.max(30,100-(session.hinted?20:0)-Math.max(0,session.attempts-1)*10);}
 $('scoreValue').textContent=score.toLocaleString('fa-IR');
 renderNavigation();
}
function renderNavigation(){
 const level=levels[current],topic=topicForLevel(level);
 $('topicTabs').innerHTML=topics.map(t=>`<button type="button" class="topic-tab ${t.id===topic.id?'selected':''}" data-topic="${t.id}" aria-pressed="${t.id===topic.id}"><span>${t.icon}</span><b>${t.title}</b></button>`).join('');
 $('levelList').innerHTML=`<p class="topic-description">${topic.description}</p>`+topic.levels.map(l=>`<button type="button" class="level-item ${l.id===level.id?'selected':''}" data-level="${l.id}" aria-current="${l.id===level.id?'step':'false'}"><span class="level-index">${l.number}</span><span><b>${l.title}</b><small>${l.subtopic}</small></span><span class="level-check">${completed.has(l.id)?'✓':''}</span></button>`).join('');
}
function renderAnswers(){
 const level=session.level;
 if(level.type==='basic'){ui.controls.innerHTML='<button class="primary-button" data-submit>بررسی مدار</button>';return;}
 ui.controls.innerHTML=`<form id="answerForm" novalidate><div class="answer-fields">${level.fields.map(f=>f.options?`<fieldset><legend>${f.label}</legend><div class="answer-options">${f.options.map(([id,label])=>`<button type="button" data-answer="${f.key}" data-value="${id}" aria-pressed="${session.answers[f.key]===id}" class="answer-option ${session.answers[f.key]===id?'selected':''}">${label}</button>`).join('')}</div></fieldset>`:`<label class="numeric-answer" for="answer-${f.key}"><span>${f.label} <b dir="ltr">(${f.unit})</b></span><input id="answer-${f.key}" data-field="${f.key}" inputmode="decimal" autocomplete="off" placeholder="پاسخ تو" aria-label="${f.label}" value="${session.answers[f.key]??''}"></label>`).join('')}</div><p class="answer-note">اعداد فارسی یا انگلیسی پذیرفته می‌شوند. پاسخ را با علامت بنویس؛ برای اعشار حداقل سه رقم دقت کافی است.</p><button type="submit" class="primary-button">بررسی پاسخ</button></form><details class="scratch"><summary>کاغذ محاسبات من</summary><textarea aria-label="محاسبات شخصی" placeholder="معادله‌ها و محاسباتت را اینجا بنویس…"></textarea></details>`;
}
function invalidate(){
 session.result=null;
 setStatus(false,'پاسخ هنوز بررسی نشده است. بعد از تکمیل همهٔ بخش‌ها، دکمهٔ بررسی را بزن.');
}
function loadLevel(index){
 if(!levels[index])return;
 builder.active=false;current=index;session=new LessonSession(levels[index]);
 $('undoButton').disabled=true;
 boardZoom.hidden=true;
 const level=session.level;
 $('levelTitle').textContent=level.title;$('levelDescription').textContent=level.description;$('levelEyebrow').textContent=level.subtopic;$('lessonNumber').textContent=level.number;
 $('progressLabel').textContent=`مرحله ${level.number} از ${levels.length.toLocaleString('fa-IR')}`;
 $('lessonContent').innerHTML=`<div class="lesson-heading">${level.lessonTitle}</div>`+level.points.map(([icon,t])=>`<div class="lesson-point"><span class="point-icon">${icon}</span><span>${t}</span></div>`).join('');
 $('formulaPanel').hidden=true;
 document.querySelector('.circuit-legend').hidden=true;
 ui.svg.setAttribute('role',level.type==='basic'||level.type==='builder'?'group':'img');
 ui.svg.setAttribute('aria-label',level.title+' — '+level.description);
 ui.svg.classList.toggle('builder-board',level.type==='builder');
 ui.svg.classList.toggle('lesson-diagram',level.type!=='builder');
 ui.next.hidden=true;ui.next.textContent=current<levels.length-1?'مرحلهٔ بعد ←':'پایان این مرحله ✓';
 $('movesValue').textContent='۰';
 renderNavigation();
 if(level.type==='builder'){builder.load(level.mission);return;}
 ui.svg.setAttribute('viewBox','0 0 900 440');
 renderAnswers();diagrams.draw(level,session.answers,session.basic);invalidate();
}
function submit(){
 const result=session.submit();
 setStatus(result.ok,result.message,'پاسخ نیاز به بازبینی دارد');
 $('movesValue').textContent=session.attempts.toLocaleString('fa-IR');
 if(result.ok)award();
}
$('topicTabs').addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(b)loadLevel(levels.findIndex(l=>l.topicId===b.dataset.topic));});
$('levelList').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(b)loadLevel(levels.findIndex(l=>l.id===b.dataset.level));});
ui.controls.addEventListener('submit',e=>{if(builder.active)return;e.preventDefault();submit();});
ui.controls.addEventListener('click',e=>{
 if(builder.active)return;
 if(e.target.closest('[data-submit]')){submit();return;}
 const b=e.target.closest('[data-answer]');if(!b)return;
 session.set(b.dataset.answer,b.dataset.value);invalidate();
 ui.controls.querySelectorAll(`[data-answer="${b.dataset.answer}"]`).forEach(btn=>{const chosen=btn.dataset.value===b.dataset.value;btn.classList.toggle('selected',chosen);btn.setAttribute('aria-pressed',chosen);});
 diagrams.draw(session.level,session.answers,session.basic);
});
ui.controls.addEventListener('input',e=>{if(builder.active||!e.target.dataset.field)return;session.set(e.target.dataset.field,e.target.value);invalidate();});
function interact(e){
 if(builder.active||session.level.type!=='basic')return;
 const gap=e.target.closest('[data-gap]'),sw=e.target.closest('[data-switch]');if(!gap&&!sw)return;
 if(gap){const i=Number(gap.dataset.gap);session.basic.connected[i]=!session.basic.connected[i];}else session.basic.switchClosed=!session.basic.switchClosed;
 invalidate();diagrams.draw(session.level,session.answers,session.basic);
}
ui.svg.addEventListener('click',interact);
ui.svg.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&(e.target.closest('[data-gap]')||e.target.closest('[data-switch]'))){e.preventDefault();interact(e);}});
$('resetButton').addEventListener('click',()=>loadLevel(current));
$('undoButton').addEventListener('click',()=>{if(builder.active)builder.action('undo');});
$('boardZoom').addEventListener('click',e=>{const button=e.target.closest('[data-board-tool]');if(button&&builder.active)builder.action(button.dataset.boardTool);});
$('hintButton').addEventListener('click',()=>{session.hinted=true;if(builder.active){builder.message=session.level.hint;builder.render();}else{ui.feedback.textContent=session.level.hint;}});
ui.next.addEventListener('click',()=>{if(current<levels.length-1)loadLevel(current+1);else{clearTimeout(toastTimer);$('toast').textContent='از منوی سمت چپ می‌توانی تمرین دیگری انتخاب کنی.';$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500);}});
document.addEventListener('keydown',e=>{if(mode!=='lab'||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;if(e.key.toLowerCase()==='r')loadLevel(current);if(e.key.toLowerCase()==='h')$('hintButton').click();});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
 mode=button.dataset.mode;
 document.body.classList.toggle('city-theme',mode==='city');
 document.querySelector('.brand strong').textContent=mode==='city'?'شهر روشن':'آزمایشگاه مدار';
 document.querySelector('.brand small').textContent=mode==='city'?'RESTORE THE LIGHT':'CIRCUIT LAB';
 document.querySelector('meta[name="theme-color"]').content=mode==='city'?'#edf7f3':'#101827';
 document.querySelector('.main-grid').hidden=mode!=='lab';
 $('cityMode').hidden=mode!=='city';
 builder.active=mode==='lab'&&session.level.type==='builder';
 city.setActive(mode==='city');
 boardZoom.hidden=!builder.active;
 $('progressLabel').hidden=mode==='city';
 document.querySelector('footer').hidden=mode==='city';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
}));
$('soundButton').hidden=true;
const total=document.querySelector('.level-panel .panel-title span:last-child');if(total)total.textContent=levels.length.toLocaleString('fa-IR')+' مرحله';
loadLevel(0);
