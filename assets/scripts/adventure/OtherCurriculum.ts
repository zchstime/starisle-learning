import type {Chapter,Level} from './Catalog';
import {SUBJECT_STORIES} from './SubjectStories';
import {subjectInfo,Subject} from './Subjects';
export const OTHER_SUBJECTS=Object.keys(SUBJECT_STORIES) as (keyof typeof SUBJECT_STORIES)[];
const PRACTICE_MODES={science:'experiment',ethics:'roleplay',pe:'move',labor:'labor',it:'device',practice:'project'} as const;
function operationLevel(subject:keyof typeof SUBJECT_STORIES,grade:number,stage:number,row:(typeof SUBJECT_STORIES)[keyof typeof SUBJECT_STORIES][number],id:string):Level{
 if(subject==='art')return {id:`${id}.l4`,kind:'draw',title:'自由创作画布',goal:`围绕“${row.title}”完成一幅自己的画，可以用线条、形状和颜色表达`,drawPrompt:stage?'先安排主体和背景，再补充色彩细节。':'先大胆画出主要轮廓，再选择喜欢的颜色。',palette:['#238E90','#E6AF39','#E77D73','#597CCB','#6C4B3E'],minStrokes:Math.min(6,grade+2),minColors:stage?2:1,target:0,stage:'challenge',hint:'直接在画布上拖动画线；可换颜色、撤回或清空。这里不评价作品美丑。',explanation:'你留下了真实的绘画过程。系统只确认画笔和颜色的使用，不评价作品美丑或艺术水平。',coachHints:['先画最大的主体轮廓，不必追求一次画好。','再用不同线条或颜色补充背景和细节。']};
 if(subject==='music'){
  const patterns=[[1,1,1],[1,1,2],[1,2,1],[1,1,2,1],[1,2,2,1],[1,1,2,1,2]];
  return {id:`${id}.l4`,kind:'rhythm',title:'节奏拍击台',goal:`用手指拍出“${row.title}”的短拍与长拍节奏`,rhythm:patterns[(grade-1+stage)%patterns.length],bpm:stage?84:72,target:0,stage:'challenge',hint:'看节奏图连续拍击；长线的等待时间约是圆点的两倍。',explanation:'你完成了一次节奏模仿。系统依据拍击间隔提供练习反馈，不替代老师对音乐表现的评价。',coachHints:['先用嘴念“短、短、长”，再开始拍。','保持短拍稳定，遇到长拍多等一拍。']};
 }
 const mode=PRACTICE_MODES[subject as keyof typeof PRACTICE_MODES]||'observe';
 const safety=subject==='pe'?'先确认周围安全、穿着适合运动':subject==='science'?'先征得家长或老师同意并准备安全材料':subject==='it'?'先确认设备、账号和个人信息安全':null;
 const finish=subject==='pe'?'放松身体并说出运动感受':subject==='science'?'记录看到的现象，不编造结果':subject==='ethics'?'和同伴互换角色再练一次':subject==='labor'?'整理工具并检查现场':subject==='it'?'保存作品并检查是否泄露个人信息':'展示成果并说出下一次如何改进';
 const steps=[...(safety?[safety]:[]),...row.steps,finish].slice(0,6);
 return {id:`${id}.l4`,kind:'practice',title:'真实行动记录',goal:`离开答题卡，实际完成一次“${row.title}”任务，再如实记录过程`,practiceMode:mode,practiceSteps:steps,target:0,stage:'challenge',hint:'先做、后勾选。可以请家长、同伴或老师协助；没有完成的步骤不要勾选。',explanation:'你记录了本次实践过程。勾选只代表“已完成这一步”，不代表系统已经自动判断动作或作品质量。',coachHints:['先准备真实材料或找到练习伙伴，再开始行动。','每完成一步再勾选，并说出你观察到或做到的内容。']};
}
/** Grade-specific original missions; stage order is a game route, not textbook unit numbering. */
export function otherCurriculum():Chapter[]{
 const result:Chapter[]=[];
 for(const subject of OTHER_SUBJECTS){
  const rows=SUBJECT_STORIES[subject];
  rows.forEach((row,index)=>{
   const grade=row.grade,stage=Math.floor(index/6),id=`${subject}.g${grade}.mission${stage+1}`;
   const levels:Level[]=row.questions.map(([goal,options],i)=>({id:`${id}.l${i+1}`,kind:'choice',title:i?'应用补给站':'发现线索',goal,options:[...options],target:0,voice:goal,stage:i?'practice':'warmup',hint:'选一张卡，帮星宝继续行动。',explanation:`${options[0]}。把这个办法用在刚才的情境中。`,coachHints:['先想清任务需要解决什么问题。',`可以从“${options[0]}”这个方向思考。`]}));
   const pairs:[string,string][]=row.questions.map(([goal,options])=>[goal,options[0]]);pairs.push(['行动的第一步',row.steps[0]]);
   levels[1]={id:`${id}.l2`,kind:'match',title:'线索配对桥',goal:`把「${row.title}」里的问题、做法和行动线索配对`,pairs,target:0,voice:`完成${row.title}的线索配对。`,stage:'practice',hint:'先点左边线索，再点右边对应卡片。',explanation:pairs.map(pair=>pair.join(' → ')).join('；'),coachHints:['逐条读左边线索，找最直接对应的做法。',`行动要从“${row.steps[0]}”开始。`]};
   const words=[...row.steps];
   levels.push({id:`${id}.l3`,kind:'sentence',title:'行动计划桥',goal:`完成「${row.title}」的行动计划`,words,answer:words,target:0,voice:`完成${row.title}的行动计划。按先后顺序放好卡片。`,stage:'challenge',hint:'按先后点卡片，点已选卡片可以取回。',explanation:words.join('，然后')+'。',coachHints:[`先从“${words[0]}”开始。`,'想一想，哪些准备要在行动之前完成。']});
   if(subject==='music'&&stage===0){
    const hearing=[['听两声琴音，哪一声更高？',['第一声','第二声','一样高'],1],['听这组鼓点，一共几下？',['两下','四下','六下'],1],['听这段旋律，总体怎样变化？',['上行','下行','保持相同'],0],['听两声琴音，哪一声更弱？',['第一声','第二声','一样强'],1],['听两组相同数量的鼓点，哪组更快？',['第一组','第二组','一样快'],1],['听三段旋律，哪两段相同？',['第一与第三段','第一与第二段','第二与第三段'],0]] as const;
    const [goal,options,target]=hearing[grade-1];levels[0]={id:`${id}.l1`,kind:'choice',title:'听音点亮舞台',goal,options:[...options],target,voice:`tone_mission_g${grade}`,stage:'warmup',hint:'先听声音，可以点「再听一次」。',explanation:['第二声更高。','这一组共有四下鼓点。','三个音由低到高，形成上行。','第二声更轻，力度更弱。','两组都有四下，第二组间隔短、速度快。','第一与第三段的音高和顺序相同，形成呼应。'][grade-1]};
   }
   if(subject==='art'&&stage===1){const cells=[6,8,12,12,16,16][grade-1],target=[3,4,6,4,8,10][grade-1];levels[1]={id:`${id}.l2`,kind:'tiles',title:'星光拼贴台',goal:`在 ${cells} 格展板中铺 ${target} 块金色花砖，位置由你设计`,cells,cols:4,target,stage:'practice',hint:`点格子铺花砖；铺够 ${target} 块后完成。`,voice:`在${cells}格展板中铺${target}块金色花砖，位置由你设计。`,explanation:'你完成了材料数量任务！图案可以有多种设计，这里不评价作品美丑。'};}
   levels.push(operationLevel(subject,grade,stage,row,id));
   const semester=stage?'下册' as const:'上册' as const;
   result.push({id,subject:subject as Subject,grade,title:row.title,topic:`${subjectInfo(subject as Subject).name} · ${grade}年级${stage?'应用实践':'基础探索'}`,art:subjectInfo(subject as Subject).art,alignment:'enrichment',curriculum:{semester,theme:row.title,order:stage,source:'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',verified:false,volume:`${grade}年级${semester}`,unit:`课程主题 ${row.title}`,unitType:'theme',objectives:[`理解“${row.title}”中的关键概念或行为要求`,'能够按步骤完成情境任务并解释选择依据','把所学方法迁移到相近的生活或实践场景'],reviewStatus:'draft'},levels});
  });
 }
 return result;
}
