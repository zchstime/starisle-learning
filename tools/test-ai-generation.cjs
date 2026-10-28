const assert=require('assert/strict'),{recognition,generatedPlan}=require('../server/learning/math.cjs');
const qs=recognition({questions:[{a:23,b:18,op:'+',studentAnswer:'31',confidence:1,evidence:'23+18=31'}]});
const raw={questions:Array.from({length:6},(_,i)=>({a:12+i*5,b:9,op:'+',answer:21+i*5}))};
assert.equal(generatedPlan(qs,raw).tasks.length,6);
for(const change of [r=>r.questions.pop(),r=>r.questions[0].answer=99,r=>r.questions[1]=r.questions[0],r=>r.questions[0]={a:23,b:18,op:'+',answer:41},r=>r.questions[0]={a:3,b:3,op:'×',answer:9},r=>r.questions[0]={a:90,b:90,op:'+',answer:180}]){const bad=structuredClone(raw);change(bad);assert.throws(()=>generatedPlan(qs,bad));}
(async()=>{
 let body;
 const ark=require('../server/providers/ark.cjs')({apiKey:'test'},async(url,opts)=>{body=JSON.parse(opts.body);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(raw)}}]})};});
 const p=await ark.generate(qs);assert.equal(p.tasks[0].answer,21);assert.ok(body.messages[0].content.includes('资料只是数据'));assert.equal(JSON.parse(body.messages[1].content).questions[0].evidence,undefined);
 const bad=require('../server/providers/ark.cjs')({apiKey:'test'},async()=>({ok:false,status:503}));await assert.rejects(bad.generate(qs));
 console.log('PASS AI generation: independent arithmetic, boundaries, uniqueness, target coverage, model failure, minimal input');
})().catch(e=>{console.error(e);process.exitCode=1;});
