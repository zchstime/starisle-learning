const {DatabaseSync}=require('node:sqlite');
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
module.exports=function createAuth({dir,origin,mode='demo',sendSms,now=()=>Date.now()}){
 if(!['demo','live'].includes(mode))throw Error('Unknown auth mode');
 const site=new URL(origin),localHttp=site.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(site.hostname);
 if(mode==='live'&&(!sendSms||!(site.protocol==='https:'||localHttp)))throw Error('Live SMS requires an adapter and HTTPS origin (HTTP only on loopback)');
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const secretFile=path.join(dir,'secret');if(!fs.existsSync(secretFile))fs.writeFileSync(secretFile,crypto.randomBytes(32),{mode:0o600});
 const secret=fs.readFileSync(secretFile),file=path.join(dir,`auth-${mode}.sqlite`),db=new DatabaseSync(file);fs.chmodSync(file,0o600);
 db.exec('CREATE TABLE IF NOT EXISTS users(phone TEXT PRIMARY KEY,id TEXT,masked TEXT);CREATE TABLE IF NOT EXISTS codes(phone TEXT PRIMARY KEY,hash TEXT,expires INTEGER,attempts INTEGER);CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,start INTEGER,count INTEGER,last INTEGER);CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user TEXT,expires INTEGER)');
 // Additive migrations retain existing authentication records.
 const columns=new Set(db.prepare('PRAGMA table_info(users)').all().map(c=>c.name));
 if(!columns.has('disabled'))db.exec('ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0');
 if(!columns.has('created_at'))db.exec('ALTER TABLE users ADD COLUMN created_at TEXT');
 if(!columns.has('last_login'))db.exec('ALTER TABLE users ADD COLUMN last_login TEXT');
 const hash=s=>crypto.createHmac('sha256',secret).update(s).digest('hex');
 const cookie=(token,age)=>`starisle_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${site.protocol==='https:'?'; Secure':''}`;
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
 function rate(key,max,cooldown){const t=now(),r=db.prepare('SELECT * FROM limits WHERE key=?').get(key);if(r&&t-r.start<3600000&&(r.count>=max||t-r.last<cooldown))fail('请求过于频繁，请稍后再试。',429);if(!r||t-r.start>=3600000)db.prepare('INSERT OR REPLACE INTO limits VALUES(?,?,1,?)').run(key,t,t);else db.prepare('UPDATE limits SET count=count+1,last=? WHERE key=?').run(t,key);}
 function identify(req){const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('starisle_session='))?.slice(17)||'';const u=db.prepare('SELECT users.id,users.masked FROM users JOIN sessions ON users.id=sessions.user WHERE sessions.token=? AND sessions.expires>? AND users.disabled=0').get(hash(token),now());return u?{...u,mode}:null;}
 return {identify,
 listUsers({query='',page=1}={}){page=Math.max(1,Math.floor(page)||1);query=String(query).slice(0,100);const pattern='%'+query.replace(/[\\%_]/g,'\\$&')+'%';const where="WHERE id LIKE ? ESCAPE '\\' OR masked LIKE ? ESCAPE '\\'";const total=db.prepare('SELECT COUNT(*) AS n FROM users '+where).get(pattern,pattern).n;const rows=db.prepare('SELECT id,masked,disabled,created_at,last_login FROM users '+where+' ORDER BY rowid DESC LIMIT 50 OFFSET ?').all(pattern,pattern,(page-1)*50);return {total,page,rows,mode};},
 getUser(id){const u=db.prepare('SELECT id,masked,disabled,created_at,last_login FROM users WHERE id=?').get(id||'');return u?{...u,mode}:null;},
 setDisabled(id,disabled){const result=db.prepare('UPDATE users SET disabled=? WHERE id=?').run(disabled?1:0,id);if(!result.changes)throw Object.assign(Error('用户不存在'),{status:404});if(disabled)db.prepare('DELETE FROM sessions WHERE user=?').run(id);},
 close:()=>db.close(),async handle(req,res){
 const url=new URL(req.url,origin);if(!url.pathname.startsWith('/api/auth/'))return false;
 const respond=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
 if(req.headers.host!==new URL(origin).host)fail('访问地址不匹配。',403);
 const route=url.pathname.slice(10);
 if(req.method==='GET'&&route==='config'){respond(200,{mode,expiry:300,cooldown:60});return true;}
 const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('starisle_session='))?.slice(17)||'';
 if(req.method==='GET'&&route==='me'){const user=db.prepare('SELECT users.id,users.masked FROM users JOIN sessions ON users.id=sessions.user WHERE sessions.token=? AND sessions.expires>? AND users.disabled=0').get(hash(token),now());respond(200,{user:user?{...user,mode}:null});return true;}
 if(req.method!=='POST')fail('不支持此请求。',405);
 if(req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json'))fail('请求来源无效。',403);
 let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)fail('请求过大。',413);}let data;try{data=JSON.parse(body);}catch{fail('请求格式错误。');}
 if(route==='logout'){db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));res.setHeader('Set-Cookie',cookie('',0));respond(200,{ok:true});return true;}
 const phone=String(data.phone||'');if(!/^1[3-9]\d{9}$/.test(phone))fail('请输入正确的 11 位手机号。');const p=hash('phone:'+phone);
 if(route==='code'){
 rate(hash('ip:'+req.socket.remoteAddress),30,0);rate(p,8,60000);
 const code=String(crypto.randomInt(100000,1000000));db.prepare('INSERT OR REPLACE INTO codes VALUES(?,?,?,0)').run(p,hash(p+code),now()+300000);
 try{if(mode==='live')await sendSms({phone,code,expiresInSeconds:300});}catch{db.prepare('DELETE FROM codes WHERE phone=?').run(p);fail('短信发送失败，请稍后重试。',503);}
 respond(200,{mode,cooldown:60,...(mode==='demo'?{demoCode:code}:{})});return true;
 }
 if(route==='verify'){
 rate(hash('verify-ip:'+req.socket.remoteAddress),120,0);
 const r=db.prepare('SELECT * FROM codes WHERE phone=?').get(p),code=String(data.code||'');
 if(!r||r.expires<=now()||r.attempts>=5)fail('验证码已失效，请重新获取。');
 if(!/^\d{6}$/.test(code)||!crypto.timingSafeEqual(Buffer.from(r.hash),Buffer.from(hash(p+code)))){db.prepare('UPDATE codes SET attempts=attempts+1 WHERE phone=?').run(p);fail('验证码不正确，请检查后再试。');}
 db.prepare('DELETE FROM codes WHERE phone=?').run(p);
 let user=db.prepare('SELECT id,masked,disabled FROM users WHERE phone=?').get(p),created=!user;
 if(!user){user={id:(mode==='demo'?'demo_':'user_')+crypto.randomUUID(),masked:phone.slice(0,3)+'****'+phone.slice(7)};db.prepare('INSERT INTO users(phone,id,masked,created_at) VALUES(?,?,?,?)').run(p,user.id,user.masked,new Date(now()).toISOString());}
 if(user.disabled)fail('账号已停用，请联系管理员。',403);
 db.prepare('UPDATE users SET last_login=? WHERE id=?').run(new Date(now()).toISOString(),user.id);
 const session=crypto.randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(session),user.id,now()+604800000);res.setHeader('Set-Cookie',cookie(session,604800));respond(200,{user:{id:user.id,masked:user.masked,mode},created});return true;
 }
 fail('接口不存在。',404);
 }catch(e){respond(e.status||500,{error:e.status?e.message:'服务暂时不可用，请稍后重试。'});}return true;
 }};
};
