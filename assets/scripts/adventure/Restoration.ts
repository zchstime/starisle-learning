/** Hand-authored pilot. World progress and learning evidence never imply mastery. */
export type Facility = 'garden'|'canal'|'observatory';
export interface IslandTask {
 id:string; facility:Facility; title:string; phase:'修复'|'变式'|'创作'; kind:'groups'|'cargo';
 goal:string; hint:string; skill:string; total:number; each?:number; units?:number[]; limit?:number;
 requires:string[]; result:string;
}
export const ISLAND_TASKS:IslandTask[] = [
 {id:'garden.restore',facility:'garden',title:'给星萤安家',phase:'修复',kind:'groups',total:12,each:3,skill:'equal-groups',requires:[],goal:'12 只星萤，每个花坛住 3 只。选几座花坛，让它们全部住下。',hint:'每次在一座空花坛放 3 只。放完后，数一数用了几座花坛。',result:'花园亮起来了！星萤送来每块含 6 格能量的星灯，运送物资时可以使用。'},
 {id:'canal.restore',facility:'canal',title:'把水送到花园',phase:'修复',kind:'cargo',total:12,units:[1,3,5],limit:4,skill:'compose-quantity',requires:[],goal:'水渠需要 12 桶水。用 1、3、5 桶装的水箱，最多装 4 箱，正好送达。',hint:'先试一箱 5 桶，还差多少？可以继续用大箱，也可以换成几箱 3 桶。',result:'水渠通水了！获得三格分组器，在花坛中能一次安排 3 只星萤。'},
 {id:'observatory.restore',facility:'observatory',title:'点亮观星台',phase:'修复',kind:'cargo',total:18,units:[1,3,6],limit:3,skill:'compose-quantity',requires:['garden.restore','canal.restore'],goal:'沿修好的水渠送来 18 格能量。船舱最多装 3 块，试试花园送来的星灯。',hint:'三块要装满 18 格。试一试，每块用 6 格能量的星灯。',result:'观星台亮了！天气图开放，两种天气会给运输带来不同条件。'},
 {id:'garden.visitors',facility:'garden',title:'新朋友来做客',phase:'变式',kind:'groups',total:18,each:3,skill:'equal-groups',requires:['garden.restore'],goal:'这次来了 18 只星萤，每个花坛住 3 只。需要几座花坛？',hint:'仍然每座住 3 只。这次朋友更多，试试增加有星萤的花坛。',result:'新朋友都住下了。同样的分组方法，也能帮助更多星萤。'},
 {id:'garden.design',facility:'garden',title:'我的花坛布局',phase:'创作',kind:'groups',total:12,skill:'equal-groups',requires:['garden.restore'],goal:'把 12 只星萤平均安排到至少 2 座花坛，每座最多 6 只。空花坛可以留着。',hint:'试试 2 座各住 6 只，或用更多花坛。每座用到的花坛都要一样多。',result:'你的布局留在了花园里！可以回来尝试另一种平均分法。'},
 {id:'canal.supplies',facility:'canal',title:'给居民送补给',phase:'变式',kind:'cargo',total:15,units:[1,3,5],limit:3,skill:'compose-quantity',requires:['canal.restore'],goal:'居民需要 15 桶水。船舱只能装 3 箱，用 1、3、5 桶装的水箱正好送达。',hint:'箱子数量有限，先看看最大的水箱能帮多少忙。',result:'居民收到了补给！水渠让新的运输路线成为可能。'},
 {id:'canal.design',facility:'canal',title:'试试另一种装法',phase:'创作',kind:'cargo',total:9,units:[1,3,5],limit:5,skill:'compose-quantity',requires:['canal.restore'],goal:'正好送来 9 桶水，最多用 5 箱。这里不止一种装法，你来选择。',hint:'可以从 3 桶的水箱开始，也可以先装 5 桶，再想还差多少。',result:'这条航线有了你自己的装载方案。数量相同，组合也可以不同。'},
 {id:'observatory.sunny',facility:'observatory',title:'晴天航线',phase:'变式',kind:'cargo',total:21,units:[1,3,6],limit:4,skill:'compose-quantity',requires:['observatory.restore'],goal:'天气图：晴天。带上 21 格能量，最多装 4 块，帮助飞船出发。',hint:'先试三块 6 格星灯，还差多少格？',result:'晴天航线准备好了！下次可以换一种天气，比较装载条件。'},
 {id:'observatory.windy',facility:'observatory',title:'有风的航线',phase:'变式',kind:'cargo',total:15,units:[1,3,6],limit:3,skill:'compose-quantity',requires:['observatory.restore'],goal:'天气图：有风。为固定物资，只能放 3 块能量。需要正好 15 格，你会怎么装？',hint:'先放两块 6 格星灯，再看看剩下的一个位置要放什么。',result:'有风的航线也准备好了！你根据天气改变了运输方案。'},
];
export interface IslandEvidence {at:number;attempts:number;hinted:boolean;firstCorrect:boolean;values:number[];}
export interface IslandDraft {at:number;attempts:number;hinted:boolean;values:number[];finished:boolean;}
export interface IslandRecord {first:IslandEvidence;latest:IslandEvidence;}
export interface IslandSave {version:1;records:Record<string,IslandRecord>;drafts:Record<string,IslandDraft>;}
export function emptyIsland():IslandSave{return {version:1,records:{},drafts:{}};}
export function islandTask(id:string){return ISLAND_TASKS.find(t=>t.id===id);}
export function islandUnlocked(s:IslandSave,t:IslandTask):boolean{return t.requires.every(id=>!!s.records[id]);}
/** Prefer resumable work without forcing it; the full task menu remains available. */
export function islandNextTask(s:IslandSave,facility:Facility):IslandTask|undefined{
 const available=ISLAND_TASKS.filter(t=>t.facility===facility&&islandUnlocked(s,t));
 const drafts=available.filter(t=>s.drafts[t.id]&&!s.drafts[t.id].finished)
  .sort((a,b)=>s.drafts[b.id].at-s.drafts[a.id].at||a.id.localeCompare(b.id));
 return drafts[0]||available.find(t=>!s.records[t.id]);
}
export function validIslandValues(t:IslandTask,values:unknown):values is number[]{return Array.isArray(values)&&(t.kind==='groups'?values.length===6:values.length<=(t.limit||5))&&values.every(v=>Number.isInteger(v)&&(t.kind==='groups'?v>=0&&v<=6:t.units!.includes(v)));}
export function islandCorrect(t:IslandTask,values:number[]){
 if(!validIslandValues(t,values)||values.reduce((a,b)=>a+b,0)!==t.total)return false;
 if(t.kind==='cargo')return true;
 const used=values.filter(v=>v>0);return used.length>=2&&used.every(v=>v===(t.each||used[0]));
}
/** Describe only the child's current arrangement; never reveal an unplayed solution. */
export function islandEquation(t:IslandTask,values:number[]){
 const used=values.filter(v=>v>0),total=used.reduce((a,b)=>a+b,0);
 if(!used.length)return t.kind==='groups'?'先安排星萤，看看你的分组算式。':'先装一份物资，看看你的组合算式。';
 if(t.kind==='groups'&&used.length>1&&used.every(v=>v===used[0]))return `${used.length} 组 × 每组 ${used[0]} 只 = ${total} 只`;
 return used.join(' + ')+' = '+total+(t.kind==='groups'?' 只':t.facility==='canal'?' 桶':' 格');
}
/** Compare only the child's own successful cargo creations, never invented solutions. */
export function islandCargoComparison(t:IslandTask,values:number[],previous?:number[]){
 if(t.id!=='canal.design'||!islandCorrect(t,values))return '';
 const describe=(v:number[])=>islandEquation(t,v)+` · ${v.length} 箱`;
 if(!previous||!islandCorrect(t,previous))return '你的方案：'+describe(values)+'\n可以回岛休息，也可以以后试试别的组合。';
 const key=(v:number[])=>[...v].sort((a,b)=>a-b).join(',');
 const same=key(values)===key(previous);
 return '这次：'+describe(values)+'\n上次：'+describe(previous)+'\n'+(same?'两次用了相同的水箱组合，装载顺序不影响总量。':'同样送来 9 桶水，你用了不同的水箱组合。');
}
/** Separate a new equal grouping from a new placement of the same grouping. */
export function islandGardenComparison(t:IslandTask,values:number[],previous?:number[]){
 if(t.id!=='garden.design'||!islandCorrect(t,values))return '';
 const equation=islandEquation(t,values);
 if(!previous||!islandCorrect(t,previous))return '你的花坛：'+equation+'\n这个布局已留在花园里，可以回岛看看。';
 const sameLayout=values.every((v,i)=>v===previous[i]);
 const sameGrouping=values.filter(v=>v>0).length===previous.filter(v=>v>0).length;
 const result=sameLayout?'保留了相同的花坛布局和平均分法。':sameGrouping?'花坛位置变了，每组数量和组数没有变。':'同样是 12 只星萤，你换了一种平均分法。';
 return '这次：'+equation+'\n上次：'+islandEquation(t,previous)+'\n'+result;
}
export function islandFeedback(t:IslandTask,values:number[]){
 const total=values.reduce((a,b)=>a+b,0),unit=t.kind==='groups'?'只星萤':t.facility==='canal'?'桶水':'格能量';
 if(total<t.total){
  const next=t.kind==='cargo'&&values.length===t.limit?`船舱已满，取回一${t.facility==='canal'?'箱':'块'}再换个组合。`:'继续调整看看。';
  return `还差 ${t.total-total} ${unit}，${next}`;
 }
 if(total>t.total)return `多了 ${total-t.total} ${unit}，取回一些再试试。`;
 if(t.kind==='cargo')return '总量正好，装载数量也符合要求。';
 return t.each?`总数对了！再看看，每个用到的花坛都住了 ${t.each} 只吗？`:'总数对了！每个用到的花坛都要一样多，至少用两座。';
}
/** Strictly bounded saves; old completion records are not backfilled as evidence. */
export function cleanIsland(value:any):IslandSave{
 const out=emptyIsland();if(value?.version!==1)return out;
 const time=(n:any)=>Number.isSafeInteger(n)&&n>0;
 const count=(n:any)=>Number.isSafeInteger(n)&&n>=0&&n<=9999;
 const evidence=(t:IslandTask,e:any):IslandEvidence|null=>{
  if(!e||!time(e.at)||!count(e.attempts)||e.attempts<1||typeof e.hinted!=='boolean'||typeof e.firstCorrect!=='boolean'||e.firstCorrect!==(e.attempts===1)||!islandCorrect(t,e.values))return null;
  return {at:e.at,attempts:e.attempts,hinted:e.hinted,firstCorrect:e.firstCorrect,values:[...e.values]};
 };
 // Dependency order prevents imported orphan completions from opening later islands.
 const ordered=[...ISLAND_TASKS].sort((a,b)=>a.requires.length-b.requires.length);
 for(let pass=0;pass<3;pass++)for(const t of ordered){
  if(!islandUnlocked(out,t))continue;
  const r=value.records?.[t.id],first=evidence(t,r?.first),latest=evidence(t,r?.latest);
  if(first&&latest&&first.at<=latest.at)out.records[t.id]={first,latest};
 }
 for(const t of ISLAND_TASKS){
  const d=value.drafts?.[t.id];if(!d||!islandUnlocked(out,t)||!time(d.at)||!count(d.attempts)||typeof d.hinted!=='boolean'||typeof d.finished!=='boolean'||!validIslandValues(t,d.values))continue;
  if(d.finished&&!out.records[t.id])continue;
  out.drafts[t.id]={at:d.at,attempts:d.attempts,hinted:d.hinted,finished:d.finished,values:[...d.values]};
 }return out;
}
/** One attempt survives redraw, exit, reset and reload; only a completed task starts a new attempt. */
export class IslandAttempt {
 values:number[];attempts=0;hinted=false;finished=false;
 constructor(public task:IslandTask,draft?:IslandDraft){
  this.values=task.kind==='groups'?[0,0,0,0,0,0]:[];
  if(draft&&!draft.finished){this.values=[...draft.values];this.attempts=draft.attempts;this.hinted=draft.hinted;}
 }
 change(index:number,delta:number){if(this.finished||this.task.kind!=='groups'||!Number.isInteger(index)||index<0||index>=6||![-1,1,3].includes(delta))return false;const n=this.values[index]+delta;if(n<0||n>6||this.values.reduce((a,b)=>a+b,0)+delta>this.task.total)return false;this.values[index]=n;return true;}
 add(unit:number){if(this.finished||this.task.kind!=='cargo'||!this.task.units!.includes(unit)||this.values.length>=this.task.limit!)return false;this.values.push(unit);return true;}
 remove(index:number){if(this.finished||this.task.kind!=='cargo'||!Number.isInteger(index)||index<0||index>=this.values.length)return false;this.values.splice(index,1);return true;}
 reset(){if(this.finished)return;this.values=this.task.kind==='groups'?[0,0,0,0,0,0]:[];}
 submit(){if(this.finished)return false;this.attempts=Math.min(9999,this.attempts+1);const correct=islandCorrect(this.task,this.values);if(correct)this.finished=true;return correct;}
 evidence(at:number):IslandEvidence{return {at,attempts:this.attempts,hinted:this.hinted,firstCorrect:this.attempts===1,values:[...this.values]};}
 draft(at:number):IslandDraft{return {at,attempts:this.attempts,hinted:this.hinted,finished:this.finished,values:[...this.values]};}
}
