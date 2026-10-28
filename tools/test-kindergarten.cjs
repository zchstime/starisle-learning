const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
const src=fs.readFileSync('web/arcade/kindergarten/rules.js','utf8');
const {KINDS,FEED,SORT,BUILD,createRound,accept}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
for(const kind of KINDS)for(let level=0;level<3;level++){
const round=createRound(kind,level);
assert.equal(accept(round,{id:'wrong',type:'wrong'},'bunny').ok,false);assert.equal(round.placed.length,0);
const types=kind==='feed'?Array(FEED[level]).fill('apple'):kind==='sort'?SORT[level]:BUILD[level];
types.forEach((type,i)=>{const item={id:String(i),type};const target=kind==='feed'?'bunny':kind==='sort'?type:'slot-'+i;
const result=accept(round,item,target);assert.equal(result.ok,true);assert.equal(result.done,i===types.length-1);assert.equal(accept(round,item,target).ok,false);});
assert.equal(round.done,true);assert.equal(accept(round,{id:'extra',type:types[0]},kind==='feed'?'bunny':types[0]).ok,false);
}
const b=createRound('build',1);assert.equal(accept(b,{id:'a',type:'square'},'slot-1').ok,false);assert.equal(b.placed.length,0);
const lines=JSON.parse(fs.readFileSync('web/arcade/kindergarten/voice-lines.json','utf8'));for(const id of Object.keys(lines))assert.ok(fs.statSync('web/arcade/kindergarten/assets/voice/'+id+'.mp3').size>1000);
console.log('Kindergarten: all 9 rounds, wrong targets, duplicates, exact completion, block sequence and voice assets passed');
})().catch(e=>{console.error(e);process.exit(1)});
