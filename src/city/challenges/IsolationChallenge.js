import {InfrastructureChallenge} from './InfrastructureChallenge.js';
export class IsolationChallenge extends InfrastructureChallenge {
 constructor(s){super(s);this.states=[1,1,1];[24,12,.5].forEach((r,i)=>this.parallel(this.add(['روشنایی','ابزار','کنترل'][i],r)));this.repaired=false;}
 get controls(){return [...this.parts.map((p,i)=>({key:String(i),label:p.label,value:this.states[i],options:[[0,'قطع شاخه'],[1,'وصل شاخه']]})),{key:'repair',label:'تعویض قطعه مطابق پلاک',value:this.repaired?2:null,options:[[0,'روشنایی'],[1,'ابزار'],[2,'کنترل']]}];}
 act(key,value){if(!this.edit())return;const v=Number(value);if(key==='repair'&&[0,1,2].includes(v)){if(this.states[v]){this.s.message='این شاخه هنوز وصل است؛ کلید همان شاخه را باز کن.';return;}this.parts[v].value=[24,12,24][v];if(v===2)this.repaired=true;this.s.message='قطعهٔ شاخهٔ '+this.parts[v].label+' مطابق پلاک نصب شد.';return;}if(['0','1','2'].includes(key)&&[0,1].includes(v)){this.states[+key]=v;this.parts[+key].disconnected=!v;this.s.message='وضعیت شاخه تغییر کرد؛ اثرش را اندازه بگیر.';}}
 test(){if(this.power>24.001){this.s.tripped=true;return this.reject('اضافه‌بار تابلو؛ شاخه‌ها را جداگانه بررسی کن.');}return this.repaired&&this.states.every(Boolean)?this.accepted():this.reject('هر سه خدمت باید برگردند؛ حذف شاخهٔ معیوب نتیجهٔ نهایی نیست.');}
}
