import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {adventures} from '../src/city/adventureData.js';
import {schematicLayout,challengeSchematic} from '../src/city/challenges/CircuitSchematic.js';

const between=(v,a,b)=>v>=Math.min(a,b)&&v<=Math.max(a,b);
const on=([x,y],[[a,b],[c,d]])=>a===c?x===a&&between(y,b,d):y===b&&between(x,a,c);
function intersection(a,b){
 const [p,q]=a,[r,s]=b;
 if(p[0]===q[0] && r[1]===s[1]){const pt=[p[0],r[1]];return on(pt,a)&&on(pt,b)?pt:null;}
 if(p[1]===q[1] && r[0]===s[0])return intersection(b,a);
 return [p,q,r,s].find(pt=>on(pt,a)&&on(pt,b))||null;
}
function graphNets(board){
 const parents=new Map();
 const root=t=>parents.has(t)?root(parents.get(t)):t;
 for(const [a,b] of board.wires)if(root(a)!==root(b))parents.set(root(a),root(b));
 const groups=new Map();
 for(const p of board.parts)for(let i=0;i<2;i++){
  const t=`${p.id}:${i}`,r=root(t);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(t);
 }
 return [...groups.values()];
}
const normalized=groups=>groups.map(group=>[...group].sort().join(',')).sort();
for(const id of ['backup','pumps','radio','feeder','isolation','transfer','bridge']){
 const s=new AdventureSession(adventures.findIndex(m=>m.id===id)),before=JSON.stringify(s.board);
 const layout=schematicLayout(s),ports=new Map(layout.nodes.flatMap(n=>n.ports.map((p,i)=>[`${n.part.id}:${i}`,p])));
 assert.deepEqual(normalized(layout.nets.map(n=>n.terminals)),normalized(graphNets(s.board)),`${id}: visible nodes match actual electrical nodes`);
 const nets=layout.nets.map(net=>({...net,segments:net.paths.flatMap(path=>path.slice(1).map((point,i)=>[path[i],point]))}));
 for(const net of nets){
  for(const segment of net.segments){
   const [[x,y],[xx,yy]]=segment;
   assert.ok(x===xx||y===yy,`${id}: orthogonal wire`);
   for(const [px,py] of segment)assert.ok(px>=0&&px<=layout.width&&py>=0&&py<=layout.height,`${id}: wire inside view`);
   for(const n of layout.nodes){
    const left=n.x-n.width/2,right=n.x+n.width/2,top=n.y-28,bottom=n.y+28;
    const through=x===xx?x>left&&x<right&&Math.max(y,yy)>top&&Math.min(y,yy)<bottom:y>top&&y<bottom&&Math.max(x,xx)>left&&Math.min(x,xx)<right;
    assert.ok(!through,`${id}: wire must not cross ${n.part.id}'s label or body`);
   }
  }
  for(const terminal of net.terminals)assert.ok(net.segments.some(line=>on(ports.get(terminal),line)),`${id}: ${terminal} is visibly connected`);
  const seen=new Set([0]);
  for(let changed=true;changed;){changed=false;net.segments.forEach((line,i)=>{if(!seen.has(i)&&[...seen].some(j=>intersection(line,net.segments[j]))){seen.add(i);changed=true;}});}
  assert.equal(seen.size,net.segments.length,`${id}: node paths are continuous`);
  for(const pt of net.segments.flat()){
   const directions=new Set();
   for(const line of net.segments)if(on(pt,line))for(const end of line){
    if(end[0]!==pt[0])directions.add(end[0]<pt[0]?'left':'right');
    if(end[1]!==pt[1])directions.add(end[1]<pt[1]?'up':'down');
   }
   if(directions.size>=3)assert.ok(net.dots.some(p=>p[0]===pt[0]&&p[1]===pt[1]),`${id}: junction requires a dot`);
  }
 }
 for(let i=0;i<nets.length;i++)for(let j=i+1;j<nets.length;j++){
  assert.ok(!nets[i].segments.some(a=>nets[j].segments.some(b=>intersection(a,b))),`${id}: unrelated nodes never cross or touch`);
 }
 s.tool='meter';const html=challengeSchematic(s);
 assert.equal((html.match(/data-measure-part=/g)||[]).length,s.board.parts.length);
 assert.equal(JSON.stringify(s.board),before,`${id}: rendering does not change gameplay`);
}
console.log('PASS seven mission schematics: actual graph equivalence, continuous wires, correct terminals/junctions, no false crossings or wires through labels, read-only rendering.');
