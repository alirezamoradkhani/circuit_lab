import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const url=process.env.STORY_TEST_URL||'http://localhost:4173/tests/fixtures/legacy-city.html#workshop';
const key='circuit-lab.story.workshop.v1';
await mkdir('.test-artifacts',{recursive:true});
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const errors=[],touchPages=new WeakSet();
// Exercise the reusable original workshop; the combined stage has its own browser suite.
async function legacyWorkshop(page){await page.route('**/src/campaign/CampaignHost.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('RepairWorkshopGame','WorkshopGame')});});}
async function pageFor(options={},initial=null){
 const context=await browser.newContext(options);
 const page=await context.newPage();
 if(options.hasTouch)touchPages.add(page);
 if(initial)await page.addInitScript(({key,initial})=>localStorage.setItem(key,JSON.stringify(initial)),{key,initial});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))errors.push(r.status()+' '+r.url());});
 await legacyWorkshop(page);await page.goto(url);await page.waitForSelector('.story-world canvas');
 return {page,context};
}
const action=(p,name)=>p.locator('[data-story-action="'+name+'"]')[touchPages.has(p)?'tap':'click']();
const object=(p,name)=>p.locator('[data-story-object="'+name+'"]')[touchPages.has(p)?'tap':'click']();
const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const waitState=(p,expression)=>p.waitForFunction(({key,expression})=>{
 const s=JSON.parse(localStorage.getItem(key));return s&&new Function('s','return '+expression)(s);
},{key,expression},{timeout:20000});
async function begin(p){await action(p,'begin');await action(p,'skip');await p.waitForSelector('.story-playing');}
async function pull(p){await object(p,'cart');await waitState(p,'s.cart===1');}
async function wire(p,a,b){await action(p,'cable');await object(p,a);await object(p,b);}
try {
 const {page:p,context}=await pageFor({viewport:{width:1440,height:900}});
 await p.screenshot({path:'.test-artifacts/workshop-intro-desktop.png'});
 await begin(p);await pull(p);
 await p.reload();await p.waitForSelector('.story-playing');
 assert.equal(await p.locator('.story-intro').isVisible(),false,'Resume does not replay intro');
 assert.equal((await state(p)).cart,1);
 await wire(p,'battery','lamp');await waitState(p,'s.connections.lamp==="battery"&&s.energy<71');
 await action(p,'circuit');const paused=await state(p);
 await p.waitForTimeout(800);assert.deepEqual(await state(p),paused,'Inspection pauses simulation and save');
 await action(p,'close');await object(p,'lamp');await action(p,'disconnect');
 await wire(p,'battery','latch');await waitState(p,'s.door===true');
 await object(p,'latch');await action(p,'disconnect');await action(p,'hand');
 await object(p,'receipt');await waitState(p,'s.receipt===true');
 await p.screenshot({path:'.test-artifacts/workshop-repaired-desktop.png'});
 await object(p,'exit');await waitState(p,'s.completed===true');
 assert.equal((await state(p)).route,'battery');
 await p.screenshot({path:'.test-artifacts/workshop-complete-desktop.png'});
 await p.reload();await p.waitForSelector('.story-dialog[open]');
 assert.match(await p.locator('.story-dialog').innerText(),/مرحلهٔ ۰۱/);
 await action(p,'lab');assert.equal(await p.locator('.main-grid').isVisible(),true);
 await p.locator('[data-mode="city"]').click();assert.equal(await p.locator('.city-home').isVisible(),true);
 await context.close();console.log('PASS desktop: complete battery route, inspection pause, resume, lab and old town.');
 const mobile=await pageFor({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1},{version:1,started:true,energy:0});
 const m=mobile.page;
 await m.waitForSelector('.story-playing');await m.screenshot({path:'.test-artifacts/workshop-mobile.png'});
 await action(m,'help');
 assert.match(await m.locator('.story-dialog h2').innerText(),/چرخ/);
 await m.locator('.story-help-details summary').first().tap();
 assert.match(await m.locator('.story-help-details[open]').innerText(),/ابزار دست/);
 assert.equal(await m.locator('.story-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false,'Help does not overflow on mobile');
 await m.screenshot({path:'.test-artifacts/workshop-help-mobile.png'});
 await action(m,'close');
 await pull(m);
 await action(m,'help');
 assert.match(await m.locator('.story-dialog h2').innerText(),/انرژی/,'Help changes after opening the aisle');
 await action(m,'hint');
 assert.match(await m.locator('.story-bubble').innerText(),/پریز/);

 await action(m,'hand');
 await object(m,'reel');await waitState(m,'s.reel===true');
 await wire(m,'mains','latch');await waitState(m,'s.door===true');
 const before=(await state(m)).connections;
 await action(m,'meter');await object(m,'latch');
 assert.deepEqual((await state(m)).connections,before,'Meter never toggles a connection');
 assert.match(await m.locator('.story-bubble').innerText(),/ولت/);
 await action(m,'hand');await object(m,'receipt');await waitState(m,'s.receipt===true');
 await object(m,'exit');await waitState(m,'s.completed===true');
 assert.equal((await state(m)).route,'mains');assert.equal((await state(m)).energy,0);
 const overflow=await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 assert.equal(overflow,false,'No horizontal overflow at 390px');
 await m.screenshot({path:'.test-artifacts/workshop-complete-mobile.png'});
 await mobile.context.close();console.log('PASS mobile: zero-energy mains route, read-only meter and no horizontal overflow.');

 const input=await pageFor({viewport:{width:1280,height:800}},{version:1,started:true});
 const ip=input.page;await ip.waitForSelector('.story-playing');
 await ip.keyboard.down('KeyD');await ip.waitForTimeout(320);await ip.keyboard.up('KeyD');
 await waitState(ip,'s.player.x>1.6');
 const project=async(x,y,z)=>ip.evaluate(async({x,y,z})=>{
  const T=await import('/vendor/three/three.module.js');
  const r=document.querySelector('.story-world').getBoundingClientRect(),a=r.width/r.height,h=Math.max(7.1,9.4/a);
  const camera=new T.OrthographicCamera(-h*a,h*a,h,-h,.1,100);
  camera.position.set(8,14,18.7);camera.lookAt(0,1,-.3);camera.updateMatrixWorld();
  const p=new T.Vector3(x,y,z).project(camera);
  return {x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};
 },{x,y,z});
 const floor=await project(0,0,2.6);await ip.mouse.click(floor.x,floor.y);
 await waitState(ip,'Math.abs(s.player.x)<0.2&&Math.abs(s.player.z-2.6)<0.2');
 const crate=await project(-1.8,.85,-.02);await ip.mouse.click(crate.x,crate.y);
 await waitState(ip,'s.cart===1');
 await action(ip,'cable');await object(ip,'battery');
 await action(ip,'help');
 assert.match(await ip.locator('.story-dialog h2').innerText(),/کرکره/);
 await action(ip,'hint');assert.equal(await ip.locator('.story-dialog').isVisible(),false);
 assert.equal(await ip.locator('[data-story-object="battery"]').evaluate(el=>el.classList.contains('selected')),true,'Help preserves pending cable endpoint');
 await ip.keyboard.press('KeyH');
 assert.match(await ip.locator('.story-bubble').innerText(),/ابزار کابل/,'Second hint gives concrete steps');

 await input.context.close();
 console.log('PASS input: WASD, raycast floor walking, physical cart selection and contextual hint.');
 const touch=await pageFor({viewport:{width:390,height:844},isMobile:true,hasTouch:true},{version:1,started:true});
 const tp=touch.page;await tp.waitForSelector('.story-playing');
 const rect=await tp.locator('.story-joystick').boundingBox(),cdp=await touch.context.newCDPSession(tp);
 const center={x:rect.x+rect.width/2,y:rect.y+rect.height/2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...center,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:center.x+26,y:center.y,id:1}]});
 await tp.waitForTimeout(320);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await waitState(tp,'s.player.x>1.6');
 const touchTargets=await tp.locator('.story-small-tools button').evaluateAll(bs=>bs.every(b=>b.getBoundingClientRect().width>=44&&b.getBoundingClientRect().height>=44));
 assert.equal(touchTargets,true,'Compact icons retain 44px touch targets');
 await tp.setViewportSize({width:844,height:390});
 await tp.waitForTimeout(400);
 const dock=await tp.locator('.story-dock').boundingBox();assert.ok(dock.y+dock.height<=390,'Landscape dock stays visible');
 await tp.screenshot({path:'.test-artifacts/workshop-mobile-landscape.png'});
 await touch.context.close();console.log('PASS touch: drag joystick, 44px toolbar targets and landscape viewport.');
 const noStorage=await browser.newContext({viewport:{width:1000,height:760}});
 const np=await noStorage.newPage();
 await np.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Unavailable','SecurityError');}}));
 await legacyWorkshop(np);await np.goto(url);await np.waitForSelector('.story-intro');await begin(np);await action(np,'help');
 assert.match(await np.locator('.story-dialog').innerText(),/در دسترس نیست/);
 await noStorage.close();console.log('PASS fallback: gameplay starts when persistent storage is unavailable.');

 assert.deepEqual(errors,[]);console.log('PASS: no page errors or missing application assets.');
} finally {await browser.close();}
