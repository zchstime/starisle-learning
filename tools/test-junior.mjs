import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
import {tasks,units,subjects,taskById} from '../web/junior/catalog.mjs';
import {linear,equation,evaluate,validateDraft,nextState,completion} from '../web/junior/engine.mjs';
const require=createRequire(import.meta.url);
assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);assert.equal(units.every(u=>u.tasks.length===4),true);assert.equal(subjects.length,14);
assert.deepEqual(linear('2(x + 3) / 2'),{a:1,b:3});assert.equal(equation('x/2+1=4').solution,6);assert.throws(()=>linear('globalThis.alert(1)'));assert.throws(()=>linear('x*x'));assert.throws(()=>linear('1/0'));assert.throws(()=>equation('0=0'));assert.throws(()=>linear('2..3'));
const eq=taskById.get('m7-equation.2');
assert.equal(evaluate(eq,{steps:'x+3=9\nx=6'}).status,'verified');assert.equal(evaluate(eq,{steps:'2x+6=18\n2x=12\nx=6'}).status,'verified');assert.equal(evaluate(eq,{steps:'2x=24\nx=6'}).status,'retry');assert.equal(evaluate(eq,{steps:'0=0\nx=6'}).status,'retry');assert.equal(evaluate(eq,{steps:'2(x+3)=18'}).status,'retry');assert.equal(evaluate(eq,{steps:'3x=18\n6=x'}).status,'verified');
assert.equal(evaluate(taskById.get('m7-numberline.2'),{position:-1,distance:'9'}).status,'verified');assert.equal(evaluate(taskById.get('m7-numberline.2'),{position:-1,distance:'3'}).status,'retry');
assert.equal(evaluate(eq,{steps:'x=6'}).status,'retry');
const open=taskById.get('c7-reading.1'),draft={evidence:[1],text:'林然原本急着去买喜欢的旅行记，却停下来帮助摊主整理书页，这个动作说明她愿意为别人付出自己的时间。'};
assert.equal(evaluate(open,draft).status,'submitted');assert.equal(validateDraft(open,{...draft,evidence:[999]}),false);assert.equal(validateDraft(open,{...draft,evidence:[1,1]}),false);assert.equal(validateDraft(open,{...draft,score:100}),false);assert.equal(validateDraft(open,{text:9}),false);
const lab=taskById.get('b7-plant.1'),ld={a:{light:8,water:50,temp:24},b:{light:12,water:50,temp:24},days:3,text:'在同一温度与供水量下，两组模型高度有所不同。这个结果来自简化模型，不能直接推广到所有植物。'};
assert.equal(evaluate(lab,ld).status,'submitted');assert.equal(evaluate(lab,{...ld,b:{light:12,water:60,temp:24}}).status,'retry');assert.equal(validateDraft(lab,{...ld,days:100}),false);assert.equal(validateDraft(lab,{...ld,a:{light:NaN,water:50,temp:24}}),false);
assert.equal(evaluate(taskById.get('e7-campus.2'),{answers:['On Tuesday.','In the lab.','No problem.']}).status,'verified');assert.equal(evaluate(taskById.get('e7-campus.2'),{answers:['Not Tuesday.','Not the lab.','No problem.']}).status,'retry');
let s=nextState(open,null,{draft,submit:true,hinted:true},1000);assert(completion(s));s=nextState(open,s,{draft,submit:false,hinted:false},2000);assert.equal(s.hinted,true);for(let i=0;i<8;i++)s=nextState(open,s,{draft,submit:true,hinted:false},3000+i);assert.equal(s.submissions.length,5);
const robot=taskById.get('it7-algorithm.1');assert.equal(evaluate(robot,{program:'FFF R FFF'}).status,'verified');assert.equal(evaluate(robot,{program:'F R F'}).status,'retry');assert.equal(evaluate(robot,{program:'FFFF'}).status,'retry');assert.equal(validateDraft(robot,{program:'F'.repeat(161)}),false);
const composition=taskById.get('a7-create.2');assert.equal(evaluate(composition,{notes:[1,2,3,0,1,2,3,0],text:'前后两个乐句使用相同的起始音，结尾留出休止，让听者感到一句话结束。'}).status,'submitted');assert.equal(evaluate(composition,{notes:[1,2,3,4,1,2,3,4],text:'重复与变化的设计需要保留停顿，现在这段没有休止。'}).status,'retry');assert.equal(validateDraft(composition,{notes:[99]}),false);
const project=taskById.get('pe7-observe.1');assert.equal(evaluate(project,{sections:project.labels.map(x=>'尚未实践，准备结合老师已有指导记录具体过程和观察。')}).status,'submitted');assert.equal(evaluate(project,{sections:[]}).status,'retry');
const balance=taskById.get('ch9-balance.1');assert.equal(evaluate(balance,{coefficients:[2,1,2]}).status,'verified');assert.equal(evaluate(balance,{coefficients:[4,2,4]}).status,'retry');assert.equal(evaluate(balance,{coefficients:[1,1,1]}).status,'retry');
const circuit=taskById.get('p9-circuit.1');assert.equal(evaluate(circuit,{voltage:6,resistance:3,current:'2'}).status,'verified');assert.equal(evaluate(circuit,{voltage:6,resistance:3,current:''}).status,'retry');assert.equal(validateDraft(circuit,{voltage:6,resistance:0}),false);
const graph=taskById.get('m8-function.1');assert.equal(validateDraft(graph,{a:2,b:1,values:['5','-1']}),true);assert.equal(evaluate(graph,{a:2,b:1,values:['5','-1']}).status,'verified');assert.equal(evaluate(graph,{a:2,b:1,values:['5','1']}).status,'retry');
for(const u of units){assert.equal(u.reviewStatus,'draft');assert.equal(u.edition,null);assert(u.tasks.every(t=>t.kind!=='choice'&&t.hint));}assert.equal(new Set(units.map(u=>u.subject)).size,subjects.length);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'junior-test-'));let server,handler;
try{
 server=http.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 handler=require('../server/junior/http.cjs')({origin,auth:{identify:r=>r.headers.cookie?{id:r.headers.cookie}:null},dir});server.on('request',async(req,res)=>{if(!await handler.handle(req,res))res.writeHead(404).end();});
 const request=async(route,method='GET',body,user='alice',extra={})=>{const r=await fetch(origin+route,{method,headers:{cookie:user,origin,'Content-Type':'application/json','X-Junior-Account':user,...extra},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 const manifest=await request('/api/junior/catalog','GET',undefined,'');assert.equal(manifest.status,200);assert.deepEqual(manifest.body.unitIds,units.map(u=>u.id));assert.deepEqual(manifest.body.taskIds,tasks.map(t=>t.id));assert.deepEqual(Object.keys(manifest.body).sort(),['taskIds','unitIds']);
 for(const [id,d] of [['m7-rational-position.1',{position:-1.5}],['m7-absolute-distance.3',{position:0,distance:'0'}]]){const r=await request('/api/junior/tasks/'+id,'PUT',{revision:0,draft:d,submit:true,hinted:false},'new-course-check');assert.equal(r.status,200);assert.equal(r.body.state.submissions.at(-1).result.status,'verified');}
 assert.equal((await request('/api/junior/state','GET',undefined,'')).status,401);
 assert.equal((await request('/api/junior/state','GET',undefined,'alice',{'X-Junior-Account':'bob'})).status,409);
 const payload={revision:0,draft,submit:true,hinted:false};
 assert.equal((await request('/api/junior/tasks/'+open.id,'PUT',payload,'alice',{origin:'https://evil.example'})).status,403);
 assert.equal((await request('/api/junior/tasks/'+open.id,'PUT',{...payload,draft:{score:100}})).status,400);
 assert.equal((await request('/api/junior/tasks/toString','PUT',payload)).status,404);
 const saved=await request('/api/junior/tasks/'+open.id,'PUT',payload);assert.equal(saved.status,200);assert.equal(saved.body.state.revision,1);assert.equal(saved.body.state.submissions[0].result.status,'submitted');
 assert.deepEqual((await request('/api/junior/state','GET',undefined,'bob')).body.states,{});
 const stale=await request('/api/junior/tasks/'+open.id,'PUT',payload);assert.equal(stale.status,409);assert.equal(stale.body.state.revision,1);
 const concurrent=await Promise.all([request('/api/junior/tasks/'+open.id,'PUT',{...payload,revision:1}),request('/api/junior/tasks/'+open.id,'PUT',{...payload,revision:1})]);assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409]);
 const raw=await fetch(origin+'/junior');assert.equal(raw.status,200);assert.match(await raw.text(),/初中探索群岛/);
 assert.equal((await fetch(origin+'/junior/catalog.mjs')).headers.get('content-type'),'text/javascript; charset=utf-8');
 assert.equal((await fetch(origin+'/junior/assets/research-station.png')).status,200);
 assert.equal((await fetch(origin+'/junior/%2e%2e%2f%2e%2e%2fpackage.json')).status,404);
 await handler.close();handler=null;const reopened=await require('../server/junior/store.cjs')({dir});assert.equal((await reopened.list('alice'))[open.id].revision,2);await reopened.close();
 console.log(`Junior: ${units.length} units / ${tasks.length} tasks, reasoning, open-answer boundaries, ownership, CAS, origin and persistence PASS`);
}finally{if(handler)await handler.close();if(server)await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}

const half=taskById.get('m7-rational-position.1'),quarter=taskById.get('m7-rational-position.4');
assert(validateDraft(half,{position:-1.5}));assert(!validateDraft(half,{position:-1.25}));assert(!validateDraft(half,{position:'-1.5'}));assert(!validateDraft(half,{position:Infinity}));assert(!validateDraft(half,{position:-3.5}));assert(validateDraft(quarter,{position:.75}));assert(!validateDraft(taskById.get('m7-numberline.1'),{position:.5}));assert.equal(evaluate(half,{}).status,'retry');assert.equal(evaluate(half,{position:0}).status,'retry');assert.equal(evaluate(quarter,{position:.75}).status,'verified');assert.equal(evaluate(quarter,{position:-.75}).status,'retry');

const zeroTask=taskById.get('m7-absolute-distance.3'),negativeTask=taskById.get('m7-absolute-distance.1');
assert.equal(evaluate(zeroTask,{position:0,distance:''}).status,'retry');assert.equal(evaluate(zeroTask,{position:0,distance:'0'}).status,'verified');assert.equal(evaluate(zeroTask,{position:1,distance:'0'}).status,'retry');assert.equal(evaluate(negativeTask,{position:-2.5,distance:'-2.5'}).status,'retry');assert.equal(evaluate(negativeTask,{position:-2.5,distance:'2.5'}).status,'verified');assert.equal(evaluate(taskById.get('m7-absolute-distance.4'),{position:-1.75,distance:'1.75'}).status,'verified');

for(const id of ['m7-order.1','m7-order.3','m7-order.4']){const t=taskById.get(id);assert.equal(t.target,Math.max(...t.referencePoints));assert.equal(evaluate(t,{position:t.target}).status,'verified');assert.equal(evaluate(t,{position:Math.min(...t.referencePoints)}).status,'retry');assert(validateDraft(t,{position:t.target}));}

assert.deepEqual(evaluate(taskById.get('m7-order.4'),{position:-.25}).checks.map(c=>c.label),['终点位置']);assert.equal(evaluate(taskById.get('m7-absolute-distance.3'),{position:0,distance:'0'}).checks.length,2);

const sort=taskById.get('m7-classify.3');assert(validateDraft(sort,{placements:sort.answers}));assert(!validateDraft(sort,{placements:[0]}));assert(!validateDraft(sort,{placements:sort.cards.map(()=>9)}));assert(!validateDraft(sort,{placements:sort.cards.map(()=>'0')}));assert.equal(evaluate(sort,{placements:sort.answers}).status,'verified');assert.equal(evaluate(sort,{placements:sort.cards.map(()=>-1)}).status,'retry');assert.equal(evaluate(sort,{placements:[0,1,1,1,1,0]}).status,'retry');
