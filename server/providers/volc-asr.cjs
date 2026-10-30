'use strict';
const {randomUUID}=require('node:crypto');
// WAV is produced locally: mono 16 kHz, PCM16, at most 30 seconds. No public URL or OSS needed.
module.exports=({apiKey,appId,accessToken},fetcher=fetch)=>async audio=>{
 const headers={'Content-Type':'application/json','X-Api-Resource-Id':'volc.bigasr.auc_turbo','X-Api-Request-Id':randomUUID(),'X-Api-Sequence':'-1'};
 if(apiKey)headers['X-Api-Key']=apiKey;else{headers['X-Api-App-Key']=appId;headers['X-Api-Access-Key']=accessToken;}
 const r=await fetcher('https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash',{method:'POST',headers,signal:AbortSignal.timeout(30000),body:JSON.stringify({user:{uid:'starisle-companion'},audio:{data:audio.toString('base64')},request:{model_name:'bigmodel',enable_itn:true,enable_punc:true}})});
 if(!r.ok||r.headers.get('X-Api-Status-Code')!=='20000000')throw Error('ASR unavailable');const d=await r.json();const text=d.result?.text;if(typeof text!=='string'||!text.trim())throw Object.assign(Error('没有听清，请再说一次，也可以打字'),{status:422});return text.trim().slice(0,1000);
};
