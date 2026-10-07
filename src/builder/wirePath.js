// Orthogonal routing around component bodies; crossing wires never creates a node.
export function wirePath(board,a,b,terminal,used=new Set()){
  const escape=id=>{const part=board.parts.find(p=>p.id===id.split(':')[0]);const sign=id.endsWith(':0')?-1:1;return {x:part.x+(part.rotation?0:sign*90),y:part.y+(part.rotation?sign*90:0)};};
  const p=terminal(a),q=terminal(b),e=escape(a),f=escape(b);
  const maxX=Math.ceil(Math.max(900,...board.parts.map(p=>p.x+160))/20),maxY=Math.ceil(Math.max(440,...board.parts.map(p=>p.y+160))/20);
  const grid=v=>[Math.max(0,Math.min(maxX,Math.round(v.x/20))),Math.max(0,Math.min(maxY,Math.round(v.y/20)))];
  const start=grid(e),end=grid(f),key=([x,y])=>x+','+y,target=key(end),queue=[start],previous=new Map([[key(start),null]]);
  let head=0;
  while(head<queue.length){const at=queue[head++];if(key(at)===target)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[at[0]+dx,at[1]+dy],k=key(n);if(n[0]<0||n[0]>maxX||n[1]<0||n[1]>maxY||previous.has(k)||(used.has(k)&&k!==target))continue;if(k!==target&&board.parts.some(part=>Math.abs(n[0]*20-part.x)<86&&Math.abs(n[1]*20-part.y)<76))continue;previous.set(k,key(at));queue.push(n);}}
  if(!previous.has(target))return `M${p.x} ${p.y} L${e.x} ${e.y} L${f.x} ${f.y} L${q.x} ${q.y}`;
  const path=[];let at=target;while(at!==null){path.push(at.split(',').map(Number).map(v=>v*20));at=previous.get(at);}path.reverse();path.slice(1,-1).forEach(([x,y])=>used.add(key([x/20,y/20])));
  return `M${p.x} ${p.y} L${e.x} ${e.y} L${path.map(v=>v.join(' ')).join(' L')} L${f.x} ${f.y} L${q.x} ${q.y}`;
}
