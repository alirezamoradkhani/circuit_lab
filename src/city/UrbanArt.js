const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const path=(d,color='#72818a',width=3)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
const types={gate:'access',shop:'retail',street:'lighting',clinic:'medical',station:'power',backup:'medical',pumps:'water',radio:'radio',feeder:'power',isolation:'workshop',transfer:'radio',bridge:'water'};
export function urbanBuilding(id,restored=false,c){
 const type=types[id]??'power',light=restored?'#edbe6b':'#394e5d',wall='#809099',edge='#526675';let art='';
 const live=c?.s&&!c.s.tripped?(c.s.shop?c.s.shop.brightness>0:c.s.current>0):restored;
 const glow=live?'#cda967':light;
 if(type==='lighting')art=[45,115,185].map(x=>path(`M${x} 164V50h26`,edge,5)+rect(x+15,48,24,7,light)+(restored?`<path d="M${x+15} 56l-25 110h76l-27-110" fill="#edbe6b" opacity=".12"/>`:'')).join('');
 else if(type==='radio')art=rect(18,114,95,50,wall)+rect(31,128,60,20,light)+path('M143 164l28-135 29 135M151 130h41M158 97h27M165 64h14',edge,4)+`<circle cx="171" cy="26" r="5" fill="${light}"/>`+path('M154 16q-12 12 0 24m34-24q12 12 0 24',restored?'#edbe6b':'#71858f',2);
 else if(type==='water')art=rect(127,30,70,124,'#4d6473','rx="4"')+rect(136,42,52,110,'#ced5d2')+rect(136,152-(c?.tank??(restored?4:1))*24,52,(c?.tank??(restored?4:1))*24,'#438c91')+path('M135 163v14m57-14v14M130 143H80v-32H40v39',edge,7)+[30,78].map(x=>rect(x,131,30,33,wall)+`<circle cx="${x+15}" cy="147" r="9" fill="${light}"/>`).join('');
 else if(type==='access')art=rect(25,72,37,96,wall)+rect(175,72,37,96,wall)+rect(18,63,201,11,edge)+[72,91,110,129,148,167].map(x=>rect(x,82,4,82,restored?'#9aabae':edge)).join('')+rect(96,40,51,18,light);
 else {
  const medical=type==='medical',retail=type==='retail';art=rect(25,68,182,101,wall)+rect(18,56,196,12,edge)+rect(35,39,80,17,'#566b77')+path('M144 54V30h38v24',edge,4)+rect(151,115,35,54,'#2c424f');
  for(let row=0;row<2;row++)for(let col=0;col<4;col++)art+=rect(39+col*25,82+row*37,17,24,glow);
  if(medical)art+=rect(159,77,22,7,'#bbc8c7')+rect(167,69,7,23,'#bbc8c7');
  if(retail)art+=rect(31,106,108,12,'#b0a487')+rect(31,71,159,8,glow);
  if(type==='power'||type==='workshop')art+=rect(81,114,57,53,'#425b67')+path('M113 122l-12 18h12l-9 16','#cbaa6b',3)+[151,168,185].map(x=>path(`M${x} 37V17m-6 4h12`,edge,3)).join('');
 }
 return `<svg viewBox="0 0 230 190" aria-hidden="true">${rect(8,169,215,5,'#283e4d')}${art}${path('M12 180H220','#516978',1)}</svg>`;
}
export function urbanBackdrop(id,restored,c){
 const building=urbanBuilding(id,restored,c).replace('<svg ','<svg x="170" y="-5" width="460" height="350" ');
 return `<svg class="site-art" viewBox="0 0 800 360" aria-hidden="true"><rect width="800" height="360" fill="#172e3d"/>${[0,100,235,410,575,730].map((x,i)=>rect(x,70+i%3*23,80,220,'#223c4b')).join('')}<path d="M0 295H800V360H0" fill="#304a57"/><path d="M0 334H800" stroke="#6d7f85" stroke-dasharray="28 20" stroke-width="2"/>${building}${rect(669,160,67,124,'#526b76')}${rect(680,174,44,60,'#b0b9b4')}${path('M706 180l-14 27h12l-7 18','#476373',3)}<circle cx="714" cy="258" r="5" fill="${restored?'#8bc7ae':'#d6ad68'}"/>${rect(52,244,74,42,'#667c83')}${path('M70 244v-9h35v9','#879a9b',4)}<text x="89" y="270" text-anchor="middle" fill="#e4e9e7" font-size="15">12 V</text><path d="M124 287H655V277" fill="none" stroke="${restored?'#c5a466':'#627880'}" stroke-width="3"/></svg>`;
}
