import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-artifacts',{recursive:true});
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.STORY_TEST_URL||'http://localhost:4173/';
 await page.goto(new URL('/tests/fixtures/components.html',base).href);await page.waitForFunction(()=>window.fixtureResult);
 const result=await page.evaluate(()=>window.fixtureResult);assert.deepEqual(result.errors,[]);assert.deepEqual(errors,[]);
 await page.screenshot({path:'.test-artifacts/components-catalog.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log('PASS component browser: '+result.count+' presets build, update and dispose; no page errors; no mobile overflow.');
}finally{await browser.close();}
