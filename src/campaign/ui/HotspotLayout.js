// Keep every target tappable, even when several objects project onto one screen point.
export function layoutHotspots(items,width,height,blocked=[]){
 const radius=23,gap=50,minX=radius+3,maxX=Math.max(minX,width-radius-3),minY=radius+3,maxY=Math.max(minY,height-radius-3);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),placed=[];
 for(const item of [...items].sort((a,b)=>(b.priority??0)-(a.priority??0))){
  const origin={x:clamp(item.x,minX,maxX),y:clamp(item.y,minY,maxY)},candidates=[origin];
  for(let y=minY;y<=maxY;y+=gap)for(let x=minX;x<=maxX;x+=gap)candidates.push({x,y});
  candidates.sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y));
  const point=candidates.find(p=>!placed.some(q=>Math.abs(p.x-q.x)<gap&&Math.abs(p.y-q.y)<gap)&&!blocked.some(r=>p.x+radius>r.x&&p.x-radius<r.x+r.w&&p.y+radius>r.y&&p.y-radius<r.y+r.h));
  // If the viewport is saturated, remaining objects can still be selected on their 3D mesh.
  if(point)placed.push({...item,...point,anchor:item.anchor??origin});
 }
 return placed;
}
