'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starisle-companion-')),store=await require('../server/companion/store.cjs')({dir});let time=Date.now(),calls=[],failStop=false,slowResolve;
 const server=http.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const record={id:'lesson',userId:'alice',createdAt:time,grade:2,subject:'math',tasks:[{id:'0',expression:'53-28'},{id:'1',expression:'41-19'}],answers:{'0':{correct:false,submitted:'35'}}};
 const app=require('../server/companion/http.cjs')({origin,auth:{identify:r=>r.headers.cookie?{id:r.headers.cookie}:null},store,clock:()=>time,learning:{get:async(id,user)=>id===record.id&&user==='alice'?record:null,list:async user=>user==='alice'?[record]:[]},chat:async x=>{calls.push(structuredClone(x));if(x.text==='wait')await new Promise(r=>slowResolve=r);return {text:'我们先看个位。'};},speech:async text=>Buffer.from('audio:'+text),asr:async()=> '我想问这道题',rtc:{ready:true,credentials:r=>({token:'temporary',roomId:r.roomId,deadline:r.deadline}),start:async r=>calls.push({start:r.id}),stop:async r=>{if(failStop)throw Error('stop failed');calls.push({stop:r.id});}}});server.on('request',(q,s)=>app.handle(q,s));
 const request=async(route,body,user='alice',foreign=false)=>{const r=await fetch(origin+'/api/companion/'+route,{method:body?'POST':'GET',headers:{cookie:user,origin:foreign?'https://other.test':origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:r.headers.get('content-type').includes('json')?await r.json():await r.text()};};
 try{
 await store.put('expired',{messages:[{at:Date.now()-31*86400000,role:'user',text:'old'}]});await app.sweep();assert.equal((await store.get('expired')).messages.length,0);assert.deepEqual(await store.expired(),[]);
 assert.equal((await request('config',null,'')).status,401);assert.equal((await request('settings',{consent:true},'alice',true)).status,403);
 assert.equal((await request('message',{text:'hello'})).status,403);assert.equal((await request('settings',{consent:true})).status,200);
 const first=await request('message',{text:'为什么？',context:{sessionId:'lesson'}});assert.equal(first.status,200);assert.equal(calls[0].context.current.question,'41-19');assert.equal(calls[0].context.evidence[0].tasks[0].correct,false);
 assert.equal((await request('speech',{id:first.body.message.id})).status,200);await request('settings',{consent:true},'bob');assert.equal((await request('speech',{id:first.body.message.id},'bob')).status,404);assert.equal((await request('message',{text:'偷看',context:{sessionId:'lesson'}},'bob')).status,404);
 await request('message',{text:'再解释一下'});assert.equal(calls[1].history.length,2);
 await request('settings',{memory:false});await request('message',{text:'我上次会了吗'});assert.equal(calls[2].context.evidence.length,0);assert.equal((await request('memory')).body.evidence.length,0);
 assert.equal((await request('asr',{audio:'AAAA'})).status,400);
 const pending=request('message',{text:'wait'});for(let i=0;i<100&&!slowResolve;i++)await new Promise(r=>setTimeout(r,5));assert(slowResolve);assert.equal((await request('reset',{})).status,409);slowResolve();await pending;
 const created=await request('call/create',{context:{sessionId:'lesson'}});assert.equal(created.status,200);assert.equal(created.body.id.length,36);assert.equal(created.body.context,undefined);const id=created.body.id;
 assert.equal((await request('call/start',{id},'bob')).status,410);assert.equal((await request('call/start',{id})).status,200);assert.equal((await request('call/start',{id})).status,200);assert.equal(calls.filter(x=>x.start===id).length,1);assert.equal((await request('message',{text:'overlap'})).status,409);
 failStop=true;assert.equal((await request('call/stop',{id})).status,503);assert((await store.get('alice')).call);failStop=false;assert.equal((await request('call/stop',{id})).status,200);assert.equal((await store.get('alice')).call,null);
 const lease=await request('call/create',{});await request('call/start',{id:lease.body.id});time+=46000;await app.sweep();assert.equal((await store.get('alice')).call,null);
 const limit=await request('call/create',{});await request('call/start',{id:limit.body.id});time+=300001;assert.equal((await request('call/heartbeat',{id:limit.body.id})).status,410);assert.equal((await store.get('alice')).call,null);
 await request('reset',{});assert.equal((await request('config')).body.messages.length,0);assert.equal((await request('memory')).body.enabled,false);
 for(let i=0;i<100;i++)await store.charge('quota','message',100);assert.equal(await store.charge('quota','message',100),false);
 await app.close();const reopen=await require('../server/companion/store.cjs')({dir});assert.equal((await reopen.get('alice')).consent,true);assert.equal((await reopen.get('alice')).memory,false);assert.equal(await reopen.charge('quota','message',100),false);await reopen.close();
 console.log('Companion PASS: consent, ownership, context, multi-turn, memory toggle, WAV validation, concurrency, speech ownership, RTC idempotency, stop retries, lease cleanup, hard limit, persistence and quota');
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1);});
