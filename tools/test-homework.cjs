'use strict';
// test-v2 compiles the shared catalog first.
const assert=require('node:assert/strict');
const {CATALOG,ALL_LEVELS}=require('../qa/v2-test/Catalog.js');
const {Puzzle}=require('../qa/v2-test/Puzzle.js');
const {addHomework,saveHomework,restoreHomework}=require('../qa/v2-test/Homework.js');
const {validateQuestion,validate}=require('../server/content/schema.cjs');
const seed=require('../server/content/seed.json');
const homework=ALL_LEVELS.filter(l=>l.homework);
assert.equal(homework.length,576);
for(const c of CATALOG.filter(c=>c.curriculum&&['chinese','math','english'].includes(c.subject))){
 const tasks=c.levels.filter(l=>l.homework);assert.equal(tasks.length,c.subject==='chinese'?4:3,c.id);
 for(const l of tasks){assert.equal(l.homework.origin,'original-followup');assert.ok(l.homework.sourceLevelIds.every(id=>c.levels.some(source=>source.id===id&&!source.homework)),l.id+' same-chapter source');}
 assert.equal(c.levels.filter(l=>l.evidence).length,6,c.id+' core evidence retained');
}
for(const subject of ['chinese','math','english'])for(let grade=1;grade<=6;grade++)for(const semester of ['上册','下册']){
 const units=CATALOG.filter(c=>c.subject===subject&&c.grade===grade&&c.curriculum?.semester===semester),tasks=units.flatMap(c=>c.levels).filter(l=>l.homework);
 assert.ok(units.length>0);assert.equal(tasks.length,units.length*(subject==='chinese'?4:3),`${subject} ${grade} ${semester}`);
}
const before=ALL_LEVELS.length;addHomework(CATALOG);assert.equal(CATALOG.flatMap(c=>c.levels).length,before,'idempotent generation');
for(const level of homework){
 const p=new Puzzle(level);assert.equal(p.correct(),false);assert.ok(level.kind==='draw'||p.pendingGuide());
 if(level.kind==='cloze'){
  level.fields.forEach((f,i)=>p.setField(i,'wrong-answer'));assert.equal(p.correct(),false);
  level.fields.forEach((f,i)=>p.setField(i,'  '+f.answers[0].toUpperCase()+'  '));assert.equal(p.correct(),true);
  p.setField(0,'');assert.ok(p.pendingGuide());assert.equal(p.correct(),false);
 }
 if(level.kind==='highlight'){
  assert.equal(level.tokens.join(''),CATALOG.find(c=>c.levels.includes(level)).levels.find(l=>l.id===level.homework.sourceLevelIds[0]).passage,'original punctuation and quotes retained');
  level.markedAnswer.forEach(i=>p.toggleMark(i));assert.equal(p.correct(),true);
  p.toggleMark(level.markedAnswer[0]);assert.equal(p.correct(),false);
 }
 if(level.kind==='compose'){
  p.setWriting(' '.repeat(50));assert.equal(p.writingReady(),false);assert.equal(p.toggleWritingCheck(0),false);
  p.setWriting(level.writing.example.repeat(10));assert.ok(p.input.length<=level.writing.maxLength);assert.equal(p.correct(),false);
  level.writing.checks.forEach((_,i)=>p.toggleWritingCheck(i));assert.equal(p.correct(),true);
  p.setWriting(p.input+'x');assert.equal(p.correct(),false,'editing invalidates self-review');
 }
}
const errors=validate(seed).errors;assert.deepEqual(errors,[]);
for(const kind of ['highlight','cloze','compose']){
 const q=structuredClone(seed.questions.find(q=>q.data.kind===kind));
 if(kind==='highlight')q.data.markedAnswer=[999];if(kind==='cloze')q.data.fields[0].answers=[];if(kind==='compose')q.data.writing.maxLength=0;
 assert.ok(validateQuestion(q).length,'invalid '+kind+' rejected');
}
const bad=structuredClone(seed),chapter=bad.chapters.find(c=>c.bindings.some(b=>b.id.includes('.hw.'))),binding=chapter.bindings.find(b=>b.id.includes('.hw.'));
bad.questions.find(q=>q.id===binding.questionId).data.homework.sourceLevelIds=['different.chapter'];assert.ok(validate(bad).errors.some(e=>e.id===binding.id));
const notebook=new Map(),port={getItem:k=>notebook.get(k)||null,setItem:(k,v)=>notebook.set(k,v)};
for(const kind of ['cloze','highlight','compose']){
 const l=homework.find(l=>l.kind===kind),p=new Puzzle(l);
 if(kind==='compose'){p.setWriting(l.writing.example.repeat(5));l.writing.checks.forEach((_,i)=>p.toggleWritingCheck(i));}
 if(kind==='cloze')l.fields.forEach((f,i)=>p.setField(i,f.answers[0]));if(kind==='highlight')l.markedAnswer.forEach(i=>p.toggleMark(i));
 assert.equal(saveHomework(p,port),true);const resumed=new Puzzle(l);restoreHomework(resumed,port);assert.equal(resumed.correct(),true,'saved '+kind+' evidence resumes');
 const damaged={getItem:()=>'{',setItem:()=>{throw Error('full');}};assert.doesNotThrow(()=>restoreHomework(new Puzzle(l),damaged));assert.equal(saveHomework(p,damaged),false);
}
console.log('PASS homework: 576 follow-ups across 18 subject/grade pairs and both semesters, in-chapter sources, no duplicate injection, wrong/empty/edited states, evidence retained, punctuation and schema rejection');
