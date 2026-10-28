'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const seed=require('../server/content/seed.json'),{validate}=require('../server/content/schema.cjs');
(async()=>{
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starisle-admin-test-'));let admin,auth,server;
try{
 assert.equal(validate(seed).errors.length,0);
 const socket=http.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));const origin='http://127.0.0.1:'+port;
 auth=require('../server/auth.cjs')({dir:path.join(dir,'auth'),origin});admin=require('../server/admin.cjs')({dir:path.join(dir,'admin'),origin,auth,store:null});admin.content.addAdmin('tester','test-only-password-123','owner');admin.content.addAdmin('editor','test-only-password-123','editor');admin.content.addAdmin('support','test-only-password-123','support');
 server=http.createServer(async(req,res)=>{if(await admin.handle(req,res))return;if(await auth.handle(req,res))return;res.writeHead(404).end();});await new Promise(r=>server.listen(port,'127.0.0.1',r));
 async function request(route,data,cookie='',extra={}){const response=await fetch(origin+route,{method:data===undefined?'GET':'POST',headers:{origin,'content-type':'application/json',cookie,...extra},body:data===undefined?undefined:JSON.stringify(data)});const text=await response.text();let body;try{body=JSON.parse(text);}catch{body=text;}return {status:response.status,body,cookie:response.headers.get('set-cookie')?.split(';')[0]};}
 const anon=await request('/api/admin/draft');assert.equal(anon.status,401);assert.equal((await request('/api/admin/login',{username:'tester',password:'wrong'})).status,401);
 const login=await request('/api/admin/login',{username:'tester',password:'test-only-password-123'});assert.equal(login.status,200);const cookie=login.cookie;
 assert.equal((await request('/api/admin/validate',{},cookie,{origin:'https://evil.test'})).status,403);
 const editor=(await request('/api/admin/login',{username:'editor',password:'test-only-password-123'})).cookie,support=(await request('/api/admin/login',{username:'support',password:'test-only-password-123'})).cookie;
 assert.equal((await request('/api/admin/publish',{note:'no',revision:1},editor)).status,403);assert.equal((await request('/api/admin/users',undefined,editor)).status,403);assert.equal((await request('/api/admin/draft',undefined,support)).status,403);
 let draft=(await request('/api/admin/draft',undefined,cookie)).body;
 const subject={id:'astronomy',name:'天文探索',art:'planet',order:20,status:'active'},question={id:'astronomy.q1',subject:'astronomy',grade:2,knowledge:'太阳系',status:'active',data:{kind:'choice',title:'认识太阳',goal:'太阳是什么？',options:['恒星','行星','卫星'],target:0,hint:'想想它是否自己发光。',explanation:'太阳是一颗恒星。'}},chapter={id:'astronomy.c1',subject:'astronomy',grade:2,title:'太阳系启程',topic:'天体',art:'planet',alignment:'enrichment',status:'active',bindings:[{id:'astronomy.l1',questionId:question.id}]};
 draft.subjects.push(subject);draft.questions.push(question);draft.chapters.push(chapter);
 const saved=await request('/api/admin/save',draft,cookie);assert.equal(saved.status,200,JSON.stringify(saved.body));assert.equal(saved.body.revision,2);
 assert.equal((await request('/api/admin/save',draft,cookie)).status,409);
 assert.equal((await request('/api/content/current')).body.subjects.length,11,'draft does not leak publicly');
 assert.equal((await request('/api/admin/preview',undefined,cookie)).body.subjects.length,12);
 const pub=await request('/api/admin/publish',{revision:2,note:'新学科上线'},cookie);assert.equal(pub.status,200);const live=(await request('/api/content/current')).body;assert.equal(live.subjects.length,12);assert.equal(live.chapters.find(c=>c.id===chapter.id).levels[0].id,'astronomy.l1');
 draft=(await request('/api/admin/draft',undefined,cookie)).body;const tampered=structuredClone(draft);tampered.chapters.find(c=>c.id===chapter.id).bindings[0].questionId=seed.questions[0].id;assert.equal((await request('/api/admin/save',tampered,cookie)).status,400);
 const broken=structuredClone(draft);broken.questions.find(q=>q.id===question.id).data.target=8;assert.equal((await request('/api/admin/save',broken,cookie)).status,400);
 const unsupported=structuredClone(draft);unsupported.questions.find(q=>q.id===question.id).data.kind='new-plugin';assert.equal((await request('/api/admin/save',unsupported,cookie)).status,400);
 assert.equal((await request('/api/admin/rollback',{id:1,revision:2},cookie)).status,200);const rollback=(await request('/api/content/current')).body;assert.equal(rollback.subjects.length,11);assert.ok(rollback.knownLevelIds.includes('astronomy.l1'));assert.ok(rollback.release>pub.body.id);
 const {template,parse}=require('../server/content/import.cjs'),buffer=await template();let parsed=await parse(Buffer.from(buffer),draft);assert.equal(parsed.errors.length,0);assert.equal(parsed.items[0].item.data.target,1);
 const importPreview=(await request('/api/admin/import/preview',{base64:Buffer.from(buffer).toString('base64'),revision:2},cookie)).body;
 assert.equal((await request('/api/admin/import/commit',{token:importPreview.token},editor)).status,400);assert.equal((await request('/api/admin/import/commit',{token:importPreview.token},cookie)).status,200);assert.equal((await request('/api/admin/import/commit',{token:importPreview.token},cookie)).status,400);
 const ExcelJS=require('exceljs'),book=new ExcelJS.Workbook();await book.xlsx.load(buffer);book.getWorksheet('题库').getCell('H2').value='Z';parsed=await parse(Buffer.from(await book.xlsx.writeBuffer()),draft);assert.equal(parsed.errors[0].row,2);
 const code=await request('/api/auth/code',{phone:'13800138000'});const verified=await request('/api/auth/verify',{phone:'13800138000',code:code.body.demoCode});assert.equal(verified.status,200);const user=verified.body.user;
 const users=(await request('/api/admin/users',undefined,support)).body;assert.equal(users.total,1,'includes registered users with no saves');assert.equal((await request('/api/admin/player?id='+user.id,undefined,support)).body.cloudAvailable,false);
 assert.equal((await request('/api/admin/users/status',{id:user.id,disabled:true,reason:'test freeze'},support)).status,200);assert.equal((await request('/api/auth/me',undefined,verified.cookie)).body.user,null,'freeze revokes sessions');
 assert.equal((await request('/api/admin/users/status',{id:user.id,disabled:false,reason:'test unfreeze'},support)).status,200);
 assert.ok((await request('/api/admin/audit',undefined,cookie)).body.some(e=>e.action==='publish'));
 const before=admin.content.current().release;admin.close();admin=require('../server/admin.cjs')({dir:path.join(dir,'admin'),origin,auth,store:null});assert.equal(admin.content.current().release,before,'releases survive restart');
 console.log('PASS admin: seed migration, auth/CSRF/RBAC, CAS, invalid content rejection, new subject publication, isolated preview, rollback tombstones, XLSX validation/import, user freeze, audit and restart durability');
}finally{if(server)await new Promise(r=>server.close(r));admin?.close();auth?.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
