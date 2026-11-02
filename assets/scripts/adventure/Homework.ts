import type {Chapter,Level,WritingTask} from './Catalog';
import type {Puzzle} from './Puzzle';
interface NotebookPort {getItem(key:string):string|null;setItem(key:string,value:string):void;}
/** AccountStorage scopes each draft to the current account; local preview has
 * an in-memory port and never touches a real child's records. */
export function saveHomework(p:Puzzle,port:NotebookPort){
 if(!p.level.homework||!['compose','cloze','highlight'].includes(p.level.kind))return true;
 try{port.setItem('starisle.homework.v1.'+p.level.id,JSON.stringify({version:1,input:p.input,fields:p.fieldValues,marks:p.marked,checks:p.writingChecks}));return true;}catch{return false;}
}
export function restoreHomework(p:Puzzle,port:NotebookPort){
 if(!p.level.homework)return;
 try{const raw=port.getItem('starisle.homework.v1.'+p.level.id);if(!raw||raw.length>16000)return;const d=JSON.parse(raw);if(d?.version!==1)return;
  if(p.level.kind==='compose'&&typeof d.input==='string'){p.setWriting(d.input);if(p.writingReady()&&Array.isArray(d.checks))p.writingChecks=p.level.writing!.checks.map((_,i)=>d.checks[i]===true);}
  if(p.level.kind==='cloze'&&Array.isArray(d.fields))d.fields.slice(0,p.level.fields?.length||0).forEach((v,i)=>{if(typeof v==='string')p.setField(i,v);});
  if(p.level.kind==='highlight'&&Array.isArray(d.marks))for(const i of Array.from(new Set(d.marks)))p.toggleMark(i as number);
 }catch{/* A damaged draft never affects progression or other work. */}
}

/** Original follow-up work. Source IDs bind practice to the current lesson;
 * they do not certify an official textbook exercise or page number. */
function base(c:Chapter,key:string,title:string,goal:string,sources:Level[]):Omit<Level,'kind'>{
 return {id:`${c.id}.hw.${key}`,title:`课后·${title}`,goal,target:0,stage:'challenge',hint:'先独立完成，再对照提示检查。',coachHints:['回到本课材料，找出与作业目标相关的信息。','完成后检查内容、方法和表达是否符合任务。'],explanation:'',homework:{sourceLevelIds:sources.map(l=>l.id),objective:goal,origin:'original-followup',reviewStatus:'draft'}};
}
function writing(c:Chapter,key:string,title:string,goal:string,source:Level,prompt:string,min:number,checks:string[],example:string):Level{
 const task:WritingTask={prompt,minLength:min,maxLength:c.grade<=2?160:400,checks,example};
 return {...base(c,key,title,goal,[source]),kind:'compose',writing:task,hint:'写出自己的内容，再逐条检查；修改后需要重新自查。',explanation:'已完成表达与自查。字数和勾选记录练习过程，内容质量还需结合老师或家长的反馈。'};
}
function chinese(c:Chapter):Level[]{
 const core=c.levels.filter(l=>l.evidence),reading=core[4],line=core[2],plan=core[3],grade=c.grade;
 const sentences=(reading.passage||'').match(/[^。！？]+(?:[。！？]+[”」]?|$)/g)||[];
 const index=Number(c.id.match(/story(\d+)$/)?.[1]||1)-1;
 const focus=CHINESE_MARKING[grade-1][index],markedAnswer=focus[1];
 const clause=(line.answer||[]).filter(s=>!/^\p{P}+$/u.test(s)),gap=clause.length-1;
 const action=(plan.answer||[]).map(s=>s.replace(/[。！？]$/,'')).join('，');
 const writingPrompt=grade<=2?`用自己的话说清“${c.title}”里谁做了什么，再写一句完整的话。`:grade<=4?`围绕“${c.topic}”，联系本课故事写两三句话，加入一个具体动作或可核对的细节。`:`围绕“${c.topic}”写一小段话，表达一个意思，用具体材料支持，并检查表达是否准确。`;
 return [
  {...base(c,'evidence','原文圈画',`读“${c.title}”：${focus[0]}`, [reading]),kind:'highlight',tokens:sentences,markedAnswer,hint:`直接点原文中的句子，再点可取消；本题需标记 ${markedAnswer.length} 句。`,explanation:`对应的原文依据：${markedAnswer.map(i=>sentences[i]).join('')}`},
  {...base(c,'fill','句子补写',`把“${c.title}”的口信补充完整，不看选项自主填写。`,[line]),kind:'cloze',passage:clause.map((s,i)=>i===gap?'【①】':s).join('')+'。',fields:[{label:'① 口信缺少的部分',answers:[clause[gap]]}],hint:'先读清其他部分，再补上句子中缺少的词语。',explanation:`完整口信：${(line.answer||[]).join('')}`},
  writing(c,'write','小练笔',`完成“${c.title}”的课后表达，用本课方法写自己的话。`,reading,writingPrompt,[6,10,18,24,35,45][grade-1],grade<=2?['我写清了谁在做什么','我读了一遍，检查句末标点']:['内容紧扣本课主题','有具体动作、事实或例子','我检查了语句通顺和标点'],reading.passage||''),
  writing(c,'retell','复述与改写',`把“${c.title}”的行动顺序写成一段连贯的话。`,plan,`按下面的线索复述，可用自己的话连接：${(plan.answer||[]).join(' → ')}。`,[8,12,18,24,30,36][grade-1],['我没有漏掉主要步骤','顺序清楚，连接自然','我对照线索修改了一处表达'],action+'。')
 ];
}
// Explicit evidence spans, reviewed against the original story. Complexity grows
// from one concrete detail to causal chains, limitations and combined constraints.
const CHINESE_MARKING:[string,number[]][][]=[
 [['圈出写“我和谁一起上学”的一句。',[1]],['圈出小鸟停在哪里的一句。',[1]],['圈出小林帮助小雨的一句。',[1]],['圈出我在哪里看花的一句。',[2]],['圈出我怎样帮助小红的一句。',[1]],['圈出爸爸又指了一颗星的一句。',[1]]],
 [['圈出小鹿擦干桌子的原因和动作所在的一句。',[1]],['圈出小鸟重新唱歌的时间所在的一句。',[2]],['圈出提醒带彩笔的一句。',[1]],['圈出小禾发现困难并帮助同伴的一句。',[1]],['圈出小芽刚钻出泥土的一句。',[1]],['圈出新路线怎样帮助小兔送书的一句。',[2]]],
 [['圈出小桥从模糊变清楚的原因所在的一句。',[1]],['圈出按顺序写白鹭捕食动作的两句。',[0,1]],['圈出通知的集合安排和要携带物品的两句。',[0,1]],['圈出支持小鹿可以求助的灯光、声音线索，共两句。',[1,2]],['圈出概括花的特点与用颜色举例的两句。',[0,1]],['圈出细根、绿芽这两次生长变化的两句。',[1,2]]],
 [['圈出路线改变的原因和行动所在的一句。',[1]],['圈出他帮助同伴以及自己也觉得冷的两句。',[1,2]],['圈出游览地点依次变化的三句。',[0,1,2]],['圈出小猫在什么情况下选择休息地点的两句。',[1,2]],['圈出任务、保护种子的经过和结果，共三句。',[0,1,2]],['圈出使用比喻描写树叶的一句。',[0]]],
 [['圈出支持“短暂犹豫后决定归还”的动作依据，共两句。',[0,1]],['圈出温室的容量和作用限制，共两句。',[0,1]],['圈出运输办法与合作结果组成的因果链，共两句。',[1,2]],['圈出能判断周六16时30分是否可以入馆的一句。',[0]],['圈出日落到灯亮的时间变化，共三句。',[0,1,2]],['圈出问题、建议和维护安排，共三句。',[0,1,2]]],
 [['圈出分工办法及其结果，共两句，作为观点的依据。',[1,2]],['圈出支持人物关心归人的动作，共两句。',[1,2]],['圈出判断能否及时入场所需的全部条件，共四句。',[0,1,2,3]],['圈出测试结果及结论范围，共两句。',[1,2]],['圈出老人用因果关系解释叶子移动的一句。',[1]],['圈出核实日期的方法及发布顺序所在的一句。',[1]]]
];
function math(c:Chapter):Level[]{
 const core=c.levels.filter(l=>l.evidence),source=core.find(l=>/\d/.test(l.explanation))||core[4];
 // A worked example becomes an independent process-completion exercise,
 // explicitly labelled review rather than counted as a new numerical problem.
 const explanation=source.explanation,hasNumbers=/\d/.test(explanation);
 const missing=hasNumbers?Array.from(explanation.matchAll(/\d+(?:\.\d+)?/g)).slice(-2):[];
 const fields=missing.map((m,i)=>({label:`${i+1}：过程中的数`,answers:[m[0]]}));
 let passage=explanation;for(let i=missing.length-1;i>=0;i--){const m=missing[i];passage=passage.slice(0,m.index)+`【${i+1}】`+passage.slice(m.index+m[0].length);}
 if(!fields.length){const answer=source.options?.[source.target]||source.answer?.[source.answer.length-1]||c.topic;fields.push({label:'写出对应的数学名称或结论',answers:[answer]});passage='【1】';}
 const task=core[4],drawPrompt=`把下面的题意画成${c.grade<=2?'数量点、小棒或简单示意图':'线段图、格子图或其他示意图'}：${task.goal}`;
 return [
  {...base(c,'steps','分步填算',`复习“${c.topic}”：根据原题，补全计算或判断过程。`,[source]),kind:'cloze',passage:`原题：${source.goal}\n补全：${passage}`,fields,hint:'对照题目条件，先填过程，再检查结论。',explanation:source.explanation},
  {...base(c,'model','画图建模',`用自己的图表示“${c.topic}”课后情境中的数量或图形关系。`,[task]),kind:'draw',drawPrompt,palette:['#238E90','#E6AF39','#597CCB'],minStrokes:3,minColors:1,hint:drawPrompt.slice(0,160),explanation:'已留下画图过程。请对照原题检查图中数量、关系和单位，图意是否准确需要进一步讲解与核对。'},
  writing(c,'explain','说理作业',`解释“${c.topic}”的一道应用题，并写出检查办法。`,task,`${task.goal}\n写出你先找什么关系、怎样解决，以及怎样检查。`,[6,10,16,20,26,30][c.grade-1],['我的方法对应原题条件','我说明了数量或图形关系','我用单位、估算、逆运算或图形性质检查'],task.explanation)
 ];
}
function english(c:Chapter):Level[]{
 const core=c.levels.filter(l=>l.evidence),word=core[0],line=core[2],reading=core[4];
 const englishWord=word.voice||'',meaning=word.options?.[word.target]||'',words=line.answer||[],gap=words.length-1;
 const tokens=englishWord.split(/\s+/),answerTokens=words.map((s,i)=>i===gap?'【①】':s);
 return [
  {...base(c,'spell','自主拼写',`课后词汇：写出“${c.topic}”主题中“${meaning}”的英文。`,[word]),kind:'cloze',passage:`词义提示：${meaning}`,fields:[{label:'英文单词或短语',answers:[englishWord]}],voice:englishWord,hint:'先尝试独立拼写；需要帮助时可以听本课词汇。',explanation:`${englishWord}：${meaning}。`},
  {...base(c,'context','语境填词',`结合“${c.topic}”口信的中文意思，补全英文句子。`,[line]),kind:'cloze',passage:answerTokens.join(' ')+'\n'+line.goal.replace('送给伙伴一张口信：','意思：'),fields:[{label:'① 缺少的英文词',answers:[words[gap]]}],hint:'根据句子意思和语序，填写一个英文词。',explanation:words.join(' ')},
  writing(c,'project',c.grade<=2?'词汇小卡':'主题小作品',`用“${c.topic}”的词句完成一张自己的课后表达卡。`,reading,c.grade<=2?`选择本主题的一个单词，写进你的词汇卡；可以写“${tokens.join(' ')}”，再向家人说出意思。`:`围绕“${c.topic}”，借鉴本课句型写${c.grade<=4?'一句':'两句'}自己的英语，表达真实的人、事物或计划。`,c.grade<=2?Math.min(englishWord.replace(/\s/g,'').length,3):c.grade<=4?8:16,c.grade<=2?['我核对了字母顺序','我能说出词语的意思']:['表达符合本主题','我检查了词序、首字母和拼写','我读过自己的句子'],reading.passage||words.join(' '))
 ];
}
export function addHomework(chapters:Chapter[]){
 for(const c of chapters){if(!c.curriculum||!['chinese','math','english'].includes(c.subject)||c.levels.some(l=>l.homework))continue;
  const tasks=c.subject==='chinese'?chinese(c):c.subject==='math'?math(c):english(c);
  c.levels.push(...tasks);
 }
}
/** Guard remote content before shared catalog mutation. */
export function validHomeworkInteraction(l:Level){
 if(l.kind==='highlight')return Array.isArray(l.tokens)&&l.tokens.length>=2&&l.tokens.length<=8&&l.tokens.every(s=>typeof s==='string'&&!!s.trim()&&s.length<=250)&&Array.isArray(l.markedAnswer)&&l.markedAnswer.length>0&&new Set(l.markedAnswer).size===l.markedAnswer.length&&l.markedAnswer.every(i=>Number.isInteger(i)&&i>=0&&i<l.tokens.length);
 if(l.kind==='cloze')return typeof l.passage==='string'&&!!l.passage.trim()&&Array.isArray(l.fields)&&l.fields.length>0&&l.fields.length<=2&&l.fields.every(f=>f&&typeof f.label==='string'&&Array.isArray(f.answers)&&f.answers.length>0&&f.answers.every(s=>typeof s==='string'&&!!s.trim()&&s.length<=160));
 if(l.kind==='compose'){const w=l.writing;return !!w&&typeof w.prompt==='string'&&Number.isInteger(w.minLength)&&w.minLength>0&&Number.isInteger(w.maxLength)&&w.maxLength>=w.minLength&&w.maxLength<=1000&&Array.isArray(w.checks)&&w.checks.length>0&&w.checks.length<=3&&w.checks.every(s=>typeof s==='string'&&!!s.trim());}
 return true;
}
