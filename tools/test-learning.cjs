const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {verify,recognition,plan}=require('../server/learning/math.cjs');
(async()=>{
 assert.equal(verify({a:23,b:18,op:'+'}).answer,41);assert.throws(()=>verify({a:5,b:0,op:'÷'}));assert.throws(()=>verify({a:9,b:12,op:'×'}));assert.throws(()=>recognition({questions:[{a:1,b:2,op:'+',studentAnswer:'<script>'}]}));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starisle-learning-test-'));
 const store=await require('../server/learning/store.cjs')({dir});
 const qs=recognition({questions:[{a:23,b:18,op:'+',studentAnswer:'31',evidence:'23 + 18 = 31',confidence:1}]});
 assert.equal(plan(qs).tasks.length,6);
 let calls=0;const server=http.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const handler=require('../server/learning/http.cjs')({origin,dir,store,auth:{identify:r=>r.headers.cookie?{id:r.headers.cookie}:null},ark:{recognize:async()=>{calls++;return {questions:qs,model:'test'};}}});server.on('request',(req,res)=>handler.handle(req,res));
 const request=async(route,method='GET',body,user='alice',foreign=false)=>{const r=await fetch(origin+'/api/learning/'+route,{method,headers:{cookie:user,origin:foreign?'https://evil.example':origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};};
 assert.equal((await request('config','GET',null,'')).status,401);
 assert.equal((await request('sessions','POST',{text:'x'},'alice',true)).status,403);
 assert.equal((await request('sessions','POST',{image:'AAAA'})).status,503);
 const created=await request('sessions','POST',{text:'23+18=31'});assert.equal(created.status,202);const id=created.body.id;
 let current;for(let i=0;i<30;i++){current=await request('sessions/'+id);if(current.body.status==='review')break;await new Promise(r=>setTimeout(r,10));}assert.equal(current.body.status,'review');assert.equal(calls,1);
 assert.equal((await request('sessions/'+id,'GET',null,'bob')).status,404);
 const confirmed=await request('sessions/'+id+'/confirm','POST',{questions:qs});assert.equal(confirmed.status,200);assert.equal(confirmed.body.tasks[0].answer,undefined);
 assert.equal((await request('sessions/'+id+'/confirm','POST',{questions:qs})).status,409);
 assert.equal((await request('sessions/'+id+'/answer','POST',{taskId:'5',answer:'1'})).status,400);
 for(const t of plan(qs).tasks){const ans=await request('sessions/'+id+'/answer','POST',{taskId:t.id,answer:String(t.answer)});assert.equal(ans.body.correct,true);const again=await request('sessions/'+id+'/answer','POST',{taskId:t.id,answer:'0'});assert.equal(again.body.record.points,ans.body.record.points);}
 assert.equal((await request('sessions/'+id)).body.points,60);assert.equal((await request('sessions/'+id)).body.status,'complete');
 assert.equal((await request('sessions/'+id+'/answer','POST',{taskId:'toString',answer:'0'})).status,400);
 for(let i=0;i<19;i++)assert.equal(await store.charge('alice',new Date().toISOString().slice(0,10)),true);
 assert.equal(await store.charge('alice',new Date().toISOString().slice(0,10)),false);
 assert.equal((await request('sessions','POST',{text:'1+1=2'})).status,429);
 await handler.close();const reopened=await require('../server/learning/store.cjs')({dir});assert.equal((await reopened.get(id,'alice')).points,60);await reopened.close();
 await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});console.log('Learning: ownership, origin, validation, math, progression, idempotency, persistence PASS');
})().catch(e=>{console.error(e);process.exit(1);});
