// Deterministic action journals preserve repairs without serializing object references or HTML.
const methods={session:['inspect','install','pin','removeWire','toggleLoad','toggleSwitch','hint','resetFuse','test'],shop:['placeProbe','remove','install'],street:['inspect','replace','removeCable','isolate'],challenge:['act']};
const key='circuit-lab.city-repairs.v1';
export class CityDrafts {
 constructor(storage){this.storage=storage;this.saved=!!storage;this.logs={};try{const v=JSON.parse(storage?.getItem(key)||'null');if(v?.version===1&&v.logs&&typeof v.logs==='object')this.logs=v.logs;}catch{this.saved=false;}}
 attach(s,{fresh=false}={}){
  const id=s.mission.id,log=fresh?[]:this.logs[id]??[];
  if(!Array.isArray(log)||log.length>1000||log.some(e=>!Array.isArray(e)||!Object.hasOwn(methods,e[0])||!methods[e[0]].includes(e[1])||!Array.isArray(e[2])||e[2].length>2||e[2].some(v=>!['number','boolean','string'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v)||typeof v==='string'&&v.length>128))){this.logs[id]=[];this.saved=false;return this.attach(s,{fresh:true});}
  for(const [group,name,args]of log){const target=group==='session'?s:s[group];target?.[name]?.(...args);}
  this.logs[id]=[...log];let depth=0;
  for(const [group,names]of Object.entries(methods)){
   const target=group==='session'?s:s[group];if(!target)continue;
   for(const name of names){const original=target[name];if(typeof original!=='function')continue;
    target[name]=(...args)=>{depth++;try{return original.apply(target,args);}finally{depth--;if(!depth){if(this.logs[id].length<1000){this.logs[id].push([group,name,args]);this.save();}else this.saved=false;}}};
   }
  }
  if(fresh)this.save();return s;
 }
 save(){try{if(!this.storage)throw Error('storage unavailable');this.storage.setItem(key,JSON.stringify({version:1,logs:this.logs}));this.saved=true;}catch{this.saved=false;}}
}
