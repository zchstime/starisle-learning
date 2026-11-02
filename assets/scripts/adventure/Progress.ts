import {IslandSave,IslandAttempt,ISLAND_TASKS,cleanIsland,islandUnlocked,islandCorrect} from './Restoration';
import {LAB_IDS,GIFTS,DECOR_GIFTS} from './PlayLab';
import {ExamSave,cleanExamSave,rewardTier} from '../exam/Exam';
import {KNOWN_LEVEL_IDS,KNOWN_CHAPTER_IDS,KNOWN_SUBJECT_IDS} from './ContentRuntime';
import {learningRoute,hasLearningRoute} from './LearningRoute';
import {ALL_LEVELS, CATALOG, Subject, chapters} from './Catalog';
import {SUBJECTS} from './Subjects';
export const SAVE_KEY='starisle.adventure.v3';
export interface SavePort {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export const TREE_STYLES=['新芽树','月光树','暖阳树'];
export class Progress {
 private giftDisplay={slots:['','',''],updatedAt:1};
 wishGift='';
 island:IslandSave=cleanIsland(null);
 private gardenLayout:{slots:number[];updatedAt:number}|null=null;
 care:string[]=[];
 labDone:string[]=[];gifts:string[]=[];equippedGift='';
 exams:ExamSave={records:{}};
 subject:Subject=SUBJECTS[0].id;grade=2;chapter=0;sound=true;done:string[]=[];earnedMedals:string[]=[]; failed=false;
 constructor(private store:SavePort){try{const s=JSON.parse(store.getItem(SAVE_KEY)||'null');if(s?.version===3){this.island=cleanIsland(s.island);this.wishGift=typeof s.wishGift==='string'&&GIFTS.some(g=>g.id===s.wishGift)?s.wishGift:'';if(s.giftDisplay&&Array.isArray(s.giftDisplay.slots)&&s.giftDisplay.slots.length===3&&Number.isSafeInteger(s.giftDisplay.updatedAt)&&s.giftDisplay.updatedAt>0)this.giftDisplay={slots:s.giftDisplay.slots.map((id:any)=>typeof id==='string'&&DECOR_GIFTS.some(g=>g.id===id)?id:''),updatedAt:s.giftDisplay.updatedAt};if(s.gardenLayout&&Array.isArray(s.gardenLayout.slots)&&s.gardenLayout.slots.length===8&&Number.isSafeInteger(s.gardenLayout.updatedAt)&&s.gardenLayout.updatedAt>0)this.gardenLayout={slots:s.gardenLayout.slots.map((v:any)=>Number.isInteger(v)&&v>=0&&v<3?v:-1),updatedAt:s.gardenLayout.updatedAt};this.care=Array.isArray(s.care)?s.care:[];this.labDone=Array.isArray(s.labDone)?Array.from(new Set<string>(s.labDone.filter((id:any)=>LAB_IDS.has(id)))):[];this.gifts=Array.isArray(s.gifts)?GIFTS.filter(g=>s.gifts.includes(g.id)).map(g=>g.id):[];this.equippedGift=typeof s.equippedGift==='string'?s.equippedGift:'';this.exams=cleanExamSave(s.exams);this.subject=SUBJECTS.some(x=>x.id===s.subject)?s.subject:SUBJECTS[0].id;this.grade=Number.isInteger(s.grade)&&s.grade>=1&&s.grade<=6?s.grade:2;this.chapter=Number.isInteger(s.chapter)&&s.chapter>=0&&s.chapter<chapters(this.subject,this.grade).length?s.chapter:0;if(typeof s.chapterId==='string'){const at=chapters(this.subject,this.grade).findIndex(c=>c.id===s.chapterId);if(at>=0)this.chapter=at;}this.sound=s.sound!==false;const valid=new Set([...KNOWN_LEVEL_IDS,...ALL_LEVELS.map(l=>l.id)]);this.earnedMedals=Array.isArray(s.medals)?Array.from(new Set<string>(s.medals.filter((id:any)=>typeof id==='string'&&this.validMedals().has(id)))):[];this.done=Array.isArray(s.done)?s.done.filter((id:any,index:number,all:any[])=>typeof id==='string'&&valid.has(id)&&all.indexOf(id)===index):[];}}catch{this.failed=true;}this.cleanCare();if(!this.gardenLayout)this.gardenLayout={slots:Array.from({length:8},(_,i)=>i<this.garden.trees?0:-1),updatedAt:1};this.refreshMedals();this.cleanGifts();}
 save(){this.refreshMedals();this.cleanGifts();try{this.store.setItem(SAVE_KEY,JSON.stringify({version:3,giftDisplay:this.giftDisplay,wishGift:this.wishGift,island:this.island,gardenLayout:this.gardenLayout,care:this.care,labDone:this.labDone,gifts:this.gifts,equippedGift:this.equippedGift,subject:this.subject,grade:this.grade,chapter:this.chapter,chapterId:chapters(this.subject,this.grade)[this.chapter]?.id,sound:this.sound,done:this.done,medals:this.earnedMedals,exams:this.exams}));this.failed=false;}catch{this.failed=true;}}
 /** Writes use the same account-scoped v3 save and cloud queue as the main game. */
 saveIsland(attempt:IslandAttempt){
  const task=ISLAND_TASKS.find(t=>t===attempt.task);
  if(!task||!islandUnlocked(this.island,task))return false;
  const previous=this.island.records[task.id];
  const at=Math.max(Date.now(),(this.island.drafts[task.id]?.at||0)+1,(previous?.latest.at||0)+1);
  if(attempt.finished){
   if(attempt.attempts<1||!islandCorrect(task,attempt.values))return false;
   // A finished UI can be redrawn or retried after storage failure without minting a new record.
   if(!this.island.drafts[task.id]?.finished){
    const evidence=attempt.evidence(at);
    this.island.records[task.id]={first:previous?.first||evidence,latest:evidence};
    this.recordCare(task.id);
   }
  }
  this.island.drafts[task.id]=attempt.draft(at);this.save();return !this.failed;
 }
 complete(id:string){if(!ALL_LEVELS.some(l=>l.id===id))return false;if(!this.done.includes(id))this.done.push(id);this.recordCare(id);this.save();return true;}
 gradeStatus(subject:Subject=this.subject,grade:number=this.grade){
  const list=chapters(subject,grade),levels=list.flatMap(c=>c.levels),done=levels.filter(l=>this.done.includes(l.id)).length;
  return {done,total:levels.length,complete:levels.length>0&&done===levels.length,chapters:list.filter(c=>c.levels.every(l=>this.done.includes(l.id))).length};
 }
 chapterComplete(id:string){const c=CATALOG.find(c=>c.id===id);return !!c&&c.levels.length>0&&c.levels.every(l=>this.done.includes(l.id));}
 private validMedals(){return new Set([...[...KNOWN_CHAPTER_IDS].map(id=>'chapter:'+id),...[...KNOWN_SUBJECT_IDS].flatMap(id=>[...Array.from({length:6},(_,i)=>`grade:${id}:${i+1}`),'subject:'+id])]);}
 private refreshMedals(){const earned=new Set(this.earnedMedals);for(const c of CATALOG)if(this.chapterComplete(c.id))earned.add('chapter:'+c.id);for(const s of SUBJECTS){for(let g=1;g<=6;g++)if(this.gradeStatus(s.id,g).complete)earned.add(`grade:${s.id}:${g}`);if(this.subjectComplete(s.id))earned.add('subject:'+s.id);}this.earnedMedals=Array.from(earned);}
 /** Scores derive from unique completed task IDs: old saves migrate without duplicate rewards. */
 examAccess(subject:Subject=this.subject,grade:number=this.grade){const status=this.gradeStatus(subject,grade);return {...status,remaining:status.total-status.done,unlocked:status.complete};}
 get points(){return (this.done.length+this.labDone.length+Object.keys(this.island.records).length)*100+Object.values(this.exams.records).reduce((n,r)=>n+rewardTier(r.best).points,0);}
 private cleanGifts(){let budget=this.points;this.gifts=GIFTS.filter(g=>{if(!this.gifts.includes(g.id)||g.cost>budget)return false;budget-=g.cost;return true;}).map(g=>g.id);if(!this.gifts.includes(this.equippedGift)||GIFTS.find(g=>g.id===this.equippedGift)?.art)this.equippedGift='';this.giftDisplay.slots=this.displayedGifts;if(this.gifts.includes(this.wishGift))this.wishGift='';}
 get balance(){return Math.max(0,this.points-GIFTS.filter(g=>this.gifts.includes(g.id)).reduce((n,g)=>n+g.cost,0));}
 completeLab(id:string){if(!LAB_IDS.has(id))return false;this.recordCare(id);const fresh=!this.labDone.includes(id);if(fresh)this.labDone.push(id);this.save();return fresh;}
 redeem(id:string){const gift=GIFTS.find(g=>g.id===id);if(!gift||this.gifts.includes(id)||this.balance<gift.cost)return false;this.gifts.push(id);if(!gift.art)this.equippedGift=id;if(this.wishGift===id)this.wishGift='';this.save();return true;}
 setWish(id:string){if(id!==''&&(!GIFTS.some(g=>g.id===id)||this.gifts.includes(id)))return false;this.wishGift=id;this.save();return true;}
 get displayedGifts(){const seen=new Set<string>();return this.giftDisplay.slots.map(id=>{if(!id||seen.has(id)||!this.gifts.includes(id)||!DECOR_GIFTS.some(g=>g.id===id))return '';seen.add(id);return id;});}
 placeGift(id:string,slot:number){if(!Number.isInteger(slot)||slot<0||slot>=3||(id!==''&&(!this.gifts.includes(id)||!DECOR_GIFTS.some(g=>g.id===id))))return false;const slots=this.displayedGifts,from=slots.indexOf(id);if(id&&from>=0&&from!==slot)slots[from]=slots[slot];slots[slot]=id;this.giftDisplay={slots,updatedAt:Math.max(Date.now(),this.giftDisplay.updatedAt+1)};this.save();return true;}
 /** Local calendar days; revisiting never removes growth. No login-only rewards. */
 private day(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
 private cleanCare(){const valid=new Set([...KNOWN_LEVEL_IDS,...ALL_LEVELS.map(l=>l.id),...LAB_IDS,...ISLAND_TASKS.map(t=>t.id)]);this.care=Array.from(new Set(this.care.filter(v=>{if(typeof v!=='string')return false;const date=v.slice(0,10),id=v.slice(11);const parsed=new Date(date+'T12:00:00');return v[10]==='|'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!isNaN(parsed.getTime())&&this.day(parsed)===date&&valid.has(id); })));}
 private recordCare(id:string){const day=this.day(),key=day+'|'+id;if(!this.care.includes(key)&&this.care.filter(v=>v.startsWith(day+'|')).length<3)this.care.push(key);}
 get garden(){const tasks=this.done.length+this.labDone.length+Object.keys(this.island.records).length,days=new Set(this.care.map(v=>v.slice(0,10))).size,today=Math.min(3,this.care.filter(v=>v.startsWith(this.day()+'|')).length);return {tasks,trees:Math.floor(tasks/3),nextTree:3-tasks%3,days,today,keepsakes:Math.floor(days/7)};}
 /** Eight visible plots; excess earned saplings stay in the nursery. */
 get gardenSlots():number[]{let remaining=this.garden.trees;return (this.gardenLayout?.slots||Array.from({length:8},(_,i)=>i<remaining?0:-1)).map(v=>v>=0&&remaining-->0?v:-1);}
 private saveGarden(slots:number[]){this.gardenLayout={slots,updatedAt:Math.max(Date.now(),(this.gardenLayout?.updatedAt||0)+1)};this.save();}
 plantTree(slot:number,style:number){const slots=this.gardenSlots;if(!Number.isInteger(slot)||slot<0||slot>=8||!Number.isInteger(style)||style<0||style>=TREE_STYLES.length)return false;if(slots[slot]<0&&slots.filter(v=>v>=0).length>=this.garden.trees)return false;slots[slot]=style;this.saveGarden(slots);return true;}
 moveTree(from:number,to:number){const slots=this.gardenSlots;if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=8||to<0||to>=8||from===to||slots[from]<0)return false;[slots[from],slots[to]]=[slots[to],slots[from]];this.saveGarden(slots);return true;}
 get gardenStory(){const planted=this.gardenSlots.filter(v=>v>=0).length;return planted>=6?'观星花园建好了！星宝邀请你坐下来看看星空。':planted>=3?'树荫小路连起来了！为观星台布置你喜欢的树吧。':planted>=1?'第一片树荫有了！星宝在这里发现了一条观星小路。':'星宝：一起种一座观星花园吧，你来决定它的样子。';}
 get experience(){return (this.done.length+this.labDone.length+Object.keys(this.island.records).length)*30;}
 get heroLevel(){return 1+Math.floor(this.experience/180);}
 get levelExperience(){return this.experience%180;}
 get medalCount(){return this.earnedMedals.length;}
 hasGradeMedal(subject:Subject,grade:number){return this.earnedMedals.includes(`grade:${subject}:${grade}`);}
 subjectComplete(subject:Subject=this.subject){return Array.from({length:6},(_,i)=>this.gradeStatus(subject,i+1).complete).every(Boolean);}
 nextUnfinished(){if(hasLearningRoute(this.subject)){const stop=learningRoute(this.subject,this.grade).find(s=>!this.done.includes(s.task.id));return stop?{chapter:stop.chapter,level:stop.level}:null;}const list=chapters(this.subject,this.grade);for(let chapter=0;chapter<list.length;chapter++){const level=list[chapter].levels.findIndex(l=>!this.done.includes(l.id));if(level>=0)return {chapter,level};}return null;}
 advanceGrade(){if(this.grade>=6||!this.gradeStatus().complete)return false;this.grade++;this.chapter=0;const next=this.nextUnfinished();if(next)this.chapter=next.chapter;this.save();return true;}
 count(id:string){return CATALOG.find(c=>c.id===id)?.levels.filter(l=>this.done.includes(l.id)).length||0;}
}
