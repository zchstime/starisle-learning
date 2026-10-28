import {gradeWorld} from './GradeWorlds';
import {Node,Graphics,tween,UIOpacity} from 'cc';
import {node,panel,text,color,C} from '../ui/Kit';
import {RouteStop,ROUTE_PAGE_SIZE,routeUnlocked} from './LearningRoute';
interface View {
 root:Node;route:RouteStop[];done:string[];grade:number;subject:string;page:number;next:number;focus:number;medals:number;points:number;heroLevel:number;message:string;
 btn:(p:Node,s:string,x:number,y:number,w:number,h:number,f:()=>void,fill?:string,ink?:string,size?:number)=>Node;
 open:(at:number)=>void;preview:(at:number)=>void;turn:(delta:number)=>void;resume:()=>void;library:()=>void;journal:()=>void;audio:()=>void;account:()=>void;mascot:(x:number,y:number,size:number)=>void;
}
/** Illustrated planets are the map; runtime stars retain individual replay and unlock rules. */
export function journeyMap(v:View){
 const {root,route,done,page,next}=v,btn=v.btn,start=page*ROUTE_PAGE_SIZE,pages=Math.max(1,Math.ceil(route.length/ROUTE_PAGE_SIZE));
 const focus=route[v.focus>=0?v.focus:next>=0?next:start]||route[start],finished=route.filter(s=>done.includes(s.task.id)).length;
 const title=node(root,'MapAccount',31,22,280,100);text(title,'星屿学园',2,5,280,61,43,'#477CB5',true);text(title,'星屿学园',0,0,280,61,43,'#FFFFFF',true);text(title,'✦  STAR ISLE',6,60,250,29,19,'#FFFFFF',true);title.on(Node.EventType.TOUCH_END,v.account);
 btn(root,v.subject+' · '+v.grade+'年级 ▾',329,33,240,51,v.library,'#FFF5DF','#855B35',21);
 const count=panel(root,1002,28,178,53,'#477DB8',26,'',160);text(count,'✦ '+finished+' / '+route.length,10,0,158,53,25,'#FFFFFF',true,'center');
 btn(root,'♪',1200,28,63,57,v.audio,'#EAF4FF','#5C80AA',29);btn(root,'勋章',1281,28,123,57,v.journal,'#FFF2D4','#855B35',21);
 text(root,`星宝 Lv.${v.heroLevel} · ${v.points} 积分`,329,88,300,32,19,'#FFFFFF',true);
 // The labels follow the four illustrated planets instead of covering their scenery.
 const subjectHomes:Record<string,string[]>={'科学':['观察小屋','实验灯塔','证据之树','发现之门'],'道德与法治':['友善小屋','合作广场','责任之树','共同行动'],'音乐':['节奏小屋','旋律舞台','合奏之树','音乐剧场'],'美术':['线条小屋','色彩工坊','创作之树','作品展厅'],'体育与健康':['活力小屋','合作赛场','成长之树','运动会场'],'劳动':['整理小屋','生活工坊','实践之树','服务港口'],'信息科技':['数字小屋','程序工坊','信息之树','创作之门'],'综合实践':['发现小屋','调查广场','项目之树','成果展厅']};
 const world=gradeWorld(v.grade),homes=world.homes,names=v.subject==='语文'?['字词小屋','故事灯塔','阅读之树','表达之门']:subjectHomes[v.subject]||['启程小屋','星光广场','成长之树','时空之门'];
 text(root,world.name,599,34,330,48,27,'#FFFFFF',true,'center');
 btn(root,'‹\n学科',1372,325,60,112,v.library,'#FFF4DD','#855331',21);
 const trail=node(root,'WorldTrail',0,0,1440,810),ink=trail.addComponent(Graphics);ink.fillColor=color(world.trail,210);
 for(let i=0;i<3;i++){if(start+(i+1)*3>=route.length)break;const a=homes[i],b=homes[i+1];for(let k=1;k<26;k++){const t=k/26,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t-90-Math.sin(t*Math.PI)*(28+v.grade*4);ink.circle(x,-y,k%5===0?4:2);ink.fill();}}
 for(let group=0;group<4;group++){
  const first=start+group*3,chunk=route.slice(first,first+3);if(!chunk.length)continue;
  const [x,y]=homes[group],active=chunk.some(s=>s.ordinal===next),complete=chunk.every(s=>done.includes(s.task.id));
  const title=chunk[0].unit.title,stage=chunk[0].level<3?'探索':'挑战';
  if(active){const flag=panel(root,x-63,y-47,126,32,'#FFFFFF',16,'',245);text(flag,'✦ 正在探索',0,0,126,32,17,'#A46B27',true,'center');const a=flag.addComponent(UIOpacity);tween(a).repeatForever(tween().to(1.1,{opacity:155}).to(1.1,{opacity:255})).start();}
  const label=btn(root,names[group]+'  ›',x-136,y,272,49,()=>{const s=chunk.find(s=>!done.includes(s.task.id))||chunk[0];if(routeUnlocked(route,done,s.ordinal))v.open(s.ordinal);else v.preview(s.ordinal);},active?'#FFE1A0':'#FFF3DF','#855331',23);
  text(label,complete?'✓':'',235,3,29,42,20,'#358B7A',true,'center');
  const sub=panel(root,x-143,y+55,286,33,'#FDFBEE',16,'',225);text(sub,title+' · '+stage,8,0,270,33,16,'#6A7D85',true,'center');
  chunk.forEach((s,j)=>{
   const cx=x+(j-1)*61,cy=y+116,isDone=done.includes(s.task.id),isNext=s.ordinal===next,open=routeUnlocked(route,done,s.ordinal),r=23;
   const hit=node(root,'RouteStop:'+s.task.id,cx-r,cy-r,r*2,r*2),g=hit.addComponent(Graphics);
   g.fillColor=color('#FFFDF3',235);g.circle(r,-r,r);g.fill();g.strokeColor=color(isNext?'#EAB454':'#FFFFFF');g.lineWidth=isNext?3:1;g.circle(r,-r,r-2);g.stroke();
   g.fillColor=color(isDone?'#63AE9B':isNext?'#F8C75E':'#B6C7D3');for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?8:17;const xx=r+Math.cos(a)*rr,yy=-r-Math.sin(a)*rr;if(k===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.close();g.fill();
   text(hit,isDone?'✓':String(s.ordinal+1),0,0,r*2,r*2,14,isNext?'#80571F':'#FFFFFF',true,'center');hit.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;if(open)v.open(s.ordinal);else v.preview(s.ordinal);});
   if(s.level===s.unit.levels.length-1)text(root,'阶段勋章',cx-44,cy+29,88,24,13,'#647B8E',true,'center');
  });
 }
 v.mascot(28,590,110);
 const today=panel(root,28,711,355,76,'#FFFCF1',30,'#FFFFFF',245);text(today,'✦ 今日探索',20,7,310,26,19,'#8F5F35',true);text(today,v.message||(focus?focus.unit.title+' · 第 '+(focus.ordinal+1)+' 站':'新关卡正在准备中'),20,34,310,34,16,'#6C8193');
 btn(root,!route.length?'选择其他学科 →':next<0?(v.grade<6?'前往下一年级 →':'探索新星海 →'):'✦ 开始探索',510,711,420,76,route.length?v.resume:v.library,'#FFDC80','#8C531E',31);
 text(root,'第 '+(page+1)+' / '+pages+' 片星海',1054,739,217,30,18,'#5D7894',true,'center');
 if(page>0)btn(root,'‹',990,724,54,56,()=>v.turn(-1),'#FFF6E5','#92704D',32);
 if(page<pages-1)btn(root,'›',1285,724,54,56,()=>v.turn(1),'#FFF6E5','#92704D',32);
}
