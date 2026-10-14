import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const action=id=>p.locator('[data-story-action="'+id+'"]').click();
const object=id=>p.locator('[data-story-object="'+id+'"]');
const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('circuit-lab.story.campaign.v1')).levels['03-market']);
const entity=(s,id)=>s.world.entities.find(e=>e.id===id).state;
async function settle(){await p.waitForTimeout(1700);return state();}
async function point(x,z,y=.5){return p.evaluate(async({x,z,y})=>{const T=await import('/src/campaign/engine/three.js'),r=document.querySelector('.story-world canvas').getBoundingClientRect(),a=r.width/r.height,h=Math.max(7.3,9.4/a),c=new T.OrthographicCamera(-h*a,h*a,h,-h,.1,100);c.position.set(8,13.7,19);c.lookAt(0,.7,0);c.updateMatrixWorld();const v=new T.Vector3(x,y,z).project(c);return {x:r.x+(v.x*.5+.5)*r.width,y:r.y+(-v.y*.5+.5)*r.height};},{x,z,y});}
async function mesh(x,z,y){const q=await point(x,z,y);await p.mouse.click(q.x,q.y);}
try{
 await p.goto('http://localhost:4173/tests/fixtures/legacy-city.html#workshop');await action('levels');await action('stage:3');await action('begin');
 let before=await settle();await mesh(-2,0,.6);await p.waitForSelector('[data-story-action="op:fan-direction"]');
 let after=await settle();assert.deepEqual(entity(after,'ray').position,entity(before,'ray').position,'selection must not force movement');
 await action('op:fan-direction');await p.waitForFunction(()=>JSON.parse(localStorage.getItem('circuit-lab.story.campaign.v1')).levels['03-market'].world.entities.find(e=>e.id==='fan').state.direction===0);after=await state();assert.notDeepEqual(entity(after,'ray').position,entity(before,'ray').position,'remote command must walk then execute');
 await action('cable');await object('supply').waitFor({state:'visible'});await object('fan').waitFor({state:'visible'});const a=await object('supply').boundingBox(),z=await object('fan').boundingBox();
 await p.mouse.move(a.x+22,a.y+22);await p.mouse.down();await p.mouse.move(z.x+22,z.y+22,{steps:12});
 assert.equal(await p.locator('.campaign-cable-draft').isVisible(),true);assert.equal(await p.locator('.campaign-cable-draft').getAttribute('data-valid'),'true');await p.screenshot({path:'.test-artifacts/interaction-cable-preview.png'});await p.mouse.up();
 assert.equal((await settle()).world.connections.some(([id,c])=>id==='fan'&&c.source==='supply'),true);
 await object('supply').click();await object('fan').click();assert.equal((await settle()).world.connections.some(([id])=>id==='fan'),true,'repeat does not disconnect');
 await action('unplug:fan');assert.equal((await settle()).world.connections.some(([id])=>id==='fan'),false);
 const sourceMesh=await point(-5,-2.5,.85),fanMesh=await point(-2,0,1.25);await p.mouse.move(sourceMesh.x,sourceMesh.y);await p.mouse.down();await p.mouse.move(fanMesh.x,fanMesh.y,{steps:10});await p.mouse.up();assert.equal((await settle()).world.connections.some(([id,c])=>id==='fan'&&c.source==='supply'),true,'direct model drag must connect');await action('unplug:fan');
 await object('supply').click();await object('battery').click();assert.match(await p.locator('.story-bubble').innerText(),/دو منبع/);assert.equal(await p.locator('[data-story-object="supply"]').evaluate(e=>e.classList.contains('cable-origin')),true);await p.keyboard.press('Escape');await p.locator('.campaign-cable-draft').waitFor({state:'hidden'});
 await action('meter');before=await settle();await object('fan').click();after=await settle();assert.deepEqual(after.world.connections,before.world.connections);assert.deepEqual(entity(after,'ray').position,entity(before,'ray').position);
 await action('hand');await mesh(-2,0,.6);await p.screenshot({path:'.test-artifacts/interaction-inspector-desktop.png'});
 assert.deepEqual(errors,[]);console.log('PASS actual mouse: inspect without walking, queued command, drag cable preview/commit, duplicate, explicit unplug, invalid source, Escape, read-only meter.');
}finally{await b.close();}
