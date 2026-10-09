import {InfrastructureChallenge} from './InfrastructureChallenge.js';
export class BridgeChallenge extends InfrastructureChallenge {
 constructor(s){super(s);const [a,b,c,d,m]=[120,100,240,100,1000].map((v,i)=>this.add(['بالا چپ','پایین چپ','بالا راست','پایین راست','حسگر'][i],v));this.trim=d;this.sensor=m;this.wire(this.main.id+':1',a.id+':0');this.wire(this.main.id+':1',c.id+':0');this.wire(a.id+':1',b.id+':0');this.wire(c.id+':1',d.id+':0');this.wire(b.id+':1',this.source.id+':1');this.wire(d.id+':1',this.source.id+':1');this.wire(m.id+':0',a.id+':1');this.wire(m.id+':1',c.id+':1');}
 get controls(){return [{key:'trim',label:'مقاومت پایین راست',value:this.trim.value,options:[100,150,200,240,300].map(v=>[v,v+' Ω'])},{key:'main',label:'تغذیهٔ پل',value:+this.main.closed,options:[[0,'قطع'],[1,'وصل']]}];}
 act(key,value){if(!this.edit())return;const v=Number(value);if(key==='trim'&&[100,150,200,240,300].includes(v))this.trim.value=v;if(key==='main'&&[0,1].includes(v))this.main.closed=!!v;this.s.message='تنظیم تغییر کرد؛ اختلاف ولتاژ حسگر را اندازه بگیر.';}
 test(){return this.main.closed&&Math.abs(this.measured.volts[this.sensor.id]??99)<.02?this.accepted():this.reject('پل در حالت روشن باید اختلاف کمتر از ۰٫۰۲ ولت داشته باشد؛ نسبت دو بازو را مقایسه کن.');}
}
