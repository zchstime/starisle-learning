'use strict';
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {context}=require('./context.cjs');
module.exports=function({origin,auth,dir,mysql,learning,chat,speech,asr,rtc,store:providedStore,clock=Date.now}){
 const storage=providedStore?Promise.resolve(providedStore):require('./store.cjs')({dir,mysql});storage.catch(()=>{});
 const locks=new Set();let active=0,closed=false;
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
 const locked=async(user,fn)=>{if(locks.has(user))fail('星宝正在处理上一条，请稍等',409);locks.add(user);try{return await fn();}finally{locks.delete(user);}};
 async function stop(store,user,state){if(!state.call)return;if(state.call.started){if(!rtc?.ready)throw Error('RTC credentials unavailable for cleanup');await rtc.stop(state.call);}state.call=null;await store.put(user,state);}
 async function sweep(){if(closed)return;try{const store=await storage;for(const user of await store.expired()){if(!locks.has(user))await locked(user,async()=>store.put(user,await store.get(user)));}for(const r of await store.calls()){if(locks.has(r.user)||r.call.deadline>clock()&&r.call.lease>clock())continue;await locked(r.user,()=>stop(store,r.user,r)).catch(()=>{});}}catch{}}
 const timer=setInterval(sweep,10000);timer.unref();void sweep();
 const publicState=r=>({consent:r.consent,memory:r.memory!==false,messages:r.messages||[]});
 return {async close(){closed=true;clearInterval(timer);const store=await storage;for(const r of await store.calls())await stop(store,r.user,r).catch(()=>{});await store.close();},sweep,async handle(req,res){
 const url=new URL(req.url,origin);
 if(url.pathname.startsWith('/companion/')){const file=url.pathname.slice(11);if(!['app.js','style.css','rtc.bundle.js','pcm-worklet.js'].includes(file)){res.writeHead(404).end();return true;}try{const data=fs.readFileSync(path.join(__dirname,'../../web/companion',file));res.writeHead(200,{'Content-Type':file.endsWith('.css')?'text/css':'text/javascript; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(404).end();}return true;}
 if(!url.pathname.startsWith('/api/companion/'))return false;
 const send=(code,data)=>{if(res.destroyed)return;res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 try{
 if(req.headers.host!==new URL(origin).host)fail('请求来源无效',403);const user=auth.identify(req);if(!user)fail('请先登录，再和星宝聊聊',401);
 const route=url.pathname.slice(15),store=await storage;
 if(req.method==='GET'&&route==='config'){const state=await store.get(user.id);send(200,{chat:!!chat,speech:!!speech,asr:!!asr,rtc:!!rtc?.ready,...publicState(state),maxCallSeconds:300});return true;}
 if(req.method==='GET'&&route==='memory'){const r=await store.get(user.id);send(200,{enabled:r.memory!==false,evidence:r.memory!==false?(await context({},user.id,learning,true)).evidence:[]});return true;}
 if(req.method!=='POST')fail('接口不存在',404);if(req.headers.origin!==origin)fail('请求来源无效',403);
 if(!String(req.headers['content-type']).startsWith('application/json'))fail('请求格式无效');let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>1400000)fail('录音过长，请控制在30秒内',413);chunks.push(c);}let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{fail('请求格式无效');}if(!input||Array.isArray(input)||typeof input!=='object')fail('请求格式无效');
 await locked(user.id,async()=>{
 const state=await store.get(user.id);state.messages||=[];
 if(route==='settings'){if(typeof input.consent==='boolean')state.consent=input.consent;if(typeof input.memory==='boolean')state.memory=input.memory;if(!state.consent)await stop(store,user.id,state);await store.put(user.id,state);send(200,publicState(state));return;}
 if(route==='reset'){await stop(store,user.id,state);state.messages=[];state.updatedAt=clock();await store.put(user.id,state);send(200,publicState(state));return;}
 if(!state.consent)fail('请先确认AI对话说明',403);
 if(route==='call/stop'){if(state.call&&input.id!==state.call.id)fail('通话不存在',404);await stop(store,user.id,state);send(200,{ok:true});return;}
 if(route==='call/heartbeat'){if(!state.call||input.id!==state.call.id)fail('通话已结束',410);if(state.call.deadline<=clock()){await stop(store,user.id,state);fail('这次通话已满5分钟，休息一下吧',410);}state.call.lease=clock()+45000;await store.put(user.id,state);send(200,{deadline:state.call.deadline});return;}
 if(route==='call/start'){if(!state.call||state.call.id!==input.id||state.call.deadline<=clock())fail('通话已过期',410);if(!state.call.started){state.call.started=true;await store.put(user.id,state);try{await rtc.start(state.call,state.call.context);}catch(e){await stop(store,user.id,state).catch(()=>{});throw e;}}send(200,{ok:true});return;}
 if(active>=4)fail('星宝现在有点忙，请稍后再试',429);
 if(route==='call/create'){
 if(!rtc?.ready)fail('实时通话尚未开通，可以先打字或按住说话',503);if(state.call)fail('已有通话，请先挂断',409);if(!await store.charge(user.id,'call',6))fail('今天通话较多，先休息一下吧',429);
 const ctx=await context(input.context||{},user.id,learning,state.memory!==false);ctx.recentDialogue=state.messages.slice(-8).map(({role,text})=>({role,text}));const id=randomUUID();state.call={id,agentId:'xingbao_'+id,roomId:'xb_'+id,rtcUser:'u_'+randomUUID(),deadline:clock()+300000,lease:clock()+45000,started:false,context:ctx};await store.put(user.id,state);send(200,{id,...rtc.credentials(state.call)});return;
 }
 if(state.call)fail('请先结束实时通话，再使用文字或录音',409);
 active++;try{
 if(route==='message'){
 if(!chat)fail('星宝对话服务尚未配置',503);const text=typeof input.text==='string'?input.text.trim():'';if(!text||text.length>1000)fail('请输入1～1000字');if(!await store.charge(user.id,'message',100))fail('今天聊了很多，先休息一下吧',429);
 const ctx=await context(input.context||{},user.id,learning,state.memory!==false);const reply=await chat({text,history:state.messages,context:ctx});const at=clock(),message={id:randomUUID(),role:'assistant',text:reply.text,at};state.messages.push({id:randomUUID(),role:'user',text,at},message);state.messages=state.messages.slice(-24);state.updatedAt=at;await store.put(user.id,state);send(200,{message});return;
 }
 if(route==='speech'){
 if(!speech)fail('星宝语音暂不可用，请看文字回答',503);const message=state.messages.find(m=>m.id===input.id&&m.role==='assistant');if(!message)fail('这条回答不存在',404);if(!await store.charge(user.id,'speech',120))fail('今天的语音额度已用完，可以继续看文字',429);const audio=await speech(message.text);res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'no-store'});res.end(audio);return;
 }
 if(route==='asr'){
 if(!asr)fail('语音识别尚未配置，可以先打字',503);if(typeof input.audio!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio))fail('录音无效');const wav=Buffer.from(input.audio,'base64');if(wav.length<48||wav.length>960044||wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE'||wav.toString('ascii',12,16)!=='fmt '||wav.readUInt32LE(16)!==16||wav.readUInt16LE(20)!==1||wav.readUInt16LE(22)!==1||wav.readUInt32LE(24)!==16000||wav.readUInt16LE(34)!==16||wav.toString('ascii',36,40)!=='data'||wav.readUInt32LE(40)!==wav.length-44)fail('请使用30秒以内的单声道录音');if(!await store.charge(user.id,'asr',60))fail('今天录音较多，请先打字',429);send(200,{text:await asr(wav)});return;
 }
 fail('接口不存在',404);
 }finally{active--;}
 });
 }catch(e){send(e.status||503,{error:e.status?e.message:'星宝暂时没连上，请稍后再试；你也可以继续独立练习'});if(!e.status)console.warn('[companion]',e.message);}return true;
 }};
};
