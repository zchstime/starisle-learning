import {Node,SpriteFrame,Label,UITransform,Graphics,tween,Vec3} from 'cc';
import {panel,text,sprite,C,color,node} from '../ui/Kit';
import {Progress} from '../adventure/Progress';
import {PAPERS,ExamPaper,beginPaper,settlePaper,rewardTier,answeredQuestion,correctAnswer,selectPaper,editNumber} from './Exam';
interface Host {root:Node;frames:Record<string,SpriteFrame>;progress:Progress;sounds:{setEnabled:(v:boolean)=>void};clear:()=>void;map:()=>void;sound:(s?:string)=>void;btn:(p:Node,s:string,x:number,y:number,w:number,h:number,f:()=>void,fill?:string,ink?:string,size?:number)=>Node;}
export class ExamView {
 private paper:ExamPaper;private index=0;private timer:ReturnType<typeof setInterval>;private gained=0;
 constructor(private h:Host){}
 stop(){clearInterval(this.timer);}
 private base(){this.stop();this.h.clear();const f=this.h.frames['exam-sanctuary']||this.h.frames['journey-planets'];if(f)sprite(this.h.root,f,0,0,1440,810);panel(this.h.root,0,0,1440,810,'#183F5B',0,'',65);}
 private save(){const a=this.h.progress.exams.attempt;if(a){a.updatedAt=Date.now();this.h.progress.exams.drafts=this.h.progress.exams.drafts||{};this.h.progress.exams.drafts[a.paperId]=a;}this.h.progress.save();}
 lobby(){this.base();const h=this.h,r=h.root;h.btn(r,'‹ 回小岛',28,24,165,54,()=>h.map());panel(r,230,104,980,630,C.cream,32,'#FFFFFF',247);text(r,'✦ 星光试炼场',280,120,880,64,38,C.ink,true,'center');const p=PAPERS.find(p=>p.subject===h.progress.subject&&p.grade===h.progress.grade);if(!p){text(r,'该试炼正在准备',280,250,880,60,30);return;}this.paper=p;selectPaper(h.progress.exams,p.id);const a=h.progress.exams.attempt,rec=h.progress.exams.records[p.id],pending=a&&!a.submitted;const access=h.progress.examAccess(),unlocked=access.unlocked||!!rec||!!pending;
 text(r,p.title+' · '+p.grade+'年级',290,192,860,50,29,C.ink,true,'center');text(r,`${p.questions.length} 题 · 满分 100 分 · ${p.minutes} 分钟 · 可跳题 / 回看 / 修改`,290,249,860,42,21,C.muted,false,'center');text(r,p.scope,305,303,830,90,18,C.muted,false,'center');
 panel(r,335,413,770,15,C.line,7);if(access.done)panel(r,335,413,770*access.done/access.total,15,C.teal,7);text(r,unlocked?'✦ 试炼已解锁 · 准备好就出发':`完成本学科本年级路线后开启 · 已完成 ${access.done} / ${access.total} 关`,290,443,860,43,22,C.teal,true,'center');
 text(r,unlocked?'沿答题星图完成挑战，检查答题总览后交卷领奖。':`还差 ${access.remaining} 关 · 不要求全对，不受其他学科学习进度影响`,290,493,860,38,20,C.muted,false,'center');
 h.btn(r,unlocked?(pending?'继续未完成的试炼 →':'启程试炼 →'):'继续学习 · 解锁试炼 →',420,548,600,67,()=>{if(!unlocked){h.map();return;}if(!pending){h.progress.exams.attempt=beginPaper(p);this.save();}this.gained=0;this.index=0;this.question();},C.gold,'#754A17',26);
 if(a?.submitted&&rec)h.btn(r,'回看最近答卷与解析',490,627,460,42,()=>{this.gained=0;this.index=0;this.review();},C.blue,C.teal,20);
 text(r,rec?`历史最高 ${rec.best} 分 · ${rewardTier(rec.best).name}`:'各学科、各年级独立解锁 · 试炼成绩与勋章分别保留',290,683,860,30,17,C.muted,false,'center');}
 private expired(){return Date.now()>=this.h.progress.exams.attempt.deadline;}
 private startClock(x=1050,y=25,w=220){
  const clock=text(this.h.root,'',x,y,w,50,23,'#FFFFFF',true,'center').getComponent(Label);
  const tick=()=>{if(this.expired()){this.submit();return;}const sec=Math.max(0,Math.ceil((this.h.progress.exams.attempt.deadline-Date.now())/1000));clock.string=`剩余 ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;};
  this.timer=setInterval(tick,500);tick();
 }
 question(){const a=this.h.progress.exams.attempt;if(a.submitted){this.result();return;}if(this.expired()){this.submit();return;}this.base();const h=this.h,r=h.root,p=this.paper,q=p.questions[this.index];h.btn(r,'‹ 保存并离开',26,24,188,54,()=>{this.save();h.map();},C.cream,C.ink,20);text(r,p.title,230,25,750,50,26,'#FFFFFF',true,'center');h.btn(r,h.progress.sound?'♪':'静音',1300,25,100,50,()=>{h.progress.sound=!h.progress.sound;h.sounds.setEnabled(h.progress.sound);this.save();this.question();},C.cream,C.teal,20);this.startClock();
 const answered=p.questions.filter(q=>answeredQuestion(q,a.answers[q.id])).length;
 text(r,`第 ${this.index+1} / ${p.questions.length} 题 · 已答 ${answered} 题`,485,100,485,40,21,'#FFFFFF',true,'center');
 panel(r,510,145,430,5,C.line,3);if(answered)panel(r,510,145,430*answered/p.questions.length,5,C.gold,3);
 const b=panel(r,270,165,1020,530,C.cream,30,'#FFFFFF',248);text(b,`第 ${this.index+1} / ${p.questions.length} 题 · ${q.points} 分 · ${q.topic}`,32,18,900,38,20,C.teal,true);if(q.passage){text(b,q.passage,34,62,950,85,18,C.muted);text(b,q.prompt,34,146,950,40,22,C.ink,true);}else text(b,q.prompt,34,65,950,100,30,C.ink,true);const current=a.answers[q.id]||'';const change=(value:string)=>{if(this.expired()){this.submit();return;}a.answers[q.id]=value;this.save();this.question();};
 if(q.kind==='choice')q.options.forEach((opt,i)=>h.btn(b,(current===opt?'✓  ':'')+opt,40+i%2*470,195+Math.floor(i/2)*92,445,73,()=>change(opt),current===opt?C.gold:C.blue,C.ink,26));
 if(q.kind==='number'){panel(b,40,180,395,80,C.blue,20);text(b,current||'点数字填写答案',60,185,355,70,32,current?C.ink:C.muted,true,'center');['1','2','3','4','5','6','7','8','9','清空','0','退格','.','-'].forEach((s,i)=>h.btn(b,s,480+i%3*155,180+Math.floor(i/3)*51,142,45,()=>change(editNumber(current,s)),C.blue,C.ink,25));}
 if(q.kind==='order'){const chosen=current?current.split('|'):[];text(b,chosen.join('  →  ')||'依次点选下方卡片',35,174,945,70,31,C.teal,true,'center');q.options.forEach((v,i)=>{if(!chosen.includes(v))h.btn(b,v,45+i%3*310,260+Math.floor(i/3)*66,292,57,()=>change([...chosen,v].join('|')),C.blue,C.ink,27);});if(chosen.length)h.btn(b,'撤回一步',340,398,320,42,()=>change(chosen.slice(0,-1).join('|')),C.blue,C.ink,22);}
 h.btn(b,a.marked.includes(q.id)?'★ 已标记':'☆ 稍后再看',35,451,200,52,()=>{a.marked=a.marked.includes(q.id)?a.marked.filter(id=>id!==q.id):[...a.marked,q.id];this.save();this.question();},C.blue,C.teal,20);if(q.kind==='choice'&&current)h.btn(b,'清除此题答案',250,451,220,52,()=>change(''),C.blue,C.muted,20);
 if(this.index>0)h.btn(b,'‹ 上一题',485,451,190,52,()=>{this.index--;this.question();},C.cream,C.ink,21);
 h.btn(b,this.index===p.questions.length-1?'答题总览 →':'下一题 →',690,451,290,52,()=>{if(this.index===p.questions.length-1)this.overview();else{this.index++;this.question();}},C.gold,'#754A17',22);
 panel(r,26,165,220,530,C.cream,25,'',240);text(r,'答题星图',44,180,183,40,24,C.ink,true,'center');p.questions.forEach((item,i)=>{const nav=h.btn(r,String(i+1),43+i%4*47,240+Math.floor(i/4)*63,42,48,()=>{this.index=i;this.question();},i===this.index?C.gold:answeredQuestion(item,a.answers[item.id])?C.mint:C.blue,C.ink,17);const label=nav.children[0];label.setPosition(2,0);label.getComponent(UITransform).setContentSize(38,48);label.getComponent(Label).enableWrapText=false;if(a.marked.includes(item.id))text(nav,'★',24,-10,20,20,13,C.teal,true);});text(r,`已答 ${answered} / ${p.questions.length}\n绿色：已答  ★：待检查\n离开后计时仍继续`,42,570,185,100,16,C.muted,false,'center');
 h.btn(r,'答题总览',43,710,186,48,()=>this.overview(),C.cream,C.teal,20);
 text(r,'答案自动保存 · 可点左侧题号回看，交卷前还有一次确认',300,720,960,38,18,'#FFFFFF',false,'center');
 }
 private overview(){
 if(this.expired()){this.submit();return;}this.base();
 const h=this.h,r=h.root,a=h.progress.exams.attempt,qs=this.paper.questions;
 const missing=qs.filter(q=>!answeredQuestion(q,a.answers[q.id])),marked=qs.filter(q=>a.marked.includes(q.id));
 panel(r,240,100,960,620,C.cream,30);
 text(r,'答题总览',280,120,880,55,34,C.ink,true,'center');
 text(r,`已答 ${qs.length-missing.length} / ${qs.length} 题 · 未答 ${missing.length} 题 · 标记 ${marked.length} 题`,280,185,880,42,23,C.teal,true,'center');
 text(r,'点题号继续作答 · 这里只检查遗漏，不公布答案',280,234,880,36,19,C.muted,false,'center');
 qs.forEach((q,i)=>{const done=answeredQuestion(q,a.answers[q.id]);h.btn(r,`${i+1}${a.marked.includes(q.id)?' ★':''}
${done?'已答':'未答'}`,300+i%5*170,290+Math.floor(i/5)*64,155,54,()=>{this.index=i;this.question();},done?C.mint:C.blue,C.ink,17);});
 text(r,'确认结束试炼时，再选择交卷。交卷后无法修改答案。',280,560,880,36,18,C.muted,false,'center');
 h.btn(r,missing.length?'继续补答 →':marked.length?'查看标记题 →':'返回当前题',310,620,390,64,()=>{const target=missing[0]||marked[0];if(target)this.index=qs.indexOf(target);this.question();},C.gold,'#754A17',24);
 h.btn(r,'准备交卷',760,620,370,64,()=>this.confirm(),C.blue,C.ink,23);
 this.startClock(1000,25,250);
 }
 private confirm(){if(this.expired()){this.submit();return;}this.base();const a=this.h.progress.exams.attempt,missing=this.paper.questions.filter(q=>!answeredQuestion(q,a.answers[q.id])).length;const r=this.h.root;panel(r,300,180,840,450,C.cream,30);text(r,'确认结束本次试炼？',340,218,760,65,36,C.ink,true,'center');text(r,missing?`还有 ${missing} 题未答，未答题计 0 分。`:'所有题目已填写，可以交卷。',340,310,760,55,27,C.teal,true,'center');text(r,`标记待检查 ${a.marked.length} 题 · 交卷后不能再修改答案`,340,382,760,45,21,C.muted,false,'center');this.h.btn(r,'返回答题总览',370,490,315,70,()=>this.overview(),C.gold,'#754A17',25);this.h.btn(r,'确认交卷',755,490,315,70,()=>this.submit(),C.blue,C.ink,26);this.startClock(1000,25,250);}

 private submit(){const settled=settlePaper(this.paper,this.h.progress.exams);if(settled){this.gained=settled.reward;this.h.progress.save();this.h.sound('reward');}this.result();}
 private result(){this.base();const h=this.h,r=h.root,a=h.progress.exams.attempt,rec=h.progress.exams.records[this.paper.id],tier=rewardTier(rec.latest);panel(r,260,115,920,590,C.cream,32);const medal=node(r,'ExamMedal',620,142,200,165),g=medal.addComponent(Graphics);g.fillColor=color(tier.color);g.circle(100,-82,72);g.fill();if(h.frames['exam-medal'])sprite(medal,h.frames['exam-medal'],5,-10,190,180);else text(medal,'✦',0,0,200,155,104,'#FFFFFF',true,'center');tween(medal).to(.3,{scale:new Vec3(1.08,1.08,1)}).to(.3,{scale:new Vec3(1,1,1)}).start();text(r,rec.latest+' / 100 分',330,310,780,65,44,C.ink,true,'center');text(r,tier.name+' · 本次获得 '+this.gained+' 积分',330,385,780,50,27,C.teal,true,'center');text(r,`历史最高 ${rec.best} 分 · 奖励按试卷最高成绩保留，不重复发放`,330,441,780,40,20,C.muted,false,'center');text(r,rec.latest>=80?'星塔为你的努力闪耀！也看看哪些知识还能更稳。':'已经迈出勇敢的一步！和星宝一起弄懂错题，再来挑战。',330,495,780,55,23,C.ink,false,'center');h.btn(r,'查看答卷与解析',330,580,365,70,()=>{this.index=0;this.review();},C.gold,'#754A17',25);h.btn(r,'返回试炼场',745,580,365,70,()=>this.lobby(),C.blue,C.ink,25);}
 private review(){this.base();const h=this.h,r=h.root,q=this.paper.questions[this.index],answer=h.progress.exams.attempt.answers[q.id]||'未作答';panel(r,230,130,980,550,C.cream,30);text(r,`答卷回顾 · 第 ${this.index+1} 题 · ${correctAnswer(q,answer)?q.points:0} / ${q.points} 分`,270,155,900,50,26,C.teal,true);text(r,(q.passage?q.passage+'\n':'')+q.prompt,270,215,900,115,q.passage?20:30,C.ink,true);text(r,'你的答案：'+answer.replace(/\|/g,' → '),270,340,900,55,25,C.ink);text(r,'参考答案：'+q.answer.replace(/\|/g,' → '),270,410,900,50,25,C.teal,true);text(r,q.explanation,270,475,900,70,24,C.muted);h.btn(r,'上一题',270,580,240,65,()=>{this.index=Math.max(0,this.index-1);this.review();},C.blue);h.btn(r,'返回成绩',550,580,340,65,()=>this.result(),C.gold);h.btn(r,'下一题',930,580,240,65,()=>{this.index=(this.index+1)%this.paper.questions.length;this.review();},C.blue);}
}
