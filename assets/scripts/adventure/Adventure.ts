import {openPicture} from './PictureBridge';
import {PlayLabView} from './PlayLabView';
import {GIFTS} from './PlayLab';
import {learningWorld} from './SubjectWorlds';
import {ExamView} from '../exam/ExamView';
import {loadContent,refreshContent,isContentPreview} from './ContentRuntime';
import {starMonster,runeDelivery,usesRunes} from './BattleView';
import {gradeWorld,GRADE_WORLDS} from './GradeWorlds';
import {journeyMap} from './JourneyMap';
import {learningRoute,hasLearningRoute,routeUnlocked,routeNext,ROUTE_PAGE_SIZE} from './LearningRoute';
import {mathWorkspace} from './MathWorkspace';
import {accountStorage} from '../platform/AccountStorage';
import {Node,ImageAsset,Texture2D,SpriteFrame,resources,AudioSource,AudioClip,view,ResolutionPolicy,sys,tween,Vec3,Tween,UIOpacity,Graphics,Label,Sprite} from 'cc';
import {node,panel,text,button,sprite,C,color} from '../ui/Kit';
import {CATALOG,chapters,Chapter,Level} from './Catalog';
import {Progress} from './Progress';
import {Puzzle} from './Puzzle';
import {SUBJECTS,subjectInfo,bandLabel} from './Subjects';
import {voiceKey} from './AudioKey';
import {SoundBank} from './SoundBank';
import {Companion} from './Companion';
import {Guardian3D} from './Guardian3D';
import {guardian,fireflies,burst} from './WorldMotion';
export class Adventure {
 private examView:ExamView;
 private companion:Companion;
 private closePicture:(()=>void)|null=null;
 root:Node; frames:Record<string,SpriteFrame>={}; clips:Record<string,AudioClip>={}; audio:AudioSource;voiceAudio:AudioSource;sounds:SoundBank;
 private battleTimer:ReturnType<typeof setTimeout>|null=null;
 private battleResume:(()=>void)|null=null;
 libraryPage=0;lastBattlePoints=0;lastBattleLevelUp=false;
 private playFeedback:Label|null=null;
 progress:Progress;screen='loading';levelIndex=0;puzzle:Puzzle;message='';hint=false;hintStep=0;voiceToken=0;locked=false;
 constructor(private host:Node,private legacy:()=>void){}
 get chapter(){return chapters(this.progress.subject,this.progress.grade)[this.progress.chapter];}
 async start(){
  view.setDesignResolutionSize(1440,810,ResolutionPolicy.SHOW_ALL);
  this.root=node(this.host,'AdventureRoot',-720,-405,1440,810);this.audio=this.host.addComponent(AudioSource);this.voiceAudio=this.host.addComponent(AudioSource);this.sounds=new SoundBank(this.audio,this.voiceAudio,true);
  panel(this.root,0,0,1440,810,'#E5F5F2',0);text(this.root,'星屿学园 · 小岛正在醒来',300,340,840,80,36,C.ink,true,'center');
  const loading=(n:number,label:string)=>{if(typeof window!=='undefined')(window as any).starisleLoading?.(n,label);};
  try{await loadContent();}catch{this.clear();text(this.root,'草稿读取失败，请先登录后台后重新打开试玩。',180,300,1080,120,32,C.ink,true,'center');if(typeof window!=='undefined')window.dispatchEvent(new Event('starisle:world-ready'));return;}
  this.progress=new Progress(accountStorage());this.sounds.setEnabled(this.progress.sound);if(typeof window!=='undefined')(window as any).starisleLearningSummary=()=>({level:this.progress.heroLevel,experience:this.progress.levelExperience,points:this.progress.points,done:this.progress.done.length,medals:this.progress.medalCount});
  let loaded=0;const total=10+GRADE_WORLDS.length;loading(4,'正在铺开浮岛地图…');
  await Promise.all(['exam-medal','exam-sanctuary','island','garden','english','guide','airship','planet','journey-garden','journey-planets',...GRADE_WORLDS.map(w=>w.key)].map(k=>new Promise<void>(resolve=>resources.load('art/'+k,ImageAsset,(e,img)=>{if(!e){const t=new Texture2D();t.image=img;const f=new SpriteFrame();f.texture=t;this.frames[k]=f;}else console.error(e);loaded++;loading(4+loaded/total*71,'正在点亮浮岛 · '+loaded+'/'+total);resolve();}))));
  ['tap','success','plant','oops','travel'].forEach(k=>resources.load('audio/'+k,AudioClip,(e,c)=>{if(!e)this.clips[k]=c;}));
  loading(78,'星宝正在整理探险装备…');
  await Guardian3D.preload().catch(error=>console.error('星宝模型加载失败，暂用角色原画。',error));
  loading(90,'正在唤醒小岛的声音…');
  void this.sounds.preload(['tap','success','plant','oops','travel','jump','arrival','sparkle','reward'].map(k=>'audio/'+k));loading(96,'正在打开冒险地图…');this.companion=new Companion(this.sounds,()=>({screen:this.screen,key:this.screen==='play'?this.puzzle?.level.id:String(this.progress.grade)+this.progress.subject,valid:this.root?.isValid,done:this.progress.done.length,levelUp:this.lastBattleLevelUp,listening:this.puzzle?.level.kind==='listen'&&this.screen==='play'}),()=>{if(this.screen==='play'){this.hint=true;this.hintStep=0;this.play();}});this.map();
  if(isContentPreview()){const id=new URLSearchParams(window.location.search).get('level');const c=CATALOG.find(c=>c.levels.some(l=>l.id===id));if(c){this.progress.subject=c.subject;this.progress.grade=c.grade;this.progress.chapter=chapters(c.subject,c.grade).indexOf(c);this.startLevel(c.levels.findIndex(l=>l.id===id),false);}}
  if(typeof window!=='undefined'){window.dispatchEvent(new Event('starisle:world-ready'));setInterval(()=>{if(this.root?.isValid&&this.screen==='map')void this.checkContent();},30000);}
 }
 sound(k='tap'){if(this.progress.sound)void this.sounds.play('audio/'+k,false,k==='tap'?.72:.9);}
 speak(value:string){this.companion?.dismiss();if(!this.progress.sound){this.message='声音已关闭，点右上角「声音」开启。';if(this.screen==='play')this.play();return;}void this.sounds.play('voice/'+voiceKey(value),true,.95);}
 clear(){if(this.closePicture){this.closePicture();this.closePicture=null;}if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('starisle:game-screen',{detail:'transition'}));this.examView?.stop();if(this.battleTimer!==null){clearTimeout(this.battleTimer);this.battleTimer=null;}if(this.battleResume&&typeof document!=='undefined'){document.removeEventListener('visibilitychange',this.battleResume);this.battleResume=null;}this.playFeedback=null;this.voiceToken++;if(!this.companion?.speaking)this.sounds?.stopVoice();const stop=(n:Node)=>{Tween.stopAllByTarget(n);const o=n.getComponent(UIOpacity);if(o)Tween.stopAllByTarget(o);n.children.forEach(stop);};for(const child of [...this.root.children]){stop(child);child.removeFromParent();child.destroy();}}
 private worldLoads:Record<string,Promise<SpriteFrame|null>>={};
 private loadWorld(key:string):Promise<SpriteFrame|null>{
  if(this.frames[key])return Promise.resolve(this.frames[key]);
  if(!this.worldLoads[key])this.worldLoads[key]=new Promise(resolve=>resources.load('art/'+key,ImageAsset,(error,img)=>{
   delete this.worldLoads[key];
   if(error){console.warn('World art unavailable',key);resolve(null);return;}
   const texture=new Texture2D();texture.image=img;const frame=new SpriteFrame();frame.texture=texture;this.frames[key]=frame;resolve(frame);
  }));
  return this.worldLoads[key];
 }
 art(){
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('starisle:game-screen',{detail:this.screen}));
  const world=learningWorld(this.progress.subject,this.progress.grade),f=this.frames[world.key]||this.frames[gradeWorld(this.progress.grade).key]||this.frames.island;
  if(f){
   const bg=sprite(this.root,f,0,0,1440,810);bg.name='World:'+world.key;
   if(!this.frames[world.key])void this.loadWorld(world.key).then(frame=>{
    // A destroyed screen or a later subject selection must never receive stale art.
    if(!frame||!bg.isValid||bg.parent!==this.root||learningWorld(this.progress.subject,this.progress.grade).key!==world.key)return;
    bg.getComponent(Sprite)!.spriteFrame=frame;
   });
  }else panel(this.root,0,0,1440,810,'#BDE5E1',0);
  if(this.screen==='map'||this.screen==='reward')fireflies(this.root);
 }

 subjectPage=0;
 subjectDrawer(){
  this.mathMap();this.screen='directory';
  const shade=panel(this.root,0,0,1440,810,'#153C50',0,'',65);shade.name='DirectoryShade';shade.on(Node.EventType.TOUCH_END,()=>this.map());
  const drawer=panel(this.root,1060,100,355,690,'#FFF8E9',30,'#FFFFFF',253);drawer.name='SubjectDirectory';drawer.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;});
  text(drawer,'探索目录',25,15,235,40,27,'#805A39',true);this.btn(drawer,'×',295,16,40,40,()=>this.map(),C.cream,'#805A39',25);
  this.btn(drawer,'幼儿园',22,69,96,38,()=>this.openPlayground('kindergarten'),C.mint,'#805A39',16);
  for(let g=1;g<=6;g++)this.btn(drawer,g+'年级',22+(g%3)*104,69+Math.floor(g/3)*43,96,38,()=>{this.progress.grade=g;this.progress.chapter=0;this.routePage=-1;this.routeFocus=-1;this.progress.save();this.subjectDrawer();},g===this.progress.grade?C.gold:'#F0EADD','#805A39',17);
  this.btn(drawer,'游乐实验室 · 新玩法',126,155,200,38,()=>this.openPlayground('sling'),C.mint,'#805A39',16);
  text(drawer,learningWorld(this.progress.subject,this.progress.grade).name+' · 选择学科即出发',24,205,308,26,15,C.muted);
  const subjectPages=Math.max(1,Math.ceil(SUBJECTS.length/9));this.subjectPage=Math.max(0,Math.min(this.subjectPage,subjectPages-1));
  SUBJECTS.slice(this.subjectPage*9,this.subjectPage*9+9).forEach((s,i)=>this.btn(drawer,(s.id===this.progress.subject?'✦ ':'')+s.name+'  ›',23,242+i*34,309,31,()=>{this.progress.subject=s.id;this.progress.chapter=0;this.routePage=-1;this.routeFocus=-1;this.progress.save();this.map();},s.id===this.progress.subject?'#FFE2A3':'#FFFDF6','#805A39',18));
  if(subjectPages>1){this.btn(drawer,'‹',23,559,60,38,()=>{this.subjectPage=(this.subjectPage+subjectPages-1)%subjectPages;this.subjectDrawer();},C.blue,C.teal,23);text(drawer,`${this.subjectPage+1} / ${subjectPages}`,97,559,160,38,18,C.teal,true,'center');this.btn(drawer,'›',272,559,60,38,()=>{this.subjectPage=(this.subjectPage+1)%subjectPages;this.subjectDrawer();},C.blue,C.teal,23);}
  this.btn(drawer,'查看章节与学习进度',23,635,309,35,()=>this.library(),C.blue,C.teal,17);
 }

 openPlayground(mode:'kindergarten'|'sling'){this.map();if(typeof window!=='undefined')(window as any).starisleArcade?.open(mode);}

 btn(p:Node,s:string,x:number,y:number,w:number,h:number,f:()=>void,fill=C.cream,ink=C.ink,size=22){const b=button(p,s,x,y,w,h,()=>{this.sound();f();},fill,ink,size);const g=b.getComponent(Graphics);g.strokeColor=color(fill===C.gold?'#E9B75F':'#FFFFFF',200);g.lineWidth=2;g.roundRect(3,-h+3,w-6,h-6,Math.min(20,h/2-3));g.stroke();return b;}
 title(){if(typeof window!=='undefined'&&(window as any).starisleProfileUI)return;this.btn(this.root,'个人中心',26,28,190,54,()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event('starisle:account'));},C.cream,C.teal,20);}
 private audioReturn='map';
 soundButton(){this.btn(this.root,this.progress.sound?'♪ 声音':'♪ 已静音',1260,28,150,54,()=>{this.audioReturn=this.screen;this.audioSettings();},C.cream,C.teal,18);}
 audioSettings(){this.clear();this.screen='audio';this.art();panel(this.root,0,0,1440,810,'#173E50',0,'',120);const b=panel(this.root,215,120,1010,570,C.cream,30);
  text(b,'听见小岛的声音',40,28,930,60,36,C.ink,true,'center');
  const status=text(b,this.progress.sound?'声音已开启 · 点一下，分别试听':'声音已关闭 · 先开启声音再试听',40,105,930,52,24,C.teal,true,'center');
  const test=(path:string,voice:boolean)=>{this.sounds.setEnabled(true);this.progress.sound=true;this.progress.save();status.getComponent(Label).string='正在试听…';void this.sounds.play(path,voice,.95).then(ok=>{if(status.isValid)status.getComponent(Label).string=ok?'已播放 · 如果没有听见，请检查设备音量或网页静音':'请再点一次试听，允许浏览器开启声音';});};
  this.btn(b,'♪ 按钮音效',50,206,280,90,()=>test('audio/success',false),C.gold,'#754A17',26);
  this.btn(b,'♪ 人声朗读',365,206,280,90,()=>test('voice/'+voiceKey('帮星宝把一句话排好'),true),C.mint,C.teal,26);
  this.btn(b,'♪ 音乐琴音',680,206,280,90,()=>test('voice/tone_up',true),C.blue,C.ink,26);
  this.btn(b,this.progress.sound?'关闭全部声音':'开启全部声音',50,344,440,62,()=>{this.progress.sound=!this.progress.sound;this.progress.save();this.sounds.setEnabled(this.progress.sound);this.audioSettings();},C.blue,C.ink,24);
  this.btn(b,this.sounds.musicEnabled?'♫ 配乐：开':'♫ 配乐：关',520,344,440,62,()=>{this.sounds.setMusicEnabled(!this.sounds.musicEnabled);this.audioSettings();},C.mint,C.teal,24);
  text(b,'背景音乐音量',50,414,220,33,20,C.muted,true);
  [[.2,'轻柔'],[.4,'适中'],[.65,'明亮']].forEach(([value,label],i)=>this.btn(b,(Math.abs(this.sounds.musicVolume-Number(value))<.001?'✓ ':'')+label,280+i*225,414,205,34,()=>{this.sounds.setMusicVolume(Number(value));this.audioSettings();},Math.abs(this.sounds.musicVolume-Number(value))<.001?C.gold:C.blue,C.ink,19));
  this.btn(b,'返回游戏 →',295,456,420,70,()=>{if(this.audioReturn==='play')this.play();else if(this.audioReturn==='library')this.library();else this.map();},C.gold,'#754A17',26);
 }
 mascot(x:number,y:number,size=150){if(this.frames.guide)guardian(this.root,this.frames.guide,x,y,size,()=>{this.sound('jump');this.companion?.say('hello',true);});}
 map(){if(hasLearningRoute(this.progress.subject)){this.mathMap();return;}this.clear();this.screen='map';this.locked=false;this.art();this.title();this.soundButton();const c=this.chapter,p=this.progress,done=p.count(c.id),list=chapters(p.subject,p.grade);
  this.btn(this.root,'⌂  换学科 / 年级',340,29,240,54,()=>this.library(),C.cream,C.teal,20);
  panel(this.root,600,29,356,54,C.cream,25,'',245);text(this.root,`${subjectInfo(p.subject).name} · ${p.grade}年级${p.subject==='english'&&p.grade<3?'启蒙':''} · 第 ${p.chapter+1} 章`,612,31,332,50,20,C.ink,true,'center');
  this.btn(this.root,`★ ${p.done.length} · 勋章 ${p.medalCount}`,1008,29,232,54,()=>this.journal(),C.cream,C.teal,20);
  this.btn(this.root,'✦ 期末试炼',1050,95,230,50,()=>this.examLobby(),C.gold,'#754A17',22);
  const info=panel(this.root,38,128,370,149,C.cream,25,'',246);text(info,`CHAPTER 0${p.chapter+1}`,24,15,320,25,14,C.teal,true);text(info,c.title,24,47,320,46,33,C.ink,true);text(info,c.topic+'  ·  '+done+'/3',24,102,320,28,19,C.muted);
  const positions=[[446,386],[739,300],[1030,411]];
  const path=node(this.root,'IslandPath',0,0,1440,810);const g=path.addComponent(Graphics);g.strokeColor=color('#FFF3C8',210);g.lineWidth=8;g.moveTo(525,-424);g.bezierCurveTo(670,-460,650,-250,818,-338);g.bezierCurveTo(920,-365,960,-470,1109,-449);g.stroke();
  c.levels.forEach((l,i)=>{const [x,y]=positions[i],ok=p.done.includes(l.id);this.btn(this.root,ok?'✓':String(i+1),x,y,108,108,()=>this.travelTo(i),ok?'#D8F3DD':C.gold,ok?C.teal:'#825424',40);const label=panel(this.root,x-42,y+119,192,70,C.cream,20,'',245);text(label,l.stage?({warmup:'先试一试',practice:'独立运用',challenge:'挑战任务'}[l.stage]):l.title,8,4,176,32,20,C.ink,true,'center');text(label,ok?'已点亮 · 再玩一次':'点一下开始',8,38,176,23,14,C.muted,false,'center');});
  for(let i=0;i<done;i++){this.star(this.root,620+i*85,580,22,'#FFE39A');}
  this.mascot(250,444,180);const speech=panel(this.root,40,635,380,94,C.cream,23,'',245);text(speech,done===c.levels.length?'这一章点亮啦！继续探索，收集年级勋章。':'点我跳一跳，左右拖动看看我的背面！',20,10,340,70,23,C.ink,true);
  const next=c.levels.findIndex(l=>!p.done.includes(l.id));this.btn(this.root,p.gradeStatus().complete&&p.grade<6?`进入 ${p.grade+1} 年级  →`:done===c.levels.length&&p.nextUnfinished()?'继续探索  →':done===c.levels.length?'再玩一次  →':'开始冒险  →',520,696,400,77,()=>{if(p.gradeStatus().complete&&p.grade<6){p.advanceGrade();this.sound('travel');this.map();}else if(done===c.levels.length){const pending=p.nextUnfinished();if(pending){p.chapter=pending.chapter;p.save();this.map();}else this.travelTo(0);}else this.travelTo(next<0?0:next);},C.gold,'#754A17',28);
  this.btn(this.root,'章节地图',1030,701,176,62,()=>this.library(),C.cream,C.teal,22);
  this.btn(this.root,'勋章手册',1222,701,180,62,()=>this.journal(),C.cream,C.teal,22);
  if(p.failed)text(this.root,'本机存档暂不可用，请保持页面打开。',470,779,600,25,16,'#8F362A',true,'center');
 }

 routePage=-1;routeFocus=-1;
 async checkContent(){if(await refreshContent(()=>this.screen==='map')){this.progress=new Progress(accountStorage());this.routePage=-1;this.routeFocus=-1;this.routeMessage='新的知识关卡已上线';this.map();}}
 mathMap(){
  this.clear();this.screen='map';this.locked=false;this.art();
  const p=this.progress,route=learningRoute(p.subject,p.grade),next=routeNext(route,p.done),pages=Math.max(1,Math.ceil(route.length/ROUTE_PAGE_SIZE));
  if(this.routePage<0)this.routePage=Math.floor(Math.max(0,next)/ROUTE_PAGE_SIZE);this.routePage=Math.max(0,Math.min(this.routePage,pages-1));
  journeyMap({root:this.root,route,done:p.done,grade:p.grade,subjectId:p.subject,subject:subjectInfo(p.subject).name+(p.subject==='english'&&p.grade<3?'启蒙':''),page:this.routePage,next,focus:this.routeFocus,medals:p.medalCount,points:p.points,heroLevel:p.heroLevel,message:this.routeMessage,btn:this.btn.bind(this),
   open:at=>this.enterRoute(at),preview:at=>{this.routeFocus=at;this.routeMessage='先点亮前面的路标，再来这里探索。';this.mathMap();},
   turn:delta=>{this.routePage+=delta;this.routeFocus=-1;this.mathMap();},
   resume:()=>{if(next<0){if(p.advanceGrade()){this.routePage=-1;this.routeFocus=-1;this.map();}else this.library();}else{this.routePage=Math.floor(next/ROUTE_PAGE_SIZE);this.routeFocus=next;this.mathMap();this.enterRoute(next);}},
   library:()=>this.subjectDrawer(),journal:()=>this.journal(),audio:()=>{this.audioReturn=this.screen;this.audioSettings();},account:()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event('starisle:account'));},mascot:this.mascot.bind(this)});
  if(!route.length)text(this.root,'这片星海正在准备新关卡，先去其他学科探索吧。',280,350,880,100,28,C.ink,true,'center');
  void this.checkContent();
  this.btn(this.root,'期末试炼 ›',1002,717,278,64,()=>this.examLobby(),C.cream,'#754A17',22);
  const gift=GIFTS.find(g=>g.id===p.equippedGift);if(gift)text(this.root,gift.symbol+' '+gift.name,32,646,300,30,19,'#FFFFFF',true);
  this.routeMessage='';if(p.failed)text(this.root,'本机存档暂不可用，请保持页面打开。',32,775,302,27,14,'#8F362A',true);
 }
 examLobby(){this.screen='exam';this.examView=new ExamView(this);this.examView.lobby();}
 routeMessage='';
 enterRoute(at:number){
  if(this.locked)return;const route=learningRoute(this.progress.subject,this.progress.grade),stop=route[at];if(!stop||!routeUnlocked(route,this.progress.done,at))return;
  this.locked=true;this.progress.chapter=stop.chapter;this.progress.save();this.routeFocus=at;this.sound('travel');
  const mark=this.root.children.find(n=>n.name==='RouteStop:'+stop.task.id);const actor=this.root.children.find(n=>n.name==='Guardian');if(mark&&actor){Tween.stopAllByTarget(actor);tween(mark).to(.25,{scale:new Vec3(1.12,1.12,1)}).to(.25,{scale:new Vec3(1,1,1)}).start();tween(actor).to(.55,{position:new Vec3(mark.position.x-50,mark.position.y+70,0)},{easing:'quadInOut'}).call(()=>{this.sound('arrival');this.startLevel(stop.level,false);}).start();}else this.startLevel(stop.level,false);
 }

 chapterChoices(){const list=chapters(this.progress.subject,this.progress.grade);return hasLearningRoute(this.progress.subject)?list.slice().sort((a,b)=>(a.curriculum?.order??100+list.indexOf(a))-(b.curriculum?.order??100+list.indexOf(b))):list;}
 library(resetPage=true){if(resetPage)this.libraryPage=hasLearningRoute(this.progress.subject)&&!this.chapter?.curriculum?0:Math.floor(Math.max(0,this.chapterChoices().findIndex(c=>c.id===this.chapter?.id))/4);this.clear();this.screen='library';this.art();panel(this.root,0,0,1440,810,'#153C50',0,'',100);this.title();this.soundButton();this.btn(this.root,'返回小岛 →',1040,28,196,54,()=>this.map(),C.gold,'#754A17',21);
  const b=panel(this.root,35,121,1370,650,C.cream,30,'',249);
  text(b,'选一片你想探索的星海',30,20,840,54,33,C.ink,true);text(b,'换年级、换学科，星章都会为你保留',32,79,1050,32,19,C.muted);
  const subjectPages=Math.max(1,Math.ceil(SUBJECTS.length/9));this.subjectPage=Math.max(0,Math.min(this.subjectPage,subjectPages-1));
  SUBJECTS.slice(this.subjectPage*9,this.subjectPage*9+9).forEach((s,i)=>{const active=this.progress.subject===s.id;this.btn(b,s.name,30+i*120,125,111,56,()=>{this.progress.subject=s.id;this.progress.chapter=0;this.routePage=-1;this.routeFocus=-1;this.progress.save();this.library();},active?C.gold:C.blue,active?C.ink:C.muted,s.name.length>4?16:20);});
  if(subjectPages>1){this.btn(b,'‹',1120,125,80,56,()=>{this.subjectPage=(this.subjectPage+subjectPages-1)%subjectPages;this.library();},C.blue,C.teal);this.btn(b,'›',1210,125,80,56,()=>{this.subjectPage=(this.subjectPage+1)%subjectPages;this.library();},C.blue,C.teal);}
  this.btn(b,'幼儿园',30,196,145,52,()=>this.openPlayground('kindergarten'),C.mint,C.teal,20);
  for(let i=1;i<=6;i++)this.btn(b,i+' 年级',190+(i-1)*130,196,120,52,()=>{this.progress.grade=i;this.progress.chapter=0;this.routePage=-1;this.routeFocus=-1;this.progress.save();this.library();},this.progress.grade===i?C.gold:C.blue,C.ink,22);
  this.btn(b,'游乐实验室 · 新玩法',980,196,330,52,()=>this.openPlayground('sling'),C.mint,C.teal,21);
  const list=this.chapterChoices(),w=309;
  this.libraryPage=Math.max(0,Math.min(this.libraryPage,Math.ceil(list.length/4)-1));
  if(list.length>4){this.btn(b,'‹',1130,20,52,50,()=>{this.libraryPage=(this.libraryPage+Math.ceil(list.length/4)-1)%Math.ceil(list.length/4);this.library(false);},C.blue,C.teal,24);text(b,`${this.libraryPage+1} / ${Math.ceil(list.length/4)}`,1190,20,70,50,20,C.teal,true,'center');this.btn(b,'›',1270,20,52,50,()=>{this.libraryPage=(this.libraryPage+1)%Math.ceil(list.length/4);this.library(false);},C.blue,C.teal,24);}
  if(!list.length)text(b,'这个年级的关卡正在准备中，可选择其他年级或学科。',80,350,1200,70,25,C.muted,true,'center');
  list.slice(this.libraryPage*4,this.libraryPage*4+4).forEach((c,i)=>{const card=panel(b,29+i*333,269,w,270,'#F1F6F0',24,C.line);if(this.frames[c.art])sprite(card,this.frames[c.art],0,0,w,111);panel(card,12,12,76,34,C.cream,15);text(card,String(this.libraryPage*4+i+1).padStart(2,'0'),12,12,76,34,19,C.teal,true,'center');text(card,c.title,18,120,w-36,40,25,C.ink,true);text(card,c.topic,18,166,w-36,30,17,C.muted);this.btn(card,this.progress.chapterComplete(c.id)?'✓ 探索勋章 · 再玩 →':`${this.progress.count(c.id)}/${c.levels.length} 星章    去探索 →`,16,210,w-32,44,()=>{this.progress.chapter=chapters(this.progress.subject,this.progress.grade).findIndex(item=>item.id===c.id);this.progress.save();this.routeFocus=learningRoute(this.progress.subject,this.progress.grade).findIndex(s=>s.chapter===this.progress.chapter);this.routePage=Math.floor(Math.max(0,this.routeFocus)/ROUTE_PAGE_SIZE);this.map();},C.gold,'#754A17',19);});
  text(b,`${subjectInfo(this.progress.subject).name} · 本年级 ${list.reduce((n,c)=>n+c.levels.length,0)} 关 · 课程来源与教材对应以章节配置为准`,32,561,1260,35,18,C.muted);
  this.btn(b,'教材与进度说明',30,605,240,30,()=>this.journal(),C.blue,C.muted,17);
 }
 travelTo(index:number){if(hasLearningRoute(this.progress.subject)){const route=learningRoute(this.progress.subject,this.progress.grade),at=route.findIndex(s=>s.chapter===this.progress.chapter&&s.level===index);this.enterRoute(at);return;}if(this.locked)return;this.locked=true;this.sound('travel');const n=this.root.children.find(n=>n.name==='Guardian');const destinations=[[400,380],[690,294],[980,405]];const [x,y]=destinations[index];if(!n){this.startLevel(index);return;}Tween.stopAllByTarget(n);tween(n).to(.3,{position:new Vec3((n.position.x+x)/2,-y+65,0)},{easing:'quadOut'}).to(.3,{position:new Vec3(x,-y,0)},{easing:'quadIn'}).to(.13,{scale:new Vec3(1.07,.94,1)}).to(.13,{scale:new Vec3(1,1,1)}).call(()=>{this.sound('arrival');this.startLevel(index,false);}).start();}
 startLevel(index:number,departure=true){this.levelIndex=index;this.puzzle=new Puzzle(this.chapter.levels[index]);this.message='';this.hint=this.puzzle.level.stage==='warmup';this.hintStep=0;this.locked=false;if(departure)this.sound('travel');this.play();if(this.puzzle.level.kind==='listen'||this.puzzle.level.voice?.startsWith('tone_')||this.puzzle.level.voice?.startsWith('drum_'))this.speak(this.puzzle.level.voice);}
 play(){this.clear();this.screen='play';if(this.puzzle.level.kind==='picture'){this.art();this.companion?.dismiss();this.sounds.stopVoice();const attempt=this.puzzle;const soundWasEnabled=this.sounds.enabled;this.sounds.setEnabled(false);const closeFrame=openPicture(attempt.level,placements=>{if(this.puzzle!==attempt||this.locked)return false;attempt.picture=placements;if(!attempt.correct())return false;this.closePicture?.();this.closePicture=null;this.submit();return true;},()=>this.map(),this.progress.sound);this.closePicture=()=>{closeFrame();this.sounds.setEnabled(soundWasEnabled);};return;}this.art();panel(this.root,0,0,1440,810,'#1A4253',0,'',100);
  this.btn(this.root,'‹ 回小岛',30,25,170,56,()=>this.map(),C.cream,C.teal,22);this.soundButton();
  text(this.root,`${this.chapter.title}   ·   第 ${this.levelIndex+1} / ${this.chapter.levels.length} 站`,250,28,850,50,24,'#FFFFFF',true,'center');
  const l=this.puzzle.level;const b=panel(this.root,30,102,1380,665,C.cream,28,'',249);
  text(b,l.title+(l.stage?' · '+({warmup:'热身',practice:'运用',challenge:'挑战'}[l.stage]):''),30,13,1000,44,29,C.teal,true);text(b,l.goal,30,64,1310,70,31,C.ink,true);
  const w=panel(b,28,149,1013,403,'#EAF3EC',25);this.draw(w,l);if(l.voice&&l.kind!=='listen')this.btn(b,'♪ 听任务',1130,20,216,44,()=>this.speak(l.voice),C.blue,C.teal,20);
  const side=panel(b,1060,149,292,403,'#F4EDDB',25);side.name='BattlePanel';starMonster(side,this.chapter.levels.length-this.progress.count(this.chapter.id),this.chapter.levels.length);
  const reviewing=this.progress.done.includes(l.id);
  const encouragement=`星宝 Lv.${this.progress.heroLevel} · ${this.progress.points} 积分\n${reviewing?'复习挑战 · 不重复加分':'首次完成 +100分 / +30经验'}\n再完成 ${6-this.progress.levelExperience/30} 个新任务升级`;
  const tips=usesRunes(l)?['先读任务，比较三块符石。把合适的答案送进星光阵，再点「答好了，发射！」。']:(l.coachHints?.length?l.coachHints:[l.hint]);
  const caption=()=>!this.hint?'教我一下':this.hintStep<tips.length-1?'再给点提示':'收起提示';
  const hintText=text(side,this.hint?tips[this.hintStep]:encouragement,20,225,252,108,22,C.muted,false,'center').getComponent(Label);
  // A hint changes only its own text: keep the model pose, puzzle and narration alive.
  const hintButton=this.btn(side,caption(),39,340,214,46,()=>{
   if(!this.hint){this.hint=true;this.hintStep=0;}else if(this.hintStep<tips.length-1)this.hintStep++;else{this.hint=false;this.hintStep=0;}
   hintText.string=this.hint?tips[this.hintStep]:encouragement;
   hintButton.getComponentInChildren(Label).string=caption();hintButton.name='Button:'+caption();
  },C.cream,C.teal,20);
  this.btn(b,'↶ 重来',28,577,144,57,()=>this.startLevel(this.levelIndex),C.blue,C.muted,22);
  const feedback=text(b,this.message||this.microGuide(l),192,572,745,67,23,this.message?'#975C34':C.teal,true);feedback.name='PlayFeedback';this.playFeedback=feedback.getComponent(Label);
  this.btn(b,'✦ 答好了，发射！',1006,575,346,60,()=>this.submit(),C.gold,'#754A17',24);
 }
 microGuide(l:Level){if(usesRunes(l))return '把符石拖进星光阵；也可点符石，再点星光阵。';return l.kind==='number'?'看清问题与单位，点数字填写答案，答错可调整。': l.kind==='cargo'?'点能量块装船，再点船上的块可以取回。':l.kind==='groups'?'点花盆种星星，点「－」取回。':l.kind==='tiles'?(this.progress.subject==='art'?'点格子铺花砖，再点一次取回，图案由你设计。':'点格子种花，再点一次可以取回。'):l.kind==='sentence'?'按顺序点卡片，点已选卡片可以取回。':l.kind==='choice'?'点任务卡做选择，准备好了再出发。':'点「再听一次」，选好气球后送给朋友。';}
 draw(w:Node,l:Level){const p=this.puzzle;
  if(usesRunes(l)){runeDelivery(w,l,p,this.btn.bind(this),()=>{this.message='';this.sound('sparkle');this.play();});
  }else if(l.kind==='number'){mathWorkspace(w,l,p,key=>{const previous=p.input;if(key==='clear')p.input='';else if(key==='back'||key==='⌫')p.input=p.input.slice(0,-1);else if(key==='−')p.input=p.input.startsWith('-')?p.input.slice(1):'-'+p.input;else if(key==='.'&&!p.input.includes('.'))p.input=(p.input||'0')+'.';else if(/^\d$/.test(key)&&p.input.length<9)p.input+=key;if(p.input!==previous){this.message='';if(this.playFeedback?.isValid){this.playFeedback.string=this.microGuide(l);this.playFeedback.color=color(C.teal);}}},this.btn.bind(this));
  }else if(l.kind==='cargo'){
   if(this.frames.airship){const ship=sprite(w,this.frames.airship,712,0,270,180);tween(ship).by(1.7,{position:new Vec3(0,5)}).by(1.7,{position:new Vec3(0,-5)}).union().repeatForever().start();}text(w,'能量仓库',24,9,300,36,22,C.teal,true);l.units.forEach((v,i)=>this.btn(w,`${v/(l.scale||1)}`,26+i*185,60,160,83,()=>{if(!p.add(v))this.message='船舱装满了，先取回几块，试试更大的能量块。';else this.message='';this.play();},C.gold,'#754A17',32));
   text(w,l.maxBlocks?`组合挑战 · 最多 ${l.maxBlocks} 块 · 已用 ${p.cargo.length} 块`:'↓ 点上面的能量块，送进下面的船舱',26,152,940,32,19,l.maxBlocks&&p.cargo.length>l.maxBlocks?'#975C34':C.muted);
   panel(w,22,197,966,167,'#C6E6E2',25);text(w,'船舱',41,204,100,40,23,C.teal,true);text(w,`已装 ${p.value/(l.scale||1)}${l.scale===10?' 元':''}`,687,204,275,40,25,C.ink,true,'right');
   p.cargo.forEach((v,i)=>this.btn(w,String(v/(l.scale||1)),38+(i%18)*52,253+Math.floor(i/18)*51,46,44,()=>{p.remove(i);this.message='';this.play();},C.cream,C.ink,v>=1000?13:19));
  }else if(l.kind==='groups'){
   const total=text(w,`星星种子   ·   已种 ${p.pots.reduce((a,b)=>a+b,0)} 颗`,25,12,960,38,24,C.teal,true).getComponent(Label);
   const width=900/p.pots.length;
   p.pots.forEach((n,i)=>{
    const x=45+i*width,pot=panel(w,x,76,width-18,215,'#F9E7C9',22,'#E0C79D');pot.name='PlantPot:'+i;
    const potTitle=text(pot,'第 '+(i+1)+' 盆'+(n===9?' · 已满':''),8,10,width-34,30,18,C.muted,false,'center').getComponent(Label);
    const stars:Node[]=[];
    const addStar=(animate=false)=>{const j=stars.length,s=node(pot,'PlantStar',25+(j%3)*(width-58)/2,65+Math.floor(j/3)*37,24,24);this.star(s,0,0,12,'#E6AF39');stars.push(s);if(animate){s.setScale(.35,.35,1);tween(s).to(.18,{scale:new Vec3(1.18,1.18,1)}).to(.12,{scale:Vec3.ONE}).start();}};
    for(let j=0;j<n;j++)addStar();
    const count=text(pot,String(n),8,168,width-34,39,29,C.ink,true,'center').getComponent(Label);
    const refresh=()=>{potTitle.string='第 '+(i+1)+' 盆'+(p.pots[i]===9?' · 已满':'');count.string=String(p.pots[i]);total.string=`星星种子   ·   已种 ${p.pots.reduce((a,b)=>a+b,0)} 颗`;if(this.playFeedback?.isValid){this.playFeedback.string=this.message;this.playFeedback.color=color(C.teal);}};
    pot.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;if(p.plant(i,1)){addStar(true);this.sound('plant');this.message=`第 ${i+1} 盆种下 1 颗，现在有 ${p.pots[i]} 颗。`;}else this.message=`第 ${i+1} 盆已满，点「－」可以取回。`;refresh();});
    this.btn(w,'－',x+12,309,width-42,47,()=>{if(p.plant(i,-1)){const s=stars.pop();Tween.stopAllByTarget(s);s.destroy();this.message=`第 ${i+1} 盆取回 1 颗，还剩 ${p.pots[i]} 颗。`;}else this.message=`第 ${i+1} 盆还是空的，点花盆种星星。`;refresh();},C.cream,C.muted,24);
   });
  }else if(l.kind==='tiles'){
   const cols=l.cols,rows=Math.ceil(l.cells/cols),size=Math.min(76,280/rows),ox=(1013-cols*(size+9))/2;
   text(w,(this.progress.subject==='art'?'拼贴展板 · 已铺 ':'每格同样大 · 已种 ')+p.tiles.filter(Boolean).length+' / '+l.cells+' 格',24,8,965,38,23,C.teal,true,'center');
   p.tiles.forEach((on,i)=>{const x=ox+i%cols*(size+9),y=64+Math.floor(i/cols)*(size+9);const n=this.btn(w,on?'✦':'',x,y,size,size,()=>{p.toggle(i);this.sound('sparkle');this.message='';this.play();},on?C.gold:'#D1E9D8','#B47C2E',30);});
  }else if(l.kind==='sentence'){
   text(w,this.progress.subject==='english'?'收信人：小岛上的新朋友':this.progress.subject==='chinese'?'把散落的文字连成通往下一站的桥':'星宝的行动计划',25,8,700,35,21,C.teal,true);
   const words=l.words,order=p.wordOrder;const step=Math.min(this.progress.subject==='english'?145:290,920/words.length),ox=(1013-step*words.length)/2;
   panel(w,22,67,968,108,'#FFF9E9',19,'#E6D6B8');if(!p.selected.length)text(w,'点下面的卡片，从这里开始排列',40,101,930,40,22,C.muted,false,'center');
   p.selected.forEach((idx,i)=>this.btn(w,words[idx],ox+i*step,92,step-7,55,()=>{p.selected.splice(i,1);this.message='';this.play();},C.gold,'#754A17',words[idx].length>8?19:24));
   text(w,p.selected.length===words.length?'卡片已放齐 · 检查顺序，再点发射':this.progress.subject==='english'?'↓ 按顺序把词卡放进信封':'↓ 按顺序放好卡片',27,190,945,36,21,C.muted,false,'center');
   order.forEach((idx,i)=>{if(!p.selected.includes(idx))this.btn(w,words[idx],ox+i*step,245,step-7,66,()=>{p.word(idx);this.message='';this.play();},C.cream,C.ink,words[idx].length>8?19:24);});
   {text(w,`${this.progress.subject==='english'?'星光信封':this.progress.subject==='chinese'?'文字桥':'行动计划'} · 已放好 ${p.selected.length} / ${words.length} 张卡片`,27,335,945,40,22,C.teal,true,'center');for(let i=0;i<words.length;i++){const x=ox+i*step;panel(w,x,52,step-7,7,i<p.selected.length?C.gold:'#CADDD4',3);}}
  }else if(l.kind==='choice'){
   const reading=this.progress.subject!=='english'&&!!l.passage;
   if(l.passage){panel(w,24,8,965,reading?195:105,'#FFF9E9',19);text(w,l.passage,45,21,923,reading?165:78,reading?26:28,C.ink,!reading,reading?'left':'center');}else text(w,'帮星宝选择下一步',24,12,965,45,25,C.teal,true,'center');
   p.optionOrder.forEach((idx,i)=>{const x=38+i*326,on=p.choice===idx;const n=this.btn(w,l.options[idx],x,reading?222:l.passage?140:96,301,reading?122:l.passage?132:174,()=>{p.choice=idx;this.message='';this.play();},on?C.gold:C.cream,C.ink,26);if(l.colors){panel(n,118,19,64,24,l.colors[idx],12);}
    text(w,on?'✓ 已选择':'点一下选择',x,reading?352:292,301,reading?38:48,22,on?C.teal:C.muted,on,'center');});
   if(l.voice?.startsWith('tone_')||l.voice?.startsWith('drum_'))this.btn(w,'♪ 再听一次',363,345,286,46,()=>this.speak(l.voice),C.mint,C.teal,21);
  }else{
   this.btn(w,'♪ 再听一次',355,16,300,62,()=>this.speak(l.voice),C.cream,C.teal,26);
   p.optionOrder.forEach((idx,i)=>{const v=l.options[idx];const x=100+i*300,on=p.choice===idx;const b=node(w,'Balloon:'+v,x,113,220,185);const g=b.addComponent(Graphics);g.fillColor=color(l.colors?.[idx]||'#D9E9F6');g.ellipse(110,-86,93,86);g.fill();g.strokeColor=color(on?'#DAA33F':'#FFFFFF');g.lineWidth=on?6:3;g.ellipse(110,-86,93,86);g.stroke();g.moveTo(110,-170);g.lineTo(102,-184);g.lineTo(118,-184);g.close();g.fill();g.fillColor=color('#FFFFFF',120);g.ellipse(72,-48,13,21);g.fill();if(!l.colors)text(b,v,24,48,172,55,32,C.ink,true,'center');b.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;p.choice=idx;this.message='';this.sound();this.play();});if(['one','two','three'].includes(v)){const n=['one','two','three'].indexOf(v)+1;text(b,'',0,0,1,1);for(let k=0;k<n;k++)this.star(b,55+k*45,130,13,'#E7B14B');}panel(w,x+107,298,4,40,'#A8B9AD',2);text(w,on?'✓ 选好了':'点我送出',x,348,220,36,23,on?C.teal:C.muted,on,'center');});
  }
 }
 submit(){if(this.locked)return;const pending=usesRunes(this.puzzle.level)&&this.puzzle.pendingRune>=0?'新符石还没放入，点星光阵确认后再发射。':usesRunes(this.puzzle.level)&&this.puzzle.choice<0?'先把答案符石放进星光阵，再点发射。':this.puzzle.pendingGuide();if(pending){this.message=pending;if(this.playFeedback?.isValid){this.playFeedback.string=pending;this.playFeedback.color=color(C.teal);}return;}this.puzzle.attempts++;if(!this.puzzle.correct()){this.sound('oops');this.message=this.puzzle.feedback();if(this.puzzle.level.coachHints?.length&&this.puzzle.attempts>=2){this.hint=true;this.hintStep=Math.max(this.hintStep,Math.min(this.puzzle.attempts-2,this.puzzle.level.coachHints.length-1));}this.play();this.companion?.say('wrong');return;}this.locked=true;this.companion?.dismiss();const fresh=!this.progress.done.includes(this.puzzle.level.id),oldLevel=this.progress.heroLevel;this.progress.complete(this.puzzle.level.id);this.lastBattlePoints=fresh?100:0;this.lastBattleLevelUp=this.progress.heroLevel>oldLevel;
  // Animation frames can pause in background tabs. Completion is idempotent and also uses wall time.
  const deadline=Date.now()+1500;let settled=false;
  const finishBattle=()=>{if(settled)return;settled=true;if(typeof document==='undefined'||!document.hidden)this.sound('reward');this.reward(fresh&&this.progress.gradeStatus().complete&&this.progress.grade<6);};
  this.battleTimer=setTimeout(finishBattle,1500);
  if(typeof document!=='undefined'){this.battleResume=()=>{if(!document.hidden&&Date.now()>=deadline)finishBattle();};document.addEventListener('visibilitychange',this.battleResume);}
  const shield=panel(this.root,0,0,1440,810,'#FFFFFF',0,'',0);shield.name='AttackOverlay';shield.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;});
  const shot=panel(shield,650,510,65,65,C.gold,32,'#FFFFFF');text(shot,'✦',0,0,65,65,42,'#FFFFFF',true,'center');this.sound('travel');
  tween(shot).to(.45,{position:new Vec3(1200,-340,0),scale:new Vec3(.6,.6,1)},{easing:'quadIn'}).call(()=>{this.sound('success');for(const c of this.root.children){const side=c.children.find(n=>n.name==='BattlePanel');if(side){for(const child of [...side.children]){Tween.stopAllByTarget(child);child.destroy();}side.removeAllChildren();starMonster(side,this.chapter.levels.length-this.progress.count(this.chapter.id),this.chapter.levels.length,true);}}burst(shield,1230,340);text(shield,fresh?(this.progress.chapterComplete(this.chapter.id)?'净化成功！ +100积分':'破盾成功！ +100积分'):'练习成功！',920,480,400,65,34,'#FFFFFF',true,'center');}).delay(.65).call(finishBattle).start();}
 reward(autoAdvance=false){this.clear();this.screen='reward';this.art();panel(this.root,0,0,1440,810,'#173E50',0,'',120);const b=panel(this.root,220,115,1000,580,C.cream,32,'',250);b.setPosition(220,-139);tween(b).to(.25,{position:new Vec3(220,-115,0)},{easing:'backOut'}).start();
  this.medal(b,500,104,58);burst(this.root,720,222);this.mascot(1140,500,110);const gradeDone=this.progress.gradeStatus().complete,chapterDone=this.progress.chapterComplete(this.chapter.id);const badgeTitle=gradeDone?`${subjectInfo(this.progress.subject).name} · ${this.progress.grade}年级远航勋章`:chapterDone?(hasLearningRoute(this.progress.subject)?'阶段探索勋章 · ':'章节探索勋章 · ')+this.chapter.title:'修复成功，点亮一枚星章！';text(b,badgeTitle,40,188,920,55,32,C.ink,true,'center');text(b,this.puzzle.level.explanation,66,281,868,74,29,C.teal,true,'center');
  text(b,`${this.lastBattlePoints?'+100 积分 · +30 经验':'复习完成 · 积分不重复发放'}  |  星宝 Lv.${this.progress.heroLevel}${this.lastBattleLevelUp?' · 升级啦！':''}`,40,244,920,32,21,'#9B6E29',true,'center');
  const growth=panel(b,50,446,280,7,'#DFE8E2',5);growth.name='ExperienceTrack';if(this.progress.levelExperience>0)panel(growth,0,0,280*this.progress.levelExperience/180,7,'#77BFA5',5);
  text(b,`经验 ${this.progress.levelExperience}/180 · 再完成 ${6-this.progress.levelExperience/30} 个新任务升级`,35,407,310,35,15,C.muted,false,'center');
  const notice=text(b,this.progress.subjectComplete()?'六个年级全部完成！获得本科目星海纪念章。':gradeDone?'本年级期末试炼已解锁！可以检验你的学习成果了。':chapterDone?'这一章全部点亮！探索勋章已放入手册。':'每完成一章，获得一枚探索勋章。',70,370,860,37,22,C.muted,false,'center').getComponent(Label);
  this.btn(b,gradeDone&&this.progress.grade<6?'进入下一年级':'回小岛',115,457,270,68,()=>{if(gradeDone&&this.progress.grade<6){this.progress.advanceGrade();this.routePage=-1;this.routeFocus=-1;}this.map();},C.blue,C.ink,25);
  const next=this.progress.nextUnfinished(),canAdvance=gradeDone&&this.progress.grade<6;
  const continueJourney=()=>{this.locked=false;if(hasLearningRoute(this.progress.subject)&&!canAdvance&&next){const route=learningRoute(this.progress.subject,this.progress.grade),at=route.findIndex(s=>s.chapter===next.chapter&&s.level===next.level);this.routePage=Math.floor(at/ROUTE_PAGE_SIZE);this.routeFocus=at;this.map();this.enterRoute(at);return;}if(canAdvance){this.progress.advanceGrade();this.routePage=-1;this.routeFocus=-1;this.map();}else if(next){const same=this.progress.chapter===next.chapter;this.progress.chapter=next.chapter;this.progress.save();if(same)this.startLevel(next.level);else this.map();}else this.library();};
  this.btn(b,gradeDone?'已解锁 · 期末试炼 →':next?'继续下一站 →':'探索其他学科 →',425,457,460,68,gradeDone?()=>this.examLobby():continueJourney,C.gold,'#754A17',26);
  if(autoAdvance&&!gradeDone){let seconds=6;const updateNotice=()=>{notice.string=`${seconds} 秒后前往 ${this.progress.grade+1} 年级 · 也可留下复习`;};updateNotice();const countdown=tween(b);for(let i=0;i<6;i++)countdown.delay(1).call(()=>{seconds--;if(seconds>0)updateNotice();else continueJourney();});countdown.start();}
  if(this.puzzle.level.voice)this.btn(b,'♪ 听一听',380,411,240,36,()=>this.speak(this.puzzle.level.voice),C.mint,C.teal,18);
  for(let i=0;i<24;i++){const n=node(this.root,'Confetti',220+(i*137)%1000,100+(i*43)%400,15,15);this.star(n,7,7,7,i%2?'#F4CA67':'#86CFB6');tween(n).by(2.2,{position:new Vec3((i%3-1)*36,-180)}).start();const o=n.addComponent(UIOpacity);tween(o).delay(.8).to(1.4,{opacity:0}).start();}
 }
 star(parent:Node,x:number,y:number,r:number,fill:string){const n=node(parent,'Star',0,0,1,1),g=n.addComponent(Graphics);g.fillColor=color(fill);for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.46:r,xx=x+Math.cos(a)*rr,yy=-y+Math.sin(a)*rr;if(i===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.close();g.fill();}
 medal(parent:Node,x:number,y:number,r:number,earned=true){const n=node(parent,'Medal',x,y,r*2,r*2),g=n.addComponent(Graphics);g.fillColor=color(earned?'#D99043':'#B8C9C9');g.moveTo(-r*.65,-r*.55);g.lineTo(-r*.8,-r*1.4);g.lineTo(0,-r*1.05);g.lineTo(r*.8,-r*1.4);g.lineTo(r*.65,-r*.55);g.close();g.fill();g.fillColor=color(earned?'#FFE9A5':'#E0E9E6');g.circle(0,0,r);g.fill();g.strokeColor=color(earned?'#D8A342':'#A7BFBB');g.lineWidth=3;g.circle(0,0,r*.84);g.stroke();this.star(n,0,0,r*.56,earned?'#D69B30':'#A7BFBB');}
 journal(){this.clear();this.screen='journal';this.art();panel(this.root,0,0,1440,810,'#173E50',0,'',100);const b=panel(this.root,110,65,1220,680,C.cream,30);text(b,subjectInfo(this.progress.subject).name+' · 勋章手册',40,25,1100,60,36,C.ink,true);text(b,`星宝 Lv.${this.progress.heroLevel} · ${this.progress.points} 积分 · 经验 ${this.progress.levelExperience}/180 · ${this.progress.medalCount} 枚勋章`,42,95,1100,44,25,C.teal,true);
  for(let g=1;g<=6;g++){const status=this.progress.gradeStatus(this.progress.subject,g),earned=this.progress.hasGradeMedal(this.progress.subject,g),x=40+(g-1)%3*392,y=164+Math.floor((g-1)/3)*137;panel(b,x,y,370,113,C.blue,20);this.medal(b,x+48,y+43,26,earned);text(b,g+' 年级 · '+(earned?'已获远航勋章':'探索中'),x+90,y+7,263,35,21,C.ink,true);text(b,`${status.done}/${status.total} 任务 · ${status.chapters} 枚章节勋章`,x+90,y+42,263,31,18,C.teal);text(b,earned?'勋章永久保留 · 可回岛复习':'完成本年级全部任务获得勋章',x+90,y+77,263,25,15,C.muted);} 

  text(b,this.progress.subject==='math'?'数学每年级90站：12个教材主题阶段、72个新任务，加18个旧章巩固任务。\n人教社当前电子版主题选编；原创任务，不是教材原题或真实考试题。\n完成6站主题阶段获得勋章，完成本年级全部站点进入下一年级。': this.progress.subject==='english'?'英语每年级84站：12个主题阶段、72个新任务，加12个旧章巩固任务。\n一、二年级为启蒙；三至六年级按 PEP 电子版目录主题选编。\n原创听音、拼句和阅读练习；不代表完整教材、口语或考试覆盖。': this.progress.subject==='chinese'?'语文每年级42站：6个主题阶段、36个新任务，加6个旧任务巩固。\n依据统编语文能力方向创作；上、下册为游戏进阶分组，未逐课核对。\n识字、拼句、排序与阅读，暂不包含完整写字、作文或朗读评分。': '本科目每年级12站：6个新任务与6个旧任务，完成阶段获得勋章。\n按学段能力设计，上下册为游戏分组；部分旧任务共享样例。\n非逐课教材覆盖；体育、劳动等游戏任务不能替代线下实践。',42,457,1130,113,20,C.muted);
  this.btn(b,'回小岛',40,595,330,57,()=>this.map(),C.gold,'#754A17',23);this.btn(b,'选学科 / 年级',395,595,330,57,()=>this.library(),C.mint,C.teal,23);this.btn(b,'积分兑换 · '+this.progress.balance+' 可用',750,595,420,57,()=>new PlayLabView(this).shop(),C.blue,C.ink,21);
 }
}