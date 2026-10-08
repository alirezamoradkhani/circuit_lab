import {parallelBoard,fail,finish} from './common.js';
export class PumpChallenge {
  constructor(s){this.s=s;this.states=[0,0,1];this.tank=0;this.lastPeak=0;this.parts=parallelBoard(s,[6,6,3]);this.sync();}
  get power(){return this.states[0]*6+this.states[1]*6+this.states[2]*3;}
  get status(){return `مخزن ${this.tank} از ۴ · مصرف ${this.power} از ۲۴ وات`;}
  get step(){return 'موتورها را بدون اضافه‌بار راه بینداز؛ با «آزمایش» یک دور پمپاژ انجام بده.';}
  sync(){this.parts.forEach((p,i)=>p.disconnected=!this.states[i]);}
  act(key,value){
    const s=this.s,i=Number(key),v=Number(value);if(s.won||!Number.isInteger(i)||i<0||i>2||![0,1].includes(v)||v===this.states[i])return;
    if(i<2&&v){
      if(s.tripped){s.message='اول محافظ را بازنشانی کن؛ موتورها بعد از قطع برق خاموش می‌مانند.';return;}
      this.lastPeak=this.power+18;
      if(this.lastPeak>24){this.states[0]=this.states[1]=0;this.sync();s.tripped=true;fail(s,`جریان راه‌اندازی اضافه‌بار ساخت: ${this.lastPeak} وات در برابر ظرفیت ۲۴ وات. هر دو موتور از مدار خارج شدند؛ بار کمکی را کم کن و محافظ را بازنشانی کن.`);return;}
    }
    this.states[i]=v;this.sync();s.message=i<2&&v?`موتور راه افتاد؛ توان شروع ${this.lastPeak} وات بود و اکنون مصرف کل ${this.power} وات است.`:`مصرف فعلی ${this.power} وات است.`;
  }
  test(){
    const n=this.states[0]+this.states[1];if(!n)return fail(this.s,'هیچ پمپی کار نمی‌کند؛ اول موتور را راه بینداز.');
    this.tank=Math.min(4,this.tank+n);
    if(this.tank===4&&n===2&&this.states[2])return finish(this.s);
    this.s.message=this.tank<4?`یک دور پمپاژ انجام شد؛ مخزن ${this.tank} از ۴ پر است. برای دور بعد دوباره آزمایش بزن.`:'مخزن پر است؛ هر دو پمپ و روشنایی ایستگاه باید فعال بمانند.';return false;
  }
}
