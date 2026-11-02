import {icon} from './icons.js';
import {PLAYFUL_NAMES} from './playful.js';
import {NAMES} from './life.js';
const $=id=>document.getElementById(id);
const shuffled=stock=>{for(let i=stock.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[stock[i],stock[j]]=[stock[j],stock[i]];}return stock;};
export function renderPlayful(round,task,{target,piece,note,canInteract,beforeListen}){
 const kind=task.mode;
 $('board').classList.add('playful');
 $('targets').className='discovery-targets playful-targets';
 const preview=kind==='spatial'?[task.cues[0]]:kind==='puzzle'?['picture-'+task.picture]:kind==='mirror'?task.types.map(t=>t.replace('mirror-right-','whole-')):kind==='rhythm'?task.types:task.cues;
 $('goal').innerHTML=preview.map(type=>`<span class="discovery-example">${icon(type)}</span>`).join('');
 $('goal').setAttribute('aria-label',kind==='spatial'?'看看小熊在箱子的哪里':kind==='rhythm'?'从左到右的声音样例':kind==='puzzle'?'完整画面的样例':'看图样例');
 if(kind==='spatial'){
  const box=document.createElement('span');box.className='spatial-box';box.innerHTML=icon('box-scene');box.setAttribute('aria-hidden','true');$('targets').append(box);
 }
 if(kind==='puzzle'){$('targets').style.setProperty('--picture-cols',task.grid[0]);$('targets').style.setProperty('--picture-rows',task.grid[1]);}
 task.targets.forEach((slot,i)=>{
  const reference=task.cues?.[i];
  const paired=kind==='counting'||kind==='weather'||kind==='mirror';
  const content=paired?`<span class="reference-picture">${icon(reference)}</span><span class="slot-content"></span>`:'<span class="slot-content"><span class="bead-hole"></span></span>';
  const label=kind==='spatial'?PLAYFUL_NAMES[reference]+'的位置':kind==='rhythm'?'声音位置 '+(i+1):kind==='puzzle'?'画片位置 '+(i+1):(PLAYFUL_NAMES[reference]||NAMES[reference])+'的搭档';
  const b=target(slot.id,'discovery-slot'+(paired?' paired-slot':'')+(kind==='mirror'?' mirror-slot':'')+(task.ordered&&!task.hideAnswer?(i?' pending':' current'):''),content,label);
  if(kind==='spatial')b.dataset.position=task.positions[i];
 });
 const types=task.reusable?[...new Set(task.types)]:task.types;
 shuffled(types.map((type,i)=>({type,id:'discovery-'+i}))).forEach(({type,id})=>piece(type,id));
 if(kind!=='rhythm')return null;
 // No timing score: the child may replay the model and tap at their own pace.
 const play=document.createElement('button');play.id='rhythm-play';play.className='icon-button';play.innerHTML=icon('speaker');play.setAttribute('aria-label','听一遍声音顺序');$('goal').append(play);
 let timers=[];
 const examples=()=>[...$('goal').querySelectorAll('.discovery-example')];
 const stop=()=>{timers.forEach(clearTimeout);timers=[];examples().forEach(e=>e.classList.remove('sound-pulse'));play.classList.remove('playing');};
 const demo=(withSound=true)=>{
  stop();if(!canInteract()||round.done)return;play.classList.add('playing');
  task.types.forEach((type,i)=>{
   timers.push(setTimeout(()=>{if(!canInteract())return;examples().forEach((e,j)=>e.classList.toggle('sound-pulse',j===i));if(withSound)note(type);},i*700));
  });
  timers.push(setTimeout(stop,task.types.length*700));
 };
 play.onclick=()=>{if(!canInteract())return;beforeListen();demo(true);};
 return {stop,demo};
}
export function updatePlayful(round,task){
 if(task.mode==='spatial')$('goal').innerHTML=`<span class="discovery-example">${icon(task.cues[round.placed.length]||'star')}</span>`;
}
