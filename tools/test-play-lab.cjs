// Run test-v2 first to compile the current pure modules.
const assert=require('assert/strict'),vm=require('vm'),fs=require('fs');
const {labTasks,LAB_IDS,GIFTS}=require('../qa/v2-test/PlayLab.js'),{Progress,SAVE_KEY}=require('../qa/v2-test/Progress.js');
assert.equal(LAB_IDS.size,24);
for(const subject of ['english','chinese'])for(let g=1;g<=6;g++)for(const t of labTasks(subject,g)){
 if(t.kind==='pairs'){assert.equal(t.pairs.length,3);assert.equal(new Set(t.pairs.map(p=>p[1])).size,3);}
 if(t.kind==='poem')assert.ok(t.answer.every(a=>t.words.includes(a)));
 if(t.kind==='dialogue')for(const l of t.lines){assert.ok(l.answers[l.correct]);assert.equal(new Set(l.answers).size,l.answers.length);}
}
let data=null;const store={getItem:()=>data,setItem:(k,v)=>data=v};let p=new Progress(store);assert.equal(p.balance,0);assert.equal(p.redeem('sprout'),false);
for(const id of [...LAB_IDS].slice(0,2)){assert.equal(p.completeLab(id),true);assert.equal(p.completeLab(id),false);}
assert.equal(p.points,200);const xp=p.experience;assert.equal(p.redeem('sprout'),true);assert.equal(p.balance,0);assert.equal(p.points,200);assert.equal(p.experience,xp);assert.equal(p.redeem('sprout'),false);
p=new Progress(store);assert.equal(p.equippedGift,'sprout');assert.equal(p.balance,0);assert.equal(p.labDone.length,2);
// Concurrent device gift unions cannot produce negative balance or keep unaffordable gifts.
const s=JSON.parse(data);s.gifts=GIFTS.map(g=>g.id);data=JSON.stringify(s);p=new Progress(store);assert.deepEqual(p.gifts,['sprout']);assert.equal(p.balance,0);
const window={addEventListener(){}};vm.runInNewContext(fs.readFileSync('web/auth/cloud.js','utf8'),{window,setInterval(){},setTimeout(){},clearTimeout(){}});
const a={version:3,done:[],medals:[],labDone:['a'],gifts:['sprout']},b={...a,labDone:['b'],gifts:['moon']};const m=JSON.parse(window.starisleCloud.merge({[SAVE_KEY]:JSON.stringify(a)},{[SAVE_KEY]:JSON.stringify(b)})[SAVE_KEY]);assert.deepEqual(m.labDone,['a','b']);assert.deepEqual(m.gifts,['sprout','moon']);
console.log('PASS 24 enrichment tasks; unique rewards, old save defaults, redemption, reload, experience retention, offline conflict budget and cloud union');
// Garden growth is derived from unique completions; daily care includes reviews.
let gardenRaw=null;
const gardenStore={getItem:()=>gardenRaw,setItem:(_,v)=>gardenRaw=v};
const garden=new Progress(gardenStore),ids=[...LAB_IDS];
for(const id of ids.slice(0,4))garden.completeLab(id);
assert.equal(garden.garden.today,3);assert.equal(garden.garden.trees,1);assert.equal(garden.garden.days,1);
const points=garden.points;garden.completeLab(ids[0]);assert.equal(garden.points,points);assert.equal(garden.garden.today,3);
assert.deepEqual(new Progress(gardenStore).garden,garden.garden);
const past=JSON.parse(gardenRaw);past.care=Array.from({length:7},(_,i)=>`2020-01-${String(i*2+1).padStart(2,'0')}|${ids[0]}`);
past.care.push('bad',null,'2020-02-31|'+ids[0],'2020-01-01|unknown');gardenRaw=JSON.stringify(past);
const returning=new Progress(gardenStore);assert.equal(returning.garden.days,7);assert.equal(returning.garden.keepsakes,1);assert.equal(returning.garden.today,0);assert.equal(returning.garden.trees,1);
assert.equal(returning.completeLab(ids[0]),false);assert.equal(returning.garden.today,1);assert.equal(returning.points,points);
const merged=JSON.parse(window.starisleCloud.merge({[SAVE_KEY]:JSON.stringify({...a,care:['2020-01-01|'+ids[0]]})},{[SAVE_KEY]:JSON.stringify({...b,care:['2020-01-03|'+ids[1]]})})[SAVE_KEY]);
assert.equal(merged.care.length,2);
console.log('PASS garden: unique trees, daily cap, review care, reload, nonconsecutive seven days, invalid records and cloud union');
// Child-directed placement: no points spent; moves conserve inventory.
let layoutRaw=null;const layoutStore={getItem:()=>layoutRaw,setItem:(_,v)=>layoutRaw=v};
const builder=new Progress(layoutStore);
assert.equal(builder.plantTree(0,0),false);
for(const id of ids.slice(0,6))builder.completeLab(id);
assert.equal(builder.gardenSlots.filter(v=>v>=0).length,0);
assert.equal(builder.plantTree(7,2),true);assert.equal(builder.plantTree(2,1),true);
assert.equal(builder.plantTree(0,0),false);
const builderPoints=builder.points;
assert.equal(builder.moveTree(7,1),true);assert.equal(builder.gardenSlots[7],-1);
assert.equal(builder.moveTree(1,2),true);assert.equal(builder.gardenSlots[2],2);
assert.equal(builder.plantTree(2,0),true);assert.equal(builder.points,builderPoints);
assert.equal(builder.moveTree(7,0),false);assert.equal(builder.plantTree(8,0),false);assert.equal(builder.plantTree(1,9),false);
assert.deepEqual(new Progress(layoutStore).gardenSlots,builder.gardenSlots);
const older={slots:[0,-1,-1,-1,-1,-1,-1,-1],updatedAt:10},newer={slots:[-1,1,-1,-1,-1,-1,-1,-1],updatedAt:20};
const mergeLayouts=(x,y)=>JSON.parse(window.starisleCloud.merge({[SAVE_KEY]:JSON.stringify({...a,gardenLayout:x})},{[SAVE_KEY]:JSON.stringify({...b,gardenLayout:y})})[SAVE_KEY]).gardenLayout;
assert.deepEqual(mergeLayouts(older,newer),newer);assert.deepEqual(mergeLayouts(newer,older),newer);
assert.deepEqual(mergeLayouts({...older,updatedAt:20},newer),mergeLayouts(newer,{...older,updatedAt:20}));
const legacyGarden=new Progress({getItem:()=>JSON.stringify({version:3,labDone:ids.slice(0,6)}),setItem(){}});
assert.equal(legacyGarden.gardenSlots.filter(v=>v>=0).length,2);
console.log('PASS garden design: sapling inventory, planting, restyling, swap/move, bounds, no spending, persistence, legacy garden and deterministic cloud conflicts');
// Decorative economy: deterministic price, no duplicate spend, ownership gates placement.
let giftRaw=null;const giftStore={getItem:()=>giftRaw,setItem:(_,v)=>giftRaw=v};const collector=new Progress(giftStore);
assert.equal(collector.setWish('unknown'),false);assert.equal(collector.setWish('cloud-airship'),true);
assert.equal(collector.placeGift('star-lantern',0),false);
for(const id of ids.slice(0,18))collector.completeLab(id);
const collectorXP=collector.experience;
assert.equal(collector.redeem('star-lantern'),true);assert.equal(collector.balance,1700);
assert.equal(collector.redeem('star-lantern'),false);assert.equal(collector.balance,1700);
assert.equal(collector.redeem('moon-telescope'),true);assert.equal(collector.redeem('cloud-airship'),true);
assert.equal(collector.balance,0);assert.equal(collector.experience,collectorXP);assert.equal(collector.wishGift,'');assert.equal(collector.equippedGift,'');
assert.equal(collector.placeGift('star-lantern',0),true);assert.equal(collector.placeGift('moon-telescope',1),true);
assert.equal(collector.placeGift('star-lantern',1),true);assert.deepEqual(collector.displayedGifts,['moon-telescope','star-lantern','']);
assert.equal(collector.placeGift('cloud-airship',1),true);assert.deepEqual(collector.displayedGifts,['moon-telescope','cloud-airship','']);
assert.ok(collector.gifts.includes('star-lantern'));assert.equal(collector.placeGift('',1),true);assert.equal(collector.placeGift('sun',0),false);assert.equal(collector.placeGift('star-lantern',3),false);
assert.deepEqual(new Progress(giftStore).displayedGifts,collector.displayedGifts);assert.equal(new Progress(giftStore).balance,0);
const displayA={slots:['star-lantern','',''],updatedAt:1},displayB={slots:['','star-lantern',''],updatedAt:2};
const mergeDisplay=(x,y)=>JSON.parse(window.starisleCloud.merge({[SAVE_KEY]:JSON.stringify({...a,giftDisplay:x})},{[SAVE_KEY]:JSON.stringify({...b,giftDisplay:y})})[SAVE_KEY]).giftDisplay;
assert.deepEqual(mergeDisplay(displayA,displayB),displayB);assert.deepEqual(mergeDisplay(displayB,displayA),displayB);
assert.deepEqual(mergeDisplay({...displayA,updatedAt:2},displayB),mergeDisplay(displayB,{...displayA,updatedAt:2}));
const malformed=JSON.parse(giftRaw);malformed.giftDisplay.slots=['star-lantern','star-lantern','unknown'];giftRaw=JSON.stringify(malformed);assert.deepEqual(new Progress(giftStore).displayedGifts,['star-lantern','','']);
console.log('PASS gift economy: prices, wishlist, duplicate redemption, permanent collection, ownership checks, swapping, retrieval, reload, XP retention, deterministic cloud layout');
