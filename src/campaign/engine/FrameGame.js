// Browser lifecycle shared by scene-based games; gameplay belongs in step().
export class FrameGame {
 constructor(root){
  if(new.target===FrameGame)throw new TypeError('FrameGame requires step(dt)');
  this.root=root;this.abort=new AbortController();this.active=false;
  this.frame=this.frame.bind(this);
 }
 startFrames(){cancelAnimationFrame(this.raf);this.active=true;this.last=performance.now();this.raf=requestAnimationFrame(this.frame);}
 stopFrames(){this.active=false;cancelAnimationFrame(this.raf);}
 frame(now){
  if(!this.active)return;
  const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
  if(!document.hidden)this.step(dt);
  if(this.active)this.raf=requestAnimationFrame(this.frame);
 }
 step(){throw new Error('Game must implement step(dt)');}
 dispose(){this.stopFrames();this.abort.abort();}
}
