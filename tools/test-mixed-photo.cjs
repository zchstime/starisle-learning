const assert=require('node:assert/strict'),{verify,recognition,plan,generatedPlan}=require('../server/learning/math.cjs');
const cases={'18+8×3':42,'36÷6÷3':2,'36-14÷7':34,'64÷8÷4':2,'24÷3×9':72,'12÷3+22':26,'70+8-29':49,'98-6×3':80,'36+16÷4':40,'42÷7×3':18,'30÷5×7':42,'89-7×8':33,'58-49+74':83,'12÷2×4':24,'3×3×6':54,'64÷8÷2':4,'40÷5÷4':2,'8×6-45':3,'55-52+31':34,'6×5+64':94,'23+66-30':59};
for(const [expression,answer] of Object.entries(cases))assert.equal(verify({expression}).answer,answer,expression);
for(const expression of ['1;process.exit()','1/0+2','2+3+4+5','(2+3)*4','1.5+2','100+2-2','4-9+6','9×12+1'])assert.throws(()=>verify({expression}),expression);
const qs=recognition({questions:Object.entries(cases).map(([expression,answer])=>({expression,studentAnswer:String(answer),confidence:1,evidence:expression}))});assert.equal(qs.length,21);assert.equal(plan(qs).tasks.length,6);
const raw={questions:plan(qs).tasks.map(q=>({expression:q.expression,answer:q.answer}))};assert.equal(generatedPlan(qs,raw).tasks.length,6);raw.questions[0].answer++;assert.throws(()=>generatedPlan(qs,raw));
// Existing records with only a/b/op remain supported; edited expression is authoritative.
assert.equal(verify({a:23,b:18,op:'+'}).answer,41);assert.equal(verify({a:23,b:18,op:'+',expression:'18+8×3'}).answer,42);
console.log('PASS 21 worksheet calculations, precedence, left association, unsafe/unsupported syntax, old records, mixed training and answer validation');
(async()=>{
 const raw={questions:[{expression:'18+8×3',studentAnswer:'42',confidence:.95,evidence:'18+8×3=42'},{expression:'2+?',studentAnswer:null,confidence:.2,evidence:'看不清'}],skippedCount:2};
 const ark=require('../server/providers/ark.cjs')({apiKey:'test'},async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(raw)}}]})}));
 const result=await ark.recognize({text:'test'});assert.equal(result.questions.length,1);assert.ok(result.recognitionNote.includes('3 道'));
 raw.questions=[];await assert.rejects(ark.recognize({text:'test'}),e=>e.code==='NO_SUPPORTED_QUESTIONS');
 console.log('PASS partial recognition retains valid questions and explains skipped items; unsupported-only has typed failure');
})().catch(e=>{console.error(e);process.exitCode=1;});
