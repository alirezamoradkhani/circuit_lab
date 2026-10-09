import {InfrastructureChallenge} from './InfrastructureChallenge.js';
export class FeederChallenge extends InfrastructureChallenge {
 constructor(s){super(s);this.line=this.add('کابل مسیر',3);this.lamp=this.add('روشنایی',24);this.load=this.add('بار خدمات',12);this.wire(this.main.id+':1',this.line.id+':0');this.parallel(this.lamp,this.line.id+':1');this.parallel(this.load,this.line.id+':1');}
 get voltage(){return this.measured.volts[this.load.id]??0;}
 get controls(){return [{key:'main',label:'کلید اصلی',value:+this.main.closed,options:[[0,'قطع'],[1,'وصل']]},{key:'cable',label:'کابل جایگزین · تغییر فقط در حالت قطع',value:this.line.value,options:[[3,'۳ Ω · فعلی'],[1,'۱ Ω · ۶ اعتبار'],[.5,'۰٫۵ Ω · ۱۲ اعتبار']]}];}
 act(key,value){if(!this.edit())return;const v=Number(value);if(key==='main'&&[0,1].includes(v))this.main.closed=!!v;if(key==='cable'&&[.5,1,3].includes(v)&&v!==this.line.value){if(this.main.closed){this.s.message='کلید اصلی را قبل از تعویض کابل قطع کن.';return;}if(!this.s.spend(v===.5?12:v===1?6:0))return;this.line.value=v;}this.s.message=`ولتاژ انتهای خط: ${this.voltage.toFixed(2)} ولت. هر دو بار در مدار هستند.`;}
 test(){return this.main.closed&&this.voltage>=10.8?this.accepted():this.reject('ولتاژ انتهای مسیر زیر ۱۰٫۸ ولت است؛ اندازه‌گیری را در حضور هر دو بار انجام بده.');}
}
