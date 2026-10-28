// Fixed HTTPS endpoint; never log the URL, credential, phone or message.
module.exports=function createSmsbao(config,{fetchImpl=fetch}={}){
 if(!config.username||!config.apiKey||!config.template?.includes('{code}'))throw Error('短信宝账号、API Key 或验证码模板尚未配置');
 if(/\{(?!code\})[^}]+\}/.test(config.template))throw Error('短信模板包含未支持的变量');
 return async({phone,code})=>{
  if(!/^1[3-9]\d{9}$/.test(phone)||!/^\d{6}$/.test(code))throw Error('短信参数格式错误');
  const url=new URL('https://api.smsbao.com/sms');url.search=new URLSearchParams({u:config.username,p:config.apiKey,m:phone,c:config.template.replaceAll('{code}',code)}).toString();
  let response,body;try{response=await fetchImpl(url,{signal:AbortSignal.timeout(10000),redirect:'error'});body=(await response.text()).trim();}catch{throw Error('短信宝连接失败或超时（未自动重试）');}
  if(!response.ok)throw Error('短信宝 HTTP 请求失败');
  if(body!=='0')throw Error('短信宝拒绝请求，返回码：'+(/^\d{1,4}$/.test(body)?body:'未知'));
  return {accepted:true}; // Accepted by provider, not proof of delivery.
 };
};
