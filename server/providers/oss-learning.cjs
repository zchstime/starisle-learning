module.exports=function(config){
 const OSS=require('ali-oss'),client=new OSS({...config,secure:true,timeout:30000});
 return {async put(key,bytes,type){await client.put(key,bytes,{headers:{'Content-Type':type,'x-oss-object-acl':'private','x-oss-server-side-encryption':'AES256'}});},async get(key){return (await client.get(key)).content;},async delete(key){await client.delete(key);}};
};
