const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const make=require('../server/saves.cjs');let record={revision:0,payload:null};const store={get:async()=>record,put:async(u,r,p)=>r!==record.revision?{...record,conflict:true}:(record={revision:r+1,payload:p})};
const origin='http://127.0.0.1:7459',handler=make({origin,auth:{identify:r=>r.headers.cookie?{id:'test',masked:'test',mode:'demo'}:null},store});
async function req(method,data,headers={}){let code,body;const r={url:'/api/save',method,headers:{host:'127.0.0.1:7459',origin,'content-type':'application/json',cookie:'yes',...headers},async *[Symbol.asyncIterator](){yield JSON.stringify(data);}};await handler(r,{writeHead:c=>code=c,end:t=>body=JSON.parse(t)});return {code,...body};}
(async()=>{
 assert.equal((await req('GET',null,{cookie:''})).code,401);assert.equal((await req('PUT',{}, {origin:'https://evil.test'})).code,403);
 assert.equal((await req('PUT',{revision:0,payload:{bad:'x'}})).code,400);
 const p={'starisle.adventure.v3':JSON.stringify({version:3,done:['math-1'],medals:[]}),'starisle.profile.v1':JSON.stringify({version:1,avatar:'fox',updatedAt:100})};
 assert.equal((await req('PUT',{revision:0,payload:p})).revision,1);assert.equal((await req('PUT',{revision:0,payload:p})).code,409);assert.deepEqual((await req('GET')).payload,p);
 assert.equal((await req('PUT',{revision:1,payload:{x:'a'.repeat(950000)}})).code,413);
 const win={addEventListener(){},dispatchEvent(){}};vm.runInNewContext(fs.readFileSync('web/auth/cloud.js','utf8'),{window:win,setInterval(){},setTimeout(){},clearTimeout(){}});
 const k='starisle.adventure.v3',a={[k]:JSON.stringify({version:3,done:['a'],medals:['m'],grade:1})},b={[k]:JSON.stringify({version:3,done:['b','a'],medals:['m'],grade:2})};
 const merged=JSON.parse(win.starisleCloud.merge(a,b)[k]);assert.deepEqual(merged.done,['a','b']);assert.deepEqual(merged.medals,['m']);assert.equal(merged.grade,2);assert.equal(win.starisleCloud.merge(a,{})[k],a[k]);
 const examA={[k]:JSON.stringify({version:3,done:[],medals:[],exams:{records:{paper:{best:100,latest:100,at:2}},attempt:{updatedAt:5,submitted:true}}})},examB={[k]:JSON.stringify({version:3,done:[],medals:[],exams:{records:{paper:{best:60,latest:60,at:3}},attempt:{updatedAt:4,submitted:false}}})};
 const ex=JSON.parse(win.starisleCloud.merge(examA,examB)[k]).exams;assert.equal(ex.records.paper.best,100);assert.equal(ex.records.paper.latest,60);assert.equal(ex.attempt.submitted,true);
 console.log('PASS cloud: authentication, origin, format, size, CAS conflicts, readback, additive progress/medal merge, local preferences');
})();
