import {Node,Graphics,Label} from 'cc';
import {panel,text,node,C,color} from '../ui/Kit';
import {Level} from './Catalog';
import {Puzzle} from './Puzzle';
export function mathWorkspace(w:Node,l:Level,p:Puzzle,press:(value:string)=>void,button:(...args:any[])=>Node){
 const model=panel(w,18,14,554,369,'#F8FBF5',22);text(model,'观察任务 · 算一算',22,13,510,38,21,C.teal,true,'center');
 const visual=l.visual;
 const n=node(model,'MathModel',0,0,554,369),g=n.addComponent(Graphics);g.strokeColor=color('#4D9491');g.fillColor=color('#F6D57C');g.lineWidth=4;
 if(visual?.kind==='clock'){
  const [h,m]=visual.values,cx=277,cy=-200,r=112;g.circle(cx,cy,r);g.stroke();
  for(let k=1;k<=12;k++){const a=(k/12)*Math.PI*2;text(model,String(k),cx+Math.sin(a)*88-18,-cy-Math.cos(a)*88-18,36,36,21,C.ink,true,'center');}
  const hand=(a:number,len:number,width:number)=>{g.lineWidth=width;g.moveTo(cx,cy);g.lineTo(cx+Math.sin(a)*len,cy+Math.cos(a)*len);g.stroke();};
  hand(((h%12)+m/60)*Math.PI/6,55,7);hand(m*Math.PI/30,80,4);g.circle(cx,cy,6);g.fill();
 }else if(visual?.kind==='ruler'){
  const [start,end]=visual.values,step=420/Math.max(end+1,10),x=62,y=205;panel(model,x,y,440,75,'#F8DF9A',8);for(let k=0;k<=Math.max(end+1,10);k++){g.moveTo(x+k*step,-y);g.lineTo(x+k*step,-y-23);g.stroke();text(model,String(k),x+k*step-15,y+28,30,27,17,C.ink,true,'center');}panel(model,x+start*step,y-48,(end-start)*step,29,'#75BDA8',7);text(model,'木条',170,y-96,220,35,23,C.teal,true,'center');
 }else if(visual?.kind==='bars'){
  const max=Math.max(...visual.values,1);visual.values.forEach((v,i)=>{const y=90+i*76;text(model,visual.labels?.[i]||'第'+(i+1)+'组',14,y,100,38,18,C.muted,true);panel(model,118,y+5,v/max*320,30,i%2?'#E6BD68':'#78BFA8',8);text(model,String(v),448,y,80,40,24,C.ink,true);});
 }else if(visual?.kind==='shape'){
  const [a,b]=visual.values;if(!b){g.circle(277,-201,96);g.stroke();g.moveTo(277,-201);g.lineTo(373,-201);g.stroke();text(model,'半径 '+a,230,143,170,35,21,C.teal,true,'center');}else{if(visual.labels?.[0]==='triangle'){g.moveTo(145,-280);g.lineTo(415,-280);g.lineTo(230,-130);g.close();g.stroke();}else{g.roundRect(145,-280,270,150,5);g.stroke();}text(model,'长 / 底 '+a,150,77,260,38,23,C.teal,true,'center');text(model,'宽 / 高 '+b,175,292,230,38,23,C.teal,true,'center');}
 }else if(visual?.kind==='numberline'){
  g.moveTo(45,-200);g.lineTo(510,-200);g.stroke();const bound=Math.max(5,...visual.values.map(Math.abs));for(let i=-bound;i<=bound;i++){const x=277+i*220/bound;g.moveTo(x,-192);g.lineTo(x,-208);g.stroke();text(model,String(i),x-18,216,36,35,20,C.ink,true,'center');}text(model,'0 是正数和负数的分界',50,91,454,45,22,C.teal,true,'center');
 }else{
  for(let i=0;i<5;i++){const x=100+i*83;panel(model,x,114+(i%2)*30,60,60,i%2?'#D8EEDF':'#FFE5A2',16);text(model,['+','−','×','÷','?'][i],x,114+(i%2)*30,60,60,31,C.teal,true,'center');}text(model,'用数学为小岛解决问题',60,263,434,48,24,C.ink,true,'center');
 }
 const field=panel(w,596,19,391,72,'#FFFDF5',18,'#CEDDD3');const inputLabel=text(field,p.input||'填写结果',18,4,270,60,31,p.input?C.ink:C.muted,true,'center').getComponent(Label);text(field,l.answerUnit||'',281,4,98,60,18,C.teal,true,'center');
 const update=(key:string)=>{press(key==='清空'?'clear':key);inputLabel.string=p.input||'填写结果';inputLabel.color=color(p.input?C.ink:C.muted);};
 const keys=['1','2','3','4','5','6','7','8','9','清空','0',(l.scale||1)>1?'.':l.target<0?'−':'⌫'];keys.forEach((key,i)=>button(w,key,603+i%3*126,103+Math.floor(i/3)*59,114,50,()=>update(key),C.cream,C.ink,25));button(w,'⌫ 删除',603,344,366,45,()=>update('back'),C.blue,C.muted,20);
}
