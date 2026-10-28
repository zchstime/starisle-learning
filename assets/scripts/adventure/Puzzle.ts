import {Level} from './Catalog';
/** Pure state: integer quantities also represent tenths; presentation never decides correctness. */
export class Puzzle {
 input='';
 pendingRune=-1;
 cargo:number[]=[];pots:number[]=[];tiles:boolean[]=[];selected:number[]=[];choice=-1;attempts=0;wordOrder:number[]=[];optionOrder:number[]=[];
 constructor(public level:Level){this.wordOrder=shuffled((level.words||[]).length);this.optionOrder=shuffled((level.options||[]).length);this.pots=Array(level.groups||0).fill(0);this.tiles=Array(level.cells||0).fill(false);}
 get value(){return this.cargo.reduce((a,b)=>a+b,0);}
 /** Empty selections are unfinished actions, not incorrect answers. Zero remains valid. */
 pendingGuide(){const l=this.level;if(l.kind==='number'&&!/^-?\d+(\.\d+)?$/.test(this.input))return '先填写完整的数字，再点发射。';if((l.kind==='choice'||l.kind==='listen')&&this.choice<0)return '先选好答案，再点发射。';if(l.kind==='sentence'&&!this.selected.length)return '先点卡片组成句子，再点发射。';return '';}
 add(value:number){if(!this.level.units?.includes(value)||this.cargo.length>=36)return false;this.cargo.push(value);return true;}
 remove(i:number){if(!Number.isInteger(i)||i<0||i>=this.cargo.length)return false;this.cargo.splice(i,1);return true;}
 plant(i:number,delta:number){if(!Number.isInteger(i)||i<0||i>=this.pots.length||![-1,1].includes(delta)||this.pots[i]+delta<0||this.pots[i]+delta>9)return false;this.pots[i]+=delta;return true;}
 toggle(i:number){if(!Number.isInteger(i)||i<0||i>=this.tiles.length)return false;this.tiles[i]=!this.tiles[i];return true;}
 word(i:number){if(!Number.isInteger(i)||i<0||i>=(this.level.words?.length||0)||this.selected.includes(i))return false;this.selected.push(i);return true;}
 feedback(){const l=this.level;if(l.kind==='number')return !this.input?'先填写一个结果，再交给星宝检查。':'结果还需要调整，看看数量关系和单位，再试一次。';if(l.kind==='cargo'){if(this.value!==l.target)return this.value<l.target?'数量还不够，看看要不要再装一些。':'数量有点多，点船上的块取回一些。';if(l.maxBlocks&&this.cargo.length>l.maxBlocks)return '数量对了！把几块小能量换成大块，再减少块数。';}return l.kind==='sentence'?'顺序还需要调整，点已选卡片可以取回。':'还差一点点，调整一下再试试！';}
 correct(){const l=this.level;switch(l.kind){case 'number':return /^-?\d+(\.\d+)?$/.test(this.input)&&Math.abs(Number(this.input)*(l.scale||1)-l.target)<1e-7;case 'cargo':return this.value===l.target&&(!l.maxBlocks||this.cargo.length<=l.maxBlocks);case 'groups':return this.pots.length>0&&this.pots.every(p=>p===l.target);case 'tiles':return this.tiles.filter(Boolean).length===l.target;case 'choice':case 'listen':return this.choice===l.target;case 'sentence':return this.selected.map(i=>l.words[i]).join(' ')===l.answer.join(' ');}}
}

export function shuffled(length:number,random= Math.random){const a=Array.from({length},(_,i)=>i);for(let i=length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));const t=a[i];a[i]=a[j];a[j]=t;}if(length>1&&a.every((v,i)=>v===i)){a.push(a.shift());}return a;}
