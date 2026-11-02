const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {ISLAND_TASKS,islandTask,islandUnlocked,islandCorrect,cleanIsland,IslandAttempt}=require('../assets/scripts/adventure/Restoration.ts');
const {Progress,SAVE_KEY}=require('../assets/scripts/adventure/Progress.ts');
const {validate}=require('../server/saves.cjs');
const win={addEventListener(){},dispatchEvent(){}};
vm.runInNewContext(fs.readFileSync('web/auth/cloud.js','utf8'),{window:win,setInterval(){},setTimeout(){},clearTimeout(){}});
const merge=(a,b)=>JSON.parse(win.starisleCloud.merge({[SAVE_KEY]:JSON.stringify(a)},{[SAVE_KEY]:JSON.stringify(b)})[SAVE_KEY]);
const solutions={
 'garden.restore':[3,3,3,3,0,0], 'canal.restore':[5,5,1,1], 'observatory.restore':[6,6,6],
 'garden.visitors':[3,3,3,3,3,3], 'garden.design':[6,0,0,0,0,6],
 'canal.supplies':[5,5,5], 'canal.design':[5,3,1], 'observatory.sunny':[6,6,6,3], 'observatory.windy':[6,6,3],
};
let raw=null;const port={getItem:()=>raw,setItem:(_,value)=>raw=value};let p=new Progress(port);
assert.equal(Object.keys(p.island.records).length,0);assert.equal(islandUnlocked(p.island,islandTask('observatory.restore')),false);
const locked=new IslandAttempt(islandTask('observatory.restore'));locked.values=[6,6,6];locked.submit();assert.equal(p.saveIsland(locked),false);
const draft=new IslandAttempt(islandTask('garden.restore'));draft.change(0,1);draft.submit();draft.hinted=true;p.saveIsland(draft);
p=new Progress(port);const resumed=new IslandAttempt(draft.task,p.island.drafts[draft.task.id]);assert.deepEqual(resumed.values,[1,0,0,0,0,0]);assert.equal(resumed.attempts,1);assert.equal(resumed.hinted,true);
resumed.reset();assert.equal(resumed.attempts,1);assert.equal(resumed.hinted,true);assert.equal(resumed.change(-1,1),false);assert.equal(resumed.change(0,99),false);
resumed.values=solutions['garden.restore'];assert.ok(resumed.submit());assert.ok(p.saveIsland(resumed));
const first=p.island.records['garden.restore'].first;assert.equal(first.firstCorrect,false);assert.equal(first.hinted,true);
const before=p.points;assert.equal(resumed.submit(),false);p.saveIsland(resumed);assert.equal(p.points,before);assert.deepEqual(p.island.records['garden.restore'].first,first);
assert.equal(islandUnlocked(p.island,islandTask('observatory.restore')),false);
for(const t of ISLAND_TASKS){
 assert.ok(islandCorrect(t,solutions[t.id]),t.id+' solution');
 if(p.island.records[t.id])continue;
 assert.ok(islandUnlocked(p.island,t),t.id+' unlock');const a=new IslandAttempt(t);p.saveIsland(a);a.values=[...solutions[t.id]];
 assert.ok(a.submit());assert.ok(p.saveIsland(a));p=new Progress(port);
 assert.deepEqual(p.island.records[t.id].latest.values,solutions[t.id]);
}
assert.equal(Object.keys(p.island.records).length,9);assert.equal(p.points,900);assert.equal(p.experience,270);assert.equal(p.garden.trees,3);assert.equal(p.garden.today,3);
assert.deepEqual(p.done,[]);assert.equal(p.examAccess().unlocked,false);assert.equal(p.medalCount,0);
assert.ok(p.plantTree(5,2));p=new Progress(port);assert.equal(p.gardenSlots[5],2);
const replay=new IslandAttempt(islandTask('garden.restore'));p.saveIsland(replay);replay.values=[...solutions['garden.restore']];replay.submit();p.saveIsland(replay);
assert.equal(p.points,900);assert.equal(p.island.records['garden.restore'].first.hinted,true);assert.equal(p.island.records['garden.restore'].latest.hinted,false);
assert.ok(islandCorrect(islandTask('garden.design'),[4,0,4,0,4,0]));assert.ok(islandCorrect(islandTask('garden.design'),[2,2,2,2,2,2]));
for(const v of [[6,6], [6,5,1,0,0,0],[12,0,0,0,0,0],[3,3,3,2,0,0],[3,3,3,NaN,0,0]])assert.equal(islandCorrect(islandTask('garden.design'),v),false);
const cargo=new IslandAttempt(islandTask('canal.restore'));assert.equal(cargo.add(6),false);for(const n of [3,3,3,3])assert.ok(cargo.add(n));assert.equal(cargo.add(1),false);assert.equal(cargo.remove(-1),false);assert.ok(cargo.remove(0));
const full=JSON.parse(raw);validate({[SAVE_KEY]:raw});
const older=JSON.parse(JSON.stringify(full));older.island.drafts['garden.restore']={at:1,attempts:0,hinted:false,finished:false,values:[0,0,0,0,0,0]};
const joined=merge(older,full);assert.equal(joined.island.drafts['garden.restore'].finished,true);
assert.deepEqual(merge(older,full).island,merge(full,older).island);assert.deepEqual(merge(joined,joined).island,joined.island);
const left=JSON.parse(JSON.stringify(full)),right=JSON.parse(JSON.stringify(full));delete left.island.records['canal.design'];delete right.island.records['garden.design'];
assert.equal(Object.keys(cleanIsland(merge(left,right).island).records).length,9);
const tieA=JSON.parse(JSON.stringify(full)),tieB=JSON.parse(JSON.stringify(full));tieB.island.drafts['garden.design'].values=[4,4,4,0,0,0];
assert.deepEqual(merge(tieA,tieB).island,merge(tieB,tieA).island);
const corrupt=JSON.parse(JSON.stringify(full.island));corrupt.records['garden.restore'].latest.values=[999];delete corrupt.records['canal.restore'];corrupt.drafts['garden.design'].attempts=-1;
const cleaned=cleanIsland(corrupt);assert.equal(cleaned.records['garden.restore'],undefined);assert.equal(cleaned.records['observatory.restore'],undefined);assert.equal(cleaned.drafts['garden.design'],undefined);
assert.throws(()=>validate({[SAVE_KEY]:JSON.stringify({...full,island:{...full.island,drafts:{bad:full.island.drafts['garden.design']}}})}));
assert.throws(()=>validate({[SAVE_KEY]:JSON.stringify({...full,island:{...full.island,records:{'garden.restore':{first:{},latest:{}}}}})}));
let blocked=true,failedRaw=null;const failed=new Progress({getItem:()=>null,setItem:(_,value)=>{if(blocked)throw Error('disk');failedRaw=value;}});
const a=new IslandAttempt(islandTask('canal.restore'));a.values=[3,3,3,3];a.submit();assert.equal(failed.saveIsland(a),false);assert.equal(failed.failed,true);assert.equal(failed.points,100);
blocked=false;failed.save();assert.equal(failed.failed,false);assert.equal(JSON.parse(failedRaw).island.records['canal.restore'].first.attempts,1);
const legacy=new Progress({getItem:()=>JSON.stringify({version:3,done:['math.g2.c2.l1'],medals:[]}),setItem(){}});assert.equal(legacy.done.length,1);assert.equal(Object.keys(legacy.island.records).length,0);
console.log('PASS restoration: all 9 tasks, branching gates, tools, multiple solutions, draft/reload/reset evidence, unique rewards, garden integration, legacy isolation, storage failure, cloud merge/tombstones/ties, bounded validation');

// Exercise actual view callbacks: an interaction must preserve the page, hint and evidence.
class FakeNode {
 constructor(parent=null,name=''){this.parent=parent;this.name=name;this.children=[];this.isValid=true;this.components=new Map();if(parent)parent.children.push(this);}
 addComponent(Type){const c=new Type();this.components.set(Type,c);return c;}
 getComponent(Type){return this.components.get(Type);}
 removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
 destroy(){this.isValid=false;this.children.forEach(n=>n.destroy());}
}
class FakeLabel{constructor(){this.string='';}}
class FakeGraphics{constructor(){this.dots=0;}circle(){this.dots++;}fill(){}ellipse(){}moveTo(){}bezierCurveTo(){}lineTo(){}stroke(){}}
const kit={C:{},color:x=>x,node:(p,name)=>new FakeNode(p,name),panel:p=>new FakeNode(p),text:(p,value)=>{const n=new FakeNode(p,'text');n.addComponent(FakeLabel).string=value;return n;}};
let effectsEnabled=false;const effectCallbacks=[];
const fakeTween=target=>{const chain={to(){return chain;},call(fn){effectCallbacks.push({target,fn});return chain;},start(){return chain;}};return chain;};
const deps={'../ui/Motion':{pageArrival(){},reveal(){},motionAllowed:()=>effectsEnabled},'cc':{Node:FakeNode,Graphics:FakeGraphics,Label:FakeLabel,Vec3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},tween:fakeTween,Tween:{stopAllByTarget(){}}},'../ui/Kit':kit,'./Restoration':require('../assets/scripts/adventure/Restoration.ts'),'./WorldMotion':{burst(){}},'./PlayLabView':{},'./Progress':{}};
const viewModule={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/adventure/RestorationView.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:viewModule.exports,require:id=>deps[id]});
const root=new FakeNode(),vp=new Progress({getItem:()=>null,setItem(){}});let clears=0;
const h={root,progress:vp,clear(){clears++;for(const n of [...root.children]){n.removeFromParent();n.destroy();}},art(){},map(){},sound(){},btn(p,label,x,y,w,ht,fn){const n=new FakeNode(p,'Button:'+label);n.action=fn;n.bounds={x,y,w,h:ht};return n;}};
const view=new viewModule.exports.RestorationView(h);
const walk=n=>[n,...n.children.flatMap(walk)],buttons=label=>walk(root).filter(n=>n.name==='Button:'+label),click=(label,at=0)=>{const n=buttons(label)[at];assert.ok(n,label);n.action();};
const strings=()=>walk(root).map(n=>n.getComponent(FakeLabel)?.string).filter(Boolean);
view.start(islandTask('garden.restore'));const pageNode=root.children[0];
click('给我一点提示');click('＋1');click('＋1');click('安排好了 →');click('重新摆放');
assert.equal(clears,1);assert.equal(root.children[0],pageNode);assert.equal(pageNode.isValid,true);
assert.ok(strings().includes(islandTask('garden.restore').hint));assert.equal(vp.island.drafts['garden.restore'].hinted,true);assert.equal(vp.island.drafts['garden.restore'].attempts,1);
for(let i=0;i<4;i++)for(let n=0;n<3;n++)click('＋1',i);
assert.ok(strings().includes('4 组 × 每组 3 只 = 12 只'));assert.equal(clears,1);click('安排好了 →');assert.equal(clears,2);assert.equal(vp.island.records['garden.restore'].latest.attempts,2);
view.start(islandTask('canal.restore'));const cargoClears=clears;
click('5 桶');click('5 桶');click('1 桶');click('1 桶');click('3 桶');
assert.equal(clears,cargoClears);assert.deepEqual(Array.from(vp.island.drafts['canal.restore'].values),[5,5,1,1]);assert.ok(strings().includes('5 + 5 + 1 + 1 = 12 桶'));
assert.equal(walk(root).filter(n=>n.name.startsWith('CargoUnits:')).reduce((sum,n)=>sum+n.getComponent(FakeGraphics).dots,0),12);
click('',0);assert.ok(strings().includes('5 + 1 + 1 = 7 桶'));assert.ok(strings().includes('空位 4'));assert.equal(clears,cargoClears);
const {islandEquation}=deps['./Restoration'];assert.equal(islandEquation(islandTask('garden.design'),[3,2,0,0,0,0]),'3 + 2 = 5 只');assert.ok(!islandEquation(islandTask('garden.restore'),[0,0,0,0,0,0]).includes('12'));
console.log('PASS restoration interaction: stable page/hints, local refresh, preserved failed attempts, live equations, cargo capacity, visible unit counts and removal');

const {islandNextTask,emptyIsland}=deps['./Restoration'];
const freshIsland=emptyIsland();assert.equal(islandNextTask(freshIsland,'garden').id,'garden.restore');assert.equal(islandNextTask(freshIsland,'canal').id,'canal.restore');assert.equal(islandNextTask(freshIsland,'observatory'),undefined);
const allDone=cleanIsland(full.island);for(const f of ['garden','canal','observatory'])assert.equal(islandNextTask(allDone,f),undefined);
allDone.drafts['observatory.windy']={at:9999999999999,attempts:1,hinted:true,finished:false,values:[6]};assert.equal(islandNextTask(allDone,'observatory').id,'observatory.windy');
const choice=cleanIsland(full.island);choice.drafts['garden.design']={at:50,attempts:0,hinted:false,finished:false,values:[1,0,0,0,0,0]};choice.drafts['garden.visitors']={at:60,attempts:0,hinted:false,finished:false,values:[0,1,0,0,0,0]};assert.equal(islandNextTask(choice,'garden').id,'garden.visitors');
choice.drafts['garden.design'].at=60;assert.equal(islandNextTask(choice,'garden').id,'garden.design');
view.map();assert.equal(buttons('继续：把水送到花园').length,1);assert.equal(buttons('看看修复条件').length,1);
const cargoDraft=JSON.parse(JSON.stringify(vp.island.drafts['canal.restore']));click('继续：把水送到花园');assert.deepEqual(Array.from(view.attempt.values),cargoDraft.values);assert.equal(view.attempt.attempts,cargoDraft.attempts);
view.start(islandTask('garden.design'));click('＋1');click('给我一点提示');click('安排好了 →');view.map();assert.equal(buttons('继续：我的花坛布局').length,1);
const priorPoints=vp.points;click('继续：我的花坛布局');assert.equal(view.attempt.hinted,true);assert.equal(view.attempt.attempts,1);assert.deepEqual(Array.from(view.attempt.values),[1,0,0,0,0,0]);assert.equal(vp.points,priorPoints);
view.map();click('全部任务 · 已完成 1/3');assert.ok(strings().includes('变式 · 新朋友来做客'));
console.log('PASS island entry: branch gates, latest-draft priority, replay drafts, deterministic ties, direct resume with evidence intact, free choice after completion and full menu access');

// Landscape hit targets: all six beds stay independently operable with and without the tool.
view.start(islandTask('garden.restore'));
for(const label of ['＋1','－1']){assert.equal(buttons(label).length,6);for(const b of buttons(label)){assert.ok(b.bounds.w>=92);assert.ok(b.bounds.h>=92);}}
assert.equal(buttons('＋3').length,0);
const waterDone=new IslandAttempt(islandTask('canal.restore'));waterDone.values=[5,5,1,1];waterDone.submit();vp.saveIsland(waterDone);
view.start(islandTask('garden.design'));click('重新摆放');
for(const label of ['＋1','－1','＋3']){assert.equal(buttons(label).length,6);for(const b of buttons(label)){assert.ok(b.bounds.w>=92);assert.ok(b.bounds.h>=92);}}
click('＋3',5);click('＋3',0);click('－1',5);click('＋1',4);
assert.deepEqual(Array.from(view.attempt.values),[3,0,0,0,1,2]);
assert.equal(walk(root).filter(n=>n.name.startsWith('Fireflies:')).reduce((s,n)=>s+n.getComponent(FakeGraphics).dots,0),6);
assert.ok(strings().includes('花坛 6 · 2 只'));assert.ok(strings().includes('3 + 1 + 2 = 6 只'));
view.map();click('继续：我的花坛布局');assert.deepEqual(Array.from(view.attempt.values),[3,0,0,0,1,2]);
console.log('PASS landscape garden: six independent beds, large hit targets before/after tool unlock, exact unit dots, second-row controls, equation and resume');

// Cargo controls and support actions remain separate, large and evidence-preserving.
view.start(islandTask('canal.restore'));
for(const label of ['1 桶','3 桶','5 桶','给我一点提示','重新摆放','先回岛，稍后继续','装好了，试航 →']){const b=buttons(label)[0];assert.ok(b,label);assert.ok(b.bounds.h>=92,label);}
const hintBounds=buttons('给我一点提示')[0].bounds,resetBounds=buttons('重新摆放')[0].bounds;assert.ok(hintBounds.y+hintBounds.h<resetBounds.y);assert.ok(resetBounds.y+resetBounds.h<=390);
click('5 桶');click('5 桶');click('3 桶');click('3 桶');click('1 桶');
assert.deepEqual(Array.from(view.attempt.values),[5,5,3,3]);assert.ok(strings().includes('船舱满了，点下面的物资取回，再换个组合。'));
click('给我一点提示');click('装好了，试航 →');const cargoErrors=view.attempt.attempts;assert.ok(cargoErrors>0);
click('重新摆放');assert.deepEqual(Array.from(view.attempt.values),[]);assert.equal(view.attempt.hinted,true);assert.equal(view.attempt.attempts,cargoErrors);assert.ok(strings().includes(islandTask('canal.restore').hint));
click('3 桶');click('先回岛，稍后继续');click('继续：把水送到花园');assert.deepEqual(Array.from(view.attempt.values),[3]);assert.equal(view.attempt.hinted,true);assert.equal(view.attempt.attempts,cargoErrors);
console.log('PASS cargo touch: large loading/support actions, separated hint/reset targets, full-boat refusal, reset and resume preserve evidence');

const {islandCargoComparison}=deps['./Restoration'],creation=islandTask('canal.design');
assert.equal(islandCargoComparison(islandTask('canal.restore'),[3,3,3,3]),'');
assert.equal(islandCargoComparison(creation,[5,5]),'');
assert.ok(islandCargoComparison(creation,[3,3,3]).includes('你的方案：3 + 3 + 3 = 9 桶 · 3 箱'));
assert.ok(islandCargoComparison(creation,[5,3,1],[3,3,3]).includes('不同的水箱组合'));
const prior=[5,3,1];assert.ok(islandCargoComparison(creation,[1,5,3],prior).includes('相同的水箱组合'));assert.deepEqual(prior,[5,3,1]);
assert.ok(islandCargoComparison(creation,[5,1,1,1,1],[3,3,3]).includes('5 箱'));
view.start(creation);for(let i=0;i<3;i++)click('3 桶');click('装好了，试航 →');assert.ok(strings().some(s=>s.includes('你的方案：3 + 3 + 3')));
const creationPoints=vp.points,creationFirst=JSON.stringify(vp.island.records[creation.id].first);
view.start(creation);click('5 桶');click('3 桶');click('1 桶');click('先回岛，稍后继续');click('继续：试试另一种装法');click('装好了，试航 →');
assert.ok(strings().some(s=>s.includes('上次：3 + 3 + 3')&&s.includes('这次：5 + 3 + 1')&&s.includes('不同的水箱组合')));
assert.equal(vp.points,creationPoints);assert.equal(JSON.stringify(vp.island.records[creation.id].first),creationFirst);
view.start(creation);click('1 桶');click('5 桶');click('3 桶');click('装好了，试航 →');assert.ok(strings().some(s=>s.includes('相同的水箱组合')));assert.equal(vp.points,creationPoints);
console.log('PASS creation comparison: own solutions only, order-insensitive combinations, box counts, resumed replay, first evidence and unique rewards preserved');

const {islandFeedback}=deps['./Restoration'];
assert.equal(islandFeedback(islandTask('canal.restore'),[5]),'还差 7 桶水，继续调整看看。');
assert.equal(islandFeedback(islandTask('canal.restore'),[1,1,1,1]),'还差 8 桶水，船舱已满，取回一箱再换个组合。');
assert.equal(islandFeedback(islandTask('canal.restore'),[5,5,3]),'多了 1 桶水，取回一些再试试。');
assert.equal(islandFeedback(islandTask('observatory.sunny'),[6,6]),'还差 9 格能量，继续调整看看。');
assert.equal(islandFeedback(islandTask('observatory.restore'),[6,3,1]),'还差 8 格能量，船舱已满，取回一块再换个组合。');
assert.equal(islandFeedback(islandTask('observatory.sunny'),[6,6,6,6]),'多了 3 格能量，取回一些再试试。');
assert.ok(islandFeedback(islandTask('garden.restore'),[3,0,0,0,0,0]).includes('9 只星萤'));
assert.ok(islandFeedback(islandTask('garden.restore'),[6,6,0,0,0,0]).includes('每个用到的花坛'));
view.start(islandTask('canal.restore'));click('重新摆放');for(let i=0;i<4;i++)click('1 桶');click('装好了，试航 →');
assert.ok(strings().includes('还差 8 桶水，船舱已满，取回一箱再换个组合。'));
click('',0);click('5 桶');click('装好了，试航 →');assert.ok(strings().includes('还差 4 桶水，船舱已满，取回一箱再换个组合。'));
console.log('PASS quantity feedback: water/energy/firefly units, full-boat guidance, exact difference after replacement, grouping feedback preserved');

const {islandGardenComparison}=deps['./Restoration'],gardenCreation=islandTask('garden.design');
assert.equal(islandGardenComparison(islandTask('garden.restore'),[3,3,3,3,0,0]),'');
assert.equal(islandGardenComparison(gardenCreation,[6,5,1,0,0,0]),'');
assert.ok(islandGardenComparison(gardenCreation,[6,6,0,0,0,0]).includes('2 组 × 每组 6 只 = 12 只'));
assert.ok(islandGardenComparison(gardenCreation,[0,0,6,6,0,0],[6,6,0,0,0,0]).includes('位置变了'));
assert.ok(islandGardenComparison(gardenCreation,[6,6,0,0,0,0],[6,6,0,0,0,0]).includes('相同的花坛布局'));
assert.ok(islandGardenComparison(gardenCreation,[4,4,4,0,0,0],[6,6,0,0,0,0]).includes('换了一种平均分法'));
view.start(gardenCreation);click('重新摆放');for(const i of [0,0,1,1])click('＋3',i);click('安排好了 →');
assert.ok(strings().some(s=>s.includes('你的花坛：2 组')));
const gardenFirst=JSON.stringify(vp.island.records[gardenCreation.id].first),gardenPoints=vp.points;
view.start(gardenCreation);for(const i of [2,2,3,3])click('＋3',i);click('先回岛，稍后继续');click('继续：我的花坛布局');click('安排好了 →');
assert.ok(strings().some(s=>s.includes('位置变了')));assert.deepEqual(Array.from(vp.island.records[gardenCreation.id].latest.values),[0,0,6,6,0,0]);
view.start(gardenCreation);for(const i of [0,1,2,3])click('＋3',i);click('安排好了 →');
assert.ok(strings().some(s=>s.includes('这次：4 组')&&s.includes('上次：2 组')&&s.includes('换了一种平均分法')));
assert.equal(vp.points,gardenPoints);assert.equal(JSON.stringify(vp.island.records[gardenCreation.id].first),gardenFirst);
console.log('PASS garden comparison: own equal groupings only, position vs grouping vs identical layout, resumed replay, latest layout saved, first evidence and unique reward preserved');

assert.ok(strings().some(s=>s.includes('这轮提交 1 次 · 未用游戏提示')));
for(const label of ['看看我的小岛','今天先到这里'])assert.ok(buttons(label)[0].bounds.h>=92);
view.start(islandTask('canal.supplies'));click('装好了，试航 →');click('给我一点提示');click('重新摆放');
for(let i=0;i<3;i++)click('5 桶');click('装好了，试航 →');
assert.ok(strings().some(s=>s.includes('这轮提交 2 次 · 使用过提示')));
const completionPoints=vp.points,completionRecord=JSON.stringify(vp.island.records['canal.supplies']);
vp.failed=true;view.finish();assert.ok(strings().includes('本机保存未成功，请点下面的「重试保存」。'));assert.ok(!strings().some(s=>s.includes('你的尝试已记录')));
click('重试保存');assert.equal(vp.failed,false);assert.ok(strings().some(s=>s.includes('这轮提交 2 次 · 使用过提示')));
assert.equal(vp.points,completionPoints);assert.equal(JSON.stringify(vp.island.records['canal.supplies']),completionRecord);
let restExits=0;h.map=()=>restExits++;click('今天先到这里');assert.equal(restExits,1);assert.equal(vp.points,completionPoints);
click('看看我的小岛');assert.equal(view.attempt,null);assert.ok(buttons('看看探索记录').length);
console.log('PASS completion flow: explicit per-round attempts and hint use, readable exits, save-failure priority/retry, rest/map navigation without extra rewards');

view.start(islandTask('canal.supplies'));for(let i=0;i<3;i++)click('5 桶');click('装好了，试航 →');view.map();
const recordsBeforeViewing=JSON.stringify(vp.island.records),pointsBeforeViewing=vp.points;
click('看看探索记录');
assert.ok(strings().some(s=>s.includes('提交 2 次 · 使用过提示')));
assert.ok(strings().some(s=>s.includes('提交 1 次 · 未用游戏提示')));
assert.ok(strings().includes('变式 · 给居民送补给'));assert.ok(strings().includes('创作 · 我的花坛布局'));
assert.ok(strings().includes('还没有完成'));assert.ok(!strings().some(s=>s.includes('独立完成')));
assert.ok(strings().some(s=>s.includes('未用游戏提示，不代表没有其他帮助')));
assert.equal(JSON.stringify(vp.island.records),recordsBeforeViewing);assert.equal(vp.points,pointsBeforeViewing);
assert.equal(vp.island.records['canal.supplies'].first.attempts,2);assert.equal(vp.island.records['canal.supplies'].first.hinted,true);
assert.equal(vp.island.records['canal.supplies'].latest.attempts,1);assert.equal(vp.island.records['canal.supplies'].latest.hinted,false);
console.log('PASS exploration evidence: first/latest round counts and hints, phase labels, no unsupported independence claim, read-only records and rewards');

view.start(gardenCreation);assert.ok(strings().some(s=>s.startsWith('三格分组器：')));
click('＋3',0);click('＋1',0);click('＋1',0);const toolPoints=vp.points;
click('＋3',0);assert.equal(view.attempt.values[0],5);assert.ok(strings().some(s=>s.includes('最多还能放 1 只')));
click('＋1',0);click('＋3',0);assert.ok(strings().some(s=>s.includes('已放满 6 只')));
click('＋3',1);click('＋1',1);click('＋3',2);assert.ok(strings().some(s=>s.includes('只剩 2 只星萤待安排')));assert.equal(view.attempt.values[2],0);
click('＋1',2);click('＋1',2);click('＋3',3);assert.ok(strings().some(s=>s.includes('星萤已经全部安排好了')));
assert.equal(view.attempt.attempts,0);assert.equal(view.attempt.hinted,false);assert.equal(vp.points,toolPoints);
click('先回岛，稍后继续');click('继续：我的花坛布局');assert.deepEqual(Array.from(view.attempt.values),[6,4,2,0,0,0]);assert.equal(view.attempt.attempts,0);
click('－1',2);click('－1',2);click('－1',2);assert.ok(strings().includes('这个花坛已经空了。'));
console.log('PASS grouping tool guidance: unlocked instructions, bed capacity vs remaining total, no partial group placement, manual adjustment, no answer/hint/reward changes and resume');

effectsEnabled=true;view.start(gardenCreation);click('重新摆放');
const rings=()=>walk(root).filter(n=>n.name.startsWith('Arriving:')||n.name.startsWith('Leaving:'));
click('＋3',0);assert.equal(rings().length,3);assert.ok(rings().every(n=>n.name.startsWith('Arriving:')));
const initialRings=rings();click('＋3',0);assert.equal(rings().length,3);assert.ok(initialRings.every(n=>!n.isValid));assert.equal(view.attempt.values[0],6);
click('＋3',0);assert.equal(rings().length,0);assert.equal(view.attempt.values[0],6);
click('－1',0);assert.equal(rings().length,1);assert.equal(rings()[0].name,'Leaving:5');assert.equal(view.attempt.values[0],5);
click('给我一点提示');assert.equal(rings().length,0);click('＋1',0);assert.equal(rings().length,1);
const lastEffect=effectCallbacks.at(-1);lastEffect.fn();assert.equal(lastEffect.target.isValid,false);
effectsEnabled=false;click('－1',0);assert.equal(rings().length,0);assert.equal(view.attempt.values[0],5);
assert.equal(view.attempt.attempts,0);click('先回岛，稍后继续');click('继续：我的花坛布局');assert.equal(rings().length,0);assert.equal(view.attempt.values[0],5);
console.log('PASS group effects: three simultaneous arrivals, exact departure slot, rapid refresh cleanup, no effect on rejected actions/hint redraw/resume, bounded lifetime and reduced motion');

effectsEnabled=true;view.start(islandTask('canal.restore'));click('重新摆放');
for(const label of ['5 桶','3 桶','1 桶'])click(label);
const cargoMarks=()=>walk(root).filter(n=>n.name.startsWith('CargoRemoved:'));
const removalPoints=vp.points,removalAttempts=view.attempt.attempts,removalHint=view.attempt.hinted;
click('',1);assert.deepEqual(Array.from(view.attempt.values),[5,1]);assert.equal(cargoMarks().length,1);assert.equal(cargoMarks()[0].name,'CargoRemoved:1');
assert.ok(strings().includes('−3 桶'));assert.ok(strings().some(s=>s.includes('取回第 2 箱的 3 桶水；后面的物资向前排列，现在共 6 桶')));
const priorMark=cargoMarks()[0];click('',0);assert.equal(priorMark.isValid,false);assert.deepEqual(Array.from(view.attempt.values),[1]);assert.ok(strings().includes('−5 桶'));assert.equal(cargoMarks().length,1);
click('',0);assert.deepEqual(Array.from(view.attempt.values),[]);assert.ok(strings().some(s=>s.includes('空位已腾出，现在共 0 桶')));
const cargoLastEffect=effectCallbacks.at(-1);cargoLastEffect.fn();assert.equal(cargoLastEffect.target.isValid,false);
click('3 桶');assert.equal(cargoMarks().length,0);effectsEnabled=false;click('',0);assert.equal(cargoMarks().length,0);assert.ok(strings().some(s=>s.includes('取回第 1 箱的 3 桶水')));
assert.equal(view.attempt.attempts,removalAttempts);assert.equal(view.attempt.hinted,removalHint);assert.equal(vp.points,removalPoints);
click('先回岛，稍后继续');click('继续：把水送到花园');assert.equal(cargoMarks().length,0);assert.deepEqual(Array.from(view.attempt.values),[]);
console.log('PASS cargo removal: original slot/value cue, compacted quantities, rapid cleanup, empty last slot, timed removal, reduced motion, unchanged evidence/rewards and resume');
view.start(islandTask('observatory.restore'));click('星灯 6 格');click('3 格');click('',0);
assert.deepEqual(Array.from(view.attempt.values),[3]);assert.ok(strings().some(s=>s.includes('取回第 1 块的 6 格能量；后面的物资向前排列，现在共 3 格')));

view.start(islandTask('observatory.restore'));click('重新摆放');view.map();click('继续：点亮观星台');
assert.ok(strings().some(s=>s.startsWith('花园送来的星灯：每块有 6 格能量，占 1 个船位')));
click('星灯 6 格');click('3 格');
assert.deepEqual(Array.from(view.attempt.values),[6,3]);assert.equal(walk(root).filter(n=>n.name.startsWith('StarLamp:')).length,1);
assert.ok(strings().includes('星灯 6 格'));assert.ok(strings().includes('已装 9 / 18 格 · 船舱 2 / 3'));
assert.equal(walk(root).filter(n=>n.name.startsWith('CargoUnits:')).reduce((s,n)=>s+n.getComponent(FakeGraphics).dots,0),9);
click('星灯 6 格');assert.ok(strings().some(s=>s.includes('占用 1 个船位；还剩 0 个位置')));click('星灯 6 格');assert.equal(view.attempt.values.length,3);
click('',0);assert.equal(walk(root).filter(n=>n.name.startsWith('StarLamp:')).length,1);assert.deepEqual(Array.from(view.attempt.values),[3,6]);
view.map();click('继续：点亮观星台');assert.equal(walk(root).filter(n=>n.name.startsWith('StarLamp:')).length,1);
view.start(islandTask('canal.restore'));click('重新摆放');click('5 桶');assert.equal(walk(root).filter(n=>n.name.startsWith('StarLamp:')).length,0);
console.log('PASS star lamp identity: garden origin, one slot/six units, exact dot counts, ordinary cargo distinction, capacity, removal and resume');

view.map();assert.equal(buttons('选择天气航线').length,0);
const repairedObservatory=new IslandAttempt(islandTask('observatory.restore'));repairedObservatory.values=[6,6,6];repairedObservatory.submit();vp.saveIsland(repairedObservatory);
const weatherPoints=vp.points;view.map();assert.equal(buttons('选择天气航线').length,1);click('选择天气航线');
assert.ok(strings().includes('晴天航线：21 格能量，最多 4 块　｜　有风的航线：15 格能量，最多 3 块'));assert.equal(view.attempt,null);
assert.equal(vp.island.drafts['observatory.sunny'],undefined);assert.equal(vp.island.drafts['observatory.windy'],undefined);
click('开始 →',1);assert.equal(view.attempt.task.id,'observatory.windy');click('星灯 6 格');click('先回岛，稍后继续');
assert.equal(buttons('选择天气航线').length,0);click('继续：有风的航线');assert.deepEqual(Array.from(view.attempt.values),[6]);
click('星灯 6 格');click('3 格');click('装好了，试航 →');view.map();assert.equal(buttons('选择天气航线').length,1);
click('选择天气航线');click('开始 →');assert.equal(view.attempt.task.id,'observatory.sunny');assert.equal(view.attempt.task.limit,4);
assert.equal(vp.points,weatherPoints+100);assert.equal(vp.island.records['observatory.windy'].first.hinted,false);
console.log('PASS weather choice: repair gate, side-by-side conditions, no auto-started route, windy-first choice, draft priority, free choice after completion, rules and rewards preserved');

// Enumerate unordered arrangements: moving beds or reordering cargo is not a new mathematical solution.
const solutionCounts={};
for(const task of ISLAND_TASKS){
 const units=task.kind==='groups'?[0,1,2,3,4,5,6]:[...task.units].sort((a,b)=>a-b),limit=task.kind==='groups'?6:task.limit;
 let count=0;
 const visit=(values,start)=>{if(islandCorrect(task,values))count++;if(values.length===limit)return;for(let i=start;i<units.length;i++)visit([...values,units[i]],i);};
 visit([],0);solutionCounts[task.id]=count;assert.ok(count>0,task.id+' is solvable');
 if(task.phase==='创作')assert.ok(count>1,task.id+' must have genuinely different groupings/combinations');
}
assert.equal(solutionCounts['observatory.windy'],1);assert.equal(solutionCounts['garden.design'],4);assert.equal(solutionCounts['canal.design'],4);
assert.equal(islandTask('observatory.windy').phase,'变式');
view.place('observatory');assert.ok(strings().includes('变式 · 有风的航线'));assert.ok(!strings().includes('创作 · 有风的航线'));
view.evidence();assert.ok(strings().includes('变式 · 有风的航线'));assert.equal(vp.island.records['observatory.windy'].first.values.reduce((a,b)=>a+b,0),15);
console.log('PASS solution audit: unordered valid solutions',JSON.stringify(solutionCounts));
