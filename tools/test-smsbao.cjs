const assert=require('node:assert/strict'),create=require('../server/providers/smsbao.cjs');
(async()=>{
 const config={username:'test-user',apiKey:'test-key',template:'【测试】您的验证码是{code}'};let seen;
 const send=create(config,{fetchImpl:async(url,opts)=>{seen={url,opts};return{ok:true,text:async()=>'0\n'};}});
 await send({phone:'13800000000',code:'123456'});assert.equal(seen.url.origin,'https://api.smsbao.com');assert.equal(seen.url.searchParams.get('c'),'【测试】您的验证码是123456');assert.equal(seen.opts.redirect,'error');
 for(const body of ['40','41','43','0extra','<html>error</html>'])await assert.rejects(create(config,{fetchImpl:async()=>({ok:true,text:async()=>body})})({phone:'13800000000',code:'123456'}),/拒绝/);
 await assert.rejects(create(config,{fetchImpl:async()=>{throw Error('secret-url')}})({phone:'13800000000',code:'123456'}),e=>!e.message.includes('secret-url'));
 assert.throws(()=>create({...config,template:''}));assert.throws(()=>create({...config,template:'{code}{time}'}));console.log('PASS SMSBao encoding, accepted vs rejected result, redirection protection, sanitized failure, config checks (no SMS sent)');
})().catch(e=>{console.error(e);process.exitCode=1});
