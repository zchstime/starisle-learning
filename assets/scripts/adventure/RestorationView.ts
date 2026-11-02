import {pageArrival,reveal,motionAllowed} from '../ui/Motion';
import {Node,Graphics,Label,Tween,tween,Vec3} from 'cc';
import {node,panel,text,color,C} from '../ui/Kit';
import {Progress} from './Progress';
import {PlayLabView} from './PlayLabView';
import {burst} from './WorldMotion';
import {Facility,ISLAND_TASKS,IslandTask,IslandEvidence,IslandAttempt,islandUnlocked,islandFeedback,islandEquation,islandNextTask,islandCargoComparison,islandGardenComparison} from './Restoration';
interface Host {root:Node;progress:Progress;screen:string;clear():void;art():void;map():void;sound(k:string):void;btn:(...a:any[])=>Node;}
const PLACES:{id:Facility;name:string;tool:string;color:string;story:string}[]=[
 {id:'garden',name:'星萤花园',tool:'六格星灯',color:'#DDEEDC',story:'给星萤一个家，让花园重新发光。'},
 {id:'canal',name:'星光水渠',tool:'三格分组器',color:'#DCEFF7',story:'送来清水，让居民回到小岛。'},
 {id:'observatory',name:'观星台',tool:'天气图',color:'#E9E3F5',story:'用花园的星灯，沿水渠点亮观星台。'},
];
/** Native Cocos controls. Separate from curriculum/assessment completion gates. */
export class RestorationView {
 private attempt:IslandAttempt|null=null;
 private message='';private showingHint=false;
 private previousSolution:number[]|undefined;
 private groupChange:{index:number;before:number;after:number}|null=null;
 private cargoRemoval:{index:number;value:number}|null=null;
 private refreshPlay:()=>void=()=>{};
 constructor(private h:Host){}
 private shell(title:string,back:()=>void,backText='‹ 修复岛'){
  const h=this.h;this.refreshPlay=()=>{};h.clear();h.screen='restoration';h.art();pageArrival(h.root,'restoration:'+title);
  panel(h.root,0,0,1440,810,'#183F51',0,'',150);
  h.btn(h.root,backText,35,24,205,54,back,C.cream,C.teal,21);
  text(h.root,title,270,24,900,58,32,'#FFFFFF',true,'center');
  text(h.root,'二年级数学 · 星屿修复',1150,33,255,40,17,'#FFFFFF',false,'right');
  const b=panel(h.root,35,100,1370,675,C.cream,30);b.name='RestorationPanel';return b;
 }
 map(){
  this.attempt=null;const h=this.h,p=h.progress,b=this.shell('和星宝一起，让小岛亮起来',()=>h.map(),'‹ 回学习地图');
  const restored=PLACES.filter(f=>p.island.records[f.id+'.restore']).length;
  text(b,restored===3?'小岛已经亮起来了！换个条件再试试，也可以布置自己的花园。':'花园和水渠，你想先帮助谁？每修好一处，都会得到新的工具。',35,14,1300,52,24,C.teal,true,'center');
  PLACES.forEach((f,i)=>{
   const repaired=!!p.island.records[f.id+'.restore'];
   const card=panel(b,30+i*450,85,420,440,f.color,28);card.name='Facility:'+f.id;reveal(card,i*.06);
   this.scene(card,f.id,repaired);
   text(card,(repaired?'✓ ':'')+f.name,20,186,380,48,29,C.ink,true,'center');
   const task=ISLAND_TASKS.find(t=>t.id===f.id+'.restore')!,unlocked=islandUnlocked(p.island,task);
   const next=islandNextTask(p.island,f.id),resuming=next&&p.island.drafts[next.id]&&!p.island.drafts[next.id].finished;
   const chooseWeather=f.id==='observatory'&&repaired&&!resuming;
   const completed=ISLAND_TASKS.filter(t=>t.facility===f.id&&p.island.records[t.id]).length;
   const toolUse=f.id==='garden'?(p.island.records['canal.restore']?'六格星灯 → 观星台运输':'六格星灯已获得，修好水渠就能运送'):f.id==='canal'?'三格分组器 → 花园一次安排 3 只':'天气图 → 选择晴天或有风的航线';
   text(card,repaired?toolUse:unlocked?f.story:'先修好花园和水渠，再来点亮观星台。',28,239,364,60,20,C.teal,true,'center');
   h.btn(card,chooseWeather?'选择天气航线':next?(resuming?'继续：':'开始：')+next.title:unlocked?'自由选择任务':'看看修复条件',25,311,370,56,()=>chooseWeather?this.place(f.id):next?this.start(next):this.place(f.id),next||chooseWeather?C.gold:C.cream,C.ink,21);
   h.btn(card,`全部任务 · 已完成 ${completed}/3`,45,380,330,43,()=>this.place(f.id),C.cream,C.teal,19);

  });
  h.btn(b,'布置我的观星花园',35,555,385,62,()=>new PlayLabView(h).garden(),C.mint,C.teal,23);
  h.btn(b,'看看探索记录',490,555,385,62,()=>this.evidence(),C.blue,C.teal,23);
  h.btn(b,'今天先到这里',945,555,385,62,()=>h.map(),C.gold,C.ink,23);
  text(b,p.failed?'本机保存未成功，请保持页面打开，并到探索记录重试保存。':'每一步自动保存在本机 · 不用一次做完 · 离开后小岛不会退回原样',30,627,1310,30,17,p.failed?'#A34030':C.muted,false,'center');
 }
 private scene(parent:Node,id:Facility,repaired:boolean){
  const art=node(parent,'FacilityArt:'+id,30,12,360,164),g=art.addComponent(Graphics);
  const ellipse=(x:number,y:number,rx:number,ry:number,fill:string)=>{g.fillColor=color(fill);g.ellipse(x,-y,rx,ry);g.fill();};
  ellipse(180,132,155,29,repaired?'#93C9A9':'#BDC9C2');
  if(id==='garden'){
   const design=ISLAND_TASKS.filter(t=>t.facility==='garden').map(t=>this.h.progress.island.records[t.id]?.latest).filter(Boolean).sort((a,b)=>b.at-a.at)[0]?.values;
   for(let i=0;i<6;i++){
    const x=77+(i%3)*98,y=90+Math.floor(i/3)*37;
    ellipse(x,y,35,14,'#AA896C');
    const count=repaired?(design?design[i]:0):0;
    for(let j=0;j<count;j++){ellipse(x-22+(j%3)*22,y-6-Math.floor(j/3)*15,7,9,'#FFF3A8');}
   }
  }else if(id==='canal'){
   g.strokeColor=color(repaired?'#66B4D4':'#9FABA8');g.lineWidth=18;g.moveTo(55,-130);g.bezierCurveTo(130,-20,220,-160,310,-80);g.stroke();
   panel(art,145,50,67,65,repaired?'#C69360':'#B4B9B4',12);panel(art,135,42,87,20,'#E5BC82',10);
   if(repaired)for(let i=0;i<4;i++)ellipse(83+i*65,108,5,3,'#E5FAFF');
  }else{
   panel(art,130,67,100,70,repaired?'#A69BC9':'#B2B8BD',15);
   ellipse(180,69,61,37,repaired?'#D8CCF2':'#C4CAD0');
   panel(art,171,95,20,42,repaired?'#FFE59F':'#84949A',7);
   g.strokeColor=color(repaired?'#FFE59F':'#9BA5AA');g.lineWidth=12;g.moveTo(181,-69);g.lineTo(228,-36);g.stroke();
   if(repaired)for(let i=0;i<5;i++)ellipse(62+i*60,28+(i%2)*20,4,4,'#E6B964');
  }
 }
 private place(id:Facility){
  const h=this.h,p=h.progress,f=PLACES.find(f=>f.id===id)!,b=this.shell(f.name,()=>this.map());
  const tasks=ISLAND_TASKS.filter(t=>t.facility===id);
  const weather=id==='observatory'&&p.island.records['observatory.restore'];
  const routes=tasks.filter(t=>t.phase!=='修复');
  const comparison=routes.map(t=>`${t.title}：${t.total} 格能量，最多 ${t.limit} 块`).join('　｜　');
  text(b,weather?comparison:'先修复，再把同一种知识用到新的情境。完成过的任务也可以重玩。',40,25,1290,62,24,C.teal,true,'center');
  tasks.forEach((t,i)=>{
   const unlocked=islandUnlocked(p.island,t),done=!!p.island.records[t.id],draft=p.island.drafts[t.id];
   const card=panel(b,40,110+i*156,1290,135,i===0?f.color:C.blue,23);
   text(card,t.phase+' · '+t.title,25,12,815,42,26,C.ink,true);
   text(card,unlocked?t.goal:'需要先完成：'+t.requires.filter(k=>!p.island.records[k]).map(k=>ISLAND_TASKS.find(t=>t.id===k)!.title).join('、'),25,57,860,58,21,C.muted);
   h.btn(card,!unlocked?'先去修复':draft&&!draft.finished?'继续上次':done?'再玩一次':'开始 →',935,39,320,60,()=>unlocked?this.start(t):this.map(),unlocked?C.gold:C.cream,C.ink,23);
  });
  text(b,'没有倒计时；随时可以回岛，做到一半也会保留。',40,595,1290,45,21,C.muted,false,'center');
 }
 private start(task:IslandTask){
  const p=this.h.progress;if(!islandUnlocked(p.island,task))return;
  this.previousSolution=p.island.records[task.id]?.latest.values.slice();
  this.groupChange=null;
  this.cargoRemoval=null;
  this.attempt=new IslandAttempt(task,p.island.drafts[task.id]);this.message='';this.showingHint=false;
  p.saveIsland(this.attempt);this.draw();
 }
 private persist(){if(this.attempt)this.h.progress.saveIsland(this.attempt);}
 private draw(){
  const h=this.h,p=h.progress,a=this.attempt!;if(!a)return;const t=a.task;
  const b=this.shell(t.title,()=>this.place(t.facility));
  text(b,t.goal,35,12,1290,72,27,C.ink,true);
  const workspace=panel(b,30,100,960,390,t.kind==='groups'?'#EDF4E8':'#E8F2F5',24);
  const contents=node(workspace,'IslandWorkspace',0,0,960,390);
  const side=panel(b,1010,100,330,390,'#F7F0DF',24);
  text(side,'星宝陪你想',20,8,290,40,24,C.teal,true,'center');
  const hintLabel=text(side,this.showingHint?t.hint:'先试试自己的办法。需要时，可以请星宝给一个提示。',24,54,282,124,23,C.muted,false,'center').getComponent(Label);
  h.btn(side,'给我一点提示',25,188,280,92,()=>{a.hinted=true;this.showingHint=true;this.persist();hintLabel.string=t.hint;this.refreshPlay();},C.cream,C.teal,21);
  h.btn(side,'重新摆放',25,290,280,92,()=>{a.reset();this.message='重新摆放好了，刚才的尝试也会保留在记录里。';this.persist();this.refreshPlay();},C.blue,C.teal,20);
  const feedback=text(b,'',35,499,1300,68,23,C.teal,true,'center').getComponent(Label);
  this.refreshPlay=()=>{
   if(!contents.isValid||this.attempt!==a)return;
   const stop=(n:Node)=>{Tween.stopAllByTarget(n);n.children.forEach(stop);};
   for(const child of [...contents.children]){stop(child);child.removeFromParent();child.destroy();}
   if(t.kind==='groups')this.groups(contents,a);else this.cargo(contents,a);
   const instructions=t.kind==='groups'?(p.island.records['canal.restore']?'三格分组器：点「＋3」一次安排 3 只；「＋1」「－1」可以微调。':'点「＋1」安排星萤，点「－1」取回；空花坛可以留着。'):t.facility==='observatory'?'花园送来的星灯：每块有 6 格能量，占 1 个船位；点船上的物资可取回。':'点物资装船，点船上的物资取回；准备好了再试航。';
   feedback.string=p.failed?'本机保存暂未成功，请保持页面打开。':this.message||instructions;
   feedback.color=color(p.failed?'#A34030':C.teal);
  };
  this.refreshPlay();
  h.btn(b,'先回岛，稍后继续',35,574,370,92,()=>this.map(),C.blue,C.teal,22);
  h.btn(b,t.kind==='groups'?'安排好了 →':'装好了，试航 →',920,574,420,92,()=>{
   if(a.finished)return;
   if(a.submit()){this.persist();h.sound('reward');this.finish();}
   else{this.message=islandFeedback(t,a.values);this.persist();h.sound('oops');this.refreshPlay();}
  },C.gold,C.ink,25);
 }
 private groups(w:Node,a:IslandAttempt){
  const h=this.h,tool=!!h.progress.island.records['canal.restore'];
  const changeEffect=this.groupChange;this.groupChange=null;
  text(w,`已安排 ${a.values.reduce((x,y)=>x+y,0)} / ${a.task.total} 只 · 用了 ${a.values.filter(n=>n>0).length} 座花坛`,20,6,920,40,22,C.teal,true,'center');
  a.values.forEach((n,i)=>{
   const plot=panel(w,17+(i%3)*310,48+Math.floor(i/3)*149,300,144,'#E1DDC2',18);
   text(plot,'花坛 '+(i+1)+' · '+n+' 只',4,2,150,40,24,C.ink,true,'center');
   const dots=node(plot,'Fireflies:'+i,0,0,300,44),g=dots.addComponent(Graphics);g.fillColor=color('#F4CB61');
   for(let j=0;j<n;j++){g.circle(177+(j%3)*42,-(13+Math.floor(j/3)*20),8);g.fill();}
   if(changeEffect?.index===i&&motionAllowed()){
    const {before,after}=changeEffect,added=after>before;
    for(let j=Math.min(before,after);j<Math.max(before,after);j++){
     const x=177+(j%3)*42,y=13+Math.floor(j/3)*20;
     const ring=node(plot,(added?'Arriving:':'Leaving:')+j,x,y,0,0),ink=ring.addComponent(Graphics);
     ink.strokeColor=color(added?'#BD861E':'#438C9E');ink.lineWidth=3;ink.circle(0,0,12);ink.stroke();
     tween(ring).to(.4,{position:new Vec3(x,-y+8,0),scale:new Vec3(1.35,1.35,1)},{easing:'quadOut'}).call(()=>ring.destroy()).start();
    }
   }
   const change=(delta:number)=>{
    const before=a.values[i],changed=a.change(i,delta),remaining=a.task.total-a.values.reduce((x,y)=>x+y,0);
    this.groupChange=changed?{index:i,before,after:a.values[i]}:null;
    if(changed)this.message=`花坛 ${i+1} ${delta>0?'住进':'取回'} ${Math.abs(delta)} 只，现在有 ${a.values[i]} 只。`;
    else if(delta<0)this.message='这个花坛已经空了。';
    else if(remaining===0)this.message='星萤已经全部安排好了；可以取回调整，或点「安排好了」检查。';
    else if(a.values[i]===6)this.message=`花坛 ${i+1} 已放满 6 只，可以换一座花坛，或先取回。`;
    else if(remaining<delta)this.message=`只剩 ${remaining} 只星萤待安排，分组器一次放 3 只；可以用「＋1」微调。`;
    else this.message=`花坛 ${i+1} 最多还能放 ${6-a.values[i]} 只，放不下整组；可以用「＋1」或换一座花坛。`;
    if(changed)h.sound(delta>0?'plant':'tap');this.persist();this.refreshPlay();
   };
   const bw=tool?92:140;
   h.btn(plot,'－1',6,46,bw,92,()=>change(-1),C.cream,C.teal,28);
   h.btn(plot,'＋1',tool?104:154,46,bw,92,()=>change(1),C.gold,C.ink,28);
   if(tool)h.btn(plot,'＋3',202,46,92,92,()=>change(3),C.mint,C.teal,28);
  });
  text(w,islandEquation(a.task,a.values),15,350,930,35,22,C.teal,true,'center');
 }
 private cargo(w:Node,a:IslandAttempt){
  const h=this.h,t=a.task;const isWater=t.facility==='canal',unit=isWater?'桶':'格';
  const removal=this.cargoRemoval;this.cargoRemoval=null;
  text(w,`已装 ${a.values.reduce((x,y)=>x+y,0)} / ${t.total} ${unit} · 船舱 ${a.values.length} / ${t.limit}`,20,8,920,40,23,C.teal,true,'center');
  t.units!.forEach((v,i)=>h.btn(w,(v===6?'星灯 ':'')+v+' '+unit,55+i*300,57,250,92,()=>{const added=a.add(v);this.message=added?(v===6?`花园星灯带来 6 格能量，占用 1 个船位；还剩 ${t.limit!-a.values.length} 个位置。`:`装入 ${v} ${unit}，船舱还剩 ${t.limit!-a.values.length} 个位置。`):'船舱满了，点下面的物资取回，再换个组合。';if(added)h.sound('plant');this.persist();this.refreshPlay();},v===6?'#FFE4AA':C.gold,C.ink,26));
  const boat=panel(w,30,158,900,160,'#C7DBDD',35);
  for(let i=0;i<t.limit!;i++){
   const v=a.values[i],x=18+i*174;
   if(v===undefined){const empty=panel(boat,x,25,157,110,'#DDE9E9',16,'#A5C3C8');text(empty,'空位 '+(i+1),5,30,147,48,20,C.muted,false,'center');continue;}
   const box=h.btn(boat,'',x,25,157,110,()=>{
    if(!a.remove(i))return;
    this.cargoRemoval={index:i,value:v};
    this.message=`取回第 ${i+1} ${isWater?'箱':'块'}的 ${v} ${isWater?'桶水':'格能量'}；${i<a.values.length?'后面的物资向前排列，':'空位已腾出，'}现在共 ${a.values.reduce((x,y)=>x+y,0)} ${unit}。`;
    h.sound('tap');this.persist();this.refreshPlay();
   },v===6?'#FFF5D9':C.cream,C.ink,27);
   text(box,(v===6?'星灯 ':'')+v+' '+unit,5,3,147,40,25,C.ink,true,'center');
   if(v===6){const lamp=panel(box,25,45,107,57,'#FFF0BD',10,'#D5A74A');lamp.name='StarLamp:'+i;}
   const dots=node(box,'CargoUnits:'+i,0,0,157,110),g=dots.addComponent(Graphics);g.fillColor=color(isWater?'#5BA9CA':'#E3B44C');
   for(let j=0;j<v;j++){g.circle(44+(j%3)*34,-(59+Math.floor(j/3)*27),9);g.fill();}
  }
  if(removal&&motionAllowed()){
   const x=18+removal.index*174,tag=text(boat,'−'+removal.value+' '+unit,x,0,157,24,20,C.teal,true,'center');tag.name='CargoRemoved:'+removal.index;
   tween(tag).to(.45,{position:new Vec3(x,8,0)},{easing:'quadOut'}).call(()=>tag.destroy()).start();
  }
  text(w,islandEquation(t,a.values),20,338,920,38,23,C.teal,true,'center');
 }
 private finish(){
  const h=this.h,p=h.progress,a=this.attempt!,t=a.task,b=this.shell(t.phase==='修复'?'小岛发生了变化！':'你的办法成功了！',()=>this.map());
  this.scene(panel(b,490,75,390,190,PLACES.find(f=>f.id===t.facility)!.color,25),t.facility,true);
  burst(h.root,720,260);
  const comparison=islandCargoComparison(t,a.values,this.previousSolution)||islandGardenComparison(t,a.values,this.previousSolution);
  text(b,comparison||t.result,150,280,1070,126,comparison?26:30,C.teal,true,'center');
  text(b,p.failed?'本机保存未成功，请点下面的「重试保存」。':`这轮提交 ${a.attempts} 次 · ${a.hinted?'使用过提示':'未用游戏提示'}。\n你的尝试已记录；可以回岛看看，也可以先休息。`,120,412,1130,85,24,C.muted,false,'center');
  h.btn(b,p.failed?'重试保存':'看看我的小岛',110,540,530,92,()=>{if(p.failed){p.save();this.finish();}else this.map();},C.gold,C.ink,25);
  h.btn(b,'今天先到这里',730,540,530,92,()=>h.map(),C.mint,C.teal,25);
 }
 private evidence(){
  const h=this.h,p=h.progress,b=this.shell('我的探索记录',()=>this.map());
  text(b,'记录你怎么完成任务；修好小岛，并不等于已经掌握所有知识。',35,14,1300,50,23,C.teal,true,'center');
  text(b,'任务',50,76,450,33,21,C.muted,true);text(b,'第一次完成',525,76,340,33,21,C.muted,true);text(b,'最近一次完成',920,76,400,33,21,C.muted,true);
  const label=(e?:IslandEvidence)=>!e?'还没有完成':`${new Date(e.at).getMonth()+1}/${new Date(e.at).getDate()} · 提交 ${e.attempts} 次 · ${e.hinted?'使用过提示':'未用游戏提示'}`;
  ISLAND_TASKS.forEach((t,i)=>{
   const y=120+i*48,r=p.island.records[t.id];if(i%2===0)panel(b,30,y,1310,46,C.blue,8);
   text(b,t.phase+' · '+t.title,50,y,460,44,22,C.ink);text(b,label(r?.first),525,y,390,44,19,C.muted);text(b,label(r?.latest),920,y,400,44,19,C.muted);
  });
  text(b,p.failed?'本机保存失败，请重试。':'次数只计算那一轮的提交；未用游戏提示，不代表没有其他帮助。',40,565,1290,40,21,C.teal,true,'center');
  if(p.failed)h.btn(b,'重试保存',475,612,420,45,()=>{p.save();this.evidence();},C.gold,C.ink,21);
 }
}
