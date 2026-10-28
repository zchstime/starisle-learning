/** Pure base-ten and equal-group game mechanics; UI has no authority over arithmetic. */
export class MathPuzzle {
  tens=0; ones=0; deliveredTens=0; deliveredOnes=0; merged=false; exchanged=false;
  pots=[0,0,0,0];
  constructor(public kind:number) { if(kind===1){this.tens=4;this.ones=3;} }
  merge(){ if(this.kind!==0||this.merged)return false; this.tens=3;this.ones=12;this.merged=true;return true; }
  exchange(){ if(this.kind!==0||!this.merged||this.ones<10)return false;this.ones-=10;this.tens++;this.exchanged=true;return true; }
  split(){ if(this.kind!==1||this.tens<=0||this.exchanged)return false;this.tens--;this.ones+=10;this.exchanged=true;return true; }
  deliverTen(){if(this.kind!==1||this.tens<1||this.deliveredTens>=1)return false;this.tens--;this.deliveredTens++;return true;}
  deliverOne(){if(this.kind!==1||this.ones<1||this.deliveredOnes>=8)return false;this.ones--;this.deliveredOnes++;return true;}
  plant(index:number){if(this.kind!==2||index<0||index>=4||!Number.isInteger(index)||this.pots[index]>=3)return false;this.pots[index]++;return true;}
  get ready(){return this.kind===0?this.merged&&this.exchanged:this.kind===1?this.exchanged&&this.deliveredTens===1&&this.deliveredOnes===8:this.pots.every(n=>n===3);}
  get value(){return this.kind===2?this.pots.reduce((a,b)=>a+b,0):this.tens*10+this.ones;}
}
