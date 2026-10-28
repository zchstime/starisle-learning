const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../web/arcade');
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
(async()=>{
 const {nearestTarget}=await import(data(fs.readFileSync(path.join(root,'vendor/tower-defense/targeting.js'),'utf8')));
 const near={pos:{x:5,y:0},health:1,value:7},far={pos:{x:8,y:0},health:1,value:8};assert.equal(nearestTarget({x:0,y:0},[near,far],0,10,e=>e.value%2===0),far);assert.equal(nearestTarget({x:0,y:0},[near,far],0,4),null);near.health=0;assert.equal(nearestTarget({x:0,y:0},[near,far],0,10),far);
 const threeURL=pathToFileURL(path.join(root,'vendor/three.module.js')).href;
 const code=fs.readFileSync(path.join(root,'defense.js'),'utf8').replace("'three'",JSON.stringify(threeURL)).replace("'./vendor/tower-defense/targeting.js'",JSON.stringify(data(fs.readFileSync(path.join(root,'vendor/tower-defense/targeting.js'),'utf8'))));
 const {GardenDefense,defenseLevels,matches}=await import(data(code)),THREE=await import(threeURL);
 assert(matches(15,3));assert(matches(15,5));assert(!matches(14,3));assert(!matches(14,0));
 function simulate(level,factors){let win='',lost=false;const scene=new THREE.Scene(),sounds=[];const mesh=()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());scene.add(m);return m;};const api={scene,box:mesh,orb:mesh,label:(text,x,y)=>({el:{textContent:text,classList:{add(){}}},x,y}),positionLabel(){},removeLabel(){},burst(){},sound:{play:s=>sounds.push(s)},feedback(){},onWin:s=>win=s,onLose:()=>lost=true};const game=new GardenDefense(api,level);assert.equal(game.start(),false,'Cannot start before all lanes have defenders');factors.forEach((f,i)=>game.place(i,f));assert.equal(game.start(),true);for(let i=0;i<3600&&!game.ended;i++)game.update(1/60);return {win,lost,game,sounds};}
 for(const [i,factors] of [[0,[2,3,5]],[1,[5,2,3]],[2,[3,2,5]]]){const r=simulate(i,factors);assert(r.win&&!r.lost);assert.equal(r.game.caught,9);assert.equal(r.game.lives,3);assert.equal(r.game.enemies.length,0);assert.equal(r.game.bullets.length,0);assert(r.sounds.includes('shot')&&r.sounds.includes('hit'));}
 const fail=simulate(0,[5,5,2]);assert(fail.lost&&!fail.win);assert.equal(fail.game.lives,0);const time=fail.game.clock;fail.game.update(10);assert.equal(fail.game.clock,time,'Finished waves must stop advancing');
 const fresh=simulate(0,[2,3,5]);assert.equal(fresh.game.caught,9,'Retry must create a clean wave');
 console.log('Arcade v2: targeting, multiplier rules, all 3 full waves (27 interceptions), wrong-layout defeat, ended lifecycle, clean retry and sound events passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
