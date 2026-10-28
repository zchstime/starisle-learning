'use strict';
// Run after test-v2, which transpiles the pure game modules into qa/v2-test.
const assert=require('node:assert/strict'),path=require('node:path');
const {applyContent}=require('../qa/v2-test/ContentRuntime.js'),{Progress}=require('../qa/v2-test/Progress.js'),{SUBJECTS}=require('../qa/v2-test/Subjects.js'),{CATALOG}=require('../qa/v2-test/Catalog.js');
const {compile}=require('../server/content/schema.cjs'),seed=require('../server/content/seed.json');
const next=structuredClone(seed),q={id:'astro.q1',subject:'astro',grade:2,knowledge:'天体',status:'active',data:{kind:'number',title:'探索',goal:'1+1',target:2,hint:'相加',explanation:'2'}};
next.subjects.push({id:'astro',name:'天文',art:'planet',order:11,status:'active'});next.questions.push(q);next.chapters.push({id:'astro.c1',subject:'astro',grade:2,title:'天体',topic:'天体',art:'planet',alignment:'theme',status:'active',bindings:[{id:'astro.l1',questionId:q.id}]});
const live={release:2,...compile(next)};applyContent(live);assert.ok(SUBJECTS.some(s=>s.id==='astro'));assert.ok(CATALOG.some(c=>c.id==='astro.c1'));
let saved=null;const store={getItem:()=>saved,setItem:(_,v)=>saved=v},p=new Progress(store);p.subject='astro';p.grade=2;p.chapter=0;p.complete('astro.l1');const points=p.points;assert.equal(JSON.parse(saved).chapterId,'astro.c1');
const rollback={release:3,...compile(seed,{levelIds:live.knownLevelIds,chapterIds:live.knownChapterIds,subjectIds:live.knownSubjectIds})};applyContent(rollback);const restored=new Progress(store);assert.equal(restored.points,points);assert.ok(restored.done.includes('astro.l1'));assert.ok(restored.earnedMedals.includes('chapter:astro.c1'));assert.equal(restored.subject,'math');restored.save();assert.ok(JSON.parse(saved).done.includes('astro.l1'));
const incompatible={...live,requiredModules:[{id:'unknown',version:1}]};assert.throws(()=>applyContent(incompatible));assert.equal(SUBJECTS.length,11,'incompatible update is atomic');
// Reordering chapters must retain the same selected chapter.
applyContent({release:4,...compile(seed)});const original=new Progress(store);original.subject='math';original.grade=2;original.chapter=3;original.save();const selected=JSON.parse(saved).chapterId;const reordered=structuredClone(seed);reordered.chapters.reverse();applyContent({release:5,...compile(reordered)});const after=new Progress(store);assert.equal(CATALOG.filter(c=>c.subject==='math'&&c.grade===2)[after.chapter].id,selected);
console.log('PASS runtime: dynamic subjects, version compatibility, atomic rejection, rollback keeps completion/medals/points, stable selected chapter after reorder');
