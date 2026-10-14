import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-artifacts/shop-layout',{recursive:true});
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport:size,hasTouch:size.width<900,isMobile:size.width===390});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{localStorage.setItem('circuit-lab.ray-city.route.v1','1');localStorage.setItem('circuit-lab.ray-city.position.shop',JSON.stringify({started:true,player:{x:-2.1,z:2.65}}));});
  await p.goto('http://localhost:4173/#game');await p.locator('.story-world canvas').waitFor();await p.locator('[data-story-object="city-device:shop-sign"]').click();await p.locator('.ray-device-dialog[open]').waitFor();
  const dimensions=await p.locator('svg.shop-circuit').boundingBox();assert.ok(dimensions.height>=170,'Diagram must not collapse to icon height');
  assert.equal(await p.locator('.ray-device-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  await p.screenshot({path:'.test-artifacts/shop-layout/shop-'+size.width+'.png'});
  await p.locator('.cabinet-switch').click();await p.locator('[data-shop-action="remove"]').click();
  await p.locator('[data-shop-spare="24"]').click();await p.locator('[data-shop-action="socket"]').click();await p.locator('.cabinet-switch').click();
  await p.locator('[data-tool="meter"]').click();await p.locator('[data-measure-part="p4"]').click();
  assert.match(await p.locator('.component-meter').innerText(),/4.00 V/);assert.match(await p.locator('.component-meter').innerText(),/0.33 A/);
  await p.locator('[data-probe="red"]').click();await p.locator('[data-shop-point="p4:0"]').click();await p.locator('[data-probe="black"]').click();await p.locator('[data-shop-point="p4:1"]').click();
  assert.equal(await p.locator('.probe-meter output').innerText(),'4.00 V');
  await p.locator('[data-action="test"]').click();assert.match(await p.locator('.ray-board-feedback').innerText(),/روشن شد/);assert.deepEqual(errors,[]);
  console.log('PASS shop '+size.width+': visible circuit, replacement, direct meter, two probes and mission solution');await context.close();
 }
}finally{await browser.close();}
