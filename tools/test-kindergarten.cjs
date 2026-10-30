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
const entries=kind==='feed'?Array(FEED[level]).fill('apple').map(type=>({type})):kind==='sort'?SORT[level].items:kind==='shop'?SHOP[level].map(type=>({type})):kind==='tidy'?TIDY[level].map(type=>({type})):kind==='garden'?GARDEN.map(type=>({type})):BUILD[level].map(type=>({type}));
entries.forEach((entry,i)=>{const {type}=entry,item={id:String(i),type,group:entry.group||type};const target=kind==='feed'?'bunny':kind==='sort'?item.group:kind==='shop'?'bag':kind==='tidy'?HOMES[type]:kind==='garden'?'pot':'slot-'+i;
const result=accept(round,item,target);assert.equal(result.ok,true);assert.equal(result.done,i===entries.length-1);assert.equal(accept(round,item,target).ok,false);});
assert.equal(round.done,true);assert.equal(accept(round,{id:'extra',type:entries[0].type,group:entries[0].group||entries[0].type},kind==='feed'?'bunny':entries[0].group||entries[0].type).ok,false);
}
const b=createRound('build',1);assert.equal(accept(b,{id:'a',type:'square'},'slot-1').ok,false);assert.equal(b.placed.length,0);
const shop=createRound('shop',1);assert.equal(accept(shop,{id:'x',type:'milk'},'bag').ok,false);assert.equal(accept(shop,{id:'a',type:'apple'},'bag').ok,true);assert.equal(accept(shop,{id:'b',type:'apple'},'bag').ok,true);assert.equal(accept(shop,{id:'c',type:'apple'},'bag').ok,false);assert.deepEqual(needed(shop),['bread']);
const tidy=createRound('tidy',0);assert.equal(accept(tidy,{id:'x',type:'book'},'toybox').ok,false);assert.equal(accept(tidy,{id:'a',type:'book'},'bookshelf').ok,true);assert.equal(accept(tidy,{id:'b',type:'book'},'bookshelf').ok,true);assert.equal(accept(tidy,{id:'c',type:'book'},'bookshelf').ok,false);
const garden=createRound('garden',0);assert.equal(accept(garden,{id:'w',type:'water'},'pot').ok,false);assert.equal(accept(garden,{id:'s',type:'seed'},'pot').ok,false);assert.equal(accept(garden,{id:'t',type:'soil'},'pot').ok,true);assert.equal(accept(garden,{id:'w',type:'water'},'pot').ok,false);assert.deepEqual(needed(garden),['seed','water','sun','wait']);
const bySize=createRound('sort',1);assert.equal(accept(bySize,{id:'small',type:'apple',group:'small'},'big').ok,false);assert.equal(accept(bySize,{id:'small',type:'apple',group:'small'},'small').ok,true);
const byUse=createRound('sort',2);assert.equal(accept(byUse,{id:'ball',type:'ball',group:'toy'},'food').ok,false);assert.equal(accept(byUse,{id:'ball',type:'ball',group:'toy'},'toy').ok,true);
const lines=JSON.parse(fs.readFileSync('web/arcade/kindergarten/voice-lines.json','utf8'));for(const id of Object.keys(lines))assert.ok(fs.statSync('web/arcade/kindergarten/assets/voice/'+id+'.mp3').size>1000);
console.log('Kindergarten: all 18 rounds, wrong targets, duplicates, shopping quantities, storage categories, gardening order and voice assets passed');
})().catch(e=>{console.error(e);process.exit(1)});
