import {ROUTE_PAPERS} from './RoutePapers';
/** Versioned, subject-neutral trial contracts. Content remains independently authored. */
export interface ExamQuestion {id:string;kind:'number'|'choice'|'order'|'match';prompt:string;prompts?:string[];options?:string[];answer:string;explanation:string;points:number;topic:string;passage?:string;sourceId?:string;}
export interface ExamPaper {id:string;title:string;subject:string;grade:number;minutes:number;scope:string;questions:ExamQuestion[];}
export interface ExamAttempt {paperId:string;answers:Record<string,string>;marked:string[];startedAt:number;deadline:number;updatedAt:number;submitted:boolean;}
export interface ExamRecord {best:number;latest:number;at:number;}
export interface ExamSave {records:Record<string,ExamRecord>;attempt?:ExamAttempt;drafts?:Record<string,ExamAttempt>;}
export const rewardTier=(score:number)=>score>=100?{name:'璀璨星冠',points:300,color:'#FFD269'}:score>=90?{name:'金翼星章',points:220,color:'#F1C369'}:score>=80?{name:'银月星章',points:160,color:'#AEDBE9'}:score>=60?{name:'青芽星章',points:100,color:'#9CD6B8'}:{name:'勇气星章',points:40,color:'#C6B8EC'};
export function answeredQuestion(q:ExamQuestion,value:string){return !!value&&(q.kind!=='number'||/^-?\d+(?:\.\d+)?$/.test(value))&&(q.kind!=='order'||value.split('|').length===q.options.length)&&(q.kind!=='match'||value.split('|').length===q.prompts.length&&value.split('|').every(Boolean));}
/** Numeric fields accept equivalent decimal notation, never empty input or JS expressions. */
export function correctAnswer(q:ExamQuestion,value:string){const v=String(value??'').trim();if(q.kind!=='number')return v===q.answer;return /^-?\d+(?:\.\d+)?$/.test(v)&&Number.isFinite(Number(v))&&Number(v)===Number(q.answer);}
export function editNumber(current:string,key:string){if(key==='清空')return '';if(key==='退格')return current.slice(0,-1);if(key==='-')return current.startsWith('-')?current.slice(1):current.length<12?'-'+current:current;if(key==='.')return current.includes('.')?current:current.length<12?(current===''?'0.':current==='-'?'-0.':current+'.'):current;return /^\d$/.test(key)&&current.length<12?current+key:current;}
export function scorePaper(p:ExamPaper,a:ExamAttempt){return p.questions.reduce((n,q)=>n+(correctAnswer(q,a.answers[q.id])?q.points:0),0);}
export function beginPaper(p:ExamPaper,now=Date.now()):ExamAttempt{return {paperId:p.id,answers:{},marked:[],startedAt:now,deadline:now+p.minutes*60000,updatedAt:now,submitted:false};}
export function settlePaper(p:ExamPaper,save:ExamSave,now=Date.now()){const a=save.attempt;if(!a||a.paperId!==p.id||a.submitted)return null;const score=scorePaper(p,a),old=save.records[p.id];const best=Math.max(score,old?.best??0);const reward=rewardTier(best).points-(old?rewardTier(old.best).points:0);a.submitted=true;a.updatedAt=now;save.records[p.id]={best,latest:score,at:now};return {score,best,reward};}
export const PAPERS:ExamPaper[]=[{id:'math-g2-final-original-v1',title:'星光守护者 · 数学综合试炼',subject:'math',grade:2,minutes:30,scope:'二年级原创综合样卷：100以内加减、表内乘除、长度、时间、图形及生活应用。参考人教版能力主题，非官方期末卷或完整教材覆盖。',questions:[
 ['number','星桥有 36 颗星，又亮起 28 颗。一共有多少颗？','64','36 + 28 = 64。','100以内加法'],
 ['number','飞船装着 72 份补给，送出 35 份，还剩多少份？','37','72 − 35 = 37。','退位减法'],
 ['choice','每盏星灯有 6 颗晶石，4 盏共有多少颗？','24','6 × 4 = 24。','表内乘法',['10','20','24','28']],
 ['number','把 42 颗种子平均分给 7 座花园，每座分几颗？','6','42 ÷ 7 = 6。','平均分'],
 ['choice','一支铅笔长约 18（ ）。选择合适的单位。','厘米','铅笔的长度通常用厘米表示。','长度单位',['米','厘米','小时','元']],
 ['number','1 米长的彩带剪去 30 厘米，还剩多少厘米？','70','1 米 = 100 厘米，100 − 30 = 70。','单位换算'],
 ['choice','集合时间是 8:30，再过 20 分钟是什么时间？','8:50','30 分加 20 分是 50 分，仍在 8 时。','时间',['8:10','8:40','8:50','9:00']],
 ['order','把星球编号从小到大排好。依次点选卡片。','27|45|54|72','先比较十位，相同再比较个位。','数的大小',['54','27','72','45']],
 ['number','星宝有 50 枚星币，买书花 18 枚、买笔花 7 枚，还剩多少？','25','50 − 18 − 7 = 25。','两步计算'],
 ['choice','哪个图形有 4 个直角，4 条边都一样长？','正方形','正方形四条边相等，有四个直角。','图形',['三角形','圆','正方形','五边形']],
 ['number','9 排星灯，每排 8 盏，一共有多少盏？','72','9 × 8 = 72。','乘法口诀'],
 ['number','56 位伙伴，每艘船坐 8 位，需要几艘船？','7','56 ÷ 8 = 7。','除法应用'],
 ['choice','哪一个算式可以表示 5 个 7 相加？','7 × 5','相同加数是 7，共有 5 个。','乘法意义',['7 + 5','7 − 5','7 × 5','7 ÷ 5']],
 ['number','先有 29 只萤火虫，飞来 17 只，又飞走 8 只，现在有几只？','38','29 + 17 − 8 = 38。','加减混合'],
 ['order','按经过的时间先后排列航行日程。','7:30|8:00|9:15|10:00','先比较时数，再比较分钟。','时间顺序',['9:15','7:30','10:00','8:00']],
 ['choice','三根小棒长 8 厘米、5 厘米、12 厘米，最长比最短长多少？','7 厘米','12 − 5 = 7 厘米。','长度比较',['3 厘米','4 厘米','7 厘米','17 厘米']],
 ['number','每盒 6 颗糖，买 3 盒，吃掉 5 颗，还剩几颗？','13','6 × 3 − 5 = 13。','两步应用'],
 ['choice','花园记录：红花 12 朵、黄花 9 朵、蓝花 15 朵。哪种最多？','蓝花','15 最大，所以蓝花最多。','数据比较',['红花','黄花','蓝花','一样多']],
 ['number','星船每次运 9 箱，运了 5 次，一共运了多少箱？','45','9 × 5 = 45。','乘法应用'],
 ['choice','有 24 张门票，先给一组 8 张，剩下的平均分给两组，每组几张？','8 张','24 − 8 = 16，16 ÷ 2 = 8。','综合应用',['4 张','8 张','12 张','16 张']]
].map((r,i)=>({id:'q'+(i+1),kind:r[0] as ExamQuestion['kind'],prompt:r[1] as string,answer:r[2] as string,explanation:r[3] as string,topic:r[4] as string,options:r[5] as string[]|undefined,points:5}))}];
PAPERS.push(...ROUTE_PAPERS as ExamPaper[]);
export function selectPaper(save:ExamSave,id:string){save.drafts=save.drafts||{};if(save.attempt)save.drafts[save.attempt.paperId]=save.attempt;save.attempt=save.drafts[id];}
export function cleanExamSave(raw:any):ExamSave{const records:Record<string,ExamRecord>={};for(const p of PAPERS){const r=raw?.records?.[p.id];if(r&&Number.isInteger(r.best)&&r.best>=0&&r.best<=100&&Number.isInteger(r.latest)&&r.latest>=0&&r.latest<=100&&Number.isFinite(r.at))records[p.id]={best:r.best,latest:r.latest,at:r.at};}const a=raw?.attempt,p=PAPERS.find(p=>p.id===a?.paperId);let attempt:ExamAttempt|undefined;if(p&&Number.isFinite(a.deadline)&&Number.isFinite(a.startedAt)&&Number.isFinite(a.updatedAt)&&typeof a.submitted==='boolean'){const answers:Record<string,string>={};for(const q of p.questions)if(typeof a.answers?.[q.id]==='string'&&a.answers[q.id].length<=200)answers[q.id]=a.answers[q.id];attempt={paperId:p.id,answers,marked:Array.isArray(a.marked)?a.marked.filter((id:any)=>p.questions.some(q=>q.id===id)):[],startedAt:a.startedAt,deadline:a.deadline,updatedAt:a.updatedAt,submitted:a.submitted};}const drafts:Record<string,ExamAttempt>={};for(const paper of PAPERS){const d=raw?.drafts?.[paper.id];if(d){const cleaned=cleanExamSave({attempt:d}).attempt;if(cleaned&&cleaned.paperId===paper.id)drafts[paper.id]=cleaned;}}if(attempt)drafts[attempt.paperId]=attempt;return {records,attempt,...(Object.keys(drafts).length?{drafts}:{})};}
