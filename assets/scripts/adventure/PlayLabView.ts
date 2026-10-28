import {Node,tween,Vec3} from 'cc';
import {burst} from './WorldMotion';
import {panel,text,C} from '../ui/Kit';
import {labTasks,LabTask,GIFTS} from './PlayLab';
import {Progress} from './Progress';
interface Host {root:Node;progress:Progress;screen:string;clear():void;art():void;map():void;sound(k:string):void;btn:(...a:any[])=>Node;}
/** Short interactions, no timer or loss of progress on mistakes. */
export class PlayLabView {
 private at=0;private left=-1;private matched:number[]=[];private picks:string[]=[];private turn=0;private message='';private shopMessage='';private rightOrder:number[]=[];
 constructor(private h:Host){}
 private shell(title:string){const h=this.h;h.clear();h.screen='lab';h.art();panel(h.root,0,0,1440,810,'#173E50',0,'',100);h.btn(h.root,'‹ 回小岛',30,25,180,56,()=>h.map(),C.cream,C.teal,22);const b=panel(h.root,90,110,1260,635,C.cream,30);text(b,title,40,22,1180,55,32,C.teal,true);return b;}
 menu(){const h=this.h,b=this.shell('趣味练习 · '+h.progress.grade+' 年级'),tasks=labTasks(h.progress.subject,h.progress.grade);text(b,'每天换一种方式练习 · 首次完成 +100 积分，复习不重复加分',40,85,1180,50,23,C.muted);
 tasks.forEach((t,i)=>{const card=panel(b,40+i*600,165,570,300,i? '#F1EAF9':'#E2F2EC',28);text(card,i?'✦':'✉',30,24,500,60,46,C.teal,true,'center');text(card,t.title,25,100,520,50,29,C.ink,true,'center');text(card,t.intro,30,160,510,64,22,C.muted,false,'center');h.btn(card,h.progress.labDone.includes(t.id)?'再练一次 →':'开始小任务 →',105,235,360,50,()=>this.start(i),C.gold,'#754A17',23);});
 if(!tasks.length)text(b,'当前先开放英语与语文趣味任务，请从首页切换学科。',40,220,1180,80,28,C.ink,true,'center');h.btn(b,'积分兑换 · '+h.progress.balance+' 可用',390,535,480,55,()=>this.shop(),C.gold,'#754A17',22);}
 start(at:number){this.at=at;this.left=-1;this.matched=[];this.picks=[];this.turn=0;this.message='';const t=this.task;this.rightOrder=(t.pairs||[]).map((_,i)=>i).reverse();this.draw();}
 private get task(){return labTasks(this.h.progress.subject,this.h.progress.grade)[this.at];}
 private finish(){const h=this.h,t=this.task,fresh=h.progress.completeLab(t.id);h.sound('reward');const b=this.shell('任务完成！');burst(h.root,720,260);text(b,'✦',430,95,400,100,76,'#D9A441',true,'center');text(b,fresh?'+100 积分 · +30 经验':'复习完成 · 不重复加分',90,220,1080,60,31,C.teal,true,'center');text(b,t.note,70,310,1120,85,23,C.muted,false,'center');h.btn(b,'换个玩法 →',170,470,410,64,()=>this.start((this.at+1)%2),C.gold,'#754A17',24);h.btn(b,'看看奖励',680,470,410,64,()=>this.shop(),C.mint,C.teal,24);}
 private draw(){const h=this.h,t=this.task,b=this.shell(t.title);text(b,t.intro,40,80,1170,58,25,C.ink,true);const count=t.kind==='pairs'?this.matched.length:t.kind==='poem'?this.picks.length:this.turn;const total=t.kind==='pairs'?3:2;for(let i=0;i<total;i++){const lamp=panel(b,1020+i*58,24,44,44,i<count?C.gold:C.blue,22);text(lamp,i<count?'★':'☆',0,0,44,44,28,C.teal,true,'center');if(i===count-1){lamp.setScale(.8,.8,1);tween(lamp).to(.25,{scale:new Vec3(1,1,1)},{easing:'backOut'}).start();}}text(b,this.message||'慢慢想，点一下就可以。',40,480,1170,56,23,C.teal,true,'center');
 if(t.kind==='pairs'){
 t.pairs.forEach((pair,i)=>{const done=this.matched.includes(i);h.btn(b,(done?'✓ ':'')+pair[0],55,165+i*91,390,70,()=>{if(!done){this.left=i;this.message='再点右边对应的站台';this.draw();}},done?C.mint:this.left===i?C.gold:C.blue,C.ink,25);});
 this.rightOrder.forEach((idx,j)=>{const done=this.matched.includes(idx);h.btn(b,(done?'✓ ':'')+t.pairs[idx][1],520,165+j*91,680,70,()=>{if(done)return;if(this.left<0){this.message='先点左边的卡片';this.draw();return;}if(this.left===idx){this.matched.push(idx);this.left=-1;h.sound('sparkle');this.message='送达成功！再接下一份快递。';}else{this.message='这两张还不对应，再找找。';h.sound('oops');}if(this.matched.length===t.pairs.length)this.finish();else this.draw();},done?C.mint:C.blue,C.ink,24);});
 }else if(t.kind==='dialogue'){
 const line=t.lines[this.turn];panel(b,60,160,1140,115,'#E5F1FF',25);text(b,'朋友：'+line.say,85,178,1090,80,30,C.ink,true,'center');text(b,`对话 ${this.turn+1} / ${t.lines.length} · 你会怎么回应？`,60,288,1140,40,23,C.teal,true,'center');const order=this.turn%2?[0,1]:[1,0];order.forEach((idx,j)=>h.btn(b,line.answers[idx],60+j*585,350,555,91,()=>{if(idx!==line.correct){this.message='想想朋友正在问什么，再试一次。';h.sound('oops');this.draw();return;}h.sound('sparkle');this.turn++;this.message='朋友听懂啦！';if(this.turn===t.lines.length)this.finish();else this.draw();},C.blue,C.ink,25));
 }else{
 t.poem.forEach((line,i)=>text(b,line.replace('____',this.picks[i]||'〔  〕'),60,160+i*74,1140,65,33,C.ink,true,'center'));
 [...t.words].reverse().forEach((word,i)=>h.btn(b,word,270+i*250,340,210,77,()=>{if(this.picks.length>=t.answer.length)return;const at=this.picks.length;if(word!==t.answer[at]){this.message='再读一遍诗句，看看哪个字更合适。';h.sound('oops');this.draw();return;}this.picks.push(word);h.sound('sparkle');this.message='一盏诗灯亮了！';if(this.picks.length===t.answer.length)this.finish();else this.draw();},C.gold,'#754A17',34));
 }
 h.btn(b,'换个玩法',40,557,220,45,()=>this.menu(),C.blue,C.teal,20);text(b,t.note,290,548,910,64,17,C.muted,false,'right');}
 shop(){const h=this.h,b=this.shell('星光兑换屋'),p=h.progress;text(b,`可用 ${p.balance} 积分 · 累计获得 ${p.points} · 兑换不影响等级`,40,88,1170,45,25,C.teal,true);
 GIFTS.forEach((gift,i)=>{const card=panel(b,35+i*402,165,385,310,gift.color,25);text(card,gift.symbol,30,15,325,88,64,C.teal,true,'center');text(card,gift.name,15,118,355,48,27,C.ink,true,'center');text(card,'首页称号与专属徽记',15,170,355,40,20,C.muted,false,'center');const owned=p.gifts.includes(gift.id);h.btn(card,owned?(p.equippedGift===gift.id?'正在展示':'展示到首页'):gift.cost+' 积分兑换',25,235,335,55,()=>{if(owned){p.equippedGift=gift.id;p.save();this.shopMessage='已展示到首页';}else this.shopMessage=p.redeem(gift.id)?'兑换成功！已佩戴。':'积分还不够，完成新的学习任务就能积攒。';h.sound('tap');this.shop();},owned?C.cream:C.gold,C.ink,22);});text(b,this.shopMessage||'奖励永久保留 · 每款只兑换一次 · 无随机抽奖',40,495,1180,60,23,C.teal,true,'center');h.btn(b,'回小岛看看',430,565,400,45,()=>h.map(),C.gold,C.ink,22);}
}
