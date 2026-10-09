import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-artifacts',{recursive:true});
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const key='circuit-lab.story.campaign.v1';
const action=name=>page.locator('[data-story-action="'+name+'"]').click();
async function goStage(n){await action('levels');await action('stage:'+n);await page.waitForSelector('.campaign-stage');if(await page.locator('[data-story-action="begin"]').isVisible())await action('begin');await page.waitForTimeout(200);}
async function point(x,z,y=.45){return page.evaluate(async({x,z,y})=>{const T=await import('/src/campaign/engine/three.js'),r=document.querySelector('.story-world canvas').getBoundingClientRect(),a=r.width/r.height,h=Math.max(7.3,9.4/a),c=new T.OrthographicCamera(-h*a,h*a,h,-h,.1,100);c.position.set(8,13.7,19);c.lookAt(0,.7,0);c.updateMatrixWorld();const v=new T.Vector3(x,y,z).project(c);return {x:r.x+(v.x*.5+.5)*r.width,y:r.y+(-v.y*.5+.5)*r.height};},{x,z,y});}
async function mesh(x,z,y=.45){const p=await point(x,z,y);await page.mouse.click(p.x,p.y);}
async function command(name){await page.waitForSelector('[data-story-action="op:'+name+'"]',{timeout:15000});await action('op:'+name);}
async function waitState(stage,expression){await page.waitForFunction(({key,stage,expression})=>{const s=JSON.parse(localStorage.getItem(key))?.levels[stage];return s&&new Function('s','return '+expression)(s);},{key,stage,expression},{timeout:15000});}
try{
 await page.goto(process.env.STORY_TEST_URL||'http://localhost:4173/#workshop');await page.waitForSelector('.story-world canvas');await goStage(9);
 await action('battery');await command('drop');
 await mesh(-.5,0,.7);await command('clear');
 await mesh(-4.6,-1.6,.45);await command('charge-cap');await waitState('09-capacitor-passage',"s.world.entities.find(e=>e.id==='capacitor').state.energy>=71.9");await command('release-cap');
 await mesh(-3.4,-1.6,.45);await command('carry');await waitState('09-capacitor-passage',"s.world.entities.find(e=>e.id==='capacitor').state.holder==='ray'");
 await mesh(.1,-1.6,.16);await command('dock-cap');await waitState('09-capacitor-passage','s.flags.capDocked===true');
 await page.screenshot({path:'.test-artifacts/chapter3-09-docked-desktop.png'});
 console.log('PASS actual canvas clicks: cart, capacitor charging, pickup, walking and docking.');
 await goStage(10);await mesh(-2,-2,.7);await command('horizontal');await waitState('10-quiet-garden',"s.world.entities.find(e=>e.id==='mirror1').state.angle===0");await mesh(0,0,.7);await command('vertical');await waitState('10-quiet-garden',"s.world.entities.find(e=>e.id==='mirror2').state.angle>1.5");await page.screenshot({path:'.test-artifacts/chapter3-10-mirrors-desktop.png'});
 console.log('PASS actual canvas clicks: both garden mirrors are selectable and reachable.');
 for(const n of [11,12]){await goStage(n);await page.screenshot({path:'.test-artifacts/chapter3-'+n+'-desktop.png'});}
 await page.setViewportSize({width:390,height:844});for(const n of [9,10,11,12]){await goStage(n);await action('help');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'.test-artifacts/chapter3-'+n+'-help-mobile.png'});await action('close');await page.screenshot({path:'.test-artifacts/chapter3-'+n+'-mobile.png'});}
 assert.deepEqual(errors,[]);console.log('PASS chapter-three mobile help and layout, zero browser errors.');
}finally{await page.screenshot({path:'.test-artifacts/chapter3-last.png'});await browser.close();}
