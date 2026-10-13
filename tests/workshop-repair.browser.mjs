import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const artifacts=new URL('../.test-artifacts/workshop-repair/',import.meta.url);await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/repair-test',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="fa" dir="rtl"><head><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/src/campaign/story.css"><link rel="stylesheet" href="/src/campaign/repair.css"></head><body class="story-theme"><div class="topbar">تعمیرگاه</div><main id="test"></main></body></html>'}));
 await p.goto('http://localhost:4173/repair-test');
 await p.evaluate(async()=>{const {RepairWorkshopGame}=await import('/src/campaign/RepairWorkshopGame.js');window.game=new RepairWorkshopGame(document.getElementById('test'),{fresh:true});game.setActive(true);});
 const act=a=>p.locator('[data-story-action="'+a+'"]').filter({visible:true}).last().click();
 await act('begin');await act('skip');
 await p.locator('[data-story-object="cart"]').click();await p.waitForFunction(()=>game.state.cart===1,{timeout:15000});
 await act('circuit');await p.waitForFunction(()=>game.scene.editing);
 await p.screenshot({path:fileURLToPath(new URL('repair-desktop.png',artifacts))});
 console.log('Editing open, no errors:',errors);
 const canvas=p.locator('canvas').first();
 const coords=async id=>p.evaluate(id=>{const r=game.scene.renderer.domElement.getBoundingClientRect();const p=game.scene.pinScreen(id);return {x:r.left+p.x,y:r.top+p.y};},id);
 await act('cable');const a=await coords('lamp:1'),b=await coords('source:1');
 console.log({a,b});await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(b.x,b.y,{steps:15});await p.mouse.up();
 console.log('Wires',await p.evaluate(()=>game.state.repair.board.wires));
 assert.equal(await p.evaluate(()=>game.state.repair.board.wires.length),4,'Drag connects return wire');
 await p.screenshot({path:fileURLToPath(new URL('repair-wired.png',artifacts))});

 const part=async id=>{const a=await coords(id+':0'),b=await coords(id+':1');await p.mouse.click((a.x+b.x)/2,(a.y+b.y)/2);};
 await act('hand');await part('source');await p.locator('[data-story-action="repair-source:battery"]').click();
 assert.equal(await p.evaluate(()=>game.state.connections.latch),'battery','Physical battery route reaches cabinet');
 await act('repair-switch');await p.waitForFunction(()=>game.state.repair.tripped);
 assert.equal(await p.evaluate(()=>game.state.door),false);
 await act('repair-switch');await act('repair-reset');await part('resistor');await act('repair-resistor:12');
 await act('repair-test');assert.equal(await p.evaluate(()=>game.state.repair.offTest),true);
 await act('repair-switch');await act('meter');await part('lamp');
 await p.waitForFunction(()=>game.state.repair.measured);
 assert.match(await p.locator('.repair-reading').innerText(),/0.50 A/);
 await act('repair-test');await p.waitForFunction(()=>game.state.door);
 console.log('Real mouse solution opens shutter');
 await p.screenshot({path:fileURLToPath(new URL('repair-complete.png',artifacts))});
 // The stored checkpoint resumes the repaired state independently of the old workshop save.
 await p.evaluate(async()=>{game.dispose();const {RepairWorkshopGame}=await import('/src/campaign/RepairWorkshopGame.js');window.game=new RepairWorkshopGame(document.getElementById('test'));game.setActive(true);});
 assert.equal(await p.evaluate(()=>game.state.door),true,'Repair persists on reload');
 // New session for responsive interactions and a detached/reconnected conductor.
 await p.evaluate(async()=>{game.dispose();const {RepairWorkshopGame}=await import('/src/campaign/RepairWorkshopGame.js');window.game=new RepairWorkshopGame(document.getElementById('test'),{fresh:true});game.state.started=true;game.state.cart=1;game.intro=5;game.state.player={x:-.9,z:-3.1};game.setActive(true);game.interactions.open();});
 await p.waitForFunction(()=>game.scene.editing);
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(150);
  await p.screenshot({path:fileURLToPath(new URL('repair-'+viewport.width+'.png',artifacts))});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal overflow');
  await act('cable');const a=await coords('lamp:1'),b=await coords('source:1');
  const already=await p.evaluate(()=>game.state.repair.board.wires.length===4);
  if(!already){await p.mouse.click(a.x,a.y);await p.mouse.click(b.x,b.y);assert.equal(await p.evaluate(()=>game.state.repair.board.wires.length),4,'Two tap connection works');}
 }

 await act('hand');const wa=await coords('lamp:1'),wb=await coords('source:1');await p.mouse.click((wa.x+wb.x)/2,(wa.y+wb.y)/2);
 await act('repair-remove');assert.equal(await p.evaluate(()=>game.state.repair.board.wires.length),3,'Selected wire can actually be removed');
 await act('cable');await p.mouse.click(wa.x,wa.y);await p.mouse.click(wb.x,wb.y);assert.equal(await p.evaluate(()=>game.state.repair.board.wires.length),4,'Removed wire can be restored');
 await p.evaluate(()=>{game.dispose();localStorage.removeItem('circuit-lab.game.progress.v1');});
 await p.setViewportSize({width:1440,height:900});await p.goto('http://localhost:4173/#workshop');await p.locator('.story-world canvas').waitFor();
 assert.equal(await p.locator('.story-heading h1').innerText(),'تعمیرگاه خاموش','Actual site mounts the combined workshop');
 await p.screenshot({path:fileURLToPath(new URL('repair-real-site.png',artifacts))});
 assert.deepEqual(errors,[]);

 console.log('PASS desktop solution, real wire drag, battery connection, overload recovery, measurement, shutter, saved repair and mobile/landscape.');

}finally{await browser.close();}
