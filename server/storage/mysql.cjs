const mysql=require('mysql2/promise');
module.exports=function(config){
 const pool=mysql.createPool({host:config.host,port:config.port||3306,user:config.user,password:config.password,database:config.database,connectionLimit:3,connectTimeout:5000,waitForConnections:true,queueLimit:20});
 const parse=r=>r?{revision:Number(r.revision),payload:typeof r.payload==='string'?JSON.parse(r.payload):r.payload}:{revision:0,payload:null};
 return {
 async get(user){const [r]=await pool.execute('SELECT revision,payload FROM player_saves WHERE user_id=?',[user.id]);return parse(r[0]);},
 async put(user,revision,payload){const db=await pool.getConnection();try{await db.beginTransaction();
 // Lock the user row first, including first-ever saves, to serialize writers.
 await db.execute('INSERT INTO game_users(user_id,masked_phone,auth_mode) VALUES(?,?,?) ON DUPLICATE KEY UPDATE last_seen_at=CURRENT_TIMESTAMP(3)',[user.id,user.masked,user.mode]);
 const [rows]=await db.execute('SELECT revision,payload FROM player_saves WHERE user_id=? FOR UPDATE',[user.id]);const old=parse(rows[0]);
 if(old.revision!==revision){await db.rollback();return {conflict:true,...old};}
 if(JSON.stringify(old.payload)===JSON.stringify(payload)){await db.commit();return old;}
 const next=revision+1,json=JSON.stringify(payload);
 await db.execute('INSERT INTO player_saves(user_id,revision,payload) VALUES(?,?,?) ON DUPLICATE KEY UPDATE revision=?,payload=?',[user.id,next,json,next,json]);
 await db.execute('INSERT INTO player_save_history(user_id,revision,payload) VALUES(?,?,?)',[user.id,next,json]);
 await db.execute('DELETE FROM player_save_history WHERE user_id=? AND revision<?',[user.id,Math.max(0,next-29)]);
 await db.commit();return {revision:next,payload};
 }catch(e){await db.rollback();throw e;}finally{db.release();}},close:()=>pool.end()};
};
