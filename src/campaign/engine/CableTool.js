import {Source,SourceSelector,Device} from '../components/index.js';
const output=e=>e instanceof Source||e instanceof SourceSelector;
// A draft is deliberately independent of inspection/selection and never edits the world.
export class CableTool {
 constructor(world){this.world=world;this.start=null;}
 endpoint(id){const e=this.world.get(id);return e&&e.state.visible&&!e.state.collected&&!e.config.hidden&&(output(e)||e instanceof Device)?e:null;}
 begin(id){if(!this.endpoint(id))return false;this.start=id;return true;}
 cancel(){this.start=null;}
 assess(id){
  const a=this.endpoint(this.start),b=this.endpoint(id);
  if(!a||!b)return {ok:false,reason:'این وسیله سوکت برق ندارد.'};
  if(a===b)return {ok:false,reason:'سر دوم را روی یک وسیلهٔ دیگر بگذار.'};
  if(output(a)===output(b))return {ok:false,reason:output(a)?'دو منبع به هم وصل نمی‌شوند؛ یک مصرف‌کننده انتخاب کن.':'دو ورودی برق به هم وصل نمی‌شوند؛ یک منبع انتخاب کن.'};
  const source=output(a)?a:b,target=source===a?b:a;
  if(source.id===target.config.target||source.config.sources?.includes(target.config.target))return {ok:false,reason:'یک بسته نمی‌تواند خودش را شارژ کند.'};
  const old=this.world.connections.get(target.id);
  return {ok:true,source,target,existing:old?.source===source.id,replacing:!!old&&old.source!==source.id};
 }
 commit(id){
  const result=this.assess(id);if(!result.ok)return result;
  if(!result.existing&&!this.world.connect(result.source.id,result.target.id))return {ok:false,reason:'اتصال مجاز نیست؛ سوکت و محدودیت کابل را بررسی کن.'};
  this.cancel();return result;
 }
}
