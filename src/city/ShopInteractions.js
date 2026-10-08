// Pointer events cover mouse, touch and pen. Click/keyboard uses the same actions.
export class ShopInteractions {
  constructor(root,getSession,onChange){
    this.root=root;this.getSession=getSession;this.onChange=onChange;
    root.addEventListener('click',e=>{if(this.ignoreClick&&e.detail){this.ignoreClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
    root.addEventListener('pointerdown',e=>this.begin(e));
    root.addEventListener('pointermove',e=>this.move(e));
    root.addEventListener('pointerup',e=>this.end(e));
    root.addEventListener('pointercancel',()=>this.cancel());
  }
  begin(e){
    this.ignoreClick=false;const el=e.target.closest('[data-shop-drag]');
    if(this.getSession()?.street&&this.getSession()?.tool==='meter')return;
    if(e.button!==0||!el||el.disabled||!(this.getSession()?.shop||this.getSession()?.street))return;
    this.drag={kind:el.dataset.shopDrag,id:e.pointerId,x:e.clientX,y:e.clientY,el,moved:false};
    el.setPointerCapture(e.pointerId);
  }
  move(e){
    const d=this.drag;if(!d||d.id!==e.pointerId)return;
    if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>7)d.moved=true;
    if(!d.moved)return;e.preventDefault();
    if(!this.ghost){this.ghost=document.createElement('div');this.ghost.className='shop-drag-ghost';this.ghost.textContent=d.kind.startsWith('street:')?'سیم':d.kind.startsWith('probe:')?(d.kind.endsWith('red')?'🔴':'⚫'):d.kind.startsWith('spare:')?d.kind.split(':')[1]+' Ω':'مقاومت';(d.el.closest('dialog')||document.body).append(this.ghost);}
    this.ghost.style.left=e.clientX+'px';this.ghost.style.top=e.clientY+'px';
    const drop=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-shop-drop]');
    this.root.querySelectorAll('.shop-drop-hover').forEach(el=>el.classList.remove('shop-drop-hover'));drop?.classList.add('shop-drop-hover');
  }
  end(e){
    const d=this.drag;if(!d||d.id!==e.pointerId)return;
    const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-shop-drop]')?.dataset.shopDrop;
    this.cancel();if(!d.moved)return;
    this.ignoreClick=true;const s=this.getSession();if(!s||s.won)return;
    if(s.street){if(d.kind.startsWith('street:')&&target?.startsWith('street:')){s.pending=null;s.pin(d.kind.slice(7));s.pin(target.slice(7));s.messageTarget='cabinet';this.onChange();}return;}
    if(!s.shop)return;
    if(d.kind.startsWith('probe:')&&target?.startsWith('point:'))s.shop.placeProbe(d.kind.split(':')[1],target.slice(6));
    else if(d.kind==='installed'&&target==='tray')s.shop.remove();
    else if(d.kind.startsWith('spare:')&&target==='socket')s.shop.install(Number(d.kind.split(':')[1]));
    else return;
    s.messageTarget=d.kind.startsWith('street:')?'سیم':d.kind.startsWith('probe:')?null:'cabinet';this.onChange();
  }
  cancel(){this.ghost?.remove();this.ghost=null;this.drag=null;this.root.querySelectorAll('.shop-drop-hover').forEach(el=>el.classList.remove('shop-drop-hover'));}
}
