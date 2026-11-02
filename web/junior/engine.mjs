const near=(a,b)=>Math.abs(a-b)<1e-8;
// Restricted linear-expression parser, never eval/Function. Supports + - * / and parentheses.
export function linear(source){
 const s=String(source).replace(/[−–]/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/\s/g,'').toLowerCase();
 if(!s||s.length>160||/[^\dx.+*/()\-]/.test(s))throw Error('只支持数字、x、括号和四则运算');
 const tokens=s.match(/(?:\d+(?:\.\d*)?|\.\d+)|[x()+*/-]/g)||[];
 if(tokens.join('')!==s)throw Error('请检查表达式');
 let p=0,depth=0;const add=(a,b,sign=1)=>({a:a.a+sign*b.a,b:a.b+sign*b.b});
 function atom(){if(++depth>20)throw Error('括号层数过多');let out,t=tokens[p++];if(t==='+'||t==='-'){out=atom();if(t==='-')out={a:-out.a,b:-out.b};}else if(t==='('){out=sum();if(tokens[p++]!==')')throw Error('括号未配对');}else if(t==='x')out={a:1,b:0};else if(t!==undefined&&/^\d|^\./.test(t))out={a:0,b:Number(t)};else throw Error('这里缺少一个数或 x');depth--;return out;}
 function product(){let v=atom();while(p<tokens.length){let op=tokens[p];const implicit=op==='x'||op==='(';if(op!=='*'&&op!=='/'&&!implicit)break;if(!implicit)p++;else op='*';const r=atom();if(op==='/'){if(!near(r.a,0)||near(r.b,0))throw Error('此处除数必须是非零常数');v={a:v.a/r.b,b:v.b/r.b};}else{if(!near(v.a,0)&&!near(r.a,0))throw Error('本单元只处理一元一次式');v={a:v.a*r.b+r.a*v.b,b:v.b*r.b};}if(!Number.isFinite(v.a+v.b)||Math.abs(v.a)+Math.abs(v.b)>1e12)throw Error('数值过大');}return v;}
 function sum(){let v=product();while(tokens[p]==='+'||tokens[p]==='-'){const op=tokens[p++];v=add(v,product(),op==='+'?1:-1);}return v;}
 const result=sum();if(p!==tokens.length)throw Error('请检查运算符');return result;
}
export function equation(source){const sides=String(source).split('=');if(sides.length!==2)throw Error('每行需要一个等号');const left=linear(sides[0]),right=linear(sides[1]),a=left.a-right.a,b=right.b-left.b;if(near(a,0))throw Error(near(b,0)?'这一步变成了恒等式，丢失了未知数的约束':'这一步等式不成立');return {left,right,solution:b/a};}
export function experimentRows(d){const a=d.a||{},b=d.b||{};const height=(c,day)=>Math.round((2+day*Math.min(c.light,12)/12*(c.water<=50?c.water/50:Math.max(.15,1-(c.water-50)/70))*Math.max(.1,1-Math.abs(c.temp-24)/25))*10)/10;return Array.from({length:Math.min(5,Math.max(0,Number(d.days)||0))},(_,i)=>({day:(i+1)*2,a:height(a,(i+1)*2),b:height(b,(i+1)*2)}));}
const feedback=(status,message,checks=[])=>({status,message,checks});
const len=(s,en)=>en?String(s||'').trim().split(/\s+/).filter(Boolean).length:String(s||'').trim().length;
export function runRobot(t,program){
 const code=String(program).replace(/\s/g,'').toUpperCase(),path=[{x:t.start[0],y:t.start[1],direction:t.start[2]}];
 if(!code||code.length>80||/[^FLR]/.test(code))return {path,executed:0,error:true,success:false,message:'请输入 1～80 条 F、L、R 指令，可以用空格或换行分隔。'};
 let [x,y,direction]=t.start;
 for(let i=0;i<code.length;i++){const c=code[i];if(c==='L')direction=(direction+3)%4;else if(c==='R')direction=(direction+1)%4;else{const dx=[1,0,-1,0][direction],dy=[0,1,0,-1][direction],nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=t.size||ny>=t.size||t.walls.some(w=>w[0]===nx&&w[1]===ny))return {path,executed:i,error:true,success:false,message:`第 ${i+1} 条指令会${nx<0||ny<0||nx>=t.size||ny>=t.size?'越出地图':'碰到障碍'}。检查此前的位置与朝向。`};x=nx;y=ny;}path.push({x,y,direction});}
 const success=x===t.goal[0]&&y===t.goal[1];return {path,executed:code.length,error:false,success,message:success?'已到达目标。':'指令可以运行，但尚未到达目标。检查最后的位置与朝向。'};
}
export function evaluate(t,d={}){
 if(t.kind==='classify'){const checks=t.cards.map((card,i)=>({label:card+' 的归档',ok:d.placements?.[i]===t.answers[i]}));return feedback(checks.every(c=>c.ok)?'verified':'retry',checks.every(c=>c.ok)?'数卡归档核验通过。试着解释你的分类依据。':'还有数卡未归档或类别不合适。先确认本轮分类依据，再检查零和可以化简的数。',checks);}
 if(t.kind==='robot'){const r=runRobot(t,d.program||'');return feedback(r.success?'verified':'retry',r.success?`指令运行后到达目标，共执行 ${r.executed} 条指令。可以继续尝试更简洁的方案。`:r.message,[{label:'没有越界或碰到障碍',ok:!r.error},{label:'到达目标位置',ok:r.success}]);}
 if(t.kind==='rhythm'){const notes=d.notes||[],checks=[{label:'至少四个发声拍',ok:notes.filter(n=>n>0).length>=4},{label:'至少两种音高',ok:new Set(notes.filter(n=>n>0)).size>=2},{label:'说明创作意图',ok:len(d.text)>=20}];if(t.requireRest)checks.push({label:'至少一个休止',ok:notes.includes(0)});return feedback(checks.every(c=>c.ok)?'submitted':'retry',checks.every(c=>c.ok)?'乐句与创作说明已保存。形式要求已检查，音乐表现力需进一步欣赏与交流。':'完成八拍乐句，并说明至少 20 字的创作意图。检查发声拍、音高与休止要求。',checks);}
 if(t.kind==='design'){const pixels=d.pixels||[],checks=[{label:'至少八个着色色块',ok:pixels.filter(n=>n>0).length>=8},{label:'至少两种颜色',ok:new Set(pixels.filter(n=>n>0)).size>=2},{label:'解释创作意图',ok:len(d.text)>=20}];return feedback(checks.every(c=>c.ok)?'submitted':'retry',checks.every(c=>c.ok)?'图形作品和设计说明已保存。形式要求通过不代表艺术质量已获评价。':'尝试使用至少八个色块、两种颜色，并用至少 20 字解释设计。',checks);}
 if(t.kind==='project'){const checks=t.labels.map((label,i)=>({label,ok:len(d.sections?.[i])>=12}));return feedback(checks.every(c=>c.ok)?'submitted':'retry',checks.every(c=>c.ok)?'实践记录已保存，等待内容复核。提交文字不证明线下活动已经完成或技能已经掌握。':'请为每个记录项写下至少 12 字。尚未实践时请明确说明，可先记录计划。',checks);}

 if(t.kind==='graph'){const checks=[{label:'斜率 a',ok:d.a===t.a},{label:'截距 b',ok:d.b===t.b},...t.xs.map((x,i)=>({label:`x=${x} 时的 y`,ok:String(d.values?.[i]??'').trim()!==''&&Number(d.values[i])===t.a*x+t.b}))];return feedback(checks.every(c=>c.ok)?'verified':'retry',checks.every(c=>c.ok)?'图像参数和点的坐标核验通过。试着解释 a 和 b 分别改变了什么。':'检查斜率与截距，再把指定 x 值代入计算。',checks);}
 if(t.kind==='circuit'){const checks=[{label:'实验电压',ok:d.voltage===t.voltage},{label:'实验电阻',ok:d.resistance===t.resistance},{label:'计算电流',ok:String(d.current??'').trim()!==''&&near(Number(d.current),t.voltage/t.resistance)}];return feedback(checks.every(c=>c.ok)?'verified':'retry',checks.every(c=>c.ok)?'理想欧姆电路中的参数和电流计算正确。这不代表实际电路操作已通过。':'先按任务设置电压和电阻，再用 I=U/R 计算电流。',checks);}
 if(t.kind==='balance'){const coeff=d.coefficients||[];if(coeff.length!==t.species.length||coeff.some(v=>!Number.isInteger(v)||v<1||v>12))return feedback('retry','请为每种物质填写 1～12 的正整数系数。');const elements=[...new Set(t.species.flatMap(s=>Object.keys(s[1])))];const checks=elements.map(e=>{const left=t.species.reduce((n,s,i)=>n+(i<t.split?coeff[i]*(s[1][e]||0):0),0),right=t.species.reduce((n,s,i)=>n+(i>=t.split?coeff[i]*(s[1][e]||0):0),0);return {label:`${e} 原子：左 ${left} / 右 ${right}`,ok:left===right};});const gcd=(a,b)=>b?gcd(b,a%b):a;checks.push({label:'最简整数系数',ok:coeff.reduce(gcd)===1});return feedback(checks.every(c=>c.ok)?'verified':'retry',checks.every(c=>c.ok)?'各元素原子数守恒，系数已是最简正整数比。':'比较左右两侧的原子总数；已平衡但有公因数时，继续约简系数。',checks);}
 if(t.kind==='data'){const checks=[{label:'所列月份气温差',ok:String(d.difference??'').trim()!==''&&Number(d.difference)===t.difference},{label:'降水最多的月份',ok:String(d.wettest||'').replace(/\s/g,'').replace('月份','月')===t.wettest}];return feedback(checks.every(c=>c.ok)?'verified':'retry',checks.every(c=>c.ok)?'数据读取与计算正确。记住，这些代表月份不能替代全年记录。':'比较已列月份的最高与最低气温，并从降水列找到最大值。',checks);}
 if(t.kind==='numberline'){const checks=[{label:'终点位置',ok:Number(d.position)===t.target&&d.position!==undefined},...(t.distance===undefined?[]:[{label:t.distanceLabel||'总路程',ok:String(d.distance??'').trim()!==''&&Number(d.distance)===t.distance}])];return feedback(checks.every(c=>c.ok)?'verified':'retry',checks.every(c=>c.ok)?(t.successMessage||(t.distance===undefined?'位置核验通过。试着解释你怎样确定这个位置。':'位置与路程核验通过。再试一个不同起点，检验能否独立完成。')):(t.retryMessage||'终点用带方向的变化计算，路程把每段长度相加。'),checks);}
 if(t.kind==='equation'){const lines=String(d.steps||'').split('\n').map(s=>s.trim()).filter(Boolean);if(!lines.length||lines.length>12)return feedback('retry','请逐行写出 1～12 步等式。');let last,changed=false;const checks=[];for(let i=0;i<lines.length;i++){try{const e=equation(lines[i]);if(!near(e.solution,t.solution))return feedback('retry',`第 ${i+1} 行改变了原方程的解。检查是否对等式两侧做了相同且可逆的操作。`,checks.concat({label:`第 ${i+1} 行保持等价`,ok:false}));last=e;changed ||= lines[i].replace(/\s/g,'')!==t.equation.replace(/\s/g,'');checks.push({label:`第 ${i+1} 行保持等价`,ok:true});}catch(e){return feedback('retry',`第 ${i+1} 行：${e.message}`,checks);}}
 const isolated=(near(last.left.a,1)&&near(last.left.b,0)&&near(last.right.a,0))||(near(last.right.a,1)&&near(last.right.b,0)&&near(last.left.a,0));if(!isolated||!changed)return feedback('retry','目前的等式等价。继续整理，直到得到 x = 一个数。',checks);if(lines.length<2||!lines.slice(0,-1).some(line=>{const e=equation(line);return !((near(e.left.a,1)&&near(e.left.b,0)&&near(e.right.a,0))||(near(e.right.a,1)&&near(e.right.b,0)&&near(e.left.a,0)))&&line.replace(/\s/g,'')!==t.equation.replace(/\s/g,'');}))return feedback('retry','答案成立。请补充至少一行不同于原式的中间等式，让解题过程可以检查。',checks);return feedback('verified','各行等式保持同一个解，且已解出 x。程序核验了等价性；变形理由仍可向星宝解释。',checks);}
 if(t.kind==='evidence'){const chosen=Array.isArray(d.evidence)?d.evidence:[];if(!chosen.length||len(d.text)<35)return feedback('retry','请至少标记一处原文，并写出不少于 35 字的解释。');const relevant=chosen.some(i=>t.relevant.includes(i));return feedback('submitted',relevant?'已保存你的证据与解释。所选材料包含相关线索，请对照标准检查论证；这不是自动判定的阅读成绩。':'已保存。你标记的材料与参考线索不同，请特别说明它如何支持观点，可请老师复核。',t.criteria.map(label=>({label,ok:null})));}
 if(t.kind==='writing'){if(len(d.text,t.language==='en')<t.minLength)return feedback('retry',`请先完成至少 ${t.minLength} ${t.language==='en'?'个英文单词':'字'}，再提交作品。`);return feedback('submitted','作品已保存。下面是自查标准，尚未进行教师或 AI 内容评分。可以修改后再次提交。',t.criteria.map(label=>({label,ok:null})));}
 if(t.kind==='revision'){if(len(d.text)<35||d.text.trim()===t.original.trim()||len(d.reason)<12)return feedback('retry','请写出不同于原文的修改稿（至少 35 字），并用至少 12 字说明一处修改理由。');return feedback('submitted','修改稿和修改理由已归档。完成修订不代表写作质量已经达标，请按标准复核。',t.criteria.map(label=>({label,ok:null})));}
 if(t.kind==='dialogue'){const answers=d.answers||[];const checks=t.turns.map((r,i)=>({label:r[1],ok:typeof answers[i]==='string'&&new RegExp(r[2],'i').test(answers[i])&&!/\b(no|not|never)\b/i.test(answers[i].replace(/\bno problem\b/ig,''))}));return feedback(checks.every(c=>c.ok)?'verified':'retry',checks.every(c=>c.ok)?'三轮关键信息表达已通过规则检查。这不评价发音、语法或整体口语水平。':'还有信息未被识别。请检查每轮是否回答了问题；不同表达也可能需要人工复核。',checks);}
 if(t.kind==='experiment'){const other=['light','water','temp'].filter(k=>k!==t.variable),valid=d.a&&d.b&&other.every(k=>d.a[k]===d.b[k])&&d.a[t.variable]!==d.b[t.variable];const checks=[{label:'只改变研究变量',ok:!!valid},{label:'至少 3 次观察',ok:d.days>=3},{label:'写出数据与结论',ok:len(d.text)>=30}];return feedback(checks.every(c=>c.ok)?'submitted':'retry',checks.every(c=>c.ok)?'对照设置与记录完整，实验报告已保存。结论需复核；本数据来自简化模型，不能当作真实植物测量。':'检查两组设置：研究变量不同，其他条件相同；记录至少 3 次观察并写下不少于 30 字的结论。',checks);}
 return feedback('retry','此任务暂不支持。');
}
export function validateDraft(t,d){
 if(!d||typeof d!=='object'||Array.isArray(d)||JSON.stringify(d).length>16000)return false;
 const allowed={classify:['placements'],robot:['program'],rhythm:['notes','text'],design:['pixels','text'],project:['sections'],graph:['a','b','values'],circuit:['voltage','resistance','current'],balance:['coefficients'],data:['difference','wettest'],numberline:['position','distance'],equation:['steps'],evidence:['evidence','text'],writing:['text'],revision:['text','reason'],dialogue:['answers','turn'],experiment:['a','b','days','text']}[t.kind];
 if(!allowed||Object.keys(d).some(k=>!allowed.includes(k)))return false;
 for(const k of ['text','reason','steps'])if(d[k]!==undefined&&(typeof d[k]!=='string'||d[k].length>(k==='steps'?2000:6000)))return false;
 if(t.kind==='classify'&&(!Array.isArray(d.placements)||d.placements.length!==t.cards.length||d.placements.some(v=>!Number.isInteger(v)||v< -1||v>=t.groups.length)))return false;
 if(d.program!==undefined&&(typeof d.program!=='string'||d.program.length>160))return false;
 for(const [k,n,max]of [['notes',8,5],['pixels',64,5]])if(d[k]!==undefined&&(!Array.isArray(d[k])||d[k].length!==n||d[k].some(v=>!Number.isInteger(v)||v<0||v>max)))return false;
 if(d.sections!==undefined&&(!Array.isArray(d.sections)||d.sections.length!==t.labels.length||d.sections.some(v=>typeof v!=='string'||v.length>2000)))return false;
 if(t.kind==='graph'){if(d.a!==undefined&&(!Number.isInteger(d.a)||d.a < -4||d.a > 4)||d.b!==undefined&&(!Number.isInteger(d.b)||d.b < -5||d.b > 5)||d.values!==undefined&&(!Array.isArray(d.values)||d.values.length>t.xs.length||d.values.some(v=>typeof v!=='string'||v.length>12)))return false;}
 if(t.kind==='circuit'){if(d.voltage!==undefined&&(!Number.isInteger(d.voltage)||d.voltage<1||d.voltage>12)||d.resistance!==undefined&&(!Number.isInteger(d.resistance)||d.resistance<1||d.resistance>12))return false;}
 for(const k of ['current','difference','wettest'])if(d[k]!==undefined&&(typeof d[k]!=='string'||d[k].length>20))return false;
 if(d.coefficients!==undefined&&(!Array.isArray(d.coefficients)||d.coefficients.length!==t.species.length||d.coefficients.some(v=>!Number.isInteger(v)||v<1||v>12)))return false;
 if(d.position!==undefined&&(!Number.isFinite(d.position)||d.position<t.min||d.position>t.max||Math.abs((d.position-t.min)/(t.step||1)-Math.round((d.position-t.min)/(t.step||1)))>1e-9))return false;
 if(d.distance!==undefined&&(typeof d.distance!=='string'||d.distance.length>12))return false;
 if(d.evidence!==undefined&&(!Array.isArray(d.evidence)||d.evidence.length>t.passages.length||new Set(d.evidence).size!==d.evidence.length||d.evidence.some(x=>!Number.isInteger(x)||x<0||x>=t.passages.length)))return false;
 if(d.turn!==undefined&&(!Number.isInteger(d.turn)||d.turn<0||d.turn>t.turns.length))return false;
 if(d.answers!==undefined&&(!Array.isArray(d.answers)||d.answers.length>t.turns.length||d.answers.some(x=>typeof x!=='string'||x.length>600)))return false;
 for(const k of ['a','b'])if(t.kind==='experiment'&&d[k]!==undefined){const c=d[k];if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).length!==3||!['light','water','temp'].every(x=>Number.isInteger(c[x]))||c.light<0||c.light>16||c.water<10||c.water>90||c.temp<10||c.temp>35)return false;}
 if(d.days!==undefined&&(!Number.isInteger(d.days)||d.days<0||d.days>5))return false;
 return true;
}
export function nextState(t,old,input,now=Date.now()){
 if(!validateDraft(t,input.draft)||typeof input.submit!=='boolean'||typeof input.hinted!=='boolean')throw Error('任务草稿格式无效');
 const hinted=!!old?.hinted||input.hinted;
 const result=input.submit?evaluate(t,input.draft):null;
 const submissions=[...(old?.submissions||[])];
 if(result)submissions.push({at:now,result,draft:structuredClone(input.draft),hinted});
 return {revision:(old?.revision||0)+1,updatedAt:now,draft:structuredClone(input.draft),hinted,submissions:submissions.slice(-5)};
}
export function completion(state){return state?.submissions?.some(s=>['verified','submitted'].includes(s.result.status))||false;}
