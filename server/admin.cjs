'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {MODULES,arts,validate}=require('./content/schema.cjs');
module.exports=function({dir,origin,auth,store,seed}){
 const content=require('./content/store.cjs')({dir,seed}),db=content.db;
 if(!db.prepare('SELECT username FROM admins LIMIT 1').get()){
  const password=crypto.randomBytes(18).toString('base64url');content.addAdmin('admin',password);
  fs.writeFileSync(path.join(dir,'bootstrap.txt'),`星屿学园本地管理后台\n用户名：admin\n初始密码：${password}\n请登录后修改密码。\n`,{mode:0o600});
 }
 const tokens=new Map(),attempts=new Map();
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
 const cookie=(t,age)=>`starisle_admin=${t}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${age}${origin.startsWith('https:')?'; Secure':''}`;
 const session=req=>{const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('starisle_admin='))?.slice(15)||'';return db.prepare('SELECT a.username,a.role FROM admin_sessions s JOIN admins a ON a.username=s.username WHERE s.token=? AND s.expires>?').get(hash(raw),Date.now());};
 const roles=(user,allowed)=>{if(!allowed.includes(user.role))fail('当前角色无此操作权限',403);};
 async function body(req){if(req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json'))fail('请求来源无效',403);let bytes=0,parts=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>4*1024*1024)fail('请求过大',413);parts.push(chunk);}try{return JSON.parse(Buffer.concat(parts).toString());}catch{fail('JSON 格式无效');}}
 const result={content,close:()=>content.close(),async handle(req,res){const url=new URL(req.url,origin),p=url.pathname;
 if(!p.startsWith('/api/admin/')&&!['/api/content/current','/api/content/version'].includes(p)&&!p.startsWith('/admin'))return false;
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 try{
 if(req.headers.host!==new URL(origin).host)fail('访问地址不匹配',403);
 if(p==='/admin'||p.startsWith('/admin/')){
  if(req.method!=='GET')fail('请求方法不支持',405);const rel=p==='/admin'||p==='/admin/'?'index.html':p.slice(7);if(!['index.html','app.js','ui.js','content.js','accounts.js','style.css'].includes(rel))fail('页面不存在',404);
  res.writeHead(200,{'Content-Type':rel.endsWith('.html')?'text/html; charset=utf-8':rel.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});res.end(fs.readFileSync(path.join(__dirname,'../web/admin',rel)));return true;
 }
 if(p.startsWith('/api/content/')){if(req.method!=='GET')fail('请求方法不支持',405);send(200,p.endsWith('/version')?{release:content.version(),schemaVersion:1}:content.current());return true;}
 if(p==='/api/admin/login'&&req.method==='POST'){
  const d=await body(req),key=req.socket.remoteAddress,now=Date.now(),a=attempts.get(key);if(a&&a.until>now&&a.count>=10)fail('登录尝试过多，请 15 分钟后重试',429);attempts.set(key,{count:a&&a.until>now?a.count+1:1,until:now+900000});if(attempts.size>1000)for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);
  if(typeof d.username!=='string'||typeof d.password!=='string'||d.password.length>256)fail('用户名或密码错误',401);const user=db.prepare('SELECT * FROM admins WHERE username=?').get(d.username);const computed=crypto.scryptSync(d.password,user?.salt||'invalid-admin-salt',64);if(!user||!crypto.timingSafeEqual(computed,Buffer.from(user.password_hash,'hex')))fail('用户名或密码错误',401);
  attempts.delete(key);const t=crypto.randomBytes(32).toString('hex');db.prepare('DELETE FROM admin_sessions WHERE expires<?').run(now);db.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').run(hash(t),user.username,now+28800000);res.setHeader('Set-Cookie',cookie(t,28800));content.audit(user.username,'login','admin');send(200,{username:user.username,role:user.role});return true;
 }
 const user=session(req);if(!user)fail('请先登录管理后台',401);
 if(req.method==='GET'){
  if(p==='/api/admin/me')send(200,user);
  else if(p==='/api/admin/draft'){roles(user,['owner','editor']);send(200,content.draft());}
  else if(p==='/api/admin/modules'){send(200,{modules:MODULES,arts});}
  else if(p==='/api/admin/releases'){roles(user,['owner','editor']);send(200,content.releases());}
  else if(p==='/api/admin/audit'){roles(user,['owner']);send(200,content.logs());}
  else if(p==='/api/admin/users'){roles(user,['owner','support']);send(200,auth.listUsers({query:url.searchParams.get('q')||'',page:Number(url.searchParams.get('page'))||1}));}
  else if(p==='/api/admin/player'){roles(user,['owner','support']);const account=auth.getUser(url.searchParams.get('id'));if(!account)fail('用户不存在',404);const saved=store?await store.get(account):null;send(200,{account,cloudAvailable:!!store,save:saved});}
  else if(p==='/api/admin/template'){roles(user,['owner','editor']);const buffer=await require('./content/import.cjs').template();res.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="starisle-questions.xlsx"','Cache-Control':'no-store'});res.end(Buffer.from(buffer));}
  else if(p==='/api/admin/preview'){roles(user,['owner','editor']);const {compile}=require('./content/schema.cjs'),d=content.draft();send(200,{release:0,...compile(d)});}
  else fail('接口不存在',404);return true;
 }
 if(req.method!=='POST')fail('请求方法不支持',405);const d=await body(req);
 if(p==='/api/admin/logout'){db.prepare('DELETE FROM admin_sessions WHERE username=?').run(user.username);res.setHeader('Set-Cookie',cookie('',0));send(200,{ok:true});return true;}
 if(p==='/api/admin/password'){if(typeof d.password!=='string'||d.password.length<12||d.password.length>256)fail('密码需 12～256 位');const row=db.prepare('SELECT * FROM admins WHERE username=?').get(user.username);if(typeof d.currentPassword!=='string'||d.currentPassword.length>256||!crypto.timingSafeEqual(crypto.scryptSync(d.currentPassword,row.salt,64),Buffer.from(row.password_hash,'hex')))fail('当前密码不正确',403);const salt=crypto.randomBytes(16).toString('hex');db.prepare('UPDATE admins SET salt=?,password_hash=? WHERE username=?').run(salt,crypto.scryptSync(d.password,salt,64).toString('hex'),user.username);db.prepare('DELETE FROM admin_sessions WHERE username=?').run(user.username);content.audit(user.username,'change-password',user.username);const bootstrap=path.join(dir,'bootstrap.txt');if(fs.existsSync(bootstrap))fs.unlinkSync(bootstrap);send(200,{ok:true});return true;}
 if(p==='/api/admin/users/status'){roles(user,['owner','support']);if(typeof d.id!=='string'||typeof d.disabled!=='boolean'||typeof d.reason!=='string'||!d.reason.trim()||d.reason.length>500)fail('需要用户编号、状态和操作原因');auth.setDisabled(d.id,d.disabled);content.audit(user.username,d.disabled?'disable-user':'enable-user',d.id,{reason:d.reason});send(200,{ok:true});return true;}
 if(p==='/api/admin/admins'){roles(user,['owner']);content.addAdmin(d.username,d.password,d.role);content.audit(user.username,'add-admin',d.username,{role:d.role});send(200,{ok:true});return true;}
 roles(user,['owner','editor']);
 if(p==='/api/admin/save'){send(200,content.save(user.username,d.revision,d));}
 else if(p==='/api/admin/validate'){send(200,validate(content.draft()));}
 else if(p==='/api/admin/publish'){roles(user,['owner']);if(typeof d.note!=='string'||!d.note.trim()||d.note.length>500)fail('请填写发布说明（最多 500 字）');send(200,content.publish(user.username,d.note,d.revision));}
 else if(p==='/api/admin/rollback'){roles(user,['owner']);if(!Number.isSafeInteger(d.id))fail('版本编号无效');send(200,content.rollback(user.username,d.id,d.revision));}
 else if(p==='/api/admin/import/preview'){if(typeof d.base64!=='string'||d.base64.length>2800000)fail('文件不能超过 2 MB');const report=await require('./content/import.cjs').parse(Buffer.from(d.base64,'base64'),content.draft());const token=crypto.randomBytes(24).toString('hex');for(const [k,v] of tokens)if(v.expires<Date.now())tokens.delete(k);if(tokens.size>=30)fail('导入预览任务过多，请稍后再试',429);tokens.set(token,{username:user.username,revision:d.revision,items:report.items,errors:report.errors,expires:Date.now()+900000});send(200,{...report,token});}
 else if(p==='/api/admin/import/commit'){const task=tokens.get(d.token);if(!task||task.username!==user.username||task.expires<Date.now())fail('预览已失效，请重新上传');if(task.errors.length)fail('请修复所有错误行后重新上传');const next=content.draft(),map=new Map(next.questions.map(q=>[q.id,q]));for(const {item} of task.items)map.set(item.id,item);next.questions=[...map.values()];const saved=content.save(user.username,task.revision,next);tokens.delete(d.token);content.audit(user.username,'import','questions',{count:task.items.length});send(200,saved);}
 else fail('接口不存在',404);
 }catch(e){send(e.status||400,{error:e.status?e.message:(e.message?.includes('UNIQUE')?'编号已存在':e.message||'操作失败')});}return true;
 }};return result;
};
