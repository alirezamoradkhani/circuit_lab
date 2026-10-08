import assert from 'node:assert/strict';
import {AdventureSession} from '../src/city/AdventureSession.js';
import {renderAdventure} from '../src/city/AdventureView.js';
import {sceneMessage} from '../src/city/SceneMessage.js';

for(let i=0;i<5;i++){
  const s=new AdventureSession(i);s.panel=true;s.messageTarget='result';s.resultTone='error';s.message='نتیجهٔ آزمایش';
  assert.equal(sceneMessage(s,true),'','test feedback must never be hidden in cabinet');
  assert.match(sceneMessage(s),/result-error/);
  assert.match(renderAdventure(s),/data-action="expand-circuit"/);
  s.circuitExpanded=true;
  const modal=renderAdventure(s);
  assert.equal((modal.match(/class="cabinet-panel"/g)||[]).length,1,'only one editable instance');
  assert.match(modal,/<dialog class="circuit-dialog"/);
  assert.match(modal,/data-action="close-circuit"/);
  assert.ok(!modal.includes('with-cabinet'),'scene is not squeezed behind popup');
  s.circuitExpanded=false;s.resultTone='success';assert.match(sceneMessage(s),/result-success/);
  s.resultTone='info';assert.match(sceneMessage(s),/result-info/);
}
console.log('PASS: scene result placement, semantic result colors and one editable modal across all five missions.');
