// Only explicit level saves are stored. Replay slots cannot overwrite the main run.
export class CampaignStore {
 constructor(storage,key='circuit-lab.story.campaign.v1'){this.storage=storage;this.key=key;this.available=!!storage;this.memory={version:1,levels:{},replays:{},inventory:{}};}
 read(){if(!this.available)return structuredClone(this.memory);try{const value=JSON.parse(this.storage?.getItem(this.key)??'null');return value?.version===1&&value.levels&&typeof value.levels==='object'?value:structuredClone(this.memory);}catch{this.available=false;return structuredClone(this.memory);}}
 save(level,{replay=false,inventory}={}){
  const value=this.read(),bucket=replay?'replays':'levels';value[bucket]??={};value[bucket][level.id]=level.snapshot();
  if(!replay){value.current=level.id;if(inventory)value.inventory=structuredClone(inventory);}
  this.memory=structuredClone(value);
  try{if(!this.storage)throw new Error('No persistent storage');this.storage.setItem(this.key,JSON.stringify(value));this.available=true;return true;}catch{this.available=false;return false;}
 }
 load(level,{replay=false}={}){const saved=this.read()[replay?'replays':'levels']?.[level.id];if(!saved)return false;try{level.restore(saved);return true;}catch{return false;}}
}
