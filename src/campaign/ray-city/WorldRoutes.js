// Route each copper track around component bodies; shared terminals are the only junctions.
const key=(x,z)=>x+','+z;
export function routeTracks(board,parts,terminals){
 const used=new Map(),step=.2,minX=-5.6,maxX=5.6,minZ=-3.6,maxZ=3.5;
 const width=Math.round((maxX-minX)/step)+1,height=Math.round((maxZ-minZ)/step)+1;
 const grid=p=>({x:Math.round((p.x-minX)/step),z:Math.round((p.z-minZ)/step)});
 const world=p=>({x:minX+p.x*step,z:minZ+p.z*step});
 const blocked=p=>{const w=world(p);return parts.some(d=>Math.abs(w.x-d.position.x)<.64&&Math.abs(w.z-d.position.z)<.53);};
 return board.wires.map((pair,index)=>{
  const a=terminals.find(t=>t.pin===pair[0]),b=terminals.find(t=>t.pin===pair[1]);if(!a||!b)return null;
  const start=grid(a.position),end=grid(b.position),sk=key(start.x,start.z),ek=key(end.x,end.z);
  const queue=[{...start,k:sk,g:0,f:0}],cost=new Map([[sk,0]]),came=new Map();let found=false;
  while(queue.length){queue.sort((a,b)=>b.f-a.f);const p=queue.pop();if(p.g!==cost.get(p.k))continue;if(p.k===ek){found=true;break;}
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,z:p.z+dz},nk=key(n.x,n.z);if(n.x<0||n.z<0||n.x>=width||n.z>=height||blocked(n)&&nk!==ek)continue;
    const occupied=used.get(nk),same=occupied?.some(dir=>dir===(dx?'h':'v')),g=p.g+1+(same?18:occupied?3:0)+((p.dx!==undefined&&(p.dx!==dx||p.dz!==dz))?.35:0);
    if(g>=(cost.get(nk)??Infinity))continue;cost.set(nk,g);came.set(nk,p.k);queue.push({...n,k:nk,g,f:g+Math.abs(n.x-end.x)+Math.abs(n.z-end.z),dx,dz});
   }
  }
  if(!found)throw new Error('No copper route for '+pair.join(' → '));
  const nodes=[];let k=ek;while(k){const [x,z]=k.split(',').map(Number);nodes.unshift({x,z});if(k===sk)break;k=came.get(k);}
  nodes.forEach((p,i)=>{const prev=nodes[Math.max(0,i-1)],dir=p.x!==prev.x?'h':'v',k=key(p.x,p.z);used.set(k,[...(used.get(k)||[]),dir]);});
  const raw=nodes.map(world),points=[a.position];for(let i=0;i<raw.length;i++){const p=raw[i],prev=raw[i-1],next=raw[i+1];if(!prev||!next||(p.x-prev.x)*(next.z-p.z)!==(p.z-prev.z)*(next.x-p.x))points.push(p);}points.push(b.position);
  // Endpoints may sit between grid cells; explicitly use orthogonal stubs.
  points.splice(1,0,{x:a.position.x,z:raw[0].z});points.splice(points.length-1,0,{x:b.position.x,z:raw.at(-1).z});
  return {index,pair,points,center:points[Math.floor(points.length/2)]};
 }).filter(Boolean);
}
