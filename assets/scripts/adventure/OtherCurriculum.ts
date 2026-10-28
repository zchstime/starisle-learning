import type {Chapter,Level} from './Catalog';
import {SUBJECT_STORIES} from './SubjectStories';
import {subjectInfo,Subject} from './Subjects';
export const OTHER_SUBJECTS=Object.keys(SUBJECT_STORIES) as (keyof typeof SUBJECT_STORIES)[];
/** Grade-specific original missions; stage order is a game route, not textbook unit numbering. */
export function otherCurriculum():Chapter[]{
 const result:Chapter[]=[];
 for(const subject of OTHER_SUBJECTS){
  const rows=SUBJECT_STORIES[subject];
  rows.forEach((row,index)=>{
   const grade=row.grade,stage=Math.floor(index/6),id=`${subject}.g${grade}.mission${stage+1}`;
   const levels:Level[]=row.questions.map(([goal,options],i)=>({id:`${id}.l${i+1}`,kind:'choice',title:i?'应用补给站':'发现线索',goal,options:[...options],target:0,voice:goal,stage:i?'practice':'warmup',hint:'选一张卡，帮星宝继续行动。',explanation:`${options[0]}。把这个办法用在刚才的情境中。`,coachHints:['先想清任务需要解决什么问题。',`可以从“${options[0]}”这个方向思考。`]}));
   const words=[...row.steps];
   levels.push({id:`${id}.l3`,kind:'sentence',title:'行动计划桥',goal:`完成「${row.title}」的行动计划`,words,answer:words,target:0,voice:`完成${row.title}的行动计划。按先后顺序放好卡片。`,stage:'challenge',hint:'按先后点卡片，点已选卡片可以取回。',explanation:words.join('，然后')+'。',coachHints:[`先从“${words[0]}”开始。`,'想一想，哪些准备要在行动之前完成。']});
   if(subject==='music'&&stage===0){
    const hearing=[['听两声琴音，哪一声更高？',['第一声','第二声','一样高'],1],['听这组鼓点，一共几下？',['两下','四下','六下'],1],['听这段旋律，总体怎样变化？',['上行','下行','保持相同'],0],['听两声琴音，哪一声更弱？',['第一声','第二声','一样强'],1],['听两组相同数量的鼓点，哪组更快？',['第一组','第二组','一样快'],1],['听三段旋律，哪两段相同？',['第一与第三段','第一与第二段','第二与第三段'],0]] as const;
    const [goal,options,target]=hearing[grade-1];levels[0]={id:`${id}.l1`,kind:'choice',title:'听音点亮舞台',goal,options:[...options],target,voice:`tone_mission_g${grade}`,stage:'warmup',hint:'先听声音，可以点「再听一次」。',explanation:['第二声更高。','这一组共有四下鼓点。','三个音由低到高，形成上行。','第二声更轻，力度更弱。','两组都有四下，第二组间隔短、速度快。','第一与第三段的音高和顺序相同，形成呼应。'][grade-1]};
   }
   if(subject==='art'&&stage===1){const cells=[6,8,12,12,16,16][grade-1],target=[3,4,6,4,8,10][grade-1];levels[1]={id:`${id}.l2`,kind:'tiles',title:'星光拼贴台',goal:`给展板铺 ${target} 块金色花砖，位置由你设计`,cells,cols:grade<3?4:4,target,stage:'practice',hint:`点格子铺花砖；铺够 ${target} 块后完成。`,voice:`给展板铺${target}块金色花砖，位置由你设计。`,explanation:'你完成了材料数量任务！图案可以有多种设计，这里不评价作品美丑。'};}
   result.push({id,subject:subject as Subject,grade,title:row.title,topic:`${subjectInfo(subject as Subject).name} · ${grade}年级${stage?'应用实践':'基础探索'}`,art:subjectInfo(subject as Subject).art,alignment:'enrichment',curriculum:{semester:stage?'下册':'上册',theme:row.title,order:stage,source:'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',verified:false},levels});
  });
 }
 return result;
}
