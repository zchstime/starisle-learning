import {learningWorld} from './SubjectWorlds';
import {Node,Graphics} from 'cc';
import {node,panel,text,color,C} from '../ui/Kit';
import {RouteStop,ROUTE_PAGE_SIZE,routeUnlocked} from './LearningRoute';
import {unitLabel} from './Catalog';
interface View {
 root:Node;route:RouteStop[];done:string[];grade:number;subject:string;subjectId?:string;page:number;next:number;focus:number;medals:number;points:number;heroLevel:number;message:string;
 btn:(p:Node,s:string,x:number,y:number,w:number,h:number,f:()=>void,fill?:string,ink?:string,size?:number)=>Node;
 open:(at:number)=>void;preview:(at:number)=>void;turn:(delta:number)=>void;resume:()=>void;library:()=>void;journal:()=>void;audio:()=>void;account:()=>void;mascot:(x:number,y:number,size:number)=>void;
}
/** Illustrated planets are the map; runtime stars retain individual replay and unlock rules. */
export function journeyMap(v:View){
 const {root,route,done,page,next}=v,btn=v.btn,start=page*ROUTE_PAGE_SIZE,pages=Math.max(1,Math.ceil(route.length/ROUTE_PAGE_SIZE));
 const focus=route[v.focus>=0?v.focus:next>=0?next:start]||route[start],finished=route.filter(s=>done.includes(s.task.id)).length;
 if(typeof window==='undefined'||!(window as any).starisleProfileUI)btn(root,'个人中心',31,28,190,54,v.account,'#FFF5DF','#855B35',21);
 btn(root,v.subject+' · '+v.grade+'年级 ▾',290,28,265,53,v.library,'#FFF5DF','#855B35',21);
 // Photo learning remains an independent preview until it is ready for the main navigation.
 const count=panel(root,1002,28,178,53,'#477DB8',26,'',160);text(count,'✦ '+finished+' / '+route.length,10,0,158,53,25,'#FFFFFF',true,'center');
 btn(root,'♪',1200,28,63,57,v.audio,'#EAF4FF','#5C80AA',29);btn(root,'勋章',1281,28,123,57,v.journal,'#FFF2D4','#855B35',21);
 // Learning level and points live in the personal center, avoiding duplicate HUD stats.
 // The labels follow the four illustrated planets instead of covering their scenery.
 const subjectHomes:Record<string,string[]>={'科学':['观察小屋','实验灯塔','证据之树','发现之门'],'道德与法治':['友善小屋','合作广场','责任之树','共同行动'],'音乐':['节奏小屋','旋律舞台','合奏之树','音乐剧场'],'美术':['线条小屋','色彩工坊','创作之树','作品展厅'],'体育与健康':['活力小屋','合作赛场','成长之树','运动会场'],'劳动':['整理小屋','生活工坊','实践之树','服务港口'],'信息科技':['数字小屋','程序工坊','信息之树','创作之门'],'综合实践':['发现小屋','调查广场','项目之树','成果展厅']};
 const world=learningWorld(v.subjectId||'math',v.grade),homes=world.homes,names=v.subject==='语文'?['字词小屋','故事灯塔','阅读之树','表达之门']:subjectHomes[v.subject]||['启程小屋','星光广场','成长之树','时空之门'];
 text(root,world.name+' · 第 '+(page+1)+' / '+pages+' 片星海',575,34,395,42,21,'#FFFFFF',true,'center');
 // Subject picker has one entry in the header; no duplicate side tab.
 const trail=node(root,'WorldTrail',0,0,1440,810),ink=trail.addComponent(Graphics);ink.fillColor=color(world.trail,210);
 for(let i=0;i<3;i++){if(start+(i+1)*3>=route.length)break;const a=homes[i],b=homes[i+1];for(let k=1;k<26;k++){const t=k/26,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t-90-Math.sin(t*Math.PI)*(28+v.grade*4);ink.circle(x,-y,k%5===0?4:2);ink.fill();}}
 for(let group=0;group<4;group++){
  const first=start+group*3,chunk=route.slice(first,first+3);if(!chunk.length)continue;
  const [x,y]=homes[group],active=chunk.some(s=>s.ordinal===next),complete=chunk.every(s=>done.includes(s.task.id));
  const title=unitLabel(chunk[0].unit)+' · '+chunk[0].unit.title,stage=chunk[0].level<3?'探索':'挑战';
  const card=panel(root,x-136,y,272,107,active?'#FFF0C9':'#FFF9EC',24,'#FFFFFF',238);
  btn(card,names[group]+(complete?'  ✓':'  ›'),0,0,272,47,()=>{const s=chunk.find(s=>!done.includes(s.task.id))||chunk[0];if(routeUnlocked(route,done,s.ordinal))v.open(s.ordinal);else v.preview(s.ordinal);},active?'#FFE1A0':'#FFF3DF','#855331',22);
  text(card,(active?'下一题 · ':complete?'已完成 · ':'')+title+' · '+stage,8,47,256,34,13,'#6A7D85',false,'center');
  chunk.forEach((s,j)=>{
   const cx=x+(j-1)*61,cy=y+104,isDone=done.includes(s.task.id),isNext=s.ordinal===next,open=routeUnlocked(route,done,s.ordinal),r=22;
   const hit=node(root,'RouteStop:'+s.task.id,cx-r,cy-r,r*2,r*2),g=hit.addComponent(Graphics);
   g.fillColor=color(isDone?'#DDF2E7':isNext?'#FFE1A0':'#FFFDF3',250);g.circle(r,-r,r);g.fill();g.strokeColor=color(isNext?'#EAB454':'#FFFFFF');g.lineWidth=isNext?3:1;g.circle(r,-r,r-2);g.stroke();
   // Small numbered stepping stones keep direct replay without repeated decorative stars.
   text(hit,String(s.ordinal+1),0,0,r*2,r*2,16,isDone?'#358B7A':isNext?'#80571F':'#6C8193',true,'center');hit.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;if(open)v.open(s.ordinal);else v.preview(s.ordinal);});

  });
 }
 v.mascot(28,675,105);
 const objective=focus?.unit.curriculum?.objectives?.[0]||'',objectiveText=objective.length>26?objective.slice(0,26)+'…':objective;
 const today=panel(root,155,714,325,68,'#FFFCF1',30,'#FFFFFF',245);text(today,'当前单元目标',16,5,290,24,16,'#8F5F35',true);text(today,v.message||objectiveText||(focus?unitLabel(focus.unit)+' · '+focus.unit.title:'新单元正在准备中'),16,29,290,30,14,'#6C8193');
 btn(root,!route.length?'选择其他学科 →':next<0?(v.grade<6?'前往下一年级 →':'探索新星海 →'):'✦ 开始探索',510,711,420,76,route.length?v.resume:v.library,'#FFDC80','#8C531E',31);
 if(page>0)btn(root,'‹ 上片',1002,643,130,46,()=>v.turn(-1),'#FFF6E5','#92704D',19);
 if(page<pages-1)btn(root,'下片 ›',1150,643,130,46,()=>v.turn(1),'#FFF6E5','#92704D',19);
}
