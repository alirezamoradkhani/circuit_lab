import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/campaign/mount.js',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('return new CityRayHost(root);','const host=new CityRayHost(root);window.__rayCityHost=host;return host;')});
 });
 await page.addInitScript(()=>{localStorage.setItem('circuit-lab.ray-city.route.v1','0');localStorage.setItem('circuit-lab.ray-city.position.gate',JSON.stringify({started:true,player:{x:-2.1,z:-3.35}}));});
 await page.goto('http://localhost:4173/#game');
 await page.locator('.story-world canvas').waitFor();
 await page.locator('[data-story-action="begin"]').press('Enter');
 await page.evaluate(()=>{const g=window.__rayCityHost.game;g.state.player={...g.devices.find(d=>d.id==='guard-lamp').walk};});
 await page.keyboard.press('e');
 await page.locator('.ray-device-dialog[open]').waitFor();
 assert.equal(await page.locator('[data-ray-robot="bridge"]').count(),1,'Gate circuit exposes the real robot bridge target');
 assert.equal(await page.locator('[data-ray-robot="bridge"]').evaluate(e=>e===document.activeElement),true,'The first circuit target receives focus without mouse');

 await page.keyboard.press('m');
 assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.tool),'meter');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('Enter');
 assert.match(await page.locator('.component-meter').innerText(),/V/,'Enter measures the focused component');
 assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.robotContact),false,'Meter mode cannot mutate the circuit');

 await page.keyboard.press('i');
 await page.keyboard.press('b');
 assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.robotContact),true,'B puts Ray into the circuit');
 assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.board.wires.some(w=>w.includes('p3:1')&&w.includes('p1:1'))),true);
 await page.keyboard.press('t');
 assert.equal(await page.evaluate(()=>window.__rayCityHost.game.session.won),true,'The real bridge solves the gate circuit');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.ray-device-dialog[open]').count(),0,'Escape closes the device without a close-button click');
 assert.deepEqual(errors,[]);
 console.log('PASS keyboard-only gate: focus, meter, robot bridge, test and escape');
}finally{await browser.close();}

