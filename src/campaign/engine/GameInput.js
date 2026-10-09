export function bindGameInput(game,{isUnlocked=()=>true}={}){
  const signal=game.abort.signal,root=game.root,canvas=game.scene.renderer.domElement,m=game.movement;
  const listen=(el,name,fn,options={})=>el.addEventListener(name,fn,{...options,signal});
  const unlocked=()=>game.active&&!game.hud.dialog.open&&isUnlocked();
  let down=null;
  listen(canvas,'pointerdown',e=>{if(unlocked()){game.audio.unlock();down={x:e.clientX,y:e.clientY};}});
  listen(canvas,'pointerup',e=>{
    if(!down||!unlocked())return;
    const d=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;
    if(d>12)return;
    const hit=game.scene.pick(e.clientX,e.clientY);
    if(hit.id)game.interactions.object(hit.id);
    else if(hit.point&&game.interactions.tool!=='meter')m.go(hit.point);
  });
  listen(canvas,'pointermove',e=>{
    if(!unlocked()||e.pointerType==='touch')return;
    const hit=game.scene.pick(e.clientX,e.clientY);
    canvas.classList.toggle('over-object',!!hit.id);
  });
  listen(root,'click',e=>{
    const object=e.target.closest('[data-story-object]');
    if(object&&unlocked()){game.audio.unlock();game.interactions.object(object.dataset.storyObject);}
  });
  listen(window,'keydown',e=>{
    if(!game.active||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
    if(game.hud.dialog.open)return;
    if(!isUnlocked())return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){
      e.preventDefault();m.keys.add(e.code);game.audio.unlock();return;
    }
    if(e.repeat)return;
    const commands={KeyE:'interact',KeyC:'cable',KeyM:'meter',KeyH:'hint',KeyR:'reset',Escape:'hand'};
    if(e.code==='Tab'&&(e.target===canvas||e.target===document.body)){e.preventDefault();game.action('bag');}
    else if(commands[e.code]){e.preventDefault();game.action(commands[e.code]);}
  });
  listen(window,'keyup',e=>m.keys.delete(e.code));
  listen(window,'blur',()=>{m.clear();game.save();game.focusPaused=true;game.audio.suspend();});
  listen(window,'focus',()=>{game.focusPaused=false;game.last=performance.now();});
  listen(document,'visibilitychange',()=>{
    m.clear();game.save();
    if(document.hidden)game.audio.suspend();
    game.last=performance.now();
  });
  listen(window,'pagehide',()=>game.save());
  const stick=root.querySelector('.story-joystick'),knob=stick.querySelector('i');
  let stickPointer=null;
  const move=e=>{
    if(e.pointerId!==stickPointer)return;
    const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(29,Math.hypot(dx,dy));
    m.joy={x:dx/len,y:dy/len};knob.style.transform='translate('+m.joy.x*25+'px,'+m.joy.y*25+'px)';
  };
  const stop=()=>{stickPointer=null;m.joy={x:0,y:0};knob.style.transform='';};
  listen(stick,'pointerdown',e=>{if(!unlocked())return;game.audio.unlock();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);move(e);});
  listen(stick,'pointermove',move);listen(stick,'pointerup',stop);listen(stick,'pointercancel',stop);listen(stick,'lostpointercapture',stop);
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();game.setActive(false);game.hud.message('نمای سه‌بعدی متوقف شد. صفحه را دوباره بارگذاری کن؛ پیشرفت ذخیره شده است.','error',999);});
}
