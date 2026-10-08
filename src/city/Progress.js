import {cityMissions} from './missions.js';
const key='circuit-lab.city.v1';
export class CityProgress {
  constructor(storage,storageKey=key,missions=cityMissions){
    this.missions=missions;
    this.storage=storage; this.key=storageKey; this.stars={}; this.saved=!!storage;
    try {
      const data=JSON.parse(storage?.getItem(this.key)||'{}');
      for(const m of this.missions) if(Number.isInteger(data?.[m.id])&&data[m.id]>=1&&data[m.id]<=3) this.stars[m.id]=data[m.id];
    } catch { this.saved=false; }
  }
  unlocked(index){return index>=0&&index<this.missions.length&&(index===0||!!this.stars[this.missions[index-1].id]);}
  complete(id,hints){
    if(!this.missions.some(m=>m.id===id)) return;
    this.stars[id]=Math.max(this.stars[id]||0,Math.max(1,3-hints));
    try {if(!this.storage)throw new Error('Storage unavailable');this.storage.setItem(this.key,JSON.stringify(this.stars));this.saved=true;}catch{this.saved=false;}
  }
}
