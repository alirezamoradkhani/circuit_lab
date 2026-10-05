import {assess} from './Assessment.js';
export class LessonSession {
 constructor(level){this.level=level;this.answers={};this.result=null;this.attempts=0;this.hinted=false;this.basic={connected:[false,false,false],switchClosed:false};}
 set(key,value){this.answers[key]=value;this.result=null;}
 submit(){
  this.attempts++;
  this.result=this.level.type==='basic'
   ? {ok:this.basic.connected.every(Boolean)&&this.basic.switchClosed,message:this.basic.connected.every(Boolean)&&this.basic.switchClosed?'مسیر کامل است؛ جریان در کل حلقه برقرار می‌شود.':'هنوز مدار باز است؛ اتصال‌های شماره‌دار و وضعیت کلید را بررسی کن.'}
   :assess(this.level,this.answers);
  return this.result;
 }
}
