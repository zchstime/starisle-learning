const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const {PAPERS,beginPaper}=require('../qa/exam/Exam.js');
const buttons=[],texts=[];
function fake(){return {children:[],setPosition(){},getComponent(){return {setContentSize(){}};}};}
const kit={C:{cream:'cream',ink:'ink',teal:'teal',gold:'gold',blue:'blue',mint:'mint',muted:'muted',line:'line'},panel:fake,text(...args){texts.push(args[1]);return fake();},sprite:fake};
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/exam/ExamView.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{
 exports:mod.exports,require:id=>id.includes('/Motion')?{pageArrival(){},growBar(){},rewardPop(){}}:id==='cc'?{}:id.includes('Kit')?kit:id==='./Exam'?require('../qa/exam/Exam.js'):{},
 setInterval:()=>1,clearInterval(){},Date
});
const paper=PAPERS[0],attempt=beginPaper(paper),progress={exams:{attempt,records:{}},sound:false,save(){}};
const host={root:fake(),frames:{},progress,sounds:{setEnabled(){}},clear(){buttons.length=0;texts.length=0;},sound(){},map(){},btn(p,s,x,y,w,h,run){buttons.push({s,x,y,run});const n=fake();n.children=[fake()];return n;}};
const view=new mod.exports.ExamView(host);view.paper=paper;
const click=s=>{const b=buttons.find(b=>b.s===s);assert.ok(b,s);b.run();};
view.question();
assert.ok(!buttons.some(b=>/交卷/.test(b.s)));
assert.ok(!buttons.some(b=>b.s==='‹ 上一题'));
assert.ok(buttons.find(b=>b.s==='下一题 →').y===451);
attempt.answers[paper.questions[0].id]=paper.questions[0].answer;
click('下一题 →');assert.equal(view.index,1);click('‹ 上一题');assert.equal(view.index,0);
assert.equal(attempt.answers[paper.questions[0].id],paper.questions[0].answer);
view.index=paper.questions.length-1;view.question();click('答题总览 →');
assert.ok(texts.some(s=>String(s).includes('未答 19 题')));
assert.ok(!buttons.some(b=>b.s==='确认交卷'));
click('继续补答 →');assert.equal(view.index,1);
view.overview();click('准备交卷');assert.ok(texts.includes('还有 19 题未答，未答题计 0 分。'));
click('返回答题总览');assert.ok(buttons.some(b=>b.s==='继续补答 →'));
for(const q of paper.questions)attempt.answers[q.id]=q.answer;
attempt.marked=[paper.questions[3].id];view.overview();click('查看标记题 →');assert.equal(view.index,3);
view.overview();click('准备交卷');
let submitted=0;view.submit=()=>submitted++;click('确认交卷');assert.equal(submitted,1);
attempt.deadline=0;view.overview();assert.equal(submitted,2);
console.log('PASS exam navigation: bottom controls, no early-submit CTA, overview, missing/marked return, preserved answers, confirmation and expiry');
