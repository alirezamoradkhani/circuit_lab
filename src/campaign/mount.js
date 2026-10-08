export function workshopLoader(root){
  let game=null,pending=null,wanted=false;
  return {
    setActive(active){
      wanted=active;
      if(game){game.setActive(active);return;}
      if(!active||pending)return;
      root.innerHTML='<div class="story-loading" role="status">در حال آماده‌کردن تعمیرگاه…</div>';
      pending=import('./WorkshopGame.js').then(({WorkshopGame})=>{
        game=new WorkshopGame(root);game.setActive(wanted);
      }).catch(error=>{
        console.error('Workshop could not start:',error);
        root.innerHTML='<div class="story-loading"><h2>نمای سه‌بعدی باز نشد</h2><p>یک مرورگر به‌روز با WebGL2 لازم است. اگر شتاب‌دهی گرافیکی خاموش است، آن را روشن کن.</p><button type="button" data-story-retry>تلاش دوباره</button></div>';
        root.querySelector('[data-story-retry]').onclick=()=>this.setActive(true);
      }).finally(()=>{pending=null;});
    },
  };
}
