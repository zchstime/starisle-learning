const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../build/web-desktop');
const port=Number(process.env.STARISLE_PORT||7456),origin=process.env.AUTH_PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
const smsbaoFile=path.resolve(__dirname,'../local/auth/smsbao.json');
const smsbao=fs.existsSync(smsbaoFile)?JSON.parse(fs.readFileSync(smsbaoFile,'utf8')):null;
const mode=process.env.AUTH_MODE||(smsbao?.enabled?'live':'demo');
const sendSms=process.env.SMS_ADAPTER_PATH?require(path.resolve(process.env.SMS_ADAPTER_PATH)):(mode==='live'&&smsbao?require('../server/providers/smsbao.cjs')(smsbao):undefined);
const auth=require('../server/auth.cjs')({dir:process.env.AUTH_DATA_DIR||path.resolve(__dirname,'../local/auth'),origin,mode,sendSms});
const mysqlFile=process.env.MYSQL_CONFIG_PATH||(process.env.AUTH_DATA_DIR?path.resolve(process.env.AUTH_DATA_DIR,'../cloud/mysql.json'):path.resolve(__dirname,'../local/cloud/mysql.json'));
const mysqlConfig=fs.existsSync(mysqlFile)?JSON.parse(fs.readFileSync(mysqlFile,'utf8')):null;
if(mysqlConfig&&['127.0.0.1','localhost'].includes(new URL(origin).hostname)&&mysqlConfig.localHost)mysqlConfig.host=mysqlConfig.localHost;
const saveStore=mysqlConfig?require('../server/storage/mysql.cjs')(mysqlConfig):null;
const saveHandler=require('../server/saves.cjs')({origin,auth,store:saveStore});
const admin=require('../server/admin.cjs')({dir:process.env.ADMIN_DATA_DIR||path.resolve(__dirname,'../local/admin'),origin,auth,store:saveStore});
const cloudDir=process.env.AUTH_DATA_DIR?path.resolve(process.env.AUTH_DATA_DIR,'../cloud'):path.resolve(__dirname,'../local/cloud');
const readConfig=name=>{const file=path.join(cloudDir,name+'.json');return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;};
const arkConfig=process.env.ARK_API_KEY?{apiKey:process.env.ARK_API_KEY,model:process.env.ARK_MODEL}:readConfig('ark');
const ossConfig=readConfig('oss');
const learning=require('../server/learning/http.cjs')({origin,auth,dir:process.env.LEARNING_DATA_DIR||path.resolve(__dirname,'../local/learning'),mysql:mysqlConfig,ark:arkConfig?require('../server/providers/ark.cjs')(arkConfig):null,oss:ossConfig?require('../server/providers/oss-learning.cjs')(ossConfig):null});
const speechConfig=process.env.SPEECH_API_KEY?{apiKey:process.env.SPEECH_API_KEY,speaker:process.env.SPEECH_SPEAKER}:readConfig('speech');
const asrConfig=process.env.ASR_API_KEY?{apiKey:process.env.ASR_API_KEY}:readConfig('asr');
const rtcConfig=process.env.RTC_APP_ID?{appId:process.env.RTC_APP_ID,appKey:process.env.RTC_APP_KEY,accessKeyId:process.env.VOLCENGINE_ACCESS_KEY_ID,secretKey:process.env.VOLCENGINE_SECRET_ACCESS_KEY,model:process.env.RTC_MODEL,speaker:process.env.RTC_SPEAKER}:readConfig('rtc');
const companion=require('../server/companion/http.cjs')({origin,auth,dir:process.env.COMPANION_DATA_DIR||path.resolve(__dirname,'../local/companion'),mysql:mysqlConfig,learning,chat:arkConfig?require('../server/providers/ark-companion.cjs')(arkConfig):null,speech:speechConfig?require('../server/providers/volc-speech.cjs')(speechConfig):null,asr:asrConfig?require('../server/providers/volc-asr.cjs')(asrConfig):null,rtc:rtcConfig?require('../server/providers/volc-rtc.cjs')(rtcConfig):null});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav','.wasm':'application/wasm'};
const server=http.createServer(async(req,res)=>{
 if(await companion.handle(req,res))return;
 if(await learning.handle(req,res))return;
 if(await admin.handle(req,res))return;
 if(await auth.handle(req,res))return;
 if(await saveHandler(req,res))return;
 let rel;try{rel=decodeURIComponent(new URL(req.url,origin).pathname);}catch{res.writeHead(400).end();return;}
 const f=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(f,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
});
server.listen(port,'127.0.0.1',()=>console.log(`星屿学园 ${origin} / ${mode==='demo'?'本地演示，不发送短信':'短信登录'}`));

for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close();void companion.close().finally(()=>process.exit(0));setTimeout(()=>process.exit(1),25000).unref();});
