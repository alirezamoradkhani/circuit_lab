import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-artifacts',{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const action=id=>p.locator('[data-story-action="'+id+'"]').click();
async function inspect(label){
 const r=await p.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},visible=e=>!e.hidden&&e.getBoundingClientRect().width>0,overlap=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.5&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.5;
  const world=rect(document.querySelector('.story-world')),nodes=[...document.querySelectorAll('[data-story-object]')].filter(visible).map(e=>({id:e.dataset.storyObject,...rect(e)})),pairs=[];
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(overlap(nodes[i],nodes[j]))pairs.push([nodes[i].id,nodes[j].id]);
  const intrusions=[...document.querySelectorAll('.story-hud,.campaign-console,.campaign-object-tools,.story-bubble')].filter(visible).filter(e=>overlap(world,rect(e))).map(e=>e.className);
  return {pairs,intrusions,overflow:document.documentElement.scrollWidth>innerWidth,world,nodes};
 });assert.deepEqual(r.pairs,[],label+' overlapping targets');assert.deepEqual(r.intrusions,[],label+' UI intruding into scene');assert.equal(r.overflow,false,label+' horizontal overflow');assert.ok(r.world.h>110,label+' usable scene');for(const n of r.nodes){assert.ok(n.w>=44&&n.h>=44);assert.ok(n.x>=r.world.x&&n.x+n.w<=r.world.x+r.world.w+.5);}
 console.log('PASS '+label+': '+r.nodes.length+' separated targets, scene height '+r.world.h);
}
try{
 await p.goto(process.env.STORY_TEST_URL||'http://localhost:4173/#workshop');await p.waitForSelector('.story-world canvas');
 for(const stage of [3,8,11,12]){
  await action('levels');await action('stage:'+stage);await p.waitForSelector('.campaign-stage');await action('begin');await action('cable');
  for(const [name,viewport]of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}],['landscape',{width:844,height:390}]]){
   await p.setViewportSize(viewport);await p.waitForTimeout(600);await inspect(stage+' '+name);await p.screenshot({path:'.test-artifacts/readability-'+stage+'-'+name+'.png'});
  }
  await p.setViewportSize({width:390,height:844});await action('battery');await p.waitForTimeout(300);await inspect(stage+' selected battery');await p.keyboard.press('h');await p.waitForTimeout(100);await inspect(stage+' message');await p.screenshot({path:'.test-artifacts/readability-'+stage+'-selected.png'});
 }
 assert.deepEqual(errors,[]);
}finally{await b.close();}
