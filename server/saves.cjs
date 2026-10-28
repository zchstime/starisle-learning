const KEYS=['starisle.adventure.v3','starisle.grade2.chapter-one.v2','starisle.music','starisle.musicVolume','starisle.profile.v1'];
function validate(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).some(k=>!KEYS.includes(k)))throw Error('invalid');
 for(const [key,value] of Object.entries(payload)){
 if(typeof value!=='string'||value.length>250000)throw Error('invalid');
 if(key===KEYS[2]){if(!['on','off'].includes(value))throw Error('invalid');continue;}
 if(key===KEYS[3]){if(!value.trim()||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>1)throw Error('invalid');continue;}
 const p=JSON.parse(value);if(!p||typeof p!=='object'||Array.isArray(p))throw Error('invalid');
 if(key===KEYS[4]){if(p.version!==1||!['xingbao','rabbit','panda','fox','cat','dragon'].includes(p.avatar)||!Number.isSafeInteger(p.updatedAt)||p.updatedAt<0||Object.keys(p).some(k=>!['version','avatar','updatedAt'].includes(k)))throw Error('invalid');continue;}
 if(key===KEYS[0]&&(p.version!==3||!Array.isArray(p.done)||p.done.length>5000||p.done.some(x=>typeof x!=='string'||x.length>128)||!Array.isArray(p.medals)||p.medals.some(x=>typeof x!=='string'||x.length>128)))throw Error('invalid');
 if(key===KEYS[0])for(const field of ['labDone','gifts'])if(p[field]!==undefined&&(!Array.isArray(p[field])||p[field].length>100||p[field].some(x=>typeof x!=='string'||x.length>128)))throw Error('invalid');
 }return payload;
}
module.exports=function({origin,auth,store}){return async(req,res)=>{
 if(new URL(req.url,origin).pathname!=='/api/save')return false;
 const send=(s,d)=>{res.writeHead(s,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(d));};
 try{
 if(req.headers.host!==new URL(origin).host){send(403,{error:'请求来源无效'});return true;}
 const user=auth.identify(req);if(!user){send(401,{error:'请先登录'});return true;}
 if(!store){send(503,{error:'云存档暂不可用，本机进度已保留'});return true;}
 if(req.method==='GET'){send(200,await store.get(user));return true;}
 if(req.method!=='PUT'){send(405,{error:'不支持此请求'});return true;}
 if(req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json')){send(403,{error:'请求来源无效'});return true;}
 let text='',bytes=0;for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>900000){send(413,{error:'存档过大'});return true;}text+=chunk;}
 let data;try{data=JSON.parse(text);if(!Number.isSafeInteger(data.revision)||data.revision<0)throw Error();validate(data.payload);}catch{send(400,{error:'存档格式无效，本机副本已保留'});return true;}
 const result=await store.put(user,data.revision,data.payload);send(result.conflict?409:200,result);
 }catch{send(503,{error:'云存档暂不可用，本机进度已保留'});}return true;
 };};
module.exports.validate=validate;
