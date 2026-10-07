import assert from 'node:assert/strict';
import {levels} from '../src/data/levels.js';
import {LessonSession} from '../src/lessons/LessonSession.js';
import {parseNumber} from '../src/lessons/Assessment.js';
import {Board,evaluate} from '../src/builder/Board.js';
for(const level of levels){
 const session=new LessonSession(level);
 assert.equal(session.result,null,level.id+' must start unchecked');
 if(level.type==='builder'){assert.equal(evaluate(new Board(),level.mission).ok,false);continue;}
 assert.equal(session.submit().ok,false,level.id+' rejects empty attempt');
 if(level.type==='basic'){session.basic.connected=[true,true,true];session.basic.switchClosed=true;assert.equal(session.result.ok,false);assert.equal(session.submit().ok,true);continue;}
 for(const field of level.fields)session.set(field.key,String(field.answer));
 assert.equal(session.result,null,'entering correct answers does not win');
 assert.equal(session.submit().ok,true,level.id+' accepts complete solution');
 const first=level.fields[0];session.set(first.key,first.options?first.options.find(([id])=>id!==first.answer)[0]:String(first.answer+1));
 assert.equal(session.result,null,'edit invalidates victory');assert.equal(session.submit().ok,false,level.id+' rejects wrong answer');
 assert.equal(new LessonSession(level).result,null,'reset never pre-solves');
}
const signature=level=>JSON.stringify({type:level.type,diagram:level.diagram,description:level.description,fields:level.fields,hint:level.hint,explanation:level.explanation});
const exactSignatures=new Set(levels.map(signature));
assert.equal(exactSignatures.size,levels.length,'every stage must have unique content');
for(const topic of new Set(levels.map(level=>level.topicId))){
 const topicLevels=levels.filter(level=>level.topicId===topic);
 const normalize=value=>String(value??'').replace(/[۰-۹0-9]+/g,'#').replace(/\s+/g,' ');
 const templates=new Set(topicLevels.map(level=>normalize(level.description)+'|'+JSON.stringify((level.fields??[]).map(field=>[field.key,field.label,field.unit,field.options?.map(option=>option[0])]))) );
 assert.equal(templates.size,topicLevels.length,`${topic} must not reuse the same exercise template`);
}
assert.equal(parseNumber('−۸'),-8);assert.equal(parseNumber('۰٫۱۲۵'),0.125);assert.equal(parseNumber('Infinity'),null);assert.equal(parseNumber(''),null);assert.equal(parseNumber('جواب'),null);
// Independently verify the harder answer sets against circuit equations.
const answers=id=>Object.fromEntries(levels.find(l=>l.id===id).fields.map(f=>[f.key,f.answer]));
const n=answers('k3');assert.equal((37-n.va)/4,n.va/6+(n.va-n.vb)/2);assert.equal((n.va-n.vb)/2,n.vb/3);assert.equal(n.iab,(n.va-n.vb)/2);
const m=answers('k4');assert.equal(4*m.i1-2*m.i2,12);assert.equal(-2*m.i1+4*m.i2,-3);assert.equal(m.shared,m.i1-m.i2);
const mix=answers('a3');assert.equal(mix.req,4+1/(1/6+1/3));assert.equal(mix.source,18/mix.req);assert.equal(mix.va,18-4*mix.source);assert.equal(mix.i2+mix.i3,mix.source);
const k=answers('k2');assert.equal(18-6-(4+2)*k.current,0);
console.log(`PASS: ${levels.length} stages start unsolved; blanks, incorrect/correct answers, explicit submission, reset, Persian numbers and independent KCL/KVL equations.`);
