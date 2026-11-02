const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
const bundle=require('esbuild').buildSync({entryPoints:['web/arcade/kindergarten/rules.js'],bundle:true,write:false,format:'esm'}).outputFiles[0].text;
const dataURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const {SHOP,TIDY,HOMES,GARDEN,needed}=await import(dataURL(fs.readFileSync('web/arcade/kindergarten/life.js','utf8')));
const {DISCOVERY,lesson,discoveryTarget,DISCOVERY_NAMES,instruction}=await import(dataURL(require('esbuild').buildSync({entryPoints:['web/arcade/kindergarten/discovery.js'],bundle:true,write:false,format:'esm'}).outputFiles[0].text));
const {KINDS,FEED,SORT,BUILD,createRound,accept}=await import(dataURL(bundle));
assert.equal(KINDS.length,18);
for(const kind of KINDS)for(let level=0;level<3;level++){
const round=createRound(kind,level);
assert.equal(accept(round,{id:'wrong',type:'wrong'},'bunny').ok,false);assert.equal(round.placed.length,0);
const entries=DISCOVERY[kind]?DISCOVERY[kind][level].types.map(type=>({type})):kind==='feed'?Array(FEED[level]).fill('apple').map(type=>({type})):kind==='sort'?SORT[level].items:kind==='shop'?SHOP[level].map(type=>({type})):kind==='tidy'?TIDY[level].map(type=>({type})):kind==='garden'?GARDEN.map(type=>({type})):BUILD[level].map(type=>({type}));
entries.forEach((entry,i)=>{const {type}=entry,item={id:String(i),type,group:entry.group||type};const target=DISCOVERY[kind]?'place-'+i:kind==='feed'?'bunny':kind==='sort'?item.group:kind==='shop'?'bag':kind==='tidy'?HOMES[type]:kind==='garden'?'pot':'slot-'+i;
const result=accept(round,item,target);assert.equal(result.ok,true);assert.equal(result.done,i===entries.length-1);assert.equal(accept(round,item,target).ok,false);});
assert.equal(round.done,true);assert.equal(accept(round,{id:'extra',type:entries[0].type,group:entries[0].group||entries[0].type},kind==='feed'?'bunny':entries[0].group||entries[0].type).ok,false);
}
const b=createRound('build',1);assert.equal(accept(b,{id:'a',type:'square'},'slot-1').ok,false);assert.equal(b.placed.length,0);
const shop=createRound('shop',1);assert.equal(accept(shop,{id:'x',type:'milk'},'bag').ok,false);assert.equal(accept(shop,{id:'a',type:'apple'},'bag').ok,true);assert.equal(accept(shop,{id:'b',type:'apple'},'bag').ok,true);assert.equal(accept(shop,{id:'c',type:'apple'},'bag').ok,false);assert.deepEqual(needed(shop),['bread']);
const tidy=createRound('tidy',0);assert.equal(accept(tidy,{id:'x',type:'book'},'toybox').ok,false);assert.equal(accept(tidy,{id:'a',type:'book'},'bookshelf').ok,true);assert.equal(accept(tidy,{id:'b',type:'book'},'bookshelf').ok,true);assert.equal(accept(tidy,{id:'c',type:'book'},'bookshelf').ok,false);
const garden=createRound('garden',0);assert.equal(accept(garden,{id:'w',type:'water'},'pot').ok,false);assert.equal(accept(garden,{id:'s',type:'seed'},'pot').ok,false);assert.equal(accept(garden,{id:'t',type:'soil'},'pot').ok,true);assert.equal(accept(garden,{id:'w',type:'water'},'pot').ok,false);assert.deepEqual(needed(garden),['seed','water','sun','wait']);
const bySize=createRound('sort',1);assert.equal(accept(bySize,{id:'small',type:'apple',group:'small'},'big').ok,false);assert.equal(accept(bySize,{id:'small',type:'apple',group:'small'},'small').ok,true);
const byUse=createRound('sort',2);assert.equal(accept(byUse,{id:'ball',type:'ball',group:'toy'},'food').ok,false);assert.equal(accept(byUse,{id:'ball',type:'ball',group:'toy'},'toy').ok,true);
// Unordered work accepts any matching open place, including repeated plates.
const table=createRound('table',2);
assert.equal(accept(table,{id:'p1',type:'plate'},'place-4').ok,true);
assert.equal(accept(table,{id:'p2',type:'plate'},'place-4').ok,false);
assert.equal(accept(table,{id:'c1',type:'cup'},'place-0').ok,false);
assert.equal(accept(table,{id:'c1',type:'cup'},'place-5').ok,true);
for(const kind of Object.keys(DISCOVERY))for(let level=0;level<3;level++){
 const r=createRound(kind,level),task=lesson(r);
 assert.equal(accept(r,{id:'unknown',type:'star'},task.targets[0].id).ok,false);
 if(task.ordered)assert.equal(accept(r,{id:'later',type:task.types[1]},task.targets[1].id).ok,false);
 const before=JSON.stringify(r);for(const type of task.types)discoveryTarget(r,type);assert.equal(JSON.stringify(r),before,'Hints must not change the round');
 for(let i=0;i<task.types.length;i++){
  const type=task.types[i],id=discoveryTarget(r,type);assert(id);assert.equal(accept(r,{id:'piece-'+i,type},id).ok,true);
 }
 assert(r.done);
}
const rainy=createRound('weather',2);
assert.equal(accept(rainy,{id:'boot',type:'boots'},'place-0').ok,true,'rain accessories may swap positions');
assert.equal(accept(rainy,{id:'hat',type:'sunhat'},'place-1').ok,false);
assert.equal(accept(rainy,{id:'umbrella',type:'umbrella'},'place-1').ok,true);
const space=createRound('spatial',2);assert.equal(accept(space,{id:'bear',type:'teddy'},'place-2').ok,false);
assert.equal(accept(space,{id:'bear',type:'teddy'},'place-0').ok,true);
const music=createRound('rhythm',1);assert.equal(accept(music,{id:'tap1',type:'bell'},'place-0').ok,false);
assert.equal(accept(music,{id:'tap1',type:'drum'},'place-0').ok,true);
assert.equal(accept(music,{id:'tap2',type:'drum'},'place-1').ok,true);
assert.equal(accept(music,{id:'tap3',type:'bell'},'place-2').done,true);
const picture=createRound('puzzle',2);assert.equal(accept(picture,{id:'tile',type:'puzzle-fish-0'},'place-1').ok,false);
const shades=createRound('colors',2);assert.equal(accept(shades,{id:'dark',type:'tile-dark'},'place-0').ok,false);
const bead=createRound('beads',1);assert.equal(accept(bead,{id:'square',type:'bead-square'},'place-0').ok,false);
const lines=JSON.parse(fs.readFileSync('web/arcade/kindergarten/voice-lines.json','utf8'));for(const id of Object.keys(lines))assert.ok(fs.statSync('web/arcade/kindergarten/assets/voice/'+id+'.mp3').size>1000);
for(const kind of Object.keys(DISCOVERY))for(let level=0;level<3;level++)assert(lines[instruction(createRound(kind,level))]);
console.log('Kindergarten: all 54 rounds, wrong/occupied targets, duplicates, ordered steps, repeated quantities, shade matching, pattern continuation, non-scoring hints and voice assets passed');
})().catch(e=>{console.error(e);process.exit(1)});
