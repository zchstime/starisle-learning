import { MISSIONS, TRANSFER } from '../content/MathIsland';
export interface Progress { version:2;completed:string[];attempts:Record<string,number>;hints:string[];exam:null|{answers:number[];score:number;at:number};sound:boolean; }
export interface SavePort { read():string|null;write(value:string):void; }
export const freshProgress=():Progress=>({version:2,completed:[],attempts:{},hints:[],exam:null,sound:true});
export class GameSession {
  state:Progress;saveFailed=false;
  constructor(private storage:SavePort){
    this.state=freshProgress();
    try{const p=JSON.parse(storage.read()||'null');if(p?.version===2&&Array.isArray(p.completed)){
      for(const m of MISSIONS){if(!p.completed.includes(m.id))break;this.state.completed.push(m.id);}
      this.state.hints=Array.isArray(p.hints)?MISSIONS.map(m=>m.id).filter(id=>p.hints.includes(id)):[];
      for(const m of MISSIONS)this.state.attempts[m.id]=Number.isSafeInteger(p.attempts?.[m.id])&&p.attempts[m.id]>=0?p.attempts[m.id]:0;
      this.state.sound=p.sound!==false;
      if(this.state.completed.length===3&&Array.isArray(p.exam?.answers)&&p.exam.answers.length===3&&p.exam.answers.every((a:number)=>Number.isInteger(a)&&a>=0&&a<=99))this.state.exam={answers:p.exam.answers,score:this.score(p.exam.answers),at:Number.isFinite(p.exam.at)?p.exam.at:0};
    }}catch{}
  }
  save(){try{this.storage.write(JSON.stringify(this.state));this.saveFailed=false;}catch{this.saveFailed=true;}}
  unlocked(index:number){return Number.isInteger(index)&&index>=0&&index<3&&index<=this.state.completed.length;}
  hint(index:number){if(!this.unlocked(index))return;const id=MISSIONS[index].id;if(!this.state.hints.includes(id))this.state.hints.push(id);this.save();}
  submit(index:number,value:number,manipulationComplete:boolean){
    if(!this.unlocked(index))return{ok:false,reason:'先完成前面的任务吧。'};
    if(!manipulationComplete)return{ok:false,reason:'先动手完成左边的任务，再告诉我答案吧。'};
    if(!Number.isInteger(value)||value<0||value>99)return{ok:false,reason:'在数字键盘上输入你的答案吧。'};
    const m=MISSIONS[index];this.state.attempts[m.id]=(this.state.attempts[m.id]||0)+1;
    if(value!==m.answer){this.save();return{ok:false,reason:index===2?'再数数：一共有几个 3？不用着急。':'再看看十位和个位。每一捆表示 10 颗哦。'};}
    if(!this.state.completed.includes(m.id))this.state.completed.push(m.id);this.save();return{ok:true,reason:m.success};
  }
  score(answers:number[]){return TRANSFER.reduce((n,q,i)=>n+(q.answer===answers[i]?1:0),0);}
  finishExam(answers:number[]){if(this.state.completed.length!==3||answers.length!==3||answers.some(a=>!Number.isInteger(a)||a<0||a>99))return false;this.state.exam={answers:[...answers],score:this.score(answers),at:Date.now()};this.save();return true;}
  reset(){this.state=freshProgress();this.save();}
}
