import {ExamSave,cleanExamSave,rewardTier} from '../exam/Exam';
import {KNOWN_LEVEL_IDS,KNOWN_CHAPTER_IDS,KNOWN_SUBJECT_IDS} from './ContentRuntime';
import {learningRoute,hasLearningRoute} from './LearningRoute';
import {ALL_LEVELS, CATALOG, Subject, chapters} from './Catalog';
import {SUBJECTS} from './Subjects';
export const SAVE_KEY='starisle.adventure.v3';
export interface SavePort {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export class Progress {
 exams:ExamSave={records:{}};
 subject:Subject=SUBJECTS[0].id;grade=2;chapter=0;sound=true;done:string[]=[];earnedMedals:string[]=[]; failed=false;
 constructor(private store:SavePort){try{const s=JSON.parse(store.getItem(SAVE_KEY)||'null');if(s?.version===3){this.exams=cleanExamSave(s.exams);this.subject=SUBJECTS.some(x=>x.id===s.subject)?s.subject:SUBJECTS[0].id;this.grade=Number.isInteger(s.grade)&&s.grade>=1&&s.grade<=6?s.grade:2;this.chapter=Number.isInteger(s.chapter)&&s.chapter>=0&&s.chapter<chapters(this.subject,this.grade).length?s.chapter:0;if(typeof s.chapterId==='string'){const at=chapters(this.subject,this.grade).findIndex(c=>c.id===s.chapterId);if(at>=0)this.chapter=at;}this.sound=s.sound!==false;const valid=new Set([...KNOWN_LEVEL_IDS,...ALL_LEVELS.map(l=>l.id)]);this.earnedMedals=Array.isArray(s.medals)?Array.from(new Set<string>(s.medals.filter((id:any)=>typeof id==='string'&&this.validMedals().has(id)))):[];this.done=Array.isArray(s.done)?s.done.filter((id:any,index:number,all:any[])=>typeof id==='string'&&valid.has(id)&&all.indexOf(id)===index):[];}}catch{this.failed=true;}this.refreshMedals();}
 save(){this.refreshMedals();try{this.store.setItem(SAVE_KEY,JSON.stringify({version:3,subject:this.subject,grade:this.grade,chapter:this.chapter,chapterId:chapters(this.subject,this.grade)[this.chapter]?.id,sound:this.sound,done:this.done,medals:this.earnedMedals,exams:this.exams}));this.failed=false;}catch{this.failed=true;}}
 complete(id:string){if(!ALL_LEVELS.some(l=>l.id===id))return false;if(!this.done.includes(id))this.done.push(id);this.save();return true;}
 gradeStatus(subject:Subject=this.subject,grade:number=this.grade){
  const list=chapters(subject,grade),levels=list.flatMap(c=>c.levels),done=levels.filter(l=>this.done.includes(l.id)).length;
  return {done,total:levels.length,complete:levels.length>0&&done===levels.length,chapters:list.filter(c=>c.levels.every(l=>this.done.includes(l.id))).length};
 }
 chapterComplete(id:string){const c=CATALOG.find(c=>c.id===id);return !!c&&c.levels.length>0&&c.levels.every(l=>this.done.includes(l.id));}
 private validMedals(){return new Set([...[...KNOWN_CHAPTER_IDS].map(id=>'chapter:'+id),...[...KNOWN_SUBJECT_IDS].flatMap(id=>[...Array.from({length:6},(_,i)=>`grade:${id}:${i+1}`),'subject:'+id])]);}
 private refreshMedals(){const earned=new Set(this.earnedMedals);for(const c of CATALOG)if(this.chapterComplete(c.id))earned.add('chapter:'+c.id);for(const s of SUBJECTS){for(let g=1;g<=6;g++)if(this.gradeStatus(s.id,g).complete)earned.add(`grade:${s.id}:${g}`);if(this.subjectComplete(s.id))earned.add('subject:'+s.id);}this.earnedMedals=Array.from(earned);}
 /** Scores derive from unique completed task IDs: old saves migrate without duplicate rewards. */
 examAccess(subject:Subject=this.subject,grade:number=this.grade){const status=this.gradeStatus(subject,grade);return {...status,remaining:status.total-status.done,unlocked:status.complete};}
 get points(){return this.done.length*100+Object.values(this.exams.records).reduce((n,r)=>n+rewardTier(r.best).points,0);}
 get experience(){return this.done.length*30;}
 get heroLevel(){return 1+Math.floor(this.experience/180);}
 get levelExperience(){return this.experience%180;}
 get medalCount(){return this.earnedMedals.length;}
 hasGradeMedal(subject:Subject,grade:number){return this.earnedMedals.includes(`grade:${subject}:${grade}`);}
 subjectComplete(subject:Subject=this.subject){return Array.from({length:6},(_,i)=>this.gradeStatus(subject,i+1).complete).every(Boolean);}
 nextUnfinished(){if(hasLearningRoute(this.subject)){const stop=learningRoute(this.subject,this.grade).find(s=>!this.done.includes(s.task.id));return stop?{chapter:stop.chapter,level:stop.level}:null;}const list=chapters(this.subject,this.grade);for(let chapter=0;chapter<list.length;chapter++){const level=list[chapter].levels.findIndex(l=>!this.done.includes(l.id));if(level>=0)return {chapter,level};}return null;}
 advanceGrade(){if(this.grade>=6||!this.gradeStatus().complete)return false;this.grade++;this.chapter=0;const next=this.nextUnfinished();if(next)this.chapter=next.chapter;this.save();return true;}
 count(id:string){return CATALOG.find(c=>c.id===id)?.levels.filter(l=>this.done.includes(l.id)).length||0;}
}
