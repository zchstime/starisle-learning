// The first teaching loop deliberately accepts only independently verifiable G2 arithmetic.
const operations={'+':(a,b)=>a+b,'-':(a,b)=>a-b,'×':(a,b)=>a*b,'÷':(a,b)=>a/b};
function verify(q){
 if(typeof q?.expression==='string'){
  const expression=q.expression.replace(/\s/g,'').replace(/[xX*]/g,'×').replace(/\//g,'÷');
  if(!/^\d{1,3}([+\-×÷]\d{1,3}){1,2}$/.test(expression))throw Error('请输入两到三个整数的加减乘除算式');
  const parts=expression.match(/\d+|[+\-×÷]/g);
  if(parts.length===3)return verify({a:Number(parts[0]),op:parts[1],b:Number(parts[2])});
  const values=parts.filter((_,i)=>i%2===0).map(Number),ops=[parts[1],parts[3]];
  if(values.some(v=>v>100))throw Error('超出100以内运算范围');
  // Multiplication/division first, equal precedence left-to-right; never eval model text.
  const numbers=[...values],operators=[...ops];
  for(let i=0;i<operators.length;){
   if(operators[i]==='×'||operators[i]==='÷'){
    const v=verify({a:numbers[i],b:numbers[i+1],op:operators[i]}).answer;
    numbers.splice(i,2,v);operators.splice(i,1);
   }else i++;
  }
  let answer=numbers[0];
  for(let i=0;i<operators.length;i++)answer=verify({a:answer,b:numbers[i+1],op:operators[i]}).answer;
  return {expression:parts.join(' '),op:'mixed',answer,skill:'两步混合运算',operations:ops};
 }

 if(!q||!Number.isInteger(q.a)||!Number.isInteger(q.b)||!Object.hasOwn(operations,q.op))throw Error('题目格式不支持');
 const {a,b,op}=q;if(a<0||b<0||a>100||b>100)throw Error('超出本模块范围');
 const answer=operations[op](a,b);
 if(!Number.isInteger(answer)||answer<0||answer>100||(['×','÷'].includes(op)&&(b<1||b>9||(op==='×'?a>9:answer>9))))throw Error('超出二年级整数运算范围');
 return {a,b,op,answer,expression:`${a} ${op} ${b}`,skill:op==='+'?'100以内加法':op==='-'?'100以内减法':op==='×'?'表内乘法':'表内除法'};
}
function recognition(raw){
 if(!raw||!Array.isArray(raw.questions)||raw.questions.length>40||raw.questions.length<1)throw Error('未识别到可核验的整数运算，请换清晰图片或输入题目');
 return raw.questions.map((q,i)=>{
 const checked=verify(q);const studentAnswer=q.studentAnswer==null?'':String(q.studentAnswer);
 if(!/^\d{0,3}$/.test(studentAnswer)||typeof q.evidence!=='string'||q.evidence.length>300||typeof q.confidence!=='number'||q.confidence<0||q.confidence>1)throw Error('识别结果格式异常');
 return {...checked,id:String(i),studentAnswer,evidence:q.evidence,confidence:q.confidence};
 });
}
function plan(questions){
 const evaluated=questions.map(q=>({...verify(q),studentAnswer:q.studentAnswer,correct:q.studentAnswer!==''&&Number(q.studentAnswer)===verify(q).answer}));
 const weak=evaluated.filter(q=>!q.correct),targets=weak.length?weak:evaluated;
 const tasks=Array.from({length:6},(_,i)=>{
 const source=targets[i%targets.length];let a,b,op=source.op;
 if(op==='mixed'){const v=verify({expression:`${12+i} + ${2+i} × 3`});return {...v,id:String(i),mission:i<2?'点亮星灯':i<4?'修复星桥':'唤醒星树',hint:'先乘除，后加减；只有同级运算时，从左往右算。'};}
 if(op==='×'||op==='÷'){b=2+(i%7);const n=2+((i+2)%7);a=op==='×'?n:b*n;}
 else{a=23+i*7;b=8+i;if(op==='+'&&a+b>100)a=40;}
 const v=verify({a,b,op});return {...v,id:String(i),mission:i<2?'点亮星灯':i<4?'修复星桥':'唤醒星树',hint:i>=4?'这一站独立试一试。':op==='+'?'把十位和个位分别相加，个位满十要进一。':op==='-'?'先看个位够不够减，不够就从十位借一个十。':op==='×'?`想想 ${b} 的乘法口诀。`:`想一想：${b} 乘几等于 ${a}？`};
 });
 return {evaluated,tasks,summary:weak.length?`这次有 ${weak.length} 道题需要再看看，我们先练习${[...new Set(weak.map(q=>q.skill))].join('、')}。一次作答还不能说明是否掌握。`:'这次已确认的题目都算对了，来试试不同数字，看看能否灵活运用。'};
}

function generatedPlan(questions,raw){
 const base=plan(questions);
 if(!Array.isArray(raw?.questions)||raw.questions.length!==6)throw Error('AI练习数量无效');
 const allowed=new Set(base.evaluated.filter(q=>!q.correct).map(q=>q.op));
 if(!allowed.size)base.evaluated.forEach(q=>allowed.add(q.op));
 const seen=new Set(questions.map(q=>verify(q).expression));
 const covered=new Set();
 base.tasks=raw.questions.map((q,i)=>{
  const checked=verify(q);
  if(!allowed.has(checked.op)||seen.has(checked.expression))throw Error('AI练习偏离目标或重复');
  if(q.answer!==checked.answer)throw Error('AI答案验算失败');
  seen.add(checked.expression);covered.add(checked.op);
  const hint=i>=4?'这一站独立试一试。':checked.op==='mixed'?'先乘除，后加减；同级运算从左往右算。':checked.op==='+'?'把十位和个位分别相加，个位满十要进一。':checked.op==='-'?'先看个位够不够减，不够就从十位借一个十。':checked.op==='×'?`想想 ${checked.b} 的乘法口诀。`:`想一想：${checked.b} 乘几等于 ${checked.a}？`;
  return {...checked,id:String(i),mission:base.tasks[i].mission,hint};
 });
 if([...allowed].some(op=>!covered.has(op)))throw Error('AI练习没有覆盖目标');
 return base;
}
module.exports={verify,recognition,plan,generatedPlan};
