import * as THREE from 'three';
import {nearestTarget} from './vendor/tower-defense/targeting.js';
export const defenseLevels=[
 {title:'给三条小路找到守卫',lanes:[[4,8,14],[9,6,12],[10,15,25]],speed:35,interval:3.8,explain:'2 的倍数由 ×2 守卫拦截，3、5 的倍数也有自己的守卫。'},
 {title:'换条路，规律还一样吗？',lanes:[[15,25,35],[8,14,16],[9,21,27]],speed:43,interval:3.3,explain:'道路换了，但倍数规律没变。先观察数字，再安排守卫。'},
 {title:'会变的数字小队',lanes:[[6,9,15],[10,14,22],[15,20,35]],speed:49,interval:3.0,explain:'有些数是多个数的倍数。观察整队数字，选择能覆盖整条路的守卫。'}
];
export const matches=(value,factor)=>Number.isInteger(factor)&&factor>1&&value%factor===0;
export class GardenDefense{
 constructor(api,level){Object.assign(this,api);this.config=defenseLevels[level];this.towers=[null,null,null];this.enemies=[];this.bullets=[];this.started=false;this.ended=false;this.clock=0;this.spawned=0;this.caught=0;this.lives=3;this.cooldowns=[0,0,0];this.y=[205,315,425];this.towerViews=[];this.hud=this.label('先布阵，再出发',600,65);this.hud.el.id='defense-hud';this.previews=[];
  this.config.lanes.forEach((values,row)=>{const y=this.y[row],lane=this.box(635,y+22,860,68,12,['#d7e4b8','#c3dfc4','#e4d5af'][row],-8);lane.material.transparent=true;lane.material.opacity=.88;for(let i=0;i<8;i++)this.box(380+i*80,y+24,24,3,14,'#fff9d5',2);this.label(String(row+1)+' 路',145,y);const preview=this.label('来访：'+values.join(' · '),840,y-46);preview.el.classList.add('lane-preview');this.previews.push(preview);this.towerViews.push(this.makeTower(row));});
 }
 makeTower(row){const y=this.y[row],group=new THREE.Group();group.position.set(280,-y,30);this.scene.add(group);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(30,39,30,24),new THREE.MeshStandardMaterial({color:'#d19765',roughness:.8}));base.rotation.x=Math.PI/2;base.position.y=-10;group.add(base);
  const head=new THREE.Mesh(new THREE.SphereGeometry(27,24,16),new THREE.MeshStandardMaterial({color:'#a8c6a8',roughness:.5}));head.position.set(0,17,8);group.add(head);
  const snout=new THREE.Mesh(new THREE.CylinderGeometry(13,16,30,20),new THREE.MeshStandardMaterial({color:'#789e80'}));snout.rotation.z=Math.PI/2;snout.position.set(26,17,8);group.add(snout);
  for(const dx of [-11,5]){const eye=new THREE.Mesh(new THREE.SphereGeometry(4,12,8),new THREE.MeshBasicMaterial({color:'#284648'}));eye.position.set(dx,25,32);group.add(eye);}
  for(const dx of [-1,1]){const leaf=new THREE.Mesh(new THREE.SphereGeometry(13,16,10),new THREE.MeshStandardMaterial({color:'#5f9d7c'}));leaf.scale.set(1.5,.5,.35);leaf.rotation.z=dx*.5;leaf.position.set(dx*20,-5,10);group.add(leaf);}
  group.traverse(o=>{if(o.isMesh)o.userData.local=true;});const tag=this.label('待种植',280,y+55);return {group,head,snout,tag};
 }
 place(row,factor){if(this.ended)return;this.towers[row]=factor;const view=this.towerViews[row],color={2:'#75bfa5',3:'#b69bd8',5:'#efbb68'}[factor];view.head.material.color.set(color);view.snout.material.color.set(color);view.tag.el.textContent='× '+factor;view.tag.el.classList.add('tower-tag');this.sound.play('place');this.burst(280,this.y[row],color,8);this.feedback('第 '+(row+1)+' 路种下 ×'+factor+' 守卫。它能拦截 '+factor+' 的倍数。');}
 start(){if(this.started||this.ended)return false;if(this.towers.some(n=>!n)){this.feedback('三条路都需要守卫。选一种种子，再点对应的小路。');return false;}this.started=true;this.sound.play('collect');this.feedback('小队出发啦！守卫会自动发射。看到漏网的小怪，可以随时调整布阵。');return true;}
 spawn(row,value){this.sound.play('step');const y=this.y[row],mesh=new THREE.Group();mesh.position.set(1100,-y,35);const body=new THREE.Mesh(new THREE.SphereGeometry(26,24,16),new THREE.MeshStandardMaterial({color:['#d397bb','#a39ed2','#94b9d0'][row],roughness:.45}));body.scale.y=.87;mesh.add(body);for(const x of [-9,9]){const eye=new THREE.Mesh(new THREE.SphereGeometry(4,12,8),new THREE.MeshBasicMaterial({color:'#34445b'}));eye.position.set(x,5,25);mesh.add(eye);}mesh.traverse(o=>{if(o.isMesh)o.userData.local=true;});this.scene.add(mesh);const tag=this.label(String(value),1100,y-40);tag.el.classList.add('enemy-tag');this.enemies.push({pos:{x:1100,y},row,value,health:1,mesh,tag});}
 removeEnemy(e){this.scene.remove(e.mesh);e.mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.removeLabel(e.tag);this.enemies=this.enemies.filter(x=>x!==e);}
 update(dt){if(!this.started||this.ended)return;this.clock+=dt;while(this.spawned<9&&this.clock>=Math.floor(this.spawned/3)*this.config.interval){const row=this.spawned%3,wave=Math.floor(this.spawned/3);this.spawn(row,this.config.lanes[row][wave]);this.spawned++;}
  for(const e of [...this.enemies]){e.pos.x-=this.config.speed*dt;e.mesh.position.x=e.pos.x;e.mesh.position.y=-e.pos.y+Math.sin(this.clock*6+e.value)*4;e.tag.x=e.pos.x;e.tag.y=e.pos.y-42;this.positionLabel(e.tag);if(e.pos.x<180){this.lives--;this.sound.play('wrong');this.burst(e.pos.x,e.pos.y,'#d9a4b0',10);this.feedback(e.value+' 跑过去了！它不是 '+this.towers[e.row]+' 的倍数，试着换一种守卫。');this.removeEnemy(e);if(this.lives<=0){this.ended=true;this.onLose();return;}}}
  for(let row=0;row<3;row++){this.cooldowns[row]-=dt;if(this.cooldowns[row]>0)continue;const target=nearestTarget({x:280,y:this.y[row]},this.enemies,0,750,e=>e.row===row&&matches(e.value,this.towers[row])&&!this.bullets.some(b=>b.target===e));if(!target)continue;const mesh=this.orb(310,this.y[row],8,'#fff1a1');mesh.position.z=50;this.bullets.push({mesh,pos:{x:310,y:this.y[row]},target});this.cooldowns[row]=.7;this.sound.play('shot');}
  for(const b of [...this.bullets]){if(!this.enemies.includes(b.target)){this.removeBullet(b);continue;}const dx=b.target.pos.x-b.pos.x,dy=b.target.pos.y-b.pos.y,d=Math.hypot(dx,dy),step=570*dt;if(d<step+24){const e=b.target;this.caught++;this.sound.play('hit');this.burst(e.pos.x,e.pos.y,'#ffe7a0',13);this.feedback(e.value+' = '+this.towers[e.row]+' × '+(e.value/this.towers[e.row])+'，成功拦截！');this.removeEnemy(e);this.removeBullet(b);}else{b.pos.x+=dx/d*step;b.pos.y+=dy/d*step;b.mesh.position.set(b.pos.x,-b.pos.y,50);}}
  this.hud.el.textContent='♥'.repeat(this.lives)+'  ·  已拦截 '+this.caught+' / 9';
  if(this.spawned===9&&!this.enemies.length&&!this.bullets.length){this.ended=true;this.onWin('守住花园，拦截 '+this.caught+' 位来客！'+this.config.explain);}
 }
 removeBullet(b){this.scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();this.bullets=this.bullets.filter(x=>x!==b);}
}
