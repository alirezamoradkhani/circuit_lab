const ink='#d7e7f6',muted='#a3bbd1';
const text=(x,y,value,color=ink,size=18)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}" direction="ltr" unicode-bidi="plaintext">${value}</text>`;
const wire=(...pts)=>`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#8bb8d7" stroke-width="4" stroke-linejoin="round"/>`;
const node=(x,y,label)=>`<circle cx="${x}" cy="${y}" r="6" fill="#ffe49c"/>${text(x,y-20,label,'#ffe49c',20)}`;
const hres=(x,y,label)=>`${wire([x-65,y],[x-43,y])}<rect x="${x-43}" y="${y-15}" width="86" height="30" rx="3" fill="#142c45" stroke="${ink}" stroke-width="3"/>${wire([x+43,y],[x+65,y])}${text(x,y-30,label)}`;
const vres=(x,y,label)=>`${wire([x,y-60],[x,y-35])}<rect x="${x-15}" y="${y-35}" width="30" height="70" rx="3" fill="#142c45" stroke="${ink}" stroke-width="3"/>${wire([x,y+35],[x,y+60])}${text(x+68,y+5,label)}`;
const source=(x,y,value)=>`<circle cx="${x}" cy="${y}" r="30" stroke="#ffd77f" stroke-width="3" fill="#142c45"/>${text(x,y-5,'+','#ffd77f',22)}${text(x,y+23,'−','#ffd77f',22)}${text(x-65,y+5,value,'#ffd77f')}`;
const arrow=(x1,y1,x2,y2,label='',color='#66dfcf')=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="3" marker-end="url(#arrow)" fill="none"/>${label?text((x1+x2)/2,(y1+y2)/2-12,label,color,17):''}`;
const ground=(x,y)=>`${wire([x,y],[x,y+12])}<path d="M${x-18} ${y+12}H${x+18} M${x-12} ${y+19}H${x+12} M${x-6} ${y+26}H${x+6}" stroke="${ink}" stroke-width="3"/>`;
const left=(v)=>`${wire([140,100],[140,200])}${source(140,230,v)}${wire([140,260],[140,360])}`;
const single=(r,v)=>`${left(v)}${wire([140,100],[385,100])}${hres(450,100,r)}${wire([515,100],[760,100],[760,360],[140,360])}`;
const divider=()=>`${left('12 V')}${wire([140,100],[235,100])}${hres(300,100,'R₁ = 4 Ω')}${wire([365,100],[555,100])}${node(450,100,'A')}${hres(620,100,'R₂ = 8 Ω')}${wire([685,100],[760,100],[760,360],[140,360])}${node(760,360,'B = 0 V')}${ground(760,360)}`;
export class Schematics {
 constructor(svg){this.svg=svg;}
 draw(level,answers={},basic){
   let s='';const kind=level.diagram;
   if(level.type==='basic')s=this.basic(basic);
   if(kind==='direction'){
     s=single('R = 6 Ω','12 V');
     if(answers.loop==='cw')s+=arrow(600,130,700,130,'I')+arrow(720,185,720,295)+arrow(620,325,430,325);
     if(answers.loop==='ccw')s+=arrow(700,130,600,130,'I')+arrow(720,295,720,185)+arrow(430,325,620,325);
     if(answers.electron)s+=arrow(answers.electron==='right'?320:570,42,answers.electron==='right'?570:320,42,'e⁻','#9bbaff');
     s+=text(450,410,answers.loop?'فلش‌ها پیش‌بینی تو هستند؛ برای ارزیابی، پاسخ را بررسی کن.':'جهت را از گزینه‌های زیر انتخاب کن تا فلش‌ها روی مدار ظاهر شوند.',muted,16);
   }
   if(kind==='divider')s=divider()+text(445,242,'Vab = Va − Vb','#ffe49c',24)+text(445,282,'Vba = Vb − Va',muted,22);
   if(kind==='ohm'||kind==='power')s=single(kind==='ohm'?'R = 8 Ω':'R = 6 Ω','12 V')+arrow(590,137,700,137,'I = ?');
   if(kind==='series')s=left('18 V')+wire([140,100],[235,100])+hres(300,100,'R₁ = 6 Ω')+wire([365,100],[555,100])+hres(620,100,'R₂ = 12 Ω')+wire([685,100],[760,100],[760,360],[140,360])+arrow(560,325,370,325,'I',muted);
   if(kind==='parallel'){
     s=left('12 V')+wire([140,100],[740,100])+wire([140,360],[740,360]);
     for(const [x,r,i] of [[440,6,1],[740,12,2]])s+=wire([x,100],[x,170])+vres(x,230,`R${i} = ${r} Ω`)+wire([x,290],[x,360])+node(x,100,'')+node(x,360,'')+arrow(x-40,170,x-40,290,`I${i}`);
   }
   if(kind==='mixed'||kind==='nodal'){
     const nodal=kind==='nodal';s=left(nodal?'37 V':'18 V')+wire([140,100],[215,100])+hres(280,100,'4 Ω')+wire([345,100],[440,100],[515,100])+node(440,100,'A')+wire([140,360],[740,360])+ground(740,360);
     s+=wire([440,100],[440,170])+vres(440,230,'6 Ω')+wire([440,290],[440,360]);
     s+=nodal?hres(580,100,'2 Ω'):wire([515,100],[645,100]);
     s+=wire([645,100],[740,100],[740,170])+vres(740,230,'3 Ω')+wire([740,290],[740,360]);
     if(nodal)s+=node(740,100,'B')+arrow(535,147,620,147,'Iab');else s+=arrow(400,174,400,287,'I₂')+arrow(700,174,700,287,'I₃');
   }
   if(kind==='kcl'){
     s=wire([140,220],[400,220],[670,220],[800,220])+wire([400,220],[400,355])+wire([670,85],[670,220]);
     s+=node(400,220,'A')+node(670,220,'B')+arrow(175,220,300,220,'9 A')+arrow(400,265,400,340,'2 A')+arrow(440,220,615,220,'x = ?')+arrow(670,105,670,185,'1 A')+arrow(705,220,800,220,'y = ?')+text(450,410,'نمای گره‌ها؛ جریان‌ها مطابق فلش‌های مرجع تعریف شده‌اند.',muted,16);
   }
   if(kind==='kvl')s=left('18 V')+wire([140,100],[385,100])+hres(450,100,'R₁ = 4 Ω')+wire([515,100],[760,100],[760,200])+source(760,230,'6 V')+wire([760,260],[760,360],[515,360])+hres(450,360,'R₂ = 2 Ω')+wire([385,360],[140,360])+arrow(585,138,680,138,'I ↻');
   if(kind==='mesh'){
     s=left('12 V')+wire([140,100],[225,100])+hres(290,100,'2 Ω')+wire([355,100],[545,100])+hres(610,100,'2 Ω')+wire([675,100],[760,100],[760,200])+source(760,230,'3 V')+wire([760,260],[760,360],[140,360])+wire([450,100],[450,170])+vres(450,230,'2 Ω')+wire([450,290],[450,360])+node(450,100,'')+node(450,360,'');
     for(const x of [290,610])s+=`<path d="M${x-25} 187 A55 55 0 1 1 ${x-52} 260" fill="none" stroke="#66dfcf" stroke-width="3" marker-end="url(#arrow)"/>`+text(x,243,x===290?'I₁ ↻':'I₂ ↻','#66dfcf');
     s+=arrow(410,174,410,292,'I↓');
   }
   this.svg.innerHTML=`<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#66dfcf"/></marker></defs>${s}`;
 }
 basic(state){
   let s=left('12 V')+wire([140,100],[260,100])+wire([340,100],[520,100])+wire([620,100],[760,100],[760,200])+wire([760,260],[760,360],[650,360])+wire([570,360],[370,360])+wire([290,360],[140,360]);
   for(const [i,x,y] of [[0,260,100],[1,570,360],[2,290,360]])s+=`<g data-gap="${i}" role="button" tabindex="0" aria-label="اتصال ${i+1}" style="cursor:pointer"><rect x="${x}" y="${y-22}" width="80" height="44" rx="8" fill="${state.connected[i]?'#24614e':'#6e3945'}"/>${state.connected[i]?wire([x,y],[x+80,y]):text(x+40,y+7,String(i+1),'#fff')}${text(x+40,y+50,'اتصال '+(i+1),muted,14)}</g>`;
   s+=`<g data-switch role="button" tabindex="0" aria-label="کلید" style="cursor:pointer"><rect x="520" y="63" width="100" height="74" rx="10" fill="#263e52"/>${wire([520,100],[540,100],[600,state.switchClosed?100:75])}${wire([600,100],[620,100])}${text(570,162,state.switchClosed?'کلید بسته':'کلید باز','#ffe49c',16)}</g>`;
   s+=`<circle cx="760" cy="230" r="30" fill="${state.connected.every(Boolean)&&state.switchClosed?'#ffe49c':'#183248'}" stroke="${ink}" stroke-width="3"/><path d="M740 210L780 250 M780 210L740 250" stroke="#7b8b9c" stroke-width="3"/>`;
   return s;
 }
}
