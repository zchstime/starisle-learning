'use strict';
// Volcengine V4 JSON POST signing, compatible with volc-sdk-nodejs Signer.
const crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const hmac=(key,s)=>crypto.createHmac('sha256',key).update(s).digest();
module.exports=function sign({action,body,accessKeyId,secretKey,date=new Date()}){
 const stamp=date.toISOString().replace(/[:-]|\.\d{3}/g,''),day=stamp.slice(0,8),scope=day+'/cn-north-1/rtc/request';
 const payload=JSON.stringify(body),digest=hash(payload),query='Action='+encodeURIComponent(action)+'&Version=2025-06-01';
 const canonical=['POST','/',query,`host:rtc.volcengineapi.com\nx-content-sha256:${digest}\nx-date:${stamp}\n`,'host;x-content-sha256;x-date',digest].join('\n');
 const key=hmac(hmac(hmac(hmac(secretKey,day),'cn-north-1'),'rtc'),'request');
 const signature=hmac(key,['HMAC-SHA256',stamp,scope,hash(canonical)].join('\n')).toString('hex');
 return {'Content-Type':'application/json',Host:'rtc.volcengineapi.com','X-Date':stamp,'X-Content-Sha256':digest,Authorization:`HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=host;x-content-sha256;x-date, Signature=${signature}`};
};
