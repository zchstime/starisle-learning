import {icon} from './icons.js';
import {NAMES} from './life.js';
import {lesson,DISCOVERY_NAMES} from './discovery.js';
import {renderPlayful,updatePlayful} from './playful-view.js';
const $=id=>document.getElementById(id);
export function renderDiscovery(round,hooks){
 const {target,piece}=hooks;
 const task=lesson(round),kind=round.kind;
 $('board').classList.add('discovery');
 if(task.mode)return renderPlayful(round,task,hooks);
 const preview=task.prefix||(kind==='sequence'?task.types:kind==='table'?Array(task.friends).fill('bunny'):kind==='rods'?['rod-1','arrow','rod-5']:task.types);
 $('goal').innerHTML=preview.map((type,i)=>`<span class="discovery-example">${icon(type)}${kind==='sequence'&&i<preview.length-1?'<i class="story-arrow">›</i>':''}</span>`).join('');
 $('goal').setAttribute('aria-label',kind==='beads'?'接着上面的珠子规律向右排':kind==='sequence'?'从左到右的故事样例':'看图样例');
 $('targets').className='discovery-targets';
 if(kind==='table')for(let i=0;i<task.friends;i++){
  const seat=document.createElement('div');seat.className='place-setting';seat.dataset.seat=i;
  seat.innerHTML=`<span class="seat-friend">${icon('bunny')}</span>`;$('targets').append(seat);
 }
 task.targets.forEach((slot,i)=>{
  const cls='discovery-slot'+(task.ordered?(i?' pending':' current'):'');
  const name=DISCOVERY_NAMES[slot.type]||NAMES[slot.type]||slot.type;
  const html=kind==='colors'?`<span class="color-reference">${icon(slot.type)}</span><span class="slot-content"></span>`:`<span class="slot-content">${kind==='beads'?'<span class="bead-hole"></span>':icon(slot.type)}</span>`;
  const b=target(slot.id,cls,html,kind==='beads'?'下一颗珠子的位置 '+(i+1):name+'的位置 '+(i+1));
  if(kind==='rods')b.querySelector('.slot-content svg').setAttribute('preserveAspectRatio','none');
  if(kind==='table')$('targets').querySelectorAll('.place-setting')[Math.floor(i/(task.types.length/task.friends))].append(b);
 });
 // Shuffle the tray, while keeping a stable set of objects during a round.
 const stock=task.types.map((type,i)=>({type,id:'discovery-'+i}));
 for(let i=stock.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[stock[i],stock[j]]=[stock[j],stock[i]];}
 stock.forEach(({type,id})=>piece(type,id));
}
export function updateDiscovery(round,item,node){
 node.classList.add('filled');node.classList.remove('current','pending');node.disabled=true;
 node.querySelector('.slot-content').innerHTML=icon(item.type);
 if(round.kind==='rods')node.querySelector('.slot-content svg').setAttribute('preserveAspectRatio','none');
 node.setAttribute('aria-label',node.getAttribute('aria-label')+'，已放好');
 const next=lesson(round).ordered&&!lesson(round).hideAnswer&&lesson(round).targets[round.placed.length];
 if(next){const el=document.querySelector('[data-target="'+next.id+'"]');el?.classList.add('current');el?.classList.remove('pending');}
 if(lesson(round).mode)updatePlayful(round,lesson(round));
}
