import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

await mkdir('.test-artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const action=name=>page.locator(`[data-action="${name}"]`).click();
const click=selector=>page.locator(selector).click();
async function checkDiagram(){
 const problems=await page.locator('.city-schematic').evaluate(svg=>{
  const result=[],box=svg.getBoundingClientRect(),parent=svg.parentElement.getBoundingClientRect();
  if(box.left<parent.left-1||box.right>parent.right+1)result.push('diagram clipped');
  for(const g of svg.querySelectorAll('.schematic-part')){
   const card=g.querySelector('rect').getBBox();
   for(const text of g.querySelectorAll('text')){
    const b=text.getBBox();
    if(b.x<card.x||b.x+b.width>card.x+card.width||b.y<card.y||b.y+b.height>card.y+card.height)result.push(text.textContent+' outside its card');
   }
  }
  return result;
 });
 assert.deepEqual(problems,[]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}
try{
 await page.goto('http://localhost:4173/tests/fixtures/legacy-city.html#city');
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const [index,id] of [[5,'backup'],[6,'pumps'],[7,'radio'],[8,'feeder'],[9,'isolation'],[10,'transfer'],[11,'bridge']]){
   await click(`.city-map [data-mission="${index}"]`);await click('[data-target="cabinet"]');
   await checkDiagram();
   await click('[data-tool="meter"]');await click('[data-measure-part="p1"]');
   assert.equal(await page.locator('.component-meter output').innerText(),'12.00 V');
   await action('expand-circuit');await checkDiagram();
   await page.locator('[data-measure-part="p2"]').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('.component-meter output').innerText(),'0.00 V');
   if(viewport.width!==844)await page.screenshot({path:`.test-artifacts/schematic-${id}-popup-${viewport.width}.png`,fullPage:true});
   await click('dialog [aria-label="بستن نمای بزرگ"]');await action('map');
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await click('.city-map [data-mission="5"]');await click('[data-target="cabinet"]');
 await click('[data-tool="inspect"]');
 await click('.cabinet-panel [data-challenge="1"][data-value="2"]');await click('.cabinet-panel [data-challenge="2"][data-value="1"]');
 await action('test');await click('[data-tool="meter"]');await click('[data-measure-part="p2"]');
 assert.equal(await page.locator('[data-measure-part="p2"] .schematic-value').textContent(),'قطع');
 assert.equal(await page.locator('.component-meter output').innerText(),'12.00 V');
 assert.deepEqual(errors,[]);
 console.log('PASS seven schematics at desktop/mobile/landscape: full diagram visible, labels inside cards, click/keyboard metering, real tripped protector state.');
}finally{await browser.close();}
