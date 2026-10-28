// Structured AI observations are provisional evidence, not diagnoses or curriculum certification.
const subjects=['数学','语文','英语','科学','道德与法治','音乐','美术','体育与健康','劳动','信息科技','综合实践'];
function str(v,max=1000){if(typeof v!=='string'||v.length>max)throw Error('评测内容格式异常');return v.trim();}
function profile(raw){if(!Number.isInteger(raw?.grade)||raw.grade<1||raw.grade>6||!subjects.includes(raw.subject))throw Error('请选择小学年级与学科');return {grade:raw.grade,subject:raw.subject};}
function questions(raw){if(!Array.isArray(raw)||!raw.length||raw.length>40)throw Error('未找到可核对的题目，请补拍清晰完整的作业');return raw.map((q,i)=>{const prompt=str(q.prompt,2000);if(!prompt)throw Error('题干不能为空');return {id:String(i),prompt,studentAnswer:str(q.studentAnswer??'',1000),confidence:typeof q.confidence==='number'&&q.confidence>=0&&q.confidence<=1?q.confidence:0,uncertainty:str(q.uncertainty||'',400)};});}
function report(raw,qs){
 if(!raw||!Array.isArray(raw.observations)||!raw.observations.length||raw.observations.length>12)throw Error('评测缺少题目依据');
 const observations=raw.observations.map(o=>{
 if(!['strength','practice','uncertain'].includes(o.status)||!Array.isArray(o.questionIds)||!o.questionIds.length||o.questionIds.some(id=>typeof id!=='string'||!qs.some(q=>q.id===id)))throw Error('评测依据无效');
 const evidence=qs.filter(q=>o.questionIds.includes(q.id));
 const uncertain=evidence.some(q=>q.confidence<.85||q.uncertainty||!q.studentAnswer.trim());
 return {skill:str(o.skill,100),status:uncertain?'uncertain':o.status,questionIds:[...new Set(o.questionIds)],reason:uncertain?'原题条件不完整、识别不清或没有作答，暂不判断学习水平。请补充资料；照片问题不代表学生能力问题。':str(o.reason,600)};
 });
 if(!Array.isArray(raw.schedule)||raw.schedule.length!==3)throw Error('学习计划不完整');
 const schedule=raw.schedule.map((s,i)=>({day:i===0?'今天':i===1?'明天':'三天后',minutes:Math.max(5,Math.min(15,Number(s.minutes)||10)),goal:str(s.goal,300),activity:i===0?'完成下方六站练习，答题后查看解析；不确定时先用提示。':str(s.activity,500)}));
 if(!Array.isArray(raw.tasks)||raw.tasks.length!==6)throw Error('练习数量不完整');
 const seen=new Set();const tasks=raw.tasks.map((q,i)=>{
 const expression=str(q.prompt,1200);if(!expression||seen.has(expression)||qs.some(q=>q.prompt.replace(/\s/g,'')===expression.replace(/\s/g,'')))throw Error('练习为空或重复');seen.add(expression);
 if(!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)throw Error('练习选项无效');
 const options=q.options.map(v=>str(v,400));if(options.some(v=>!v)||new Set(options).size!==4)throw Error('练习选项重复');
 if(!Array.isArray(q.questionIds)||!q.questionIds.length||q.questionIds.some(id=>!qs.some(source=>source.id===id)))throw Error('练习缺少原题依据');
 return {id:String(i),expression,options,answer:q.answer,explanation:str(q.explanation,1000),hint:str(q.hint,300),skill:str(q.skill,100),questionIds:q.questionIds,mission:i<2?'点亮知识星':i<4?'修复知识桥':'探索新情境'};
 });
 return {summary:str(raw.summary,1000),assessment:{observations,schedule,notice:'这是基于本次资料的初步学习建议。未作答、看不清及单次错误不能直接认定为知识薄弱；AI评判和练习仍可能有误。'},tasks};
}
function feedback(r){const values=Object.values(r.answers||{}),n=values.length;if(!n)return null;const correct=values.filter(x=>x.correct).length;return {answered:n,correct,total:r.tasks?.length||6,next:n<6?'继续完成剩余任务，积累更多证据。':correct>=5?'本轮表现稳定。建议明天脱离提示复习，再验证是否掌握。':correct>=3?'先回看错题解析，明天优先巩固这些知识点。':'建议先练更基础的例题，每次只练一个知识点；这次结果不代表你的能力。'};}
module.exports={subjects,profile,questions,report,feedback};
