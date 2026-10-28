// The first teaching loop deliberately accepts only independently verifiable G2 arithmetic.
const operations={'+':(a,b)=>a+b,'-':(a,b)=>a-b,'×':(a,b)=>a*b,'÷':(a,b)=>a/b};
function verify(q){
 if(!q||!Number.isInteger(q.a)||!Number.isInteger(q.b)||!Object.hasOwn(operations,q.op))throw Error('题目格式不支持');
 const {a,b,op}=q;if(a<0||b<0||a>100||b>100)throw Error('超出本模块范围');
 const answer=operations[op](a,b);
 if(!Number.isInteger(answer)||answer<0||answer>100||(['×','÷'].includes(op)&&(b<1||b>9||(op==='×'?a>9:answer>9))))throw Error('超出二年级整数运算范围');
 return {a,b,op,answer,expression:`${a} ${op} ${b}`,skill:op==='+'?'100以内加法':op==='-'?'100以内减法':op==='×'?'表内乘法':'表内除法'};
}
function recognition(raw){
 if(!raw||!Array.isArray(raw.questions)||raw.questions.length>20||raw.questions.length<1)throw Error('未识别到可核验的整数运算，请换清晰图片或输入题目');
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
 if(op==='×'||op==='÷'){b=2+(i%7);const n=2+((i+2)%7);a=op==='×'?n:b*n;}
 else{a=23+i*7;b=8+i;if(op==='+'&&a+b>100)a=40;}
 const v=verify({a,b,op});return {...v,id:String(i),mission:i<2?'点亮星灯':i<4?'修复星桥':'唤醒星树',hint:i>=4?'这一站独立试一试。':op==='+'?'把十位和个位分别相加，个位满十要进一。':op==='-'?'先看个位够不够减，不够就从十位借一个十。':op==='×'?`想想 ${b} 的乘法口诀。`:`想一想：${b} 乘几等于 ${a}？`};
 });
 return {evaluated,tasks,summary:weak.length?`这次有 ${weak.length} 道题需要再看看，我们先练习${[...new Set(weak.map(q=>q.skill))].join('、')}。一次作答还不能说明是否掌握。`:'这次已确认的题目都算对了，来试试不同数字，看看能否灵活运用。'};
}
module.exports={verify,recognition,plan};
