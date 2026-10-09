import assert from 'node:assert/strict';
import {adventures} from '../src/city/adventureData.js';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {renderUrbanSite} from '../src/city/UrbanSite.js';

for (let i=0;i<adventures.length;i++) {
  const s=new AdventureSession(i);
  const html=renderUrbanSite(s);
  assert.equal((html.match(/class="urban-brief-card"/g)||[]).length,3,`${s.mission.id}: three info cards`);
  assert.equal((html.match(/data-target="cabinet"/g)||[]).length,1,`${s.mission.id}: one cabinet CTA`);
  assert.ok(!html.includes('urban-site-actions'),`${s.mission.id}: legacy tab bar removed`);
  for (const value of [s.mission.request,s.mission.plate,s.mission.source]) assert.ok(html.includes(value),`${s.mission.id}: mission info is visible`);
}
console.log('PASS: city operations show fault report, equipment plate and source details together with one cabinet action.');
