import {parallelBoard,fail,finish} from './common.js';
export class BackupChallenge {
  constructor(s){this.s=s;this.phase=0;this.states=[1,0,0,1];this.parts=parallelBoard(s,[6,9,3,12]);this.sync();}
  get capacity(){return this.phase?12:24;}
  get powers(){return [this.states[0]*6,this.states[1]===2?9:this.states[1]===1?3:0,this.states[2]*3,this.states[3]*12];}
  get power(){return this.powers.reduce((a,b)=>a+b,0);}
  get status(){return `${this.phase?'باتری پشتیبان':'مولد'} · مصرف ${this.power} از ${this.capacity} وات`;}
  get step(){return this.phase?'برق اصلی قطع شد؛ چراغ، بی‌سیم و تهویه را با ۱۲ وات نگه دار.':'چراغ، تهویه و بی‌سیم را هم‌زمان راه بینداز.';}
  sync(){this.parts.forEach((p,i)=>{p.disconnected=!this.states[i];p.value=this.powers[i]?144/this.powers[i]:144/[6,9,3,12][i];});}
  act(key,value){
    if(this.s.won)return;
    const i=Number(key),v=Number(value);if(!Number.isInteger(i)||i<0||i>3||!Number.isInteger(v)||v<0||v>(i===1?2:1))return;
    this.states[i]=v;this.sync();this.s.message=`مصرف ${this.power} وات؛ ظرفیت ${this.capacity} وات. برای تأیید، آزمایش را بزن.`;
  }
  test(){
    if(this.power>this.capacity){this.s.tripped=true;return fail(this.s,'اضافه‌بار! محافظ قطع شد. مصرف را کم کن و محافظ را بازنشانی کن.');}
    if(!this.states.slice(0,3).every(Boolean))return fail(this.s,'چراغ، تهویه و بی‌سیم هر سه ضروری‌اند؛ خاموش‌کردن یکی از آن‌ها راه‌حل نیست.');
    if(!this.phase){this.phase=1;this.s.message='تأیید شد! اما برق اصلی قطع شد؛ حالا فقط باتری ۱۲ واتی مانده. دور تهویه و بارهای غیرضروری را تنظیم کن و دوباره آزمایش بزن.';return false;}
    return finish(this.s);
  }
}
