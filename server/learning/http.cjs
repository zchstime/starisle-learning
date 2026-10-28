const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {recognition,plan}=require('./math.cjs');
module.exports=function({origin,auth,dir,mysql,ark,oss,store:providedStore}){
 const storePromise=providedStore?Promise.resolve(providedStore):require('./store.cjs')({dir,mysql});
 // Failure remains visible as 503; never silently redirect cloud records into local storage.
 storePromise.catch(()=>{});
 const locks=new Set();let active=0;
 const publicRecord=r=>({id:r.id,status:r.status,createdAt:r.createdAt,error:r.error,model:r.model,sourceType:r.sourceType,hasSource:!!r.objectKey,questions:r.questions,summary:r.summary,points:r.points||0,answers:r.answers||{},tasks:r.tasks?.map(({answer,...q})=>q)});
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
 return {close:async()=>(await storePromise).close(),async handle(req,res){
 const url=new URL(req.url,origin);
 if(url.pathname==='/learn'||url.pathname.startsWith('/learn/')){
 const name=url.pathname==='/learn'?'index.html':url.pathname.slice(7);
 if(!['index.html','app.js','style.css'].includes(name)){res.writeHead(404).end();return true;}
 res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/css','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(fs.readFileSync(path.join(__dirname,'../../web/learn',name)));return true;
 }
 if(!url.pathname.startsWith('/api/learning/'))return false;
 const send=(s,v)=>{res.writeHead(s,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(v));};
 try{
 if(req.headers.host!==new URL(origin).host)fail('请求来源无效',403);
 const user=auth.identify(req);if(!user)fail('请先在游戏中登录账号，再开始专属练习',401);
 if(url.pathname==='/api/learning/config'&&req.method==='GET'){send(200,{userId:user.id,ai:!!ark,uploads:!!oss,scope:'二年级数学 · 100以内加减与表内乘除',storage:mysql?'mysql':'local'});return true;}
 const store=await storePromise;
 if(req.method==='GET'&&url.pathname==='/api/learning/sessions'){send(200,{sessions:(await store.list(user.id)).map(publicRecord)});return true;}
 const match=url.pathname.match(/^\/api\/learning\/sessions\/([a-f0-9-]{36})(?:\/(confirm|answer|source))?$/);
 if(req.method==='GET'&&match?.[2]==='source'){const r=await store.get(match[1],user.id);if(!r?.objectKey)fail('资料不存在',404);if(!oss)fail('存储暂不可用',503);const content=await oss.get(r.objectKey);res.writeHead(200,{'Content-Type':r.sourceType||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(content);return true;}
 if(req.method==='GET'&&match){const r=await store.get(match[1],user.id);if(!r)fail('记录不存在',404);if(r.status==='analyzing'&&Date.now()-r.createdAt>90000){r.status='failed';r.error='上次分析中断，请删除后重新提交';await store.put(r);}send(200,publicRecord(r));return true;}
 if(!['POST','DELETE'].includes(req.method))fail('不支持此请求',405);
 if(req.headers.origin!==origin)fail('请求来源无效',403);
 if(match&&req.method==='DELETE'){if(locks.has(match[1]))fail('正在处理，请稍后删除',409);locks.add(match[1]);try{const r=await store.get(match[1],user.id);if(!r)fail('记录不存在',404);if(r.objectKey){if(!oss)fail('文件存储暂不可用，尚未删除',503);await oss.delete(r.objectKey);}await store.delete(r.id,user.id);send(200,{ok:true});return true;}finally{locks.delete(match[1]);}}
 if(!String(req.headers['content-type']).startsWith('application/json'))fail('请求格式无效',400);
 let bytes=0,chunks=[];for await(const c of req){bytes+=c.length;if(bytes>4200000)fail('图片请控制在 3 MB 内',413);chunks.push(c);}let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{fail('请求格式无效');}
 if(!input||typeof input!=='object'||Array.isArray(input))fail('请求格式无效');
 if(url.pathname==='/api/learning/sessions'&&req.method==='POST'){
 if(!ark)fail('AI 服务尚未配置',503);
 if(active>=2||locks.has(user.id))fail('星宝正在整理作业，请稍后再试',429);
 let image,mime,text=typeof input.text==='string'?input.text.trim():'';
 if(text.length>4000)fail('文字请控制在 4000 字内');
 if(input.image){if(!oss)fail('私有 OSS 上传通道尚未配置，请先输入题目',503);if(typeof input.image!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(input.image))fail('图片格式无效');image=Buffer.from(input.image,'base64');if(image.length>3*1024*1024)fail('图片请控制在 3 MB 内',413);mime=image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':image[0]===255&&image[1]===216&&image[2]===255?'image/jpeg':null;if(!mime)fail('请选择 PNG 或 JPG 图片');}
 if(!image&&(!text||text.length>4000))fail('请输入 1～4000 字的题目与作答');
 if(!(await store.charge(user.id,new Date().toISOString().slice(0,10))))fail('今天已整理 20 份，先完成已有练习吧',429);
 if(active>=2||locks.has(user.id))fail('星宝正在整理作业，请稍后再试',429);
 const id=crypto.randomUUID(),record={id,userId:user.id,createdAt:Date.now(),status:'analyzing',subject:'math',grade:2,answers:{},points:0};
 locks.add(user.id);locks.add(id);active++;
 try{if(oss){record.sourceType=mime||'text/plain; charset=utf-8';record.objectKey=`learning/${crypto.createHash('sha256').update(user.id).digest('hex')}/${id}/source.${image?(mime==='image/png'?'png':'jpg'):'txt'}`;await oss.put(record.objectKey,image||Buffer.from(text),record.sourceType);}await store.put(record);
 // Persist first, then return a pollable job. Provider requests are bounded and never auto-retried.
 void(async()=>{try{const r=await ark.recognize({text,image,mime});Object.assign(record,r,{status:'review'});}catch(e){record.status='failed';record.error='识别未成功，请检查清晰度与题目范围后重新提交';}finally{try{await store.put(record);}finally{active--;locks.delete(user.id);locks.delete(id);}}})().catch(()=>{});
 send(202,publicRecord(record));return true;
 }catch(e){active--;locks.delete(user.id);locks.delete(id);if(record.objectKey)try{await oss.delete(record.objectKey);}catch{}throw e;}
 }
 if(!match)fail('接口不存在',404);
 if(locks.has(match[1]))fail('正在处理，请稍后再试',409);locks.add(match[1]);
 try{
 const r=await store.get(match[1],user.id);if(!r)fail('记录不存在',404);
 if(match[2]==='confirm'){
 if(r.status!=='review')fail('该资料已确认或尚未识别完成',409);
 let qs;try{qs=recognition({questions:input.questions});}catch(e){fail(e.message);}
 if(qs.length!==r.questions.length)fail('请逐题确认，题目数量不可改变');
 const p=plan(qs);r.questions=qs;r.evaluated=p.evaluated;r.tasks=p.tasks;r.summary=p.summary;r.status='ready';r.confirmedAt=Date.now();await store.put(r);send(200,publicRecord(r));return true;
 }
 if(match[2]==='answer'){
 if(!['ready','complete'].includes(r.status))fail('请先确认识别结果',409);
 const i=Object.keys(r.answers||{}).length,q=r.tasks[i];
 // idempotent repeats return the already recorded result, never issue points twice.
 if(typeof input.taskId!=='string'||!/^\d$/.test(input.taskId))fail('关卡编号无效');
 if(Object.hasOwn(r.answers,input.taskId)){send(200,{...r.answers[input.taskId],record:publicRecord(r)});return true;}
 if(!q||input.taskId!==q.id||typeof input.answer!=='string'||!/^\d{1,3}$/.test(input.answer))fail('请填写当前关卡的整数答案');
 const correct=Number(input.answer)===q.answer;const result={correct,answer:q.answer,submitted:input.answer,points:correct?10:0,at:Date.now()};r.answers[q.id]=result;r.points+=result.points;if(i===r.tasks.length-1)r.status='complete';await store.put(r);send(200,{...result,record:publicRecord(r)});return true;
 }fail('接口不存在',404);
 }finally{locks.delete(match[1]);}
 }catch(e){send(e.status||503,{error:e.status?e.message:'学习服务暂不可用，请稍后重试'});}return true;
 }};
};
