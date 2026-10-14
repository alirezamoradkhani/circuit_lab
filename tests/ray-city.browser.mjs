import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-artifacts/ray-city',{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:950}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/src/campaign/mount.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('return new CityRayHost(root);','const host=new CityRayHost(root);window.__rayCityHost=host;return host;')});});
 await p.goto('http://localhost:4173/#game');await p.locator('.story-world canvas').waitFor();await p.locator('[data-story-action="begin"]').click();
 await p.screenshot({path:'.test-artifacts/ray-city/gate.png'});
 await p.locator('[data-story-object="city-device:guard-lamp"]').click();await p.locator('.ray-device-dialog[open]').waitFor({timeout:20000});
 await p.screenshot({path:'.test-artifacts/ray-city/gate-circuit.png'});
 assert.equal(await p.locator('.ray-device-dialog h2').innerText(),'چراغ نگهبانی');
 await p.locator('[data-pin="p3:1"]').click();await p.locator('[data-pin="p1:1"]').click();await p.locator('.ray-device-dialog [data-action="test"]').click();
 console.log(await p.locator('.ray-board-feedback').innerText());assert.match(await p.locator('.ray-board-feedback').innerText(),/دروازه باز/);
 await p.locator('[data-story-action="device-close"]').click();await p.locator('[data-story-action="levels"]').first().click();
 assert.equal(await p.locator('[data-story-action^="mission:"]').count(),12);await p.locator('[data-story-action="mission:3"]').click();
 await p.locator('.story-world canvas').waitFor();await p.locator('[data-story-action="begin"]').click();
 assert.equal(await p.locator('[data-story-object^="city-device:"]').count(),5,'Four physical devices plus shared source');
 await p.screenshot({path:'.test-artifacts/ray-city/clinic.png'});
 await p.locator('[data-story-object="city-device:load-1"]').click();await p.locator('.ray-device-dialog[open]').waitFor({timeout:20000});
 assert.equal(await p.locator('.ray-device-dialog [data-load]').count(),1,'Only this physical branch can be switched');
 await p.screenshot({path:'.test-artifacts/ray-city/clinic-fan.png'});
 await p.locator('[data-load="1"]').click();await p.locator('[data-story-action="device-close"]').click();
 await p.locator('[data-story-object="city-device:load-2"]').click();await p.locator('.ray-device-dialog[open]').waitFor({timeout:20000});await p.locator('[data-load="2"]').click();await p.locator('[data-story-action="device-close"]').click();
 await p.locator('[data-story-object="city-device:load-3"]').click();await p.locator('.ray-device-dialog[open]').waitFor({timeout:20000});await p.locator('[data-load="3"]').click();await p.locator('.ray-device-dialog [data-action="test"]').click();
 assert.match(await p.locator('.ray-board-feedback').innerText(),/بدون اضافه/);

 await p.locator('[data-story-action="device-close"]').click();
 for(let index=0;index<12;index++){console.log('Checking mission',index);
  await p.locator('[data-story-action="levels"]').first().click();await p.locator('[data-story-action="mission:'+index+'"]').click();await p.locator('.story-world canvas').waitFor();
  const begin=p.locator('[data-story-action="begin"]');if(await begin.isVisible())await begin.click();
  const ids=await p.locator('[data-story-object^="city-device:"]').evaluateAll(bs=>bs.map(b=>b.dataset.storyObject));
  for(const id of ids){
   await p.evaluate(id=>{const g=window.__rayCityHost.game,d=g.devices.find(d=>id==='city-device:'+d.id);g.movement.clear();g.state.player={...d.walk};},id);
   await p.locator('[data-story-object="'+id+'"]').click();await p.locator('.ray-device-dialog[open]').waitFor({timeout:20000});
   assert.equal(await p.locator('.ray-device-dialog svg.ray-branch-circuit,.ray-device-dialog svg.shop-circuit').count(),1,'Only one device circuit');
   await p.locator('[data-tool="meter"]').click();await p.locator('[data-story-action="device-close"]').click();
  }
 }
 // Inspect a four-device mission in portrait and landscape, then use actual touch taps.
 await p.locator('[data-story-action="levels"]').first().click();await p.locator('[data-story-action="mission:5"]').click();await p.locator('.story-world canvas').waitFor();
 if(await p.locator('[data-story-action="begin"]').isVisible())await p.locator('[data-story-action="begin"]').click();
 for(const size of [{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(size);await p.evaluate(()=>{const g=window.__rayCityHost.game;g.state.player={...g.devices.find(d=>d.id==='device-1').walk};});await p.locator('[data-story-object="city-device:device-1"]').click();await p.locator('.ray-device-dialog[open]').waitFor({timeout:20000});
  await p.screenshot({path:'.test-artifacts/ray-city/device-'+size.width+'.png'});
  assert.equal(await p.locator('.ray-device-dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'Device dialog does not overflow');
  assert.equal(await p.locator('[data-challenge="1"]').count(),3,'Only fan off/low/high controls are available');
  assert.equal(await p.locator('[data-challenge="0"]').count(),0,'Other physical branch cannot be toggled here');
  await p.locator('[data-story-action="device-close"]').click();
 }
 const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const t=await touchContext.newPage();t.on('pageerror',e=>errors.push(e.message));await t.goto('http://localhost:4173/#game');await t.locator('.story-world canvas').waitFor();await t.locator('[data-story-action="begin"]').tap();
 await t.locator('[data-story-object="city-device:guard-lamp"]').tap();await t.locator('.ray-device-dialog[open]').waitFor({timeout:20000});
 await t.locator('[data-pin="p3:1"]').tap();await t.locator('[data-pin="p1:1"]').tap();await t.locator('[data-action="test"]').tap();assert.match(await t.locator('.ray-board-feedback').innerText(),/دروازه باز/);await touchContext.close();
 assert.deepEqual(errors,[]);console.log('PASS actual city gate repair and four-device clinic with independent cabinets and shared power.');
}finally{await browser.close();}
