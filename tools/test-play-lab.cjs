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
