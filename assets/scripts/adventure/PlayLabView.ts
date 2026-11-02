import {pageArrival,reveal,rewardPop} from '../ui/Motion';
import {Node,tween,Vec3,resources,ImageAsset,Texture2D,SpriteFrame} from 'cc';
import {burst,gardenTree} from './WorldMotion';
import {panel,text,sprite,C} from '../ui/Kit';
import {labTasks,LabTask,GIFTS,DECOR_GIFTS,Gift} from './PlayLab';
import {Progress,TREE_STYLES} from './Progress';
interface Host {root:Node;progress:Progress;screen:string;clear():void;art():void;map():void;sound(k:string):void;btn:(...a:any[])=>Node;}
/** Short interactions, no timer or loss of progress on mistakes. */
export class PlayLabView {
 private giftTab='decor';private selectedGift='';private displayMessage='';private interacting=false;
 private static giftFrames:Record<string,Promise<SpriteFrame|null>>={};
 private treeStyle=0;private selectedPlot=-1;private gardenMessage='';
 private mistakes=0;private combo=0;
 private at=0;private left=-1;private matched:number[]=[];private picks:string[]=[];private turn=0;private message='';private shopMessage='';private rightOrder:number[]=[];
 constructor(private h:Host){}
 private shell(title:string){const h=this.h;h.clear();h.screen='lab';if(typeof document!=='undefined')document.body.dataset.starisleLab='true';h.art();pageArrival(h.root,'lab:'+title);panel(h.root,0,0,1440,810,'#173E50',0,'',100);h.btn(h.root,'‹ 回小岛',30,25,180,56,()=>h.map(),C.cream,C.teal,22);const b=panel(h.root,90,110,1260,635,C.cream,30);text(b,title,40,22,1180,55,32,C.teal,true);return b;}
 menu(){const h=this.h,b=this.shell('趣味练习 · '+h.progress.grade+' 年级'),tasks=labTasks(h.progress.subject,h.progress.grade);text(b,'帮星宝建设观星花园 · 今天做一个小任务就很好',40,85,1180,50,23,C.muted);
 tasks.forEach((t,i)=>{const card=panel(b,40+i*600,165,570,300,i? '#F1EAF9':'#E2F2EC',28);reveal(card,i*.07);text(card,i?'✦':'✉',30,24,500,60,46,C.teal,true,'center');text(card,t.title,25,100,520,50,29,C.ink,true,'center');text(card,t.intro,30,160,510,64,22,C.muted,false,'center');h.btn(card,h.progress.labDone.includes(t.id)?'再练一次 →':'开始小任务 →',105,235,360,50,()=>this.start(i),C.gold,'#754A17',23);});
 if(!tasks.length)text(b,'当前先开放英语与语文趣味任务，请从首页切换学科。',40,220,1180,80,28,C.ink,true,'center');h.btn(b,'我的观星花园',390,535,480,55,()=>this.garden(),C.gold,'#754A17',22);}
 start(at:number){this.mistakes=0;this.combo=0;this.at=at;this.left=-1;this.matched=[];this.picks=[];this.turn=0;this.message='';const t=this.task;this.rightOrder=(t.pairs||[]).map((_,i)=>i).reverse();this.draw();}
 private get task(){return labTasks(this.h.progress.subject,this.h.progress.grade)[this.at];}
 private finish(){const h=this.h,t=this.task,fresh=h.progress.completeLab(t.id);h.sound('reward');const b=this.shell('任务完成！');burst(h.root,720,260);text(b,'✦',430,95,400,100,76,'#D9A441',true,'center');text(b,fresh?'+100 积分 · +30 经验':'复习完成 · 不重复加分',90,220,1080,60,31,C.teal,true,'center');text(b,h.progress.failed?'本机保存暂未成功，请稍后重试。':`今天已经照顾过星球了，可以安心收工。\n${h.progress.gardenStory}`,70,310,1120,85,23,C.muted,false,'center');h.btn(b,'今天先到这里',170,470,410,64,()=>h.map(),C.gold,'#754A17',24);h.btn(b,'看看我的星球',680,470,410,64,()=>this.garden(),C.mint,C.teal,24);}
 private draw(){const h=this.h,t=this.task,b=this.shell(t.title);text(b,t.intro,40,80,1170,58,25,C.ink,true);const count=t.kind==='pairs'?this.matched.length:t.kind==='poem'?this.picks.length:this.turn;const total=t.kind==='pairs'?3:2;for(let i=0;i<total;i++){const lamp=panel(b,1020+i*58,24,44,44,i<count?C.gold:C.blue,22);text(lamp,i<count?'★':'☆',0,0,44,44,28,C.teal,true,'center');if(i===count-1){lamp.setScale(.8,.8,1);tween(lamp).to(.25,{scale:new Vec3(1,1,1)},{easing:'backOut'}).start();}}text(b,this.message||'慢慢想，点一下就可以。',40,480,1170,56,23,C.teal,true,'center');
 if(t.kind==='pairs'){
 t.pairs.forEach((pair,i)=>{const done=this.matched.includes(i);h.btn(b,(done?'✓ ':'')+pair[0],55,165+i*91,390,70,()=>{if(!done){this.left=i;this.message='再点右边对应的站台';this.draw();}},done?C.mint:this.left===i?C.gold:C.blue,C.ink,25);});
 this.rightOrder.forEach((idx,j)=>{const done=this.matched.includes(idx);h.btn(b,(done?'✓ ':'')+t.pairs[idx][1],520,165+j*91,680,70,()=>{if(done)return;if(this.left<0){this.message='先点左边的卡片';this.draw();return;}if(this.left===idx){this.matched.push(idx);this.left=-1;h.sound('sparkle');this.success('送达成功！');}else{this.assist(`“${t.pairs[this.left][0]}”对应“${t.pairs[this.left][1]}”，一起读一遍，再来配对。`);h.sound('oops');}if(this.matched.length===t.pairs.length)this.finish();else this.draw();},done?C.mint:C.blue,C.ink,24);});
 }else if(t.kind==='dialogue'){
 const line=t.lines[this.turn];panel(b,60,160,1140,115,'#E5F1FF',25);text(b,'朋友：'+line.say,85,178,1090,80,30,C.ink,true,'center');text(b,`对话 ${this.turn+1} / ${t.lines.length} · 你会怎么回应？`,60,288,1140,40,23,C.teal,true,'center');const order=this.turn%2?[0,1]:[1,0];order.forEach((idx,j)=>h.btn(b,line.answers[idx],60+j*585,350,555,91,()=>{if(idx!==line.correct){this.assist(line.why);h.sound('oops');this.draw();return;}h.sound('sparkle');this.turn++;this.success('朋友听懂啦！');if(this.turn===t.lines.length)this.finish();else this.draw();},C.blue,C.ink,25));
 }else{
 t.poem.forEach((line,i)=>text(b,line.replace('____',this.picks[i]||'〔  〕'),60,160+i*74,1140,65,33,C.ink,true,'center'));
 [...t.words].reverse().forEach((word,i)=>h.btn(b,word,270+i*250,340,210,77,()=>{if(this.picks.length>=t.answer.length)return;const at=this.picks.length;if(word!==t.answer[at]){this.assist('一起读：'+t.poem[at].replace('____',t.answer[at]));h.sound('oops');this.draw();return;}this.picks.push(word);h.sound('sparkle');this.success('一盏诗灯亮了！');if(this.picks.length===t.answer.length)this.finish();else this.draw();},C.gold,'#754A17',34));
 }
 h.btn(b,'换个玩法',40,557,220,45,()=>this.menu(),C.blue,C.teal,20);text(b,t.note,290,548,910,64,17,C.muted,false,'right');}
 private success(message:string){this.combo++;this.mistakes=0;this.message=message+(this.combo>=2?` 已连续点亮 ${this.combo} 盏星灯！`:' 你的努力点亮了一盏星灯！');}
 private assist(explanation:string){this.combo=0;this.mistakes++;this.message=this.mistakes>=2?'星宝陪你想：'+explanation:'差一点，再试一次。星灯和进度都会保留。';}
 garden(){const h=this.h,p=h.progress,g=p.garden,slots=p.gardenSlots,b=this.shell('我的观星花园');
 text(b,p.gardenStory,40,80,1180,48,23,C.teal,true,'center');
 const land=panel(b,40,145,770,300,'#D9EEE3',35);
 const colors=['#78B89B','#B9ACDE','#E9BB68'];
 slots.forEach((style,i)=>{const x=20+(i%4)*185,y=15+Math.floor(i/4)*140;
 const plot=h.btn(land,'',x,y,170,124,()=>{
 if(this.selectedPlot>=0){if(this.selectedPlot===i){this.selectedPlot=-1;this.gardenMessage='已取消选择。';}else{p.moveTree(this.selectedPlot,i);this.selectedPlot=-1;this.gardenMessage='位置调整好了，花园由你做主。';}}
 else if(style>=0){this.selectedPlot=i;this.gardenMessage='点另一块地移动或交换；点右边树苗更换外观。';}
 else{this.gardenMessage=p.plantTree(i,this.treeStyle)?'种好了！星宝喜欢你选的位置。':'树苗会随着新任务慢慢长出，不用今天攒齐。';}
 h.sound('tap');this.garden();},this.selectedPlot===i?C.gold:style<0?'#EDF6EF':colors[style],C.teal,21);
 if(style>=0)gardenTree(plot,style);
 text(plot,style<0?'＋ 种在这里':(this.selectedPlot===i?'已选 · ':'')+TREE_STYLES[style],5,style<0?40:80,160,35,20,C.teal,true,'center');
 });
 const planted=slots.filter(v=>v>=0).length;
 text(b,`苗圃 ${Math.max(0,g.trees-planted)} 棵 · 花园 ${planted}/8`,835,145,385,38,22,C.teal,true);
 TREE_STYLES.forEach((name,i)=>h.btn(b,(this.treeStyle===i?'✓ ':'')+name,845,195+i*65,350,52,()=>{this.treeStyle=i;if(this.selectedPlot>=0){p.plantTree(this.selectedPlot,i);this.selectedPlot=-1;this.gardenMessage='换好外观了，不消耗树苗或积分。';}else this.gardenMessage='已选'+name+'，点一块空地种下。';this.garden();},colors[i],C.teal,22));
 text(b,`纪念花 ${g.keepsakes} 朵 · 累计照顾 ${g.days} 天`,835,400,385,38,19,C.muted);
 text(b,p.failed?'本机保存暂未成功，请稍后重试。':this.gardenMessage||(g.today?'今天已经照顾过星球了，可以安心收工。':'今天做一个任务或复习一次，就完成一次照顾。'),40,460,1180,44,22,C.teal,true,'center');
 text(b,`今日收集 ${g.today} 份晨露（最多三份，不必集满） · 休息不会枯萎`,40,511,1180,33,19,C.muted,false,'center');
 h.btn(b,'今天先到这里',40,563,350,48,()=>h.map(),C.mint,C.teal,22);h.btn(b,'布置礼物角',455,563,350,48,()=>this.giftGarden(),C.blue,C.teal,22);h.btn(b,'星光礼物屋',870,563,350,48,()=>this.shop(),C.gold,C.ink,22);
 }

 private giftArt(parent:Node,gift:Gift,x:number,y:number,size:number){
 if(!gift.art){text(parent,gift.symbol,x,y,size,size,64,C.teal,true,'center');return;}
 const placeholder=text(parent,'礼物加载中…',x,y,size,size,17,C.muted,false,'center');
 const key=gift.art;
 if(!PlayLabView.giftFrames[key])PlayLabView.giftFrames[key]=new Promise(resolve=>resources.load('art/'+key,ImageAsset,(err,img)=>{if(err){delete PlayLabView.giftFrames[key];resolve(null);return;}const texture=new Texture2D();texture.image=img;const frame=new SpriteFrame();frame.texture=texture;resolve(frame);}));
 PlayLabView.giftFrames[key].then(frame=>{if(!parent.isValid||!placeholder.isValid)return;placeholder.destroy();if(frame)sprite(parent,frame,x,y,size,size);else text(parent,'图片暂未加载\n'+gift.name,x,y,size,size,18,C.muted,false,'center');});
 }
 shop(){const h=this.h,p=h.progress,b=this.shell('星光礼物屋 · 观星旅行收藏');
 text(b,`可用 ${p.balance} 积分 · 兑换不影响等级 · 礼物永久保留`,40,80,1180,40,23,C.teal,true);
 h.btn(b,'花园礼物',40,130,230,44,()=>{this.giftTab='decor';this.shop();},this.giftTab==='decor'?C.gold:C.blue,C.teal,21);
 h.btn(b,'称号徽记',290,130,230,44,()=>{this.giftTab='badge';this.shop();},this.giftTab==='badge'?C.gold:C.blue,C.teal,21);
 const wish=GIFTS.find(g=>g.id===p.wishGift&&!p.gifts.includes(g.id));
 if(wish)h.btn(b,`心愿：${wish.name} · ${p.balance>=wish.cost?'已攒够，看看 →':`还差 ${wish.cost-p.balance} 积分 →`}`,550,130,670,44,()=>this.giftDetail(wish.id),C.mint,C.teal,20);else text(b,'选一件喜欢的礼物，慢慢攒，不用今天完成。',550,130,670,44,20,C.teal,false,'right');
 const gifts=GIFTS.filter(g=>this.giftTab==='decor'?!!g.art:!g.art);
 gifts.forEach((gift,i)=>{const card=h.btn(b,'',35+i*402,195,385,290,()=>this.giftDetail(gift.id),gift.color,C.teal,20);this.giftArt(card,gift,110,8,165);text(card,gift.name,15,177,355,36,26,C.ink,true,'center');text(card,p.gifts.includes(gift.id)?'已收藏 · 永久拥有':gift.cost+' 积分',15,213,355,30,20,C.teal,false,'center');h.btn(card,'看看这件礼物',25,247,335,36,()=>this.giftDetail(gift.id),C.cream,C.teal,20);});
 text(b,p.failed?'本机保存暂未成功，请稍后重试。':this.shopMessage||`观星旅行收藏 ${DECOR_GIFTS.filter(g=>p.gifts.includes(g.id)).length}/${DECOR_GIFTS.length} · 自己选，没有随机抽奖`,40,498,1180,42,21,C.teal,true,'center');
 h.btn(b,'回到花园',60,565,360,46,()=>this.garden(),C.mint,C.teal,22);h.btn(b,'布置我的礼物',840,565,360,46,()=>this.giftGarden(),C.gold,C.teal,22);
 }
 private giftDetail(id:string){const gift=GIFTS.find(g=>g.id===id);if(!gift)return;const h=this.h,p=h.progress,owned=p.gifts.includes(id),b=this.shell(gift.name);
 panel(b,40,90,470,430,gift.color,35);this.giftArt(b,gift,65,100,420);
 text(b,gift.art?'观星旅行 · 花园摆件':'首页称号 · 收藏徽记',560,100,640,42,25,C.teal,true);
 text(b,gift.description||'把喜欢的称号展示在首页。',560,165,640,95,28,C.ink,true);
 text(b,owned?'已永久收藏 · 布置和更换都免费':`兑换需要 ${gift.cost} 积分\n可用 ${p.balance} · ${p.balance>=gift.cost?`兑换后剩余 ${p.balance-gift.cost}`:`还差 ${gift.cost-p.balance}`} 积分`,560,285,640,95,24,C.teal,true);
 text(b,'首次完成新任务获得 100 积分。\n礼物只改变装饰，不影响题目、成绩或学习机会。',560,395,640,74,20,C.muted);
 h.btn(b,owned?(gift.art?'去花园布置':'展示到首页'):p.balance>=gift.cost?`确认兑换 · ${gift.cost} 积分`:p.wishGift===id?'取消这个心愿':'设为我的心愿',560,490,640,60,()=>{
 if(owned){if(gift.art){this.selectedGift=id;this.giftGarden();}else{p.equippedGift=id;p.save();this.shopMessage='称号已展示到首页';this.shop();}return;}
 if(p.balance<gift.cost){p.setWish(p.wishGift===id?'':id);this.giftDetail(id);return;}
 if(p.redeem(id)){h.sound('reward');if(gift.art){this.selectedGift=id;this.displayMessage='新礼物来啦！选一个喜欢的位置，也可以稍后布置。';this.giftGarden();return;}this.shopMessage='兑换成功！礼物已经属于你。';}else this.shopMessage='余额或收藏状态已变化，请重新查看。';this.shop();
 },C.gold,C.teal,23);
 h.btn(b,'返回礼物屋',55,560,450,48,()=>this.shop(),C.mint,C.teal,22);
 if(!owned&&p.balance>=gift.cost)h.btn(b,p.wishGift===id?'取消心愿':'先设心愿，稍后再换',560,566,640,44,()=>{p.setWish(p.wishGift===id?'':id);this.giftDetail(id);},C.blue,C.teal,20);
 }
 private playGift(gift:Gift){
 if(this.interacting)return;this.interacting=true;
 const h=this.h,b=this.shell(gift.name+' · 星宝的小发现');
 const stage=panel(b,40,95,520,420,gift.color,35);this.giftArt(stage,gift,70,15,380);
 const stories:Record<string,{title:string;lines:string[];action:string}>={
 'star-lantern':{title:'把温暖留给今天',lines:['星灯亮起来了！','想一想：今天哪一次尝试，让你有一点点开心？','可以说给身边的人听，也可以留在心里。'],action:'再点亮一次'},
 'moon-telescope':{title:'今晚的月亮是什么样？',lines:['星宝把望远镜转向了夜空。','月亮有时像弯弯的小船，有时像圆圆的饼。','有机会时和家人看看：今晚能找到月亮吗？'],action:'再看一次星光'},
 'cloud-airship':{title:'下一站，由你想象',lines:['云朵飞艇准备起航了。','如果能飞往一座新小岛，你想去森林、海边，还是云上？','给那座小岛起一个属于你的名字吧。'],action:'再飞一小圈'}
 };
 const story=stories[gift.id];text(b,story.title,610,100,590,60,31,C.teal,true);text(b,story.lines.join('\n\n'),610,180,590,230,25,C.ink);
 const animate=()=>{h.sound('sparkle');burst(stage,260,170);if(gift.id==='cloud-airship')tween(stage).to(.45,{position:new Vec3(40,-78,0)}).to(.45,{position:new Vec3(40,-95,0)}).start();};
 animate();let busy=false;h.btn(b,story.action,650,440,500,56,()=>{if(busy)return;busy=true;animate();tween(b).delay(1).call(()=>{busy=false;}).start();},C.gold,C.teal,23);
 text(b,'这是你的礼物时间，不计分，也没有必须完成的任务。',40,530,1180,36,20,C.muted,false,'center');
 h.btn(b,'回礼物角',70,578,440,42,()=>this.giftGarden(),C.mint,C.teal,22);h.btn(b,'今天先到这里',750,578,440,42,()=>{this.interacting=false;h.map();},C.blue,C.teal,22);
 }
 giftGarden(){this.interacting=false;const h=this.h,p=h.progress,b=this.shell('观星花园 · 我的礼物角');
 text(b,'星宝：灯照着小路，望远镜朝向月亮，飞艇等我们下次出发。',40,80,1180,45,23,C.teal,true,'center');
 const slots=p.displayedGifts;
 slots.forEach((id,i)=>{const gift=DECOR_GIFTS.find(g=>g.id===id),card=panel(b,40+i*400,145,380,280,gift?.color||'#E5F1E9',28);
 if(gift){const toy=h.btn(card,'',45,5,290,220,()=>{if(this.selectedGift){p.placeGift(this.selectedGift,i);this.selectedGift='';this.displayMessage='布置好了！点礼物还能发现小故事。';this.giftGarden();}else this.playGift(gift);},gift.color,C.teal,20);this.giftArt(toy,gift,35,0,220);}else text(card,'留一个位置给喜欢的礼物',20,85,340,90,22,C.muted,false,'center');
 h.btn(card,this.selectedGift?'放在这里':gift?'收回收藏':'选择下方礼物',15,235,350,38,()=>{if(this.selectedGift){p.placeGift(this.selectedGift,i);this.selectedGift='';this.displayMessage='布置好了！礼物位置可以随时调整。';}else if(gift){p.placeGift('',i);this.displayMessage='已收回收藏，随时可以再摆出来。';}else this.displayMessage='先选择下方已经拥有的礼物。';this.giftGarden();},C.cream,C.teal,20);
 });
 DECOR_GIFTS.forEach((gift,i)=>h.btn(b,(this.selectedGift===gift.id?'✓ ':p.gifts.includes(gift.id)?'':'未收藏 · ')+gift.name,40+i*400,440,380,44,()=>{if(!p.gifts.includes(gift.id)){this.giftDetail(gift.id);return;}this.selectedGift=this.selectedGift===gift.id?'':gift.id;this.displayMessage=this.selectedGift?'点上面的一个位置；已有礼物会交换或收回收藏。':'';this.giftGarden();},this.selectedGift===gift.id?C.gold:C.blue,C.teal,21));
 text(b,p.failed?'本机保存暂未成功，请稍后重试。':this.displayMessage||'点礼物玩一会儿；选择下方收藏可以调整位置。',40,500,1180,42,21,C.teal,true,'center');
 h.btn(b,'回知识树林',60,565,360,46,()=>this.garden(),C.mint,C.teal,22);h.btn(b,'去礼物屋看看',840,565,360,46,()=>this.shop(),C.gold,C.teal,22);
 }
}
