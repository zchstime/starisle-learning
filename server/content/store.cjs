'use strict';
const {DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validate,compile}=require('./schema.cjs');
module.exports=function({dir,seed=require('./seed.json')}){
 fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,'content.sqlite'),db=new DatabaseSync(file);fs.chmodSync(file,0o600);
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);
 INSERT OR IGNORE INTO schema_migrations VALUES(1);
 CREATE TABLE IF NOT EXISTS draft(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS releases(id INTEGER PRIMARY KEY AUTOINCREMENT,created_at TEXT NOT NULL,actor TEXT NOT NULL,note TEXT NOT NULL,source_revision INTEGER NOT NULL,snapshot TEXT NOT NULL,content TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS identities(kind TEXT NOT NULL,id TEXT NOT NULL,binding TEXT NOT NULL,PRIMARY KEY(kind,id));
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,detail TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS admins(username TEXT PRIMARY KEY,salt TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS admin_sessions(token TEXT PRIMARY KEY,username TEXT NOT NULL,expires INTEGER NOT NULL);
 `);
 const audit=(actor,action,target,detail={})=>db.prepare('INSERT INTO audit(at,actor,action,target,detail) VALUES(?,?,?,?,?)').run(new Date().toISOString(),actor,action,target,JSON.stringify(detail));
 const draft=()=>{const row=db.prepare('SELECT * FROM draft WHERE id=1').get();return {revision:row.revision,...JSON.parse(row.payload)};};
 const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 const error=(message,status=400)=>{throw Object.assign(Error(message),{status});};
 const checkRevision=rev=>{if(!Number.isSafeInteger(rev)||draft().revision!==rev)error('草稿已被其他人修改，请刷新后重试。',409);};
 const snapshot=d=>({schemaVersion:1,subjects:d.subjects,questions:d.questions,chapters:d.chapters});
 function checkIdentities(d){for(const c of d.chapters){const existing=db.prepare("SELECT binding FROM identities WHERE kind='chapter' AND id=?").get(c.id);if(existing&&existing.binding!==c.subject+':'+c.grade)error('已发布章节不可更改学科/年级，请复制新章节');for(const b of c.bindings){const old=db.prepare("SELECT binding FROM identities WHERE kind='level' AND id=?").get(b.id);if(old&&old.binding!==c.id+':'+b.questionId)error('已发布关卡不可换题或跨章移动，请创建新关卡');}}}
 function register(d){for(const s of d.subjects)db.prepare('INSERT OR IGNORE INTO identities VALUES(?,?,?)').run('subject',s.id,'');for(const c of d.chapters){db.prepare('INSERT OR IGNORE INTO identities VALUES(?,?,?)').run('chapter',c.id,c.subject+':'+c.grade);for(const b of c.bindings)db.prepare('INSERT OR IGNORE INTO identities VALUES(?,?,?)').run('level',b.id,c.id+':'+b.questionId);}}
 function publish(actor,note,rev,source){return tx(()=>{checkRevision(rev);const d=source||snapshot(draft()),report=validate(d);if(report.errors.length)error(report.errors.slice(0,8).map(e=>e.id+': '+e.message).join('\n'));checkIdentities(d);register(d);const ids=kind=>db.prepare('SELECT id FROM identities WHERE kind=?').all(kind).map(r=>r.id);const content=compile(d,{levelIds:ids('level'),chapterIds:ids('chapter'),subjectIds:ids('subject')});const result=db.prepare('INSERT INTO releases(created_at,actor,note,source_revision,snapshot,content) VALUES(?,?,?,?,?,?)').run(new Date().toISOString(),actor,note,rev,JSON.stringify(d),JSON.stringify(content));const id=Number(result.lastInsertRowid);db.prepare("INSERT OR REPLACE INTO settings VALUES('release',?)").run(String(id));audit(actor,'publish',String(id),{note,sourceRevision:rev});return {id,...report};});}
 if(!db.prepare('SELECT id FROM draft').get())db.prepare('INSERT INTO draft VALUES(1,1,?)').run(JSON.stringify(seed));
 // Recover safely if the process stopped between seed insertion and first publication.
 if(!db.prepare("SELECT value FROM settings WHERE key='release'").get())publish('system','迁移内置课程，保留全部关卡编号',draft().revision);
 return {db,audit,draft,version:()=>Number(db.prepare("SELECT value FROM settings WHERE key='release'").get().value),close:()=>db.close(),
  save(actor,revision,next){return tx(()=>{checkRevision(revision);const d=snapshot(next);if(!Array.isArray(d.subjects)||!Array.isArray(d.questions)||!Array.isArray(d.chapters)||d.questions.length>20000||d.chapters.length>5000||d.subjects.length>200)error('内容数量或格式无效');const report=validate(d);if(report.errors.length)error(report.errors.slice(0,10).map(e=>e.id+': '+e.message).join('\n'));checkIdentities(d);db.prepare('UPDATE draft SET revision=revision+1,payload=? WHERE id=1').run(JSON.stringify(d));audit(actor,'save-draft','draft',{revision:revision+1});return {revision:revision+1,...report};});},
  publish,
  rollback(actor,id,revision){const r=db.prepare('SELECT snapshot FROM releases WHERE id=?').get(id);if(!r)error('版本不存在',404);return publish(actor,`回退至版本 ${id}`,revision,JSON.parse(r.snapshot));},
  current(){const id=Number(db.prepare("SELECT value FROM settings WHERE key='release'").get().value);const r=db.prepare('SELECT content FROM releases WHERE id=?').get(id);return {release:id,...JSON.parse(r.content)};},
  releases:()=>db.prepare('SELECT id,created_at,actor,note,source_revision FROM releases ORDER BY id DESC LIMIT 100').all(),
  logs:()=>db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 200').all(),
  addAdmin(username,password,role='owner'){if(!/^[a-zA-Z0-9._-]{3,40}$/.test(username)||typeof password!=='string'||password.length<12||!['owner','editor','support'].includes(role))error('管理员名称需 3～40 位，密码至少 12 位，角色需有效');const salt=crypto.randomBytes(16).toString('hex'),hash=crypto.scryptSync(password,salt,64).toString('hex');db.prepare('INSERT INTO admins VALUES(?,?,?,?)').run(username,salt,hash,role);audit('system','create-admin',username,{role});},
 };
};
