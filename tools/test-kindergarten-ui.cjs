const assert=require('node:assert/strict'),fs=require('node:fs'),{build}=require('esbuild');
(async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');
 const bundle=(await build({entryPoints:['web/arcade/kindergarten/app.js'],bundle:true,write:false,format:'iife',plugins:[{name:'media-stubs',setup(b){
  b.onResolve({filter:/\/hero\.js$/},()=>({path:'hero',namespace:'stub'}));
  b.onResolve({filter:/\/audio\.js$/},()=>({path:'audio',namespace:'stub'}));
  b.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:args.path==='hero'?'export async function createHero(){return {animations:[]}}':`export const gardenAudio={enabled:true,volume:.5,setEnabled(v){this.enabled=v},setPaused(){},play(){},stop(){},tone(...args){(window.testNotes??=[]).push(args)},update(){},async unlock(){}};`}));
 }}]})).outputFiles[0].text;
 const errors=[];
 function make(saved){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(fs.readFileSync('web/arcade/kindergarten/index.html','utf8'),{url:'http://localhost/arcade/kindergarten/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
  w.Audio=class extends w.EventTarget{play(){return Promise.resolve()}pause(){}};
  w.HTMLElement.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});
  w.HTMLElement.prototype.hasPointerCapture=()=>false;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
  const timeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms)=>timeout(fn,ms===650||ms===1100?0:ms);
  w.eval(fs.readFileSync('web/arcade/vendor/matter.min.js','utf8'));
  if(saved)w.localStorage.setItem('starisle.kindergarten.guest.v1',saved);
  w.eval(bundle);return dom;
 }
 const wait=()=>new Promise(r=>setTimeout(r,25));
 const dom=make(JSON.stringify({feed:[0,1,2],shop:[0],unknown:[0]})),w=dom.window,d=w.document;
 const click=s=>{const e=d.querySelector(s);assert(e,s);e.click()};
 const state=()=>JSON.parse(w.starisleCompanionContext().attempt);
 const {DISCOVERY}=await import('data:text/javascript;base64,'+Buffer.from((await build({entryPoints:['web/arcade/kindergarten/discovery.js'],bundle:true,write:false,format:'esm'})).outputFiles[0].text).toString('base64'));
 assert.equal(d.querySelectorAll('[data-kind]').length,6);click('#shelf-next');assert.equal(d.querySelectorAll('[data-kind]').length,6);
 for(const kind of Object.keys(DISCOVERY)){
  if(!d.querySelector('.scene-card[data-kind="'+kind+'"]'))click('#shelf-next');
  click('.scene-card[data-kind="'+kind+'"]');await wait();
  for(let level=0;level<3;level++){
   const task=DISCOVERY[kind][level];assert.equal(state().level,level);assert(d.querySelector('#board').classList.contains('discovery'));
   assert([...d.querySelectorAll('[aria-label]')].every(e=>!e.getAttribute('aria-label').includes('undefined')));
   click('#show');assert.equal(state().placed.length,0,'demonstrations do not score');
   const first='[data-item="discovery-0"]',destination='[data-target="place-0"]';
   click('#pause');click(first);click(destination);assert.equal(state().placed.length,0,'pause blocks placements');click('#resume');
   if(kind==='rhythm')click('[data-type="bell"]');else{click(first);click('[data-target="place-1"]');}
   if(kind==='rhythm'&&task.types[0]==='bell'){click('#reset');await wait();}
   if(!task.reusable&&!task.targets[1].accepts&&(task.types[0]!==task.types[1]||task.ordered))assert.equal(state().placed.length,0,'wrong placement must not score');
   click('#reset');await wait();assert.equal(state().placed.length,0);
   for(let i=0;i<task.types.length;i++){
    if(task.reusable)click('[data-type="'+task.types[i]+'"]');else{click('[data-item="discovery-'+i+'"]');click('[data-target="place-'+i+'"]');}
    assert.equal(state().placed.length,i+1,kind+':'+level+':'+i);
    assert(d.querySelector('[data-target="place-'+i+'"]').disabled);
    if(!task.reusable){click('[data-item="discovery-'+i+'"]');assert.equal(state().placed.length,i+1);}
   }
   assert(state().done);await wait();assert.equal(d.querySelector('#celebrate').hidden,false);
   click('#next');await wait();
  }
  assert.equal(d.querySelector('#hub').hidden,false);
 }
 assert(d.querySelector('#shelf-next').disabled);click('#shelf-prev');assert(d.querySelector('.scene-card[data-kind="inset"]'));click('#shelf-prev');assert(d.querySelector('#shelf-prev').disabled);
 const saved=JSON.parse(w.localStorage.getItem('starisle.kindergarten.guest.v1'));
 assert.deepEqual(saved.feed,[0,1,2]);assert.deepEqual(saved.shop,[0]);
 for(const kind of Object.keys(DISCOVERY))assert.deepEqual(saved[kind],[0,1,2]);
 const reopened=make(JSON.stringify({...saved,rods:[0,99,'1',0]}));await wait();
 reopened.window.document.querySelector('#shelf-next').click();reopened.window.document.querySelector('[data-kind="rods"]').click();
 assert.equal(JSON.parse(reopened.window.starisleCompanionContext().attempt).level,1,'resume next unfinished level and filter corrupt progress');
 reopened.window.close();
 // Sound demonstrations never score; pause/reset/exit cancel queued notes.
 click('#shelf-next');click('#shelf-next');click('.scene-card[data-kind="rhythm"]');await wait();
 w.testNotes=[];click('#rhythm-play');await wait();assert.equal(w.testNotes.length,1);assert.equal(state().placed.length,0);
 click('#pause');const pausedNotes=w.testNotes.length;await new Promise(r=>setTimeout(r,760));assert.equal(w.testNotes.length,pausedNotes);click('#resume');
 click('#rhythm-play');click('#reset');await wait();const resetNotes=w.testNotes.length;await new Promise(r=>setTimeout(r,760));assert.equal(w.testNotes.length,resetNotes);assert.equal(state().placed.length,0);
 click('#sound');click('#show');await wait();assert.equal(state().placed.length,0);assert(d.querySelector('#goal .sound-pulse'));click('#back');
 const exitNotes=w.testNotes.length;await new Promise(r=>setTimeout(r,760));assert.equal(w.testNotes.length,exitNotes);
 click('.scene-card[data-kind="rhythm"]');click('[data-type="drum"]');await wait();assert.equal(state().placed.length,1);assert.equal(d.querySelector('#goal .sound-pulse'),null,'a delayed intro must not restart after the first tap');
 dom.window.close();assert.deepEqual(errors,[]);
 console.log('Kindergarten UI: all 36 discovery rounds, shelf navigation, hints, wrong placements, pause, reset, next, saved progress migration and resume passed');
})().catch(e=>{console.error(e);process.exit(1)});
