'use strict';
const fs=require('node:fs'),path=require('node:path');
module.exports=async({dir,mysql})=>{
 let db,pool;
 if(mysql){pool=require('mysql2/promise').createPool({host:mysql.host,port:mysql.port||3306,user:mysql.user,password:mysql.password,database:mysql.database,connectionLimit:2,connectTimeout:5000});await pool.execute('CREATE TABLE IF NOT EXISTS companion_state (user_id VARCHAR(100) PRIMARY KEY,payload JSON NOT NULL)');await pool.execute('CREATE TABLE IF NOT EXISTS companion_usage (user_id VARCHAR(100),day VARCHAR(10),kind VARCHAR(16),count INT NOT NULL,PRIMARY KEY(user_id,day,kind))');}
 else{fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,'companion.sqlite');db=new(require('node:sqlite').DatabaseSync)(file);fs.chmodSync(file,0o600);db.exec('CREATE TABLE IF NOT EXISTS companion_state(user_id TEXT PRIMARY KEY,payload TEXT NOT NULL);CREATE TABLE IF NOT EXISTS companion_usage(user_id TEXT,day TEXT,kind TEXT,count INTEGER NOT NULL,PRIMARY KEY(user_id,day,kind));');}
 const parse=v=>typeof v==='string'?JSON.parse(v):v;
 const prune=r=>{r.messages=(r.messages||[]).filter(m=>Number.isFinite(m.at)&&Date.now()-m.at<=30*86400000).slice(-24);return r;};
 async function save(user,r){const s=JSON.stringify(r);if(pool)await pool.execute('INSERT INTO companion_state VALUES(?,?) ON DUPLICATE KEY UPDATE payload=?',[user,s,s]);else db.prepare('INSERT OR REPLACE INTO companion_state VALUES(?,?)').run(user,s);}
 return {
 async get(user){let data;if(pool){const [rows]=await pool.execute('SELECT payload FROM companion_state WHERE user_id=?',[user]);data=rows[0]?.payload;}else data=db.prepare('SELECT payload FROM companion_state WHERE user_id=?').get(user)?.payload;const r=data?parse(data):{consent:false,memory:true,messages:[]};prune(r);return r;},
 put:save,
 async calls(){const rows=pool?(await pool.execute('SELECT user_id,payload FROM companion_state'))[0]:db.prepare('SELECT user_id,payload FROM companion_state').all();return rows.map(r=>({user:r.user_id,...parse(r.payload)})).filter(r=>r.call);},
 async charge(user,kind,limit){const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Macau'}).format(new Date());if(pool){await pool.execute('INSERT IGNORE INTO companion_usage VALUES(?,?,?,0)',[user,day,kind]);const [r]=await pool.execute('UPDATE companion_usage SET count=count+1 WHERE user_id=? AND day=? AND kind=? AND count<?',[user,day,kind,limit]);return r.affectedRows===1;}db.prepare('INSERT OR IGNORE INTO companion_usage VALUES(?,?,?,0)').run(user,day,kind);return db.prepare('UPDATE companion_usage SET count=count+1 WHERE user_id=? AND day=? AND kind=? AND count<?').run(user,day,kind,limit).changes===1;},
 async expired(){const rows=pool?(await pool.execute('SELECT user_id,payload FROM companion_state'))[0]:db.prepare('SELECT user_id,payload FROM companion_state').all();return rows.filter(r=>(parse(r.payload).messages||[]).some(m=>Date.now()-m.at>30*86400000)).map(r=>r.user_id);},
 close:()=>pool?pool.end():db.close()
 };
};
