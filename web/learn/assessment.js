/* Model text is rendered only through textContent. No model HTML or executable markup. */
(()=>{
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 window.starisleAssessment={picker(form,config){
  const row=el('div',undefined,'row');const select=(name,items)=>{const label=el('label',name),s=el('select');s.setAttribute('aria-label',name);for(const [value,title] of items){const o=el('option',title);o.value=value;s.append(o);}label.append(s);row.append(label);return s;};
  const mode=select('学习方式',[['assessment','学情评测与专属计划'],['arithmetic','二年级口算训练']]);if(!config.assessment)mode.value='arithmetic';
  const grade=select('当前年级',Array.from({length:6},(_,i)=>[String(i+1),(i+1)+'年级']));grade.value='2';
  const subject=select('学科',(config.subjects||['数学','语文','英语']).map(s=>[s,s]));
  const sync=()=>{grade.disabled=subject.disabled=mode.value!=='assessment';};mode.onchange=sync;sync();
  form.append(row,el('p','按实际年级推荐难度，不从照片猜年龄。评测是初步建议；一份作业不能代表整体水平。','small'));
  return ()=>({mode:mode.value,profile:{grade:Number(grade.value),subject:subject.value}});
 },render({record,view,api,update,button,sound}){
  if(record.mode!=='assessment')return false;
  if(record.status==='review'){
   view.append(el('h1','先核对作业，再了解自己'),el('p',record.recognitionNote||'核对题干与作答，模糊处请补充。'));
   const fields=[];for(const q of record.questions){const card=el('div',undefined,'card');card.append(el('h2','第 '+(Number(q.id)+1)+' 题'));const prompt=el('textarea'),answer=el('textarea');prompt.value=q.prompt;answer.value=q.studentAnswer;prompt.setAttribute('aria-label','第'+(Number(q.id)+1)+'题题干');answer.setAttribute('aria-label','第'+(Number(q.id)+1)+'题作答');card.append(el('label','题干'),prompt,el('label','我的作答（未答可留空）'),answer);if(q.uncertainty||q.confidence<.85)card.append(el('p','需要核对：'+(q.uncertainty||'识别置信度不足'),'small'));fields.push({q,prompt,answer});view.append(card);}
   view.append(button('生成我的学习计划 →',async()=>{const status=el('p','星宝正在分析并审校练习，通常需要一到两分钟…');view.append(status);try{update(await api('sessions/'+record.id+'/confirm','POST',{questions:fields.map(({q,prompt,answer})=>({...q,prompt:prompt.value,studentAnswer:answer.value}))}));}finally{status.remove();}},'primary'));return true;
  }
  const report=el('details',undefined,'card');report.open=Object.keys(record.answers||{}).length===0;report.append(el('summary','我的学情与学习计划'),el('p',record.summary),el('p',record.assessment?.notice,'small'));
  for(const o of record.assessment?.observations||[]){report.append(el('h3',({strength:'已观察到的表现',practice:'建议巩固',uncertain:'还需要更多证据'}[o.status])+' · '+o.skill),el('p',o.reason));const source=el('details');source.append(el('summary','查看依据：第 '+o.questionIds.map(id=>Number(id)+1).join('、')+' 题'));for(const id of o.questionIds){const q=record.questions.find(x=>x.id===id);source.append(el('p',q.prompt+'；你的作答：'+(q.studentAnswer||'未答')));}report.append(source);}
  const schedule=el('div',undefined,'plan-grid');for(const s of record.assessment?.schedule||[]){const card=el('div',undefined,'plan-step');card.append(el('h3',s.day+' · '+s.minutes+'分钟'),el('strong',s.goal),el('p',s.activity));schedule.append(card);}report.append(schedule);view.append(report,el('p',record.generationNote,'small'));
  const done=Object.keys(record.answers||{}).length,track=el('div',undefined,'track');record.tasks.forEach((q,i)=>track.append(el('span',i<done?'★':String(i+1),'stop '+(i<done?'done':i===done?'now':''))));view.append(track);
  if(record.status==='complete'){
   view.append(el('h1','知识星岛点亮啦！'),el('p','本轮 '+record.learningFeedback.correct+' / 6 · '+record.points+' 研习星光'),el('p',record.learningFeedback.next));
   for(const q of record.tasks){const a=record.answers[q.id],card=el('div',undefined,'card');card.append(el('strong',(a.correct?'✓ ':'再看看 · ')+q.expression),el('p','你的选择：'+q.options[Number(a.submitted)]),el('p','参考答案：'+q.options[a.answer]),el('p',a.explanation));view.append(card);}view.append(button('按本轮表现安排下一轮 →',async()=>update(await api('sessions/'+record.id+'/next','POST',{})),'primary'));view.append(button('回到小岛',async()=>{location.href='/';},'primary'));return true;
  }
  const q=record.tasks[done],card=el('div',undefined,'card battle');card.append(el('div',q.mission+' · '+(done+1)+' / 6 · '+record.points+' 星光','small'),el('div','☁️','monster'),el('h2',q.expression));
  const options=el('div',undefined,'choice-grid');const feedback=el('p','');let busy=false;
  q.options.forEach((option,i)=>{const b=button(String.fromCharCode(65+i)+' · '+option,async()=>{if(busy)return;busy=true;options.querySelectorAll('button').forEach(n=>n.disabled=true);try{const r=await api('sessions/'+record.id+'/answer','POST',{taskId:q.id,answer:String(i)});feedback.textContent=(r.correct?'答对啦，知识星 +10！':'没关系，一起看看：')+' '+r.explanation;card.querySelector('.monster').textContent=r.correct?'✨':'🌤️';if(r.correct)sound();options.remove();card.append(button('继续探索 →',async()=>update(r.record),'primary'));}catch(e){busy=false;options.querySelectorAll('button').forEach(n=>n.disabled=false);throw e;}});options.append(b);});
  const hint=el('details');hint.append(el('summary','需要一点提示'),el('p',q.hint));card.append(options,hint,feedback);view.append(card);return true;
 }};
})();
