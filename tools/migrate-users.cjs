// Add profiles without changing authentication IDs, phone hashes, sessions or passwords.
const fs=require('node:fs'),path=require('node:path'),mysql=require('mysql2/promise'),{DatabaseSync}=require('node:sqlite');
(async()=>{const config=JSON.parse(fs.readFileSync(process.env.MYSQL_CONFIG_PATH||path.resolve(__dirname,'../local/cloud/mysql.json')));if(!process.env.AUTH_DATA_DIR&&config.localHost)config.host=config.localHost;
const db=await mysql.createConnection({host:config.host,user:config.user,password:config.password,database:config.database,port:config.port});try{
const mode=process.env.AUTH_MODE||'live',dir=process.env.AUTH_DATA_DIR||path.resolve(__dirname,'../local/auth'),file=path.join(dir,`auth-${mode}.sqlite`);if(!fs.existsSync(file))throw Error('Auth database absent');
const auth=new DatabaseSync(file,{readOnly:true});const users=auth.prepare('SELECT id,masked FROM users').all();auth.close();
await db.beginTransaction();for(const u of users)await db.execute('INSERT INTO game_users(user_id,masked_phone,auth_mode) VALUES(?,?,?) ON DUPLICATE KEY UPDATE masked_phone=?',[u.id,u.masked,mode,u.masked]);await db.commit();console.log('Migrated profiles:',users.length);
}finally{await db.end();}})().catch(()=>{console.error('Profile migration failed; no credentials printed');process.exitCode=1;});
