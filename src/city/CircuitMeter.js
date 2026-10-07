// DC nodal analysis for the small resistive scenes, including open switches.
export function measureCircuit(board){
  const parents=new Map(board.parts.flatMap(p=>[0,1].map(t=>[`${p.id}:${t}`,`${p.id}:${t}`])));
  const root=x=>parents.get(x)===x?x:root(parents.get(x));
  const join=(a,b)=>parents.set(root(a),root(b));
  board.wires.forEach(([a,b])=>join(a,b));
  board.parts.filter(p=>p.type==='switch'&&p.closed).forEach(p=>join(p.id+':0',p.id+':1'));
  const battery=board.parts.find(p=>p.type==='battery'),plus=root(battery.id+':0'),minus=root(battery.id+':1');
  if(plus===minus)return {short:true,current:null,volts:{}};
  const loads=board.parts.filter(p=>['lamp','resistor'].includes(p.type)&&!p.disconnected);
  const edges=loads.map(p=>({id:p.id,a:root(p.id+':0'),b:root(p.id+':1'),g:1/p.value}));
  const reachable=new Set([plus,minus]);
  for(let pass=0;pass<parents.size;pass++)for(const e of edges){if(reachable.has(e.a))reachable.add(e.b);if(reachable.has(e.b))reachable.add(e.a);}
  const unknown=[...reachable].filter(n=>n!==plus&&n!==minus),known=new Map([[plus,battery.value],[minus,0]]);
  const matrix=unknown.map(n=>{
    const row=Array(unknown.length+1).fill(0),i=unknown.indexOf(n);
    for(const e of edges){if(e.a===e.b||!(e.a===n||e.b===n))continue;const other=e.a===n?e.b:e.a;row[i]+=e.g;const j=unknown.indexOf(other);if(j>=0)row[j]-=e.g;else row[unknown.length]+=e.g*(known.get(other)||0);}
    return row;
  });
  for(let i=0;i<unknown.length;i++){
    const pivot=matrix[i][i];for(let k=i;k<=unknown.length;k++)matrix[i][k]/=pivot;
    for(let j=0;j<unknown.length;j++)if(j!==i){const scale=matrix[j][i];for(let k=i;k<=unknown.length;k++)matrix[j][k]-=scale*matrix[i][k];}
  }
  unknown.forEach((n,i)=>known.set(n,matrix[i][unknown.length]));
  const volts=Object.fromEntries(edges.map(e=>[e.id,known.has(e.a)&&known.has(e.b)?Math.abs(known.get(e.a)-known.get(e.b)):null]));
  const current=edges.reduce((sum,e)=>sum+(e.a===plus?(battery.value-known.get(e.b))*e.g:e.b===plus?(battery.value-known.get(e.a))*e.g:0),0);
  const terminals=Object.fromEntries([...parents.keys()].map(id=>[id,known.get(root(id))??null]));
  return {short:false,current,volts,terminals};
}
