'use strict';
// Add a mechanic here only after its Cocos renderer and evaluator are implemented.
const {validPicture}=require('./picture.cjs');
const MODULES=[
 {id:'picture',name:'图形操作 / 配对 / 分类 / 顺序 / 分物 / 拼图',fields:['activity']},
 {id:'choice',name:'选择 / 符石投送',fields:['options','target','passage']},
 {id:'number',name:'数字作答',fields:['target','scale','answerUnit','visual']},
 {id:'sentence',name:'词卡排序',fields:['words','answer']},
 {id:'match',name:'配对连线',fields:['pairs']},
 {id:'cargo',name:'能量装船',fields:['target','units','scale','maxBlocks']},
 {id:'groups',name:'分组种植',fields:['groups','target']},
 {id:'tiles',name:'铺格子',fields:['cells','cols','target']},
 {id:'listen',name:'听音选择',fields:['voice','options','target']},
 {id:'draw',name:'自由绘画',fields:['drawPrompt','palette','minStrokes','minColors']},
 {id:'trace',name:'田字格临写',fields:['traceChar','tracePrompt','minStrokes']},
 {id:'rhythm',name:'节奏拍击',fields:['rhythm','bpm']},
 {id:'practice',name:'真实实践记录',fields:['practiceMode','practiceSteps']},
 {id:'highlight',name:'原文圈画',fields:['tokens','markedAnswer']},
 {id:'cloze',name:'自主填空 / 拼写 / 分步计算',fields:['passage','fields']},
 {id:'compose',name:'课后表达与自查',fields:['writing']}
].map(m=>({...m,version:1}));
const VOICES=new Set(require('./voices.json'));
function voiceKey(s){if(/[^\x00-\x7F]/.test(s)){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return 'zh_'+(h>>>0).toString(16);}return s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
const ID=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
const arts=['island','english','garden','planet','journey-garden','journey-planets'];
const str=(v,max=4000)=>typeof v==='string'&&v.length<=max;
const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
function validateQuestion(q){
 const errors=[],d=q?.data||{},add=m=>errors.push(m);
 if(!ID.test(q?.id||''))add('题目编号格式无效');
 if(!ID.test(q?.subject||'')||!int(q?.grade,1,6))add('请填写学科和 1～6 年级');
 if(!str(q.knowledge,200))add('知识点格式无效');
 if(!['active','archived'].includes(q.status))add('题目状态无效');
 if(!MODULES.some(m=>m.id===d.kind))add('客户端尚不支持此玩法');
 for(const key of ['title','goal','hint','explanation'])if(!str(d[key])||!d[key].trim())add(`${key} 不能为空且最多 4000 字`);
 for(const [key,max] of Object.entries({title:40,goal:160,hint:160,explanation:300,passage:1200}))if(d[key]!==undefined&&(!str(d[key],max)))add(`${key} 超过当前玩法的文本长度限制（${max}）`);
 if(!Number.isFinite(d.target)||Math.abs(d.target)>1e7)add('答案必须是有限数字');
 if(d.scale!==undefined&&(!Number.isFinite(d.scale)||d.scale<=0||d.scale>10000))add('小数倍率必须大于 0 且不超过 10000');
 for(const key of ['passage','voice','answerUnit'])if(d[key]!==undefined&&!str(d[key],12000))add(`${key} 格式无效`);
 if(typeof d.voice==='string'&&d.voice&&!VOICES.has(voiceKey(d.voice)))add('尚未打包此语音，请使用已有语音原文或标识');
 if(d.coachHints!==undefined&&(!Array.isArray(d.coachHints)||d.coachHints.length>10||d.coachHints.some(s=>!str(s))))add('提示列表格式无效');
 if(d.stage!==undefined&&!['warmup','practice','challenge'].includes(d.stage))add('学习阶段无效');
 if(['choice','listen'].includes(d.kind)){
  if(!Array.isArray(d.options)||d.options.length<2||d.options.length>3||d.options.some(s=>!str(s,80)||!s.trim()))add('选项需为 2～3 个非空文本');
  else if(!int(d.target,0,d.options.length-1))add('正确答案超出选项范围');
  if(d.kind==='listen'&&!d.voice)add('听音题必须有语音标识');
 }
 if(d.kind==='picture'&&!validPicture(d.activity))add('图形任务的卡片、位置或答案配置无效');
 if(d.kind==='sentence'){
  if(!Array.isArray(d.words)||d.words.length<2||d.words.length>16||d.words.some(s=>!str(s,100)||!s.trim())||!Array.isArray(d.answer)||d.answer.some(s=>!str(s,100)))add('词卡需为 2～16 个非空文本');
  else {const available=[...d.words];for(const word of d.answer){const at=available.indexOf(word);if(at<0){add('正确顺序含有不存在或重复使用的词卡');break;}available.splice(at,1);}if(!d.answer.length)add('正确顺序不能为空');}
 }
 if(d.kind==='match'&&(!Array.isArray(d.pairs)||d.pairs.length<2||d.pairs.length>5||d.pairs.some(p=>!Array.isArray(p)||p.length!==2||p.some(s=>!str(s,100)||!s.trim()))||new Set(d.pairs.map(p=>p[1])).size!==d.pairs.length))add('配对题需提供 2～5 组非空、答案不重复的线索');
 if(d.kind==='draw'){
  if(!str(d.drawPrompt,200)||!d.drawPrompt.trim()||!int(d.minStrokes,1,20)||!int(d.minColors,1,8)||!Array.isArray(d.palette)||d.palette.length<d.minColors||d.palette.length>8||d.palette.some(s=>!/^#[0-9a-f]{6}$/i.test(s)))add('绘画任务需提供提示、1～20 笔要求和足够的有效颜色');
 }
 if(d.kind==='trace'&&(!str(d.traceChar,4)||[...d.traceChar].length!==1||!str(d.tracePrompt,200)||!d.tracePrompt.trim()||!int(d.minStrokes,1,20)))add('临写任务需提供一个范字、书写提示和 1～20 笔要求');
 if(d.kind==='highlight'){
  if(!Array.isArray(d.tokens)||d.tokens.length<2||d.tokens.length>8||d.tokens.some(v=>!str(v,250)||!v.trim())||!Array.isArray(d.markedAnswer)||!d.markedAnswer.length||new Set(d.markedAnswer).size!==d.markedAnswer.length||d.markedAnswer.some(i=>!int(i,0,(d.tokens?.length||0)-1)))add('圈画需提供 2～8 个原文片段及有效答案位置');
 }
 if(d.kind==='cloze'&&(!str(d.passage,1200)||!d.passage.trim()||!Array.isArray(d.fields)||!d.fields.length||d.fields.length>2||d.fields.some(f=>!f||!str(f.label,100)||!f.label.trim()||!Array.isArray(f.answers)||!f.answers.length||f.answers.length>10||f.answers.some(v=>!str(v,160)||!v.trim()))))add('填空需提供材料和 1～2 处非空答案');
 if(d.kind==='compose'){
  const w=d.writing;if(!w||!str(w.prompt,600)||!w.prompt.trim()||!int(w.minLength,1,400)||!int(w.maxLength,w.minLength,1000)||!str(w.example,1200)||!Array.isArray(w.checks)||!w.checks.length||w.checks.length>3||w.checks.some(v=>!str(v,100)||!v.trim()))add('表达任务的提示、字数或自查要求无效');
 }
 if(d.homework){const h=d.homework;if(h.origin!=='original-followup'||h.reviewStatus!=='draft'||!str(h.objective,300)||!Array.isArray(h.sourceLevelIds)||!h.sourceLevelIds.length||h.sourceLevelIds.some(id=>!ID.test(id)))add('课后作业来源或目标无效');}
 if(d.kind==='rhythm'&&(!Array.isArray(d.rhythm)||d.rhythm.length<2||d.rhythm.length>8||d.rhythm.some(n=>![1,2].includes(n))||!int(d.bpm,40,180)))add('节奏任务需提供 2～8 个短拍/长拍间隔和 40～180 BPM');
 if(d.kind==='practice'&&(!['observe','experiment','move','labor','roleplay','project','device'].includes(d.practiceMode)||!Array.isArray(d.practiceSteps)||d.practiceSteps.length<2||d.practiceSteps.length>6||d.practiceSteps.some(s=>!str(s,100)||!s.trim())))add('实践任务需提供类型和 2～6 个可执行步骤');
 if(d.kind==='groups'&&(!int(d.groups,1,8)||!int(d.target,1,9)))add('种植需 1～8 盆，每盆 1～9 颗');
 if(d.kind==='tiles'&&(!int(d.cells,1,100)||!int(d.cols,1,12)||!int(d.target,1,d.cells)))add('格子总数、列数或目标数无效');
 if(d.kind==='cargo'){
  if(!int(d.target,1,1000000)||!Array.isArray(d.units)||!d.units.length||d.units.length>5||d.units.some(n=>!int(n,1,1000000)))add('装船单位或目标无效');
  else {
   // Bounded reachability protects against valid-looking but unsolvable content.
   const cap=d.maxBlocks??36;if(!int(cap,1,36))add('装船块数上限必须为 1～36');
   else {let reach=new Set([0]),found=false;for(let n=0;n<cap&&!found;n++){const next=new Set();for(const value of reach)for(const unit of d.units)if(value+unit<=d.target)next.add(value+unit);if(next.has(d.target))found=true;reach=next;if(reach.size>100000){add('装船组合过于复杂');break;}}if(!found)add('在船舱容量内无法组合出答案');}
  }
 }
 if(d.visual!==undefined){const v=d.visual;if(!v||!['clock','ruler','bars','shape','grid','numberline'].includes(v.kind)||!Array.isArray(v.values)||v.values.length>30||v.values.some(n=>!Number.isFinite(n))||v.labels!==undefined&&(!Array.isArray(v.labels)||v.labels.some(s=>!str(s,100))))add('数学图示配置无效');}
 if(d.colors!==undefined&&(!Array.isArray(d.colors)||d.colors.length>6||d.colors.some(s=>!/^#[0-9a-f]{6}$/i.test(s))))add('颜色必须是六位十六进制色值');
 return errors;
}
function validate(snapshot){
 const errors=[],warnings=[],subjects=new Map(),questions=new Map(),chapterIds=new Set(),levelIds=new Set();
 const add=(id,message)=>errors.push({id,message});
 if(snapshot.schemaVersion!==1)return {errors:[{id:'schema',message:'不支持的内容版本'}],warnings};
 for(const s of snapshot.subjects){if(!ID.test(s.id)||subjects.has(s.id)||!str(s.name,30)||!s.name.trim()||!arts.includes(s.art)||!['active','archived'].includes(s.status)||!int(s.order,0,100000))add(s.id,'学科编号、名称、排序、状态或主题无效');subjects.set(s.id,s);}
 for(const q of snapshot.questions){if(questions.has(q.id))add(q.id,'题目编号重复');for(const e of validateQuestion(q))add(q.id,e);if(!subjects.has(q.subject))add(q.id,'学科不存在');questions.set(q.id,q);}
 for(const c of snapshot.chapters){
  if(!ID.test(c.id)||chapterIds.has(c.id)||!subjects.has(c.subject)||!int(c.grade,1,6)||!str(c.title,100)||!c.title.trim()||!str(c.topic,300)||!arts.includes(c.art)||!['active','archived'].includes(c.status)||!['theme','verified-theme','enrichment'].includes(c.alignment))add(c.id,'章节编号、归属、标题、主题或状态无效');chapterIds.add(c.id);
  if(c.curriculum){
   const m=c.curriculum;
   if(!['上册','下册'].includes(m.semester)||!int(m.order,0,100000)||!str(m.theme,300)||!str(m.source,1000)||typeof m.verified!=='boolean')add(c.id,'教材对应关系格式无效');
   if(m.unitType!==undefined&&!['textbook','revision','theme'].includes(m.unitType))add(c.id,'单元类型无效');
   if(m.unitNumber!==undefined&&!int(m.unitNumber,1,30))add(c.id,'单元序号必须为 1～30');
   if(m.objectives!==undefined&&(!Array.isArray(m.objectives)||m.objectives.length<1||m.objectives.length>10||m.objectives.some(v=>!str(v,300)||!v.trim())))add(c.id,'单元目标需为 1～10 条非空文本');
   if(m.unitType==='textbook'&&(!m.verified||!int(m.unitNumber,1,30)||!Array.isArray(m.objectives)||m.objectives.length<3))add(c.id,'已认证教材单元必须包含单元序号和至少 3 条学习目标');
   if(m.verified&&m.unitType&&m.unitType!=='textbook')add(c.id,'已认证内容必须标记为教材单元');
  }
  if(!Array.isArray(c.bindings)||c.bindings.length>200){add(c.id,'章节最多包含 200 个关卡');continue;}
  if(c.status==='active'&&!c.bindings.length)add(c.id,'启用的章节至少需要一个关卡');
  for(const b of c.bindings){const q=questions.get(b.questionId);for(const source of q?.data?.homework?.sourceLevelIds||[])if(!c.bindings.some(x=>x.id===source&&x.id!==b.id))add(b.id,'课后作业必须引用同章节的已有学习任务');}
  for(const b of c.bindings){if(!ID.test(b.id)||levelIds.has(b.id))add(c.id,'关卡编号无效或重复');levelIds.add(b.id);const q=questions.get(b.questionId);if(!q)add(b.id,'引用的题目不存在');else {if(q.subject!==c.subject||q.grade!==c.grade)add(b.id,'题目学科/年级与章节不一致');if(c.status==='active'&&q.status!=='active')add(b.id,'启用的关卡引用了停用题目');}}
 }
 if(!snapshot.subjects.some(s=>s.status==='active'))add('subjects','至少保留一个启用的学科');
 for(const s of snapshot.subjects.filter(s=>s.status==='active'))if(!snapshot.chapters.some(c=>c.subject===s.id&&c.status==='active'))warnings.push({id:s.id,message:'此学科暂无可玩章节，前端显示待上线提示'});
 return {errors,warnings};
}
function compile(snapshot,history={levelIds:[],chapterIds:[],subjectIds:[]}){
 const questions=new Map(snapshot.questions.map(q=>[q.id,q]));
 const subjects=snapshot.subjects.filter(s=>s.status==='active').sort((a,b)=>a.order-b.order);
 const active=new Set(subjects.map(s=>s.id));
 const chapters=snapshot.chapters.filter(c=>c.status==='active'&&active.has(c.subject)).map(({bindings,status,...c})=>({...c,levels:bindings.map(b=>({...questions.get(b.questionId).data,id:b.id}))}));
 return {schemaVersion:1,requiredModules:MODULES.map(m=>({id:m.id,version:m.version})),subjects,chapters,knownLevelIds:[...new Set([...history.levelIds,...snapshot.chapters.flatMap(c=>c.bindings.map(b=>b.id))])],knownChapterIds:[...new Set([...history.chapterIds,...snapshot.chapters.map(c=>c.id)])],knownSubjectIds:[...new Set([...history.subjectIds,...snapshot.subjects.map(s=>s.id)])]};
}
module.exports={MODULES,ID,arts,validate,validateQuestion,compile};
