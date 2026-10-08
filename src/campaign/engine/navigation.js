import {ROOM,obstacles,distance,portPosition} from '../workshop/layout.js';
const RADIUS=0.23, CELL=0.32;
export function walkable(p,s){
  if(p.x<ROOM.minX||p.x>ROOM.maxX||p.z<ROOM.minZ||p.z>ROOM.maxZ)return false;
  return !obstacles(s).some(o=>Math.abs(p.x-o.x)<o.w/2+RADIUS&&Math.abs(p.z-o.z)<o.d/2+RADIUS);
}
export function tetherAllows(p,s){
  return Object.entries(s.connections).every(([id,source])=>{
    if(source!=='battery')return true;
    return distance(p,portPosition(id,s))<=2.65;
  })&&(!s.charging||distance(p,portPosition('mains',s))<=2.65);
}
export function movePlayer(s,dx,dz){
  if(s.pushing||s.completed)return false;
  const before={...s.player};
  for(const [key,amount] of [['x',dx],['z',dz]]){
    const next={...s.player,[key]:s.player[key]+amount};
    if(walkable(next,s)&&tetherAllows(next,s))s.player=next;
  }
  return distance(before,s.player)>0.00001;
}
export function findPath(from,to,s){
  const width=Math.ceil((ROOM.maxX-ROOM.minX)/CELL)+1;
  const height=Math.ceil((ROOM.maxZ-ROOM.minZ)/CELL)+1;
  const point=i=>({x:ROOM.minX+(i%width)*CELL,z:ROOM.minZ+Math.floor(i/width)*CELL});
  const valid=i=>i>=0&&i<width*height&&walkable(point(i),s)&&tetherAllows(point(i),s);
  const nearest=p=>{
    let best=-1,score=Infinity;
    for(let i=0;i<width*height;i++)if(valid(i)){const d=distance(p,point(i));if(d<score){score=d;best=i;}}
    return best;
  };
  const start=nearest(from),goal=nearest(to);
  if(start<0||goal<0||distance(point(goal),to)>0.65)return [];
  const open=new Set([start]),came=new Map(),cost=new Map([[start,0]]);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  while(open.size){
    let current=-1,best=Infinity;
    for(const n of open){const f=cost.get(n)+distance(point(n),point(goal));if(f<best){best=f;current=n;}}
    if(current===goal){
      const path=[];let n=goal;
      while(n!==start){path.unshift(point(n));n=came.get(n);}
      if(walkable(to,s)&&tetherAllows(to,s))path.push(to);
      return path;
    }
    open.delete(current);
    const x=current%width,z=Math.floor(current/width);
    for(const [dx,dz] of dirs){
      if(x+dx<0||x+dx>=width||z+dz<0||z+dz>=height)continue;
      const n=(z+dz)*width+x+dx;
      if(!valid(n)||(dx&&dz&&(!valid(z*width+x+dx)||!valid((z+dz)*width+x))))continue;
      const g=cost.get(current)+CELL*Math.hypot(dx,dz);
      if(g>=(cost.get(n)??Infinity))continue;
      came.set(n,current);cost.set(n,g);open.add(n);
    }
  }
  return [];
}
