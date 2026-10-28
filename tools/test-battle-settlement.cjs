// Exercise the actual submit method with animation callbacks deliberately withheld.
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/scripts/adventure/Adventure.ts','utf8');
const body=source.split(' submit(){')[1].split('\n reward(')[0].trim().slice(0,-1).replace(/:any/g,'');
const noTween={to(){return this;},call(){return this;},delay(){return this;},start(){return this;}};
const submit=new Function('panel','text','C','Node','Vec3','tween','burst','starMonster','Tween','usesRunes',body);
(async()=>{let rewards=0,complete=0;const a={locked:false,puzzle:{pendingGuide:()=>'',attempts:0,correct:()=>true,level:{id:'test'}},progress:{done:[],heroLevel:1,grade:1,complete(){complete++;this.done.push('test');},gradeStatus:()=>({complete:false})},sound(){},reward(){rewards++;clearTimeout(this.battleTimer);this.battleTimer=null;},root:{children:[]}};
const panel=()=>({on(){}});submit.call(a,panel,()=>{}, {gold:'#fff'},{EventType:{TOUCH_END:'end'}},class{constructor(){}},()=>noTween,()=>{},()=>{},{stopAllByTarget(){}},()=>false);
await new Promise(r=>setTimeout(r,1650));assert.equal(rewards,1);assert.equal(complete,1);assert.equal(a.battleTimer,null);console.log('PASS withheld animation callbacks: wall-clock fallback settles exactly once');})();
