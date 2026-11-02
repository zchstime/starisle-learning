const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const root=path.join(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'starisle-distribution-'));
try{
 for(const name of ['Homework','PictureActivities','OtherCurriculum','SubjectStories','Subjects','StarterContent','ExpansionContent','ChallengeContent','MathCurriculum','EnglishCurriculum','ChineseCurriculum','Catalog']){
  const source=fs.readFileSync(path.join(root,'assets/scripts/adventure',name+'.ts'),'utf8');
  fs.writeFileSync(path.join(out,name+'.js'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText);
 }
 const {CATALOG}=require(path.join(out,'Catalog.js')),chapters=CATALOG.filter(c=>c.curriculum),levels=chapters.flatMap(c=>c.levels.map(l=>({chapter:c,level:l}))),allLevels=CATALOG.flatMap(c=>c.levels.map(l=>({chapter:c,level:l})));
 const normalize=s=>(s||'').toLowerCase().replace(/[\d０-９]+(?:\.\d+)?/g,'#').replace(/[a-z]+/g,'@').replace(/[\s，。！？、；：,.!?;:'“”‘’（）()·—\-]/g,'');
 const payload=l=>JSON.stringify([l.kind,l.goal,l.options,l.target,l.voice,l.passage,l.words,l.answer,l.pairs,l.cells,l.cols,l.groups,l.units,l.visual,l.activity,l.drawPrompt,l.traceChar,l.tracePrompt,l.rhythm,l.practiceSteps,l.tokens,l.markedAnswer,l.fields,l.writing]);
 const payloads=new Map();
 for(const row of levels){const key=payload(row.level);assert.ok(!payloads.has(key),`${row.level.id} 与 ${payloads.get(key)?.level.id} 为完全重复任务`);payloads.set(key,row);}
 const allPayloads=new Map();for(const row of allLevels){const key=payload(row.level);if(!allPayloads.has(key))allPayloads.set(key,[]);allPayloads.get(key).push(row);}const legacyDuplicates=[...allPayloads.values()].filter(rows=>rows.length>1);for(const rows of legacyDuplicates)assert.ok(rows.filter(row=>row.chapter.curriculum).length<=1,rows.map(row=>row.level.id).join(', ')+' 在两个教材单元中重复');
 const roles=['understand','model','fluency','diagnose','apply','transfer'];
 for(const c of chapters){
  assert.equal(new Set(c.levels.map(l=>l.goal.trim())).size,c.levels.length,c.id+' 单元内题干重复');
  assert.ok(new Set(c.levels.map(l=>l.kind)).size>=3,c.id+' 少于三种题型');
  assert.ok(c.levels.filter(l=>l.kind==='choice').length/c.levels.length<=.5,c.id+' 选择题超过一半');
  const templates=new Map();for(const l of c.levels){const key=normalize(l.goal);templates.set(key,(templates.get(key)||0)+1);}for(const [key,count] of templates)assert.ok(count<=2,`${c.id} 同一模板换数字超过两次：${key}`);
  if(['math','english','chinese'].includes(c.subject)){
   const evidence=c.levels.filter(l=>l.evidence);assert.equal(evidence.length,6,c.id+' 核心学习证据不是六项');
   assert.deepEqual(evidence.map(l=>l.evidence.role),roles,c.id+' 学习证据顺序错乱');
   assert.deepEqual(evidence.reduce((m,l)=>(m[l.stage]=(m[l.stage]||0)+1,m),{}),{warmup:2,practice:2,challenge:2},c.id+' 难度阶段分布错乱');
  }
 }
 const subjects=[...new Set(chapters.map(c=>c.subject))],summary=[];
 for(const subject of subjects)for(let grade=1;grade<=6;grade++){
  const rows=levels.filter(x=>x.chapter.subject===subject&&x.chapter.grade===grade);if(!rows.length)continue;
  const kinds={};for(const {level} of rows)kinds[level.kind]=(kinds[level.kind]||0)+1;
  const [dominant,count]=Object.entries(kinds).sort((a,b)=>b[1]-a[1])[0];
  assert.ok(count/rows.length<=.55,`${subject} ${grade}年级 ${dominant} 占比超过55%`);
  summary.push({subject,grade,total:rows.length,choice:kinds.choice||0,kinds:Object.keys(kinds).length,dominant:`${dominant} ${Math.round(count/rows.length*100)}%`});
 }
 for(const subject of ['math','english'])for(let grade=1;grade<=6;grade++)for(const semester of ['上册','下册']){
  const nums=chapters.filter(c=>c.subject===subject&&c.grade===grade&&c.curriculum.semester===semester&&c.curriculum.unitType==='textbook').map(c=>c.curriculum.unitNumber).sort((a,b)=>a-b);
  if(nums.length)assert.deepEqual(nums,Array.from({length:nums.length},(_,i)=>i+1),`${subject} ${grade}年级${semester} 单元编号不连续`);
 }
 console.log(`PASS core curriculum distribution: ${chapters.length} chapters / ${levels.length} tasks; no exact duplicates, no unit over 50% choice, no grade over 55% one mechanic, no repeated template over twice`);
 console.log(`WARN legacy enrichment bank: ${legacyDuplicates.length} exact duplicate groups outside the core curriculum; keep blocked from a full-library clean claim until archived or rewritten`);
 for(const row of summary)console.log(`${row.subject} G${row.grade}: ${row.total} tasks, ${row.kinds} mechanics, choice ${Math.round(row.choice/row.total*100)}%, dominant ${row.dominant}`);
}finally{fs.rmSync(out,{recursive:true,force:true});}
