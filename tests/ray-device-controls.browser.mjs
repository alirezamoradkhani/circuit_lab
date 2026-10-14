import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
await mkdir('.test-artifacts/device-controls',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport:size,hasTouch:size.width<900,isMobile:size.width===390});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/campaign/mount.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('return new CityRayHost(root);','const host=new CityRayHost(root);window.__rayCityHost=host;return host;')});});
  await page.addInitScript(()=>{localStorage.setItem('circuit-lab.ray-city.route.v1','2');localStorage.setItem('circuit-lab.ray-city.position.street',JSON.stringify({started:true,player:{x:-2.1,z:2.65}}));});
  await page.goto('http://localhost:4173/#game');await page.locator('.story-world canvas').waitFor();
  const press=async selector=>size.width===390?page.locator(selector).tap():page.locator(selector).click();
  const openDevice=async id=>{
   await page.evaluate(id=>{const g=window.__rayCityHost.game;g.movement.clear();g.state.player={...g.devices.find(d=>d.id===id).walk};},id);
   await press('[data-story-object="city-device:'+id+'"]');await page.locator('.ray-device-dialog[open]').waitFor();
  };
  const mission=async index=>{
   await press('[data-story-action="device-close"]');await press('[data-story-action="levels"]');await press('[data-story-action="mission:'+index+'"]');
   await page.locator('.story-world canvas').waitFor();if(await page.locator('[data-story-action="begin"]').isVisible())await press('[data-story-action="begin"]');
  };
  await openDevice('street-0');
  assert.equal(await page.locator('.street-steps li').evaluateAll(items=>items.every(e=>e.getBoundingClientRect().height<50)),true,'Steps have compact natural heights');
  assert.equal(await page.locator('.ray-device-dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'No horizontal overflow');
  await page.screenshot({path:'.test-artifacts/device-controls/street-'+size.width+'.png'});
  const toggle='svg [data-ray-switch="p3"]';
  assert.equal(await page.locator(toggle).getAttribute('aria-pressed'),'true');
  const closedCurrent=await page.evaluate(()=>window.__rayCityHost.game.session.street.readings()[0].current);assert.equal(closedCurrent,1);
  await press(toggle);assert.equal(await page.locator(toggle).getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.street.readings()[0].current),0);
  await page.screenshot({path:'.test-artifacts/device-controls/street-open-'+size.width+'.png'});
  await page.locator(toggle).focus();await page.keyboard.press('Enter');assert.equal(await page.locator(toggle).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator(toggle).evaluate(e=>e===document.activeElement),true,'Focus remains on the schematic switch after rendering');
  await page.keyboard.press('Space');assert.equal(await page.locator(toggle).getAttribute('aria-pressed'),'false');
  await press('[data-tool="meter"]');await press(toggle);
  assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.street.isolated.has('p3')),true,'Meter click never closes the branch');
  assert.match(await page.locator('.component-meter').innerText(),/0.00 A/);
  await press('[data-tool="inspect"]');await press(toggle);
  await press('[data-story-action="device-close"]');await openDevice('street-2');
  await page.screenshot({path:'.test-artifacts/device-controls/street-third-'+size.width+'.png'});
  await press('svg [data-ray-switch="p5"]');assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.street.isolated.has('p5')),true);
  await press('[data-story-action="device-close"]');await openDevice('supply');await press('svg [data-ray-switch="p2"]');
  assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.board.parts[1].closed),false,'Actual main source switch opens');
  await press('[data-tool="meter"]');await press('svg [data-ray-switch="p2"]');assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.board.parts[1].closed),false);
  await mission(3);await openDevice('load-1');await press('svg [data-ray-switch="load-1"]');
  assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.loads[1]),true);
  await press('[data-tool="meter"]');await press('svg [data-ray-switch="load-1"]');assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.loads[1]),true);
  await page.screenshot({path:'.test-artifacts/device-controls/clinic-'+size.width+'.png'});
  await mission(6);await openDevice('device-0');await press('svg [data-ray-switch="p3"]');
  assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.challenge.states[0]),1,'Pump start uses the original challenge action');
  await press('[data-tool="meter"]');await press('svg [data-ray-switch="p3"]');assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.challenge.states[0]),1);
  await mission(1);await openDevice('shop-sign');await press('svg [data-ray-switch="main"]');
  assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.shop.switch.closed),false);
  await press('[data-tool="meter"]');await press('svg [data-ray-switch="main"]');assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.shop.switch.closed),false);
  await page.screenshot({path:'.test-artifacts/device-controls/shop-'+size.width+'.png'});
  assert.deepEqual(errors,[]);console.log('PASS '+size.width+': compact steps, schematic branch/main switches, keyboard, touch and read-only meter.');await context.close();
 }
}finally{await browser.close();}
