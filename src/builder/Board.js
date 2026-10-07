export const missions = [
  {id:'build-loop', title:'از میز خالی تا مدار روشن', description:'یک باتری، یک کلید و یک لامپ بچین. یک حلقهٔ بسته بساز و آن را آزمایش کن.', topology:'series', parts:{battery:1,switch:1,lamp:1}, hint:'مثبت باتری ← کلید ← لامپ ← منفی باتری. کلید را از بخش قطعهٔ انتخاب‌شده ببند.'},
  {id:'build-current', title:'طراحی برای جریان هدف', description:'با باتری ۱۲ ولت، کلید و دو مقاومت سری، جریان ۰٫۵ آمپر بساز. مقدار هر مقاومت را خودت انتخاب کن.', topology:'series', parts:{battery:1,switch:1,resistor:2}, target:0.5, hint:'مقاومت کل باید ۲۴ اهم شود. دو مقاومت ۱۲ اهم در یک مسیر سری قرار بده.'},
  {id:'build-lamps', title:'دو مصرف‌کننده در یک مسیر', description:'یک باتری، کلید و دو لامپ را سری سیم‌کشی کن. جریان باید از هر دو لامپ بگذرد.', topology:'series', parts:{battery:1,switch:1,lamp:2}, hint:'همهٔ قطعات را پشت سر هم در یک حلقه قرار بده؛ انشعاب اضافه نکن.'},
  {id:'build-parallel', title:'دو شاخه با یک کلید اصلی', description:'دو لامپ موازی بساز. کلید اصلی باید برق هر دو شاخه را قطع کند؛ صرفاً کنار هم گذاشتن لامپ‌ها کافی نیست.', topology:'parallel', parts:{battery:1,switch:1,lamp:2}, hint:'باتری را از طریق کلید به یک سر هر دو لامپ وصل کن. سر دیگر هر دو لامپ به قطب دیگر باتری وصل شود. پایانه‌ها می‌توانند چند سیم داشته باشند.'}
];
export const names={battery:'باتری',switch:'کلید',lamp:'لامپ',resistor:'مقاومت'};
export class Board {
  constructor(){this.parts=[];this.wires=[];this.serial=0;}
  add(type,x=200,y=180){const p={id:`p${++this.serial}`,type,x,y,rotation:0,value:type==='battery'?12:12,closed:false};this.parts.push(p);return p;}
  remove(id){this.parts=this.parts.filter(p=>p.id!==id);this.wires=this.wires.filter(w=>!w.some(t=>t.startsWith(id+':')));}
  connect(a,b){if(a===b||a.split(':')[0]===b.split(':')[0])return false;if(this.wires.some(w=>w.includes(a)&&w.includes(b)))return false;this.wires.push([a,b]);return true;}
  snapshot(){return JSON.stringify({parts:this.parts,wires:this.wires,serial:this.serial});}
  restore(s){Object.assign(this,JSON.parse(s));}
}
// Wires join ideal electrical nodes. Screen position never determines connectivity.
export function evaluate(board,mission){
  const fail=message=>({ok:false,message});
  for(const type of Object.keys(names))if(board.parts.filter(p=>p.type===type).length!==(mission.parts[type]||0))return fail('قطعات لازم را دقیقاً طبق فهرست مأموریت روی میز قرار بده.');
  const nodes=new Map();
  board.parts.forEach(p=>[0,1].forEach(t=>nodes.set(`${p.id}:${t}`,`${p.id}:${t}`)));
  const root=x=>{while(nodes.get(x)!==x)x=nodes.get(x);return x;};
  const join=(a,b)=>nodes.set(root(a),root(b));
  for(const [a,b] of board.wires){if(!nodes.has(a)||!nodes.has(b))return fail('یک سیم به پایانهٔ نامعتبر وصل است.');join(a,b);}
  const battery=board.parts.find(p=>p.type==='battery'),sw=board.parts.find(p=>p.type==='switch');
  const pair=p=>[root(p.id+':0'),root(p.id+':1')];
  if(pair(battery)[0]===pair(battery)[1])return fail('اتصال کوتاه: دو قطب باتری مستقیماً با سیم به هم وصل شده‌اند.');
  if(pair(sw)[0]===pair(sw)[1])return fail('کلید دور زده شده است؛ مسیر سیم کنار کلید را حذف کن.');
  const loads=board.parts.filter(p=>p.type==='lamp'||p.type==='resistor');
  if(loads.some(p=>pair(p)[0]===pair(p)[1]))return fail('یکی از مصرف‌کننده‌ها با سیم دور زده شده است.');
  // With the switch open there must be no load path between battery terminals.
  const adjacency=new Map();
  for(const p of loads){const [a,b]=pair(p);for(const [x,y] of [[a,b],[b,a]]){if(!adjacency.has(x))adjacency.set(x,[]);adjacency.get(x).push(y);}}
  const seen=new Set(),stack=[pair(battery)[0]];while(stack.length){const n=stack.pop();if(seen.has(n))continue;seen.add(n);stack.push(...(adjacency.get(n)||[]));}
  if(seen.has(pair(battery)[1]))return fail('کلید مسیر اصلی را کنترل نمی‌کند؛ با باز بودن آن هنوز مسیر مصرف‌کننده برقرار است.');
  if(!sw.closed)return fail('کلید باز است؛ آن را انتخاب کن و «بستن کلید» را بزن.');
  join(sw.id+':0',sw.id+':1');
  const [plus,minus]=pair(battery);
  if(plus===minus)return fail('اتصال کوتاه پس از بستن کلید؛ مصرف‌کننده باید در مسیر باتری باشد.');
  let resistance;
  if(mission.topology==='parallel'){
    if(!loads.every(p=>{const [a,b]=pair(p);return (a===plus&&b===minus)||(a===minus&&b===plus);}))return fail('موازی نیست: هر لامپ باید بین همان دو گرهٔ مشترک متصل شود.');
    resistance=1/loads.reduce((sum,p)=>sum+1/p.value,0);
  }else{
    const graph=new Map();
    for(const p of [battery,...loads]){const [a,b]=pair(p);for(const [x,y] of [[a,b],[b,a]]){if(!graph.has(x))graph.set(x,[]);graph.get(x).push(y);}}
    if([...graph.values()].some(edges=>edges.length!==2))return fail('مسیر سری کامل نیست: هر گره باید فقط دو اتصال قطعه داشته باشد. سیم‌های باز یا انشعاب‌ها را بررسی کن.');
    const visited=new Set(),todo=[plus];while(todo.length){const n=todo.pop();if(visited.has(n))continue;visited.add(n);todo.push(...graph.get(n));}
    if(visited.size!==graph.size)return fail('یک حلقهٔ جدا از باتری ساخته‌ای؛ همهٔ مصرف‌کننده‌ها باید در همان حلقه باشند.');
    resistance=loads.reduce((sum,p)=>sum+p.value,0);
  }
  const current=battery.value/resistance;
  if(mission.voltage!==undefined&&battery.value!==mission.voltage)return fail(`منبع این مأموریت باید ${mission.voltage} ولت باشد؛ مقدار باتری را برگردان.`);
  if(mission.maxCurrent!==undefined&&current>mission.maxCurrent+0.001)return fail(`اضافه‌بار: جریان ${current.toFixed(2)} آمپر از حد ${mission.maxCurrent} آمپر بیشتر است. مقاومت بارها را بیشتر کن.`);
  if(mission.minBranchCurrent!==undefined&&loads.some(p=>battery.value/p.value<mission.minBranchCurrent-0.001))return fail('جریان یکی از مصرف‌کننده‌ها کمتر از حد لازم است؛ مقاومت آن شاخه را کاهش بده.');
  if(mission.target&&Math.abs(current-mission.target)>0.001)return fail(`اتصال سری درست است، ولی جریان ${current.toFixed(2)} آمپر است. مقاومت کل را برای ${mission.target.toLocaleString('fa-IR')} آمپر تنظیم کن.`);
  return {ok:true,current,resistance,message:`مدار درست است! مقاومت معادل ${resistance.toFixed(1)} اهم و جریان منبع ${current.toFixed(2)} آمپر است.`};
}


