import {icon,basket} from './icons.js';
import {SHOP,TIDY,HOMES,GARDEN,NAMES,LIFE,needed,expectedTarget} from './life.js';
import {ACTIVITIES,scene,homeArt,potArt} from './scenes.js';
import {KINDS,FEED,SORT,BUILD,createRound,accept} from './rules.js';
import {gardenAudio as audio} from '../audio.js';
import {createHero} from './hero.js';
const $=id=>document.getElementById(id),M=window.Matter;
let kind='feed',level=0,round=null,items=[],selected=null,drag=null,paused=false,screen='hub',demoAnimations=[],demoTimer=null,idleTimer=null,successTimer=null,voice=new Audio(),speaking=false,physics=[],engine=M.Engine.create(),last=0,accumulator=0,demoRepeats=0,completed=Object.fromEntries(KINDS.map(k=>[k,[]]));
let saveKey='starisle.kindergarten.guest.v1';
try{const id=parent!==window?parent.starisleAccount?.id:null;if(id)saveKey='starisle.account.'+id+'.kindergarten.v1';const saved=JSON.parse(localStorage.getItem(saveKey)||'null');if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const k of KINDS)if(Array.isArray(saved[k]))completed[k]=[...new Set(saved[k].filter(n=>Number.isInteger(n)&&n>=0&&n<3))];}catch{}
// Picture demonstrations remain usable without speech or a network connection.
voice.preload='auto';voice.volume=.9;voice.addEventListener('playing',()=>{speaking=true;$('companion').classList.add('speaking');});voice.addEventListener('ended',voiceEnded);voice.addEventListener('error',()=>{voiceEnded();$('voice-status').textContent='语音暂不可用，可以继续看小手演示；请检查设备声音或刷新。';});
function voiceEnded(){speaking=false;$('companion').classList.remove('speaking');}
function stopVoice(){voice.pause();voiceEnded();}
function speak(id){stopVoice();if(!audio.enabled||paused)return;voice.src='./assets/voice/'+id+'.mp3';voice.volume=Math.min(1,audio.volume*1.6);void voice.play().catch(()=>{voiceEnded();$('voice-status').textContent='设备暂未允许语音播放；点喇叭可重听，或先看小手演示。';});}
function status(text){$('status').textContent=text;}
function setupButton(id,name){$(id).innerHTML=icon(name);}
[['home','home'],['sound',audio.enabled?'speaker':'mute'],['pause','pause'],['show','hand'],['listen','speaker'],['reset','replay'],['next','arrow'],['resume','play'],['pause-symbol','pause']].forEach(([id,name])=>setupButton(id,name));
function renderHub(){
 $('hub-toys').innerHTML=Object.entries(ACTIVITIES).map(([id,a])=>`<button class="scene-card ${a.theme}" data-kind="${id}" aria-label="${a.name}"><span class="card-picture">${scene(id)}</span><span class="card-bottom"><span class="card-token">${icon(a.symbol)}</span><span class="card-progress" aria-label="已完成 ${completed[id].length} 关">${[0,1,2].map(i=>icon('star',completed[id].includes(i)?'earned':'unearned')).join('')}</span><span class="card-play">${icon('play')}</span></span></button>`).join('');
 $('hub-toys').querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>start(b.dataset.kind,0));
}
function stars(){const entries=screen==='hub'?Object.values(completed).map(v=>v.length===3):[0,1,2].map(i=>completed[kind].includes(i));$('stars').innerHTML=entries.map(done=>icon('star',done?'earned':'')).join('');$('stars').setAttribute('aria-label','已点亮 '+entries.filter(Boolean).length+' 颗星星');}
function stopDemo(){clearTimeout(demoTimer);for(const a of demoAnimations)a.cancel();demoAnimations=[];$('demonstration').hidden=true;}
function idle(){clearTimeout(idleTimer);if(screen==='play'&&!round?.done&&!paused&&demoRepeats<2)idleTimer=setTimeout(()=>{if(!drag&&!paused&&!round.done){demoRepeats++;showDemo(false);}},16000);}
function cancelDrag(){if(!drag)return;const current=drag;drag=null;current.ghost?.remove();current.item.el.style.opacity='';if(current.item.el.hasPointerCapture(current.pointerId))current.item.el.releasePointerCapture(current.pointerId);document.querySelectorAll('.target').forEach(t=>t.classList.remove('hot'));}
function cleanup(){cancelDrag();stopVoice();stopDemo();clearTimeout(idleTimer);clearTimeout(successTimer);if(drag?.ghost)drag.ghost.remove();drag=null;selected=null;physics=[];M.Composite.clear(engine.world,false);M.Engine.clear(engine);$('fx').replaceChildren();$('celebrate').hidden=true;}
function home(){cleanup();screen='hub';paused=false;audio.setPaused(false);document.body.dataset.screen='hub';$('hub').hidden=false;$('play').hidden=true;$('paused').hidden=true;setupButton('pause','pause');renderHub();stars();speak('welcome');}
function target(id,cls,html,label){const b=document.createElement('button');b.className='target '+cls;b.dataset.target=id;b.innerHTML=html;b.setAttribute('aria-label',label);b.onclick=()=>{if(selected)place(selected,id);else{audio.play('select');b.classList.add('hot');setTimeout(()=>b.classList.remove('hot'),350);}idle();};$('targets').append(b);return b;}
function piece(type,id){const b=document.createElement('button');b.className='piece';b.dataset.item=id;b.innerHTML=icon(type);b.setAttribute('aria-label',NAMES[type]||type);const item={type,id,el:b,used:false};items.push(item);$('tray').append(b);
 b.addEventListener('pointerdown',e=>{if(paused||round.done||item.used||drag)return;stopDemo();stopVoice();clearTimeout(idleTimer);const r=b.getBoundingClientRect();drag={item,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false,w:r.width,h:r.height};b.setPointerCapture(e.pointerId);});
 b.addEventListener('pointermove',e=>{if(!drag||drag.item!==item||drag.pointerId!==e.pointerId)return;drag.x=e.clientX;drag.y=e.clientY;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>9&&!drag.moved){drag.moved=true;drag.ghost=b.cloneNode(true);drag.ghost.removeAttribute('data-item');drag.ghost.removeAttribute('aria-label');drag.ghost.setAttribute('aria-hidden','true');drag.ghost.className='piece dragging';drag.ghost.style.width=drag.w+'px';drag.ghost.style.height=drag.h+'px';document.body.append(drag.ghost);b.style.opacity='.2';}if(drag.ghost){drag.ghost.style.left=(e.clientX-drag.w/2)+'px';drag.ghost.style.top=(e.clientY-drag.h/2)+'px';}const hit=hitTarget(e.clientX,e.clientY);document.querySelectorAll('.target').forEach(t=>t.classList.toggle('hot',t===hit));});
 b.addEventListener('pointerup',e=>{if(!drag||drag.item!==item||drag.pointerId!==e.pointerId)return;const wasMoved=drag.moved;drag.ghost?.remove();drag=null;b.style.opacity='';document.querySelectorAll('.target').forEach(t=>t.classList.remove('hot'));if(wasMoved){const hit=hitTarget(e.clientX,e.clientY);if(hit)place(item,hit.dataset.target);else wrong(item,false);}else choose(item);idle();});
 b.addEventListener('pointercancel',()=>{cancelDrag();idle();});
 b.addEventListener('lostpointercapture',()=>{if(drag?.item===item)cancelDrag();});
 b.addEventListener('click',e=>{if(e.detail===0)choose(item);});return item;
}
function hitTarget(x,y){return [...document.querySelectorAll('.target')].find(t=>{const r=t.getBoundingClientRect();return x>=r.left-8&&x<=r.right+8&&y>=r.top-8&&y<=r.bottom+8;});}
function choose(item){if(paused||round.done||item.used)return;stopDemo();if(kind==='shop'||kind==='garden'){place(item,kind==='shop'?'bag':'pot');return;}selected=item;items.forEach(i=>i.el.classList.toggle('selected',i===item));audio.play('select');document.querySelectorAll('.target').forEach(t=>t.classList.toggle('ready',kind!=='build'||t.dataset.target==='slot-'+round.placed.length));idle();}
function wrong(item,narrate=true){item.el.classList.remove('shake');void item.el.offsetWidth;item.el.classList.add('shake');audio.play('wrong');if(narrate)speak(kind==='shop'?'shop-try':kind==='garden'?'garden-try':'try');status('物品回到原处，可以再试');idle();}
function clearSelection(){selected=null;items.forEach(i=>i.el.classList.remove('selected'));document.querySelectorAll('.target').forEach(t=>t.classList.remove('ready','hot'));}
function place(item,id){if(paused||round.done||item.used)return;stopDemo();const result=accept(round,item,id);if(!result.ok){wrong(item);return;}item.used=true;item.el.classList.add('used');item.el.disabled=true;clearSelection();audio.play('collect');
 const t=document.querySelector('[data-target="'+id+'"]');if(kind==='feed'){const goals=$('goal').children;goals[result.count-1].classList.add('filled');t.classList.add('ready');setTimeout(()=>t.classList.remove('ready'),500);tumble(item.type,t);speak(['one','two','three','four','five'][result.count-1]);}
 else if(kind==='sort'){tumble(item.type,t);t.animate([{transform:'translateY(0)'},{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:350});}
 else if(kind==='build'){t.classList.add('filled');t.classList.remove('current');t.innerHTML=icon(item.type);const next=document.querySelector('[data-target="slot-'+result.count+'"]');next?.classList.add('current');next?.classList.remove('pending');t.animate([{scale:'.7'},{scale:'1.08'},{scale:'1'}],{duration:400});audio.play('place');}
 else if(kind==='shop'){
  const slot=[...$('goal').children].find(e=>e.dataset.type===item.type&&!e.classList.contains('filled'));slot?.classList.add('filled');
  const goods=document.createElement('span');goods.innerHTML=icon(item.type);t.querySelector('.bag-goods').append(goods);tumble(item.type,t);audio.play('place');
 }else if(kind==='tidy'){
  const goods=document.createElement('span');goods.innerHTML=icon(item.type);t.querySelector('.stored-items').append(goods);t.classList.add('settled');tumble(item.type,t);audio.play('place');
 }else if(kind==='garden'){
  t.innerHTML=potArt(result.count,level);t.dataset.stage=String(result.count);
  [...$('goal').children].forEach((e,i)=>{e.classList.toggle('filled',i<result.count);e.classList.toggle('current-step',i===result.count);});
  lifeEffect(item.type,t);if(!result.done)speak(result.count===1?'garden-seed':'garden-water');
 }
 updateGuide();
 status('放好了');if(result.done){clearTimeout(idleTimer);if(!completed[kind].includes(level))completed[kind].push(level);try{localStorage.setItem(saveKey,JSON.stringify(completed));}catch{$('save-note').textContent='当前设备不能保存，本次可以继续玩。';}stars();audio.play('win');successTimer=setTimeout(()=>{if(screen!=='play')return;celebrate();},kind==='feed'?1100:650);}else idle();
}
function showDemo(narrate=true){if(paused||screen!=='play'||round.done)return;stopDemo();clearSelection();const item=items.find(i=>!i.used&&(kind==='build'?i.type===BUILD[level][round.placed.length]:LIFE.includes(kind)?needed(round).includes(i.type):true));if(!item)return;const id=kind==='feed'?'bunny':kind==='sort'?item.type:LIFE.includes(kind)?expectedTarget(round,item.type):'slot-'+round.placed.length;const t=document.querySelector('[data-target="'+id+'"]');if(!t)return;
 if(narrate)speak(kind==='garden'?(round.placed.length===1?'garden-seed':round.placed.length===2?'garden-water':'garden'):kind);else if(ACTIVITIES[kind].hint)speak(ACTIVITIES[kind].hint);const board=$('board').getBoundingClientRect(),a=item.el.getBoundingClientRect(),b=t.getBoundingClientRect(),x=a.x-board.x+a.width/2-36,y=a.y-board.y+a.height/2-36,tx=b.x-board.x+b.width/2-36,ty=b.y-board.y+b.height/2-36;
 $('demo-item').innerHTML=icon(item.type);$('demo-hand').innerHTML=icon('hand');$('demonstration').hidden=false;const duration=2600;
 for(const [el,offset]of [[$('demo-item'),0],[$('demo-hand'),30]]){demoAnimations.push(el.animate([{transform:`translate(${x+offset}px,${y+offset}px)`,opacity:0},{transform:`translate(${x+offset}px,${y+offset}px)`,opacity:1,offset:.17},{transform:`translate(${tx+offset}px,${ty+offset}px)`,opacity:1,offset:.72},{transform:`translate(${tx+offset}px,${ty+offset}px)`,opacity:0}],{duration,easing:'ease-in-out',iterations:2}));}
 demoTimer=setTimeout(()=>{stopDemo();idle();},duration*2);status('小手正在演示：把玩具送到对应位置');
}
function start(k=kind,n=level){cleanup();kind=k;level=n;round=createRound(kind,level);screen='play';paused=false;audio.setPaused(false);demoRepeats=0;items=[];document.body.dataset.screen='play';document.body.dataset.kind=kind;$('hub').hidden=true;$('play').hidden=false;$('paused').hidden=true;setupButton('pause','pause');$('board').className=kind;$('scene-decor').innerHTML=scene(kind);$('scene-icon').innerHTML=icon(ACTIVITIES[kind].symbol);$('goal').replaceChildren();$('targets').replaceChildren();$('tray').replaceChildren();stars();
 if(kind==='feed'){for(let i=0;i<FEED[level];i++){const e=document.createElement('span');e.className='goal-fruit';e.innerHTML=icon('apple');$('goal').append(e);}target('bunny','bunny-target',icon('bunny')+'<span class="bowl"></span>','把苹果送给小兔子');for(let i=0;i<5;i++)piece('apple','apple-'+i);}
 if(kind==='sort'){const types=[...new Set(SORT[level])];types.forEach((type,i)=>{const e=document.createElement('span');e.innerHTML=icon(type);$('goal').append(e);const b=target(type,'basket-target',basket(type),'放进'+({apple:'苹果',banana:'香蕉',berry:'蓝莓'})[type]+'篮子');b.style.left=((i+.5)/types.length*100)+'%';b.style.marginLeft='calc(var(--basket-width, 190px) / -2)';});SORT[level].forEach((type,i)=>piece(type,type+'-'+i));}
 if(kind==='build'){BUILD[level].forEach((type,i)=>{const e=document.createElement('span');e.innerHTML=icon(type);$('goal').append(e);const b=target('slot-'+i,'slot '+(i?'pending':'current'),icon(type),'积木位置'+(i+1));b.style.setProperty('--slot-index',String(i));});const arrow=document.createElement('div');arrow.className='build-arrow';arrow.innerHTML=icon('arrow');$('targets').append(arrow);const order=[...BUILD[level]].reverse();order.forEach((type,i)=>piece(type,type+'-'+i));}
 if(kind==='shop'){
  for(const type of SHOP[level]){const e=document.createElement('span');e.dataset.type=type;e.className='shopping-need';e.innerHTML=icon(type);$('goal').append(e);}
  target('bag','bag-target',icon('bag')+'<span class="bag-goods"></span>','购物袋：按清单放入食物');
  const stock=[...SHOP[level],...(['apple','banana','bread','milk'].filter(t=>!SHOP[level].includes(t)).slice(0,2))];
  stock.sort((a,b)=>a.localeCompare(b)).forEach((type,i)=>piece(type,'stock-'+i));
 }
 if(kind==='tidy'){
  [...new Set(TIDY[level].map(type=>HOMES[type]))].forEach(id=>target(id,'storage-target '+id,homeArt(id),({bookshelf:'图画书的书架',toybox:'玩具箱',wardrobe:'衣柜'})[id]));
  TIDY[level].forEach((type,i)=>piece(type,'room-'+i));
 }
 if(kind==='garden'){
  GARDEN.forEach((type,i)=>{const e=document.createElement('span');e.innerHTML=icon(type);e.className='garden-step'+(i===0?' current-step':'');$('goal').append(e);});
  target('pot','pot-target',potArt(0,level),'小花盆');
  const tools=[['water','seed','soil'],['seed','soil','water'],['water','soil','seed']][level];tools.forEach(type=>piece(type,'tool-'+type));
 }
 updateGuide();
 // Let layout settle before calculating the demonstration route.
 requestAnimationFrame(()=>{if(screen==='play'&&!round.done)showDemo(true);});status('看图样例，再跟着小手玩');
}
function updateGuide(){
 const next=kind==='shop'?needed(round)[0]:kind==='tidy'?items.find(i=>!i.used)?.type:kind==='garden'?GARDEN[round.placed.length]:kind==='build'?BUILD[level][round.placed.length]:kind==='feed'?'apple':'apple';
 $('guide-picture').innerHTML=round.done?icon('star'):icon(next||'star');
}
function lifeEffect(type,t){
 if(type==='water'){
  audio.tone(700,.17,.05,'sine',0,320);audio.tone(1000,.23,.05,'sine',.15,430);
  const r=t.getBoundingClientRect(),board=$('board').getBoundingClientRect();
  for(let i=0;i<9;i++){const d=document.createElement('span');d.className='water-drop';d.style.left=(r.x-board.x+r.width*.35+(i%3)*20)+'px';d.style.top=(r.y-board.y+r.height*.35)+'px';$('fx').append(d);d.animate([{transform:'translateY(-45px)',opacity:0},{opacity:1,offset:.25},{transform:'translateY(65px)',opacity:0}],{duration:600,delay:i*45}).finished.then(()=>d.remove()).catch(()=>d.remove());}
 }else audio.play('place');
}
function tumble(type,targetNode){const board=$('board').getBoundingClientRect(),r=targetNode.getBoundingClientRect(),x=r.x-board.x+r.width/2,y=r.y-board.y+r.height*.7,size=kind==='feed'?40:30;const el=document.createElement('span');el.className='physical-toy';el.style.width=size+'px';el.style.height=size+'px';el.innerHTML=icon(type);$('fx').append(el);const body=M.Bodies.circle(x,y-55,size*.36,{restitution:.4,frictionAir:.035});M.Composite.add(engine.world,body);const floor=M.Bodies.rectangle(x,y+23,Math.max(85,r.width*.7),12,{isStatic:true});M.Composite.add(engine.world,floor);physics.push({body,el,size,age:0,floor});}
function celebrate(){if(paused)return;$('celebrate').hidden=false;$('celebrate').querySelector('.reward-stars').innerHTML=[0,1,2].map(i=>icon('star',i<=level?'':'unearned')).join('');setupButton('next',level<2?'arrow':'home');$('next').setAttribute('aria-label',level<2?'玩下一关':'回小岛选新玩具');speak(kind==='garden'?'garden-done':kind==='shop'?'shop-done':kind==='tidy'?'tidy-done':level<2?'done':'all');status('完成了，点箭头继续玩');}
function setPause(on){if(screen!=='play'&&screen!=='hub')return;paused=on;if(on)cancelDrag();audio.setPaused(on);stopDemo();stopVoice();clearTimeout(idleTimer);$('paused').hidden=!on;setupButton('pause',on?'play':'pause');$('pause').setAttribute('aria-label',on?'继续':'暂停');if(!on&&screen==='play'){if(round.done)celebrate();else idle();}}
function exitToIsland(){cleanup();audio.stop();if(parent!==window)parent.postMessage({type:'starisle:arcade-close'},location.origin);else location.href='/';}
$('choose-scene').innerHTML=icon('back');$('choose-scene').onclick=home;$('home').onclick=exitToIsland;$('pause').onclick=()=>setPause(!paused);$('resume').onclick=()=>setPause(false);$('show').onclick=()=>{demoRepeats=0;showDemo(true);};$('listen').onclick=()=>{if(!paused)showDemo(true);};$('reset').onclick=()=>start();$('next').onclick=()=>{if(level<2)start(kind,level+1);else home();};$('sound').onclick=()=>{audio.setEnabled(!audio.enabled);stopVoice();setupButton('sound',audio.enabled?'speaker':'mute');$('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'关闭声音':'开启声音');if(audio.enabled)speak(screen==='hub'?'welcome':kind);};
$('parent').onclick=()=>{setPause(true);$('parent-dialog').showModal();};$('close-parent').onclick=()=>$('parent-dialog').close();$('parent-dialog').addEventListener('close',()=>setPause(false));$('exit').onclick=exitToIsland;
 document.addEventListener('pointerdown',()=>void audio.unlock(),{capture:true});document.addEventListener('keydown',()=>void audio.unlock(),{capture:true});
let hiddenTimer;document.addEventListener('visibilitychange',()=>{clearTimeout(hiddenTimer);if(document.hidden){stopVoice();audio.stop();hiddenTimer=setTimeout(()=>{if(document.hidden)setPause(true);},350);}last=0;});window.addEventListener('pagehide',()=>{cleanup();audio.stop();});window.addEventListener('resize',()=>{cancelDrag();stopDemo();if(screen==='play'&&!paused&&!round.done)idle();});
function tick(t){requestAnimationFrame(tick);const dt=last?Math.min(t-last,50):16.67;last=t;if(paused||document.hidden)return;accumulator+=dt;while(accumulator>=1000/60){M.Engine.update(engine,1000/60);accumulator-=1000/60;for(const p of [...physics]){p.age+=1000/60;p.el.style.transform=`translate(${p.body.position.x-p.size/2}px,${p.body.position.y-p.size/2}px) rotate(${p.body.angle}rad)`;if(p.age>1300){p.el.remove();M.Composite.remove(engine.world,p.body);M.Composite.remove(engine.world,p.floor);physics=physics.filter(q=>q!==p);}}}if(!speaking)audio.update();}
$('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'关闭声音':'开启声音');
requestAnimationFrame(tick);document.body.dataset.screen='hub';renderHub();stars();$('hub-listen').innerHTML=icon('speaker');$('hub-listen').onclick=()=>speak('welcome');$('back').innerHTML=icon('back');$('back').onclick=home;
void createHero($('xingbao'),()=>speaking,()=>paused).then(result=>{$('companion').dataset.ready='true';$('companion').dataset.animations=result.animations.join(',');}).catch(error=>{console.warn('Xingbao portrait unavailable',error);$('portrait-fallback').hidden=false;});
