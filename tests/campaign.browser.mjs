import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-artifacts',{recursive:true});
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const base=process.env.STORY_TEST_URL||'http://localhost:4173/#workshop';
const errors=[];
const action=(p,name)=>p.locator('[data-story-action="'+name+'"]').click();
const object=(p,id)=>p.locator('[data-story-object="'+id+'"]').click();
const saveKey='circuit-lab.story.campaign.v1';
async function saved(p,id){return p.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).levels[id],{key:saveKey,id});}
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForSelector('.story-world canvas');
 await action(page,'levels');await action(page,'stage:2');await page.waitForSelector('.campaign-stage');await action(page,'begin');
 await action(page,'cable');await object(page,'sign');await object(page,'supply');
 const supplyPoint=await page.evaluate(async()=>{const T=await import('/src/campaign/engine/three.js'),r=document.querySelector('.story-world canvas').getBoundingClientRect(),a=r.width/r.height,h=Math.max(7.3,9.4/a),c=new T.OrthographicCamera(-h*a,h*a,h,-h,.1,100);c.position.set(8,13.7,19);c.lookAt(0,.7,0);c.updateMatrixWorld();const p=new T.Vector3(-5,.8,-2.5).project(c);return {x:(p.x*.5+.5)*r.width,y:(-.5*p.y+.5)*r.height};});
 await action(page,'hand');const canvas=await page.locator('.story-world canvas').boundingBox();await page.mouse.click(canvas.x+supplyPoint.x,canvas.y+supplyPoint.y+12);await page.waitForSelector('[data-story-action="op:reset"]',{timeout:20000});await action(page,'op:reset');
 await page.waitForFunction(({key})=>JSON.parse(localStorage.getItem(key))?.levels['02-wind-alley']?.flags.bridgeBuilt,{key:saveKey},{timeout:15000});
 await page.screenshot({path:'.test-artifacts/campaign-wind-desktop.png'});
 await action(page,'meter');await object(page,'fan');assert.match(await page.locator('.story-bubble').innerText(),/ولت/);
 await action(page,'hand');await object(page,'exit');await page.waitForSelector('.story-dialog[open]',{timeout:20000});assert.match(await page.locator('.story-dialog').innerText(),/تمام شد/);
 assert.equal((await saved(page,'02-wind-alley')).completed,true);
 await action(page,'next');await page.waitForFunction(()=>document.querySelector('.story-heading h1')?.textContent.includes('بازار'));
 console.log('PASS browser: real wind-alley circuit repair, bridge crossing, meter and next-stage transition.');
 const last=Number(process.env.CAMPAIGN_LAST_STAGE||12);
 for(let number=3;number<=last;number++){
  await action(page,'levels');await action(page,'stage:'+number);await page.waitForSelector('.campaign-stage .story-intro:not([hidden])');await action(page,'begin');
  assert.equal(await page.locator('.story-dialog[open]').count(),0,'Stage '+number+' must not start solved');
  await action(page,'help');assert.ok((await page.locator('.story-dialog').innerText()).length>80);await action(page,'close');
  await page.screenshot({path:'.test-artifacts/campaign-stage-'+number+'.png'});
 }
 await page.setViewportSize({width:390,height:844});await action(page,'levels');await action(page,'stage:5');await page.waitForSelector('.campaign-stage');
 const begin=page.locator('[data-story-action="begin"]');if(await begin.isVisible())await begin.click();
 await action(page,'help');await page.screenshot({path:'.test-artifacts/campaign-help-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await action(page,'close');await page.screenshot({path:'.test-artifacts/campaign-water-mobile.png'});
 await page.reload();await page.waitForSelector('.campaign-stage');assert.match(await page.locator('.story-heading h1').innerText(),/آب/);
 await action(page,'levels');await action(page,'stage:1');await page.waitForSelector('.story-world canvas');assert.match(await page.locator('.story-heading h1').innerText(),/تعمیرگاه/);
 const mainWind=await saved(page,'02-wind-alley');
 await action(page,'levels');await action(page,'stage:2');await page.waitForSelector('.campaign-stage .story-intro:not([hidden])');await action(page,'begin');
 await page.reload();await page.waitForSelector('.campaign-stage');assert.equal(await page.locator('.story-intro').isVisible(),false);assert.equal(await page.locator('.story-dialog[open]').count(),0);
 assert.deepEqual(await saved(page,'02-wind-alley'),mainWind,'Replay must preserve the completed main save even across reload');
 assert.deepEqual(errors,[]);console.log('PASS browser: all stage entry/help, mobile layout, resume, isolated replay and return to workshop without duplicate listeners.');
}finally{await browser.close();}
