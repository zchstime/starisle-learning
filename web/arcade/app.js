import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {gardenAudio as audio} from './audio.js';
import {GardenDefense,defenseLevels} from './defense.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {slingLevels,balanceLevels,charge,isBalanced,torque} from './rules.js';
const $=id=>document.getElementById(id), M=window.Matter;
const modes=['sling','balance','defense'];
let mode=modes.includes(new URLSearchParams(location.search).get('mode'))?new URLSearchParams(location.search).get('mode'):'sling',level=0,paused=false,won=false,summaryOpen=false;
let defense,selectedFactor=2,selectedLane=0,backgroundTexture,particles=[],guideDots=[],hero,gateRing;
let engine,renderer,scene,camera,world,models={},objects=[],labels=[],rock,elastic,drag=null,flight=0,total=0,shots=[],ammo=3,beam,rightMass=1,rightArm=1,stable=0,elapsed=0,last=0,accumulator=0;
let completed={sling:[],balance:[]},saveKey='starisle.arcade.guest.v1';
try{const id=window.parent!==window?window.parent.starisleAccount?.id:null;if(id)saveKey='starisle.account.'+id+'.arcade.v1';completed=JSON.parse(localStorage.getItem(saveKey)||'null')||completed;}catch{}
if(!completed||typeof completed!=='object'||Array.isArray(completed))completed={sling:[],balance:[]};
for(const k of modes)if(!Array.isArray(completed[k]))completed[k]=[];
const W=1200,H=530,anchor={x:205,y:345};
const canvas=$('scene'),viewport=$('viewport');
const say=s=>$('feedback').textContent=s;
function meshBox(x,y,w,h,d,color,z=0){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(6,w/5,h/5,d/5)),new THREE.MeshStandardMaterial({color,roughness:.85}));mesh.position.set(x,-y,z);mesh.userData.local=true;scene.add(mesh);return mesh;}
function orb(x,y,r,color){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),new THREE.MeshStandardMaterial({color,roughness:.45}));mesh.position.set(x,-y,20);mesh.userData.local=true;scene.add(mesh);return mesh;}
function label(text,x,y,light=false){const el=document.createElement('span');el.className='world-label'+(light?' light':'');el.textContent=text;$('scene-labels').append(el);const item={el,x,y};labels.push(item);positionLabel(item);return item;}
function positionLabel(l){l.el.style.left=(l.x/W*100)+'%';l.el.style.top=(l.y/H*100)+'%';}
function model(name,x,y,size,rot=0){const source=models[name];if(!source)return null;const g=source.clone(true);const bounds=new THREE.Box3().setFromObject(g),s=bounds.getSize(new THREE.Vector3()),c=bounds.getCenter(new THREE.Vector3());g.position.sub(c);const holder=new THREE.Group();holder.add(g);holder.scale.setScalar(size/Math.max(s.x,s.y,s.z));holder.rotation.y=rot;holder.position.set(x,-y,-25);scene.add(holder);return holder;}
function removeLabel(item){item.el.remove();labels=labels.filter(l=>l!==item);}
function burst(x,y,color='#ffe7a0',count=18){for(let i=0;i<count;i++){const mesh=orb(x,y,3+Math.random()*3,color);mesh.position.z=90;particles.push({mesh,x,y,vx:(Math.random()-.5)*180,vy:-50-Math.random()*140,life:.65+Math.random()*.3});}}
function updateEffects(dt){for(const p of [...particles]){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.mesh.position.set(p.x,-p.y,90);p.mesh.scale.setScalar(Math.max(.01,p.life));if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();particles=particles.filter(q=>q!==p);}}if(hero)hero.rotation.y=-.35+Math.sin(elapsed/1300)*.1;if(gateRing)gateRing.scale.setScalar(1+Math.sin(elapsed/450)*.018);}
function shadow(x,y,size=44){const mesh=new THREE.Mesh(new THREE.CircleGeometry(size,32),new THREE.MeshBasicMaterial({color:'#315f49',transparent:true,opacity:.16,depthWrite:false}));mesh.scale.y=.22;mesh.position.set(x,-y,5);mesh.userData.local=true;scene.add(mesh);}
function buildDefense(){
 selectedFactor=2;selectedLane=0;
 defense=new GardenDefense({scene,box:meshBox,orb,label,positionLabel,removeLabel,burst,sound:audio,feedback:say,onWin:finish,onLose:()=>{paused=true;audio.setPaused(true);$('overlay').hidden=false;$('overlay-title').textContent='花园需要新的布阵';$('overlay-text').textContent='看看每条路的数字规律，换一组守卫再来。星章不会扣除。';$('continue').textContent='重新布阵 →';}},level);
}
function plant(row){if(paused||won||defense.ended)return;selectedLane=row;defense.place(row,selectedFactor);updateDefenseControls();}
function updateDefenseControls(){document.querySelectorAll('[data-factor]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.factor)===selectedFactor);b.setAttribute('aria-pressed',String(Number(b.dataset.factor)===selectedFactor));});document.querySelectorAll('[data-lane]').forEach(b=>{const row=Number(b.dataset.lane);b.textContent=(row+1)+' 路：'+(defense.towers[row]?'×'+defense.towers[row]:'待种植');b.classList.toggle('active',row===selectedLane);});}
function bodyBox(x,y,w,h,color,options={}){const b=M.Bodies.rectangle(x,y,w,h,options),mesh=meshBox(x,y,w,h,35,color);M.Composite.add(engine.world,b);objects.push({body:b,mesh});return b;}
function clearScene(){if(engine){M.Events.off(engine);M.Composite.clear(engine.world,false);M.Engine.clear(engine);}if(scene){scene.traverse(o=>{if(o.userData.ownedTexture)o.material.map?.dispose();});for(const o of objects)o.label?.el.remove();}objects=[];labels=[];particles=[];guideDots=[];hero=null;gateRing=null;defense=null;$('scene-labels').replaceChildren();rock=null;elastic=null;beam=null;drag=null;flight=0;total=0;shots=[];stable=0;elapsed=0;accumulator=0;}
// The world uses Matter.js coordinates. Three.js draws the same bodies in 3D.
function buildScene(){
 clearScene();engine=M.Engine.create({enableSleeping:false});engine.gravity.y=1;
 if(scene){scene.traverse(o=>{if(o.userData.local){o.geometry?.dispose();o.material?.dispose();}});}
 scene=new THREE.Scene();scene.background=backgroundTexture||new THREE.Color('#dcebd8');
 scene.add(new THREE.HemisphereLight(0xffffff,0x718d65,1.8));const sun=new THREE.DirectionalLight(0xfff2d5,2.3);sun.position.set(-300,500,700);scene.add(sun);
 // A front orthographic view keeps pointer coordinates and learning quantities exact.
 camera=new THREE.OrthographicCamera(0,W,0,-H,.1,3000);camera.position.z=1500;
 if(mode!=='defense'){
  for(const x of [55,110,1000,1145])model('grass',x,449,32,.4);
  hero=model('character',1080,395,104,-.35);shadow(1080,449,45);model('coin',1080,307,28,.4);
  const ground=bodyBox(600,480,1250,40,'#8baa70',{isStatic:true});objects.find(o=>o.body===ground).mesh.visible=false;
 }
 if(mode==='sling')buildSling();else if(mode==='balance')buildBalance();else buildDefense();
 // Dispose only locally-created meshes, never the shared imported model resources.
 scene.traverse(o=>{if(o.isMesh&&!Object.values(models).some(root=>{let found=false;root.traverse(m=>{if(m.geometry===o.geometry)found=true;});return found;}))o.userData.local=true;});
}
function buildSling(){
 const l=slingLevels[level];ammo=l.ammo[1];
 meshBox(anchor.x,408,19,100,24,'#927052');meshBox(anchor.x-18,355,15,43,24,'#927052');meshBox(anchor.x+18,355,15,43,24,'#927052');
 model('platform',865,452,260);
 const gate=M.Bodies.rectangle(850,335,180,210,{isStatic:true,isSensor:true,label:'gate'});M.Composite.add(engine.world,gate);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(83,9,12,48),new THREE.MeshStandardMaterial({color:'#e6bd5d',metalness:.2,roughness:.5}));ring.position.set(850,-335,25);scene.add(ring);gateRing=ring;shadow(850,456,112);shadow(anchor.x,456,46);
 for(let i=0;i<19;i++){const dot=orb(0,0,2.6,'#fff5ce');dot.visible=false;dot.position.z=50;guideDots.push(dot);}
 const energy=label('0 / '+l.target,850,335);energy.el.id='energy-label';label('能量入口',850,218);
 for(let i=0;i<3;i++)bodyBox(660+i*44,430,40,48,'#b68d61',{restitution:.15});
 spawn();
 M.Events.on(engine,'collisionStart',e=>{for(const p of e.pairs){const other=p.bodyA===rock?p.bodyB:p.bodyB===rock?p.bodyA:null;if(!other||!flight)continue;if(other.label!=='gate'){audio.play('impact');burst(rock.position.x,rock.position.y,'#dfcca0',5);}if(other.label==='gate'){
 const value=rock.plugin.value,result=charge(total,value,l.target);total=result.total;shots.push(value);energy.el.textContent=total+' / '+l.target;removeRock();audio.play(result.over?'wrong':'collect');burst(850,335,result.over?'#edb1ab':'#fff0a7',24);
 if(result.over){shots=[];say('能量溢出了！入口已清空，再想想怎样凑成 '+l.target+'。');}
 else if(result.won){finish(shots.join(' + ')+' = '+l.target+'。'+l.explain);}
 else say('送达 '+value+' 格，还差 '+(l.target-total)+' 格！换一种球继续试试。');
 if(!won)spawn();break;
 }}});
}
function spawn(){rock=M.Bodies.polygon(anchor.x,anchor.y,12,22,{density:.004,restitution:.35,frictionAir:.002});M.Body.setStatic(rock,true);rock.plugin.value=ammo;M.Composite.add(engine.world,rock);
 const mesh=orb(anchor.x,anchor.y,22,'#edbd60'),tag=label(String(ammo),anchor.x,anchor.y,true);objects.push({body:rock,mesh,label:tag});
 // Adapted from Matter.js 0.20.0 examples/slingshot.js (MIT).
 elastic=M.Constraint.create({pointA:anchor,bodyB:rock,length:.01,damping:.01,stiffness:.05});M.Composite.add(engine.world,elastic);flight=0;updateAmmo();}
function removeRock(){if(!rock)return;const i=objects.findIndex(o=>o.body===rock);if(i>=0){const [o]=objects.splice(i,1);scene.remove(o.mesh);o.mesh.geometry.dispose();o.mesh.material.dispose();o.label.el.remove();labels=labels.filter(l=>l!==o.label);}M.Composite.remove(engine.world,rock);if(elastic)M.Composite.remove(engine.world,elastic);rock=null;elastic=null;flight=0;}
function launch(dx,dy){if(!rock||flight||won||paused)return;M.Composite.remove(engine.world,elastic);elastic=null;M.Body.setStatic(rock,false);M.Body.setPosition(rock,anchor);M.Body.setVelocity(rock,{x:dx*.17,y:-dy*.17});flight=1;audio.play('launch');say('看能量球的飞行轨迹，没投中可以调整力度和角度。');updateAmmo();}
function buildBalance(){
 const l=balanceLevels[level];rightMass=1;rightArm=1;
 const support=new THREE.Mesh(new THREE.ConeGeometry(36,105,3),new THREE.MeshStandardMaterial({color:'#b9956e'}));support.position.set(600,-403,0);support.rotation.y=Math.PI/2;scene.add(support);
 label('支点',600,468);label('左边固定：'+l.leftMass+' 份 × '+l.leftArm+' 格',310,135);label('右边：换砝码、换位置',875,135);
 const line=meshBox(600,344,620,2,2,'#fcf7de',-25);line.material.transparent=true;line.material.opacity=.6;
 rebuildBeam();
}
function rebuildBeam(){
 if(beam){M.Composite.remove(engine.world,beam);M.Composite.remove(engine.world,world);for(const o of objects.filter(o=>o.beam)){scene.remove(o.mesh);o.mesh.geometry?.dispose();o.mesh.material?.dispose();if(o.label){o.label.el.remove();labels=labels.filter(l=>l!==o.label);}}objects=objects.filter(o=>!o.beam);}
 stable=0;const l=balanceLevels[level],x=600,y=330,lx=x-l.leftArm*65,rx=x+rightArm*65;
 const plank=M.Bodies.rectangle(x,y,600,18);M.Body.setMass(plank,1);
 const left=M.Bodies.rectangle(lx,y-37,42,56);M.Body.setMass(left,l.leftMass*3);
 const right=M.Bodies.rectangle(rx,y-37,42,56);M.Body.setMass(right,rightMass*3);
 beam=M.Body.create({parts:[plank,left,right],frictionAir:.10});
 world=M.Constraint.create({pointA:{x,y},bodyB:beam,pointB:{x:x-beam.position.x,y:y-beam.position.y},length:0,stiffness:1});M.Composite.add(engine.world,[beam,world]);
 for(const [b,w,h,c,txt] of [[plank,600,18,'#668b70',''],[left,42,56,'#dda66a',String(l.leftMass)],[right,42,56,'#8caeb3',String(rightMass)]]){
 const mesh=meshBox(b.position.x,b.position.y,w,h,36,c),tag=txt?label(txt,b.position.x,b.position.y,true):null;objects.push({body:b,mesh,label:tag,beam:true});}
 for(let i=-4;i<=4;i++){if(!i)continue;const mesh=meshBox(600+i*65,330,3,14,39,'#e4edcf',1);objects.push({mesh,beam:true,offset:i*65});}
 updateBalance();
}
function updateBalance(){const l=balanceLevels[level];$('insight').textContent='左：'+l.leftMass+' × '+l.leftArm+' = '+torque(l.leftMass,l.leftArm)+'；右：'+rightMass+' × '+rightArm+' = '+torque(rightMass,rightArm)+'。让两边相等，再观察桥能否稳定。';document.querySelectorAll('[data-mass]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.mass)===rightMass);b.setAttribute('aria-pressed',String(Number(b.dataset.mass)===rightMass));});document.querySelectorAll('[data-arm]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.arm)===rightArm);b.setAttribute('aria-pressed',String(Number(b.dataset.arm)===rightArm));});}
function updateAmmo(){document.querySelectorAll('[data-ammo]').forEach(b=>{b.disabled=!!flight||won;b.classList.toggle('active',Number(b.dataset.ammo)===ammo);b.setAttribute('aria-pressed',String(Number(b.dataset.ammo)===ammo));});const b=$('launch');if(b)b.disabled=!!flight||won;}
function button(text,fn,attrs={}){const b=document.createElement('button');b.textContent=text;Object.assign(b.dataset,attrs);b.className='ammo';b.onclick=fn;$('tools').append(b);return b;}
function caption(text){const e=document.createElement('span');e.className='tool-caption';e.textContent=text;$('tools').append(e);}
function controls(){const tools=$('tools');tools.replaceChildren();if(mode==='sling'){
 caption('装入能量');for(const n of slingLevels[level].ammo)button('● '+n,()=>{if(flight||won||paused)return;ammo=n;rock.plugin.value=n;objects.find(o=>o.body===rock).label.el.textContent=String(n);updateAmmo();},{ammo:String(n)});
 const controls=document.createElement('div');controls.style.display='flex';controls.style.gap='10px';controls.innerHTML='<label class="control">角度 <input id="angle" type="range" min="20" max="65" value="34" aria-label="发射角度"></label><label class="control">力度 <input id="power" type="range" min="55" max="100" value="86" aria-label="发射力度"></label>';tools.append(controls);
 const b=button('↗ 发射',()=>{const angle=Number($('angle').value)*Math.PI/180,power=Number($('power').value);launch(Math.cos(angle)*power,Math.sin(angle)*power);});b.id='launch';updateAmmo();
 }else if(mode==='balance'){caption('右侧砝码');for(let n=1;n<=4;n++)button(n+' 份',()=>{if(won||paused)return;rightMass=n;audio.play('place');rebuildBeam();say('观察一下：换砝码后，桥向哪边转？');},{mass:String(n)});caption('离支点');for(let n=1;n<=4;n++)button(n+' 格',()=>{if(won||paused)return;rightArm=n;audio.play('place');rebuildBeam();say('同一个砝码，离支点越远，作用越明显。');},{arm:String(n)});updateBalance();}else{caption('选择种子');for(const n of [2,3,5])button('✿ ×'+n,()=>{if(paused||won)return;selectedFactor=n;audio.play('select');updateDefenseControls();},{factor:String(n)});caption('种在哪条路');for(let row=0;row<3;row++)button((row+1)+' 路',()=>plant(row),{lane:String(row)});const b=button('▶ 小队出发',()=>{if(paused||won)return;if(defense.start()){b.disabled=true;b.textContent='防守进行中';}});b.id='wave-start';updateDefenseControls();}}
function start(){audio.setPaused(false);document.body.dataset.mode=mode;won=false;summaryOpen=false;paused=false;$('pause').textContent='暂停';$('overlay').hidden=true;$('next').hidden=true;const ls=mode==='sling'?slingLevels:mode==='balance'?balanceLevels:defenseLevels,l=ls[level];$('chapter').textContent=String(level+1).padStart(2,'0')+' / 03';$('title').textContent=l.title;$('goal').textContent=mode==='sling'?'把不同数值的球弹进金色圆环，能量刚好相加到 '+l.target+'。':mode==='balance'?'调整右边的重量和位置，让平衡桥保持水平。':'选 ×2、×3 或 ×5 守卫，种进三条路，拦截它们各自的倍数。';$('badges').textContent=[0,1,2].map(i=>completed[mode].includes(i)?'★':'☆').join('');$('insight-title').textContent=mode==='sling'?'动手发现 · 数的组成':mode==='balance'?'动手发现 · 重量 × 距离':'动手发现 · 倍数与布阵';$('insight').textContent=mode==='sling'?'向左下方拉住球，松手发射。也可以调整角度、力度后点「发射」。':mode==='defense'?'×2 守卫能拦截 4、6、8…；看清整队数字，再选择守卫。':'';document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});buildScene();controls();say(mode==='sling'?'选一种能量球，向左下方拉开弹弓；也可以用下方的发射按钮。':mode==='balance'?'右边放上几份重量、离支点几格，能和左边平衡呢？':'先观察三条路的来访数字，选种子，再点小路。布置好后让小队出发！');}
function finish(message){if(won)return;won=true;audio.play('win');burst(600,240,'#ffe7a0',45);if(!completed[mode].includes(level))completed[mode].push(level);try{localStorage.setItem(saveKey,JSON.stringify(completed));}catch{$('save-note').textContent='本机保存不可用，本次完成记录会在关闭后丢失';}$('badges').textContent=[0,1,2].map(i=>completed[mode].includes(i)?'★':'☆').join('');say('★ 发现成功！'+message);$('next').hidden=false;$('next').textContent=level<2?'下一关 →':'查看收获 →';updateAmmo();}
function next(){if(level<2){level++;start();}else{summaryOpen=true;paused=true;audio.setPaused(true);$('overlay').hidden=false;$('overlay-title').textContent='这座小岛，被你点亮了！';$('overlay-text').textContent=mode==='sling'?'你用不同的数凑出了能量，还学会了控制弹射轨迹。去试试平衡实验吧。':'你把知识变成了真正的操作。下一座游乐小岛也在等你！';$('continue').textContent='换一种玩法 →';}}
function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
canvas.addEventListener('pointerdown',e=>{if(paused||won)return;const p=point(e);if(mode==='sling'&&rock&&!flight&&Math.hypot(p.x-anchor.x,p.y-anchor.y)<65){audio.play('stretch');drag={id:e.pointerId};canvas.setPointerCapture(e.pointerId);}else if(mode==='balance'&&p.x>620&&p.x<910&&p.y>230&&p.y<420){rightArm=Math.max(1,Math.min(4,Math.round((p.x-600)/65)));audio.play('place');rebuildBeam();}else if(mode==='defense'&&p.x>180&&p.x<1100){const row=Math.round((p.y-205)/110);if(row>=0&&row<3&&Math.abs(p.y-defense.y[row])<49)plant(row);}});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||paused||!rock)return;const p=point(e),dx=Math.max(-100,Math.min(0,p.x-anchor.x)),dy=Math.max(0,Math.min(85,p.y-anchor.y));M.Body.setPosition(rock,{x:anchor.x+dx,y:anchor.y+dy});});
canvas.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;if(paused||!rock)return;const dx=anchor.x-rock.position.x,dy=rock.position.y-anchor.y;if(dx<10){M.Body.setPosition(rock,anchor);return;}launch(dx,dy);});
canvas.addEventListener('pointercancel',()=>{drag=null;if(rock&&!flight)M.Body.setPosition(rock,anchor);});
function setPause(value){summaryOpen=false;paused=value;audio.setPaused(value);drag=null;if(rock&&!flight)M.Body.setPosition(rock,anchor);$('pause').textContent=value?'继续':'暂停';if(value){$('overlay-title').textContent='小岛休息一下';$('overlay-text').textContent='回来后继续刚才的探索。';$('continue').textContent='继续游戏 →';}$('overlay').hidden=!value;}
$('pause').onclick=()=>setPause(!paused);$('continue').onclick=()=>{if(summaryOpen){mode=modes[(modes.indexOf(mode)+1)%modes.length];level=0;start();}else if(mode==='defense'&&defense?.ended&&!won)start();else setPause(false);};
$('reset').onclick=()=>start();$('next').onclick=next;document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;level=0;start();});
function audioUI(){$('sound').textContent=audio.enabled?'♪ 声音：开':'♪ 声音：关';$('sound').setAttribute('aria-pressed',String(audio.enabled));$('music').textContent=audio.music?'♫ 配乐：开':'♫ 配乐：关';$('music').setAttribute('aria-pressed',String(audio.music));$('volume').value=String(Math.round(audio.volume*100));}
$('sound').onclick=()=>{audio.setEnabled(!audio.enabled);audioUI();audio.play('collect');};
$('music').onclick=()=>{audio.music=!audio.music;if(!audio.music)audio.stop();audio.save();audioUI();};
$('volume').oninput=e=>audio.setVolume(Number(e.target.value)/100);
// Browsers require a gesture before sound. The first pointer/key action unlocks it.
document.addEventListener('pointerdown',()=>void audio.unlock(),{capture:true});document.addEventListener('keydown',()=>void audio.unlock(),{capture:true});
document.addEventListener('click',e=>{if(e.target.closest('button'))audio.play('select');});audioUI();
$('back').onclick=()=>{if(parent!==window)parent.postMessage({type:'starisle:arcade-close'},location.origin);else location.href='/';};
$('credits-button').onclick=()=>{setPause(true);$('credits').showModal();};$('close-credits').onclick=()=>$('credits').close();$('credits').addEventListener('close',()=>setPause(false));
let hiddenTimer;
document.addEventListener('visibilitychange',()=>{clearTimeout(hiddenTimer);if(document.hidden)hiddenTimer=setTimeout(()=>{if(document.hidden)setPause(true);},350);last=0;});
function tick(t){requestAnimationFrame(tick);const dt=last?Math.min(t-last,50):16.67;last=t;if(!scene||!engine)return;if(!paused&&!document.hidden){accumulator+=dt;while(accumulator>=1000/60){M.Engine.update(engine,1000/60);accumulator-=1000/60;elapsed+=1000/60;if(mode==='defense'&&!won)defense.update(1/60);updateEffects(1/60);if(flight){flight+=1000/60;if(flight>5000||rock?.position.x>1250||rock?.position.y>540){removeRock();spawn();audio.play('miss');say('这次没投进入口。调整角度和力度，能量没有扣除。');}}if(mode==='balance'&&!won){const l=balanceLevels[level];if(isBalanced(l.leftMass,l.leftArm,rightMass,rightArm)&&Math.abs(beam.angle)<.035&&Math.abs(beam.angularVelocity)<.006)stable+=1000/60;else stable=0;if(stable>1400)finish(l.explain);}}}
 if(!paused&&!document.hidden)audio.update();
 for(const o of objects){if(o.offset!==undefined){o.mesh.position.set(600+Math.cos(beam.angle)*o.offset,-(330+Math.sin(beam.angle)*o.offset),1);o.mesh.rotation.z=-beam.angle;}else{const b=o.body;o.mesh.position.set(b.position.x,-b.position.y,o.mesh.position.z);o.mesh.rotation.z=-b.angle;if(o.label){o.label.x=b.position.x;o.label.y=b.position.y;positionLabel(o.label);}}}
 // Elastic ribbon and aiming guide are UI meshes, rebuilt with a fixed pool.
 if(mode==='sling'&&rock&&!flight){const p=rock.position;aimLine.geometry.setFromPoints([new THREE.Vector3(anchor.x-18,-350,30),new THREE.Vector3(p.x,-p.y,30),new THREE.Vector3(anchor.x+18,-350,30)]);aimLine.visible=true;}else aimLine.visible=false;
 for(const dot of guideDots)dot.visible=false;
 if(mode==='sling'&&rock&&!flight&&!paused&&!won){const a=Number($('angle')?.value||34)*Math.PI/180,p=Number($('power')?.value||86);let vx=drag?(anchor.x-rock.position.x)*.17:Math.cos(a)*p*.17,vy=drag?-(rock.position.y-anchor.y)*.17:-Math.sin(a)*p*.17,x=anchor.x,y=anchor.y;for(let i=0;i<57;i++){vx*=.998;vy=vy*.998+1000/3600;x+=vx;y+=vy;if(i%3===0){const dot=guideDots[Math.floor(i/3)];dot.position.set(x,-y,50);dot.visible=y<455;}}}
 if(aimLine.parent!==scene)scene.add(aimLine);renderer.render(scene,camera);
}
const aimLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x755341}));
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const resize=()=>renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);new ResizeObserver(resize).observe(viewport);resize();
 const loader=new GLTFLoader();try{backgroundTexture=await new THREE.TextureLoader().loadAsync('./assets/garden-backdrop-v2.png');backgroundTexture.colorSpace=THREE.SRGBColorSpace;}catch{}const results=await Promise.allSettled(['character','cloud','grass','platform','coin'].map(async name=>{models[name]=(await loader.loadAsync('./assets/'+name+'.glb')).scene;}));
 start();if(results.some(r=>r.status==='rejected'))say('部分装饰模型未加载，物理玩法可继续；刷新可重试加载模型。');requestAnimationFrame(tick);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPause(true);$('overlay-title').textContent='画面连接暂时中断';$('overlay-text').textContent='请刷新页面重新载入；已完成的星章保留在本机。';$('continue').textContent='刷新游戏';$('continue').onclick=()=>location.reload();});
}catch(e){console.error(e);$('title').textContent='游戏暂时没有加载成功';$('goal').textContent='请检查浏览器是否支持 WebGL，或刷新后重试。';say('可以点击左上角回小岛，原来的课程进度不受影响。');$('tools').innerHTML='<button onclick="location.reload()">重新加载</button>';}
