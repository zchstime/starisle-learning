import { Adventure } from './adventure/Adventure';
import { _decorator, Component, Node, UITransform, Graphics, Color, ImageAsset, Texture2D, SpriteFrame, resources, tween, Vec3, UIOpacity, AudioSource, AudioClip, view, ResolutionPolicy, Tween, input, Input, EventKeyboard, KeyCode } from 'cc';
import { GameSession } from './core/GameSession';
import { MathPuzzle } from './core/MathPuzzle';
import { LocalSave } from './platform/LocalSave';
import { MISSIONS, TRANSFER } from './content/MathIsland';
import { C, color, node, panel, text, button, sprite } from './ui/Kit';
const { ccclass } = _decorator;

@ccclass('StarIsle')
export class StarIsle extends Component {
  private session:GameSession;
  private root:Node;private world:Node;private overlay:Node|null=null;private guide:Node;
  private frames:Record<string,SpriteFrame>={};private audio:AudioSource;private clips:Record<string,AudioClip>={};
  private stage=-1;private puzzle:MathPuzzle;private digits='';private message='';private hintVisible=false;
  private examIndex=-1;private examAnswers:number[]=[];private screen='map';private busy=false;
  private keypadRefresh:(()=>void)|null=null;
  private adventure:Adventure;
  async start(){if(typeof window!=='undefined')await (window as any).starisleAuthReady;this.session=new GameSession(new LocalSave());this.adventure=new Adventure(this.node,()=>this.legacyStart());this.adventure.start();}
  private legacyStart(){
    view.setDesignResolutionSize(1440,810,ResolutionPolicy.SHOW_ALL);
    this.root=node(this.node,'GameRoot',-720,-405,1440,810);
    panel(this.root,0,0,1440,810,'#C0ECEE',0);
    text(this.root,'星屿 · 正在准备冒险',420,330,600,80,36,C.ink,true,'center');
    text(this.root,'带上好奇心，一起点亮小岛',420,410,600,50,22,C.muted,false,'center');
    this.audio=this.node.addComponent(AudioSource);
    input.on(Input.EventType.KEY_DOWN,this.onKey,this);
    Promise.all(['island','guide'].map(k=>new Promise<void>((resolve,reject)=>{
      resources.load('art/'+k,ImageAsset,(err,img)=>{if(err){reject(err);return;}const tx=new Texture2D();tx.image=img;const sf=new SpriteFrame();sf.texture=tx;this.frames[k]=sf;resolve();});
    }))).then(()=>{this.map();}).catch(e=>{console.error(e);text(this.root,'美术资源加载失败，请刷新页面重试。',370,490,700,60,24,C.ink,false,'center');});
    ['tap','success'].forEach(k=>resources.load('audio/'+k,AudioClip,(err,c)=>{if(!err)this.clips[k]=c;}));
  }
  onDestroy(){input.off(Input.EventType.KEY_DOWN,this.onKey,this);}
  private onKey(e:EventKeyboard){
    if(!this.keypadRefresh)return;
    let k=''; if(e.keyCode>=KeyCode.DIGIT_0&&e.keyCode<=KeyCode.DIGIT_9)k=String(e.keyCode-KeyCode.DIGIT_0);
    if(k)this.addDigit(k);else if(e.keyCode===KeyCode.BACKSPACE){this.digits=this.digits.slice(0,-1);this.keypadRefresh();}
  }
  private sound(k='tap'){if(this.session.state.sound&&this.clips[k])this.audio.playOneShot(this.clips[k],k==='success'?.5:.3);}
  private clear(n:Node){for(const child of [...n.children]){this.stop(child);child.destroy();}}
  private stop(n:Node){Tween.stopAllByTarget(n);const op=n.getComponent(UIOpacity);if(op)Tween.stopAllByTarget(op);for(const c of n.children)this.stop(c);}
  private close(){this.keypadRefresh=null;if(this.overlay){this.stop(this.overlay);this.overlay.destroy();this.overlay=null;}this.screen='map';this.examIndex=-1;}
  private map(){
    this.close();this.clear(this.root);this.screen='map';this.busy=false;
    this.world=node(this.root,'World',0,0,1440,810);
    sprite(this.world,this.frames.island,0,0,1440,810);
    // Tiny motes and floating guardian provide animation without baking UI into the art.
    for(let i=0;i<18;i++){
      const n=node(this.world,'Starlight',170+(i*137)%1100,210+(i*83)%430,8,8);this.star(n,0,0,4,'#FFF3B6');
      const op=n.addComponent(UIOpacity);op.opacity=100;tween(op).delay(i*.12).to(1.5,{opacity:230}).to(1.5,{opacity:60}).union().repeatForever().start();
      const p=n.position.clone();tween(n).by(2+(i%3),{position:new Vec3(7,12,0)}).to(2+(i%3),{position:p}).union().repeatForever().start();
    }
    const count=this.session.state.completed.length;
    for(let i=0;i<count;i++)this.beacon(MISSIONS[i].map[0],MISSIONS[i].map[1]);
    const top=panel(this.world,28,22,325,90,C.cream,26,'',240);
    this.star(top,34,42,18,'#E9AB42');
    text(top,'星 屿 学 园',66,9,235,43,31,C.ink,true);
    text(top,'S T A R I S L E  ·  数学冒险',68,51,235,24,13,C.muted);
    panel(this.world,496,28,448,57,C.cream,28,'',238);
    button(this.world,'‹ 学科地图 · 二年级经典试炼',512,34,416,42,()=>{this.close();this.stop(this.root);this.root.destroy();input.off(Input.EventType.KEY_DOWN,this.onKey,this);this.audio.destroy();this.start();},C.cream,C.ink,20);
    button(this.world,'★  '+count+' / 3',1070,28,150,57,()=>this.journal(),C.cream,C.teal,24);
    button(this.world,this.session.state.sound?'♪ 开':'♪ 关',1234,28,82,57,()=>{this.session.state.sound=!this.session.state.sound;this.session.save();this.map();},C.cream,C.teal,18);
    button(this.world,'设置',1330,28,82,57,()=>this.settings(),C.cream,C.muted,18);
    const labels:[[number,number],[number,number],[number,number]]=[[620,299],[250,205],[1010,468]];
    MISSIONS.forEach((m,i)=>{
      const done=this.session.state.completed.includes(m.id),allowed=this.session.unlocked(i);
      const marker=button(this.world,(done?'✓  ':allowed?'✦  ':'○  ')+m.place,labels[i][0],labels[i][1],214,59,()=>this.travel(i),done?C.mint:allowed?C.cream:'#E7ECEA',allowed?C.ink:C.muted,23);
      text(marker,done?'已点亮 · 可以再玩':allowed?(i===count?'点击探索':'点击进入'):'完成前一站后开启',0,62,214,28,16,'#FFFFFF',true,'center');
    });
    const gate=button(this.world,(count===3?'✦  ':'○  ')+'星光传送门',1030,158,224,60,()=>{if(count===3)this.startExam();else this.notice('传送门还在等待星光','完成三个岛上任务，收集三枚星章，就可以来试试独立挑战。');},count===3?C.gold:C.cream,C.ink,23);
    text(gate,'独立挑战',0,63,224,25,16,'#FFFFFF',true,'center');
    this.guide=sprite(this.world,this.frames.guide,430,476,182,192);
    tween(this.guide).by(1.4,{position:new Vec3(0,8,0)}).by(1.4,{position:new Vec3(0,-8,0)}).union().repeatForever().start();
    const speech=panel(this.world,581,570,345,70,C.cream,23,'',245);
    text(speech,count===0?'我是星宝，陪你用数学修复小岛！':count<3?'做得真好！去下一站帮帮忙吧。':'小岛亮起来了！去传送门试试吧。',20,8,305,54,19,C.ink,true);
    panel(this.world,28,693,395,90,C.cream,24,'',245);
    text(this.world,'今日冒险  /  小学二年级',50,704,340,26,16,C.muted);
    text(this.world,count<3?MISSIONS[count].title:'用自己的本领打开传送门',50,736,340,30,25,C.ink,true);
    button(this.world,count<3?'开始探索  →':this.session.state.exam?'再试一次  →':'开启试炼  →',521,698,398,78,()=>count<3?this.travel(count):this.startExam(),C.gold,'#754A17',29);
    button(this.world,'我的星章',1068,711,164,60,()=>this.journal(),C.cream,C.ink,21);
    button(this.world,'怎么玩',1247,711,164,60,()=>this.notice('每一次动手，都在学数学','点地图上的地点开始冒险。\n合星光、拆星光、种种子，再输入答案。\n不用抢时间，答错可以继续试。\n完成的关卡会自动保存在这台设备。'),C.cream,C.ink,21);
    if(this.session.saveFailed)text(this.world,'本机存档不可用，请保持页面打开。',480,783,500,24,16,'#7F281E',true,'center');
  }
  private star(parent:Node,x:number,y:number,r:number,fill:string){const glyph=node(parent,'StarGlyph',0,0,1,1);const g=glyph.addComponent(Graphics);g.fillColor=color(fill);for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.46:r;const px=x+Math.cos(a)*rr,py=-y+Math.sin(a)*rr;if(i===0)g.moveTo(px,py);else g.lineTo(px,py);}g.close();g.fill();}
  private beacon(x:number,y:number){const n=node(this.world,'RestoredBeacon',x-18,y-75,36,36);this.star(n,18,18,22,'#FFE091');const op=n.addComponent(UIOpacity);tween(op).to(1,{opacity:130}).to(1,{opacity:255}).union().repeatForever().start();}
  private travel(i:number){if(this.busy)return;if(!this.session.unlocked(i)){this.notice('这条小路还没有亮起来','先完成前一站的任务，星光就会指引你来到这里。');return;}this.busy=true;this.sound();Tween.stopAllByTarget(this.guide);const [x,y]=MISSIONS[i].map;tween(this.guide).to(.65,{position:new Vec3(x-65,-(y+35),0)},{easing:'quadInOut'}).call(()=>{this.busy=false;this.startMission(i);}).start();}
  private shell(title:string,subtitle:string){
    this.close();this.screen='modal';
    const n=panel(this.root,0,0,1440,810,'#123D4D',0,'',155);n.name='Modal';n.on(Node.EventType.TOUCH_END,(e:any)=>e.propagationStopped=true);this.overlay=n;
    const box=panel(n,46,37,1348,736,C.cream,30);text(box,subtitle,30,18,1140,27,17,C.teal,true);
    text(box,title,30,53,1140,48,34,C.ink,true);button(box,'×',1262,18,59,59,()=>this.map(),C.blue,C.ink,34);return box;
  }
  private notice(title:string,body:string){const b=this.shell(title,'星宝的小提示');sprite(b,this.frames.guide,95,190,260,274);text(b,body,410,180,820,270,29,C.ink);button(b,'知道啦，回到小岛',452,565,460,72,()=>this.map(),C.gold,'#754A17',27);}
  private startMission(i:number){this.stage=i;this.puzzle=new MathPuzzle(i);this.digits='';this.message='';this.hintVisible=false;this.renderMission();}
  private renderMission(){
    const m=MISSIONS[this.stage],p=this.puzzle,b=this.shell(m.title,m.tag+'   ·   '+m.skill);this.screen='mission';
    text(b,m.story,30,110,1280,66,25,C.ink);
    const work=panel(b,26,194,824,435,'#EDF6EE',23,'#D7E7DC');
    text(work,'动手试一试',22,13,300,36,22,C.teal,true);
    if(this.stage===0)this.drawAddition(work);else if(this.stage===1)this.drawSubtraction(work);else this.drawGarden(work);
    button(b,'↶ 重新摆一摆',31,648,190,55,()=>{this.puzzle=new MathPuzzle(this.stage);this.digits='';this.message='';this.renderMission();},C.blue,C.ink,20);
    button(b,'星宝帮帮我',234,648,178,55,()=>{this.session.hint(this.stage);this.hintVisible=!this.hintVisible;this.renderMission();},C.mint,C.teal,20);
    text(b,this.message||(this.hintVisible?m.hint:p.ready?'摆好了！在右边写下你的答案吧。':'先完成操作，答案可以慢慢想。'),428,643,882,68,21,this.message?'#9A5436':C.muted,true);
    const right=panel(b,874,194,446,435,C.blue,23);
    text(right,m.goal,16,10,414,51,32,C.ink,true,'center');
    this.keypad(right,58,77,()=>this.renderMission());
    button(right,this.stage===0?'点亮小桥':this.stage===1?'完成配送':'让花园开花',33,358,380,58,()=>this.submit(),p.ready?C.gold:'#DCE6E5',p.ready?'#754A17':C.muted,25);
  }
  private rod(parent:Node,x:number,y:number,onClick?:()=>void){const r=panel(parent,x,y,38,162,'#4FA7A4',7);for(let j=1;j<10;j++)panel(r,3,j*16,32,1,'#B7E1D7',0);if(onClick)r.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;onClick();});}
  private unit(parent:Node,x:number,y:number,onClick?:()=>void){const n=panel(parent,x,y,40,40,'#FFD777',9,'#E9B351');const sn=node(n,'Star',0,0,40,40);this.star(sn,20,20,11,'#FFF5D7');if(onClick)n.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;onClick();});}
  private blocks(parent:Node,tens:number,ones:number,x:number,y:number,interactive=false){
    for(let i=0;i<tens;i++)this.rod(parent,x+i*49,y,interactive?()=>this.act(()=>this.puzzle.deliverTen(),'一捆已经放好了，接着送单颗吧。'):undefined);
    const ox=x+245;for(let i=0;i<ones;i++)this.unit(parent,ox+(i%5)*49,y+Math.floor(i/5)*51,interactive?()=>this.act(()=>this.puzzle.deliverOne(),'单颗已经够了，看看还需要一捆吗？'):undefined);
    text(parent,'十：每捆 10 颗',x,y+174,230,30,19,C.muted);text(parent,'一：每格 1 颗',ox,y+174,270,30,19,C.muted);
  }
  private act(fn:()=>boolean,fail='再看看任务需要什么吧。'){if(fn()){this.sound();this.message='';}else this.message=fail;this.renderMission();}
  private drawAddition(w:Node){
    const p=this.puzzle;
    if(!p.merged){
      panel(w,22,65,373,255,'#F9FCF6',18);panel(w,424,65,373,255,'#F9FCF6',18);
      text(w,'原来的 27 颗',42,76,325,40,25,C.ink,true,'center');text(w,'新找到的 15 颗',444,76,325,40,25,C.ink,true,'center');
      for(let j=0;j<2;j++)this.rod(w,48+j*48,131);for(let j=0;j<7;j++)this.unit(w,169+(j%4)*49,134+Math.floor(j/4)*53);
      this.rod(w,450,131);for(let j=0;j<5;j++)this.unit(w,526+(j%4)*49,134+Math.floor(j/4)*53);
      button(w,'把两份星光合起来',183,344,458,64,()=>this.act(()=>p.merge()),C.gold,'#754A17',25);
    }else{
      text(w,p.exchanged?'换好啦！数一数现在有几捆、几颗。':'合起来了！单颗满 10 颗，可以换成一捆。',22,57,780,43,24,C.ink,true,'center');
      this.blocks(w,p.tens,p.ones,128,119);
      button(w,p.exchanged?'✓ 10 个一，换成 1 个十':'圈起 10 颗 → 换成 1 捆',143,345,538,62,()=>this.act(()=>p.exchange(),'已经换好啦，数一数并输入答案。'),p.exchanged?C.mint:C.gold,p.exchanged?C.teal:'#754A17',25);
    }
  }
  private drawSubtraction(w:Node){
    const p=this.puzzle;
    text(w,'点星光放进小车  ·  小车需要 1 捆 + 8 颗',24,57,776,42,23,C.ink,true,'center');
    this.blocks(w,p.tens,p.ones,120,111,true);
    button(w,p.exchanged?'✓ 一捆变成了 10 颗':'拆一捆 → 变成 10 颗',28,345,395,62,()=>this.act(()=>p.split(),'已经拆过一捆，点单颗星光继续配送吧。'),p.exchanged?C.mint:C.gold,p.exchanged?C.teal:'#754A17',22);
    panel(w,442,331,352,87,'#D9EDE3',17);text(w,'小车里：'+p.deliveredTens+' 捆  '+p.deliveredOnes+' 颗',457,337,322,36,24,C.teal,true,'center');
    text(w,p.ready?'送齐啦！数数仓库剩多少。':'目标：1 捆 8 颗',457,376,322,30,19,C.muted,false,'center');
  }
  private drawGarden(w:Node){
    text(w,'点花盆种星星  ·  每盆种 3 颗',22,57,780,43,24,C.ink,true,'center');
    this.puzzle.pots.forEach((amount,i)=>{
      const n=panel(w,27+i*198,128,180,180,amount===3?'#D4ECDA':'#FFF7E5',24,amount===3?'#85B69B':'#E6CDA4');
      for(let j=0;j<amount;j++){const flower=node(n,'Seed',27+j*47,34,40,50);this.star(flower,20,23,19,amount===3?'#ECA946':'#EACD6C');panel(flower,18,43,4,30,'#79AF84',2);}
      panel(n,34,116,112,39,'#CAA77B',10);text(n,amount+' / 3',14,77,152,37,27,C.ink,true,'center');
      n.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;this.act(()=>this.puzzle.plant(i),'这一盆已经有 3 颗啦，去看看其他花盆。');});
      text(w,'第 '+(i+1)+' 盆',27+i*198,316,180,33,20,C.muted,false,'center');
    });
    text(w,this.puzzle.ready?'3 + 3 + 3 + 3  =  4 × 3':'让每一盆都有 3 颗，再数总数。',25,369,774,45,27,C.teal,true,'center');
  }
  private addDigit(k:string){if(this.digits.length>=2)return;this.digits=this.digits==='0'?k:this.digits+k;this.sound();this.keypadRefresh?.();}
  private keypad(parent:Node,x:number,y:number,refresh:()=>void){
    this.keypadRefresh=refresh;
    panel(parent,x,y,330,56,'#FFFFFF',15,'#CBDDDF');text(parent,this.digits||'?',x+10,y+3,310,50,35,this.digits?C.ink:'#96ABB0',true,'center');
    for(let n=1;n<=9;n++){const xx=x+((n-1)%3)*112,yy=y+70+Math.floor((n-1)/3)*51;button(parent,String(n),xx,yy,105,45,()=>this.addDigit(String(n)),'#FFFFFF',C.ink,26);}
    button(parent,'清空',x,y+223,105,45,()=>{this.digits='';refresh();},'#DFEBED',C.muted,19);
    button(parent,'0',x+112,y+223,105,45,()=>this.addDigit('0'),'#FFFFFF',C.ink,26);
    button(parent,'⌫',x+224,y+223,105,45,()=>{this.digits=this.digits.slice(0,-1);refresh();},'#DFEBED',C.muted,24);
  }
  private submit(){const r=this.session.submit(this.stage,this.digits===''?-1:Number(this.digits),this.puzzle.ready);if(!r.ok){this.message=r.reason;this.renderMission();return;}this.sound('success');this.success();}
  private success(){
    const m=MISSIONS[this.stage],b=this.shell('你点亮了 '+m.place+'！','任务完成  ·  一枚新的星章');this.screen='success';
    sprite(b,this.frames.guide,90,172,300,316);const badge=node(b,'Badge',570,144,180,170);this.star(badge,90,86,78,'#FFD579');
    text(b,m.reward,453,319,420,56,36,C.ink,true,'center');text(b,m.success,440,392,780,110,29,C.ink);
    text(b,'刚刚练习了：'+m.skill,441,521,780,45,22,C.teal,true);
    button(b,this.stage<2?'去下一站  →':'去传送门  →',665,621,416,69,()=>{const next=this.stage+1;this.map();if(next<3)this.travel(next);else this.startExam();},C.gold,'#754A17',28);
    button(b,'回到小岛',330,621,270,69,()=>this.map(),C.blue,C.ink,25);this.confetti(b);
  }
  private confetti(parent:Node){for(let i=0;i<24;i++){const n=node(parent,'Celebration',80+(i*97)%1180,150+(i*47)%300,12,12);this.star(n,6,6,6,i%2?'#4FA7A4':'#EAB756');const op=n.addComponent(UIOpacity);tween(n).by(1.7,{position:new Vec3((i%3-1)*38,-100,0)}).start();tween(op).delay(.8).to(.9,{opacity:0}).start();}}
  private startExam(){if(this.session.state.completed.length<3)return;const b=this.shell('星光传送门','独立挑战  ·  把本领用在新问题里');
    sprite(b,this.frames.guide,100,174,286,302);text(b,'三个新任务，试试自己完成！\n\n这里没有星光积木，也没有提示。\n准备一张草稿纸，慢慢想就好。',443,195,795,270,30,C.ink);
    text(b,'全部完成后一起看结果。答错了也能回岛练习。',442,500,805,52,22,C.muted);
    button(b,'我准备好了  →',448,616,480,72,()=>{this.examIndex=0;this.examAnswers=[];this.digits='';this.message='';this.renderExam();},C.gold,'#754A17',28);
  }
  private renderExam(){
    const idx=this.examIndex,q=TRANSFER[idx];const b=this.shell('独立完成这次任务','星光试炼  ·  第 '+(idx+1)+' / 3 站');this.examIndex=idx;this.screen='exam';
    const p=panel(b,30,149,798,455,'#EDF6EE',24);text(p,q.prompt,45,47,708,139,32,C.ink,true);
    text(p,q.expression,44,221,710,93,52,C.teal,true,'center');text(p,'可以用草稿纸，不用着急。',44,347,710,50,23,C.muted,false,'center');
    const r=panel(b,856,149,464,455,C.blue,24);text(r,'我的答案',25,8,414,43,26,C.ink,true,'center');this.keypad(r,67,65,()=>this.renderExam());
    button(r,idx<2?'下一站  →':'完成试炼  →',42,365,380,62,()=>{
      if(this.digits===''){this.message='先输入你的答案吧。';this.renderExam();return;}
      this.examAnswers[idx]=Number(this.digits);this.digits='';this.message='';
      if(idx<2){this.examIndex=idx+1;this.renderExam();}else{this.session.finishExam(this.examAnswers);this.sound('success');this.results();}
    },C.gold,'#754A17',26);
    text(b,this.message||'提示已收起 · 完成后查看解释 · 退出将重新开始本次试炼',35,641,1275,61,22,this.message?'#9A5436':C.muted,false,'center');
  }
  private results(){
    const ex=this.session.state.exam;if(!ex)return;const b=this.shell(ex.score===3?'星光传送门，开启！':'新的本领，正在长大','试炼完成  ·  '+ex.score+' / 3 个任务独立完成');this.screen='results';
    for(let i=0;i<3;i++){
      const q=TRANSFER[i],ok=ex.answers[i]===q.answer,p=panel(b,30,139+i*146,1288,130,ok?C.mint:'#FFF0DB',20);
      text(p,(ok?'✓  ':'↻  ')+q.skill,22,12,220,36,25,ok?C.teal:'#976127',true);
      text(p,'你的答案 '+ex.answers[i]+'   /   正确答案 '+q.answer,265,12,990,36,24,C.ink,true);
      text(p,q.explanation,25,58,1238,55,23,C.ink);
    }
    text(b,'这是一次练习记录，不代表已经长期掌握。过几天再来试试。',30,587,1280,35,20,C.muted,false,'center');
    button(b,'看看我的星章',220,645,400,60,()=>this.journal(),C.mint,C.teal,25);
    button(b,'回小岛继续探索',720,645,400,60,()=>this.map(),C.gold,'#754A17',25);if(ex.score===3)this.confetti(b);
  }
  private journal(){
    const b=this.shell('我的星光手册','学习记录  ·  本机自动保存');this.screen='journal';
    MISSIONS.forEach((m,i)=>{const done=this.session.state.completed.includes(m.id),p=panel(b,30+i*438,151,412,350,done?C.mint:C.blue,24);const sn=node(p,'Medal',145,31,120,120);this.star(sn,60,60,53,done?'#E9B858':'#BACBCC');text(p,m.reward,20,169,372,43,29,C.ink,true,'center');text(p,m.skill,20,223,372,39,23,C.muted,false,'center');text(p,done?'已完成'+(this.session.state.hints.includes(m.id)?' · 用过提示':' · 未使用提示'):'等待你来点亮',20,280,372,40,20,done?C.teal:C.muted,false,'center');});
    const ex=this.session.state.exam;text(b,ex?'最近试炼：'+ex.score+' / 3 题独立完成':'完成三站后，去传送门试试独立挑战。',40,538,1268,50,28,C.ink,true,'center');
    button(b,ex?'查看试炼解释':'回到小岛',455,628,440,65,()=>ex?this.results():this.map(),C.gold,'#754A17',26);
  }
  private settings(){const b=this.shell('冒险设置','星屿学园 · 小学二年级数学 · v0.1');
    text(b,'存档保存在当前设备和浏览器中。\n完成关卡后自动保存，刷新后可继续。\n当前操作盘与未完成的试炼不保存。',90,165,1160,180,29,C.ink);
    button(b,this.session.state.sound?'关闭音效':'开启音效',90,399,470,68,()=>{this.session.state.sound=!this.session.state.sound;this.session.save();this.settings();},C.mint,C.teal,25);
    button(b,'重新开始这座岛',90,499,470,68,()=>this.resetConfirm(),C.blue,C.ink,25);
    text(b,'原创教学原型 · 不计时，不扣体力\n建议横屏游玩，电脑上也可使用数字键输入。',630,399,610,170,25,C.muted);
  }
  private resetConfirm(){const b=this.shell('要重新开始吗？','这会清除本机的星章和试炼记录');text(b,'你将从第一座小桥重新开始。\n如果只是想再练习，可以返回地图点击已完成的地点。',125,211,1100,180,30,C.ink,false,'center');button(b,'保留记录，返回',227,516,400,72,()=>this.map(),C.gold,'#754A17',27);button(b,'确认重新开始',721,516,400,72,()=>{this.session.reset();this.map();},C.blue,C.ink,27);}
}
