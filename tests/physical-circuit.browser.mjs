import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const out=process.env.CIRCUIT_ARTIFACTS||'.test-artifacts/physical-circuit';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/src/campaign/mount.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('return new CityRayHost(root);','const host=new CityRayHost(root);window.__rayCityHost=host;return host;')});});
 await p.goto('http://localhost:4173/#game');await p.locator('.story-world canvas').waitFor();await p.keyboard.press('Enter');await p.waitForTimeout(200);assert.equal(await p.locator('.ray-world-intro').isVisible(),false);
 assert.equal(await p.locator('.ray-device-dialog').count(),0,'no modal circuit editor');
 await p.screenshot({path:out+'/gate.png'});
 // Walk using actual key events along the computed collision-free route. No position mutation.
 async function walk(pin){
  const points=await p.evaluate(pin=>{const g=window.__rayCityHost.game,t=g.world.terminals().find(t=>t.pin===pin);const path=g.movement.navigation.findPath(g.state.player,{x:t.position.x,z:t.position.z+.35},g.state);const corners=path.filter((v,i)=>i===0||i===path.length-1||Math.sign(v.x-path[i-1].x)!==Math.sign(path[i+1].x-v.x)||Math.sign(v.z-path[i-1].z)!==Math.sign(path[i+1].z-v.z));return corners;},pin);
  assert.ok(points.length,'reachable terminal '+pin);
  for(const point of points){for(let n=0;n<24;n++){
   const delta=await p.evaluate(point=>{const v=window.__rayCityHost.game.state.player;return {x:point.x-v.x,z:point.z-v.z};},point);if(Math.hypot(delta.x,delta.z)<.12)break;
   const keys=[];if(Math.abs(delta.x)>.07)keys.push(delta.x>0?'d':'a');if(Math.abs(delta.z)>.07)keys.push(delta.z>0?'s':'w');for(const k of keys)await p.keyboard.down(k);await p.waitForTimeout(Math.min(110,Math.max(22,Math.hypot(delta.x,delta.z)/2.6*800)));for(const k of keys)await p.keyboard.up(k);
  }}
  await p.keyboard.press('c');await p.waitForTimeout(30);const selected=await p.evaluate(()=>window.__rayCityHost.game.world.target()?.pin);assert.equal(selected,pin);
 }
 await walk('p3:1');await p.keyboard.press('e');assert.equal(await p.evaluate(()=>window.__rayCityHost.game.world.start),'p3:1');await walk('p1:1');await p.keyboard.press('e');await p.keyboard.press('f');assert.equal(await p.evaluate(()=>window.__rayCityHost.game.session.won),true,'keyboard-only repair with physical walking');
 assert.equal(await p.locator('dialog[open]').count(),0);await p.screenshot({path:out+'/gate-restored.png'});
 // Fixture placement isolates the selection/menu controls; the gate above uses physical keyboard walking.
 async function chooseTarget(id){for(let i=0;i<30;i++){if(await p.evaluate(()=>window.__rayCityHost.game.world.selected)===id)return;await p.keyboard.press('q');}throw Error('Target not reachable in selection cycle: '+id);}
 await p.keyboard.press('l');await p.locator('[data-story-action="mission:4"]').click();await p.locator('.story-world canvas').waitFor();await p.keyboard.press('Enter');await p.waitForTimeout(100);
 const bypass=await p.evaluate(()=>{const g=window.__rayCityHost.game,i=g.session.board.wires.findIndex(pair=>pair.includes('p2:0')&&pair.includes('p2:1')),r=g.world.routes.find(r=>r.index===i);g.state.player={...r.points[2]};return i;});await chooseTarget('wire:'+bypass);await p.keyboard.press('x');assert.equal(await p.evaluate(()=>window.__rayCityHost.game.session.board.wires.some(pair=>pair.includes('p2:0')&&pair.includes('p2:1'))),false,'X cuts exactly the highlighted bypass');
 await p.keyboard.press('l');await p.locator('[data-story-action="mission:1"]').click();await p.locator('.story-world canvas').waitFor();await p.keyboard.press('Enter');
 async function partOption(id,label){await p.evaluate(id=>{const g=window.__rayCityHost.game;g.state.player={...g.world.parts.find(d=>d.id===id).walk};},id);await p.waitForTimeout(40);await chooseTarget('part:'+id);await p.keyboard.press('e');await p.locator('.ray-world-choice').waitFor({state:'visible'});for(let i=0;i<12;i++){if((await p.locator('.ray-world-choice output').innerText())===label)break;await p.keyboard.press('ArrowRight');await p.waitForTimeout(30);}assert.equal(await p.locator('.ray-world-choice output').innerText(),label);await p.keyboard.press('Enter');}
 await partOption('p2','باز کردن کلید');await partOption('p3','خارج کردن مقاومت');await partOption('p3','24 Ω · 25 اعتبار');await partOption('p2','بستن کلید');const snapshot=await p.evaluate(()=>window.__rayCityHost.game.session.board.snapshot());await p.keyboard.press('m');assert.equal(await p.evaluate(()=>window.__rayCityHost.game.session.board.snapshot()),snapshot,'M never changes components');await p.keyboard.press('f');assert.equal(await p.evaluate(()=>window.__rayCityHost.game.session.won),true,'shop completed with keyboard component menu');
 for(let i=0;i<12;i++){
  await p.keyboard.press('l');await p.locator('[data-story-action="mission:'+i+'"]').click();await p.locator('.story-world canvas').waitFor();await p.keyboard.press('Enter');await p.waitForTimeout(80);
  const details=await p.evaluate(()=>{const g=window.__rayCityHost.game;return {parts:g.world.parts.length,terminals:g.scene.terminalViews.size,routes:g.world.routes.length,wires:g.session.board.wires.length,room:g.scene.room};});assert.equal(details.terminals,details.parts*2);assert.equal(details.routes,details.wires);assert.equal(details.room,null,'no inherited workshop');
 }
 for(const size of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  await p.setViewportSize(size);await p.waitForTimeout(120);await p.keyboard.press('h');await p.screenshot({path:out+'/board-'+size.width+'.png'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await p.locator('.ray-world-footer [data-story-action="interact"]').isVisible());
 }
 assert.deepEqual(errors,[]);console.log('PASS keyboard walking + solder connection + victory, all 12 rendered networks, no room or circuit popup, desktop and mobile layouts.');
}finally{await browser.close();}
