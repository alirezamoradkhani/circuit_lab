const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export class Movement {
  constructor(game,navigation){this.game=game;this.navigation=navigation;this.keys=new Set();this.joy={x:0,y:0};this.path=[];this.moving=false;}
  clear(){this.keys.clear();this.joy={x:0,y:0};this.path=[];this.arrive=null;this.moving=false;}
  go(point,arrive){
    const s=this.game.state;
    if(distance(s.player,point)<.3){arrive?.();return;}
    this.path=this.navigation.findPath(s.player,point,s);this.arrive=arrive;this.stuck=0;
    if(!this.path.length){
      this.arrive=null;
      this.game.hud.message(this.navigation.blockedMessage?.(s)||'این مسیر در دسترس نیست. مانع‌ها و کابل را بررسی کن.','error');
    }
  }
  update(dt){
    const s=this.game.state;
    let x=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.joy.x;
    let y=(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)+this.joy.y;
    let dx=0,dz=0,amount=2.6*dt;
    if(Math.hypot(x,y)>.12){
      this.path=[];this.arrive=null;
      const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;
      dx=(.922*x+.388*y)*amount;dz=(-.388*x+.922*y)*amount;
    }else if(this.path.length){
      const next=this.path[0],d=distance(s.player,next);
      if(d<.075){this.path.shift();if(!this.path.length){const fn=this.arrive;this.arrive=null;fn?.();}return;}
      amount=Math.min(amount,d);dx=(next.x-s.player.x)/d*amount;dz=(next.z-s.player.z)/d*amount;
    }
    this.moving=this.navigation.movePlayer(s,dx,dz);
    if((dx||dz)&&!this.moving){
      this.stuck=(this.stuck||0)+dt;
      if(this.stuck>.4){this.path=[];this.arrive=null;this.game.hud.message('راه یا کابل جلوی حرکت را گرفته. کابل متصل را بررسی کن.','error',2);this.stuck=0;}
    }else this.stuck=0;
  }
}
