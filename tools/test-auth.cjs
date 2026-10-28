const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const create=require('../server/auth.cjs');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starisle-auth-'));let time=Date.now();const origin='http://127.0.0.1:7459';let auth=create({dir,origin,now:()=>time});
 async function call(route,data,cookie='',extra={}){let status,body,headers={};const req={url:'/api/auth/'+route,method:data?'POST':'GET',headers:{host:'127.0.0.1:7459',origin,'content-type':'application/json',cookie,...extra},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){yield JSON.stringify(data);}};await auth.handle(req,{setHeader:(k,v)=>headers[k]=v,writeHead:s=>status=s,end:s=>body=JSON.parse(s)});return{status,body,headers};}
 assert.throws(()=>create({dir,origin,mode:'live'}),/requires/);
 assert.equal((await call('code',{phone:'123'})).status,400);
 assert.equal((await call('code',{phone:'13800000001'},'',{origin:'http://evil.test'})).status,403);
 const phone='13800000001';let r=await call('code',{phone});assert.match(r.body.demoCode,/^\d{6}$/);const code=r.body.demoCode;
 assert.equal((await call('code',{phone})).status,429);
 assert.equal((await call('verify',{phone,code:'000000'})).status,400);
 r=await call('verify',{phone,code});assert.equal(r.body.created,true);const id=r.body.user.id,cookie=r.headers['Set-Cookie'].split(';')[0];assert.match(r.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/);
 assert.equal((await call('verify',{phone,code})).status,400);
 assert.equal((await call('me',null,cookie)).body.user.id,id);
 auth.close();auth=create({dir,origin,now:()=>time});assert.equal((await call('me',null,cookie)).body.user.id,id);
 await call('logout',{},cookie);assert.equal((await call('me',null,cookie)).body.user,null);
 time+=61000;r=await call('code',{phone});r=await call('verify',{phone,code:r.body.demoCode});assert.equal(r.body.user.id,id);assert.equal(r.body.created,false);
 time+=61000;r=await call('code',{phone});time+=300001;assert.equal((await call('verify',{phone,code:r.body.demoCode})).status,400);
 r=await call('code',{phone});for(let i=0;i<5;i++)await call('verify',{phone,code:'000000'});assert.equal((await call('verify',{phone,code:r.body.demoCode})).status,400);
 auth.close();fs.rmSync(dir,{recursive:true});console.log('PASS auth: input/origin checks, cooldown, OTP mismatch/expiry/one-use/attempt limit, registration, persistence, login, logout, live fail-closed');
})().catch(e=>{console.error(e);process.exitCode=1});
