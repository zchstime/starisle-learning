const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
const dataURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const lifeURL=dataURL(fs.readFileSync('web/arcade/kindergarten/life.js','utf8'));
const {SHOP,TIDY,HOMES,GARDEN,needed}=await import(lifeURL);
const src=fs.readFileSync('web/arcade/kindergarten/rules.js','utf8').replace("'./life.js'",JSON.stringify(lifeURL));
const {KINDS,FEED,SORT,BUILD,createRound,accept}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
for(const kind of KINDS)for(let level=0;level<3;level++){
const round=createRound(kind,level);
assert.equal(accept(round,{id:'wrong',type:'wrong'},'bunny').ok,false);assert.equal(round.placed.length,0);
const types=kind==='feed'?Array(FEED[level]).fill('apple'):kind==='sort'?SORT[level]:kind==='shop'?SHOP[level]:kind==='tidy'?TIDY[level]:kind==='garden'?GARDEN:BUILD[level];
types.forEach((type,i)=>{const item={id:String(i),type};const target=kind==='feed'?'bunny':kind==='sort'?type:kind==='shop'?'bag':kind==='tidy'?HOMES[type]:kind==='garden'?'pot':'slot-'+i;
const result=accept(round,item,target);assert.equal(result.ok,true);assert.equal(result.done,i===types.length-1);assert.equal(accept(round,item,target).ok,false);});
assert.equal(round.done,true);assert.equal(accept(round,{id:'extra',type:types[0]},kind==='feed'?'bunny':types[0]).ok,false);
}
const b=createRound('build',1);assert.equal(accept(b,{id:'a',type:'square'},'slot-1').ok,false);assert.equal(b.placed.length,0);
const shop=createRound('shop',1);assert.equal(accept(shop,{id:'x',type:'milk'},'bag').ok,false);assert.equal(accept(shop,{id:'a',type:'apple'},'bag').ok,true);assert.equal(accept(shop,{id:'b',type:'apple'},'bag').ok,true);assert.equal(accept(shop,{id:'c',type:'apple'},'bag').ok,false);assert.deepEqual(needed(shop),['bread']);
const tidy=createRound('tidy',0);assert.equal(accept(tidy,{id:'x',type:'book'},'toybox').ok,false);assert.equal(accept(tidy,{id:'a',type:'book'},'bookshelf').ok,true);assert.equal(accept(tidy,{id:'b',type:'book'},'bookshelf').ok,true);assert.equal(accept(tidy,{id:'c',type:'book'},'bookshelf').ok,false);
const garden=createRound('garden',0);assert.equal(accept(garden,{id:'w',type:'water'},'pot').ok,false);assert.equal(accept(garden,{id:'s',type:'seed'},'pot').ok,false);assert.equal(accept(garden,{id:'t',type:'soil'},'pot').ok,true);assert.equal(accept(garden,{id:'w',type:'water'},'pot').ok,false);assert.deepEqual(needed(garden),['seed','water']);
const lines=JSON.parse(fs.readFileSync('web/arcade/kindergarten/voice-lines.json','utf8'));for(const id of Object.keys(lines))assert.ok(fs.statSync('web/arcade/kindergarten/assets/voice/'+id+'.mp3').size>1000);
console.log('Kindergarten: all 18 rounds, wrong targets, duplicates, shopping quantities, storage categories, gardening order and voice assets passed');
})().catch(e=>{console.error(e);process.exit(1)});
