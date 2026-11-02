import {pictureCorrect,normalizedPlacements} from './PictureActivities';
import {DrawStroke,Level} from './Catalog';
/** Pure state: integer quantities also represent tenths; presentation never decides correctness. */
export class Puzzle {
 picture:(string|null)[]=[];
 input='';
 marked:number[]=[];fieldValues:string[]=[];writingChecks:boolean[]=[];
 pendingRune=-1;
 drawColor='#238E90';drawStrokes:DrawStroke[]=[];currentStroke:DrawStroke|null=null;traceReviewed=false;rhythmTaps:number[]=[];practiceDone:boolean[]=[];
 cargo:number[]=[];pots:number[]=[];tiles:boolean[]=[];selected:number[]=[];choice=-1;activeMatch=-1;matches:number[]=[];attempts=0;wordOrder:number[]=[];optionOrder:number[]=[];matchOrder:number[]=[];
 constructor(public level:Level){this.wordOrder=shuffled((level.words||[]).length);this.optionOrder=shuffled((level.options||[]).length);this.matchOrder=shuffled((level.pairs||[]).length);this.matches=Array((level.pairs||[]).length).fill(-1);this.pots=Array(level.groups||0).fill(0);this.tiles=Array(level.cells||0).fill(false);this.practiceDone=Array((level.practiceSteps||[]).length).fill(false);this.drawColor=level.palette?.[0]||this.drawColor;}
 get value(){return this.cargo.reduce((a,b)=>a+b,0);}
 toggleMark(i:number){if(!Number.isInteger(i)||i<0||i>=(this.level.tokens?.length||0))return false;const at=this.marked.indexOf(i);if(at<0)this.marked.push(i);else this.marked.splice(at,1);return true;}
 setField(i:number,value:string){if(!Number.isInteger(i)||i<0||i>=(this.level.fields?.length||0)||typeof value!=='string')return false;this.fieldValues[i]=value.slice(0,160);return true;}
 setWriting(value:string){if(typeof value!=='string')return false;this.input=value.slice(0,this.level.writing?.maxLength||400);this.writingChecks=[];return true;}
 writingReady(){return !!this.level.writing&&Array.from(this.input.replace(/\s/g,'')).length>=this.level.writing.minLength;}
 toggleWritingCheck(i:number){if(!this.writingReady()||!Number.isInteger(i)||i<0||i>=(this.level.writing?.checks.length||0))return false;this.writingChecks[i]=!this.writingChecks[i];return true;}
 homeworkPending(){const l=this.level;if(l.kind==='highlight'&&!this.marked.length)return '先点亮原文中的证据，再提交。';if(l.kind==='cloze'&&l.fields?.some((_,i)=>!this.fieldValues[i]?.trim()))return '请把每一处空缺填写完整。';if(l.kind==='compose'&&!this.writingReady())return `请先完成表达，至少写 ${l.writing?.minLength||1} 个非空白字符。`;if(l.kind==='compose'&&l.writing?.checks.some((_,i)=>!this.writingChecks[i]))return '读一读自己的内容，再逐条完成自查。';return '';}
 homeworkCorrect(){const l=this.level;if(l.kind==='highlight')return !!l.markedAnswer?.length&&this.marked.length===l.markedAnswer.length&&this.marked.every(i=>l.markedAnswer.includes(i));if(l.kind==='cloze')return !!l.fields?.length&&l.fields.every((f,i)=>f.answers.some(answer=>normalizeAnswer(answer)===normalizeAnswer(this.fieldValues[i]||'')));if(l.kind==='compose')return this.writingReady()&&!!l.writing?.checks.length&&l.writing.checks.every((_,i)=>this.writingChecks[i]);return false;}
 /** Empty selections are unfinished actions, not incorrect answers. Zero remains valid. */
 pendingGuide(){const l=this.level;const pending=this.homeworkPending();if(pending)return pending;if(l.kind==='number'&&!/^-?\d+(\.\d+)?$/.test(this.input))return '先填写完整的数字，再点发射。';if((l.kind==='choice'||l.kind==='listen')&&this.choice<0)return '先选好答案，再点发射。';if(l.kind==='sentence'&&!this.selected.length)return '先点卡片组成句子，再点发射。';if(l.kind==='match'&&this.matches.some(v=>v<0))return '请把左边每条线索都和右边卡片配对。';if((l.kind==='draw'||l.kind==='trace')&&this.validStrokes().length<(l.minStrokes||1))return `请先在画布上写画至少 ${l.minStrokes||1} 笔。`;if(l.kind==='draw'&&this.usedColors().length<(l.minColors||1))return `再试一种颜色：作品需要使用至少 ${l.minColors||1} 种颜色。`;if(l.kind==='trace'&&!this.traceReviewed)return '临写后请对照范字，完成一次自查。';if(l.kind==='rhythm'&&this.rhythmTaps.length<(l.rhythm?.length||0)+1)return `跟着节奏继续拍，还需要 ${Math.max(0,(l.rhythm?.length||0)+1-this.rhythmTaps.length)} 下。`;if(l.kind==='practice'&&this.practiceDone.some(v=>!v))return '请先完成真实操作，再逐项勾选过程记录。';return '';}
 add(value:number){if(!this.level.units?.includes(value)||this.cargo.length>=36)return false;this.cargo.push(value);return true;}
 remove(i:number){if(!Number.isInteger(i)||i<0||i>=this.cargo.length)return false;this.cargo.splice(i,1);return true;}
 plant(i:number,delta:number){if(!Number.isInteger(i)||i<0||i>=this.pots.length||![-1,1].includes(delta)||this.pots[i]+delta<0||this.pots[i]+delta>9)return false;this.pots[i]+=delta;return true;}
 toggle(i:number){if(!Number.isInteger(i)||i<0||i>=this.tiles.length)return false;this.tiles[i]=!this.tiles[i];return true;}
 word(i:number){if(!Number.isInteger(i)||i<0||i>=(this.level.words?.length||0)||this.selected.includes(i))return false;this.selected.push(i);return true;}
 match(left:number,right:number){if(!Number.isInteger(left)||!Number.isInteger(right)||left<0||right<0||left>=this.matches.length||right>=this.matches.length)return false;this.matches=this.matches.map(v=>v===right?-1:v);this.matches[left]=right;this.activeMatch=-1;return true;}
 beginStroke(x:number,y:number){if(!inside(x,y)||this.drawStrokes.length>=120)return false;if(this.level.kind==='trace')this.traceReviewed=false;this.currentStroke={color:this.drawColor,points:[{x,y}]};this.drawStrokes.push(this.currentStroke);return true;}
 extendStroke(x:number,y:number){if(!this.currentStroke||!inside(x,y)||this.currentStroke.points.length>=1200)return false;const last=this.currentStroke.points.at(-1);if(last&&Math.hypot(x-last.x,y-last.y)<.002)return false;this.currentStroke.points.push({x,y});return true;}
 endStroke(){this.currentStroke=null;}
 undoStroke(){this.currentStroke=null;if(this.level.kind==='trace')this.traceReviewed=false;return !!this.drawStrokes.pop();}
 clearDrawing(){this.currentStroke=null;this.drawStrokes=[];this.traceReviewed=false;}
 validStrokes(){return this.drawStrokes.filter(s=>s.points.length>=2);}
 usedColors(){return [...new Set(this.validStrokes().map(s=>s.color))];}
 reviewTrace(){if(this.level.kind!=='trace'||this.validStrokes().length<(this.level.minStrokes||1))return false;this.traceReviewed=true;return true;}
 tapRhythm(at=Date.now()){if(!Number.isFinite(at)||this.rhythmTaps.length>=(this.level.rhythm?.length||0)+1||this.rhythmTaps.length&&at<=this.rhythmTaps.at(-1))return false;this.rhythmTaps.push(at);return true;}
 resetRhythm(){this.rhythmTaps=[];}
 togglePractice(i:number){if(!Number.isInteger(i)||i<0||i>=this.practiceDone.length)return false;this.practiceDone[i]=!this.practiceDone[i];return true;}
 rhythmCorrect(){const expected=this.level.rhythm||[];if(!expected.length||this.rhythmTaps.length!==expected.length+1)return false;const actual=expected.map((_,i)=>this.rhythmTaps[i+1]-this.rhythmTaps[i]);if(actual.some(n=>n<100||n>3000))return false;const unit=actual.reduce((n,v)=>n+v,0)/expected.reduce((n,v)=>n+v,0);return actual.every((value,i)=>Math.abs(value-unit*expected[i])<=Math.max(170,unit*.45));}
 feedback(){const l=this.level;if(l.kind==='number')return !this.input?'先填写一个结果，再交给星宝检查。':'结果还需要调整，看看数量关系和单位，再试一次。';if(l.kind==='cargo'){if(this.value!==l.target)return this.value<l.target?'数量还不够，看看要不要再装一些。':'数量有点多，点船上的块取回一些。';if(l.maxBlocks&&this.cargo.length>l.maxBlocks)return '数量对了！把几块小能量换成大块，再减少块数。';}if(l.kind==='match')return '有配对还不合适，重新比较线索和对应含义。';if(l.kind==='trace')return '先对照浅色范字完成临写，再检查大小、位置和结构。';if(l.kind==='rhythm')return '节奏还不稳定，点“重新拍”，注意长拍的间隔约是短拍的两倍。';if(l.kind==='practice')return '这里只记录你是否完成了过程，不会自动判断动作质量；完成后再勾选。';return l.kind==='sentence'?'顺序还需要调整，点已选卡片可以取回。':'还差一点点，调整一下再试试！';}
 correct(){const l=this.level;switch(l.kind){case 'highlight':case 'cloze':case 'compose':return this.homeworkCorrect();case 'picture':return !!l.activity&&pictureCorrect(l.activity,normalizedPlacements(l.activity,this.picture));case 'number':return /^-?\d+(\.\d+)?$/.test(this.input)&&Math.abs(Number(this.input)*(l.scale||1)-l.target)<1e-7;case 'cargo':return this.value===l.target&&(!l.maxBlocks||this.cargo.length<=l.maxBlocks);case 'groups':return this.pots.length>0&&this.pots.every(p=>p===l.target);case 'tiles':return this.tiles.filter(Boolean).length===l.target;case 'choice':case 'listen':return this.choice===l.target;case 'sentence':return this.selected.map(i=>l.words[i]).join(' ')===l.answer.join(' ');case 'match':return this.matches.length>1&&this.matches.every((v,i)=>v===i);case 'draw':return this.validStrokes().length>=(l.minStrokes||1)&&this.usedColors().length>=(l.minColors||1);case 'trace':return this.validStrokes().length>=(l.minStrokes||1)&&this.traceReviewed;case 'rhythm':return this.rhythmCorrect();case 'practice':return this.practiceDone.length>0&&this.practiceDone.every(Boolean);}}
}

function inside(x:number,y:number){return Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1&&y>=0&&y<=1;}

export function shuffled(length:number,random= Math.random){const a=Array.from({length},(_,i)=>i);for(let i=length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));const t=a[i];a[i]=a[j];a[j]=t;}if(length>1&&a.every((v,i)=>v===i)){a.push(a.shift());}return a;}

function normalizeAnswer(value:string){return value.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
