import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-artifacts',{recursive:true});
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const saveKey='circuit-lab.story.campaign.v1';
const action=(page,id)=>page.locator('[data-story-action="'+id+'"]').click();
const object=(page,id)=>page.locator('[data-story-object="'+id+'"]').click();
async function wire(page,target,source='supply'){await action(page,'cable');await object(page,source);await object(page,target);}
async function mesh(page,x,z,y=.45){const p=await page.evaluate(async({x,z,y})=>{const T=await import('/src/campaign/engine/three.js'),r=document.querySelector('.story-world canvas').getBoundingClientRect(),a=r.width/r.height,h=Math.max(7.3,9.4/a),c=new T.OrthographicCamera(-h*a,h*a,h,-h,.1,100);c.position.set(8,13.7,19);c.lookAt(0,.7,0);c.updateMatrixWorld();const v=new T.Vector3(x,y,z).project(c);return {x:r.x+(v.x*.5+.5)*r.width,y:r.y+(-v.y*.5+.5)*r.height};},{x,z,y});await page.mouse.click(p.x,p.y);}
try{
 for(const route of ['paper','dock']){
  const mobile=route==='dock',page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.STORY_TEST_URL||'http://localhost:4173/tests/fixtures/legacy-city.html#workshop');await action(page,'levels');await action(page,'stage:3');await action(page,'begin');
  if(route==='paper'){
   await wire(page,'sign');await wire(page,'fan');await action(page,'hand');await mesh(page,-2,0);
   await page.waitForSelector('[data-story-action="op:fan-direction"]');assert.match(await page.locator('.campaign-object-tools header p').innerText(),/پیشخوان/);
   await action(page,'op:fan-direction');await page.waitForFunction(()=>document.querySelector('.campaign-object-tools header p')?.textContent.includes('ورودی'));
  }else {await wire(page,'dock');await action(page,'hand');}
  const key=page.locator('[data-story-object="key"].story-goal');await key.waitFor({state:'visible',timeout:15000});
  assert.equal(await key.locator('span').evaluate(e=>getComputedStyle(e).opacity),'1');const bounds=await key.boundingBox();assert.ok(bounds.width>=(mobile?44:38)&&bounds.height>=(mobile?44:38));
  await key.click();await action(page,'op:take-key');await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.levels['03-market']?.flags.key===true,saveKey,{timeout:18000});
  assert.equal(await page.locator('[data-story-object="key"]').isVisible(),false);
  await action(page,'bag');assert.match(await page.locator('.story-dialog').innerText(),/کلید بارانداز/);await action(page,'close');
  await page.screenshot({path:'.test-artifacts/market-key-'+route+'.png'});
  await page.reload();await page.waitForSelector('.campaign-stage');assert.equal(await page.locator('[data-story-object="key"]').isVisible(),false);
  if(!mobile){await action(page,'cable');await action(page,'unplug:fan');await action(page,'unplug:sign');}await wire(page,'latch',mobile?'battery':'supply');await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.levels['03-market']?.world.entities.find(e=>e.id==='latch')?.state.complete,saveKey,{timeout:15000});await action(page,'hand');await object(page,'exit');await page.waitForSelector('.story-dialog[open]',{timeout:18000});assert.match(await page.locator('.story-dialog').innerText(),/تمام شد/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.close();
  console.log('PASS market '+route+': visible key target, real queued walk and explicit pickup, saved key, powered latch and physical exit'+(mobile?' on mobile.':' on desktop.'));
 }
}finally{await browser.close();}
