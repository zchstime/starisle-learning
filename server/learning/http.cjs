const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {recognition,plan}=require('./math.cjs');
const assessment=require('./assessment.cjs');
module.exports=function({origin,auth,dir,mysql,ark,oss,store:providedStore}){
 const storePromise=providedStore?Promise.resolve(providedStore):require('./store.cjs')({dir,mysql});
 // Failure remains visible as 503; never silently redirect cloud records into local storage.
 storePromise.catch(()=>{});
 const locks=new Set();let active=0;
 const publicRecord=r=>({id:r.id,status:r.status,createdAt:r.createdAt,error:r.error,model:r.model,mode:r.mode,profile:r.profile,assessment:r.assessment,learningFeedback:assessment.feedback(r),recognitionNote:r.recognitionNote,generation:r.generation,generationNote:r.generationNote,sourceType:r.sourceType,hasSource:!!r.objectKey,questions:r.questions,summary:r.summary,points:r.points||0,answers:r.answers||{},tasks:r.tasks?.map(({answer,explanation,...q})=>q)});
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
 return {list:async user=>(await storePromise).list(user),get:async(id,user)=>(await storePromise).get(id,user),close:async()=>(await storePromise).close(),async handle(req,res){
 const url=new URL(req.url,origin);
 if(url.pathname==='/learn'||url.pathname.startsWith('/learn/')){
 const name=url.pathname==='/learn'?'index.html':url.pathname.slice(7);
 if(!['index.html','app.js','photo.js','assessment.js','style.css'].includes(name)){res.writeHead(404).end();return true;}
 res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/css','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(fs.readFileSync(path.join(__dirname,'../../web/learn',name)));return true;
 }
 if(!url.pathname.startsWith('/api/learning/'))return false;
 const send=(s,v)=>{res.writeHead(s,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(v));};
 try{
 if(req.headers.host!==new URL(origin).host)fail('请求来源无效',403);
 const user=auth.identify(req);if(!user)fail('请先在游戏中登录账号，再开始专属练习',401);
 if(url.pathname==='/api/learning/config'&&req.method==='GET'){send(200,{userId:user.id,ai:!!ark,assessment:!!ark?.recognizeAssessment,subjects:assessment.subjects,uploads:!!oss,scope:'二年级数学 · 100以内单步与两步混合运算（表内乘除）',storage:mysql?'mysql':'local'});return true;}
 const store=await storePromise;
 if(req.method==='GET'&&url.pathname==='/api/learning/sessions'){send(200,{sessions:(await store.list(user.id)).map(publicRecord)});return true;}
 const match=url.pathname.match(/^\/api\/learning\/sessions\/([a-f0-9-]{36})(?:\/(confirm|answer|source|next))?$/);
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
 let learner;const mode=input.mode==='assessment'?'assessment':'arithmetic';if(mode==='assessment'){try{learner=assessment.profile(input.profile);}catch(e){fail(e.message);}if(!ark.recognizeAssessment)fail('评测尚未配置',503);}
 if(!(await store.charge(user.id,new Date().toISOString().slice(0,10))))fail('今天已整理 20 份，先完成已有练习吧',429);
 if(active>=2||locks.has(user.id))fail('星宝正在整理作业，请稍后再试',429);
 const id=crypto.randomUUID(),record={id,userId:user.id,createdAt:Date.now(),status:'analyzing',mode,profile:learner,subject:learner?.subject||'math',grade:learner?.grade||2,answers:{},points:0};
 locks.add(user.id);locks.add(id);active++;
 try{if(oss){record.sourceType=mime||'text/plain; charset=utf-8';record.objectKey=`learning/${crypto.createHash('sha256').update(user.id).digest('hex')}/${id}/source.${image?(mime==='image/png'?'png':'jpg'):'txt'}`;await oss.put(record.objectKey,image||Buffer.from(text),record.sourceType);}await store.put(record);
 // Persist first, then return a pollable job. Provider requests are bounded and never auto-retried.
 void(async()=>{try{const r=await (mode==='assessment'?ark.recognizeAssessment({text,image,mime,profile:learner}):ark.recognize({text,image,mime}));Object.assign(record,r,{status:'review'});}catch(e){record.status='failed';record.error=e.code==='ASSESSMENT_NO_QUESTIONS'?'图片中未找到清晰完整的学习题目，请上传作业或试卷，检查文字清晰且题干没有被遮挡。':e.code==='NO_SUPPORTED_QUESTIONS'?'没有识别到支持的口算题。目前支持100以内单步与两步混合运算；应用题、括号题暂未纳入训练。请拍清完整题干，或输入算式。':e.name==='TimeoutError'?'识别服务响应超时，请稍后重新提交。':e.code==='AI_FORMAT'?'识别结果格式异常，请稍后重试。':'AI识别服务暂未完成，请稍后重试；若整页较多，可分区域拍摄。';}finally{try{await store.put(record);}finally{active--;locks.delete(user.id);locks.delete(id);}}})().catch(()=>{});
 send(202,publicRecord(record));return true;
 }catch(e){active--;locks.delete(user.id);locks.delete(id);if(record.objectKey)try{await oss.delete(record.objectKey);}catch{}throw e;}
 }
 if(!match)fail('接口不存在',404);
 if(locks.has(match[1]))fail('正在处理，请稍后再试',409);locks.add(match[1]);
 try{
 const r=await store.get(match[1],user.id);if(!r)fail('记录不存在',404);
 if(match[2]==='next'){
 if(r.mode!=='assessment'||r.status!=='complete')fail('请先完成本轮学情练习',409);
 if(r.nextId){const existing=await store.get(r.nextId,user.id);if(existing){send(200,publicRecord(existing));return true;}}
 if(!(await store.charge(user.id,new Date().toISOString().slice(0,10))))fail('今天练习较多，先休息一下，明天再来',429);
 const wrong=r.tasks.filter(t=>!r.answers[t.id]?.correct),targets=wrong.length?wrong:r.tasks;
 const child={id:crypto.randomUUID(),userId:user.id,createdAt:Date.now(),mode:'assessment',profile:r.profile,subject:r.subject,grade:r.grade,status:'review',parentId:r.id,answers:{},points:0,questions:targets.map((t,i)=>({id:String(i),prompt:t.expression+'\n选项：'+t.options.join('；'),studentAnswer:t.options[Number(r.answers[t.id].submitted)],confidence:1,uncertainty:''})),recognitionNote:wrong.length?'根据上轮需巩固的任务继续生成，先核对记录。':'上轮全部答对，将以新情境检验迁移能力。先核对记录。'};
 await store.put(child);r.nextId=child.id;await store.put(r);send(200,publicRecord(child));return true;
 }
 if(match[2]==='confirm'){
 if(r.status!=='review')fail('该资料已确认或尚未识别完成',409);
 let qs;try{qs=r.mode==='assessment'?assessment.questions(input.questions):recognition({questions:input.questions});if(r.mode==='assessment')qs=qs.map((q,i)=>({...q,confidence:r.questions[i]?.confidence??0,uncertainty:r.questions[i]?.uncertainty||''}));}catch(e){fail(e.message);}
 if(qs.length!==r.questions.length)fail('请逐题确认，题目数量不可改变');
 if(active>=2||locks.has(user.id))fail('星宝正在整理作业，请稍后再试',429);
 active++;locks.add(user.id);
 let p;try{
  if(r.mode==='assessment'){
   const history=(await store.list(user.id)).filter(x=>x.id!==r.id&&x.mode==='assessment'&&x.status==='complete'&&x.profile?.grade===r.profile.grade&&x.profile?.subject===r.profile.subject).slice(0,5).map(x=>({createdAt:x.createdAt,feedback:assessment.feedback(x),skills:x.tasks.map(t=>t.skill)}));
   try{p=await ark.generateAssessment(qs,r.profile,history);}catch{fail('评测或练习审校暂未完成，资料已保留，请稍后再次确认生成',503);}
   r.assessment=p.assessment;r.model=p.model;r.generation='assessment';r.generationNote='AI初步学情分析 · 练习经第二轮AI独立审校，仍可能有误';
  }else if(ark?.generate){try{p=await ark.generate(qs);r.generation='ai';r.generationNote='火山 AI 变式练习 · 算式与答案已由程序核验';}catch{p=plan(qs);r.generation='verified';r.generationNote='AI 出题暂未通过检查，已切换为校验过的基础巩固练习。';}}
  else{p=plan(qs);r.generation='verified';r.generationNote='本次使用校验过的基础巩固练习。';}
 }finally{active--;locks.delete(user.id);}
 r.questions=qs;r.evaluated=p.evaluated;r.tasks=p.tasks;r.summary=p.summary;r.status='ready';r.confirmedAt=Date.now();await store.put(r);send(200,publicRecord(r));return true;
 }
 if(match[2]==='answer'){
 if(!['ready','complete'].includes(r.status))fail('请先确认识别结果',409);
 const i=Object.keys(r.answers||{}).length,q=r.tasks[i];
 // idempotent repeats return the already recorded result, never issue points twice.
 if(typeof input.taskId!=='string'||!/^\d$/.test(input.taskId))fail('关卡编号无效');
 if(Object.hasOwn(r.answers,input.taskId)){send(200,{...r.answers[input.taskId],record:publicRecord(r)});return true;}
 if(!q||input.taskId!==q.id||typeof input.answer!=='string'||!/^\d{1,3}$/.test(input.answer))fail('请填写当前关卡的整数答案');
 if(q.options&&Number(input.answer)>3)fail('请选择当前题目的一个选项');
 const correct=Number(input.answer)===q.answer;const result={correct,answer:q.answer,submitted:input.answer,explanation:q.explanation,points:correct?10:0,at:Date.now()};r.answers[q.id]=result;r.points+=result.points;if(i===r.tasks.length-1)r.status='complete';await store.put(r);send(200,{...result,record:publicRecord(r)});return true;
 }fail('接口不存在',404);
 }finally{locks.delete(match[1]);}
 }catch(e){send(e.status||503,{error:e.status?e.message:'学习服务暂不可用，请稍后重试'});}return true;
 }};
};
