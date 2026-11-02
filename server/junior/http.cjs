'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../../web/junior');
const modules=Promise.all([import('../../web/junior/catalog.mjs'),import('../../web/junior/engine.mjs')]);
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.wav':'audio/wav','.json':'application/json'};
module.exports=function({origin,auth,dir,mysql,store:provided}){
 // Lazily initialize storage; browsing an original sample never mutates production data.
 let pending;const store=()=>pending||(pending=provided?Promise.resolve(provided):require('./store.cjs')({dir,mysql}));
 return {async close(){if(pending)await(await pending).close();},async handle(req,res){
 const url=new URL(req.url,origin),send=(s,v)=>{res.writeHead(s,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(v));};
 if(url.pathname==='/junior'||url.pathname.startsWith('/junior/')){
 if(!['GET','HEAD'].includes(req.method)){send(405,{error:'不支持此请求'});return true;}
 let rel;try{rel=decodeURIComponent(url.pathname.slice('/junior'.length))||'/index.html';if(rel==='/')rel='/index.html';}catch{send(400,{error:'地址无效'});return true;}
 const file=path.resolve(root,'.'+rel),type=types[path.extname(file)];if(!file.startsWith(root+path.sep)||!type){send(404,{error:'资源不存在'});return true;}
 try{const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);}catch{send(404,{error:'资源不存在'});}return true;
 }
 if(!url.pathname.startsWith('/api/junior/'))return false;
 try{
 if(req.headers.host!==new URL(origin).host){send(403,{error:'请求来源无效'});return true;}
 // Public diagnostic contains curriculum IDs only, never account or draft data.
 if(url.pathname==='/api/junior/catalog'&&req.method==='GET'){
 const [{units,tasks}]=await modules;send(200,{unitIds:units.map(u=>u.id),taskIds:tasks.map(t=>t.id)});return true;
 }
 const user=auth.identify(req);if(!user){send(401,{error:'请先登录；本机草稿仍保留'});return true;}
 if(req.headers['x-junior-account']!==user.id){send(409,{error:'账号已变化，请刷新页面后继续',accountChanged:true});return true;}
 if(url.pathname==='/api/junior/state'&&req.method==='GET'){send(200,{userId:user.id,states:await(await store()).list(user.id)});return true;}
 const match=url.pathname.match(/^\/api\/junior\/tasks\/([a-z0-9.-]+)$/);
 if(!match||req.method!=='PUT'){send(404,{error:'任务接口不存在'});return true;}
 if(req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json')){send(403,{error:'请求来源无效'});return true;}
 let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>24000){send(413,{error:'草稿过大'});return true;}body+=chunk;}
 let input;try{input=JSON.parse(body);}catch{send(400,{error:'请求格式无效'});return true;}
 const [{taskById},{validateDraft,nextState}]=await modules,t=taskById.get(match[1]);
 if(!t||!input||!Number.isSafeInteger(input.revision)||input.revision<0||typeof input.submit!=='boolean'||typeof input.hinted!=='boolean'||!validateDraft(t,input.draft)){send(400,{error:'任务或草稿格式无效'});return true;}
 const result=await(await store()).put(user.id,t.id,input.revision,old=>nextState(t,old,input));send(result.conflict?409:200,result);
 }catch{send(503,{error:'账号存档暂不可用，本机草稿仍保留'});}return true;
 }};
};
