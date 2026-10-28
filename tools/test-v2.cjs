const fs=require('fs'),path=require('path'),assert=require('assert/strict');const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const out=path.resolve('qa/v2-test');fs.mkdirSync(out,{recursive:true});
for(const f of ['OtherCurriculum','SubjectStories','Subjects','StarterContent','ExpansionContent','ChallengeContent','MathCurriculum','MathRoute','LearningRoute','EnglishCurriculum','ChineseCurriculum','Catalog','ContentRuntime','Puzzle','Progress','AudioKey'])fs.writeFileSync(path.join(out,f+'.js'),ts.transpileModule(fs.readFileSync('assets/scripts/adventure/'+f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText);
fs.mkdirSync(path.resolve('qa/exam'),{recursive:true});fs.writeFileSync(path.resolve('qa/exam/Exam.js'),ts.transpileModule(fs.readFileSync('assets/scripts/exam/Exam.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText);
fs.writeFileSync('qa/exam/RoutePapers.js',ts.transpileModule(fs.readFileSync('assets/scripts/exam/RoutePapers.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText);
const {CATALOG,ALL_LEVELS,chapters}=require(path.join(out,'Catalog.js'));const {Puzzle}=require(path.join(out,'Puzzle.js'));const {Progress,SAVE_KEY}=require(path.join(out,'Progress.js'));
assert.equal(CATALOG.length,444);assert.equal(ALL_LEVELS.length,1872);assert.equal(new Set(ALL_LEVELS.map(l=>l.id)).size,1872);
for(let g=1;g<=6;g++){assert.equal(chapters('math',g).length,18);assert.equal(chapters('english',g).length,16);}
for(const l of ALL_LEVELS){const p=new Puzzle(l);assert.equal(p.correct(),false,l.id+' starts incomplete');
 if(l.kind==='number'){p.input=String((l.target+1)/(l.scale||1));assert.equal(p.correct(),false);p.input=String(l.target/(l.scale||1));}
 if(l.kind==='cargo'){assert.equal(p.add(-1),false);let rest=l.target;for(const u of [...l.units].sort((a,b)=>b-a))while(rest>=u){assert.ok(p.add(u),l.id+' capacity');rest-=u;}assert.equal(rest,0,l.id+' representable');assert.equal(p.value,l.target);const old=p.value;assert.equal(p.remove(-1),false);assert.equal(p.value,old);}
 if(l.kind==='groups'){assert.equal(p.plant(-1,1),false);for(let i=0;i<l.groups;i++)for(let n=0;n<l.target;n++)p.plant(i,1);assert.equal(p.plant(0,2),false);}
 if(l.kind==='tiles'){assert.equal(p.toggle(-1),false);for(let i=0;i<l.target;i++)p.toggle(i);assert.equal(p.toggle(l.cells),false);}
 if(l.kind==='sentence'){const used=new Set();for(const word of l.answer){const i=l.words.findIndex((w,i)=>w===word&&!used.has(i));assert.ok(i>=0);used.add(i);assert.equal(p.word(i),true);assert.equal(p.word(i),false);}}
 if(l.kind==='listen'||l.kind==='choice'){p.choice=(l.target+1)%l.options.length;assert.equal(p.correct(),false);p.choice=l.target;}
 assert.equal(p.correct(),true,l.id+' solution');
}
let raw=null;const store={getItem:()=>raw,setItem:(_,v)=>raw=v};const p=new Progress(store);assert.equal(p.complete('invalid'),false);p.complete(ALL_LEVELS[0].id);p.complete(ALL_LEVELS[0].id);assert.equal(p.done.length,1);p.subject='english';p.grade=6;p.chapter=2;p.save();const reload=new Progress(store);assert.deepEqual(reload.done,p.done);assert.equal(reload.grade,6);assert.equal(reload.chapter,2);assert.equal(reload.subject,'english');
raw=JSON.stringify({version:3,done:['bogus',ALL_LEVELS[0].id,ALL_LEVELS[0].id],grade:99,chapter:99});const corrupt=new Progress(store);assert.equal(corrupt.grade,2);assert.equal(corrupt.chapter,0);assert.equal(corrupt.done.length,1);
const fail=new Progress({getItem:()=>'{',setItem:()=>{throw Error('disk');}});fail.complete(ALL_LEVELS[0].id);assert.equal(fail.failed,true);assert.equal(fail.done.length,1);
console.log('PASS 1872 playable level instances: valid IDs, solvability, exact targets, interactions, save isolation, duplicate rewards, corrupt/failed storage');

const {SUBJECTS}=require(path.join(out,'Subjects.js'));for(const sub of SUBJECTS)for(let grade=1;grade<=6;grade++){assert.ok(chapters(sub.id,grade).length);const p=new Progress(store);p.subject=sub.id;p.grade=grade;p.chapter=0;p.save();assert.equal(new Progress(store).subject,sub.id);}
const {shuffled}=require(path.join(out,'Puzzle.js'));for(let len=2;len<10;len++){const order=shuffled(len,()=>.4);assert.equal(new Set(order).size,len);assert.equal(order.length,len);assert.ok(order.every(n=>n>=0&&n<len));assert.notDeepEqual(order,Array.from({length:len},(_,i)=>i));}
console.log('PASS all 11 subjects × 6 grades survive reload; shuffled choices preserve identity');

// Grade completion must include every chapter, even if the player visits the last one first.
for(const sub of SUBJECTS){
 let saved=null;const port={getItem:()=>saved,setItem:(_,v)=>saved=v};const p=new Progress(port);p.subject=sub.id;p.grade=1;p.chapter=0;
 const list=chapters(sub.id,1);assert.equal(list.length,sub.id==='math'?18:sub.id==='english'?16:sub.id==='chinese'?8:4);
 const last=list[list.length-1];for(const l of last.levels)p.complete(l.id);
 assert.equal(p.chapterComplete(last.id),true);assert.equal(p.medalCount,1);assert.equal(p.advanceGrade(),false);assert.equal(p.nextUnfinished().chapter,sub.id==='math'?6:sub.id==='english'?4:sub.id==='chinese'?2:2);
 const pending=list.slice(0,-1).flatMap(c=>c.levels);for(const l of pending.slice(0,-1))p.complete(l.id);
 assert.equal(p.gradeStatus().complete,false);assert.equal(p.advanceGrade(),false);
 p.complete(pending[pending.length-1].id);assert.equal(p.gradeStatus().complete,true);assert.equal(p.medalCount,list.length+1);
 const earned=p.medalCount;p.complete(pending[0].id);assert.equal(p.medalCount,earned);
 const restored=new Progress(port);assert.equal(restored.medalCount,earned);assert.equal(restored.advanceGrade(),true);assert.equal(restored.grade,2);assert.equal(restored.chapter,sub.id==='math'?6:sub.id==='english'?4:sub.id==='chinese'?2:2);assert.equal(restored.subject,sub.id);assert.equal(new Progress(port).grade,2);
 restored.grade=6;restored.chapter=0;for(const c of chapters(sub.id,6))for(const l of c.levels)restored.complete(l.id);
 assert.equal(restored.advanceGrade(),false);assert.equal(restored.grade,6);assert.equal(restored.subjectComplete(),false);
 for(let grade=2;grade<=5;grade++)for(const c of chapters(sub.id,grade))for(const l of c.levels)restored.complete(l.id);
 assert.equal(restored.subjectComplete(),true);assert.equal(restored.medalCount,CATALOG.filter(c=>c.subject===sub.id).length+6+1);
 assert.equal(new Progress(port).medalCount,restored.medalCount);
}
// A previously completed later grade must not be silently skipped in one transition.
let journeyRaw=null;const journeyStore={getItem:()=>journeyRaw,setItem:(_,v)=>journeyRaw=v};const journey=new Progress(journeyStore);journey.grade=1;
for(const grade of [1,2])for(const c of chapters('math',grade))for(const l of c.levels)journey.complete(l.id);
assert.equal(journey.advanceGrade(),true);assert.equal(journey.grade,2);
// Existing v3 save IDs survive the expanded catalog unchanged.
const legacyIds=['math.g2.c2.l1','math.g6.c3.l1','english.g1.c1.l1','science.g1.c1.l1'];
const legacy=new Progress({getItem:()=>JSON.stringify({version:3,subject:'math',grade:6,chapter:0,sound:false,done:legacyIds}),setItem:()=>{}});
assert.deepEqual(legacy.done,legacyIds);assert.equal(legacy.sound,false);
console.log('PASS every subject: out-of-order completion, grade gates, unique medals, reload, grade 6 cap, legacy saves');

// Earned medals survive future curriculum additions while new tasks still gate progression.
const evolvingStore={getItem:()=>null,setItem:()=>{}};const evolving=new Progress(evolvingStore);evolving.grade=1;
for(const c of chapters('math',1))for(const l of c.levels)evolving.complete(l.id);
const earnedBefore=evolving.medalCount;let durable=null;evolving.store={getItem:()=>durable,setItem:(_,v)=>durable=v};evolving.save();
const grow=chapters('math',1)[0];grow.levels.push({...grow.levels[0],id:'math.g1.c1.future-test'});
const evolved=new Progress({getItem:()=>durable,setItem:()=>{}});assert.equal(evolved.gradeStatus().complete,false);assert.equal(evolved.hasGradeMedal('math',1),true);assert.equal(evolved.medalCount,earnedBefore);assert.equal(evolved.advanceGrade(),false);grow.levels.pop();
const filteredMedals=new Progress({getItem:()=>JSON.stringify({version:3,medals:['invalid','grade:math:1','grade:math:1']}),setItem:()=>{}});assert.deepEqual(filteredMedals.earnedMedals,['grade:math:1']);
console.log('PASS durable medal ledger: content additions preserve awards; unknown/duplicate medal IDs filtered');

for(let grade=1;grade<=6;grade++){
 const lessons=chapters('math',grade)[5].levels;
 assert.deepEqual(lessons.map(l=>l.stage),['warmup','practice','challenge']);
 for(const l of lessons){assert.equal(l.coachHints.length,2);assert.ok(l.coachHints.every(t=>typeof t==='string'&&t.length>5));}
 const final=lessons[2];const p=new Puzzle(final);assert.match(p.feedback(),/不够/);
 if(final.maxBlocks){
  // Construct the right quantity with inefficient blocks: do not award a pass.
  let rest=final.target;for(const value of [...final.units].sort((a,b)=>b-a))while(rest>=value){p.add(value);rest-=value;}
  const large=p.cargo[0];p.remove(0);for(let i=0;i<large/final.units[0];i++)assert.equal(p.add(final.units[0]),true);
  assert.equal(p.value,final.target,final.id);assert.equal(p.correct(),false);assert.match(p.feedback(),/数量对了/);
  p.cargo=[];let remain=final.target;for(const value of [...final.units].sort((a,b)=>b-a))while(remain>=value){p.add(value);remain-=value;}
  assert.equal(p.correct(),true);assert.ok(p.cargo.length<=final.maxBlocks);
  p.add(final.units[0]);assert.equal(p.correct(),false);assert.match(p.feedback(),/多/);
 }
}
console.log('PASS graded missions: warmup/practice/challenge, coach hints, quantity vs block-budget validation');

const {mathRoute,routeUnlocked,routeNext,ROUTE_PAGE_SIZE}=require(path.join(out,'MathRoute.js'));
for(let grade=1;grade<=6;grade++){
 const route=mathRoute(grade);assert.equal(route.length,90);assert.equal(ROUTE_PAGE_SIZE,12);assert.equal(route[0].chapter,6);assert.equal(routeNext(route,[]),0);assert.equal(routeUnlocked(route,[],0),true);assert.equal(routeUnlocked(route,[],1),false);assert.equal(routeUnlocked(route,[],89),false);assert.equal(routeUnlocked(route,[],-1),false);
 const done=[];for(let i=0;i<route.length;i++){assert.equal(routeUnlocked(route,done,i),true);assert.equal(routeNext(route,done),i);done.push(route[i].task.id);}
 assert.equal(routeNext(route,done),-1);const hole=done.filter(id=>id!==route[2].task.id);assert.equal(routeNext(route,hole),2);assert.equal(routeUnlocked(route,hole,2),true);assert.equal(routeUnlocked(route,hole,20),true);assert.equal(routeUnlocked(route,[route[20].task.id],21),false);
 const p=new Progress({getItem:()=>null,setItem:()=>{}});p.grade=grade;for(const s of route.slice(0,5))p.complete(s.task.id);assert.equal(p.chapterComplete(route[0].unit.id),false);p.complete(route[5].task.id);assert.equal(p.chapterComplete(route[0].unit.id),true);assert.equal(p.medalCount,1);p.complete(route[5].task.id);assert.equal(p.medalCount,1);assert.equal(p.nextUnfinished().chapter,7);
 for(const s of route.filter(s=>s.unit.curriculum)){
  assert.ok(s.task.coachHints.length===2);if(s.task.kind==='number'){const puzzle=new Puzzle(s.task);for(const v of ['', '.', '-', '1.2.3','NaN']){puzzle.input=v;assert.equal(puzzle.correct(),false);}puzzle.input=String(s.task.target/(s.task.scale||1));assert.equal(puzzle.correct(),true);}
 }
}
console.log('PASS 6 math routes × 90 stops: sequential unlock, pages, legacy replays, missing-stop recovery, six-stop milestone, duplicate medal protection and numeric input');
for(const c of CATALOG.filter(c=>c.curriculum)){
 assert.equal(new Set(c.levels.map(l=>JSON.stringify([l.goal,l.visual,l.voice,l.passage]))).size,c.levels.length,c.id+' distinct tasks');
 for(const l of c.levels)if(l.kind==='choice')assert.equal(new Set(l.options).size,l.options.length,l.id+' unique options');
}
console.log('PASS new curriculum: distinct task prompts/models and unique choice cards');

const {learningRoute}=require(path.join(out,'LearningRoute.js'));
for(let grade=1;grade<=6;grade++){
 const route=learningRoute('english',grade);assert.equal(route.length,84);assert.equal(route[0].chapter,4);
 const done=[];for(let i=0;i<84;i++){assert.equal(routeUnlocked(route,done,i),true);if(i<83)assert.equal(routeUnlocked(route,done,i+1),false);done.push(route[i].task.id);}
 const progress=new Progress({getItem:()=>null,setItem:()=>{}});progress.subject='english';progress.grade=grade;
 for(const stop of route.slice(0,6))progress.complete(stop.task.id);
 assert.equal(progress.medalCount,1);assert.equal(progress.nextUnfinished().chapter,5);
 progress.complete(route[5].task.id);assert.equal(progress.medalCount,1);
 for(const stop of route.filter(s=>s.unit.curriculum)){assert.equal(stop.unit.alignment,grade<3?'enrichment':'verified-theme');assert.ok(stop.task.voice);if(stop.task.kind==='choice')assert.ok(stop.task.passage);}
}
console.log('PASS English 6 × 84 routes: sequential unlock, six-task medals, progression and explicit alignment');

// Chinese series: independent grade content, six-stop awards and safe migration.
const {CHINESE_STORIES}=require(path.join(out,'ChineseCurriculum.js'));
const newStories=CATALOG.filter(c=>c.subject==='chinese'&&c.curriculum);
assert.equal(newStories.length,36);assert.equal(new Set(newStories.map(c=>c.levels[4].passage)).size,36);
for(let grade=1;grade<=6;grade++){
 const route=learningRoute('chinese',grade);assert.equal(route.length,42);assert.equal(route[0].chapter,2);
 assert.equal(CHINESE_STORIES[grade-1].length,6);
 const progress=new Progress({getItem:()=>null,setItem:()=>{}});progress.subject='chinese';progress.grade=grade;
 for(let i=0;i<route.length;i++){
  assert.equal(routeUnlocked(route,progress.done,i),true);
  if(i+1<route.length)assert.equal(routeUnlocked(route,progress.done,i+1),false);
  const stop=route[i];if(stop.unit.curriculum){assert.equal(stop.unit.alignment,'theme');assert.equal(stop.unit.curriculum.verified,false);assert.ok(stop.task.coachHints.length===2);}
  if(i%6===0&&i<36)assert.equal(progress.chapterComplete(stop.unit.id),false);
  progress.complete(stop.task.id);
  if(i%6===5&&i<36)assert.equal(progress.chapterComplete(stop.unit.id),true);
 }
 assert.equal(progress.gradeStatus().complete,true);assert.ok(progress.hasGradeMedal('chinese',grade));
 const medals=progress.medalCount;progress.complete(route[5].task.id);assert.equal(progress.medalCount,medals);
 assert.equal(progress.advanceGrade(),grade<6);assert.equal(progress.grade,Math.min(grade+1,6));
}
for(const c of newStories){
 assert.deepEqual(c.levels.map(l=>l.stage),['warmup','warmup','practice','practice','challenge','challenge']);
 for(const l of c.levels){if(l.kind==='sentence'){assert.ok(l.words.length<=4);assert.ok(l.words.every(w=>w.length<=24));}if(l.passage){assert.ok(l.passage.length<150);assert.equal(l.voice,l.passage);}}
}
console.log('PASS Chinese: 216 original tasks, 36 stories, six grade routes, locked stops, milestone/grade awards, auto-advance and concise reading layout limits');

// Every remaining subject now has distinct grade-specific missions and the same durable route rules.
const {otherCurriculum,OTHER_SUBJECTS}=require(path.join(out,'OtherCurriculum.js'));
const other=otherCurriculum();assert.equal(other.length,96);assert.equal(new Set(other.map(c=>c.title)).size,96);
for(const subject of OTHER_SUBJECTS)for(let grade=1;grade<=6;grade++){
 const route=learningRoute(subject,grade);assert.equal(route.length,12);assert.equal(route[0].chapter,2);
 assert.equal(routeUnlocked(route,[],1),false);assert.equal(routeUnlocked(route,[],0),true);
 const p=new Progress({getItem:()=>null,setItem:()=>{}});p.subject=subject;p.grade=grade;
 for(const s of route.slice(0,3))p.complete(s.task.id);
 assert.equal(p.medalCount,1);assert.equal(p.nextUnfinished().chapter,3);assert.equal(routeUnlocked(route,p.done,3),true);
 assert.equal(routeUnlocked(route,p.done,4),false);p.complete(route[2].task.id);assert.equal(p.medalCount,1);
 for(const s of route.slice(3))p.complete(s.task.id);assert.equal(p.gradeStatus().complete,true);assert.equal(p.medalCount,5);
 assert.equal(p.advanceGrade(),grade<6);assert.equal(p.grade,Math.min(6,grade+1));
 for(const c of other.filter(c=>c.subject===subject&&c.grade===grade)){
  assert.equal(c.curriculum.verified,false);assert.equal(c.alignment,'enrichment');
  for(const l of c.levels){assert.ok(l.voice);assert.ok(l.goal.length<70);if(l.words){assert.ok(l.words.length<=4);assert.ok(l.words.every(w=>w.length<=14));}if(l.options)assert.equal(new Set(l.options).size,l.options.length);}
 }
}
console.log('PASS eight other subjects × six grades: 288 new tasks, 12-stop routes, 3-stop medals, grade advance, distinct chapters, text bounds and explicit enrichment scope');

// Growth uses unique completed IDs, including legacy saves; retries cannot farm points.
let battleRaw=null;const battleStore={getItem:()=>battleRaw,setItem:(_,v)=>battleRaw=v};
const growth=new Progress(battleStore);assert.equal(growth.points,0);assert.equal(growth.heroLevel,1);
for(const level of ALL_LEVELS.slice(0,6))growth.complete(level.id);
assert.equal(growth.points,600);assert.equal(growth.experience,180);assert.equal(growth.heroLevel,2);assert.equal(growth.levelExperience,0);
growth.complete(ALL_LEVELS[0].id);growth.complete('nonexistent');assert.equal(growth.points,600);
const growthRestored=new Progress(battleStore);assert.equal(growthRestored.points,600);assert.equal(growthRestored.heroLevel,2);
battleRaw=JSON.stringify({version:3,done:[ALL_LEVELS[0].id,ALL_LEVELS[0].id,'invalid'],points:999999,experience:999999});
const migratedGrowth=new Progress(battleStore);assert.equal(migratedGrowth.points,100);assert.equal(migratedGrowth.experience,30);
console.log('PASS growth: legacy migration, duplicate prevention, unknown IDs, reload and level boundary');

// Empty answers invite an action; valid zero and actual wrong answers still reach grading.
for(const kind of ['number','choice','listen','sentence']){const level=ALL_LEVELS.find(l=>l.kind===kind),p=new Puzzle(level);assert.ok(p.pendingGuide(),kind);}
const numeric=new Puzzle(ALL_LEVELS.find(l=>l.kind==='number'));
for(const input of ['','-','2.']){numeric.input=input;assert.ok(numeric.pendingGuide());}
for(const input of ['0','-2','2.5']){numeric.input=input;assert.equal(numeric.pendingGuide(),'');}
console.log('PASS pending answer guidance: empty selections, incomplete numbers, zero and decimals');
